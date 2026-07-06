# AR Match Catch — VPS Setup & Operations Guide

## Overview

This is a static web app served from **nginx in Docker** on an **Ubuntu VPS** behind **Nginx Proxy Manager** (reverse proxy with Let's Encrypt SSL). Deployments happen automatically on every `git push` via a custom **Node.js webhook** managed by **PM2**.

### Live URL
`https://ar-match.jinnawat.co/`

---

## Architecture (Visual)

```
      Developer pushes code
              │
              ▼
   GitHub: amba5555/ar-match-catch
              │
              │  Webhook fires on push
              ▼
   ┌──────────────────────────────────────────────────┐
   │  VPS: 91.134.141.87 (Ubuntu 24.04)              │
   │  SSH: ssh amba5555@91.134.141.87                 │
   │                                                   │
   │  ┌─ PM2 ──────────────────────────────────────┐  │
   │  │  ar-match-webhook (port 4174)               │  │
   │  │  ~/webhook-server.js                        │  │
   │  │  validates secret → spawns deploy script     │  │
   │  └────────────────────────────────────────────┘  │
   │                                                   │
   │  ┌─ Docker: npm_default network ──────────────┐  │
   │  │                                              │  │
   │  │  npm-app-1 (172.20.0.2)                     │  │
   │  │  Nginx Proxy Manager                        │  │
   │  │  Ports: 80, 81 (admin), 443 (SSL)           │  │
   │  │  SSL: Let's Encrypt                         │  │
   │  │       │                                      │  │
   │  │       │ Proxy: ar-match.jinnawat.co         │  │
   │  │       │   → http://ar-match-catch:80        │  │
   │  │       ▼                                      │  │
   │  │  ar-match-catch (172.20.0.3)               │  │
   │  │  nginx:alpine                               │  │
   │  │  Serving dist/ on :80                       │  │
   │  │  No external ports — internal only          │  │
   │  └──────────────────────────────────────────────┘  │
   └──────────────────────────────────────────────────┘
              │
              │ DNS: Cloudflare
              ▼
   Browser → https://ar-match.jinnawat.co/
```

---

## Files on the VPS

| Path | Role |
|------|------|
| `~/ar-match-catch/` | Git clone of the repo (used for build) |
| `~/ar-match-catch/Dockerfile` | Nginx alpine image, copies `dist/` + `nginx.conf` |
| `~/ar-match-catch/nginx.conf` | Static file server, SPA fallback to `index.html` |
| `~/webhook-server.js` | Custom Node HTTP server on port 4174 |
| `~/deploy-ar-match-catch.sh` | Deploy script (pull → build → docker restart) |
| `/home/ubuntu/npm/` | Nginx Proxy Manager data (proxy hosts, SSL certs) |

---

## The Deploy Pipeline (Step by Step)

### 1. GitHub webhook fires
When code is pushed to `main`, GitHub sends a `POST` to:
```
http://91.134.141.87:4174/deploy
Content-Type: application/json
Body: { "secret": "ar-match-deploy-2026" }
```

### 2. webhook-server.js receives it
A Node.js HTTP server (running via PM2 on port `4174`) validates the secret, then spawns the deploy script:
```js
exec("bash ~/deploy-ar-match-catch.sh", ...);
```

### 3. deploy-ar-match-catch.sh runs
```bash
cd ~/ar-match-catch
git pull origin main        # pull latest code
npm install --silent         # install dependencies
npm run build                # vite build → dist/
docker build -t ar-match-catch .     # build new nginx image
docker rm -f ar-match-catch          # remove old container
docker run -d --name ar-match-catch \ # start new container
  --network npm_default --restart unless-stopped ar-match-catch
```

### 4. Container starts on npm_default network
- The new container joins `npm_default` at `172.20.0.3:80`
- Nginx Proxy Manager already routes `ar-match.jinnawat.co` → `http://ar-match-catch:80`
- The route resolves via Docker's internal DNS — no IP changes needed

### 5. Live immediately
The site updates within ~30 seconds of the push. Zero downtime configuration.

---

## Docker Networking: Why This Works

The `npm_default` network connects the proxy and the app container. Docker's embedded DNS resolves container names to IPs:

```
npm-app-1        →  172.20.0.2
ar-match-catch   →  172.20.0.3
```

Nginx Proxy Manager's proxy host uses the hostname `http://ar-match-catch:80` — so when the container is replaced, NPM resolves the new container automatically. No nginx config reload needed.

---

## Common Operations

### View running containers
```bash
ssh amba5555@91.134.141.87 "docker ps"
```

### View app logs (nginx access log)
```bash
ssh amba5555@91.134.141.87 "docker logs ar-match-catch --tail 50"
```

### View webhook logs
```bash
ssh amba5555@91.134.141.87 "pm2 logs ar-match-webhook --lines 20"
```

### Check webhook status
```bash
ssh amba5555@91.134.141.87 "pm2 status"
```

### Manual redeploy (without git push)
```bash
ssh amba5555@91.134.141.87 "bash ~/deploy-ar-match-catch.sh"
```

### Trigger deploy via curl (manual webhook)
```bash
curl -X POST http://91.134.141.87:4174/deploy \
  -H "Content-Type: application/json" \
  -d '{"secret":"ar-match-deploy-2026"}'
```

### Restart webhook
```bash
ssh amba5555@91.134.141.87 "pm2 restart ar-match-webhook"
```

### Open Nginx Proxy Manager admin UI
```
http://91.134.141.87:81
```

---

## Secret Rotation

To change the webhook secret:

1. On VPS: edit `~/webhook-server.js`, change `SECRET` value
2. Restart webhook: `pm2 restart ar-match-webhook`
3. On GitHub: Repo Settings → Webhooks → Edit → update Secret field
4. Send test webhook on GitHub to confirm

---

## Complete VPS Rebuild (if starting fresh)

```bash
# SSH in
ssh amba5555@91.134.141.87

# Clone repo
git clone https://github.com/amba5555/ar-match-catch.git ~/ar-match-catch

# Build and start app container
cd ~/ar-match-catch
npm install && npm run build
docker build -t ar-match-catch .
docker run -d --name ar-match-catch \
  --network npm_default \
  --restart unless-stopped \
  ar-match-catch

# Start webhook server
pm2 start ~/webhook-server.js --name ar-match-webhook
pm2 save
# Follow the printed command from:
pm2 startup

# Configure Nginx Proxy Manager
# 1. Open http://91.134.141.87:81
# 2. Add Proxy Host:
#    Domain: ar-match.jinnawat.co
#    Forward: http://ar-match-catch:80
#    SSL: Let's Encrypt, Force SSL

# Set up GitHub webhook
# 1. Repo Settings → Webhooks → Add webhook
# 2. Payload URL: http://91.134.141.87:4174/deploy
# 3. Content type: application/json
# 4. Secret: ar-match-deploy-2026
# 5. Events: Just the push event

# DNS (Cloudflare)
# A record: ar-match → 91.134.141.87 (orange cloud / proxied)
```

---

## Development (Local)

```bash
npm install
npm run dev        # Vite dev server on :5173 with HMR
npm run build      # Production build → dist/
npm run preview    # Preview production build on :4173
```

Camera access requires `localhost` or HTTPS — the Vite dev server on `localhost:5173` works fine.

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| App | Vanilla JS + MediaPipe Hand Landmarker + Canvas 2D |
| Build | Vite |
| Container | nginx:alpine (static file server) |
| Reverse Proxy | Nginx Proxy Manager (jc21/nginx-proxy-manager) |
| SSL | Let's Encrypt (via NPM) |
| Process Manager | PM2 (for webhook) |
| Webhook | Custom Node.js HTTP server |
| DNS | Cloudflare |
| VPS OS | Ubuntu 24.04 LTS |
| Git | GitHub (amba5555/ar-match-catch) |

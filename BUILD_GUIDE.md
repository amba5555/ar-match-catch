# AR Match Catch

A standalone browser-based AR educational game for Thai schools. Students use their device camera and MediaPipe hand tracking to catch falling answers.

## Run locally
```bash
npm install
npm run dev
```
Open the Vite URL. Camera access requires `localhost` or HTTPS.

## Build
```bash
npm run build
npm run preview
```
Deploy the `dist/` folder to Vercel, Netlify, GitHub Pages, or any static host.

---

## Production Deployment (VPS)

### Live URL
`https://ar-match.jinnawat.co/`

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Cloudflare DNS                            │
│                   jinnawat.co → 91.134.141.87                    │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                     VPS: 91.134.141.87                            │
│                   Ubuntu 24.04 LTS (Noble)                        │
│                      SSH: amba5555                                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Docker Network: npm_default (172.20.0.0/16)     │ │
│  │                                                              │ │
│  │  ┌──────────────────────────┐  ┌─────────────────────────┐  │ │
│  │  │  npm-app-1 (172.20.0.2) │  │ ar-match-catch (172.20.0.3)│ │
│  │  │  Nginx Proxy Manager     │  │ nginx:alpine             │ │
│  │  │  Ports: 80, 81, 443      │──│ serving dist/ on :80     │ │
│  │  │  Proxy Host:             │  │ (no external port bind)  │ │
│  │  │  ar-match.jinnawat.co    │  └─────────────────────────┘  │ │
│  │  │  → http://172.20.0.3:80 │                                │ │
│  │  │  SSL: Let's Encrypt      │                                │ │
│  │  └──────────────────────────┘                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  PM2: ar-math-webhook (Node.js, port 4174)                  │ │
│  │  Script: ~/webhook-server.js                                │ │
│  │  Secret: ar-math-deploy-2026                                │ │
│  │  Trigger: POST /deploy → bash ~/deploy-ar-match-catch.sh     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### Request Flow
```
Browser → https://ar-match.jinnawat.co/
  → Cloudflare DNS → 91.134.141.87:443
  → npm-app-1 (NPM, SSL terminated)
  → http://172.20.0.3:80 (ar-match-catch nginx container)
  → /usr/share/nginx/html (Vite build dist/)
```

### File Inventory (on VPS)

| Path | Purpose |
|------|---------|
| `~/ar-match-catch/` | Git clone of repo |
| `~/ar-match-catch/Dockerfile` | Nginx alpine, copies `dist/` + `nginx.conf` |
| `~/ar-match-catch/nginx.conf` | Static file server with SPA fallback |
| `~/webhook-server.js` | Node HTTP server on port 4174, listens for GitHub webhook |
| `~/deploy-ar-match-catch.sh` | Deploy script: pull → build → docker rebuild |
| `/home/ubuntu/npm/` | Nginx Proxy Manager data (proxy hosts, SSL certs) |

### SSH
```bash
ssh amba5555@91.134.141.87
```

### Dockerfile (on VPS)
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### nginx.conf (on VPS)
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /questions/ {
        try_files $uri =404;
    }
}
```

### Webhook Server (~/webhook-server.js)
- Node.js `http` server on port **4174**
- Accepts `POST /deploy` with JSON body `{ "secret": "ar-math-deploy-2026" }`
- Managed by **PM2** (process name: `ar-math-webhook`, auto-start, auto-restart)

### Deploy Script (~/deploy-ar-match-catch.sh)
```bash
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 > /dev/null 2>&1
cd ~/ar-match-catch
git pull origin main
npm install --silent
npm run build
docker build -t ar-match-catch .
docker rm -f ar-match-catch 2>/dev/null
docker run -d --name ar-match-catch --network npm_default --restart unless-stopped ar-match-catch
```

### Deploy Sequence (on git push)
1. GitHub webhook sends `POST` to `http://91.134.141.87:4174/deploy`
2. `webhook-server.js` validates secret, spawns `deploy-ar-match-catch.sh`
3. Script: `git pull` → `npm install` → `npm run build` → `docker build` → `docker rm -f && docker run`
4. New container starts on `npm_default` network at `172.20.0.3:80`
5. Nginx Proxy Manager routes `ar-match.jinnawat.co` → new container

### Setup a New VPS (from scratch)

```bash
# 1. Clone repo
git clone https://github.com/amba5555/ar-match-catch.git ~/ar-match-catch

# 2. Create Dockerfile
cat > ~/ar-match-catch/Dockerfile << 'EOF'
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EOF

# 3. Create nginx.conf
cat > ~/ar-match-catch/nginx.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /questions/ {
        try_files $uri =404;
    }
}
EOF

# 4. Build and run app container
cd ~/ar-match-catch
npm install && npm run build
docker build -t ar-match-catch .
docker run -d --name ar-match-catch --network npm_default --restart unless-stopped ar-match-catch

# 5. Start webhook server
pm2 start ~/webhook-server.js --name ar-math-webhook
pm2 save
pm2 startup  # follow the printed command to enable boot auto-start

# 6. Configure Nginx Proxy Manager
#    Web UI: http://91.134.141.87:81
#    Add Proxy Host: ar-match.jinnawat.co → http://ar-match-catch:80
#    Enable SSL (Let's Encrypt), Force SSL

# 7. Set up GitHub webhook
#    Repo Settings → Webhooks → Add
#    Payload URL: http://91.134.141.87:4174/deploy
#    Content type: application/json
#    Secret: ar-math-deploy-2026
#    Events: Just the push event

# 8. DNS (Cloudflare)
#    A record: ar-match → 91.134.141.87 (proxied)

## Features
- MediaPipe Tasks Vision Hand Landmarker
- Canvas 2D camera rendering, landmarks, falling answer objects, collision
- JSON question banks for Math, Thai vocabulary, and Science
- Teacher page for editing/import/export/local saving
- AI prompt generator for question creation
- Score, lives, timer, combo, level progression, particles, sound effects
- PWA manifest and service worker offline cache
- Thai UI and Noto Sans Thai font

## Question format
```json
{
  "subject": "Mathematics",
  "grade": "1",
  "category": "addition",
  "questions": [{
    "id": "add_001",
    "text": "2 + 3 = ?",
    "answer": 5,
    "options": [5, 4, 6, 3],
    "hint": "Count forward from 2",
    "difficulty": "easy"
  }]
}
```

## Performance notes
- Max active falling objects is limited dynamically.
- MediaPipe uses VIDEO mode and GPU delegate where supported.
- Collision uses index finger tip and palm landmarks for both hands.

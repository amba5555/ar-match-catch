#!/bin/bash
set -e
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 > /dev/null 2>&1
cd "$(dirname "$0")/.."
git pull origin main
npm install --silent
npm run build
docker build -t ar-match-catch .
docker rm -f ar-match-catch 2>/dev/null
docker run -d --name ar-match-catch --network npm_default --network-alias ar-math-catch --restart unless-stopped ar-match-catch
echo "Deploy done: $(date)"

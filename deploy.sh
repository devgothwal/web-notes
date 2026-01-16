#!/bin/bash
# =====================================================
# Web Notes - Deploy Script
# Syncs code from dev to production and rebuilds
# Run from anywhere: webnotes-deploy
# =====================================================

set -e

DEV_DIR="$HOME/Desktop/Web Notes"
PROD_DIR="/opt/webnotes"

echo "🚀 Deploying Web Notes..."
echo ""

# Step 1: Sync files (excluding venv, .git, __pycache__)
echo "📦 Syncing files from dev to production..."
sudo rsync -av --delete \
    --exclude 'venv/' \
    --exclude '.git/' \
    --exclude '__pycache__/' \
    --exclude '*.pyc' \
    --exclude '.env' \
    "$DEV_DIR/" "$PROD_DIR/"

# Step 2: Rebuild and restart container
echo ""
echo "🔨 Rebuilding Docker container..."
cd "$PROD_DIR"
sudo docker compose --profile prod up -d --build

# Step 3: Show status
echo ""
echo "✅ Deployment complete!"
echo ""
sudo docker ps --filter "name=webnotes" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "🌐 Access at: http://100.121.166.123:8888/"

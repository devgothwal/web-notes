---
description: Web Notes - Development and deployment workflow
---

# Web Notes Project

A notes-taking web app with calendar navigation, multiple notes per day, and cross-browser sync.

## Quick Commands

| Command | Description |
|---------|-------------|
| `webnotes-dev` | Start dev server (port 8889, hot reload) |
| `webnotes-deploy` | Deploy to production (port 8888) |

## URLs

| Environment | URL |
|-------------|-----|
| Development | http://100.121.166.123:8889/ |
| Production | http://100.121.166.123:8888/ |

## Development Workflow

```bash
# 1. Start dev server
webnotes-dev

# 2. Edit files in ~/Desktop/Web Notes/
#    Changes appear instantly (hot reload)

# 3. When ready, deploy to production
webnotes-deploy
```

## Project Structure

```
~/Desktop/Web Notes/     ← Development (edit here)
├── index.html           ← Main HTML
├── styles/main.css      ← Styling (light/dark themes)
├── scripts/
│   ├── app.js           ← Main controller
│   ├── calendar.js      ← Calendar component
│   └── editor.js        ← Rich text editor + API
├── backend/
│   └── app.py           ← FastAPI + SQLite
├── dev.sh               ← Dev server script
├── deploy.sh            ← Deploy script
├── Dockerfile           ← Production container
├── Dockerfile.dev       ← Dev container
└── docker-compose.yml   ← Container orchestration

/opt/webnotes/           ← Production (auto-deployed)
```

## Key Features

- **Multiple notes per day** with titles
- **Cross-browser sync** via SQLite backend
- **Light theme default** (dark mode available)
- **Hot reload** for development
- **24/7 available** even without login (Docker in /opt)
- **Auto-deploy** with single command

## Database

- **Dev:** `/var/opt/webnotes/notes.db`
- **Prod (Docker):** Docker volume `webnotes-data`

## Tech Stack

- Frontend: Vanilla HTML/CSS/JS
- Backend: FastAPI + SQLite
- Deployment: Docker + docker-compose
- Server: Uvicorn

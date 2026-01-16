# Architecture Documentation

## Overview

Web Notes is a full-stack notes application with a FastAPI backend and vanilla JavaScript frontend.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Calendar   │  │    Editor    │  │   Notes List  │  │
│  │  Component  │  │   Component  │  │   Component   │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼────────────────┼──────────────────┼──────────┘
          │                │                  │
          └────────────────┼──────────────────┘
                           │ REST API
          ┌────────────────▼────────────────┐
          │         FastAPI Backend         │
          │           (Uvicorn)             │
          │  ┌──────────────────────────┐  │
          │  │     CRUD Endpoints       │  │
          │  │  GET/POST/PUT/DELETE     │  │
          │  └────────────┬─────────────┘  │
          └───────────────┼────────────────┘
                          │
          ┌───────────────▼────────────────┐
          │          SQLite DB             │
          │   /data/notes.db (Docker)      │
          └────────────────────────────────┘
```

## Components

### Frontend

| Component | File | Purpose |
|-----------|------|---------|
| App Controller | `scripts/app.js` | Coordinates components, handles theme |
| Calendar | `scripts/calendar.js` | Date navigation, month view |
| Editor | `scripts/editor.js` | Rich text, autosave, API calls |

### Backend

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/notes/{date}` | GET | Get all notes for a date |
| `/api/notes` | POST | Create new note |
| `/api/notes/{id}` | PUT | Update note |
| `/api/notes/{id}` | DELETE | Delete note |
| `/api/dates` | GET | Get dates with notes |

## Data Flow

```
1. User selects date in Calendar
   └─► Calendar calls editor.loadDate(date)

2. Editor fetches notes from API
   └─► GET /api/notes/2026-01-16
   └─► Renders notes list in sidebar

3. User edits note content
   └─► Autosave triggers after 1 second
   └─► PUT /api/notes/{id} or POST /api/notes

4. Calendar refreshes to show dots on dates with notes
   └─► GET /api/dates
```

## Database Schema

```sql
CREATE TABLE notes (
    id TEXT PRIMARY KEY,           -- Random ID (e.g., "mkh0cz9ha8yhj")
    date_key TEXT NOT NULL,        -- "2026-01-16"
    title TEXT DEFAULT '',         -- "My Note Title"
    content TEXT DEFAULT '',       -- HTML content
    created_at TEXT NOT NULL,      -- ISO timestamp
    updated_at TEXT NOT NULL       -- ISO timestamp
);

CREATE INDEX idx_notes_date ON notes(date_key);
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│           /opt/webnotes/                │
│  (Non-encrypted, survives without login)│
└───────────────────┬─────────────────────┘
                    │
         ┌──────────▼──────────┐
         │   Docker Container  │
         │   webnotes-prod     │
         │   Port 8888         │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   Docker Volume     │
         │   webnotes-data     │
         │   (Persistent DB)   │
         └─────────────────────┘
```

## Styling Architecture

### Theme System

```css
:root {
    /* Light theme (default) */
    --bg-primary: #f5f5f5;
    --text-primary: #1a1a1a;
}

[data-theme="dark"] {
    /* Dark theme override */
    --bg-primary: #1e222d;
    --text-primary: #e0e0e0;
}
```

## Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Location | `~/Desktop/Web Notes` | `/opt/webnotes` |
| Command | `webnotes-dev` | `webnotes-deploy` |
| Port | 8889 | 8888 |
| Hot Reload | ✅ Yes | ❌ No |
| Requires Login | ✅ Yes | ❌ No |

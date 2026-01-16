"""
Web Notes - FastAPI Backend
SQLite-based storage for cross-browser note synchronization
"""

import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional
from contextlib import contextmanager

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Configuration - Support Docker and local environments
DB_PATH = Path(os.environ.get('WEBNOTES_DB_PATH', '/var/opt/webnotes/notes.db'))
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

STATIC_DIR = Path(__file__).parent.parent  # Parent directory (Web Notes/)

app = FastAPI(title="Web Notes API", version="1.0.0")


# =================== Database Setup ===================

def init_db():
    """Initialize the database schema"""
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                date_key TEXT NOT NULL,
                title TEXT DEFAULT '',
                content TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date_key)")
        conn.commit()


@contextmanager
def get_db():
    """Get database connection with context manager"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


# =================== Pydantic Models ===================

class NoteCreate(BaseModel):
    id: str
    date_key: str
    title: str = ""
    content: str = ""
    created_at: str
    updated_at: str


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    updated_at: str


class Note(BaseModel):
    id: str
    date_key: str
    title: str
    content: str
    created_at: str
    updated_at: str


# =================== API Endpoints ===================

@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    init_db()
    print(f"Database initialized at {DB_PATH}")


@app.get("/api/notes/{date_key}")
async def get_notes_by_date(date_key: str):
    """Get all notes for a specific date"""
    with get_db() as conn:
        cursor = conn.execute(
            "SELECT * FROM notes WHERE date_key = ? ORDER BY created_at DESC",
            (date_key,)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


@app.get("/api/dates")
async def get_dates_with_notes():
    """Get all dates that have notes"""
    with get_db() as conn:
        cursor = conn.execute(
            "SELECT DISTINCT date_key FROM notes ORDER BY date_key DESC"
        )
        rows = cursor.fetchall()
        return [row["date_key"] for row in rows]


@app.post("/api/notes")
async def create_note(note: NoteCreate):
    """Create a new note"""
    with get_db() as conn:
        try:
            conn.execute(
                """INSERT INTO notes (id, date_key, title, content, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (note.id, note.date_key, note.title, note.content, 
                 note.created_at, note.updated_at)
            )
            conn.commit()
            return {"status": "created", "id": note.id}
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail="Note with this ID already exists")


@app.put("/api/notes/{note_id}")
async def update_note(note_id: str, update: NoteUpdate):
    """Update an existing note"""
    with get_db() as conn:
        # Build update query dynamically
        updates = []
        values = []
        
        if update.title is not None:
            updates.append("title = ?")
            values.append(update.title)
        if update.content is not None:
            updates.append("content = ?")
            values.append(update.content)
        
        updates.append("updated_at = ?")
        values.append(update.updated_at)
        values.append(note_id)
        
        query = f"UPDATE notes SET {', '.join(updates)} WHERE id = ?"
        cursor = conn.execute(query, values)
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Note not found")
        
        return {"status": "updated", "id": note_id}


@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: str):
    """Delete a note"""
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Note not found")
        
        return {"status": "deleted", "id": note_id}


# =================== Static Files ===================

# Serve index.html for root
@app.get("/")
async def serve_index():
    return FileResponse(STATIC_DIR / "index.html")


# Serve favicon
@app.get("/favicon.svg")
async def serve_favicon():
    return FileResponse(STATIC_DIR / "favicon.svg", media_type="image/svg+xml")


# Mount static directories (only if they exist)
def mount_if_exists(path: str, directory: Path, name: str):
    """Mount a static directory only if it exists"""
    if directory.exists():
        app.mount(path, StaticFiles(directory=directory), name=name)

mount_if_exists("/styles", STATIC_DIR / "styles", "styles")
mount_if_exists("/scripts", STATIC_DIR / "scripts", "scripts")
mount_if_exists("/screenshots", STATIC_DIR / "screenshots", "screenshots")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)

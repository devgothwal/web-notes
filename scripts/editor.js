/**
 * Editor Component - API-backed Version
 * Uses FastAPI backend for cross-browser sync
 */

class Editor {
    constructor(options = {}) {
        this.editor = document.getElementById('editor');
        this.titleInput = document.getElementById('note-title');
        this.dateDisplay = document.getElementById('current-date-display');
        this.wordCountEl = document.getElementById('word-count');
        this.charCountEl = document.getElementById('char-count');
        this.saveStatusEl = document.getElementById('save-status');
        this.notesListEl = document.getElementById('notes-list');
        this.notesCountEl = document.getElementById('notes-count');
        this.notesListDateEl = document.getElementById('notes-list-date');

        this.currentDateKey = null;
        this.currentNoteId = null;
        this.notes = [];
        this.saveTimeout = null;
        this.lastSaved = null;
        this.isSaving = false;

        this.onContentChange = options.onContentChange || (() => { });

        this.init();
    }

    init() {
        this.setupToolbar();

        this.editor.addEventListener('input', () => this.handleInput());
        this.editor.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.editor.addEventListener('paste', (e) => this.handlePaste(e));

        this.titleInput.addEventListener('input', () => this.scheduleAutosave());

        document.getElementById('text-color').addEventListener('input', (e) => {
            document.execCommand('foreColor', false, e.target.value);
            this.editor.focus();
        });

        document.getElementById('highlight-color').addEventListener('input', (e) => {
            document.execCommand('hiliteColor', false, e.target.value);
            this.editor.focus();
        });
    }

    setupToolbar() {
        document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.dataset.command;
                const value = btn.dataset.value;

                if (command === 'checkbox') {
                    this.insertCheckbox();
                } else if (command === 'formatBlock') {
                    document.execCommand(command, false, `<${value}>`);
                } else {
                    document.execCommand(command, false, value || null);
                }

                this.editor.focus();
            });
        });
    }

    insertCheckbox() {
        const checkbox = document.createElement('div');
        checkbox.className = 'checkbox-item';
        checkbox.innerHTML = `
            <input type="checkbox" onchange="this.parentElement.classList.toggle('checked', this.checked)">
            <span contenteditable="true">New task</span>
        `;

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(checkbox);

            const span = checkbox.querySelector('span');
            range.selectNodeContents(span);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            this.editor.appendChild(checkbox);
        }

        this.scheduleAutosave();
    }

    handleInput() {
        this.updateWordCount();
        this.scheduleAutosave();
        this.onContentChange();
    }

    handleKeydown(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    document.execCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    document.execCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    document.execCommand('underline');
                    break;
                case 's':
                    e.preventDefault();
                    this.saveNow();
                    break;
            }
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
        }
    }

    handlePaste(e) {
        e.preventDefault();
        const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
        const temp = document.createElement('div');
        temp.innerHTML = text;
        temp.querySelectorAll('script, style').forEach(el => el.remove());
        document.execCommand('insertHTML', false, temp.innerHTML);
    }

    updateWordCount() {
        const text = this.editor.innerText || '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;

        this.wordCountEl.textContent = `Words: ${words}`;
        this.charCountEl.textContent = `Characters: ${chars}`;
    }

    scheduleAutosave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => {
            this.saveNow();
        }, 1000);
    }

    generateNoteId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    async saveNow() {
        if (!this.currentDateKey || !this.currentNoteId || this.isSaving) return;

        this.isSaving = true;
        const content = this.editor.innerHTML;
        const title = this.titleInput.value.trim() || 'Untitled Note';
        const updatedAt = new Date().toISOString();

        // Find and update local state
        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        if (noteIndex >= 0) {
            this.notes[noteIndex].title = title;
            this.notes[noteIndex].content = content;
            this.notes[noteIndex].updated_at = updatedAt;
        }

        try {
            // Check if note exists in DB
            const existingNote = noteIndex >= 0 && this.notes[noteIndex]._persisted;

            if (existingNote) {
                // Update existing note
                await fetch(`/api/notes/${this.currentNoteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content, updated_at: updatedAt })
                });
            } else {
                // Create new note
                const note = this.notes[noteIndex];
                await fetch('/api/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: note.id,
                        date_key: this.currentDateKey,
                        title: title,
                        content: content,
                        created_at: note.created_at,
                        updated_at: updatedAt
                    })
                });
                // Mark as persisted
                if (noteIndex >= 0) {
                    this.notes[noteIndex]._persisted = true;
                }
            }

            this.lastSaved = new Date();
            this.updateSaveStatus();
            this.renderNotesList();

        } catch (error) {
            console.error('Save failed:', error);
            this.saveStatusEl.textContent = 'Save failed!';
            this.saveStatusEl.style.color = 'var(--accent-danger)';
        }

        this.isSaving = false;
    }

    updateSaveStatus() {
        if (this.lastSaved) {
            const time = this.lastSaved.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            this.saveStatusEl.textContent = `Synced: ${time}`;
            this.saveStatusEl.style.color = 'var(--accent-success)';
        }
    }

    async loadDate(date) {
        // Save current content first
        if (this.currentDateKey && this.currentNoteId) {
            await this.saveNow();
        }

        // Format date key
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        this.currentDateKey = `${year}-${month}-${day}`;

        // Update date display
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.dateDisplay.textContent = date.toLocaleDateString('en-US', options);

        // Update notes list header
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            this.notesListDateEl.textContent = "Today's Notes";
        } else {
            this.notesListDateEl.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        // Load notes from API
        try {
            const response = await fetch(`/api/notes/${this.currentDateKey}`);
            const data = await response.json();
            this.notes = data.map(n => ({ ...n, _persisted: true }));
        } catch (error) {
            console.error('Failed to load notes:', error);
            this.notes = [];
        }

        // Render notes list
        this.renderNotesList();

        // Select first note or create new one
        if (this.notes.length > 0) {
            this.selectNote(this.notes[0].id);
        } else {
            this.createNewNote(false);
        }
    }

    renderNotesList() {
        this.notesCountEl.textContent = this.notes.length;

        if (this.notes.length === 0) {
            this.notesListEl.innerHTML = '<div class="notes-empty">No notes for this day</div>';
            return;
        }

        let html = '';
        for (const note of this.notes) {
            const isActive = note.id === this.currentNoteId;
            const time = new Date(note.updated_at || note.created_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            html += `
                <div class="note-item ${isActive ? 'active' : ''}" data-note-id="${note.id}">
                    <span class="note-item-icon">📄</span>
                    <div class="note-item-content">
                        <div class="note-item-title">${this.escapeHtml(note.title || 'Untitled')}</div>
                        <div class="note-item-time">${time}</div>
                    </div>
                </div>
            `;
        }

        this.notesListEl.innerHTML = html;

        this.notesListEl.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = item.dataset.noteId;
                if (noteId !== this.currentNoteId) {
                    this.saveNow();
                    this.selectNote(noteId);
                }
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    selectNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        this.currentNoteId = noteId;
        this.titleInput.value = note.title || '';
        this.editor.innerHTML = note.content || '';

        this.updateWordCount();
        this.renderNotesList();

        this.lastSaved = null;
        this.saveStatusEl.textContent = 'Loaded';

        this.editor.focus();
    }

    createNewNote(focus = true) {
        if (this.currentNoteId) {
            this.saveNow();
        }

        const newNote = {
            id: this.generateNoteId(),
            date_key: this.currentDateKey,
            title: '',
            content: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            _persisted: false
        };

        this.notes.unshift(newNote);
        this.currentNoteId = newNote.id;

        this.titleInput.value = '';
        this.editor.innerHTML = '';

        this.updateWordCount();
        this.renderNotesList();

        this.lastSaved = null;
        this.saveStatusEl.textContent = 'New note';

        if (focus) {
            this.titleInput.focus();
        }
    }

    async deleteCurrentNote() {
        if (!this.currentNoteId) return;

        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        if (noteIndex < 0) return;

        const noteTitle = this.notes[noteIndex].title || 'this note';
        if (!confirm(`Delete "${noteTitle}"?`)) return;

        // Delete from server if persisted
        if (this.notes[noteIndex]._persisted) {
            try {
                await fetch(`/api/notes/${this.currentNoteId}`, { method: 'DELETE' });
            } catch (error) {
                console.error('Failed to delete:', error);
            }
        }

        this.notes.splice(noteIndex, 1);

        if (this.notes.length > 0) {
            this.selectNote(this.notes[0].id);
        } else {
            this.createNewNote(false);
        }

        this.onContentChange();
    }

    async getNoteDates() {
        try {
            const response = await fetch('/api/dates');
            return await response.json();
        } catch (error) {
            console.error('Failed to get dates:', error);
            return [];
        }
    }

    getContent() {
        return this.editor.innerHTML;
    }

    getPlainText() {
        return this.editor.innerText;
    }

    clear() {
        this.editor.innerHTML = '';
        this.titleInput.value = '';
        this.updateWordCount();
    }
}

window.Editor = Editor;

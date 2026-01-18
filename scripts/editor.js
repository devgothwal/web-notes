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
        // Use CSS for styling (better for spans/backgrounds)
        document.execCommand('styleWithCSS', false, true);

        this.editor.addEventListener('input', () => this.handleInput());
        this.editor.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.editor.addEventListener('paste', (e) => this.handlePaste(e));

        // Update toolbar active states
        this.editor.addEventListener('keyup', () => this.updateToolbarState());
        this.editor.addEventListener('mouseup', () => this.updateToolbarState());

        this.titleInput.addEventListener('input', () => this.scheduleAutosave());

        // Press Enter in title to move to editor
        this.titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.editor.focus();
            }
        });

        // Color Toggle Logic
        const initColorDropdown = (btnId, dropdownId, command, iconSelector) => {
            const btn = document.getElementById(btnId);
            const dropdown = document.getElementById(dropdownId);

            // Toggle Dropdown OR Toggle Highlight (if active)
            btn.addEventListener('click', (e) => {
                e.stopPropagation();

                // Special Logic for Highlighter: If active, turn OFF
                if (dropdownId === 'dropdown-highlight') {
                    // Check logic state OR visual state (more reliable for user expectation)
                    const backColor = document.queryCommandValue('backColor');
                    const isLogicActive = backColor &&
                        backColor !== 'transparent' &&
                        backColor !== 'rgba(0, 0, 0, 0)' &&
                        backColor !== 'rgb(255, 255, 255)';

                    if (isLogicActive || btn.classList.contains('active')) {
                        // Turn OFF Highlight
                        this.editor.focus(); // Ensure focus matches selection

                        const sel = window.getSelection();
                        if (sel.rangeCount > 0) {
                            const range = sel.getRangeAt(0);

                            // BREAKOUT Logic for Cursor (Collapsed Selection)
                            if (range.collapsed) {
                                // Insert a "stopper" span to break the style inheritance
                                // Using ZWSP (Zero Width Space)
                                document.execCommand('insertHTML', false, '<span style="background-color: transparent">&#8203;</span>');
                            } else {
                                // Normal Unhighlight for selection
                                document.execCommand('hiliteColor', false, 'transparent');
                            }

                            btn.classList.remove('active');
                            dropdown.classList.remove('show');
                            return;
                        }
                    }
                }

                // Normal behavior: Open Dropdown
                // Close others
                document.querySelectorAll('.color-dropdown').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });

                const isOpen = dropdown.classList.toggle('show');
                if (isOpen) {
                    // Save selection when opening
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        this.savedRange = sel.getRangeAt(0);
                    }
                }
            });

            // Handle Color Selection
            dropdown.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') {
                    e.stopPropagation();
                    const color = e.target.dataset.color;

                    // Restore Selection
                    this.editor.focus();
                    if (this.savedRange) {
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(this.savedRange);
                    }

                    // Execute Command
                    document.execCommand(command, false, color);

                    // Update Icon Color
                    const icon = btn.querySelector('svg');
                    if (icon) icon.style.color = color;

                    // Close Dropdown
                    dropdown.classList.remove('show');

                    // Save new position
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        this.savedRange = sel.getRangeAt(0);
                    }
                }
            });
        };

        initColorDropdown('btn-text-color', 'dropdown-text', 'foreColor');
        initColorDropdown('btn-highlight-color', 'dropdown-highlight', 'hiliteColor');

        // Font Controls
        const fontFamilySelect = document.getElementById('font-family');
        const fontSizeSelect = document.getElementById('font-size');

        fontFamilySelect.addEventListener('change', (e) => {
            this.editor.style.fontFamily = e.target.value;
            this.editor.focus();
        });

        fontSizeSelect.addEventListener('change', (e) => {
            const size = e.target.value;

            // Save selection before focus might change
            const sel = window.getSelection();
            let savedRange = null;
            if (sel.rangeCount > 0) {
                savedRange = sel.getRangeAt(0).cloneRange();
            }

            this.editor.focus();

            // Restore selection
            if (savedRange) {
                sel.removeAllRanges();
                sel.addRange(savedRange);
            }

            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);

                if (range.collapsed) {
                    // Caret only: Insert span with new size and place cursor inside
                    const sizeSpan = document.createElement('span');
                    sizeSpan.style.fontSize = size;
                    sizeSpan.innerHTML = '&#8203;'; // ZWSP
                    range.insertNode(sizeSpan);

                    // Move cursor INSIDE the span
                    range.setStart(sizeSpan.firstChild, 1);
                    range.setEnd(sizeSpan.firstChild, 1);
                    sel.removeAllRanges();
                    sel.addRange(range);
                } else {
                    // Selected text: Wrap in span with new size
                    const selectedText = range.extractContents();
                    const wrapper = document.createElement('span');
                    wrapper.style.fontSize = size;
                    wrapper.appendChild(selectedText);
                    range.insertNode(wrapper);

                    // Re-select the wrapped content
                    sel.removeAllRanges();
                    const newRange = document.createRange();
                    newRange.selectNodeContents(wrapper);
                    sel.addRange(newRange);
                }
            }

            this.scheduleAutosave();
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.color-dropdown').forEach(d => d.classList.remove('show'));
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
                    // Use font size for headings to allow inline/selection styling
                    const targetSize = value === 'h1' ? '6' : (value === 'h2' ? '5' : '3');
                    const currentSize = document.queryCommandValue('fontSize');

                    // Toggle: If already this size, reset to normal (3), else apply size
                    if (currentSize === targetSize) {
                        document.execCommand('fontSize', false, '3');
                    } else {
                        document.execCommand('fontSize', false, targetSize);
                    }
                } else {
                    document.execCommand(command, false, value || null);
                }

                this.editor.focus();
                // Check state immediately after command
                setTimeout(() => this.updateToolbarState(), 0);
            });
        });
    }

    updateToolbarState() {
        // Only update if editor is focused
        if (document.activeElement !== this.editor) return;

        document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
            const command = btn.dataset.command;
            const value = btn.dataset.value;
            let isActive = false;

            if (command === 'formatBlock') {
                const currentSize = document.queryCommandValue('fontSize');
                // HTML font size 6 = H1, 5 = H2, 3 = Normal (default)
                const targetSize = value === 'h1' ? '6' : (value === 'h2' ? '5' : '3');
                isActive = (currentSize === targetSize);
            } else if (['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList'].includes(command)) {
                isActive = document.queryCommandState(command);
            }

            if (isActive) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Check Highlight active state
        const highlightBtn = document.getElementById('btn-highlight-color');
        if (highlightBtn) {
            // 'backColor' is the standard for background color
            const backColor = document.queryCommandValue('backColor');
            // Check if it's set and not transparent/white/inherited
            const isHighlightActive = backColor &&
                backColor !== 'transparent' &&
                backColor !== 'rgba(0, 0, 0, 0)' &&
                backColor !== 'rgb(255, 255, 255)'; // Assuming white is default

            if (isHighlightActive) highlightBtn.classList.add('active');
            else highlightBtn.classList.remove('active');
        }

        // Check Text Color active state (Optional, but consistent)
        const colorBtn = document.getElementById('btn-text-color');
        if (colorBtn) {
            const foreColor = document.queryCommandValue('foreColor');
            // Default usually black or rgb(0,0,0) or user theme
            // It's harder to define "active" for text color, usually strictly "not default"
            // But usually we just show the color on the icon (already done).
            // User specifically asked for highlighter light up.
            // I'll ignore text color 'active' background state unless requested, to avoid noise.
            // Actually user said "fix the text colour and higlight clour".
            // Let's do highlight first as explicitly requested.
        }
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

        if (e.key === 'Enter') {
            // Check if we are inside a checkbox
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                let node = selection.getRangeAt(0).commonAncestorContainer;
                while (node && node !== this.editor) {
                    // Check if we are in a checkbox container
                    if (node.nodeType === 1 && node.classList.contains('checkbox-item')) {
                        // VALIDATION: Does it start with a checkbox input?
                        const hasCheckbox = node.querySelector('input[type="checkbox"]');

                        // If it's a "Ghost" checkbox (class exists but no input), sanitize it
                        if (!hasCheckbox) {
                            node.classList.remove('checkbox-item');
                            // Fallback to normal behavior (break loop)
                            break;
                        }

                        e.preventDefault();

                        // Check if current checkbox text is empty (Break out of list)
                        const currentSpan = node.querySelector('span');
                        const isEmpty = !currentSpan || currentSpan.innerText.trim() === ''; // Robust empty check

                        if (isEmpty) {
                            // Break out: Create standard text block
                            const newBlock = document.createElement('div');
                            newBlock.innerHTML = '<br>';

                            if (node.nextSibling) {
                                node.parentNode.insertBefore(newBlock, node.nextSibling);
                            } else {
                                node.parentNode.appendChild(newBlock);
                            }

                            node.remove(); // Remove empty checkbox item

                            // Focus new block
                            const range = document.createRange();
                            range.selectNodeContents(newBlock);
                            range.collapse(true);
                            const sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(range);
                            return;
                        }

                        // Continue list: Create new checkbox
                        const newCheckbox = document.createElement('div');
                        newCheckbox.className = 'checkbox-item';
                        newCheckbox.innerHTML = `
                            <input type="checkbox" onchange="this.parentElement.classList.toggle('checked', this.checked)">
                            <span contenteditable="true"></span>
                        `;

                        if (node.nextSibling) {
                            node.parentNode.insertBefore(newCheckbox, node.nextSibling);
                        } else {
                            node.parentNode.appendChild(newCheckbox);
                        }

                        // Focus new checkbox properly
                        setTimeout(() => {
                            const span = newCheckbox.querySelector('span');
                            span.focus();
                            const range = document.createRange();
                            range.selectNodeContents(span);
                            range.collapse(false);
                            const sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }, 0);
                        return;
                    }
                    node = node.parentNode;
                }
            }

            // Normal Enter: Reset to normal font size on new line
            setTimeout(() => {
                document.execCommand('fontSize', false, '3');
            }, 0);
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

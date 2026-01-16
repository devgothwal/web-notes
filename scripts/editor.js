/**
 * Editor Component
 * Handles rich text formatting, autosave, and word counting
 */

class Editor {
    constructor(options = {}) {
        this.editor = document.getElementById('editor');
        this.dateDisplay = document.getElementById('current-date-display');
        this.wordCountEl = document.getElementById('word-count');
        this.charCountEl = document.getElementById('char-count');
        this.saveStatusEl = document.getElementById('save-status');

        this.storagePrefix = 'webnotes_';
        this.currentDateKey = null;
        this.saveTimeout = null;
        this.lastSaved = null;

        this.onContentChange = options.onContentChange || (() => { });

        this.init();
    }

    init() {
        // Set up toolbar buttons
        this.setupToolbar();

        // Set up editor events
        this.editor.addEventListener('input', () => this.handleInput());
        this.editor.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.editor.addEventListener('paste', (e) => this.handlePaste(e));

        // Set up color pickers
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

            // Move cursor to the span
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
        // Handle keyboard shortcuts
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

        // Handle Tab for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
        }
    }

    handlePaste(e) {
        // Clean up pasted content to avoid weird formatting
        e.preventDefault();
        const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');

        // Create a temporary element to clean the HTML
        const temp = document.createElement('div');
        temp.innerHTML = text;

        // Remove scripts and styles
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
        }, 1000); // Save after 1 second of inactivity
    }

    saveNow() {
        if (!this.currentDateKey) return;

        const content = this.editor.innerHTML;
        const key = this.storagePrefix + this.currentDateKey;

        try {
            if (content.trim() && content !== '<br>') {
                localStorage.setItem(key, content);
            } else {
                localStorage.removeItem(key);
            }

            this.lastSaved = new Date();
            this.updateSaveStatus();
        } catch (e) {
            console.error('Failed to save:', e);
            this.saveStatusEl.textContent = 'Save failed!';
            this.saveStatusEl.style.color = 'var(--accent-danger)';
        }
    }

    updateSaveStatus() {
        if (this.lastSaved) {
            const time = this.lastSaved.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            this.saveStatusEl.textContent = `Autosaved: ${time}`;
            this.saveStatusEl.style.color = 'var(--accent-success)';
        }
    }

    loadDate(date) {
        // Save current content first
        if (this.currentDateKey) {
            this.saveNow();
        }

        // Format date key
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        this.currentDateKey = `${year}-${month}-${day}`;

        // Update date display
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.dateDisplay.textContent = date.toLocaleDateString('en-US', options);

        // Load content
        const key = this.storagePrefix + this.currentDateKey;
        const content = localStorage.getItem(key);

        if (content) {
            this.editor.innerHTML = content;
        } else {
            this.editor.innerHTML = '';
        }

        // Update word count
        this.updateWordCount();

        // Reset save status
        this.lastSaved = null;
        this.saveStatusEl.textContent = content ? 'Loaded' : 'New note';

        // Focus editor
        this.editor.focus();
    }

    getNoteDates() {
        const dates = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.storagePrefix)) {
                const dateKey = key.replace(this.storagePrefix, '');
                // Only include date keys (YYYY-MM-DD format)
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                    dates.push(dateKey);
                }
            }
        }
        return dates;
    }

    getContent() {
        return this.editor.innerHTML;
    }

    getPlainText() {
        return this.editor.innerText;
    }

    clear() {
        this.editor.innerHTML = '';
        this.updateWordCount();
    }
}

// Export for use in app.js
window.Editor = Editor;

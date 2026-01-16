/**
 * Web Notes App - Main Controller
 * Coordinates between Calendar and Editor components
 */

class WebNotesApp {
    constructor() {
        this.editor = null;
        this.calendar = null;

        this.init();
    }

    init() {
        // Initialize Editor
        this.editor = new Editor({
            onContentChange: () => this.calendar.refresh()
        });

        // Initialize Calendar
        this.calendar = new Calendar({
            onDateSelect: (date) => this.editor.loadDate(date),
            getNoteDates: () => this.editor.getNoteDates()
        });

        // Load today's notes
        this.editor.loadDate(new Date());

        // Set up header buttons
        this.setupHeaderButtons();

        // Set up theme
        this.initTheme();

        console.log('Web Notes initialized');
    }

    setupHeaderButtons() {
        // New Note button
        document.getElementById('btn-new-note').addEventListener('click', () => {
            this.editor.createNewNote();
        });

        // Save button
        document.getElementById('btn-save').addEventListener('click', () => {
            this.downloadNote();
        });

        // Print button
        document.getElementById('btn-print').addEventListener('click', () => {
            window.print();
        });

        // Theme toggle
        document.getElementById('btn-theme').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Delete button
        document.getElementById('btn-delete-note').addEventListener('click', () => {
            this.editor.deleteCurrentNote();
        });
    }

    initTheme() {
        // Light is now default - check if user previously set dark
        const savedTheme = localStorage.getItem('webnotes_theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        // Don't set anything for light - it's the default in CSS
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';

        if (next === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.removeItem('webnotes_theme');
        } else {
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('webnotes_theme', next);
        }
    }

    downloadNote() {
        const title = document.getElementById('note-title').value || 'Untitled Note';
        const content = this.editor.getPlainText();
        const dateDisplay = document.getElementById('current-date-display').textContent;

        // Create blob
        const blob = new Blob([`${title}\n${dateDisplay}\n\n${content}`], { type: 'text/plain' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_${this.editor.currentDateKey}.txt`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WebNotesApp();
});

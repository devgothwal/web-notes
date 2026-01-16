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
    }

    initTheme() {
        const savedTheme = localStorage.getItem('webnotes_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcons(savedTheme);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('webnotes_theme', next);
        this.updateThemeIcons(next);
    }

    updateThemeIcons(theme) {
        const moonIcon = document.querySelector('.icon-moon');
        const sunIcon = document.querySelector('.icon-sun');

        if (theme === 'light') {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
    }

    downloadNote() {
        const content = this.editor.getPlainText();
        const dateDisplay = document.getElementById('current-date-display').textContent;

        // Create blob
        const blob = new Blob([`${dateDisplay}\n\n${content}`], { type: 'text/plain' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes_${this.editor.currentDateKey}.txt`;

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

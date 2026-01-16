/**
 * Calendar Component
 * Handles month navigation, date selection, and notes indicators
 */

class Calendar {
    constructor(options = {}) {
        this.container = document.getElementById('calendar-grid');
        this.monthYearDisplay = document.getElementById('calendar-month-year');
        this.prevBtn = document.getElementById('btn-prev-month');
        this.nextBtn = document.getElementById('btn-next-month');
        this.todayBtn = document.getElementById('btn-today');

        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.onDateSelect = options.onDateSelect || (() => { });
        this.getNoteDates = options.getNoteDates || (() => []);

        this.months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        this.init();
    }

    init() {
        this.prevBtn.addEventListener('click', () => this.changeMonth(-1));
        this.nextBtn.addEventListener('click', () => this.changeMonth(1));
        this.todayBtn.addEventListener('click', () => this.goToToday());

        this.render();
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    }

    goToToday() {
        const today = new Date();
        this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
        this.selectedDate = new Date(today);
        this.render();
        this.onDateSelect(this.selectedDate);
    }

    selectDate(date) {
        this.selectedDate = date;
        this.render();
        this.onDateSelect(date);
    }

    formatDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    isSameDate(date1, date2) {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    }

    render() {
        // Update month/year display
        this.monthYearDisplay.textContent =
            `${this.months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        // Get dates with notes
        const noteDates = this.getNoteDates();

        // Calculate calendar grid
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        let html = '';

        // Previous month trailing days
        for (let i = startingDay - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const date = new Date(year, month - 1, day);
            const dateKey = this.formatDateKey(date);
            const hasNotes = noteDates.includes(dateKey);
            html += `<button class="calendar-day other-month ${hasNotes ? 'has-notes' : ''}" data-date="${dateKey}">${day}</button>`;
        }

        // Current month days
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const dateKey = this.formatDateKey(date);
            const isToday = this.isToday(date);
            const isSelected = this.isSameDate(date, this.selectedDate);
            const hasNotes = noteDates.includes(dateKey);

            const classes = [
                'calendar-day',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                hasNotes ? 'has-notes' : ''
            ].filter(Boolean).join(' ');

            html += `<button class="${classes}" data-date="${dateKey}">${day}</button>`;
        }

        // Next month leading days
        const remainingCells = 42 - (startingDay + totalDays);
        for (let day = 1; day <= remainingCells; day++) {
            const date = new Date(year, month + 1, day);
            const dateKey = this.formatDateKey(date);
            const hasNotes = noteDates.includes(dateKey);
            html += `<button class="calendar-day other-month ${hasNotes ? 'has-notes' : ''}" data-date="${dateKey}">${day}</button>`;
        }

        this.container.innerHTML = html;

        // Add click handlers
        this.container.querySelectorAll('.calendar-day').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dateKey = e.target.dataset.date;
                const [year, month, day] = dateKey.split('-').map(Number);
                this.selectDate(new Date(year, month - 1, day));
            });
        });
    }

    refresh() {
        this.render();
    }
}

// Export for use in app.js
window.Calendar = Calendar;

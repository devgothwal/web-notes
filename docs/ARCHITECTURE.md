# Architecture Documentation

## Overview

Web Notes is a single-page application (SPA) built with vanilla JavaScript following a component-based architecture.

## Components

### 1. App Controller (`app.js`)
**Purpose**: Main orchestrator that coordinates all components

**Responsibilities**:
- Initialize Editor and Calendar components
- Handle theme toggling (dark/light)
- Manage file download functionality
- Set up header button event listeners

**Dependencies**: Calendar, Editor

---

### 2. Calendar Component (`calendar.js`)
**Purpose**: Date navigation and visual date picker

**Public API**:
```javascript
class Calendar {
    constructor(options)  // Initialize with callbacks
    selectDate(date)      // Programmatically select a date
    refresh()             // Re-render calendar (after note changes)
    goToToday()           // Navigate to current date
}
```

**Options**:
- `onDateSelect(date)`: Callback when user clicks a date
- `getNoteDates()`: Function returning array of date keys with notes

**State**:
- `currentDate`: Currently displayed month
- `selectedDate`: Currently selected date

---

### 3. Editor Component (`editor.js`)
**Purpose**: Rich text editing with autosave

**Public API**:
```javascript
class Editor {
    constructor(options)  // Initialize with callbacks
    loadDate(date)        // Load notes for a specific date
    getNoteDates()        // Get array of dates with saved notes
    getContent()          // Get HTML content
    getPlainText()        // Get plain text content
    saveNow()             // Force save
    clear()               // Clear editor content
}
```

**Features**:
- contenteditable-based rich text
- execCommand for formatting
- Debounced autosave (1 second)
- localStorage persistence

---

## Data Flow

```
┌─────────────┐     onDateSelect      ┌──────────┐
│  Calendar   │ ─────────────────────▶│  Editor  │
│             │                        │          │
│  (renders   │     getNoteDates()    │ (loads   │
│   month)    │◀─────────────────────  │  notes)  │
└─────────────┘                        └──────────┘
       │                                    │
       │                                    │
       ▼                                    ▼
┌─────────────────────────────────────────────────┐
│                  localStorage                    │
│  webnotes_2026-01-16: "<html content>"          │
│  webnotes_2026-01-15: "<html content>"          │
│  webnotes_theme: "dark"                         │
└─────────────────────────────────────────────────┘
```

---

## Styling Architecture

### CSS Variables (Theming)
All colors use CSS custom properties for easy theming:

```css
:root {
    --bg-primary: #1e222d;
    --accent-primary: #4a90d9;
    /* ... */
}

[data-theme="light"] {
    --bg-primary: #f5f5f5;
    /* ... */
}
```

### Layout
- Flexbox-based full-height layout
- Two-column design: sidebar (240px) + editor (flex: 1)
- Responsive: sidebar collapses on mobile

---

## Formatting Commands

Uses `document.execCommand()` for text formatting:

| Command | Usage |
|---------|-------|
| `bold` | Toggle bold |
| `italic` | Toggle italic |
| `underline` | Toggle underline |
| `strikeThrough` | Toggle strikethrough |
| `formatBlock` | Apply heading (h1, h2) |
| `insertUnorderedList` | Create bullet list |
| `foreColor` | Change text color |
| `hiliteColor` | Change highlight color |

**Note**: `execCommand` is deprecated but widely supported. Future versions may migrate to the Selection/Range API.

---

## localStorage Schema

| Key | Format | Description |
|-----|--------|-------------|
| `webnotes_YYYY-MM-DD` | HTML string | Note content for date |
| `webnotes_theme` | `"dark"` or `"light"` | User theme preference |

---

## Future Improvements

1. **Selection API Migration**: Replace execCommand with modern APIs
2. **IndexedDB**: For larger storage capacity
3. **Export Formats**: Markdown, PDF export
4. **Search**: Full-text search across all notes
5. **Tags**: Categorize and filter notes
6. **Sync**: Optional cloud sync with encryption

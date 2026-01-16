# Web Notes 📝

A simple, functional notes-taking web app with calendar navigation and rich text formatting.

**Design Inspired by**: Forex Factory's utility-first aesthetic

![Web Notes Screenshot](./screenshots/demo.png)

## Features

### 📅 Calendar Navigation
- Monthly calendar sidebar
- Click any date to view/edit that day's notes
- Visual indicators (dots) for dates with notes
- Quick "Today" button

### ✏️ Rich Text Formatting
- **Headings**: H1, H2
- **Text Styles**: Bold, Italic, Underline, Strikethrough
- **Lists**: Bullet points
- **Tasks**: Interactive checkboxes
- **Colors**: Text color and highlight pickers

### 💾 Autosave
- Automatically saves every second
- Uses localStorage (no server required)
- Data persists between sessions
- Per-date storage

### 🎨 Themes
- Dark mode (default)
- Light mode toggle

### 📄 Export
- Save as `.txt` file
- Print directly from browser

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/web-notes.git
   cd web-notes
   ```

2. Open `index.html` in your browser, or serve with any HTTP server:
   ```bash
   python3 -m http.server 8080
   ```

3. Open http://localhost:8080 in your browser

## Project Structure

```
web-notes/
├── index.html          # Main application
├── styles/
│   └── main.css        # Forex Factory-inspired styling
├── scripts/
│   ├── app.js          # Main controller
│   ├── calendar.js     # Calendar component
│   └── editor.js       # Rich text editor
└── README.md
```

## Technology

- **Pure HTML/CSS/JavaScript** - No frameworks or build tools
- **localStorage API** - For persistent data storage
- **contenteditable** - For rich text editing
- **CSS Variables** - For easy theming

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+S` | Force save |
| `Tab` | Indent |

## Browser Support

Works on all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## License

MIT License - Feel free to use and modify!

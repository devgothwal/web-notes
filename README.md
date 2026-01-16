# 📝 Web Notes

A beautiful, functional notes-taking web application with **calendar-based navigation**, **multiple notes per day**, and **cross-browser sync**.

<p align="center">
  <img src="screenshots/dark-theme.png" alt="Web Notes Dark Theme" width="800">
</p>

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📅 **Calendar Navigation** | Click any date to view/edit notes |
| 📝 **Multiple Notes/Day** | Create unlimited notes per day with titles |
| 🔄 **Cross-browser Sync** | Notes sync across all browsers via SQLite |
| ☀️ **Light/Dark Themes** | Light theme default, toggle to dark |
| 💾 **Autosave** | Saves automatically every second |
| 🖨️ **Export** | Save as .txt or print |

### Rich Text Formatting

| Tool | Shortcut |
|------|----------|
| **Bold** | Ctrl+B |
| *Italic* | Ctrl+I |
| <u>Underline</u> | Ctrl+U |
| Headings | H1, H2 buttons |
| Lists | Bullet points |
| Checkboxes | Interactive tasks |
| Colors | Text & highlight |

## 🚀 Quick Start

### Development
```bash
webnotes-dev     # Start dev server on port 8889
```

### Production
```bash
webnotes-deploy  # Deploy to production on port 8888
```

## 🌐 URLs

| Environment | URL |
|-------------|-----|
| Development | http://localhost:8889/ |
| Production | http://localhost:8888/ |

## 📁 Project Structure

```
web-notes/
├── index.html              # Main application
├── favicon.svg             # App icon
├── styles/main.css         # Styling & themes
├── scripts/
│   ├── app.js              # Main controller
│   ├── calendar.js         # Calendar component
│   └── editor.js           # Rich text editor
├── backend/
│   └── app.py              # FastAPI + SQLite
├── dev.sh                  # Development server
├── deploy.sh               # Production deployment
├── Dockerfile              # Production container
├── Dockerfile.dev          # Development container
└── docker-compose.yml      # Container orchestration
```

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Backend:** FastAPI + SQLite
- **Deployment:** Docker + docker-compose
- **Server:** Uvicorn with hot reload

## 🔧 Architecture

```
Browser ──► FastAPI (8888/8889) ──► SQLite
                    │
            ┌───────┴───────┐
            │   /api/notes  │  CRUD endpoints
            │   /api/dates  │  Date index
            └───────────────┘
```

## 📜 License

MIT License - feel free to use and modify.

## 🙏 Inspiration

- Design: [Forex Factory](https://www.forexfactory.com/)
- Features: [Online Notepad](https://onlinenotepad.org/)

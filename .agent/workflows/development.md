---
description: How to develop and run Web Notes application
---

# Web Notes Development Workflow

## Project Overview
Web Notes is a date-based notes application with rich text formatting and Forex Factory-inspired design.

**Location**: `/home/gothwal/Desktop/Web Notes`
**GitHub**: https://github.com/devgothwal/web-notes

## Running the Application

// turbo
1. Start the development server:
```bash
cd "/home/gothwal/Desktop/Web Notes"
python3 -m http.server 8888
```

2. Access via Tailscale IP: http://100.121.166.123:8888/

## Project Structure
- `index.html` - Main single-page application
- `styles/main.css` - All styling with CSS variables
- `scripts/app.js` - Main controller
- `scripts/calendar.js` - Calendar component
- `scripts/editor.js` - Rich text editor

## Key Features
- Calendar-based note navigation (one note per day)
- Rich formatting: H1, H2, Bold, Italic, Underline, Strikethrough
- Bullet lists and checkboxes
- Text color and highlight
- Autosave to localStorage
- Dark/Light theme toggle

## Making Changes

1. Edit files directly - no build step required
2. Refresh browser to see changes
3. Notes persist in localStorage

## Pushing Updates

// turbo
1. Stage and commit changes:
```bash
git add -A
git commit -m "Your commit message"
git push
```

## Design Guidelines
- Follow Forex Factory aesthetic: utility-first, clean, minimal
- Use CSS variables for any new colors
- Keep dark theme as default
- No flashy animations - subtle transitions only

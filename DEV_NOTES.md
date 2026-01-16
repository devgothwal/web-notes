# Developer Notes & Technical Context

> **For AI Assistants:** Read this file to understand the specific complexities and "gotchas" in this project.

## 🚧 Environment Rules
- **Production Server:** `http://100.121.166.123:8888/` (Do NOT touch unless explicitly authorized).
- **Dev Server:** `http://100.121.166.123:8889/` (Use this for all testing/changes).
- **Repo:** `feature/multiple-notes` branch.

## 🛠 Feature Implementations & Pitfalls

### 1. Highlighter & Persistence ("Sticky Highlight" Bug)
**The Problem:**
Using `document.execCommand('hiliteColor', ...)` is unreliable at the caret position (collapsed selection). Browsers often fail to "step out" of the `<span>`, causing the next typed character to inherit the background color unexpectedly (making it impossible to "turn off" highlighting while typing).

**The Solution (Robust Breakout):**
- **Do NOT** rely solely on `execCommand('hiliteColor', false, 'transparent')`.
- **Logic:** When the user toggles highlighting **OFF** at a caret:
    1. Check `btn.classList.contains('active')` (Considers visual state as truth).
    2. Insert a **Zero-Width Space (ZWSP)** wrapped in a transparent span: `"&#8203;"`.
    3. This forces the cursor into a new, clean text node.

**Code Location:** `scripts/editor.js` -> `initColorDropdown`.

### 2. Checkbox Logic
**The Problem:**
Pressing `Enter` in a checkbox list caused infinite loops or "Ghost Checkboxes" (divs with the class but no input), corrupting the editor state.

**The Solution:**
- **Sanitization:** The `handleKeydown` function checks if a `.checkbox-item` actually contains an `<input>`. If not, it strips the class immediately.
- **Exit Strategy:** Pressing `Enter` on an **empty** checkbox removes the checkbox `div` and replaces it with a standard text block (`<div class="chk-content"><br></div>` or similar), cleanly exiting the list mode.

### 3. Color Picker (Presets vs Native)
**Decision:**
- Native `<input type="color">` was replaced with a custom **Dropdown Palette**.
- **Reason:** Native pickers steal focus in unpredictable ways on Linux/Touch, causing `execCommand` to apply to "nothing" (lost selection).
- **Implementation:** Custom grid of buttons. Clicking a color relies on `savedRange` or immediate `window.getSelection()` logic to force-reapply focus to the editor before executing the command.

## 📂 Project Structure
- `index.html`: Main UI.
- `styles/main.css`: All styling (Dark/Light themes handled via CSS variables).
- `scripts/editor.js`: Core logic (Input handling, commands, autosave).
- `docker-compose.yml`: Manages Prod (:8888) and Dev (:8889) services.

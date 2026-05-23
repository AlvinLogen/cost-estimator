# Project Cost Estimator

A client-side web app for estimating software project costs by role, duration, and hourly rate. Estimates persist across page reloads via `localStorage` and can be exported as a CSV file.

---

## Features

- Add multiple team roles with hourly rate and weekly hours
- Optional 15% risk contingency
- Results breakdown table per role (total hours + total cost)
- Visual cost-proportion bar chart
- Save estimates to browser storage — history survives page reloads
- Export results to a CSV file (Excel-compatible, formula-injection protected)
- Fully keyboard-accessible

---

## Tech Stack

| Layer               | Choice                           |
| ------------------- | -------------------------------- |
| Language            | Vanilla JavaScript (ES6)         |
| Styling             | Tailwind CSS (CDN)               |
| Persistence         | `localStorage`                   |
| File download       | Blob API + `URL.createObjectURL` |
| Currency formatting | `Intl.NumberFormat`              |

No npm, no bundler, no dependencies to install.

---

## Project Structure

```
├── index.html          # UI scaffold — Tailwind classes, form, results panel
└── js/
    ├── calculator.js   # Pure business logic — no DOM references
    ├── storage.js      # localStorage read/write — no DOM references
    ├── export.js       # CSV generation and Blob download — no DOM references
    └── ui.js           # DOM wiring, events, rendering — only file that touches the DOM
```

Script load order matters: `calculator.js` → `storage.js` → `export.js` → `ui.js`

---

## Running Locally

No install required. Open `index.html` with a local server — do **not** open it directly via `file://` as some browsers block local script loading.

**With VS Code Live Server:**

1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Right-click `index.html` → **Open with Live Server**
3. App runs at `http://127.0.0.1:5500`

---

## Security Notes

- All user input is rendered via `textContent` — never `innerHTML` — preventing XSS
- CSV fields are sanitised against formula injection (prefixes `=`, `+`, `-`, `@` with `'`)
- `localStorage` data is validated with `Array.isArray` and `try/catch` on parse — corrupt data resets silently rather than crashing the app
- No passwords, tokens, or sensitive data are stored anywhere

---

## Architecture Decisions

**Why four separate files?**  
`calculator.js`, `storage.js`, and `export.js` have zero DOM references. They can be tested, reused, or moved to a Node.js backend without modification. `ui.js` is the only layer that knows about the browser. This separation makes each file independently understandable and testable.

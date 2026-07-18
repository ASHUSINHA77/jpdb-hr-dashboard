# HR Dashboard — Employee Record Management System

A high-performance, single-page HR Dashboard for managing employee databases using **JsonPowerDB (JPDB)**. Built with vanilla HTML5, CSS3, and JavaScript — no frameworks, no jQuery, no page reloads.

![Stack](https://img.shields.io/badge/stack-HTML5%20%7C%20CSS3%20%7C%20VanillaJS-blue)
![DB](https://img.shields.io/badge/database-JsonPowerDB-green)
![Architecture](https://img.shields.io/badge/architecture-AJAX%20%7C%20Async-orange)

---

## 🚀 Features

| Feature | Description |
|---|---|
| **Create (PUT)** | Insert new employee records (ID, Name, Salary, Department) into a schema-less JPDB relation |
| **Read (GET)** | Retrieve existing records instantly by unique Employee ID |
| **Update (UPDATE)** | Modify record attributes in real-time |
| **Delete (REMOVE)** | Remove records via low-code IML syntax with confirmation |
| **Record Navigation** | Flip through records sequentially using `FIRST_RECORD`, `LAST_RECORD`, `PREV_RECORD`, `NEXT_RECORD` |
| **State-Aware UI** | Smart button states — Save disabled on duplicate ID, Update/Delete unlocked only on loaded record |
| **Real-Time Validation** | Client-side field validation with visual indicators |
| **Toast Notifications** | Non-blocking feedback for all operations |
| **Keyboard Shortcuts** | Arrow keys for navigation, Ctrl+S to save, Ctrl+Delete to remove |

---

## 📁 Project Structure

```
hr-dashboard/
├── index.html              # Main application page
├── css/
│   └── styles.css          # Complete responsive stylesheet (CSS custom properties)
├── js/
│   ├── config.js           # JPDB connection & database configuration
│   ├── jpdb-helper.js      # Low-level JPDB API wrapper (AJAX via XMLHttpRequest)
│   ├── validation.js       # Form validation & state-aware button logic
│   └── app.js              # Main orchestrator — CRUD, navigation, UI events
└── README.md               # This file
```

---

## 🔧 Configuration

Edit `js/config.js` to connect to your JsonPowerDB instance:

```js
const APP_CONFIG = {
    jpdb: {
        baseUrl: "http://api.login2explore.com:5577",
        irl: "/api/irl",
        iml: "/api/iml"
    },
    db: {
        token: "YOUR_CONNECTION_TOKEN_HERE",
        dbName: "HR-DB",
        relationName: "EMP-RECORDS"
    },
    primaryKey: "emp_id"
};
```

1. Replace `token` with your actual JPDB connection token.
2. Update `dbName` and `relationName` if using different identifiers.
3. The primary key defaults to `emp_id` — change only if your schema differs.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│                    index.html                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │   Form UI   │  │  Navigation  │  │  Record  │ │
│  │  (CRUD)     │  │  Controls    │  │  Card    │ │
│  └──────┬──────┘  └──────┬───────┘  └────┬─────┘ │
└─────────┼────────────────┼───────────────┼───────┘
          │                │               │
          ▼                ▼               ▼
┌──────────────────────────────────────────────────┐
│                  app.js                           │
│        (Orchestrator / State Manager)             │
└──────┬──────────────────────┬────────────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐    ┌─────────────────┐
│ validation.js│    │  jpdb-helper.js │
│ (Form State) │    │  (AJAX Wrapper) │
└──────────────┘    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   config.js     │
                    │ (DB Settings)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  JsonPowerDB    │
                    │  (REST API)     │
                    └─────────────────┘
```

### Data Flow

1. **User Action** → `app.js` handler
2. **Validation** → `validation.js` checks field integrity
3. **API Call** → `jpdb-helper.js` constructs JPDB payload & makes async AJAX request
4. **Response** → `app.js` parses response, updates UI state
5. **UI Update** → Form fields, record card, button states, and toasts all update reactively

---

## 🧠 State-Aware Button Logic

| State | Save | Update | Delete |
|---|---|---|---|
| **New Record** (no ID match) | ✅ Enabled (valid form) | ❌ Disabled | ❌ Disabled |
| **Existing Record** (ID loaded) | ❌ Disabled (prevents duplicate) | ✅ Enabled (valid form) | ✅ Enabled |
| **Form Invalid** | ❌ Disabled | ❌ Disabled | Depends on state |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `←` / `→` | Previous / Next record |
| `Home` / `End` | First / Last record |
| `Ctrl + S` | Save new record |
| `Ctrl + Delete` | Delete current record |
| `Escape` | Close confirmation modal |

---

## 🌐 Browser Support

All modern browsers with ES6+ support:
- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

---

## 📝 JPDB API Reference

The application uses two JPDB endpoints:

### IRL (Internal Resource Locator)
- `PUT` — Create new record
- `GET` — Retrieve record by key
- `UPDATE` — Modify existing record
- `REMOVE` — Delete record

### IML (Index Manipulation Language)
- `FIRST_RECORD` — Navigate to first record
- `LAST_RECORD` — Navigate to last record
- `PREV_RECORD` — Navigate to previous record
- `NEXT_RECORD` — Navigate to next record

---

## 👨‍💻 Author

Built as a demonstration of JsonPowerDB integration with vanilla JavaScript frontend architecture.

---

## 📄 License

MIT License — free to use, modify, and distribute.

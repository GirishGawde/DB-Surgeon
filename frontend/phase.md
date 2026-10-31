# DB-Surgeon: Member 3 (Frontend) Implementation Roadmap & Phases

> **Strict Boundary Notice**: Member 3 owns `frontend/` exclusively. All frontend code, configs, assets, and documentation must reside inside `frontend/` to ensure zero merge conflicts with M1 (Backend) and M2 (AI Engine).

---

## 🎯 Target Overview & Demo Script Alignment

The frontend is the **Dry-Run Sandbox** and the primary interface shown to hackathon judges. It directly drives the 4-step demo script:
1. **0:00 - 0:30 (Garbage Data Hook)**: Display messy, unstructured DB (repeating columns, exposed Aadhar, raw phone numbers).
2. **0:30 - 1:30 (Core Execution & Self-Healing)**: Command input ("Normalize this database, separate users, mask PII") → Dry-run Schema Graph → Approve & Execute → Live execution log showing self-heal retry loop (syntax error caught & fixed) → Clean 3NF relational schema graph.
3. **1:30 - 2:00 (Edge Fallback Flex)**: Live badge switches from `🟢 Cloud API (Gemini)` to `🟠 Local Edge (Ollama)` when offline, with synthetic data generation.
4. **2:00 - 2:30 (Time-Travel Safety Net)**: Prominent red **"Undo Mutation"** hot-swap button restoring original state instantly.

---

## 📁 Strict File Structure (`frontend/`)

```
frontend/
├── package.json              # M3 only
├── vite.config.js            # Vite configuration
├── .env.example              # VITE_API_BASE_URL=http://localhost:8000, VITE_USE_MOCKS=true
├── .env                      # Local environment (gitignored)
├── index.html                # Entry HTML with custom fonts & title
├── public/                   # Static icons & assets
└── src/
    ├── main.jsx              # React DOM entry
    ├── App.jsx               # Master dashboard layout
    ├── index.css             # Theme tokens, dark mode, glassmorphism, animations
    ├── services/
    │   └── api.js            # ALL backend API calls with mock toggle
    ├── mocks/
    │   ├── messyData.json    # Initial raw table data (addresses, Aadhar, phone)
    │   ├── normalizedData.json# 3NF clean schema + relations
    │   ├── executionLogs.json# Self-healing retry stack traces & execution steps
    │   └── providerStatus.json# Gemini & Ollama health response
    └── components/
        ├── StatusBadge.jsx   # 🟢 Gemini Cloud / 🟠 Ollama Edge / 🔴 Offline badge
        ├── DashboardHub.jsx  # Feature launchpad & overview screen with icon cards
        ├── UploadZone.jsx    # Dual-mode .db file & Whiteboard ER drag-and-drop
        ├── CommandChat.jsx   # Natural language prompt box + quick prompt pills
        ├── SchemaGraph.jsx   # Interactive dry-run relational schema visualizer + Approve
        ├── ExecutionLog.jsx  # Real-time console showing AI self-heal loops & metrics
        ├── UndoButton.jsx    # Prominent red "Undo Mutation" timeline rollback button
        └── TablePreview.jsx  # Interactive before/after raw table data preview modal

```

---

## 🚀 Execution Status

- [x] **Phase 0: Project Scaffolding & Design Foundation** (Vite + React, `.env.example`, `.env`, dark cyber-surgical tokens, `lucide-react`)
- [x] **Phase 1: Mock Data & Service Layer** (`src/mocks/` with messy data, 3NF schema, self-healing logs; `src/services/api.js` unified client)
- [x] **Phase 2: Component Engineering** (`StatusBadge`, `UploadZone`, `CommandChat`, `SchemaGraph`, `ExecutionLog`, `UndoButton`, `TablePreview`)
- [x] **Phase 3: Master Dashboard Assembly** (`App.jsx` single-screen command center)
- [x] **Phase 4: Browser Rehearsal & Validation** (Tested all 4 steps of Demo Script: garbage data hook -> dry run approve -> self-healing retry -> undo rollback -> edge fallback)

---

## 🕒 3:30 PM Integration Playbook (Connecting to M1 Backend)

When Member 1 and Member 2 have merged their code:
1. Obtain Member 1's local IPv4 address (e.g. `http://192.168.1.45:8000`).
2. In `frontend/.env`, set:
   ```env
   VITE_API_BASE_URL=http://192.168.1.45:8000
   VITE_USE_MOCKS=false
   ```
3. Restart or reload Vite (`npm run dev`).
4. Test live endpoints:
   - `GET /api/status` (badge displays real backend provider)
   - `POST /api/upload-db` (upload real `sample_data/messy_orders.db`)
   - `POST /api/analyze` (dry run against real SQLite)
   - `POST /api/execute` (runs real self-healing loop in `backend/main.py`)
   - `POST /api/rollback` (runs real `shutil.copy2` rollback)


### Phase 1: Mock Data & Service Layer (`src/mocks/` & `src/services/api.js`)
- **Goal**: Enable 100% frontend independence so M3 is never blocked by M1 or M2.
- **Tasks**:
  1. Build realistic JSON fixtures:
     - `messyData.json`: Messy customer orders table with duplicate addresses, unparsed full names, exposed Aadhar (`4321-8765-1092`).
     - `normalizedData.json`: Clean 3NF schema tables (`users`, `orders`, `addresses`, `items`) with relations (`orders.user_id -> users.id`).
     - `executionLogs.json`: Simulated self-healing sequence:
       - *Attempt 1*: `sqlite3.OperationalError: near "INDEX": syntax error`
       - *Self-Healing Loop*: AI analyzes stack trace, refactors SQL
       - *Attempt 2*: `SUCCESS - 4 tables created, 450 rows migrated, PII masked`
     - `providerStatus.json`: State payloads for Cloud (Gemini) and Local Edge (Ollama).
  2. Implement `src/services/api.js`:
     - Reads `VITE_USE_MOCKS` (if `true`, serves fixtures with realistic delay).
     - Unified API functions matching M1 contract:
       - `getStatus()`: `GET /api/status`
       - `uploadDb(file)`: `POST /api/upload-db`
       - `uploadWhiteboard(base64Image)`: `POST /api/upload-whiteboard`
       - `analyzeCommand(command)`: `POST /api/analyze` (dry run)
       - `executeSql(sql)`: `POST /api/execute` (runs mutation + returns heal logs)
       - `rollbackDb()`: `POST /api/rollback` (reverts to snapshot)
       - `sendChatCommand(message)`: `POST /api/command`

---

### Phase 2: Component Engineering (`src/components/`)
- **Goal**: Build all isolated, interactive UI components specified in `fileStructure.md`.

#### 1. `StatusBadge.jsx`
- Displays active intelligence provider:
  - `🟢 Cloud API (Gemini 2.5/Gemma 4)`
  - `🟠 Local Edge (Ollama gemma4:e4b)`
  - `🔴 Disconnected`
- Includes a subtle demo toggle to manually simulate Wi-Fi disconnect during rehearsal.

#### 2. `UploadZone.jsx`
- Dual-target dropzone:
  - SQLite `.db` file ingest (shows file size, tables detected, row count).
  - Whiteboard image ingest (drag & drop ER sketch photos, triggers preview thumbnail + Base64 conversion).

#### 3. `CommandChat.jsx`
- Natural language command console with instant prompt pills:
  - *"Normalize database & split addresses into 3NF"*
  - *"Scan and mask Aadhar and phone PII"*
  - *"Synthesize 50 rows of localized Goan user data"*
- Input state indicators (thinking/analyzing/executing).

#### 4. `SchemaGraph.jsx` (Dry-Run Visualizer)
- Visual schema representation showing before/after tables, primary keys (`PK`), foreign keys (`FK`), and relational connector lines.
- "Diff" indicator highlighting transformed/split columns.
- Prominent **"Approve & Execute Mutation"** primary CTA button.

#### 5. `ExecutionLog.jsx`
- Cyber-terminal style log console.
- Displays:
  - Raw SQL generated.
  - Intercepted SQLite errors (`sqlite3.OperationalError`).
  - Agentic self-healing retries with retry badge (`Retry 1/3`).
  - Execution summary (rows affected, execution time in ms, validation passed).

#### 6. `UndoButton.jsx`
- Prominent crimson-red **"Undo Mutation"** timeline button with glowing indicator.
- Confirmation micro-modal and immediate state rollback toast.

#### 7. `TablePreview.jsx`
- Clean data grid showing actual rows before and after mutation (e.g. unmasked vs `[REDACTED-AADHAR]`).

---

### Phase 3: Dashboard Layout Assembly (`App.jsx`)
- **Goal**: Integrate all components into a high-impact, cohesive single-screen command center.
- **Layout Structure**:
  - **Header**: DB-Surgeon logo, database filename badge, `StatusBadge`, and red `UndoButton`.
  - **Left Sidebar / Panel**:
    - `UploadZone` (toggleable between SQLite DB & Whiteboard ER)
    - `CommandChat` with quick-action chips.
  - **Center / Main Stage**:
    - Tabbed view: **Interactive Schema Graph (Dry Run)** & **Live Table Data**.
    - Top notice banner when in "Dry Run / Review Needed" state.
    - Floating action: "Approve & Execute".
  - **Bottom Panel / Drawer**:
    - Collapsible `ExecutionLog` streaming terminal events and self-healing metrics.

---

### Phase 4: Demo Rehearsal & Backend Integration (3:30 PM Checklist)
- **Goal**: Polish UX, eliminate edge cases, and execute smooth integration with M1 & M2.
- **Verification Steps**:
  1. **Demo Flow Rehearsal (Mock Mode)**:
     - Run 0:00 to 2:30 script end-to-end to ensure zero visual glitches and instant feedback.
  2. **Integration at 3:30 PM**:
     - Receive M1's local IP address (e.g. `http://192.168.1.XX:8000`).
     - Set `VITE_API_BASE_URL=http://<M1-IP>:8000` and `VITE_USE_MOCKS=false` in `frontend/.env`.
     - Test live ping to `/api/status`.
     - Upload `sample_data/messy_orders.db`, trigger dry run, approve execution, verify real log response, and test rollback.
  3. **Fallback Guard**:
     - If M1's backend has latency or network instability during demo, toggle `VITE_USE_MOCKS=true` via header hotkey for a bulletproof presentation.

---

## 🛡️ Conflict Prevention Rules for M3
1. **Never edit files outside `frontend/`**.
2. **Never push `.env` or `node_modules`** (strictly adhere to root `.gitignore`).
3. **Commit exclusively to `feature/m3-frontend`** branch.
4. **All backend interaction must pass through `src/services/api.js`**.

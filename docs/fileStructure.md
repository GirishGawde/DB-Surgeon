# DB-Surgeon: Project File Structure (Conflict-Free)

Each person works in their own folder and never edits another person's files. The three folders only meet through two small agreements: the **AI function** (M2 → M1) and the **API list** (M1 → M3), both below.

| Who | Owns | Touches nothing else |
|-----|------|----------------------|
| **Member 1** (Backend / Execution) | `backend/main.py`, `database_manager.py`, `ai_stub.py`, `requirements.txt`, `sample_data/`, `docs/`, root files | |
| **Member 2** (AI Layer) | `backend/ai_engine/` | |
| **Member 3** (Frontend) | `frontend/` | |

## Repository Tree

```
db-surgeon/
├── .gitignore                    # M1, pushed FIRST (see below)
├── .env.example                  # M1, template only; real .env is never pushed
├── README.md                     # M1, how to run
│
├── frontend/                     # [M3 ONLY]
│   ├── package.json              # only M3 runs `npm install` (no lockfile fights)
│   ├── vite.config.js
│   ├── .env.example              # VITE_API_BASE_URL=http://localhost:8000
│   ├── public/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # main layout
│       ├── services/
│       │   └── api.js            # ALL backend calls live here (reads VITE_API_BASE_URL)
│       ├── mocks/                # sample JSON so M3 can build with no backend
│       └── components/
│           ├── UploadZone.jsx        # .db + whiteboard drag-and-drop
│           ├── SchemaGraph.jsx       # dry-run node graph + Approve button
│           ├── UndoButton.jsx        # red "Undo Mutation"
│           ├── StatusBadge.jsx       # 🟢 Gemini / 🟠 Ollama
│           ├── CommandChat.jsx       # plain-English commands
│           └── ExecutionLog.jsx      # self-heal retries + validation result
│
├── backend/
│   ├── main.py                   # [M1] FastAPI routes + self-healing loop
│   ├── database_manager.py       # [M1] sqlite execution, snapshot, rollback, validation
│   ├── ai_stub.py                # [M1] fake AI with the same signature, so M1 is never blocked
│   ├── requirements.txt          # [M1] contains: -r ai_engine/requirements.txt
│   │
│   ├── ai_engine/                # [M2 ONLY]
│   │   ├── __init__.py
│   │   ├── router.py             # Gemini first -> Ollama fallback
│   │   ├── prompts.py            # normalization, healing, PII, synthesis, whiteboard
│   │   ├── multimodal.py         # Base64 image handling
│   │   └── requirements.txt      # M2's own packages (google-genai, requests, pillow)
│   │
│   └── data/                     # runtime DB files, contents gitignored
│       └── .gitkeep
│
├── sample_data/                  # [M1] shared demo files (committed, same for everyone)
│   ├── messy_orders.db
│   └── whiteboard_er_example.jpg
│
└── docs/                         # [M1 ONLY] others send text to M1 instead of editing
    ├── problem_statement.md
    ├── solution.md
    ├── architecture.md
    └── filestructure.md
```

## The Two Agreements

### 1. AI function (M2 builds it, M1 calls it)

One entry point keeps the 3:30 PM merge to a single import:

```python
generate_sql_from_ai(task: str, payload: dict, error_trace: str | None = None) -> dict
# task    : "normalize" | "pii" | "synthesize" | "whiteboard"
# payload : table profile + sample rows (or {"image_b64": "..."} for whiteboard)
# error_trace : the sqlite error text when asking the AI to fix its own SQL
# returns : {"sql": "...", "provider": "gemini" | "ollama"}

get_provider_status() -> {"active": "gemini" | "ollama", "online": True}
```

M1 switches between mock and real with an env var, so **no code edit at merge time**:

```python
# main.py
if os.getenv("AI_MODE", "mock") == "real":
    from ai_engine.router import generate_sql_from_ai, get_provider_status
else:
    from ai_stub import generate_sql_from_ai, get_provider_status
```

### 2. API list (M1 builds it, M3 calls it)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/status` | `{"active_provider": "gemini"\|"ollama", "online": true}` for the badge |
| `POST /api/upload-db` | upload messy `.db` |
| `POST /api/upload-whiteboard` | `{"image_b64": "..."}` |
| `POST /api/analyze` | dry run: returns proposed schema + SQL, executes nothing |
| `POST /api/execute` | approved SQL: runs it, returns heal attempts + validation |
| `POST /api/rollback` | restores `backup.db` |
| `POST /api/command` | `{"message": "Scan for PII and mask it"}` |

Proposed schema shape (so M3 can draw the graph):
`{"tables": [{"name": "...", "columns": [{"name": "...", "type": "...", "pk": true}]}], "relations": [{"from": "orders.customer_id", "to": "customers.id"}]}`

M1 and M3 agree on these JSON shapes in the first 15 minutes, then M3 builds against `src/mocks/`.

## GitHub Merge Strategy

### 1. `.gitignore` (push this FIRST, before any other code)

```gitignore
# Node
node_modules/
frontend/dist/

# Python (note: no path prefix, so ai_engine/__pycache__ is covered too)
__pycache__/
*.pyc
.venv/

# Secrets
.env
frontend/.env

# Local databases (NEVER PUSH)
backend/data/*
!backend/data/.gitkeep
*.db-journal
```

`sample_data/*.db` is intentionally **not** ignored: everyone needs the same demo file.

### 2. Branches

```
feature/m1-backend      feature/m2-ai-engine      feature/m3-frontend
```

- Commit only inside your own folders. Run `git status` before every commit.
- Never commit to `main` directly, and never force-push.
- Never paste API keys into code. Keys live in your local `.env`.

### 3. Known conflict traps (already handled)

| Trap | Fix |
|------|-----|
| Two people edit `requirements.txt` | M2 uses `ai_engine/requirements.txt`; M1's file just includes it |
| Two people run `npm install` | Only M3 does |
| Hardcoded `localhost` changed at the last minute | `VITE_API_BASE_URL` in `frontend/.env`, no source edit |
| Everyone edits docs | Docs are M1-only; send your text to M1 |
| `data/` folder missing after clone | `.gitkeep` is committed |

### 4. The 3:30 PM Integration

1. Merge order: **M2 → M1 → M3**. Folders don't overlap, so there are no conflicts.
2. M1 sets `AI_MODE=real` and a real `GEMINI_API_KEY` in `.env`, runs `uvicorn main:app --host 0.0.0.0 --port 8000`, and shares their IPv4.
3. M3 sets `VITE_API_BASE_URL=http://<M1-IPv4>:8000` in `frontend/.env` and `VITE_USE_MOCKS=false`.
4. Allow port 8000 (M1) and Ollama's port (M2) through the Windows firewall. Start Ollama with `OLLAMA_HOST=0.0.0.0` if M1 calls it across machines.
5. End-to-end test: upload `sample_data/messy_orders.db` → dry-run graph → Approve → watch a self-heal retry in the log → Undo restores the original → turn Wi-Fi off and confirm the badge flips to 🟠.
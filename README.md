# 🩺 DB-Surgeon: Autonomous Data Refactoring & Self-Healing DBA Agent

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash_%2F_Gemma_4-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_HackOct-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![SQLite](https://img.shields.io/badge/SQLite-Isolated_Sandbox-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Hacktoberfest Hackathon | Don Bosco College of Engineering**  
> *An open-weight, agentic AI infrastructure executor that touches, cleans, normalizes, and repairs production databases directly on the local machine with zero human copy-pasting.*

---

## 📌 Table of Contents

- [Overview & Problem Statement](#-overview--problem-statement)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Quick Start Guide](#-quick-start-guide)
- [Environment Variables](#-environment-variables)
- [Automated Testing Suite](#-automated-testing-suite)
- [API Reference](#-api-reference)
- [Live Demo Walkthrough](#-live-demo-walkthrough)
- [Team & Acknowledgments](#-team--acknowledgments)

---

## 💡 Overview & Problem Statement

Over time, production databases turn into unmaintainable sprawl: repeating addresses, unindexed keys, exposed PII, and denormalized tables that waste memory and degrade query performance. 

Standard AI chat tools (e.g. ChatGPT, Claude) **cannot solve this**:
- They are isolated chat windows that cannot securely connect to private infrastructure.
- They cannot physically execute DDL/DML code on the local database.
- They cannot intercept runtime engine errors or fix their own hallucinations without manual intervention.

**DB-Surgeon bridges this gap.** Instead of generating text for a human to copy-paste, DB-Surgeon acts as an **Autonomous Database Administrator (DBA)**. It connects to the database, samples messy raw data, designs a compliant 3rd Normal Form (3NF) relational architecture, executes physical migrations in an isolated sandbox, and uses an automated **closed-loop self-healing reflection engine** to catch stack traces and repair SQL errors autonomously.

---

## 🚀 Key Features

### 🔄 1. Closed-Loop Self-Healing SQL Execution
When DB-Surgeon mutates database state, execution is wrapped in an autonomous error-handling loop:
- **Attempt 1 (Intercept Error)**: Detects dialect mismatches, syntax errors, or unindexed constraints during dry-run sandbox execution.
- **Attempt 2 (Agentic Healing)**: Bounces the exact SQLite/SQL stack trace back to Google Gemini / Gemma 4 to autonomously reflect and rewrite the DDL.
- **Attempt 3 (Verified Commit)**: Commits the verified schema and updates live telemetry metrics.

### ⚡ 2. High-Availability Hybrid Edge-Cloud AI Routing
- **Cloud Primary**: Leverages **Google Gemini 2.5 Flash** and **Gemma 4** for deep architectural reasoning, multimodal vision ingestion, and 256k context processing.
- **Edge Node Fallback**: Automatically redirects requests over local IPv4 to an on-premise **Ollama** instance (`gemma4:e4b` / `e2b`) if the internet drops or cloud API quotas exhaust.

### 🛡️ 3. Autonomous Cybersecurity & PII Masking Engine
Scans messy raw data rows for Personally Identifiable Information (Aadhar IDs, phone numbers, emails, addresses). Writes cryptographic hashing or redaction functions into the DDL migration before splitting tables.

### ⏪ 4. "Time-Travel" Rollback System (Physical Database Versioning)
Safeguards against destructive AI mutations. Before any execution, DB-Surgeon creates an atomic clone of the database. Clicking **"Undo Mutation"** in the dashboard immediately reverts the database to its pristine snapshot state.

### 📷 5. Multimodal Whiteboard Ingestion
Upload a photo of a hand-drawn Entity-Relationship (ER) diagram or whiteboard architecture. DB-Surgeon extracts the tables, foreign keys, and column types via multimodal vision and automatically generates standard SQL schema migrations.

### 🧪 6. Intelligent Contextual Data Synthesis
Understands schema domain semantics and synthesizes hundreds of realistic, localized mock records (e.g. Goan customer profiles, restaurant menus) to stress-test the new 3NF architecture.

### 🔍 7. MongoMind Autonomous Telemetry
Built-in MongoDB Atlas monitoring module that inspects live clusters (`HackOct`):
- Slow query profiler (`millis > 1000ms`)
- Dangerous bulk operations tracking (unfiltered updates/deletes)
- Connection spikes and abnormal client tracking
- Real-time collection read/write activity
- Dynamic index creation and removal tracking

---

## 🏗️ System Architecture

```mermaid
graph TD
    %% Define Nodes
    UI["🖥️ React 19 / Vite UI<br/>(Cyber-Surgical Dashboard)"]
    API["⚙️ Node / Express & FastAPI Backend<br/>(Execution & Routing Engine)"]
    DB[("💾 Local SQLite DB<br/>(Physical Infrastructure)")]
    BAK[("📦 Shadow Backup Clone<br/>(Time-Travel State)")]
    CLOUD["☁️ Google Gemini API<br/>(Gemini 2.5 Flash / Gemma 4)"]
    EDGE["💻 Local Edge Node<br/>(Ollama gemma4:e4b)"]
    MONGO[("🍃 MongoDB Atlas<br/>(HackOct Cluster)")]

    %% User Interaction
    UI -- "1. Uploads Messy DB / Prompt" --> API
    API -- "2. Atomic Snapshot Clone" --> BAK
    
    %% AI Routing
    API -- "3a. Primary Cloud Route" --> CLOUD
    API -. "3b. Offline Edge Fallback" .-> EDGE
    CLOUD -- "4. Generates Normalized SQL" --> API
    EDGE -- "4. Generates Normalized SQL" --> API

    %% Physical Execution & Self-Healing
    API -- "5. cursor.execute() in Sandbox" --> DB
    DB -- "6a. Success" --> API
    DB -- "6b. OperationalError / Dialect Issue" --> API
    API -. "7. Bounces Stack Trace to AI for Healing" .-> CLOUD

    %% MongoMind Telemetry
    API <--> "8. Profiler & Collection Monitoring" <--> MONGO
    
    %% UI Update & Undo
    API -- "9. Streams Schema & Telemetry Logs" --> UI
    UI -. "10. 'Undo Mutation' Hot-Swaps Backup" .-> BAK
```

---

## 📂 Project Structure

```text
DB-Surgeon/
├── README.md                      # Comprehensive project documentation
├── docs/                          # Architecture, demo scripts & API specs
│   ├── APIDocumentation.md        # REST API specification
│   ├── Demo-Script.md             # 4-minute presentation & judging walkthrough
│   ├── architecture.md            # Edge-cloud hybrid design specifications
│   ├── fileStructure.md           # Unified repository file map
│   ├── module.md                  # Team role distribution
│   └── problemStaement.md         # Official problem statement & solution scope
│
├── backend/                       # Infrastructure & Execution Engine
│   ├── .env.example               # Backend environment template
│   ├── index.js                   # MongoMind CLI monitoring entry point
│   ├── package.json               # Backend dependencies (Express, Mongoose, GenAI)
│   ├── server.js                  # Express HTTP server bootstrap (Port 3000)
│   ├── test_gemini.js             # Standalone Gemini API tester
│   └── src/
│       ├── app.js                 # API routing, Gemini prompt engineering & mock fallbacks
│       └── db/
│           └── db.js              # MongoDB Atlas HackOct connection module
│
└── frontend/                      # Cyber-Surgical React Dashboard
    ├── .env                       # Frontend environment configuration
    ├── index.html                 # App shell with dark theme
    ├── index.js                   # Frontend-adapted MongoMind ESM monitor
    ├── package.json               # Frontend dependencies (React 19, Lucide, Vite)
    ├── vite.config.js             # Vite build configuration
    ├── test_gemini.js             # Frontend-to-Gemini direct tester
    ├── test_index.js              # 5-suite comprehensive automated test runner
    └── src/
        ├── App.jsx                # Main dashboard coordinator
        ├── index.css              # Cyber-surgical dark glassmorphic design system
        ├── components/
            ├── ExecutionLog.jsx   # Self-healing terminal & telemetry console
            ├── Header.jsx         # Status bar, Edge/Cloud badges & Undo controls
            ├── SchemaViewer.jsx   # Interactive visual node graph (3NF Schema)
            ├── TablePreview.jsx   # Before & After tabular comparison
            └── WhiteboardUpload.jsx# Multimodal ER diagram image ingestion
        ├── db/
        │   └── db.js              # Frontend Mongoose helper
        └── services/
            └── api.js             # Centralized API service & Gemini caller
```

---

## ⚡ Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.x or higher)
- [npm](https://www.npmjs.com/) (v10.x or higher)
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
- MongoDB Atlas Connection URI (Optional: default HackOct cluster configured)

---

### 1. Clone the Repository
```bash
git clone https://github.com/GirishGawde/DB-Surgeon.git
cd DB-Surgeon
```

---

### 2. Configure Backend Environment
Navigate into `backend/` and configure `.env`:
```bash
cd backend
npm install
```

Create or verify `backend/.env`:
```env
PORT=3000
MONGO_URL="mongodb+srv://krishnrajshivolkar:krishnrajshivolkarplannora211205@backend.6ujsigm.mongodb.net/HackOct?appName=Backend"
GEMINI_API_KEY="your-gemini-api-key-here"
```

Start the backend server:
```bash
npm start
# Express running on http://localhost:3000
```

---

### 3. Configure Frontend Environment
In a new terminal window, navigate into `frontend/`:
```bash
cd frontend
npm install
```

Create or verify `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_USE_MOCKS=false
VITE_GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_API_KEY="your-gemini-api-key-here"
MONGO_URL="mongodb+srv://krishnrajshivolkar:krishnrajshivolkarplannora211205@backend.6ujsigm.mongodb.net/HackOct?appName=Backend"
```

Start the Vite development server:
```bash
npm run dev
# Dashboard available at http://localhost:5173/
```

---

## 🔑 Environment Variables

| Variable | Location | Description | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | `backend/.env` | Port for Express backend API | `3000` |
| `MONGO_URL` | `backend/.env`, `frontend/.env` | MongoDB Atlas cluster connection URI | `mongodb+srv://...` |
| `GEMINI_API_KEY` | `backend/.env`, `frontend/.env` | Google AI Studio API key | `AIzaSy...` |
| `VITE_API_BASE_URL` | `frontend/.env` | Backend URL for frontend HTTP requests | `http://localhost:3000` |
| `VITE_USE_MOCKS` | `frontend/.env` | Set to `false` for live backend & Gemini reasoning | `false` |
| `VITE_GEMINI_API_KEY`| `frontend/.env` | Vite-exposed key for direct browser fallback | `AIzaSy...` |

---

## 🧪 Automated Testing Suite

The repository includes dedicated test scripts to verify end-to-end integration and API readiness:

### 1. Test MongoMind & Database Integration
Verifies MongoDB Atlas connectivity, collection discovery, monitoring tools, and GenAI reasoning:
```bash
cd frontend
npm run test:index
```
**Expected Output:**
```text
================================================================
   🧪 DB-SURGEON / MONGOMIND: Testing frontend/index.js        
================================================================
[Test 1/5] Checking Environment & Gemini API Key...
  ✅ GEMINI_API_KEY detected
[Test 2/5] Testing MongoDB Connection (initializeDatabase)...
  ✅ Connected to MongoDB successfully. Database: [HackOct]
[Test 3/5] Testing getDatabaseDetails() tool...
  ✅ Found 6 collections in [HackOct]: users, products, orders, payments, reviews, incidents
[Test 4/5] Testing Monitoring Tools Suite...
  ✅ Connections, Activity, Indexes, Slow Queries verified
[Test 5/5] Testing AI Reasoning with Model [gemma-4-26b-a4b-it]...
  ✅ AI Response: "I am your MongoMind DBA assistant..."
================================================================
🎉 ALL TESTS PASSED! (5/5)
================================================================
```

### 2. Test Gemini API Directly
Tests prompt execution on `gemini-2.5-flash`:
```bash
cd frontend
npm run test:gemini "write query for student table"
```

### 3. Verify Frontend Production Build
Validates Vite packaging and syntax integrity:
```bash
cd frontend
npm run build
```

---

## 🔌 API Reference

| Method | Endpoint | Description | Payload Sample |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Server and database health check | *None* |
| `GET` | `/api/status` | Edge/Cloud availability status | *None* |
| `POST` | `/api/command` | Natural language database prompt | `{"message": "write query for restaurant"}` |
| `POST` | `/api/analyze` | 3NF Normalization analysis | `{"rawSchema": "..."}` |
| `POST` | `/api/execute` | Execute physical SQL in sandbox | `{"sql": "CREATE TABLE..."}` |
| `POST` | `/api/rollback`| Time-travel restore to backup | *None* |
| `POST` | `/api/upload-whiteboard` | Multimodal ER diagram ingestion | `{"image_base64": "data:image/..."}` |
| `POST` | `/api/upload-db` | Raw messy SQLite `.db` upload | `multipart/form-data` |

---

## 🎬 Live Demo Walkthrough

Judges Demo Flow (from [`docs/Demo-Script.md`](file:///c:/Users/Girish%20Gawde/OneDrive/Desktop/sem5/Hackathon/DB-Surgeon/docs/Demo-Script.md)):

```
[0:00 - 0:30] The "Garbage Data" Hook
Open the UI at http://localhost:5173/. Showcase the messy raw table view:
repeating addresses, exposed unhashed Aadhar IDs, unindexed foreign keys.

[0:30 - 1:30] Closed-Loop Autonomous Refactoring
Type command: "Normalize this database, separate the users, and mask all PII."
Watch the Self-Healing Terminal:
  🔴 Attempt 1: Dialect syntax error intercepted in sandbox
  🟡 Attempt 2: AI reflects on stack trace and patches SQL
  🟢 Attempt 3: Schema committed and validated against 3NF
View the instant visual node graph generation!

[1:30 - 2:00] The Edge Fallback Flex
Kill the Wi-Fi connection. Issue another command ("Generate 50 rows of localized Goan data").
The top-right badge switches from 🟢 Cloud API to 🟠 Local Edge Node (Ollama), 
proving high availability without single-point failure.

[2:00 - 2:30] The Time-Travel Safety Net
Click the red "Undo Mutation" button.
The physical database instantly reverts back to its pre-mutation snapshot via atomic file swap.
```

---

## 👥 Team & Acknowledgments

Built with ❤️ for **Hacktoberfest Hack Day** at **Don Bosco College of Engineering (DBCE)**.

- **Member 1 (Lead Infrastructure)**: FastAPI / Express execution loop, SQLite sandbox, Time-Travel rollback.
- **Member 2 (AI & Edge Router)**: Google GenAI SDK, Gemma 4 prompting, Ollama fallback, multimodal ER ingestion.
- **Member 3 (Frontend & Integration)**: React 19 UI, Cyber-Surgical design system, Self-Healing telemetry terminal, live API integration.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

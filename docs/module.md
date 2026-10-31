Project Modules & Task Delegation (Updated)

Deadline: 4:30 PM (Hacktoberfest Hack Day, Don Bosco College of Engineering)
Strategy: Parallel development. No team member is blocked by another. Integration at 3:30 PM.

Module 1: The Infrastructure Engine (Backend & Execution)

Assigned to: Team Member 1 (i3 Laptop - Lead Architect)
Tech Stack: Python, FastAPI, SQLite, shutil

Features & Responsibilities:

Closed-Loop SQL Execution: Write the FastAPI server and the cursor.execute() function that takes AI-generated SQL and runs it against the local database.db file.

Self-Healing Error Routing: Wrap the execution in a try/except block. Catch any sqlite3.OperationalError (syntax errors, missing columns) and write the logic to bounce this exact error trace back to the AI router.

"Time-Travel" Rollback System: Create a /rollback endpoint. Use shutil.copy2('database.db', 'backup.db') right before execution, and swap them back if the frontend calls the rollback endpoint.

Data Synthesis & PII Execution: Create the endpoints that will receive the AI's generated dummy data or PII-redacted SQL, and bulk-execute them into the database.

Module 2: The Edge-Cloud AI Intelligence Layer

Assigned to: Team Member 2 (Gaming Laptop - RTX 2050 / 24GB RAM)
Tech Stack: Python, Google GenAI SDK (Gemini API), Ollama, Prompt Engineering

Features & Responsibilities:

High-Availability Hybrid Fallback: Write the Python router that tries the Google Gemini API first. If it fails, use requests.post() to ping the local Ollama instance (OLLAMA_HOST=0.0.0.0 ollama run gemma4:e2b).

Autonomous Data Normalization (Prompting): Write the system prompts that force Gemma 4 to analyze messy CSV/SQL structures and output strict, perfectly formatted 3rd Normal Form SQL.

Autonomous PII Masking Engine: Write the specific prompt logic that instructs the AI to scan row data for names, Aadhar numbers, and phone numbers, and output the SQL to [REDACT] or hash them.

Visual Whiteboard Ingestion (Multimodal): Write the specific multimodal router function that accepts a Base64 image of a whiteboard drawing from the frontend, sends it to Gemma 4, and extracts the SQL schema.

Intelligent Contextual Data Synthesis: Write the prompt that tells the AI to look at column names and generate 100 rows of localized Goan dummy data in bulk INSERT format.

Module 3: The Dry-Run Sandbox (Frontend UI)

Assigned to: Team Member 3
Tech Stack: React, Vite, Tailwind CSS, Axios/Fetch

Features & Responsibilities:

Visual Dry-Run UI: Build a dashboard (using tables or a library like React Flow) that displays the proposed database schema before it executes, with an "Approve & Execute" button.

Time-Travel Controls: Build a prominent, red "Undo Mutation" timeline button that hits Team Member 1's /rollback endpoint.

Whiteboard Upload (Multimodal UI): Build a drag-and-drop file upload zone where users can upload their whiteboard ER-diagram photos or messy .db files.

Status & Network Indicators: Add a live badge in the corner of the UI that dynamically displays "🟢 Connected to Cloud (Gemini API)" or "🟠 Edge Fallback Active (Ollama local)" based on the backend JSON response.

Command Interface: A chat-like input box for plain English database commands (e.g., "Scan for PII and mask it" or "Generate dummy data for the users table").

Integration Plan (3:30 PM)

Teammate 2 sends the Hybrid AI Router file to Teammate 1.

Teammate 1 drops the router logic into the FastAPI main.py execution loop.

Teammate 3 updates Axios base URLs from localhost to Teammate 1's IPv4 address.

Final End-to-End Test: Upload a dummy file, trigger the self-healing loop, and test the Time-Travel rollback.
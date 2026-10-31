System Architecture: DB-Surgeon

This document outlines the High-Availability Hybrid Edge-Cloud Architecture for the DB-Surgeon Autonomous DBA Agent.

1. High-Level Flow (Mermaid Diagram)

graph TD
    %% Define Nodes
    UI[React/Vite Frontend]
    API[FastAPI Backend - i3 Laptop]
    DB[(Local SQLite DB)]
    BAK[(Backup shadow.db)]
    CLOUD[Google Cloud - Gemini API / Gemma 4]
    EDGE[Gaming Laptop - Ollama gemma4:e4b]

    %% User Interaction
    UI -- 1. Uploads Messy DB / Prompt --> API
    API -- 2. shutil clone --> BAK
    
    %% AI Routing
    API -- 3a. Primary Route (Cloud) --> CLOUD
    API -- 3b. Fallback Route (Local Network) --> EDGE
    CLOUD -- 4. Generates SQL --> API
    EDGE -- 4. Generates SQL --> API

    %% Execution & Self-Healing
    API -- 5. cursor.execute() --> DB
    DB -- 6a. Success --> API
    DB -- 6b. sqlite3.OperationalError --> API
    API -. 7. Loops Error back to AI .-> CLOUD
    
    %% UI Update
    API -- 8. Returns Normalized Data/Schema --> UI
    UI -. 9. 'Undo' triggers hot-swap .-> BAK


2. Component Breakdown

A. The Client (React / Vite)

Role: User Interface & Dry-Run Sandbox.

Functions: Handles .db file uploads, accepts natural language prompts, displays "Before & After" schema node graphs, and contains the "Undo" timeline button for safe execution.

B. The Infrastructure Engine (FastAPI - Python)

Role: The core execution and routing layer (Hosted on the i3 Laptop).

Functions:

Time-Travel Backup: Uses Python's shutil.copy2() to instantly clone the SQLite database before any mutation.

Hybrid AI Router: Attempts to call the Gemini API. Catching any 429 Rate Limit or 500 errors, it silently redirects the prompt over the local network (IPv4) to the edge node.

Execution Loop: Strips markdown from the AI response, extracts raw SQL, and runs cursor.execute().

Self-Healing: Catches database engine stack traces and loops them back to the AI for autonomous syntax correction (Max Retries: 3).

C. The AI Nodes (Gemma 4)

Primary Node (Cloud): Uses the Gemini API for Gemma 4's maximum parameter reasoning (256K context) to handle complex 3rd Normal Form schema structuring and multimodal ER-diagram processing.

Edge Node (Local Fallback): Runs gemma4:e4b or e2b via Ollama on a teammate's RTX 2050 (4GB VRAM / 24GB RAM) gaming laptop. Ensures the system operates entirely offline if cloud API tokens are exhausted.

D. The Storage Layer (SQLite)

Role: The target infrastructure.

Why SQLite: Zero-configuration, file-based database that allows for instant I/O backups and blazing fast local SQL execution during the hackathon demo.
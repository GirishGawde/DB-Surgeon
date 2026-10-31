🔌 DB-Surgeon API Documentation

This document outlines the core FastAPI endpoints that drive the DB-Surgeon infrastructure engine.

Base URL: http://localhost:8000

1. POST /api/v1/agent/execute

The core agentic loop. Receives a natural language command, routes it to the Gemma 4 hybrid engine, and executes the resulting SQL on the local database.

Request Body (JSON):

{
  "command": "Normalize the users table and hash all Aadhar numbers.",
  "dry_run": false
}


Response (Success):

{
  "status": "success",
  "ai_source": "Cloud (Gemini API)",
  "execution_loops": 2,
  "sql_executed": "CREATE TABLE ...",
  "rows_affected": 450
}


2. POST /api/v1/db/rollback

Triggers the Time-Travel state manager. Replaces the current database.db with backup.db using Python's shutil.

Request Body: None

Response:

{
  "status": "success",
  "message": "Database rolled back to previous state successfully."
}


3. POST /api/v1/db/upload-whiteboard

Accepts a Base64 image of an ER-Diagram and passes it to the Multimodal Gemma 4 Vision router to generate schema infrastructure.

Request Body (JSON):

{
  "image_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA..."
}

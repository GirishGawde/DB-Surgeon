"""
DB-Surgeon AI Engine: Prompts & Output Sanitization
Contains specialized prompt templates for 3NF Normalization, PII Redaction,
Goan Data Synthesis, Multimodal Whiteboard ER-Diagram Ingestion, and
Autonomous Self-Healing SQL Correction.
"""

import json
import re
from typing import Dict, Any, Optional


def clean_sql_output(raw_text: str) -> str:
    """
    Cleans and extracts raw, executable SQLite SQL statements from model output.
    Strips reasoning blocks (<think>...</think>), markdown code fences, and introductory banter.
    """
    if not raw_text:
        return ""

    text = raw_text.strip()

    # 1. Remove thinking / reasoning blocks (e.g., Gemma 4 / DeepSeek / Ollama thinking tokens)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    text = re.sub(r"<thought>.*?</thought>", "", text, flags=re.DOTALL)

    # 2. Extract content from markdown code fences if present (```sql / ```sqlite ... ``` or ``` ...)
    fence_match = re.search(r"```(?:sql|sqlite)?\s*([\s\S]*?)\s*```", text, flags=re.IGNORECASE)
    if fence_match:
        text = fence_match.group(1).strip()
    else:
        # If open fence without closing fence
        text = re.sub(r"^```(?:sql|sqlite)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"```\s*$", "", text)

    # 3. Strip common introductory or conclusion phrases
    lines = text.splitlines()
    sql_lines = []
    sql_keywords = (
        "CREATE", "INSERT", "UPDATE", "DELETE", "ALTER", "DROP", "SELECT",
        "PRAGMA", "BEGIN", "COMMIT", "ROLLBACK", "WITH", "--", "/*"
    )

    started = False
    for line in lines:
        stripped = line.strip()
        if not started:
            upper_line = stripped.upper()
            if any(upper_line.startswith(kw) for kw in sql_keywords):
                started = True
                sql_lines.append(line)
        else:
            # Check if this line is an English summary line after SQL ended
            if stripped.startswith("Explanation:") or stripped.startswith("Note:") or stripped.startswith("This SQL"):
                break
            sql_lines.append(line)

    if sql_lines:
        text = "\n".join(sql_lines).strip()

    # 4. Final trim
    return text.strip()


def _format_payload_context(payload: Dict[str, Any]) -> str:
    """Helper to format table profile, schema, and sample rows nicely."""
    if not payload:
        return "No schema or row data provided."

    parts = []
    if "table_name" in payload:
        parts.append(f"Target Table: {payload['table_name']}")
    if "schema" in payload:
        parts.append(f"Current Schema:\n{json.dumps(payload['schema'], indent=2) if isinstance(payload['schema'], (dict, list)) else payload['schema']}")
    if "columns" in payload:
        parts.append(f"Columns: {payload['columns']}")
    if "sample_rows" in payload:
        parts.append(f"Sample Rows:\n{json.dumps(payload['sample_rows'], indent=2) if isinstance(payload['sample_rows'], (dict, list)) else payload['sample_rows']}")
    if "profile" in payload:
        parts.append(f"Table Profile:\n{json.dumps(payload['profile'], indent=2) if isinstance(payload['profile'], (dict, list)) else payload['profile']}")
    if "command" in payload:
        parts.append(f"User Command: {payload['command']}")
    if "message" in payload:
        parts.append(f"Message: {payload['message']}")

    if not parts:
        # Fallback dump
        return json.dumps(payload, indent=2)

    return "\n\n".join(parts)


def build_normalization_prompt(payload: Dict[str, Any]) -> str:
    """Prompt to force Gemma 4 to produce strict 3rd Normal Form (3NF) relational SQL."""
    context = _format_payload_context(payload)
    return f"""You are DB-Surgeon, an expert Autonomous Database Administrator (DBA).
Analyze the following unnormalized, messy database structure and sample rows:

{context}

YOUR TASK:
1. Decompose this messy structure into strict 3rd Normal Form (3NF) relational tables.
2. Eliminate redundant/repeating columns by creating normalized parent-child entity tables.
3. Generate valid SQLite DDL (CREATE TABLE IF NOT EXISTS ...) with proper PRIMARY KEYs, data types, and FOREIGN KEY constraints.
4. Generate data migration queries (INSERT OR IGNORE INTO ... SELECT ...) to migrate existing data into the normalized relational tables.

STRICT REQUIREMENTS:
- Think briefly and concisely in less than 35 words.
- Output ONLY valid, executable SQLite SQL statements separated by semicolons.
- Do NOT wrap output in markdown code blocks (no ```sql).
- Do NOT include any explanations, markdown headers, or preamble.
- Output executable SQLite SQL statements only."""


def build_pii_prompt(payload: Dict[str, Any]) -> str:
    """Prompt to scan rows for PII (Aadhar, phone, names, emails) and output masking SQL."""
    context = _format_payload_context(payload)
    return f"""You are DB-Surgeon, an expert Cybersecurity & Database Administration Agent.
Analyze the following database schema and sample records for Personally Identifiable Information (PII):

{context}

YOUR TASK:
1. Scan for sensitive PII: 12-digit Indian Aadhar numbers, Indian phone numbers (+91), email addresses, and full names.
2. Generate SQLite UPDATE queries to safely mask and redact sensitive columns:
   - For Aadhar numbers: Mask all except the last 4 digits (e.g. 'XXXX-XXXX-' || SUBSTR(aadhar_column, -4)).
   - For Phone numbers: Mask middle digits (e.g. '+91-XXXXX' || SUBSTR(phone_column, -5)).
   - For Emails / sensitive data: Mask or redact (e.g. 'user_' || id || '@redacted.local' or '[REDACTED]').
3. Ensure the SQL is completely safe, idempotent, and updates the existing tables directly.

STRICT REQUIREMENTS:
- Think briefly and concisely in less than 35 words.
- Output ONLY valid, executable SQLite SQL statements.
- Do NOT include markdown code blocks (no ```sql).
- Do NOT include conversational text or explanations.
- Output raw SQLite SQL statements only."""


def build_synthesize_prompt(payload: Dict[str, Any]) -> str:
    """Prompt to generate 15-25 rows of authentic localized Goan dummy data."""
    context = _format_payload_context(payload)
    return f"""You are DB-Surgeon, an Autonomous Database Administrator Agent.
Analyze the target table schema and columns:

{context}

YOUR TASK:
Generate 15 to 25 rows of authentic, localized Goan dummy data formatted as bulk SQLite INSERT statements.

LOCALIZATION GUIDELINES (GOA, INDIA):
- Names: Use genuine Goan Christian and Hindu names (e.g., Savio Fernandes, Pooja Naik, Rahul Kamat, Maria D'Souza, Amit Prabhu, Shreya Shenvi, Rohan Borkar, Fatima Pinto, Aniketh Gaonkar, Cleofato Coutinho).
- Cities/Locations: Use Goan towns and villages (Panaji, Margao, Vasco da Gama, Mapusa, Ponda, Calangute, Porvorim, Bicholim, Candolim, Curtorim).
- Contact: Use realistic Indian mobile numbers (+91-9822..., +91-9423...).
- Dates and numerical data must match the schema data types and constraints.

STRICT REQUIREMENTS:
- Format as bulk: INSERT INTO <target_table> (<columns>) VALUES (...), (...);
- Output ONLY executable SQLite SQL statements.
- Do NOT wrap in markdown fences (no ```sql).
- Do NOT output internal thinking or conversational commentary.
- Raw SQL only."""


def build_whiteboard_prompt() -> str:
    """Prompt for multimodal vision to extract ER diagram from a hand-drawn whiteboard photo."""
    return """You are DB-Surgeon's Multimodal Database Architect.
Analyze the provided photograph of a hand-drawn Entity-Relationship (ER) whiteboard diagram.

YOUR TASK:
1. Visually identify all entity boxes/tables, their names, and enclosed attributes/columns.
2. Identify Primary Keys (underlined or marked PK) and Foreign Keys (marked FK or connecting lines).
3. Determine relationship cardinalities (1:1, 1:Many, Many:Many) and associative junction tables.
4. Generate the complete, production-ready SQLite DDL schema:
   - CREATE TABLE IF NOT EXISTS statements.
   - Correct SQLite data types (INTEGER, TEXT, REAL, BLOB).
   - PRIMARY KEY and FOREIGN KEY (col) REFERENCES parent(col) constraints.

STRICT REQUIREMENTS:
- Think briefly and concisely in less than 35 words.
- Output ONLY executable SQLite SQL statements separated by semicolons.
- Do NOT include markdown code fences (no ```sql).
- Do NOT include conversational text or explanations.
- Output raw SQLite DDL only."""


def build_error_healing_prompt(failed_sql: str, error_trace: str, task: str, payload: Dict[str, Any]) -> str:
    """Self-healing prompt to feed the SQLite error trace back to Gemma 4 for autonomous correction."""
    context = _format_payload_context(payload)
    return f"""You are DB-Surgeon's Autonomous Self-Healing Database Engine.
A previously generated SQLite SQL statement failed execution with an operational error.

ORIGINAL GOAL / TASK:
{task}

FAILED SQL:
{failed_sql}

SQLITE ERROR TRACE:
{error_trace}

DATABASE CONTEXT:
{context}

YOUR MISSION:
1. Diagnose the exact SQLite error (e.g. syntax error, missing column, table already exists, foreign key violation, unescaped string).
2. Correct the SQL statements so they execute cleanly in SQLite while satisfying the original goal.
3. If a table or column name was misspelled, correct it using the database context.

STRICT REQUIREMENTS:
- Output ONLY the corrected, executable SQLite SQL statements.
- Do NOT include markdown code blocks (no ```sql).
- Do NOT include explanations, apologies, or comments.
- Raw SQLite SQL only."""


def build_general_command_prompt(command: str, payload: Dict[str, Any]) -> str:
    """Prompt for plain English natural language database commands."""
    context = _format_payload_context(payload)
    return f"""You are DB-Surgeon, an Autonomous Database Administrator (DBA) agent.
The user issued the following database command:
"{command}"

DATABASE CONTEXT:
{context}

YOUR TASK:
Translate this natural language command into safe, valid, executable SQLite SQL statements.

STRICT REQUIREMENTS:
- Think briefly and concisely in less than 35 words.
- Output ONLY valid SQLite SQL statements.
- Do NOT wrap in markdown code blocks (no ```sql).
- Do NOT include explanations or preamble.
- Raw SQL only."""

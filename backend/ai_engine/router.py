"""
DB-Surgeon AI Engine: Hybrid Edge-Cloud Router
High-Availability Hybrid Fallback Router:
- Primary: Google Cloud Gemini API (fastest, high parameter reasoning)
- Edge Node Fallback: Local Network / Gaming Laptop Ollama (Gemma 4: gemma4:e4b)

Ensures zero downtime: if Wi-Fi drops, API tokens run out, or 429/500 occurs,
the router seamlessly redirects reasoning to the local Ollama instance.
"""

import os
import sys
import logging
import requests
from typing import Dict, Any, Optional

from .prompts import (
    clean_sql_output,
    build_normalization_prompt,
    build_pii_prompt,
    build_synthesize_prompt,
    build_whiteboard_prompt,
    build_error_healing_prompt,
    build_general_command_prompt,
)
from .multimodal import (
    extract_clean_base64,
    decode_image,
    detect_mime_type,
    format_for_ollama,
)

logger = logging.getLogger("db_surgeon.ai_engine")
logging.basicConfig(level=logging.INFO)


def _get_ollama_base_url() -> str:
    """Resolves the Ollama base URL honoring environment variables."""
    base_url = os.getenv("OLLAMA_BASE_URL")
    if base_url:
        return base_url.rstrip("/")

    host = os.getenv("OLLAMA_HOST", "localhost").strip()
    # When binding to 0.0.0.0 locally, client requests must connect to localhost / 127.0.0.1
    if host in ("0.0.0.0", ""):
        host = "localhost"

    port = os.getenv("OLLAMA_PORT", "11434").strip()
    return f"http://{host}:{port}"


def _resolve_ollama_model(base_url: str) -> str:
    """
    Resolves the exact model name in Ollama.
    Supports user config OLLAMA_MODEL (defaults to gemma4:e4b),
    and gracefully handles slight typos (e.g. gemma4:eb4 vs gemma4:e4b).
    """
    configured_model = os.getenv("OLLAMA_MODEL", "gemma4:e4b").strip()
    try:
        resp = requests.get(f"{base_url}/api/tags", timeout=2)
        if resp.status_code == 200:
            available_models = [m.get("name", "") for m in resp.json().get("models", [])]
            if configured_model in available_models:
                return configured_model
            
            # Check for close match like gemma4:e4b when configured as gemma4:eb4 or vice-versa
            clean_cfg = configured_model.replace("eb4", "e4b")
            if clean_cfg in available_models:
                return clean_cfg

            # Check for any gemma4 variant
            for m in available_models:
                if "gemma4" in m or "gemma" in m:
                    return m
    except Exception:
        pass

    return configured_model


def get_provider_status() -> Dict[str, Any]:
    """
    Health check contract for Member 1 and Member 3:
    GET /api/status -> {"active": "gemini"|"ollama", "online": True}
    Returns dynamic status indicator for the UI badge:
    🟢 Connected to Cloud (Gemini) or 🟠 Edge Fallback Active (Ollama)
    """
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    ollama_url = _get_ollama_base_url()
    ollama_online = False
    active_ollama_model = None

    # 1. Test local edge node (Ollama)
    try:
        resp = requests.get(f"{ollama_url}/api/tags", timeout=2)
        if resp.status_code == 200:
            ollama_online = True
            active_ollama_model = _resolve_ollama_model(ollama_url)
    except Exception:
        ollama_online = False

    # 2. Check Cloud Gemini availability
    gemini_online = False
    if gemini_key and not gemini_key.startswith("your_"):
        try:
            # Quick connectivity check to Google API endpoint
            ping_resp = requests.get("https://generativelanguage.googleapis.com", timeout=2)
            # Any HTTP status response (even 404/403) confirms internet connectivity to Google
            gemini_online = True
        except Exception:
            gemini_online = False

    if gemini_online:
        active = "gemini"
        online = True
    elif ollama_online:
        active = "ollama"
        online = True
    else:
        active = "none"
        online = False

    return {
        "active": active,
        "active_provider": active,
        "online": online,
        "gemini_available": gemini_online,
        "ollama_available": ollama_online,
        "ollama_model": active_ollama_model or "gemma4:e4b",
    }


def _call_gemini(prompt: str, image_b64: Optional[str] = None) -> str:
    """Attempts generation via Google GenAI SDK (Gemini API)."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key.startswith("your_"):
        raise ValueError("GEMINI_API_KEY is not configured.")

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    contents = []
    if image_b64:
        clean_b64 = extract_clean_base64(image_b64)
        if clean_b64:
            img_bytes = decode_image(clean_b64)
            mime_type = detect_mime_type(image_b64)
            image_part = types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
            contents.append(image_part)

    contents.append(prompt)

    response = client.models.generate_content(
        model=model_name,
        contents=contents,
        config=types.GenerateContentConfig(
            temperature=0.1,
        ),
    )

    if not response or not response.text:
        raise RuntimeError("Empty response received from Gemini API.")

    return response.text


def _call_ollama(prompt: str, image_b64: Optional[str] = None) -> str:
    """Executes SQL generation via the local Edge Node (Ollama / Gemma 4)."""
    base_url = _get_ollama_base_url()
    model_name = _resolve_ollama_model(base_url)

    timeout_seconds = int(os.getenv("OLLAMA_TIMEOUT", "300"))
    num_predict = int(os.getenv("OLLAMA_NUM_PREDICT", "1024"))

    request_body: Dict[str, Any] = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": num_predict,
        },
    }

    if image_b64:
        images = format_for_ollama(image_b64)
        if images:
            request_body["images"] = images

    logger.info(f"[AI Router] Dispatching to Local Edge Node (Ollama model={model_name} url={base_url})")

    resp = requests.post(
        f"{base_url}/api/generate",
        json=request_body,
        timeout=timeout_seconds,
    )

    if resp.status_code != 200:
        raise RuntimeError(f"Ollama returned HTTP {resp.status_code}: {resp.text}")

    result_json = resp.json()
    response_text = result_json.get("response", "")
    if not response_text:
        raise RuntimeError("Ollama returned an empty response.")

    return response_text


def generate_sql_from_ai(task: str, payload: Dict[str, Any], error_trace: Optional[str] = None) -> Dict[str, str]:
    """
    Main entry point for DB-Surgeon AI operations (Agreement 1).
    Parameters:
      - task: 'normalize' | 'pii' | 'synthesize' | 'whiteboard' | or custom natural language command
      - payload: table profile + sample rows (or {'image_b64': '...'} for whiteboard)
      - error_trace: the sqlite error text when asking the AI to self-heal its own SQL
    Returns:
      - {'sql': '<clean executable SQLite SQL>', 'provider': 'gemini' | 'ollama'}
    """
    payload = payload or {}
    image_b64 = payload.get("image_b64") or payload.get("image_base64")

    # 1. Build appropriate prompt based on task & error_trace
    if error_trace:
        failed_sql = payload.get("failed_sql") or payload.get("sql") or ""
        prompt = build_error_healing_prompt(
            failed_sql=failed_sql,
            error_trace=error_trace,
            task=task,
            payload=payload,
        )
    elif task == "normalize":
        prompt = build_normalization_prompt(payload)
    elif task == "pii":
        prompt = build_pii_prompt(payload)
    elif task == "synthesize":
        prompt = build_synthesize_prompt(payload)
    elif task == "whiteboard":
        prompt = build_whiteboard_prompt()
    else:
        # Natural language command (e.g. from /api/command or command box)
        command_text = payload.get("command") or payload.get("message") or task
        prompt = build_general_command_prompt(command_text, payload)

    # 2. Route with Hybrid Failover: Cloud (Gemini) -> Edge (Ollama)
    raw_output = None
    provider_used = "gemini"

    # Try Primary Cloud Route (Gemini)
    try:
        raw_output = _call_gemini(prompt, image_b64=image_b64)
        provider_used = "gemini"
        logger.info("[AI Router] Successfully generated SQL via Cloud Gemini.")
    except Exception as gemini_err:
        logger.warning(
            f"[AI Router] Primary Gemini route unavailable or failed ({gemini_err}). "
            "Failing over to Edge Node (Ollama gemma4:e4b)..."
        )
        try:
            raw_output = _call_ollama(prompt, image_b64=image_b64)
            provider_used = "ollama"
            logger.info("[AI Router] Successfully generated SQL via Local Edge Node (Ollama).")
        except Exception as ollama_err:
            logger.error(f"[AI Router] Edge node fallback also failed: {ollama_err}")
            raise RuntimeError(
                f"Both Primary Cloud (Gemini) and Edge Fallback (Ollama) failed. "
                f"Gemini error: {gemini_err}. Ollama error: {ollama_err}"
            )

    # 3. Clean and sanitize the SQL output (stripping markdown fences, comments, thinking tags)
    clean_sql = clean_sql_output(raw_output)

    return {
        "sql": clean_sql,
        "provider": provider_used,
    }

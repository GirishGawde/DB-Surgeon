"""
DB-Surgeon: Edge-Cloud AI Intelligence Layer (Member 2)
Provides autonomous SQL generation, self-healing SQL execution correction,
and high-availability fallback between Gemini API and local Ollama (Gemma 4: gemma4:e4b).
"""

from .router import generate_sql_from_ai, get_provider_status
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
    validate_image,
    format_for_ollama,
)

__all__ = [
    "generate_sql_from_ai",
    "get_provider_status",
    "clean_sql_output",
    "build_normalization_prompt",
    "build_pii_prompt",
    "build_synthesize_prompt",
    "build_whiteboard_prompt",
    "build_error_healing_prompt",
    "build_general_command_prompt",
    "extract_clean_base64",
    "decode_image",
    "detect_mime_type",
    "validate_image",
    "format_for_ollama",
]

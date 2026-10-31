"""
DB-Surgeon AI Engine: Multimodal Module
Handles Base64 image decoding, validation, and format preparation for
visual whiteboard ER-diagram ingestion across Gemini and Ollama edge nodes.
"""

import base64
import io
import re
from typing import Tuple, List, Optional
try:
    from PIL import Image
except ImportError:
    Image = None


def extract_clean_base64(image_input: str) -> str:
    """
    Strips data URI prefix (e.g., 'data:image/png;base64,') and whitespace
    to return pure Base64 encoded string.
    """
    if not image_input:
        return ""
    
    cleaned = image_input.strip()
    if "," in cleaned and cleaned.startswith("data:"):
        cleaned = cleaned.split(",", 1)[1]
    
    # Remove any stray newlines or whitespace
    return re.sub(r"\s+", "", cleaned)


def detect_mime_type(image_input: str) -> str:
    """
    Detects mime type from data URI or inspects image bytes.
    Defaults to 'image/png'.
    """
    if image_input and image_input.startswith("data:"):
        match = re.match(r"data:([^;]+);base64,", image_input.strip())
        if match:
            return match.group(1).lower()

    # Try decoding a small header
    try:
        raw_b64 = extract_clean_base64(image_input)
        raw_bytes = base64.b64decode(raw_b64[:64])
        if raw_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        elif raw_bytes.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
        elif raw_bytes.startswith(b"GIF87a") or raw_bytes.startswith(b"GIF89a"):
            return "image/gif"
        elif raw_bytes.startswith(b"RIFF") and b"WEBP" in raw_bytes[:16]:
            return "image/webp"
    except Exception:
        pass

    return "image/png"


def decode_image(image_input: str) -> bytes:
    """
    Decodes a Base64 string into raw image bytes.
    """
    clean_b64 = extract_clean_base64(image_input)
    if not clean_b64:
        raise ValueError("Empty or invalid image base64 input provided.")
    return base64.b64decode(clean_b64)


def validate_image(image_input: str) -> Tuple[bool, Optional[str]]:
    """
    Validates that the provided Base64 string represents a valid image.
    Returns (is_valid, error_message).
    """
    try:
        raw_bytes = decode_image(image_input)
        if len(raw_bytes) < 10:
            return False, "Image payload is too small to be valid."
        
        if Image is not None:
            with Image.open(io.BytesIO(raw_bytes)) as img:
                img.verify()
        return True, None
    except Exception as e:
        return False, f"Invalid image format: {str(e)}"


def format_for_ollama(image_input: str) -> List[str]:
    """
    Returns the list of base64 strings required by Ollama's vision API
    (e.g., {'images': ['<base64_str>']}).
    """
    clean_b64 = extract_clean_base64(image_input)
    return [clean_b64] if clean_b64 else []

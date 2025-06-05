from flask import Flask, request, jsonify, Response, stream_with_context
import requests
import os
import json
import logging
from functools import wraps
from datetime import datetime
from logging.handlers import RotatingFileHandler

# Configuration
API_KEYS_FILE = os.environ.get("API_KEYS_FILE", "caddy_apikeys.json")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
AUDIT_LOG_FILE = os.environ.get("AUDIT_LOG_FILE", "/var/log/ai-gateway/audit.log")

# Setup application logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Setup dedicated audit logging for security events
audit_logger = logging.getLogger('ai_gateway_audit')
audit_logger.setLevel(logging.INFO)

# Create audit log directory if it doesn't exist
os.makedirs(os.path.dirname(AUDIT_LOG_FILE), exist_ok=True)

# Create rotating file handler for audit logs (10MB max, keep 5 files)
audit_handler = RotatingFileHandler(
    AUDIT_LOG_FILE,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
audit_formatter = logging.Formatter(
    '%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S UTC'
)
audit_handler.setFormatter(audit_formatter)
audit_logger.addHandler(audit_handler)

def log_request_event(event_type, endpoint, method, ip_address, key_info=None, key_partial=None, status_code=None):
    """
    Log security-relevant request events to audit log.

    Args:
        event_type (str): Type of event (AUTHORIZED, UNAUTHORIZED, ERROR)
        endpoint (str): The requested endpoint
        method (str): HTTP method
        ip_address (str): Client IP address
        key_info (dict, optional): Key metadata for authorized requests
        key_partial (str, optional): Partial key for unauthorized requests
        status_code (int, optional): HTTP response status code
    """
    try:
        log_data = {
            'event': event_type,
            'method': method,
            'endpoint': endpoint,
            'client_ip': ip_address or 'unknown',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }

        if key_info:
            log_data.update({
                'user': key_info.get('user', 'unknown'),
                'service': key_info.get('service', 'unknown'),
                'key_created': key_info.get('created_at', 'unknown')
            })

        if key_partial:
            log_data['key_partial'] = key_partial

        if status_code:
            log_data['status_code'] = status_code

        # Format log message
        if event_type == "AUTHORIZED":
            message = f"AUTHORIZED | {method} {endpoint} | User: {log_data.get('user', 'unknown')} | Service: {log_data.get('service', 'unknown')} | IP: {log_data['client_ip']}"
        elif event_type == "UNAUTHORIZED":
            key_info_str = f" | Key: {key_partial}" if key_partial else ""
            message = f"UNAUTHORIZED | {method} {endpoint} | IP: {log_data['client_ip']}{key_info_str}"
        else:
            message = f"{event_type} | {method} {endpoint} | IP: {log_data['client_ip']} | Status: {status_code}"

        audit_logger.info(message)

    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")

app = Flask(__name__)

class APIKeyValidator:
    """Centralized API key validation with caching and logging."""

    def __init__(self, keys_file):
        self.keys_file = keys_file
        self._keys_cache = None
        self._last_modified = None

    def _load_keys(self):
        """Load API keys with file modification check for cache invalidation."""
        try:
            file_stat = os.path.getmtime(self.keys_file)

            # Reload if file changed or cache is empty
            if self._last_modified != file_stat or self._keys_cache is None:
                with open(self.keys_file, "r") as f:
                    self._keys_cache = json.load(f)
                self._last_modified = file_stat
                logger.info(f"API keys reloaded from {self.keys_file}")

            return self._keys_cache
        except Exception as e:
            logger.error(f"Failed to load API keys from {self.keys_file}: {e}")
            return {}

    def is_valid_key(self, key):
        """Validate API key and return key metadata if valid."""
        if not key or not key.strip():
            return False, None

        keys = self._load_keys()
        key = key.strip()

        if key in keys:
            key_info = keys[key]
            logger.info(f"Valid API key used - User: {key_info.get('user', 'unknown')}, "
                       f"Service: {key_info.get('service', 'unknown')}")
            return True, key_info

        logger.warning(f"Invalid API key attempted: {key[:8]}...")
        return False, None

# Initialize validator
api_validator = APIKeyValidator(API_KEYS_FILE)

def require_api_key(f):
    """
    Decorator to require valid API key for route access.

    Usage:
        @app.route('/protected/endpoint')
        @require_api_key
        def protected_function():
            # Access key_info via g.key_info if needed
            return jsonify({"message": "success"})
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get("X-API-Key", "")
        endpoint = request.path
        method = request.method
        client_ip = request.remote_addr

        is_valid, key_info = api_validator.is_valid_key(api_key)
        if not is_valid:
            # Log unauthorized access attempt
            key_partial = api_key[:8] + "..." if api_key and len(api_key) > 8 else "missing"
            log_request_event("UNAUTHORIZED", endpoint, method, client_ip, key_partial=key_partial, status_code=401)

            logger.warning(f"Unauthorized access attempt to {request.endpoint} from {request.remote_addr}")
            return jsonify({
                "error": "Unauthorized",
                "message": "Valid API key required"
            }), 401

        # Log authorized access
        log_request_event("AUTHORIZED", endpoint, method, client_ip, key_info=key_info)

        # Store key info in Flask's g context for use in route handlers
        from flask import g
        g.key_info = key_info

        return f(*args, **kwargs)

    return decorated_function


def proxy_request(target_url, timeout=60):
    """
    Generic request proxy function with proper streaming and error handling.
    """

    try:
        # Filter headers (remove hop-by-hop headers)
        headers = {k: v for k, v in request.headers if k.lower() not in
                  ['host', 'connection', 'upgrade', 'proxy-authenticate', 'proxy-authorization']}

        # Choose method and stream the request
        if request.method == 'GET':
            resp = requests.get(target_url, headers=headers, params=request.args, timeout=timeout, stream=True)
        elif request.method == 'POST':
            resp = requests.post(target_url, headers=headers, json=request.json, timeout=timeout, stream=True)
        elif request.method == 'PUT':
            resp = requests.put(target_url, headers=headers, json=request.json, timeout=timeout, stream=True)
        elif request.method == 'DELETE':
            resp = requests.delete(target_url, headers=headers, timeout=timeout, stream=True)
        else:
            return jsonify({"error": "Method not allowed"}), 405

        logger.info(f"Proxied {request.method} {request.path} -> {target_url} (Status: {resp.status_code})")

        # Filter headers and stream response content
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        response_headers = {
            name: value for name, value in resp.headers.items()
            if name.lower() not in excluded_headers
        }

        return Response(
            stream_with_context(resp.iter_content(chunk_size=4096)),
            status=resp.status_code,
            headers=response_headers
        )


    except requests.exceptions.Timeout:
        logger.error(f"Timeout proxying request to {target_url}")
        return jsonify({"error": "Service timeout", "message": "The upstream service did not respond in time"}), 504
    except requests.exceptions.ConnectionError:
        logger.error(f"Connection error proxying request to {target_url}")
        return jsonify({"error": "Service unavailable", "message": "Could not connect to upstream service"}), 503
    except Exception as e:
        logger.error(f"Error proxying request to {target_url}: {str(e)}")
        return jsonify({"error": "Internal server error", "message": "Proxy error occurred"}), 500

# =============================================================================
# PROTECTED ROUTES - All routes below require valid API keys
# =============================================================================

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ 🤖 CHAT/LLM GENERATION ROUTES                                           │
# └─────────────────────────────────────────────────────────────────────────┘

@app.route("/chat/api/generate", methods=["POST"])
@require_api_key
def chat_generate():
    """
    🤖 OLLAMA CHAT GENERATION ENDPOINT

    Proxies POST requests to Ollama's text generation API for single-turn conversations.
    Expects JSON payload with model, prompt, and generation parameters.

    Target: Ollama service running on host.docker.internal:11434
    Authentication: Required (X-API-Key header)
    """
    return proxy_request("http://host.docker.internal:11434/api/generate")


@app.route("/chat/api/chat", methods=["POST"])
@require_api_key
def chat_conversation():
    """
    💬 OLLAMA CHAT CONVERSATION ENDPOINT

    Proxies POST requests to Ollama's chat API for multi-turn conversations.
    Supports conversation history and context management.

    Target: Ollama service running on localhost:11434
    Authentication: Required (X-API-Key header)
    """
    return proxy_request("http://localhost:11434/api/chat")

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ 🔊 TEXT-TO-SPEECH ROUTES                                                │
# └─────────────────────────────────────────────────────────────────────────┘

@app.route("/tts/api/speak", methods=["POST"])
@require_api_key
def tts_speak():
    """
    🔊 TEXT-TO-SPEECH GENERATION ENDPOINT

    Proxies POST requests to Edge-TTS service for speech synthesis.
    Converts text input to audio output in various voices and languages.

    Target: Edge-TTS service running in Docker container on port 8090
    Authentication: Required (X-API-Key header)
    Returns: Audio stream (typically MP3 format)
    """
    return proxy_request("http://edge-tts:8090/speak")

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ 🎨 IMAGE GENERATION ROUTES                                              │
# └─────────────────────────────────────────────────────────────────────────┘

@app.route("/image/api/generate", methods=["POST"])
@require_api_key
def image_generate():
    """
    🎨 IMAGE GENERATION ENDPOINT

    Proxies POST requests to image generation service (e.g., Stable Diffusion).
    Creates images from text prompts with various styling parameters.

    Target: Image generation service on localhost:8091
    Authentication: Required (X-API-Key header)
    Returns: Generated image data or image URL
    """
    return proxy_request("http://localhost:8091/generate")

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ 🎙️ SPEECH-TO-TEXT ROUTES                                                │
# └─────────────────────────────────────────────────────────────────────────┘

@app.route("/whisper/api/transcribe", methods=["POST"])
@require_api_key
def whisper_transcribe():
    """
    🎙️ SPEECH-TO-TEXT TRANSCRIPTION ENDPOINT

    Proxies POST requests to Whisper transcription service.
    Converts audio files to text with support for multiple languages.

    Target: Whisper service running on localhost:8092
    Authentication: Required (X-API-Key header)
    Expects: Audio file in request (WAV, MP3, etc.)
    Returns: Transcribed text with confidence scores
    """
    return proxy_request("http://localhost:8092/transcribe")

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ 📝 ADD NEW ROUTES HERE                                                  │
# └─────────────────────────────────────────────────────────────────────────┘
#
# To add a new protected route, follow this format:
#
# # ┌─────────────────────────────────────────────────────────────────────────┐
# # │ 🔧 YOUR SERVICE CATEGORY ROUTES                                         │
# # └─────────────────────────────────────────────────────────────────────────┘
#
# @app.route("/your-service/api/endpoint", methods=["POST"])
# @require_api_key
# def your_function_name():
#     """
#     🔧 YOUR ENDPOINT DESCRIPTION
#
#     Brief description of what this endpoint does.
#     Include any special requirements or parameters.
#
#     Target: Your service running on localhost:PORT
#     Authentication: Required (X-API-Key header)
#     Expects: Description of expected input
#     Returns: Description of response format
#     """
#     return proxy_request("http://localhost:PORT/endpoint")
#
# For public routes (no authentication), omit the @require_api_key decorator
# and add appropriate logging in the function body.

# =============================================================================
# HEALTH AND STATUS ENDPOINTS
# =============================================================================

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ 🏥 SYSTEM HEALTH & STATUS ROUTES                                        │
# └─────────────────────────────────────────────────────────────────────────┘

@app.route("/health", methods=["GET"])
def health_check():
    """
    🏥 PUBLIC HEALTH CHECK ENDPOINT

    Basic health check endpoint for monitoring and load balancers.
    Returns system status without requiring authentication.

    Authentication: None required (public endpoint)
    Returns: JSON with status, timestamp, and version
    Use case: Load balancer health checks, monitoring systems
    """
    # Log public endpoint access
    log_request_event("PUBLIC", request.path, request.method, request.remote_addr, status_code=200)

    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    })

@app.route("/status", methods=["GET"])
@require_api_key
def status():
    """
    📊 AUTHENTICATED STATUS ENDPOINT

    Detailed status endpoint with user and service information.
    Provides operational status and authenticated user context.

    Authentication: Required (X-API-Key header)
    Returns: JSON with status, user info, service info, timestamp, and version
    Use case: Authenticated monitoring, user-specific status checks
    """
    from flask import g
    return jsonify({
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "user": g.key_info.get('user', 'unknown'),
        "service": g.key_info.get('service', 'unknown'),
        "version": "1.0.0"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)

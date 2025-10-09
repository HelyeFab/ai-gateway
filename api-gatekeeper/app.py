from flask import Flask, request, jsonify, Response, stream_with_context, redirect
from flask_cors import CORS
import requests
import os
import json
import logging
from functools import wraps
from datetime import datetime
from logging.handlers import RotatingFileHandler
import base64
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
import uuid
import time

# Configuration
API_KEYS_FILE = os.environ.get("API_KEYS_FILE", "caddy_apikeys.json")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
AUDIT_LOG_FILE = os.environ.get("AUDIT_LOG_FILE", "/var/log/ai-gateway/audit.log")
FIREBASE_SERVICE_ACCOUNT = os.environ.get("FIREBASE_SERVICE_ACCOUNT", "/app/firebase-service-account.json")

# Setup application logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
firebase_initialized = False
try:
    if os.path.exists(FIREBASE_SERVICE_ACCOUNT):
        cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logger.info("Firebase Admin SDK initialized successfully")
    else:
        logger.warning(f"Firebase service account file not found at {FIREBASE_SERVICE_ACCOUNT}")
except Exception as e:
    logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
    firebase_initialized = False

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

# Configure CORS
CORS(app,
     origins=['http://localhost:3000', 'https://selfmind.dev', 'http://ai-gateway-web:3000'],
     allow_headers=['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With', 'Accept', 'Origin'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     supports_credentials=True,
     expose_headers=['Content-Type', 'Authorization'])

# Import and register dashboard blueprint
try:
    from dashboard_api import dashboard_bp
    app.register_blueprint(dashboard_bp)
    logger.info("Dashboard API endpoints registered")
except ImportError as e:
    logger.warning(f"Dashboard API not available: {e}")

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

# Store temporary keys in memory (in production, use Redis or similar)
TEMP_KEYS = {}

class APIKeyValidatorWithTemp(APIKeyValidator):
    """Extended validator that also checks temporary keys."""
    
    def is_valid_key(self, key):
        """Validate API key, including temporary keys."""
        # First check permanent keys
        is_valid, key_info = super().is_valid_key(key)
        if is_valid:
            return is_valid, key_info
        
        # Check temporary keys
        if key and key.startswith("temp_") and key in TEMP_KEYS:
            temp_info = TEMP_KEYS[key]
            
            # Check if expired
            if temp_info["expires_at"] < int(time.time() * 1000):
                logger.warning(f"Expired temporary key attempted: {key[:20]}...")
                del TEMP_KEYS[key]  # Clean up expired key
                return False, None
            
            logger.info(f"Valid temporary API key used")
            return True, temp_info
        
        return False, None

# Initialize validator with temporary key support
api_validator = APIKeyValidatorWithTemp(API_KEYS_FILE)

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


def proxy_request(target_url, timeout=120):
    """
    Generic request proxy function with proper streaming and error handling.
    """

    try:
        # Filter headers - keep most headers but remove the ones that cause issues
        headers = {k: v for k, v in request.headers if k.lower() not in
                  ['host', 'connection', 'x-api-key', 'content-length']}

        # Log the request details for debugging
        if request.method == 'POST' and '/chat/api/' in request.path:
            logger.info(f"Proxying to {target_url} with payload: {request.json}")
            logger.info(f"Headers being sent: {dict(headers)}")
        
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
        
        # Log error responses for debugging
        if resp.status_code >= 400:
            error_body = resp.content.decode('utf-8')[:500]  # First 500 chars
            logger.error(f"Error response from {target_url}: {error_body}")

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
    return proxy_request("http://host.docker.internal:11434/api/chat")

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

    Proxies POST requests to AUTOMATIC1111 Stable Diffusion WebUI API.
    Creates images from text prompts with various styling parameters.

    Target: AUTOMATIC1111 service on localhost:7860
    Authentication: Required (X-API-Key header)
    Expects: JSON with prompt, negative_prompt, steps, etc.
    Returns: Generated image data in base64 format
    
    Example request:
    {
        "prompt": "beautiful landscape",
        "negative_prompt": "ugly, blurry",
        "steps": 20,
        "width": 512,
        "height": 512
    }
    """
    # AUTOMATIC1111 uses /sdapi/v1/txt2img endpoint
    return proxy_request("http://localhost:7860/sdapi/v1/txt2img")


@app.route("/image/api/generate/simple", methods=["POST"])
@require_api_key
def image_generate_simple():
    """
    🎨 SIMPLIFIED IMAGE GENERATION ENDPOINT

    Provides a simpler interface to Stable Diffusion with sensible defaults.
    Transforms simple requests into AUTOMATIC1111 format.

    Authentication: Required (X-API-Key header)
    Expects: {"prompt": "your image description"}
    Returns: {"image": "base64_encoded_image", "info": {...}}
    """
    try:
        data = request.get_json()
        if not data or "prompt" not in data:
            return jsonify({"error": "Missing required field: prompt"}), 400

        # Build AUTOMATIC1111 request with defaults
        sd_request = {
            "prompt": data.get("prompt"),
            "negative_prompt": data.get("negative_prompt", ""),
            "steps": data.get("steps", 20),
            "width": data.get("width", 512),
            "height": data.get("height", 512),
            "cfg_scale": data.get("cfg_scale", 7),
            "sampler_name": data.get("sampler", "Euler a"),
            "batch_size": 1,
            "n_iter": 1,
            "seed": data.get("seed", -1),
            "restore_faces": data.get("restore_faces", False),
            "enable_hr": False,
            "denoising_strength": 0,
            "save_images": False,
            "send_images": True,
            "alwayson_scripts": {}
        }

        # Make request to AUTOMATIC1111
        response = requests.post(
            "http://localhost:7860/sdapi/v1/txt2img",
            json=sd_request,
            timeout=120  # Image generation can take time
        )

        if response.status_code == 200:
            result = response.json()
            # Simplify response
            return jsonify({
                "image": result.get("images", [])[0] if result.get("images") else None,
                "parameters": result.get("parameters", {}),
                "info": json.loads(result.get("info", "{}"))
            })
        else:
            return jsonify({
                "error": "Image generation failed",
                "details": response.text
            }), response.status_code

    except requests.exceptions.Timeout:
        logger.error("Timeout generating image")
        return jsonify({"error": "Image generation timeout"}), 504
    except Exception as e:
        logger.error(f"Error in image generation: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

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
# AUTHENTICATION ENDPOINTS
# =============================================================================

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ 🔑 TEMPORARY API KEY GENERATION                                         │
# └─────────────────────────────────────────────────────────────────────────┘

@app.route("/api/temp-key", methods=["POST"])
def generate_temp_key():
    """
    Generate a temporary API key for demo purposes.
    Keys expire after 1 hour and are only valid for the session.
    """
    try:
        # Generate unique temporary key
        temp_key = f"temp_{uuid.uuid4().hex}"
        expires_at = int(time.time() * 1000) + 3600000  # 1 hour from now
        
        # Store key with metadata
        TEMP_KEYS[temp_key] = {
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at,
            "user": "demo_user",
            "service": "demo",
            "is_temp": True
        }
        
        # Log temporary key generation
        logger.info(f"Generated temporary API key: {temp_key[:20]}...")
        log_request_event("TEMP_KEY_GENERATED", request.path, request.method, request.remote_addr, status_code=200)
        
        return jsonify({
            "key": temp_key,
            "expiresAt": expires_at,
            "message": "Temporary key generated for demo purposes"
        })
        
    except Exception as e:
        logger.error(f"Error generating temporary key: {str(e)}")
        return jsonify({"error": "Failed to generate temporary key"}), 500

# Validator instance is already created above with temp key support

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ 🔐 FIREBASE AUTH VERIFICATION                                           │
# └─────────────────────────────────────────────────────────────────────────┘

@app.route("/auth/verify", methods=["POST"])
def verify_firebase_token():
    """
    Verify Firebase ID token and return user info with admin status.
    This endpoint is used by the dashboard to verify authentication.
    """
    try:
        data = request.get_json()
        if not data or "token" not in data:
            return jsonify({"error": "Missing token"}), 400
        
        token = data.get("token")
        
        # Define admin emails
        ADMIN_EMAILS = ["emmanuelfabiani23@gmail.com"]
        
        # Verify the Firebase ID token
        if firebase_initialized:
            try:
                # Verify the ID token and get the decoded claims
                decoded_token = firebase_auth.verify_id_token(token)
                
                # Extract user information from the token
                uid = decoded_token.get('uid')
                email = decoded_token.get('email')
                email_verified = decoded_token.get('email_verified', False)
                
                # Check if user is admin
                is_admin = email in ADMIN_EMAILS if email else False
                
                # Log the verification
                logger.info(f"Successfully verified token for user: {email} (UID: {uid})")
                
                return jsonify({
                    "valid": True,
                    "uid": uid,
                    "email": email,
                    "email_verified": email_verified,
                    "is_admin": is_admin
                })
                
            except firebase_admin.auth.InvalidIdTokenError:
                logger.warning("Invalid Firebase ID token provided")
                return jsonify({"error": "Invalid token"}), 401
            except firebase_admin.auth.ExpiredIdTokenError:
                logger.warning("Expired Firebase ID token provided")
                return jsonify({"error": "Token expired"}), 401
            except Exception as e:
                logger.error(f"Error verifying Firebase token: {str(e)}")
                return jsonify({"error": "Token verification failed"}), 401
        else:
            # Fallback if Firebase Admin SDK is not initialized
            logger.warning("Firebase Admin SDK not initialized, using fallback verification")
            email = data.get("email")
            is_admin = email in ADMIN_EMAILS if email else False
            
            return jsonify({
                "valid": True,
                "email": email,
                "is_admin": is_admin,
                "warning": "Using fallback verification"
            })
        
    except Exception as e:
        logger.error(f"Error in verify_firebase_token: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# =============================================================================
# HEALTH AND STATUS ENDPOINTS
# =============================================================================

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ 🏠 ROOT ROUTE - REDIRECT TO DASHBOARD                                   │
# └─────────────────────────────────────────────────────────────────────────┘

@app.route("/", methods=["GET"])
def root_redirect():
    """
    Redirect root to the Next.js dashboard app which now includes the landing page.
    """
    target_url = "http://ai-gateway-web:3000/"
    return proxy_to_dashboard(target_url)

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ 📊 DASHBOARD ROUTES - PROXY TO NEXT.JS                                  │
# └─────────────────────────────────────────────────────────────────────────┘

def proxy_to_dashboard(target_url):
    """
    Common function to proxy requests to the dashboard.
    """
    try:
        # Get the request method and data
        method = request.method
        
        # Forward headers (excluding some that shouldn't be forwarded)
        headers = {k: v for k, v in request.headers if k.lower() not in 
                  ['host', 'connection', 'content-length', 'transfer-encoding']}
        
        # Handle different content types
        data = None
        json_data = None
        if request.is_json:
            json_data = request.get_json()
        elif request.data:
            data = request.data
        
        # Make the request to the dashboard
        resp = requests.request(
            method=method,
            url=target_url,
            headers=headers,
            params=request.args,
            json=json_data,
            data=data,
            allow_redirects=False,
            stream=True,
            timeout=30
        )
        
        # Return the response
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        response_headers = {
            name: value for name, value in resp.headers.items()
            if name.lower() not in excluded_headers
        }
        
        return Response(
            stream_with_context(resp.iter_content(chunk_size=1024)),
            status=resp.status_code,
            headers=response_headers
        )
        
    except requests.exceptions.Timeout:
        logger.error(f"Timeout proxying to dashboard: {target_url}")
        return jsonify({"error": "Dashboard timeout"}), 504
    except Exception as e:
        logger.error(f"Error proxying to dashboard: {str(e)}")
        return jsonify({"error": "Dashboard unavailable"}), 503

# API routes used by the dashboard (excluding auth which is handled by Caddy)
# Only proxy dashboard-specific API routes
@app.route("/api/dashboard/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
def dashboard_api_proxy(path=""):
    """
    Proxy dashboard API requests to the dashboard blueprint.
    Note: /api/auth/* is handled directly by Caddy to avoid proxy issues.
    """
    # This should not be reached as dashboard API is handled by the blueprint
    return jsonify({"error": "Route not configured"}), 404

# Static assets for the dashboard
@app.route("/_next/<path:path>", methods=["GET"])
def nextjs_static(path=""):
    """
    Proxy Next.js static assets.
    """
    target_url = f"http://ai-gateway-web:3000/_next/{path}"
    return proxy_to_dashboard(target_url)

# Login page route with SSO check
@app.route("/login", methods=["GET", "POST"])
def login_proxy():
    """
    Proxy login page requests to the Next.js dashboard.
    Checks for Firebase auth and auto-authenticates admin users.
    """
    # Check if user has a valid Firebase token
    firebase_token = request.cookies.get('firebase_token') or request.headers.get('X-Firebase-Token')
    
    if firebase_token and firebase_initialized:
        try:
            # Verify the Firebase token
            decoded_token = firebase_auth.verify_id_token(firebase_token)
            email = decoded_token.get('email')
            
            # Check if this is an admin user
            if email == "emmanuelfabiani23@gmail.com":
                # Create a session token for the dashboard
                # This would need to be implemented in the dashboard app
                # For now, redirect to a special SSO endpoint
                callback_url = request.args.get('callbackUrl', '/dashboard')
                return redirect(f"/api/auth/sso?email={email}&callback={callback_url}")
                
        except Exception as e:
            logger.info(f"Firebase token verification failed: {e}")
    
    # Normal login flow
    target_url = "http://ai-gateway-web:3000/login"
    return proxy_to_dashboard(target_url)

# Simplified dashboard routes - NextAuth handles all authentication

# Dashboard and its sub-routes - simplified proxy
@app.route("/dashboard", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
@app.route("/dashboard/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
def dashboard_proxy(path=""):
    """
    Proxy requests to the Next.js dashboard application.
    Simplified for production use.
    """
    # Direct proxy without complex auth checks
    if path:
        target_url = f"http://ai-gateway-web:3000/{path}"
    else:
        target_url = "http://ai-gateway-web:3000/"

    return proxy_to_dashboard(target_url)

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

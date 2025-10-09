"""
Dashboard API endpoints for managing the AI Gateway.
Separate from the main API to avoid mixing concerns.
"""

from datetime import datetime, timedelta
import json
import os
import uuid
from functools import wraps
from flask import Blueprint, jsonify, request, current_app
import jwt
import bcrypt
import docker
import psutil
from collections import defaultdict

# Create Blueprint for dashboard routes
dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

# Dashboard admin users (in production, use a database)
ADMIN_USERS = {
    "admin@selfmind.dev": {
        "password": "$2b$12$.zJuyF3BAzoK2zTzBRNxquTfv7Vb7DwIIMBqKXOOFAm.WYkdzGmRO",  # 'admin' hashed
        "role": "admin"
    }
}

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

def require_dashboard_auth(f):
    """Decorator to require dashboard authentication (separate from API keys)."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip auth for OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return '', 200
            
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid authorization header"}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            request.dashboard_user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

@dashboard_bp.route('/auth/login', methods=['POST'])
def login():
    """Authenticate dashboard admin user."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    
    user = ADMIN_USERS.get(email)
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Generate JWT token
    expiration = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    token = jwt.encode({
        'email': email,
        'role': user['role'],
        'exp': expiration
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return jsonify({
        "token": token,
        "user": {
            "email": email,
            "role": user['role']
        },
        "admin_api_key": os.environ.get('ADMIN_API_KEY', ''),
        "expires_at": expiration.isoformat()
    }), 200

@dashboard_bp.route('/auth/firebase', methods=['POST'])
def firebase_auth():
    """Authenticate via Firebase ID token and return admin API key."""
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    from firebase_admin import credentials
    
    # Initialize Firebase Admin SDK if not already initialized
    if not firebase_admin._apps:
        cred = credentials.Certificate('/app/firebase-service-account.json')
        firebase_admin.initialize_app(cred)
    
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Missing or invalid authorization header"}), 401
    
    id_token = auth_header.split(' ')[1]
    
    try:
        # Verify Firebase ID token
        decoded_token = firebase_auth.verify_id_token(id_token)
        email = decoded_token.get('email')
        
        # Check if user is authorized (you can add your own logic here)
        # For now, we'll allow all authenticated Firebase users
        
        # Get or create admin API key for this user
        admin_api_key = os.environ.get('ADMIN_API_KEY', '')
        if not admin_api_key:
            # Read from API keys file if env var not set
            api_keys_file = os.environ.get('API_KEYS_FILE', 'caddy_apikeys.json')
            if os.path.exists(api_keys_file):
                with open(api_keys_file, 'r') as f:
                    keys = json.load(f)
                    # Get first key as admin key for now
                    if keys:
                        admin_api_key = list(keys.keys())[0]
        
        return jsonify({
            "email": email,
            "admin_api_key": admin_api_key,
            "message": "Firebase authentication successful"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Firebase auth error: {str(e)}")
        return jsonify({"error": "Invalid Firebase token"}), 401

@dashboard_bp.route('/stats', methods=['GET'])
@require_dashboard_auth
def get_dashboard_stats():
    """Get overview statistics for dashboard home."""
    try:
        # Read audit log for request stats
        audit_log_path = os.environ.get('AUDIT_LOG_FILE', '/var/log/ai-gateway/audit.log')
        total_requests = 0
        requests_last_week = 0
        week_ago = datetime.now() - timedelta(days=7)
        
        if os.path.exists(audit_log_path):
            with open(audit_log_path, 'r') as f:
                for line in f:
                    total_requests += 1
                    # Parse timestamp from log line
                    try:
                        timestamp_str = line.split(' | ')[0]
                        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                        if timestamp > week_ago:
                            requests_last_week += 1
                    except:
                        pass
        
        # Count active API keys
        api_keys_file = os.environ.get('API_KEYS_FILE', 'caddy_apikeys.json')
        active_keys = 0
        if os.path.exists(api_keys_file):
            with open(api_keys_file, 'r') as f:
                keys = json.load(f)
                active_keys = len(keys)
        
        # Get system stats
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Calculate average response time (mock for now)
        avg_response_time = 89  # milliseconds
        
        return jsonify({
            "total_requests": total_requests,
            "requests_last_week": requests_last_week,
            "active_api_keys": active_keys,
            "avg_response_time": avg_response_time,
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dashboard_bp.route('/services', methods=['GET'])
@require_dashboard_auth
def get_service_status():
    """Get real-time status of all services."""
    try:
        client = docker.from_env()
        services = []
        
        # Define expected services
        expected_services = [
            {"name": "ai-gateway-caddy", "display_name": "Caddy Proxy", "port": 443},
            {"name": "ai-gateway-api-gatekeeper", "display_name": "API Gateway", "port": 8080},
            {"name": "edge-tts", "display_name": "Edge TTS", "port": 8090},
            {"name": "ollama", "display_name": "Ollama LLM", "port": 11434, "external": True}
        ]
        
        for service in expected_services:
            status = "offline"
            health = "unknown"
            
            if not service.get("external", False):
                # Check Docker container
                try:
                    container = client.containers.get(service["name"])
                    status = container.status
                    if status == "running":
                        health = "healthy"
                except docker.errors.NotFound:
                    status = "not_found"
                    health = "error"
            else:
                # Check external service (like Ollama)
                import requests
                try:
                    response = requests.get(f"http://localhost:{service['port']}/", timeout=2)
                    if response.status_code < 500:
                        status = "running"
                        health = "healthy"
                except:
                    status = "offline"
                    health = "error"
            
            services.append({
                "name": service["display_name"],
                "container": service["name"],
                "status": status,
                "health": health,
                "port": service["port"]
            })
        
        return jsonify({"services": services}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dashboard_bp.route('/keys', methods=['GET', 'OPTIONS'])
def get_api_keys():
    """Get all API keys with metadata."""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check for admin key authentication
    admin_key = request.headers.get('X-Admin-Key')
    expected_key = os.environ.get('ADMIN_API_KEY', 'admin-key-change-in-production')
    
    if admin_key != expected_key:
        # Fall back to JWT auth
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Unauthorized"}), 401
        
        token = auth_header.split(' ')[1]
        try:
            jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except:
            return jsonify({"error": "Invalid token"}), 401
        
    try:
        # Read from the full metadata file if available
        metadata_file = os.environ.get('API_KEYS_METADATA_FILE', '/app/data/apikeys_metadata.json')
        runtime_file = os.environ.get('API_KEYS_FILE', 'caddy_apikeys.json')
        
        keys = []
        
        # Try metadata file first
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r') as f:
                api_keys = json.load(f)
                for key_id, data in api_keys.items():
                    keys.append({
                        "id": key_id,
                        "user": data.get("user", "unknown"),
                        "service": data.get("service", "all"),
                        "created_at": data.get("created_at", ""),
                        "expires_at": data.get("expires_at", ""),
                        "enabled": data.get("enabled", True),
                        "description": data.get("description", "")
                    })
        elif os.path.exists(runtime_file):
            # Fallback to runtime file
            with open(runtime_file, 'r') as f:
                api_keys = json.load(f)
                for key_id, data in api_keys.items():
                    keys.append({
                        "id": key_id,
                        "user": data.get("user", "unknown"),
                        "service": data.get("service", "all"),
                        "created_at": data.get("created_at", ""),
                        "enabled": True
                    })
        
        return jsonify({"keys": keys}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dashboard_bp.route('/keys', methods=['POST', 'OPTIONS'])
def create_api_key():
    """Create a new API key."""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check for admin key authentication
    admin_key = request.headers.get('X-Admin-Key')
    expected_key = os.environ.get('ADMIN_API_KEY', 'admin-key-change-in-production')
    
    if admin_key != expected_key:
        # Fall back to JWT auth
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Unauthorized"}), 401
        
        token = auth_header.split(' ')[1]
        try:
            jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except:
            return jsonify({"error": "Invalid token"}), 401
        
    try:
        current_app.logger.info(f"Creating API key - Request method: {request.method}")
        current_app.logger.info(f"Request headers: {dict(request.headers)}")
        data = request.get_json()
        current_app.logger.info(f"Request data: {data}")
        
        # Validate input
        user = data.get('user')
        service = data.get('service', 'all')
        description = data.get('description', '')
        expires_days = data.get('expires_days', 0)
        
        if not user:
            return jsonify({"error": "User is required"}), 400
        
        # Generate new key
        key_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat() + 'Z'
        expires_at = None
        
        if expires_days > 0:
            expires_at = (datetime.utcnow() + timedelta(days=expires_days)).isoformat() + 'Z'
        
        # Read existing keys
        metadata_file = os.environ.get('API_KEYS_METADATA_FILE', '/app/data/apikeys_metadata.json')
        runtime_file = os.environ.get('API_KEYS_FILE', 'caddy_apikeys.json')
        
        # Update metadata file
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r') as f:
                api_keys = json.load(f)
        else:
            api_keys = {}
        
        api_keys[key_id] = {
            "user": user,
            "service": service,
            "description": description,
            "created_at": created_at,
            "expires_at": expires_at,
            "enabled": True
        }
        
        # Save metadata
        os.makedirs(os.path.dirname(metadata_file), exist_ok=True)
        with open(metadata_file, 'w') as f:
            json.dump(api_keys, f, indent=2)
        
        # Update runtime file (only active keys)
        runtime_keys = {}
        for k, v in api_keys.items():
            if v.get("enabled", True):
                runtime_keys[k] = {
                    "user": v["user"],
                    "service": v["service"],
                    "created_at": v["created_at"]
                }
        
        with open(runtime_file, 'w') as f:
            json.dump(runtime_keys, f, indent=2)
        
        return jsonify({
            "key": key_id,
            "user": user,
            "service": service,
            "created_at": created_at,
            "expires_at": expires_at
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dashboard_bp.route('/keys/<key_id>', methods=['DELETE'])
@require_dashboard_auth
def delete_api_key(key_id):
    """Delete/disable an API key."""
    try:
        metadata_file = os.environ.get('API_KEYS_METADATA_FILE', '/app/data/apikeys_metadata.json')
        runtime_file = os.environ.get('API_KEYS_FILE', 'caddy_apikeys.json')
        
        # Update metadata file
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r') as f:
                api_keys = json.load(f)
            
            if key_id in api_keys:
                api_keys[key_id]["enabled"] = False
                
                with open(metadata_file, 'w') as f:
                    json.dump(api_keys, f, indent=2)
        
        # Update runtime file
        if os.path.exists(runtime_file):
            with open(runtime_file, 'r') as f:
                runtime_keys = json.load(f)
            
            if key_id in runtime_keys:
                del runtime_keys[key_id]
                
                with open(runtime_file, 'w') as f:
                    json.dump(runtime_keys, f, indent=2)
        
        return jsonify({"message": "Key disabled successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dashboard_bp.route('/logs/stream', methods=['GET'])
@require_dashboard_auth
def stream_logs():
    """Stream log updates in real-time."""
    import time
    from flask import Response
    
    def generate():
        log_file = os.environ.get('AUDIT_LOG_FILE', '/var/log/ai-gateway/audit.log')
        last_position = 0
        
        while True:
            try:
                if os.path.exists(log_file):
                    with open(log_file, 'r') as f:
                        f.seek(last_position)
                        new_lines = f.readlines()
                        last_position = f.tell()
                        
                        for line in new_lines:
                            yield f"data: {json.dumps({'log': line.strip()})}\n\n"
                            
                time.sleep(1)  # Check for new logs every second
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                break
    
    return Response(generate(), mimetype="text/event-stream")

@dashboard_bp.route('/logs', methods=['GET'])
@require_dashboard_auth
def get_logs():
    """Get recent logs with filtering."""
    try:
        # Get query parameters
        limit = int(request.args.get('limit', 100))
        level = request.args.get('level', 'all')
        service = request.args.get('service', 'all')
        
        audit_log_path = os.environ.get('AUDIT_LOG_FILE', '/var/log/ai-gateway/audit.log')
        logs = []
        
        if os.path.exists(audit_log_path):
            with open(audit_log_path, 'r') as f:
                # Read last N lines efficiently
                lines = f.readlines()[-limit:]
                
                for line in lines:
                    try:
                        # Parse log line
                        parts = line.strip().split(' | ')
                        if len(parts) >= 4:
                            log_entry = {
                                "timestamp": parts[0],
                                "level": parts[1],
                                "event": parts[2],
                                "details": ' | '.join(parts[3:])
                            }
                            
                            # Apply filters
                            if level != 'all' and log_entry['level'] != level.upper():
                                continue
                            
                            logs.append(log_entry)
                    except:
                        pass
        
        # Reverse to show newest first
        logs.reverse()
        
        return jsonify({"logs": logs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dashboard_bp.route('/analytics', methods=['GET'])
@require_dashboard_auth
def get_analytics():
    """Get analytics data for charts."""
    try:
        timeframe = request.args.get('timeframe', '7d')
        
        # Parse timeframe
        if timeframe == '24h':
            start_time = datetime.now() - timedelta(hours=24)
            interval_hours = 1
        elif timeframe == '7d':
            start_time = datetime.now() - timedelta(days=7)
            interval_hours = 6
        elif timeframe == '30d':
            start_time = datetime.now() - timedelta(days=30)
            interval_hours = 24
        else:
            start_time = datetime.now() - timedelta(days=7)
            interval_hours = 6
        
        # Initialize data structure
        time_series = defaultdict(lambda: {
            "requests": 0,
            "errors": 0,
            "chat": 0,
            "tts": 0,
            "image": 0,
            "whisper": 0
        })
        
        audit_log_path = os.environ.get('AUDIT_LOG_FILE', '/var/log/ai-gateway/audit.log')
        
        if os.path.exists(audit_log_path):
            with open(audit_log_path, 'r') as f:
                for line in f:
                    try:
                        parts = line.strip().split(' | ')
                        timestamp_str = parts[0]
                        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                        
                        if timestamp < start_time:
                            continue
                        
                        # Round to interval
                        interval_key = timestamp.replace(minute=0, second=0, microsecond=0)
                        interval_key = interval_key.replace(hour=(timestamp.hour // interval_hours) * interval_hours)
                        
                        level = parts[1]
                        event = parts[2]
                        
                        time_series[interval_key]["requests"] += 1
                        
                        if level == "ERROR":
                            time_series[interval_key]["errors"] += 1
                        
                        # Count by service
                        if "/chat/api" in line:
                            time_series[interval_key]["chat"] += 1
                        elif "/tts/api" in line:
                            time_series[interval_key]["tts"] += 1
                        elif "/image/api" in line:
                            time_series[interval_key]["image"] += 1
                        elif "/whisper/api" in line:
                            time_series[interval_key]["whisper"] += 1
                    except:
                        pass
        
        # Convert to list for chart
        chart_data = []
        for timestamp, data in sorted(time_series.items()):
            chart_data.append({
                "timestamp": timestamp.isoformat(),
                **data
            })
        
        # Calculate totals
        totals = {
            "total_requests": sum(d["requests"] for d in chart_data),
            "total_errors": sum(d["errors"] for d in chart_data),
            "by_service": {
                "chat": sum(d["chat"] for d in chart_data),
                "tts": sum(d["tts"] for d in chart_data),
                "image": sum(d["image"] for d in chart_data),
                "whisper": sum(d["whisper"] for d in chart_data)
            }
        }
        
        return jsonify({
            "chart_data": chart_data,
            "totals": totals
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
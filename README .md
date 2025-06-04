# 🛡️ AI Gateway with Caddy + Flask Gatekeeper

This project sets up a secure local API gateway to self-hosted services (like Ollama models, TTS, etc.) using:

- 🌐 [Caddy](https://caddyserver.com) – a modern reverse proxy with automatic TLS and great performance.
- 🐍 Flask – custom gatekeeper API with reusable middleware to validate incoming requests using secure API keys.

---

## 📁 Project Structure

```
ai-gateway/
├── docker-compose.yml               # Orchestrates caddy + gatekeeper containers
├── caddy/
│   └── Caddyfile                    # Caddy config with reverse proxy rules
├── api-gatekeeper/
│   ├── app.py                       # Flask app for authentication + proxy
│   ├── requirements.txt             # Python dependencies
│   └── Dockerfile                   # Container build for gatekeeper
└── ~/Documents/Security/
    ├── apikeys.json                 # Master key list (detailed info)
    └── caddy_apikeys.json           # Flattened version used at runtime (mounted into container)
```

---

## 🔐 How API Key Validation Works

The gateway implements a **two-layer security model**:

### 1. Caddy Layer (Front Gate)
- Checks for presence of `X-API-Key` header
- Returns `401 Unauthorized` immediately if no key is provided
- Routes valid requests to Flask gatekeeper

### 2. Flask Layer (Validation & Proxy)
- Uses **reusable `@require_api_key` decorator** for consistent authentication
- Validates API keys against `/app/caddy_apikeys.json` with intelligent caching
- Logs all authentication attempts with user/service information
- Proxies validated requests to backend services

**Currently Protected Routes:**

```
POST /chat/api/generate      # Ollama text generation
POST /chat/api/chat          # Ollama chat conversations
POST /tts/api/speak          # Text-to-Speech services
POST /image/api/generate     # Image generation services
POST /whisper/api/transcribe # Speech-to-Text services
GET  /status                 # System status (authenticated)
```

**Public Routes:**
```
GET  /health                 # Health check (no authentication)
```

---

## 🔧 API Key Management

### Key Format
The flattened JSON used inside the container looks like this:

```json
{
  "e5c4b8c2-537c-47af-94a8-c8489709b49b": {
    "user": "beano",
    "service": "tts",
    "created_at": "2025-06-01T18:58:30.356Z"
  }
}
```

### Enhanced Key Generation
The `generate_apikey.py` script now supports full CRUD operations with metadata:

**Interactive Mode:**
```bash
./generate_apikey.py
# Prompts for user, service, description, and expiry
```

**CLI Mode:**
```bash
# Generate key
./generate_apikey.py generate -u john -s chat -d "Production chat access" -e 30

# List active keys
./generate_apikey.py list

# List all keys (including disabled/expired)
./generate_apikey.py list --all

# Disable a key
./generate_apikey.py disable abc123

# Validate a key
./generate_apikey.py validate e5c4b8c2-537c-47af-94a8-c8489709b49b
```

### Key Features
- ✅ **UUID4-based keys** for cryptographic security
- ✅ **Metadata support**: user, service, description, creation date
- ✅ **Expiry management**: Optional automatic key expiration
- ✅ **Key lifecycle**: Enable/disable keys without deletion
- ✅ **Dual storage**: Full metadata + flattened runtime export
- ✅ **Backward compatibility** with existing key formats
- ✅ **Intelligent export**: Only active keys exported for runtime use

---

## ➕ Adding More Protected Routes

With the new **reusable middleware architecture**, adding protected routes is now simple and consistent:

### 1. Add Caddy Route Matcher
Add a new `@matcher` block in your `Caddyfile`:
```caddy
@newservice {
    path /newservice/api/*
    method POST
}

handle @newservice {
    @hasKey header X-API-Key *

    handle @hasKey {
        reverse_proxy localhost:8080
    }

    handle {
        respond "Unauthorized - API Key Required" 401
    }
}
```

### 2. Add Flask Route with Decorator
In `app.py`, simply add a new route with the `@require_api_key` decorator:
```python
@app.route("/newservice/api/endpoint", methods=["POST"])
@require_api_key
def new_service():
    """Proxy requests to new service."""
    return proxy_request("http://localhost:XXXX/endpoint")
```

### 3. Benefits of This Architecture
- ✅ **Consistent security**: All routes use the same validation logic
- ✅ **Easy maintenance**: Changes to auth logic apply everywhere
- ✅ **Built-in logging**: All requests are logged with user/service info
- ✅ **Error handling**: Standardized timeout and connection error responses
- ✅ **Future-ready**: Easy to add rate limiting, request metrics, etc.

---

## 🪵 Comprehensive Audit Logging

The AI Gateway includes **enterprise-grade audit logging** that tracks all security events in a separate log file:

### Log Types Tracked
- ✅ **AUTHORIZED**: Successful API key validations with user/service info
- ✅ **UNAUTHORIZED**: Failed authentication attempts with partial key info
- ✅ **PUBLIC**: Access to public endpoints (health checks)
- ✅ **ERROR**: System errors and service timeouts

### Log Format
```
2025-06-04 08:15:32 | INFO | AUTHORIZED | POST /chat/api/generate | User: john | Service: chat | IP: 192.168.1.100
2025-06-04 08:16:15 | INFO | UNAUTHORIZED | POST /tts/api/speak | IP: 192.168.1.200 | Key: abc12345...
2025-06-04 08:17:02 | INFO | PUBLIC | GET /health | IP: 192.168.1.50 | Status: 200
```

### Log Analysis Tool
The included `analyze_logs.py` script provides powerful log analysis capabilities:

```bash
# Analyze all logs
./analyze_logs.py --log-file ./logs/audit.log

# Last 24 hours only
./analyze_logs.py --log-file ./logs/audit.log --hours 24

# Detect suspicious activity
./analyze_logs.py --log-file ./logs/audit.log --suspicious

# User activity report
./analyze_logs.py --log-file ./logs/audit.log --users

# Export as JSON
./analyze_logs.py --log-file ./logs/audit.log --json --output report.json
```

### Features
- 📊 **Usage statistics**: Request patterns, top users, endpoints
- 🚨 **Threat detection**: Multiple failed attempts, high volume attacks
- 👥 **User analysis**: Individual user activity patterns
- 📈 **Trend analysis**: Time-based request patterns
- 💾 **Log rotation**: Automatic 10MB rotation with 5 backup files

---

## 🚀 Moving to Production

To prepare for deployment:

1. **Use a production WSGI server**: Swap Flask’s dev server for `gunicorn` or `uWSGI`.
2. **Use HTTPS**: Allow Caddy to handle TLS certs or proxy through another secure service.
3. **Add logging**: Enable audit logging for accepted/denied requests.
4. **Rotate Keys**: Use `apikeys.json` + regenerate `caddy_apikeys.json` periodically.
5. **Authentication Middleware**: Optional: use OAuth or JWTs downstream of Caddy.
6. **Firewall**: Ensure only localhost/internal network can reach Caddy or Flask directly.

---

## 👥 Contributors

- **BeanoAI** – Developer, maintainer, and creator of the secure home AI API gateway.

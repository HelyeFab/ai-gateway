# 🛡️ AI Gateway with Caddy + Flask Gatekeeper

This project sets up a secure local API gateway to self-hosted services (like Ollama models, TTS, etc.) using:

- 🌐 [Caddy](https://caddyserver.com) – a modern reverse proxy with automatic TLS and great performance.
- 🐍 Flask – custom gatekeeper API to validate incoming requests using secure API keys.

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

- `app.py` checks incoming requests for an `X-API-Key` header.
- The key is matched against `/app/caddy_apikeys.json` (a mounted JSON file).
- If the key is invalid or missing, `401 Unauthorized` is returned.

**Protected route:**

```
POST /chat/api/generate
```

Only POST requests to this route are currently checked. This is handled in `Caddyfile`.

---

## 🔧 API Key Format

The flattened JSON used inside the container should look like this:

```json
{
  "e5c4b8c2-537c-47af-94a8-c8489709b49b": {
    "user": "beano",
    "service": "tts",
    "created_at": "2025-06-01T18:58:30.356Z"
  }
}
```

You can generate new keys with the script:

```bash
python3 generate_apikey.py
```

---

## ➕ Adding More Protected Routes

1. Add new `@matcher` blocks in your `Caddyfile` for each route:
```caddy
@chat {
    path /chat/api/generate
    method POST
}

handle @chat {
    reverse_proxy localhost:8080
}
```

2. In `app.py`, duplicate the `@app.route(...)` and `is_valid_key()` check logic as needed.

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

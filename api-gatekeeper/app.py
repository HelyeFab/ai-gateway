from flask import Flask, request, jsonify, Response
import requests
import os
import json

API_KEYS_FILE = os.environ.get("API_KEYS_FILE", "caddy_apikeys.json")

app = Flask(__name__)

def is_valid_key(key):
    try:
        with open(API_KEYS_FILE, "r") as f:
            keys = json.load(f)
        return key.strip() in keys
    except Exception as e:
        print(f"[ERROR] Failed to read API key file: {e}")
        return False

@app.route("/chat/api/generate", methods=["POST"])
def forward():
    key = request.headers.get("X-API-Key", "")
    if not is_valid_key(key):
        return jsonify({"error": "Unauthorized"}), 401

    try:
        resp = requests.post("http://localhost:11434/api/generate", json=request.json)
        return Response(resp.content, status=resp.status_code, content_type=resp.headers.get("Content-Type"))
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)

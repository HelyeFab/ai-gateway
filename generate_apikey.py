import uuid
import json
from datetime import datetime, timezone
from pathlib import Path

# Define paths
base_dir = Path.home() / "Documents" / "Security"
file_path = base_dir / "apikeys.json"
export_path = base_dir / "caddy_apikeys.json"

# Ensure the directory exists
base_dir.mkdir(parents=True, exist_ok=True)

# Load existing keys if the file exists
if file_path.exists():
    with open(file_path, "r") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            data = []
else:
    data = []

# Prompt for user and service
user = input("👤 Enter the user for this key: ").strip()
service = input("🛠️  Enter the service (e.g., chat, tts, etc.): ").strip()

# Generate secure UUID-based key
new_key = str(uuid.uuid4())

# Add entry
entry = {
    "key": new_key,
    "user": user,
    "service": service,
    "created_at": datetime.now(timezone.utc).isoformat()
}
data.append(entry)

# Save full list
with open(file_path, "w") as f:
    json.dump(data, f, indent=2)

print(f"\n✅ API key generated for {user} ({service}):\n🔑 {new_key}")
print(f"📁 Saved to: {file_path}")

# Export flattened version for Caddy
flattened = {entry["key"]: {
    "user": entry["user"],
    "service": entry["service"],
    "created_at": entry["created_at"]
} for entry in data}
with open(export_path, "w") as f:
    json.dump(flattened, f, indent=2)

print(f"📤 Flattened keys exported to: {export_path}")

input("\nPress Enter to close...")

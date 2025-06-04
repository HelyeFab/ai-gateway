#!/usr/bin/env python3
"""
AI Gateway API Key Management Tool

This script manages API keys for the AI Gateway, supporting:
- Interactive and CLI-based key generation
- Key listing and validation
- Metadata support (user, service, description, expiry)
- Automatic flattened export for runtime use
"""

import uuid
import json
import argparse
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Configuration
DEFAULT_BASE_DIR = Path.home() / "Documents" / "Security"
MASTER_KEYS_FILE = "apikeys.json"
RUNTIME_KEYS_FILE = "caddy_apikeys.json"

class APIKeyManager:
    """Manages API keys with full CRUD operations and metadata support."""

    def __init__(self, base_dir: Path = DEFAULT_BASE_DIR):
        self.base_dir = Path(base_dir)
        self.master_file = self.base_dir / MASTER_KEYS_FILE
        self.runtime_file = self.base_dir / RUNTIME_KEYS_FILE

        # Ensure directory exists
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def load_keys(self) -> List[Dict]:
        """Load existing keys from master file."""
        if not self.master_file.exists():
            return []

        try:
            with open(self.master_file, "r") as f:
                data = json.load(f)
                # Ensure backward compatibility
                if isinstance(data, list):
                    return data
                else:
                    print("⚠️  Warning: Converting old key format to new format")
                    return []
        except json.JSONDecodeError as e:
            print(f"❌ Error reading {self.master_file}: {e}")
            return []

    def save_keys(self, keys: List[Dict]) -> bool:
        """Save keys to master file and export flattened version."""
        try:
            # Save master file with full metadata
            with open(self.master_file, "w") as f:
                json.dump(keys, f, indent=2, sort_keys=True)

            # Export flattened version for runtime
            flattened = self._create_flattened_export(keys)
            with open(self.runtime_file, "w") as f:
                json.dump(flattened, f, indent=2, sort_keys=True)

            return True
        except Exception as e:
            print(f"❌ Error saving keys: {e}")
            return False

    def _create_flattened_export(self, keys: List[Dict]) -> Dict:
        """Create flattened version for runtime use."""
        flattened = {}
        for entry in keys:
            # Only include active (non-expired) keys
            if self._is_key_active(entry):
                flattened[entry["key"]] = {
                    "user": entry["user"],
                    "service": entry["service"],
                    "created_at": entry["created_at"]
                }
        return flattened

    def _is_key_active(self, entry: Dict) -> bool:
        """Check if a key is active (not expired or disabled)."""
        # Check if key is disabled
        if entry.get("disabled", False):
            return False

        # Check expiry
        if "expires_at" in entry and entry["expires_at"]:
            try:
                expiry = datetime.fromisoformat(entry["expires_at"].replace("Z", "+00:00"))
                if datetime.now(timezone.utc) > expiry:
                    return False
            except ValueError:
                # Invalid expiry format, treat as active
                pass

        return True

    def generate_key(
        self,
        user: str,
        service: str,
        description: Optional[str] = None,
        expires_days: Optional[int] = None
    ) -> Tuple[str, Dict]:
        """Generate a new API key with metadata."""
        new_key = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        entry = {
            "key": new_key,
            "user": user.strip(),
            "service": service.strip(),
            "description": description.strip() if description else "",
            "created_at": now.isoformat(),
            "last_used": None,
            "disabled": False
        }

        # Add expiry if specified
        if expires_days and expires_days > 0:
            expiry = now + timedelta(days=expires_days)
            entry["expires_at"] = expiry.isoformat()
        else:
            entry["expires_at"] = None

        return new_key, entry

    def add_key(
        self,
        user: str,
        service: str,
        description: Optional[str] = None,
        expires_days: Optional[int] = None
    ) -> Optional[str]:
        """Add a new API key to the store."""
        keys = self.load_keys()
        new_key, entry = self.generate_key(user, service, description, expires_days)

        keys.append(entry)

        if self.save_keys(keys):
            return new_key
        return None

    def list_keys(self, show_inactive: bool = False) -> List[Dict]:
        """List all keys with their metadata."""
        keys = self.load_keys()

        if not show_inactive:
            keys = [k for k in keys if self._is_key_active(k)]

        return keys

    def disable_key(self, key_id: str) -> bool:
        """Disable a specific key by marking it as disabled."""
        keys = self.load_keys()

        for entry in keys:
            if entry["key"] == key_id or entry["key"].startswith(key_id):
                entry["disabled"] = True
                entry["disabled_at"] = datetime.now(timezone.utc).isoformat()

                if self.save_keys(keys):
                    return True
                break

        return False

    def validate_key(self, key_id: str) -> Optional[Dict]:
        """Validate and return key information."""
        keys = self.load_keys()

        for entry in keys:
            if entry["key"] == key_id:
                return {
                    "valid": self._is_key_active(entry),
                    "user": entry["user"],
                    "service": entry["service"],
                    "created_at": entry["created_at"],
                    "expires_at": entry.get("expires_at"),
                    "disabled": entry.get("disabled", False)
                }

        return None

def interactive_mode():
    """Interactive key generation mode."""
    print("🔑 AI Gateway - API Key Generator")
    print("=" * 40)

    manager = APIKeyManager()

    # Get user input
    user = input("👤 Enter the user for this key: ").strip()
    if not user:
        print("❌ User cannot be empty")
        return

    service = input("🛠️  Enter the service (e.g., chat, tts, image, whisper): ").strip()
    if not service:
        print("❌ Service cannot be empty")
        return

    description = input("📝 Enter description (optional): ").strip()

    # Ask about expiry
    expires_input = input("⏰ Expiry in days (enter for no expiry): ").strip()
    expires_days = None
    if expires_input:
        try:
            expires_days = int(expires_input)
        except ValueError:
            print("⚠️  Invalid expiry, key will not expire")

    # Generate key
    new_key = manager.add_key(user, service, description, expires_days)

    if new_key:
        print(f"\n✅ API key generated successfully!")
        print(f"👤 User: {user}")
        print(f"🛠️  Service: {service}")
        if description:
            print(f"📝 Description: {description}")
        if expires_days:
            expiry_date = datetime.now(timezone.utc) + timedelta(days=expires_days)
            print(f"⏰ Expires: {expiry_date.strftime('%Y-%m-%d %H:%M UTC')}")
        print(f"\n🔑 {new_key}")
        print(f"\n📁 Saved to: {manager.master_file}")
        print(f"📤 Runtime export: {manager.runtime_file}")
    else:
        print("❌ Failed to generate key")

def main():
    """Main CLI interface."""
    parser = argparse.ArgumentParser(
        description="AI Gateway API Key Management Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                                    # Interactive mode
  %(prog)s generate -u john -s chat          # Generate key for user 'john' and service 'chat'
  %(prog)s generate -u jane -s tts -d "Production TTS" -e 30  # Generate key with description and 30-day expiry
  %(prog)s list                              # List active keys
  %(prog)s list --all                        # List all keys (including disabled)
  %(prog)s disable abc123                    # Disable key starting with 'abc123'
  %(prog)s validate e5c4b8c2-537c-47af-...  # Validate specific key
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Generate command
    gen_parser = subparsers.add_parser("generate", help="Generate new API key")
    gen_parser.add_argument("-u", "--user", required=True, help="User name")
    gen_parser.add_argument("-s", "--service", required=True, help="Service name")
    gen_parser.add_argument("-d", "--description", help="Key description")
    gen_parser.add_argument("-e", "--expires", type=int, help="Expiry in days")

    # List command
    list_parser = subparsers.add_parser("list", help="List API keys")
    list_parser.add_argument("--all", action="store_true", help="Show disabled/expired keys")

    # Disable command
    disable_parser = subparsers.add_parser("disable", help="Disable API key")
    disable_parser.add_argument("key_id", help="Key ID or partial key ID to disable")

    # Validate command
    validate_parser = subparsers.add_parser("validate", help="Validate API key")
    validate_parser.add_argument("key_id", help="Key ID to validate")

    args = parser.parse_args()
    manager = APIKeyManager()

    if not args.command:
        # Interactive mode
        interactive_mode()
        return

    if args.command == "generate":
        new_key = manager.add_key(args.user, args.service, args.description, args.expires)
        if new_key:
            print(f"✅ Generated key: {new_key}")
        else:
            print("❌ Failed to generate key")
            sys.exit(1)

    elif args.command == "list":
        keys = manager.list_keys(show_inactive=args.all)
        if not keys:
            print("No keys found")
            return

        print(f"{'Key (partial)':<20} {'User':<15} {'Service':<10} {'Created':<12} {'Status':<10}")
        print("-" * 80)

        for key in keys:
            key_short = key["key"][:16] + "..."
            created = key["created_at"][:10]  # Just the date
            status = "Active"

            if key.get("disabled"):
                status = "Disabled"
            elif not manager._is_key_active(key):
                status = "Expired"

            print(f"{key_short:<20} {key['user']:<15} {key['service']:<10} {created:<12} {status:<10}")

    elif args.command == "disable":
        if manager.disable_key(args.key_id):
            print(f"✅ Key disabled successfully")
        else:
            print(f"❌ Key not found: {args.key_id}")
            sys.exit(1)

    elif args.command == "validate":
        result = manager.validate_key(args.key_id)
        if result:
            status = "✅ Valid" if result["valid"] else "❌ Invalid"
            print(f"Key Status: {status}")
            print(f"User: {result['user']}")
            print(f"Service: {result['service']}")
            print(f"Created: {result['created_at']}")
            if result.get('expires_at'):
                print(f"Expires: {result['expires_at']}")
        else:
            print(f"❌ Key not found: {args.key_id}")
            sys.exit(1)

if __name__ == "__main__":
    main()

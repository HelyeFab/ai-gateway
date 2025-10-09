# 🔊 Edge-TTS API Documentation

## 🛠️ Endpoint
**POST** `/tts/api/speak`

## 🔐 Authentication
You must include a valid API key in the header:
```
X-API-Key: YOUR_VALID_KEY
```

## 📦 Request Body
Send a JSON object with the following fields:

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| `text`  | string | ✅ yes   | The text you want to convert to speech |
| `voice` | string | ❌ no    | Voice ID (default: `en-US-JennyNeural`) |
| `rate`  | string | ❌ no    | Speaking rate (e.g. `+0%`, `-10%`, `+25%`) |

### Example:
```json
{
  "text": "Hello, Emmanuel!",
  "voice": "en-US-JennyNeural",
  "rate": "+0%"
}
```

## 📥 Response
Returns an `audio/mpeg` stream of the synthesized speech.

## 🎙️ Voice Options
Voices are provided by Microsoft Edge-TTS. Example voice IDs:

- `en-US-JennyNeural` – Female, friendly
- `en-US-GuyNeural` – Male, natural
- `en-GB-RyanNeural` – British accent
- `en-IN-NeerjaNeural` – Indian accent
- `ja-JP-NanamiNeural` – Japanese

More voices: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support

## 🧪 Sample curl

```bash
curl -X POST http://localhost:8080/tts/api/speak \
  -H "X-API-Key: YOUR_VALID_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "text": "Welcome to the AI Gateway", "voice": "en-US-GuyNeural", "rate": "+5%" }' \
  --output output.mp3
```

# 🤖 Chat API Documentation (Ollama Gateway)

## 🛠️ Endpoints

### 🔹 Single-Turn Generation
**POST** `/chat/api/generate`

### 🔹 Multi-Turn Chat
**POST** `/chat/api/chat`

## 🔐 Authentication
All endpoints require a valid API key:
```
X-API-Key: YOUR_VALID_KEY
```

## 📦 Request Body

### `/chat/api/generate`
```json
{
  "model": "llama3",
  "prompt": "Tell me a joke.",
  "options": {
    "temperature": 0.7
  }
}
```

### `/chat/api/chat`
```json
{
  "model": "llama3",
  "messages": [
    { "role": "user", "content": "Hello, who are you?" },
    { "role": "assistant", "content": "I’m an AI created by OpenAI." },
    { "role": "user", "content": "What can you do?" }
  ],
  "stream": false
}
```

## 🧪 Sample curl

### Single prompt:

```bash
curl -X POST http://localhost:8080/chat/api/generate \
  -H "X-API-Key: YOUR_VALID_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "model": "llama3", "prompt": "What is the capital of Japan?" }'
```

### Multi-turn chat:

```bash
curl -X POST http://localhost:8080/chat/api/chat \
  -H "X-API-Key: YOUR_VALID_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "model": "llama3", "messages": [ { "role": "user", "content": "Who won the World Cup in 2022?" } ] }'
```

## 📥 Response
Returns generated text response from the model (JSON).

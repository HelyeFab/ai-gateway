# speak_server.py

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import edge_tts
import asyncio
import io

app = FastAPI()

@app.post("/speak")
async def speak(request: Request):
    body = await request.json()
    text = body.get("text", "")
    voice = body.get("voice", "en-US-JennyNeural")
    rate = body.get("rate", "+0%")

    communicate = edge_tts.Communicate(text, voice, rate=rate)
    audio_data = io.BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.write(chunk["data"])

    audio_data.seek(0)
    return StreamingResponse(audio_data, media_type="audio/mpeg")

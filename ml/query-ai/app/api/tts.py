"""
AIRA Local AI FastAPI TTS Audio Generation Endpoint — Phase 7.2
Synthesizes text using LocalTTS/Piper and returns in-memory playable audio/wav.
Zero persistent audio files created on disk.
"""

import io
import wave
from fastapi import APIRouter, Depends, HTTPException, Response, status

from .schemas import TTSRequest
from .deps import get_tts
from ..tts import LocalTTS, TTSResult

router = APIRouter(tags=["Text-To-Speech Audio"])


@router.post(
    "/tts",
    summary="Synthesize Text to In-Memory Playable WAV Audio",
    responses={
        200: {
            "content": {"audio/wav": {}},
            "description": "Generated in-memory WAV audio stream",
        }
    },
)
async def handle_tts(
    request: TTSRequest,
    tts: LocalTTS = Depends(get_tts),
):
    """
    Synthesize text into raw S16LE PCM audio using Piper,
    package into an in-memory WAV container, and return as audio/wav.
    Zero WAV/audio files are written to disk.
    """
    clean_text = request.text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Text cannot be empty.",
        )

    try:
        pcm_bytes, tts_res = tts.synthesize_to_memory(clean_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Piper synthesis error: {e}",
        )

    if not pcm_bytes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Piper generated 0 PCM bytes.",
        )

    # Package raw S16LE PCM into in-memory WAV container
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, "wb") as wf:
        wf.setnchannels(tts.channels)          # 1 (Mono)
        wf.setsampwidth(2)                    # 16-bit (2 bytes per sample)
        wf.setframerate(tts.sample_rate)      # 16000 Hz
        wf.writeframes(pcm_bytes)

    wav_bytes = wav_buffer.getvalue()

    return Response(
        content=wav_bytes,
        media_type="audio/wav",
        headers={
            "Content-Disposition": "inline; filename=aira_response.wav",
            "X-Audio-Duration-Seconds": str(round(tts_res.audio_duration_s, 2)),
            "X-Synthesis-Latency-Ms": str(round(tts_res.total_synthesis_time_ms, 2)),
            "X-Audio-Format": "S16LE 16000Hz Mono",
        },
    )

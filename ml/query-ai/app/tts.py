"""
S.I.R.I.S. Query AI — Bhasini TTS Integration
Replaces local Piper TTS dependency with Bhasini API Indian Multilingual Text-to-Speech Engine.
"""

import os
import sys
import time
import base64
import requests
from dataclasses import dataclass
from typing import Optional, Dict, Any, Tuple


@dataclass
class TTSResult:
    """Diagnostic metrics and metadata from a TTS synthesis request."""
    text: str
    model_name: str
    first_pcm_latency_ms: float
    first_playback_latency_ms: float
    total_synthesis_time_ms: float
    audio_duration_s: float
    total_bytes: int
    audio_format: str = "WAV 16000Hz Mono (Bhasini TTS)"
    audio_base64: Optional[str] = None
    real_time_factor: Optional[float] = None
    playback_completed_ms: Optional[float] = None

    def __str__(self) -> str:
        return (
            f"TTSResult(provider={self.model_name}, bytes={self.total_bytes}, "
            f"duration={self.audio_duration_s:.2f}s, synth_total={self.total_synthesis_time_ms:.1f}ms)"
        )


class LocalTTS:
    """
    Bhasini Indian Language Text-to-Speech Engine.
    Replaces Piper TTS with Bhasini Dhruva Multilingual Speech Synthesis.
    """

    def __init__(
        self,
        bhasini_api_key: Optional[str] = None,
        bhasini_udyat_key: Optional[str] = None,
        sample_rate: int = 16000,
        channels: int = 1,
    ):
        self.api_key = bhasini_api_key or os.getenv("BHASINI_API_KEY", "-_oVT-BJc9miqpgS6SpTTixyQGXhebibkgsI3CTmelTau7QuQxT_Mnl1R7MgWy8h")
        self.udyat_key = bhasini_udyat_key or os.getenv("BHASINI_UDYAT_KEY", "36bcfef5a1-1c64-4bd1-ba20-329f198c0ed2")
        self.endpoint_url = "https://dhruva-api.bhasini.gov.in/services/inference/pipeline"
        self.sample_rate = sample_rate
        self.channels = channels
        self.model_name = "Bhasini-Dhruva-TTS"

    def get_info(self) -> Dict[str, Any]:
        """Return diagnostic details regarding the Bhasini TTS engine."""
        return {
            "provider": "Bhasini Dhruva API",
            "model_name": self.model_name,
            "sample_rate": self.sample_rate,
            "channels": self.channels,
            "format": "WAV 16kHz Mono (Bhasini TTS)",
            "languages": ["en", "hi", "or", "bn", "mr", "ta", "te"]
        }

    def synthesize(self, text: str, language: str = "hi", gender: str = "female") -> Tuple[bytes, TTSResult]:
        """
        Synthesizes text into audio bytes using Bhasini TTS API.
        """
        clean_text = text.strip() if text else ""
        if not clean_text:
            raise ValueError("Input text for TTS cannot be empty.")

        t_start = time.perf_counter()

        headers = {
            "Content-Type": "application/json",
            "Authorization": self.api_key,
            "ulcaApiKey": self.udyat_key,
            "userID": self.udyat_key,
        }

        payload = {
            "pipelineTasks": [
                {
                    "taskType": "tts",
                    "config": {
                        "language": {
                            "sourceLanguage": language,
                        },
                        "gender": gender
                    }
                }
            ],
            "inputData": {
                "input": [{"source": clean_text}]
            }
        }

        audio_bytes = b""
        audio_base64 = None

        try:
            res = requests.post(self.endpoint_url, headers=headers, json=payload, timeout=10)
            if res.status_code == 200:
                data = res.json()
                audio_base64 = data.get("pipelineResponse", [{}])[0].get("audio", [{}])[0].get("audioContent")
                if audio_base64:
                    audio_bytes = base64.b64decode(audio_base64)
        except Exception as err:
            print(f"[BhasiniTTS] API call notice: {err}")

        t_end = time.perf_counter()
        total_synth_ms = (t_end - t_start) * 1000.0
        audio_duration_s = max(1.0, len(audio_bytes) / 32000.0) if audio_bytes else 1.0

        result = TTSResult(
            text=clean_text,
            model_name=self.model_name,
            first_pcm_latency_ms=round(total_synth_ms, 2),
            first_playback_latency_ms=round(total_synth_ms, 2),
            total_synthesis_time_ms=round(total_synth_ms, 2),
            audio_duration_s=round(audio_duration_s, 2),
            total_bytes=len(audio_bytes),
            audio_base64=audio_base64,
            real_time_factor=round(total_synth_ms / (audio_duration_s * 1000.0), 4)
        )

        return audio_bytes, result

    def speak(self, text: str, language: str = "hi") -> TTSResult:
        """Synthesize text using Bhasini TTS."""
        _, result = self.synthesize(text, language=language)
        return result

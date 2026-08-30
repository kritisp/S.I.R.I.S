"""
AIRA Local AI Package
Phase 1: Local Speech-to-Text Module (faster-whisper GPU)
Phase 2: Local LLM Module (Llama 3.2 Streaming via Ollama)
Phase 3: Local TTS Module (Piper S16LE Streaming)
Phase 4: Full Local Voice Pipeline (STT -> LLM -> Sentence Streaming -> TTS)
Phase 5: Local AI Gateway / Intent Router (Sub-millisecond Action vs LLM Routing)
Phase 6: CrimeLens Local Data Retrieval Layer (Read-Only Structured Case & Entity Retrieval)
"""

from .stt import LocalSTT, TranscriptionResult
from .llm import LocalLLM, LLMResult
from .tts import LocalTTS, TTSResult
from .gateway import LocalGateway, IntentResult
from .retriever import CrimeLensRetriever, RetrievalRequest, RetrievalResult
from .pipeline import LocalVoicePipeline, PipelineResult

__all__ = [
    "LocalSTT",
    "TranscriptionResult",
    "LocalLLM",
    "LLMResult",
    "LocalTTS",
    "TTSResult",
    "LocalGateway",
    "IntentResult",
    "CrimeLensRetriever",
    "RetrievalRequest",
    "RetrievalResult",
    "LocalVoicePipeline",
    "PipelineResult",
]

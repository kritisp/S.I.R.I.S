"""
AIRA Local AI FastAPI Service Dependencies — Phase 7.2
Singleton service providers to prevent redundant allocations and VRAM consumption.
"""

from typing import Optional
from ..gateway import LocalGateway
from ..retriever import CrimeLensRetriever
from ..llm import LocalLLM
from ..stt import LocalSTT
from ..tts import LocalTTS
from ..pipeline import LocalVoicePipeline

_gateway_instance: Optional[LocalGateway] = None
_retriever_instance: Optional[CrimeLensRetriever] = None
_llm_instance: Optional[LocalLLM] = None
_stt_instance: Optional[LocalSTT] = None
_tts_instance: Optional[LocalTTS] = None
_pipeline_instance: Optional[LocalVoicePipeline] = None


def get_gateway() -> LocalGateway:
    """Get or initialize singleton LocalGateway."""
    global _gateway_instance
    if _gateway_instance is None:
        _gateway_instance = LocalGateway(action_threshold=0.85)
    return _gateway_instance


def get_retriever() -> CrimeLensRetriever:
    """Get or initialize singleton CrimeLensRetriever."""
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = CrimeLensRetriever()
    return _retriever_instance


def get_llm() -> LocalLLM:
    """Get or initialize singleton LocalLLM client."""
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LocalLLM(host="http://127.0.0.1:11434", model="llama3.2:latest")
    return _llm_instance


def get_stt() -> LocalSTT:
    """Get or initialize singleton LocalSTT."""
    global _stt_instance
    if _stt_instance is None:
        _stt_instance = LocalSTT(model_size="small", device="cuda", compute_type="float16")
    return _stt_instance


def get_tts() -> LocalTTS:
    """Get or initialize singleton LocalTTS."""
    global _tts_instance
    if _tts_instance is None:
        _tts_instance = LocalTTS(
            piper_path=r"D:\piper\piper.exe",
            model_path=r"D:\piper\en_US-amy-low.onnx",
            sample_rate=16000,
            channels=1,
        )
    return _tts_instance


def get_pipeline() -> LocalVoicePipeline:
    """Get or initialize singleton LocalVoicePipeline sharing the component singletons."""
    global _pipeline_instance
    if _pipeline_instance is None:
        stt = get_stt()
        llm = get_llm()
        tts = get_tts()
        gateway = get_gateway()
        retriever = get_retriever()
        _pipeline_instance = LocalVoicePipeline(
            stt=stt,
            llm=llm,
            tts=tts,
            gateway=gateway,
            retriever=retriever,
        )
    return _pipeline_instance

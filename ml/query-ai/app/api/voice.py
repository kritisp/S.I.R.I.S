"""
AIRA Local AI FastAPI Voice Router — Phase 7.2
Handles uploaded audio voice queries (POST /api/voice/query) and full voice pipeline turns (POST /api/voice/turn).
Strictly in-memory with zero persistent audio files on disk.
"""

import io
import time
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status

from .schemas import (
    VoiceQueryResponse,
    VoiceTurnRequest,
    VoiceTurnResponse,
    VoiceLatencyBreakdown,
)
from .deps import get_stt, get_gateway, get_retriever, get_llm, get_pipeline
from ..stt import LocalSTT, TranscriptionResult
from ..gateway import LocalGateway, IntentResult
from ..retriever import CrimeLensRetriever, RetrievalRequest, RetrievalResult
from ..llm import LocalLLM, LLMResult
from ..pipeline import LocalVoicePipeline, PipelineResult

router = APIRouter(prefix="/voice", tags=["Voice Audio & Pipeline"])

SYSTEM_PROMPT = (
    "You are AIRA, a local police investigation assistant. "
    "Answer clearly and concisely in 2 to 3 short sentences. "
    "Base your answer strictly on the verified CrimeLens records provided. "
    "If a record or detail is missing, state clearly that it is not available. "
    "Do not invent facts or case details. Avoid markdown asterisks, bullets, or headers."
)


# -----------------------------------------------------------------------------
# ENDPOINT 4: POST /api/voice/query (Uploaded Audio Processing)
# -----------------------------------------------------------------------------
@router.post(
    "/query",
    response_model=VoiceQueryResponse,
    summary="Process Uploaded Audio via Local STT -> Gateway -> Grounded LLM",
)
async def handle_voice_query(
    audio: UploadFile = File(..., description="Uploaded audio file (WAV/MP3/FLAC/OGG/PCM)"),
    stt: LocalSTT = Depends(get_stt),
    gateway: LocalGateway = Depends(get_gateway),
    retriever: CrimeLensRetriever = Depends(get_retriever),
    llm: LocalLLM = Depends(get_llm),
):
    """
    Accept an uploaded audio file, transcribe in-memory via faster-whisper on CUDA,
    route transcript through LocalGateway, and generate grounded answer.
    Audio remains strictly in memory (0 WAV/MP3 files saved to disk).
    """
    file_bytes = await audio.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded audio file is empty.",
        )

    # 1. In-Memory STT Transcription
    t_stt_start = time.perf_counter()
    try:
        # Pass in-memory BytesIO buffer directly to Whisper on CUDA
        audio_stream = io.BytesIO(file_bytes)
        segments_gen, info = stt.model.transcribe(
            audio_stream,
            language=stt.language,
            vad_filter=stt.vad_filter,
            beam_size=5,
        )
        transcript = " ".join([seg.text.strip() for seg in segments_gen]).strip()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"In-memory STT transcription failed: {e}",
        )
    finally:
        audio_stream.close()

    stt_latency_ms = (time.perf_counter() - t_stt_start) * 1000.0

    # 2. Local AI Gateway Intent Routing
    intent_res: IntentResult = gateway.route(transcript)

    if intent_res.mode == "ACTION":
        return VoiceQueryResponse(
            success=True,
            transcript=transcript,
            mode="ACTION",
            intent=intent_res.intent,
            parameters=intent_res.parameters,
            response=f"[ACTION TRIGGERED] {intent_res.intent}",
            grounded=False,
            latency_ms={
                "stt": round(stt_latency_ms, 1),
                "gateway": round(intent_res.latency_ms, 3),
                "retrieval": 0.0,
                "llm_first_token": 0.0,
                "llm_total": 0.0,
            },
        )

    # 3. Conversational / Grounded LLM Flow
    retrieval_ms = 0.0
    grounded = False
    prompt_with_context = transcript

    if intent_res.retrieval_request:
        req = intent_res.retrieval_request
        t_ret_start = time.perf_counter()
        ret_res: RetrievalResult = retriever.retrieve(req)
        retrieval_ms = (time.perf_counter() - t_ret_start) * 1000.0
        grounded = ret_res.success or ("NOT FOUND" in ret_res.formatted_context)

        if ret_res.formatted_context:
            prompt_with_context = f"{ret_res.formatted_context}\n\nUser Question: {transcript}"

    # 4. LLM Generation
    try:
        llm_res: LLMResult = llm.generate(
            prompt=prompt_with_context,
            system_prompt=SYSTEM_PROMPT,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Local LLM generation failed: {e}",
        )

    return VoiceQueryResponse(
        success=True,
        transcript=transcript,
        mode="LLM",
        intent=intent_res.intent,
        parameters=intent_res.parameters,
        response=llm_res.text,
        grounded=grounded,
        latency_ms={
            "stt": round(stt_latency_ms, 1),
            "gateway": round(intent_res.latency_ms, 3),
            "retrieval": round(retrieval_ms, 2) if retrieval_ms > 0 else 0.0,
            "llm_first_token": round(llm_res.first_chunk_latency_ms, 1),
            "llm_total": round(llm_res.total_generation_latency_ms, 1),
        },
    )


# -----------------------------------------------------------------------------
# POST /api/voice/turn (Full Voice Pipeline Turn via API)
# -----------------------------------------------------------------------------
@router.post(
    "/turn",
    response_model=VoiceTurnResponse,
    summary="Execute Local Voice Turn via Pipeline Engine",
)
async def execute_voice_turn(
    request: VoiceTurnRequest,
    pipeline: LocalVoicePipeline = Depends(get_pipeline),
):
    """
    Execute one complete voice turn reusing LocalVoicePipeline.
    """
    try:
        res: PipelineResult = pipeline.run_turn(
            text_input=request.text_input,
            play_audio=request.play_audio,
            max_record_seconds=request.max_record_seconds,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice pipeline execution failed: {e}",
        )

    latencies = VoiceLatencyBreakdown(
        recording_duration_s=res.recording_duration_s,
        stt_ms=res.stt_latency_ms,
        gateway_ms=res.gateway_latency_ms,
        retrieval_ms=res.retrieval_latency_ms,
        llm_first_token_ms=res.llm_first_token_latency_ms,
        tts_first_pcm_ms=res.tts_first_pcm_latency_ms,
        speech_to_first_audio_ms=res.speech_start_to_first_audio_ms,
        total_duration_ms=res.speech_start_to_complete_response_ms,
    )

    return VoiceTurnResponse(
        transcript=res.transcript,
        response=res.full_response,
        sentences=res.sentences,
        mode=res.mode,
        intent=res.intent,
        intent_parameters=res.intent_parameters,
        grounded=res.retrieval_performed,
        overlap_achieved=res.overlap_achieved,
        timed_out=res.timed_out,
        latencies=latencies,
    )

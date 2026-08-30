"""
AIRA Local Voice Pipeline — Phase 4, Phase 5 & Phase 6 (Pre-Synthesis + Natural Cadence TTS)
Full local end-to-end voice assistant: STT (Whisper + VAD) -> Gateway / Intent Router -> (ACTION or CrimeLens Data Retrieval -> Llama 3.2 -> Pre-Synthesized Piper TTS -> Speakers).
"""

import re
import sys
import time
import queue
import threading
from dataclasses import dataclass, field
from typing import List, Optional, Callable, Dict, Any, Tuple
import numpy as np
import sounddevice as sd

from .stt import LocalSTT, TranscriptionResult
from .llm import LocalLLM, LLMResult
from .tts import LocalTTS, TTSResult
from .gateway import LocalGateway, IntentResult
from .retriever import CrimeLensRetriever, RetrievalRequest, RetrievalResult


@dataclass
class SentenceEvent:
    """A sentence chunk passed from LLM stream to TTS worker queue."""
    index: int
    text: str
    created_at: float


@dataclass
class SynthesizedSentence:
    """An in-memory pre-synthesized PCM sentence chunk ready for seamless audio playback."""
    index: int
    text: str
    pcm_bytes: bytes
    tts_result: TTSResult
    created_at: float
    synth_time_ms: float


@dataclass
class PipelineResult:
    """Detailed timing and diagnostic summary for an end-to-end voice turn."""
    transcript: str
    full_response: str
    sentences: List[str]
    
    # Gateway / Intent properties
    mode: str = "LLM"                             # "ACTION" or "LLM"
    intent: str = "CONVERSATIONAL"                # e.g., "OPEN_FIR", "OPEN_EVIDENCE_VAULT", "CONVERSATIONAL"
    intent_parameters: Dict[str, Any] = field(default_factory=dict)
    intent_confidence: float = 0.0
    gateway_latency_ms: float = 0.0

    # Data Retrieval properties
    retrieval_performed: bool = False
    retrieval_resource: Optional[str] = None
    retrieval_identifier: Optional[str] = None
    retrieval_success: bool = False
    retrieval_latency_ms: float = 0.0
    retrieval_records_count: int = 0

    # Latencies in milliseconds
    recording_duration_s: float = 0.0
    stt_latency_ms: float = 0.0
    speech_end_to_transcript_ms: float = 0.0
    llm_first_token_latency_ms: float = 0.0
    llm_first_sentence_latency_ms: float = 0.0
    tts_first_pcm_latency_ms: float = 0.0
    tts_first_playback_latency_ms: float = 0.0
    
    # Key perceived responsiveness metrics
    speech_start_to_first_audio_ms: float = 0.0
    speech_start_to_complete_response_ms: float = 0.0
    
    # Component totals
    llm_total_generation_ms: float = 0.0
    tts_total_synthesis_ms: float = 0.0
    
    # Diagnostics
    timed_out: bool = False
    overlap_achieved: bool = True
    audio_format: str = "S16LE 16000Hz Mono"
    stt_device: str = "CUDA"
    llm_model: str = "llama3.2:latest"
    tts_voice: str = "en_US-amy-low"


class LocalVoicePipeline:
    """
    Complete local voice assistant pipeline orchestrating STT, Intent Gateway, CrimeLens Data Retrieval, LLM, and Pre-Synthesized Streaming TTS.
    
    Features:
    - Zero cloud APIs (100% local on RTX 3050 GPU + CPU).
    - Local AI Gateway: Sub-millisecond deterministic operational command routing.
    - Grounded Data Retrieval: Deterministic read-only SQLite retrieval for verified case, evidence, and entity facts.
    - Zero SQL Exposure: Llama 3.2 never touches database or generates SQL.
    - Automatic speech-end detection (VAD): Stops recording naturally when user finishes speaking.
    - Pre-Synthesis + Natural Cadence: Synthesizes upcoming sentences in the background while previous sentence plays, with an exact 200ms natural conversational pause.
    - Zero temporary audio files written to disk (in-memory S16LE PCM stream).
    - Precise end-to-end latency measurement across all pipeline boundaries.
    """

    def __init__(
        self,
        stt: Optional[LocalSTT] = None,
        llm: Optional[LocalLLM] = None,
        tts: Optional[LocalTTS] = None,
        gateway: Optional[LocalGateway] = None,
        retriever: Optional[CrimeLensRetriever] = None,
        system_prompt: Optional[str] = None,
        inter_sentence_pause_s: float = 0.20,
    ):
        print("[PIPELINE] Initializing local voice pipeline components...")
        
        # 1. Initialize STT
        self.stt = stt if stt is not None else LocalSTT(model_size="small", device="cuda", compute_type="float16")

        # 2. Initialize LLM
        self.llm = llm if llm is not None else LocalLLM(host="http://127.0.0.1:11434", model="llama3.2:latest")

        # 3. Initialize TTS
        self.tts = tts if tts is not None else LocalTTS(
            piper_path=r"D:\piper\piper.exe",
            model_path=r"D:\piper\en_US-amy-low.onnx",
            sample_rate=16000,
            channels=1,
        )

        # 4. Initialize Local Gateway / Intent Router
        self.gateway = gateway if gateway is not None else LocalGateway(action_threshold=0.85)

        # 5. Initialize CrimeLens Data Retrieval Service
        self.retriever = retriever if retriever is not None else CrimeLensRetriever()

        self.inter_sentence_pause_s = inter_sentence_pause_s

        self.system_prompt = system_prompt or (
            "You are AIRA, a local police investigation assistant. "
            "Answer clearly and concisely in 2 to 3 short sentences. "
            "Base your answer strictly on the verified CrimeLens records provided. "
            "If a record or detail is missing, state clearly that it is not available. "
            "Do not invent facts or case details. Avoid markdown asterisks, bullets, or headers."
        )

        self.stop_event = threading.Event()
        print("[PIPELINE] All local components initialized and ready.\n")

    @staticmethod
    def _extract_sentences(text_buffer: str) -> Tuple[List[str], str]:
        """
        Extract completed sentences from a text buffer based on punctuation boundaries.
        Returns (list_of_completed_sentences, remaining_uncompleted_buffer).
        """
        parts = re.split(r'(?<=[.?!])\s+|\n+', text_buffer)
        if len(parts) > 1:
            completed = [p.strip() for p in parts[:-1] if p.strip()]
            remaining = parts[-1]
            return completed, remaining
        return [], text_buffer

    def run_turn(
        self,
        record_seconds: Optional[float] = None,
        max_record_seconds: float = 15.0,
        initial_silence_timeout: float = 5.0,
        trailing_silence_s: float = 1.2,
        speech_threshold: Optional[float] = None,
        audio_input: Optional[np.ndarray] = None,
        text_input: Optional[str] = None,
        play_audio: bool = True,
        on_status: Optional[Callable[[str], None]] = None,
    ) -> PipelineResult:
        """
        Execute one complete turn of the local voice pipeline.
        
        Steps:
        1. Capture speech from microphone using automatic VAD speech-end detection.
        2. Transcribe using faster-whisper on CUDA.
        3. Route transcript through Local Gateway:
           - If ACTION: Return structured action result immediately (LLM & TTS bypassed).
           - If LLM: Deterministically retrieve relevant CrimeLens data -> Inject grounded context -> Stream Llama 3.2 -> Sentence streaming -> Pre-Synthesized Piper TTS.
        4. Measure and record full latency breakdown.
        """
        self.stop_event.clear()

        # Handle record_seconds backward compatibility as max safety cap
        max_rec = record_seconds if record_seconds is not None else max_record_seconds

        def log_status(msg: str):
            if on_status:
                on_status(msg)

        # ---------------------------------------------------------------------
        # STAGE 1: Audio Input & STT Transcription
        # ---------------------------------------------------------------------
        t_speech_start = time.perf_counter()
        t_speech_end = t_speech_start
        actual_rec_duration_s = 0.0
        stt_latency_ms = 0.0
        speech_end_to_transcript_ms = 0.0

        if text_input:
            transcript = text_input.strip()
            t_transcript_available = time.perf_counter()
            actual_rec_duration_s = 0.0
            stt_latency_ms = 0.0
            speech_end_to_transcript_ms = 0.0
        else:
            if audio_input is not None:
                audio = audio_input
                actual_rec_duration_s = len(audio) / 16000.0
                t_speech_end = time.perf_counter()
            else:
                log_status("[STT] Listening for speech (auto-detect speech end)...")
                audio, vad_meta = self.stt.record_until_silence(
                    max_seconds=max_rec,
                    initial_silence_timeout=initial_silence_timeout,
                    trailing_silence_s=trailing_silence_s,
                    speech_threshold=speech_threshold,
                    on_speech_detected=lambda: log_status("[STT] Speech detected..."),
                    on_speech_ended=lambda: log_status("[STT] Speech ended..."),
                )
                actual_rec_duration_s = vad_meta.get("recording_duration_s", 0.0)
                t_speech_end = vad_meta.get("speech_end_time", time.perf_counter())

                if not vad_meta.get("speech_detected") or len(audio) == 0:
                    log_status("[STT] No speech detected before timeout.")
                    return PipelineResult(
                        transcript="",
                        full_response="",
                        sentences=[],
                        recording_duration_s=0.0,
                        stt_latency_ms=0.0,
                        speech_end_to_transcript_ms=0.0,
                        llm_first_token_latency_ms=0.0,
                        llm_first_sentence_latency_ms=0.0,
                        tts_first_pcm_latency_ms=0.0,
                        tts_first_playback_latency_ms=0.0,
                        speech_start_to_first_audio_ms=0.0,
                        speech_start_to_complete_response_ms=round((time.perf_counter() - t_speech_start) * 1000.0, 1),
                        llm_total_generation_ms=0.0,
                        tts_total_synthesis_ms=0.0,
                        timed_out=True,
                        overlap_achieved=False,
                    )

            log_status("[STT] Transcribing speech...")
            stt_res = self.stt.transcribe(audio)
            t_transcript_available = time.perf_counter()
            stt_latency_ms = stt_res.transcription_time_ms
            speech_end_to_transcript_ms = (t_transcript_available - t_speech_end) * 1000.0
            transcript = stt_res.text.strip()

        if not transcript:
            log_status("[STT] Empty transcript returned.")
            return PipelineResult(
                transcript="",
                full_response="",
                sentences=[],
                recording_duration_s=actual_rec_duration_s,
                stt_latency_ms=stt_latency_ms,
                speech_end_to_transcript_ms=speech_end_to_transcript_ms,
                llm_first_token_latency_ms=0.0,
                llm_first_sentence_latency_ms=0.0,
                tts_first_pcm_latency_ms=0.0,
                tts_first_playback_latency_ms=0.0,
                speech_start_to_first_audio_ms=0.0,
                speech_start_to_complete_response_ms=round((time.perf_counter() - t_speech_start) * 1000.0, 1),
                llm_total_generation_ms=0.0,
                tts_total_synthesis_ms=0.0,
                timed_out=False,
                overlap_achieved=False,
            )

        log_status(f"[STT] You said: \"{transcript}\"")

        # ---------------------------------------------------------------------
        # STAGE 2: Local AI Gateway / Intent Routing
        # ---------------------------------------------------------------------
        intent_res = self.gateway.route(transcript)
        stt_info = self.stt.get_device_info()
        tts_info = self.tts.get_info()

        if intent_res.mode == "ACTION":
            log_status(f"[GATEWAY] Routing -> ACTION: {intent_res.intent} (conf: {intent_res.confidence:.2f}, {intent_res.latency_ms:.3f} ms)")
            log_status(f"[ACTION] Intent: {intent_res.intent} | Parameters: {intent_res.parameters}")

            t_action_complete = time.perf_counter()
            return PipelineResult(
                transcript=transcript,
                full_response=f"[ACTION TRIGGERED] {intent_res.intent}",
                sentences=[],
                mode="ACTION",
                intent=intent_res.intent,
                intent_parameters=intent_res.parameters,
                intent_confidence=intent_res.confidence,
                gateway_latency_ms=intent_res.latency_ms,
                recording_duration_s=actual_rec_duration_s,
                stt_latency_ms=stt_latency_ms,
                speech_end_to_transcript_ms=speech_end_to_transcript_ms,
                llm_first_token_latency_ms=0.0,
                llm_first_sentence_latency_ms=0.0,
                tts_first_pcm_latency_ms=0.0,
                tts_first_playback_latency_ms=0.0,
                speech_start_to_first_audio_ms=0.0,
                speech_start_to_complete_response_ms=round((t_action_complete - t_speech_start) * 1000.0, 1),
                llm_total_generation_ms=0.0,
                tts_total_synthesis_ms=0.0,
                timed_out=False,
                overlap_achieved=False,
                stt_device=stt_info.get("device", "cuda").upper(),
                llm_model=self.llm.model,
                tts_voice=tts_info.get("model_name", "en_US-amy-low"),
            )

        log_status(f"[GATEWAY] Routing -> CONVERSATIONAL / LLM ({intent_res.latency_ms:.3f} ms)")

        # ---------------------------------------------------------------------
        # STAGE 3: CrimeLens Local Data Retrieval & Grounded Context Creation
        # ---------------------------------------------------------------------
        retrieval_performed = False
        retrieval_resource = None
        retrieval_identifier = None
        retrieval_success = False
        retrieval_lat_ms = 0.0
        retrieval_records_count = 0
        prompt_with_context = transcript

        if intent_res.retrieval_request:
            req = intent_res.retrieval_request
            retrieval_performed = True
            retrieval_resource = req.resource
            retrieval_identifier = req.identifier
            
            log_status(f"[RETRIEVER] Querying CrimeLens database for {req.resource} '{req.identifier}'...")
            t_ret_start = time.perf_counter()
            ret_res = self.retriever.retrieve(req)
            t_ret_end = time.perf_counter()
            retrieval_lat_ms = (t_ret_end - t_ret_start) * 1000.0
            retrieval_success = ret_res.success
            retrieval_records_count = ret_res.raw_records_count

            log_status(f"[RETRIEVER] Retrieved {retrieval_records_count} records in {retrieval_lat_ms:.2f} ms")
            
            if ret_res.formatted_context:
                prompt_with_context = f"{ret_res.formatted_context}\n\nUser Question: {transcript}"

        # ---------------------------------------------------------------------
        # STAGE 4: Two-Stage TTS Pipeline: Pre-Synthesis + Natural Cadence Playback
        # ---------------------------------------------------------------------
        synthesis_queue: queue.Queue = queue.Queue()
        playback_queue: queue.Queue = queue.Queue()
        
        sentences_collected: List[str] = []
        tts_results: List[TTSResult] = []
        
        t_first_sentence_ready: Optional[float] = None
        t_first_tts_pcm: Optional[float] = None
        t_first_audio_playback: Optional[float] = None
        tts_pipeline_error: List[Exception] = []

        # 1. Background Synthesis Worker (Runs Piper in memory as soon as LLM emits sentence)
        def synthesis_worker():
            nonlocal t_first_tts_pcm
            while not self.stop_event.is_set():
                try:
                    event: Optional[SentenceEvent] = synthesis_queue.get(timeout=0.1)
                except queue.Empty:
                    continue

                if event is None:
                    synthesis_queue.task_done()
                    playback_queue.put(None)
                    break

                try:
                    t_s0 = time.perf_counter()
                    pcm_bytes, res = self.tts.synthesize_to_memory(event.text)
                    t_s1 = time.perf_counter()
                    synth_ms = (t_s1 - t_s0) * 1000.0

                    if t_first_tts_pcm is None:
                        t_first_tts_pcm = t_s1

                    playback_queue.put(
                        SynthesizedSentence(
                            index=event.index,
                            text=event.text,
                            pcm_bytes=pcm_bytes,
                            tts_result=res,
                            created_at=event.created_at,
                            synth_time_ms=synth_ms,
                        )
                    )
                except Exception as e:
                    tts_pipeline_error.append(e)
                finally:
                    synthesis_queue.task_done()

        # 2. Sequential Playback Worker (Streams pre-synthesized PCM to speakers with natural pause)
        def playback_worker():
            nonlocal t_first_audio_playback
            raw_stream = None
            if play_audio:
                try:
                    raw_stream = sd.RawOutputStream(
                        samplerate=self.tts.sample_rate,
                        channels=self.tts.channels,
                        dtype="int16",
                    )
                    raw_stream.start()
                except Exception as e:
                    tts_pipeline_error.append(e)
                    return

            try:
                while not self.stop_event.is_set():
                    try:
                        synth_item: Optional[SynthesizedSentence] = playback_queue.get(timeout=0.1)
                    except queue.Empty:
                        continue

                    if synth_item is None:
                        playback_queue.task_done()
                        break

                    # Natural conversational cadence pause between sentences
                    if synth_item.index > 1 and play_audio and self.inter_sentence_pause_s > 0:
                        time.sleep(self.inter_sentence_pause_s)

                    log_status(f"[TTS] Speaking sentence {synth_item.index}: \"{synth_item.text}\"")

                    now = time.perf_counter()
                    if t_first_audio_playback is None and play_audio:
                        t_first_audio_playback = now

                    if play_audio and raw_stream is not None:
                        # Stream PCM chunks to sound card
                        chunk_size = 4096
                        pcm = synth_item.pcm_bytes
                        for offset in range(0, len(pcm), chunk_size):
                            if self.stop_event.is_set():
                                break
                            raw_stream.write(pcm[offset : offset + chunk_size])

                    log_status(f"[TTS] Finished sentence {synth_item.index}")
                    tts_results.append(synth_item.tts_result)
                    playback_queue.task_done()

            except Exception as e:
                tts_pipeline_error.append(e)
            finally:
                if raw_stream is not None:
                    try:
                        raw_stream.stop()
                        raw_stream.close()
                    except Exception:
                        pass

        synth_thread = threading.Thread(target=synthesis_worker, daemon=True)
        play_thread = threading.Thread(target=playback_worker, daemon=True)
        
        synth_thread.start()
        play_thread.start()

        # ---------------------------------------------------------------------
        # STAGE 5: Stream from LLM with Grounded Context & Split Sentences
        # ---------------------------------------------------------------------
        t_llm_start = time.perf_counter()
        t_llm_first_token: Optional[float] = None
        full_llm_tokens: List[str] = []
        buffer = ""
        sentence_index = 0

        log_status("[LLM] Generating grounded response...")

        try:
            llm_stream = self.llm.stream_response(
                prompt=prompt_with_context,
                system_prompt=self.system_prompt,
            )

            for token in llm_stream:
                if self.stop_event.is_set():
                    break

                now = time.perf_counter()
                if t_llm_first_token is None:
                    t_llm_first_token = now

                full_llm_tokens.append(token)
                buffer += token

                completed_sentences, buffer = self._extract_sentences(buffer)
                for sentence in completed_sentences:
                    if sentence:
                        sentence_index += 1
                        sentences_collected.append(sentence)
                        if t_first_sentence_ready is None:
                            t_first_sentence_ready = time.perf_counter()
                        
                        log_status(f"[LLM] Sentence {sentence_index} ready: \"{sentence}\"")
                        synthesis_queue.put(SentenceEvent(index=sentence_index, text=sentence, created_at=time.perf_counter()))

            # Flush any remaining buffer text
            remaining = buffer.strip()
            if remaining and not self.stop_event.is_set():
                sentence_index += 1
                sentences_collected.append(remaining)
                if t_first_sentence_ready is None:
                    t_first_sentence_ready = time.perf_counter()
                log_status(f"[LLM] Sentence {sentence_index} ready (final): \"{remaining}\"")
                synthesis_queue.put(SentenceEvent(index=sentence_index, text=remaining, created_at=time.perf_counter()))

        except Exception as e:
            self.stop_event.set()
            synthesis_queue.put(None)
            synth_thread.join(timeout=1.0)
            play_thread.join(timeout=1.0)
            raise RuntimeError(f"LLM streaming failed: {e}") from e

        t_llm_done = time.perf_counter()
        full_response = "".join(full_llm_tokens).strip()

        # Signal background workers and wait for playback to finish
        synthesis_queue.put(None)
        synth_thread.join(timeout=20.0)
        play_thread.join(timeout=30.0)

        t_all_complete = time.perf_counter()

        if tts_pipeline_error:
            raise RuntimeError(f"TTS playback worker error: {tts_pipeline_error[0]}") from tts_pipeline_error[0]

        # ---------------------------------------------------------------------
        # STAGE 6: Latency Calculations & Diagnostics
        # ---------------------------------------------------------------------
        t_llm_first_tok = t_llm_first_token or t_llm_start
        t_first_sent = t_first_sentence_ready or t_llm_done
        t_first_pcm = t_first_tts_pcm or t_first_sent
        t_first_play = t_first_audio_playback or t_first_pcm

        transcript_to_first_tok = (t_llm_first_tok - t_transcript_available) * 1000.0
        first_tok_to_first_sent = (t_first_sent - t_llm_first_tok) * 1000.0
        first_sent_to_first_pcm = (t_first_pcm - t_first_sent) * 1000.0
        first_pcm_to_play = (t_first_play - t_first_pcm) * 1000.0
        
        speech_to_first_play = (t_first_play - t_speech_start) * 1000.0
        speech_to_complete = (t_all_complete - t_speech_start) * 1000.0
        llm_total_ms = (t_llm_done - t_llm_start) * 1000.0
        tts_total_synth = sum(r.total_synthesis_time_ms for r in tts_results)

        overlap_achieved = (t_llm_done > t_first_play) or (len(sentences_collected) > 1 and t_llm_done > t_first_sent)

        return PipelineResult(
            transcript=transcript,
            full_response=full_response,
            sentences=sentences_collected,
            mode="LLM",
            intent="CONVERSATIONAL",
            intent_parameters={},
            intent_confidence=0.0,
            gateway_latency_ms=intent_res.latency_ms,
            retrieval_performed=retrieval_performed,
            retrieval_resource=retrieval_resource,
            retrieval_identifier=retrieval_identifier,
            retrieval_success=retrieval_success,
            retrieval_latency_ms=round(retrieval_lat_ms, 2),
            retrieval_records_count=retrieval_records_count,
            recording_duration_s=round(actual_rec_duration_s, 2),
            stt_latency_ms=round(stt_latency_ms, 1),
            speech_end_to_transcript_ms=round(max(0.0, speech_end_to_transcript_ms), 1),
            llm_first_token_latency_ms=round(transcript_to_first_tok, 1),
            llm_first_sentence_latency_ms=round(first_tok_to_first_sent, 1),
            tts_first_pcm_latency_ms=round(first_sent_to_first_pcm, 1),
            tts_first_playback_latency_ms=round(first_pcm_to_play, 1),
            speech_start_to_first_audio_ms=round(speech_to_first_play, 1),
            speech_start_to_complete_response_ms=round(speech_to_complete, 1),
            llm_total_generation_ms=round(llm_total_ms, 1),
            tts_total_synthesis_ms=round(tts_total_synth, 1),
            timed_out=False,
            overlap_achieved=overlap_achieved,
            stt_device=stt_info.get("device", "cuda").upper(),
            llm_model=self.llm.model,
            tts_voice=tts_info.get("model_name", "en_US-amy-low"),
        )

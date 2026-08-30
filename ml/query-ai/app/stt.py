"""
AIRA Local STT Module — Phase 1 & Phase 4.1
High-performance in-memory Speech-to-Text using faster-whisper with NVIDIA GPU acceleration
and automatic Voice Activity Detection (VAD) / Speech-End Detection.
"""

import os
import sys
import time
import subprocess
from collections import deque
from dataclasses import dataclass, field
from typing import List, Optional, Union, Dict, Any, Tuple, Callable

# ---------------------------------------------------------------------------
# Windows CUDA / cuBLAS / cuDNN DLL Registration
# ---------------------------------------------------------------------------
def _setup_windows_cuda_dlls():
    """Ensure Windows loads NVIDIA pip wheel DLLs (cublas, cudnn, etc.) for CTranslate2."""
    if sys.platform != "win32":
        return

    venv_base = sys.prefix
    nvidia_dir = os.path.join(venv_base, "Lib", "site-packages", "nvidia")
    if not os.path.exists(nvidia_dir):
        return

    added_paths = []
    for pkg in os.listdir(nvidia_dir):
        bin_dir = os.path.join(nvidia_dir, pkg, "bin")
        if os.path.isdir(bin_dir):
            try:
                os.add_dll_directory(bin_dir)
                added_paths.append(bin_dir)
            except Exception:
                pass

    if added_paths:
        current_path = os.environ.get("PATH", "")
        os.environ["PATH"] = ";".join(added_paths) + ";" + current_path


_setup_windows_cuda_dlls()

import numpy as np
import sounddevice as sd
import ctranslate2
from faster_whisper import WhisperModel


@dataclass
class TranscriptionSegment:
    start: float
    end: float
    text: str
    confidence: Optional[float] = None


@dataclass
class TranscriptionResult:
    """Structured transcription output with latency and device diagnostics."""
    text: str
    language: str
    language_probability: float
    duration_s: float
    transcription_time_ms: float
    model_load_time_ms: float
    recording_time_ms: Optional[float] = None
    total_time_ms: Optional[float] = None
    device: str = "cuda"
    compute_type: str = "float16"
    model_size: str = "small"
    segments: List[TranscriptionSegment] = field(default_factory=list)

    def __str__(self) -> str:
        return self.text


class LocalSTT:
    """
    Reusable Local Speech-to-Text engine.
    
    Features:
    - Zero permanent audio files (pure in-memory audio buffers).
    - Single-time model initialization on RTX 3050 GPU (CUDA float16).
    - Automatic Voice Activity Detection (VAD) & speech-end detection.
    - Precise latency measurement for recording and transcription.
    - Robust error handling for audio devices and CUDA runtime.
    """

    def __init__(
        self,
        model_size: str = "small",
        device: Optional[str] = None,
        compute_type: Optional[str] = None,
        language: str = "en",
        vad_filter: bool = True,
        download_root: Optional[str] = None,
    ):
        self.model_size = model_size
        self.language = language
        self.vad_filter = vad_filter
        self.download_root = download_root

        # Determine target device & verify CUDA availability
        cuda_count = ctranslate2.get_cuda_device_count()
        if device is None:
            self.device = "cuda" if cuda_count > 0 else "cpu"
        else:
            self.device = device.lower()

        if self.device == "cuda":
            if cuda_count == 0:
                raise RuntimeError(
                    "CUDA requested or expected, but ctranslate2 detected 0 CUDA devices. "
                    "Verify NVIDIA driver installation and GPU visibility."
                )
            if compute_type is None:
                self.compute_type = "float16"
            else:
                self.compute_type = compute_type
        else:
            if compute_type is None:
                self.compute_type = "int8"
            else:
                self.compute_type = compute_type

        self.gpu_name = self._query_gpu_name() if self.device == "cuda" else "CPU"

        # Load Whisper model once
        print(f"Loading faster-whisper model '{self.model_size}' on {self.device.upper()} ({self.compute_type})...")
        t0 = time.perf_counter()
        try:
            self.model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
                download_root=self.download_root,
            )
        except Exception as e:
            if self.device == "cuda":
                raise RuntimeError(
                    f"Failed to load Whisper on CUDA ({self.compute_type}): {e}\n"
                    "Ensure cuBLAS / cuDNN DLLs are accessible."
                ) from e
            raise RuntimeError(f"Failed to load Whisper model: {e}") from e

        t1 = time.perf_counter()
        self.model_load_time_ms = (t1 - t0) * 1000.0
        print(f"Whisper model loaded in {self.model_load_time_ms:.1f} ms.")

    def _query_gpu_name(self) -> str:
        """Query GPU model name via nvidia-smi."""
        try:
            out = subprocess.check_output(
                ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
                text=True,
                stderr=subprocess.DEVNULL,
            ).strip()
            if out:
                return out.splitlines()[0].strip()
        except Exception:
            pass
        return "NVIDIA GPU (CUDA detected)"

    def get_device_info(self) -> Dict[str, Any]:
        """Return diagnostic details regarding GPU and inference configuration."""
        cuda_count = ctranslate2.get_cuda_device_count()
        return {
            "device": self.device,
            "cuda_available": cuda_count > 0,
            "cuda_device_count": cuda_count,
            "gpu_name": self.gpu_name,
            "compute_type": self.compute_type,
            "model_size": self.model_size,
            "model_load_time_ms": round(self.model_load_time_ms, 2),
        }

    def record(
        self,
        seconds: float = 5.0,
        sample_rate: int = 16000,
    ) -> np.ndarray:
        """
        Record audio from microphone for a fixed duration directly into an in-memory NumPy float32 array.
        Preserved for backwards compatibility. Zero WAV file creation on disk.
        """
        if seconds <= 0:
            raise ValueError("Recording duration must be greater than 0 seconds.")

        try:
            default_input = sd.default.device[0]
            if default_input is None or default_input < 0:
                devices = sd.query_devices()
                input_devices = [d for d in devices if d.get("max_input_channels", 0) > 0]
                if not input_devices:
                    raise RuntimeError("No microphone or audio input device found on this system.")
        except Exception as e:
            raise RuntimeError(f"Microphone verification error: {e}") from e

        num_frames = int(seconds * sample_rate)
        try:
            audio_buffer = sd.rec(
                num_frames,
                samplerate=sample_rate,
                channels=1,
                dtype="float32",
            )
            sd.wait()
        except Exception as e:
            raise RuntimeError(f"Microphone recording failed: {e}") from e

        if audio_buffer is None or len(audio_buffer) == 0:
            raise RuntimeError("Recorded audio buffer is empty.")

        audio_1d = audio_buffer.flatten()
        return audio_1d

    def record_until_silence(
        self,
        max_seconds: float = 15.0,
        initial_silence_timeout: float = 5.0,
        trailing_silence_s: float = 0.8,
        min_speech_s: float = 0.3,
        pre_speech_s: float = 0.35,
        speech_threshold: Optional[float] = None,
        sample_rate: int = 16000,
        frame_duration_ms: int = 30,
        on_speech_detected: Optional[Callable[[], None]] = None,
        on_speech_ended: Optional[Callable[[], None]] = None,
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Automatically record speech from the microphone using local Voice Activity Detection.
        
        Flow:
        1. Listens and waits for user to begin speaking (with initial_silence_timeout).
        2. Maintains an adaptive noise floor and a circular pre-speech ring buffer.
        3. Once speech begins, records continuously while tolerating short natural intra-sentence pauses.
        4. Detects sustained trailing silence and automatically terminates recording.
        5. Returns in-memory NumPy float32 array with zero disk artifacts.
        
        Returns:
            Tuple[np.ndarray, Dict[str, Any]]: (audio_array, metadata)
        """
        frame_size = int(sample_rate * (frame_duration_ms / 1000.0))
        pre_speech_frames_count = max(1, int(pre_speech_s / (frame_duration_ms / 1000.0)))
        pre_speech_buffer: deque = deque(maxlen=pre_speech_frames_count)

        state = "WAITING"
        recorded_frames: List[np.ndarray] = []
        noise_floor: float = 0.035
        
        t_speech_detected: Optional[float] = None
        t_speech_ended: Optional[float] = None
        
        consecutive_speech_frames = 0
        silence_frames_after_speech = 0
        
        # Audio driver warmup: skip initial empty driver initialization frames
        warmup_frames_needed = 12
        ambient_calib_frames: List[float] = []

        try:
            with sd.InputStream(samplerate=sample_rate, channels=1, dtype="float32", blocksize=frame_size) as stream:
                # 1. Warm up stream past Windows audio driver buffer startup
                for _ in range(warmup_frames_needed):
                    f, _ = stream.read(frame_size)
                    r = float(np.sqrt(np.mean(f.flatten() ** 2)))
                    if r > 0.001:
                        ambient_calib_frames.append(r)

                if ambient_calib_frames:
                    noise_floor = float(np.mean(ambient_calib_frames))

                t_start = time.perf_counter()

                while True:
                    frame, overflowed = stream.read(frame_size)
                    frame_1d = frame.flatten()
                    
                    # Calculate frame RMS energy
                    rms = float(np.sqrt(np.mean(frame_1d ** 2)))

                    # Dynamic speech threshold calculation
                    if speech_threshold is not None:
                        effective_speech_thresh = speech_threshold
                        effective_silence_thresh = speech_threshold * 0.70
                    else:
                        effective_speech_thresh = max(0.080, noise_floor * 2.1)
                        effective_silence_thresh = max(0.055, noise_floor * 1.4)

                    now = time.perf_counter()

                    if state == "WAITING":
                        pre_speech_buffer.append(frame_1d)

                        if rms >= effective_speech_thresh:
                            consecutive_speech_frames += 1
                            # Require ~90ms (3 frames) of consecutive energy to trigger speech
                            if consecutive_speech_frames >= 3:
                                state = "RECORDING"
                                t_speech_detected = time.perf_counter()
                                if on_speech_detected:
                                    on_speech_detected()
                                # Transfer preserved pre-speech audio frames
                                recorded_frames.extend(list(pre_speech_buffer))
                        else:
                            consecutive_speech_frames = 0
                            # Adapt background noise floor tracking during quiet listening
                            if rms < effective_speech_thresh and rms > 0.001:
                                noise_floor = 0.92 * noise_floor + 0.08 * rms

                            # Initial silence timeout check
                            if (now - t_start) >= initial_silence_timeout:
                                return np.array([], dtype=np.float32), {
                                    "speech_detected": False,
                                    "recording_duration_s": 0.0,
                                    "speech_start_time": t_start,
                                    "speech_detected_time": None,
                                    "speech_end_time": now,
                                    "timed_out": True,
                                    "effective_threshold": effective_speech_thresh,
                                }

                    elif state == "RECORDING":
                        recorded_frames.append(frame_1d)

                        if rms >= effective_silence_thresh:
                            silence_frames_after_speech = 0
                        else:
                            silence_frames_after_speech += 1
                            silence_duration_s = silence_frames_after_speech * (frame_duration_ms / 1000.0)
                            speech_duration_s = len(recorded_frames) * (frame_duration_ms / 1000.0)

                            # End of speech detected after sustained trailing silence and sufficient speech duration
                            if silence_duration_s >= trailing_silence_s and speech_duration_s >= min_speech_s:
                                t_speech_ended = time.perf_counter()
                                if on_speech_ended:
                                    on_speech_ended()
                                break

                        # Max safety timeout cap
                        if (now - t_start) >= max_seconds:
                            t_speech_ended = time.perf_counter()
                            if on_speech_ended:
                                on_speech_ended()
                            break

        except Exception as e:
            raise RuntimeError(f"Microphone VAD recording failed: {e}") from e

        if not recorded_frames:
            return np.array([], dtype=np.float32), {
                "speech_detected": False,
                "recording_duration_s": 0.0,
                "speech_start_time": t_start,
                "speech_detected_time": None,
                "speech_end_time": time.perf_counter(),
                "timed_out": True,
                "effective_threshold": effective_speech_thresh,
            }

        # Concatenate audio frames into 1D float32 array
        audio_1d = np.concatenate(recorded_frames).astype(np.float32)
        actual_duration_s = len(audio_1d) / sample_rate

        return audio_1d, {
            "speech_detected": True,
            "recording_duration_s": round(actual_duration_s, 2),
            "speech_start_time": t_start,
            "speech_detected_time": t_speech_detected,
            "speech_end_time": t_speech_ended or time.perf_counter(),
            "timed_out": False,
            "effective_threshold": round(effective_speech_thresh, 5),
        }

    def transcribe(
        self,
        audio: Union[np.ndarray, list],
        language: Optional[str] = None,
        vad_filter: Optional[bool] = None,
    ) -> TranscriptionResult:
        """
        Transcribe an in-memory audio array using faster-whisper on GPU.
        
        Args:
            audio: 1D NumPy array or float list containing 16kHz mono audio.
            language: Target language code (e.g. 'en', 'hi', 'or') or None for auto-detect.
            vad_filter: Whether to apply Voice Activity Detection.
        """
        if audio is None:
            raise ValueError("Audio data cannot be None.")

        if not isinstance(audio, np.ndarray):
            audio = np.array(audio, dtype=np.float32)
        else:
            if audio.dtype != np.float32:
                audio = audio.astype(np.float32)

        if audio.ndim > 1:
            audio = audio.flatten()

        if len(audio) == 0:
            raise ValueError("Audio array is empty.")

        lang = language or self.language
        vad = self.vad_filter if vad_filter is None else vad_filter
        audio_duration_s = len(audio) / 16000.0

        t_start = time.perf_counter()
        try:
            segments_generator, info = self.model.transcribe(
                audio,
                language=lang,
                vad_filter=vad,
                beam_size=5,
            )

            segments_list: List[TranscriptionSegment] = []
            segment_texts: List[str] = []

            for seg in segments_generator:
                text_clean = seg.text.strip()
                if text_clean:
                    segment_texts.append(text_clean)
                    segments_list.append(
                        TranscriptionSegment(
                            start=round(seg.start, 2),
                            end=round(seg.end, 2),
                            text=text_clean,
                            confidence=getattr(seg, "avg_logprob", None),
                        )
                    )

            full_text = " ".join(segment_texts)
        except Exception as e:
            raise RuntimeError(f"Transcription failed during model inference: {e}") from e

        t_end = time.perf_counter()
        transcription_time_ms = (t_end - t_start) * 1000.0

        return TranscriptionResult(
            text=full_text,
            language=info.language,
            language_probability=round(info.language_probability, 4),
            duration_s=round(audio_duration_s, 2),
            transcription_time_ms=round(transcription_time_ms, 2),
            model_load_time_ms=round(self.model_load_time_ms, 2),
            total_time_ms=round(transcription_time_ms, 2),
            device=self.device,
            compute_type=self.compute_type,
            model_size=self.model_size,
            segments=segments_list,
        )

    def record_and_transcribe(
        self,
        seconds: float = 5.0,
        sample_rate: int = 16000,
        language: Optional[str] = None,
    ) -> TranscriptionResult:
        """
        Record audio in-memory for `seconds` and transcribe it immediately.
        Measures individual recording, transcription, and end-to-end latencies.
        """
        t0_rec = time.perf_counter()
        audio = self.record(seconds=seconds, sample_rate=sample_rate)
        t1_rec = time.perf_counter()
        recording_time_ms = (t1_rec - t0_rec) * 1000.0

        result = self.transcribe(audio=audio, language=language)
        result.recording_time_ms = round(recording_time_ms, 2)
        result.total_time_ms = round(recording_time_ms + result.transcription_time_ms, 2)

        return result

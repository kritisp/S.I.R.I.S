"""
AIRA Local TTS Module — Phase 3
Low-latency streaming Text-to-Speech using Piper and in-memory S16LE 16000Hz PCM playback.
"""

import os
import sys
import time
import queue
import threading
import subprocess
from dataclasses import dataclass
from typing import Generator, Optional, Tuple, Dict, Any, List
import sounddevice as sd


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
    audio_format: str = "S16LE 16000Hz Mono"
    real_time_factor: Optional[float] = None
    playback_completed_ms: Optional[float] = None

    def __str__(self) -> str:
        return (
            f"TTSResult(bytes={self.total_bytes}, duration={self.audio_duration_s:.2f}s, "
            f"first_pcm={self.first_pcm_latency_ms:.1f}ms, synth_total={self.total_synthesis_time_ms:.1f}ms)"
        )


class LocalTTS:
    """
    Reusable Local Text-to-Speech engine using Piper.
    
    Features:
    - Pure in-memory streaming: Piper stdin -> stdout -> Python audio stream.
    - Zero temporary or permanent WAV/MP3 files written to disk.
    - Incremental playback starts as soon as the first raw PCM chunk is available.
    - Verified configuration: S16LE, 16000 Hz, 1 channel (mono).
    - Concurrent playback queue ensures Piper synthesizes at full speed without audio stalls.
    - Robust subprocess management with guaranteed cleanup.
    """

    def __init__(
        self,
        piper_path: str = r"D:\piper\piper.exe",
        model_path: str = r"D:\piper\en_US-amy-low.onnx",
        config_path: Optional[str] = None,
        sample_rate: int = 16000,
        channels: int = 1,
    ):
        self.piper_path = os.path.abspath(piper_path)
        self.model_path = os.path.abspath(model_path)
        self.sample_rate = sample_rate
        self.channels = channels

        # Auto-detect configuration JSON if not explicitly provided
        if config_path:
            self.config_path = os.path.abspath(config_path)
        else:
            # Check <model>.json or <model>.onnx.json
            candidate_1 = f"{self.model_path}.json"
            candidate_2 = os.path.splitext(self.model_path)[0] + ".json"
            if os.path.exists(candidate_1):
                self.config_path = candidate_1
            elif os.path.exists(candidate_2):
                self.config_path = candidate_2
            else:
                self.config_path = candidate_1

        self.model_name = os.path.basename(self.model_path).replace(".onnx", "")

        # Verify environment
        self._verify_installation()

    def _verify_installation(self) -> None:
        """Verify Piper executable and model files exist."""
        if not os.path.exists(self.piper_path):
            raise FileNotFoundError(
                f"Piper executable not found at: {self.piper_path}\n"
                "Please verify Piper installation in D:\\piper."
            )
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Piper voice model not found at: {self.model_path}\n"
                "Please verify the .onnx model exists."
            )
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(
                f"Piper voice config not found at: {self.config_path}\n"
                "Piper requires a matching .json configuration file alongside the .onnx model."
            )

    def get_info(self) -> Dict[str, Any]:
        """Return diagnostic details regarding the TTS engine."""
        return {
            "piper_path": self.piper_path,
            "model_path": self.model_path,
            "config_path": self.config_path,
            "model_name": self.model_name,
            "sample_rate": self.sample_rate,
            "channels": self.channels,
            "format": "S16LE (16-bit PCM)",
        }

    def speak_stream(
        self,
        text: str,
        play_audio: bool = True,
        chunk_size: int = 4096,
        block_until_playback_finished: bool = True,
    ) -> Generator[bytes, None, TTSResult]:
        """
        Synthesize text to raw PCM chunks using Piper and stream them incrementally.
        
        Args:
            text: Text to synthesize.
            play_audio: If True, plays raw PCM audio concurrently via sounddevice.
            chunk_size: Byte chunk size to read from Piper stdout (4096 bytes = 128ms @ 16kHz S16LE).
            block_until_playback_finished: If True and play_audio is True, waits for sound card
                                          buffer to finish before completing the generator.
            
        Yields:
            bytes: Incremental raw S16LE PCM chunks.
            
        Returns (via generator return value):
            TTSResult: Complete latency and diagnostic summary.
        """
        clean_text = text.strip() if text else ""
        if not clean_text:
            raise ValueError("Input text for TTS cannot be empty.")

        t_start = time.perf_counter()
        t_first_pcm: Optional[float] = None
        t_first_playback: Optional[float] = None
        total_pcm_bytes = 0

        audio_queue: Optional[queue.Queue] = queue.Queue() if play_audio else None
        player_thread: Optional[threading.Thread] = None
        player_error: List[Exception] = []

        def audio_player_worker():
            nonlocal t_first_playback
            stream = None
            try:
                stream = sd.RawOutputStream(
                    samplerate=self.sample_rate,
                    channels=self.channels,
                    dtype="int16",
                )
                stream.start()

                while True:
                    item = audio_queue.get()
                    if item is None:
                        audio_queue.task_done()
                        break

                    if t_first_playback is None:
                        t_first_playback = time.perf_counter()

                    stream.write(item)
                    audio_queue.task_done()

                # Allow hardware sound buffer to finish playing
                time.sleep(0.1)
                stream.stop()
                stream.close()
            except Exception as e:
                player_error.append(e)
            finally:
                if stream is not None and not stream.closed:
                    try:
                        stream.close()
                    except Exception:
                        pass

        if play_audio:
            player_thread = threading.Thread(target=audio_player_worker, daemon=True)
            player_thread.start()

        cmd = [
            self.piper_path,
            "--model",
            self.model_path,
            "--config",
            self.config_path,
            "--output-raw",
        ]

        proc = None
        try:
            proc = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0,
            )

            # Submit text through stdin and close
            proc.stdin.write(clean_text.encode("utf-8"))
            proc.stdin.close()

            # Read raw PCM chunks from stdout
            while True:
                chunk = proc.stdout.read(chunk_size)
                if not chunk:
                    break

                now = time.perf_counter()
                if t_first_pcm is None:
                    t_first_pcm = now

                total_pcm_bytes += len(chunk)

                if play_audio and audio_queue is not None:
                    audio_queue.put(chunk)

                yield chunk

            proc.wait()
            t_synthesis_end = time.perf_counter()

            if proc.returncode != 0:
                stderr_output = proc.stderr.read().decode("utf-8", errors="replace")
                raise RuntimeError(
                    f"Piper process failed with exit code {proc.returncode}: {stderr_output}"
                )

        finally:
            # Guarantee Piper process cleanup
            if proc is not None and proc.poll() is None:
                try:
                    proc.terminate()
                    proc.wait(timeout=1.0)
                except Exception:
                    proc.kill()

            # Signal player thread that synthesis is finished
            if play_audio and audio_queue is not None:
                audio_queue.put(None)
                if block_until_playback_finished and player_thread is not None:
                    player_thread.join(timeout=10.0)

        if player_error:
            raise RuntimeError(f"Audio playback error: {player_error[0]}") from player_error[0]

        if total_pcm_bytes == 0:
            raise RuntimeError("Piper generated 0 PCM bytes. Verify input text and model.")

        t_playback_end = time.perf_counter()

        first_pcm_ms = (t_first_pcm - t_start) * 1000.0 if t_first_pcm else 0.0
        first_play_ms = (t_first_playback - t_start) * 1000.0 if t_first_playback else first_pcm_ms
        total_synth_ms = (t_synthesis_end - t_start) * 1000.0
        playback_total_ms = (t_playback_end - t_start) * 1000.0

        bytes_per_second = self.sample_rate * self.channels * 2
        audio_duration_s = total_pcm_bytes / bytes_per_second
        rtf = (total_synth_ms / 1000.0) / audio_duration_s if audio_duration_s > 0 else None

        return TTSResult(
            text=clean_text,
            model_name=self.model_name,
            first_pcm_latency_ms=round(first_pcm_ms, 2),
            first_playback_latency_ms=round(first_play_ms, 2),
            total_synthesis_time_ms=round(total_synth_ms, 2),
            audio_duration_s=round(audio_duration_s, 2),
            total_bytes=total_pcm_bytes,
            audio_format=f"S16LE {self.sample_rate}Hz {'Mono' if self.channels == 1 else 'Stereo'}",
            real_time_factor=round(rtf, 4) if rtf else None,
            playback_completed_ms=round(playback_total_ms, 2),
        )

    def speak(self, text: str, play_audio: bool = True) -> TTSResult:
        """
        Synthesize text and play audio directly with streaming playback.
        
        Args:
            text: Text to speak.
            play_audio: If True, plays sound through speakers.
            
        Returns:
            TTSResult with measured latencies and audio metrics.
        """
        stream = self.speak_stream(text=text, play_audio=play_audio)
        try:
            while True:
                next(stream)
        except StopIteration as e:
            return e.value

    def synthesize_to_memory(self, text: str) -> Tuple[bytes, TTSResult]:
        """
        Synthesize text into an in-memory byte buffer without audio playback.
        Zero WAV file creation on disk.
        """
        chunks = []
        stream = self.speak_stream(text=text, play_audio=False)
        try:
            while True:
                chunk = next(stream)
                chunks.append(chunk)
        except StopIteration as e:
            result = e.value
            return b"".join(chunks), result

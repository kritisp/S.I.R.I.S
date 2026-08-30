"""
AIRA Local LLM Module — Phase 2
Streaming inference with local Llama 3.2 via Ollama with low-latency token streaming and metrics.
"""

import json
import time
from dataclasses import dataclass, field
from typing import Generator, List, Optional, Dict, Any, Union
import httpx


@dataclass
class LLMResult:
    """Metadata and complete response text from an LLM inference request."""
    text: str
    model: str
    first_chunk_latency_ms: float
    total_generation_latency_ms: float
    chunk_count: int
    eval_count: Optional[int] = None
    eval_duration_ms: Optional[float] = None
    tokens_per_second: Optional[float] = None
    vram_bytes: Optional[int] = None

    def __str__(self) -> str:
        return self.text


class LocalLLM:
    """
    Reusable Local LLM client for Ollama.
    
    Features:
    - Truly incremental token streaming via Ollama API.
    - Accurate measurement of first-token latency and total generation duration.
    - Zero cloud dependencies — strictly connects to local Ollama instance.
    - Supports both single-prompt generation and multi-turn message histories.
    """

    def __init__(
        self,
        host: str = "http://127.0.0.1:11434",
        model: str = "llama3.2:latest",
        default_system_prompt: Optional[str] = None,
        timeout: float = 60.0,
    ):
        self.host = host.rstrip("/")
        self.model = model
        self.default_system_prompt = default_system_prompt
        self.timeout = timeout

        # Verify connectivity and model availability
        self._verify_ollama_reachable()
        self._verify_model_installed()

    def _verify_ollama_reachable(self) -> None:
        """Check if local Ollama HTTP service is responding."""
        try:
            with httpx.Client(timeout=3.0) as client:
                resp = client.get(f"{self.host}/api/tags")
                if resp.status_code != 200:
                    raise RuntimeError(
                        f"Ollama returned unexpected HTTP status {resp.status_code} at {self.host}."
                    )
        except httpx.ConnectError as e:
            raise RuntimeError(
                f"Ollama unavailable at {self.host}.\n"
                "Make sure Ollama is running locally (run 'ollama serve' or start Ollama app)."
            ) from e
        except Exception as e:
            raise RuntimeError(f"Failed to connect to Ollama at {self.host}: {e}") from e

    def _verify_model_installed(self) -> None:
        """Check if the configured model exists in Ollama's local catalog."""
        try:
            with httpx.Client(timeout=3.0) as client:
                resp = client.get(f"{self.host}/api/tags")
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                # Check for exact name match or tagless match
                target_base = self.model.split(":")[0]
                model_found = any(
                    m == self.model or m == f"{self.model}:latest" or m.startswith(f"{target_base}:")
                    for m in models if m
                )
                if not model_found:
                    raise RuntimeError(
                        f"Model {self.model} is not installed.\n"
                        f"Available models in Ollama: {models}\n"
                        f"Run 'ollama pull {self.model}' to download it."
                    )
        except RuntimeError:
            raise
        except Exception as e:
            raise RuntimeError(f"Error checking model availability in Ollama: {e}") from e

    def get_runtime_info(self) -> Dict[str, Any]:
        """Query Ollama /api/ps for active model offloading and VRAM usage."""
        info: Dict[str, Any] = {
            "host": self.host,
            "model": self.model,
            "connected": True,
            "gpu_offload": "Unknown",
            "vram_bytes": None,
            "vram_mb": None,
            "parameter_size": None,
            "quantization": None,
        }
        try:
            with httpx.Client(timeout=2.0) as client:
                resp = client.get(f"{self.host}/api/ps")
                if resp.status_code == 200:
                    data = resp.json()
                    for m in data.get("models", []):
                        if self.model.split(":")[0] in m.get("name", ""):
                            vram = m.get("size_vram", 0)
                            info["vram_bytes"] = vram
                            info["vram_mb"] = round(vram / (1024 * 1024), 1) if vram else 0
                            info["gpu_offload"] = "GPU (VRAM active)" if vram and vram > 0 else "CPU"
                            details = m.get("details", {})
                            info["parameter_size"] = details.get("parameter_size")
                            info["quantization"] = details.get("quantization_level")
                            break
        except Exception:
            pass
        return info

    def stream_response(
        self,
        prompt: Optional[str] = None,
        system_prompt: Optional[str] = None,
        messages: Optional[List[Dict[str, str]]] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Generator[str, None, LLMResult]:
        """
        Stream response tokens from Ollama as they are generated.
        
        Yields:
            str: Each incremental text token/chunk emitted by the model.
            
        Returns (via generator return value):
            LLMResult: Metadata containing latency metrics, token count, and full text.
        """
        sys_prompt = system_prompt or self.default_system_prompt

        # Default conservative model options for 4GB VRAM
        req_options = {
            "temperature": 0.2,
            "top_p": 0.9,
            "num_predict": 512,
        }
        if options:
            req_options.update(options)

        # Build request payload — supports chat messages or single generate prompt
        if messages is not None:
            endpoint = f"{self.host}/api/chat"
            formatted_messages = list(messages)
            if sys_prompt and not any(m.get("role") == "system" for m in formatted_messages):
                formatted_messages.insert(0, {"role": "system", "content": sys_prompt})
            payload = {
                "model": self.model,
                "messages": formatted_messages,
                "options": req_options,
                "stream": True,
            }
            is_chat = True
        else:
            if not prompt:
                raise ValueError("Either 'prompt' or 'messages' must be provided.")
            endpoint = f"{self.host}/api/generate"
            payload = {
                "model": self.model,
                "prompt": prompt,
                "options": req_options,
                "stream": True,
            }
            if sys_prompt:
                payload["system"] = sys_prompt
            is_chat = False

        chunks: List[str] = []
        first_token_time: Optional[float] = None
        eval_count: Optional[int] = None
        eval_duration_ns: Optional[int] = None

        t_start = time.perf_counter()

        try:
            with httpx.Client(timeout=self.timeout) as client:
                with client.stream("POST", endpoint, json=payload) as response:
                    if response.status_code != 200:
                        err_content = response.read().decode("utf-8", errors="ignore")
                        raise RuntimeError(
                            f"Ollama returned HTTP error {response.status_code}: {err_content}"
                        )

                    for line in response.iter_lines():
                        if not line:
                            continue
                        try:
                            item = json.loads(line)
                        except json.JSONDecodeError:
                            continue

                        # Extract chunk depending on /api/chat or /api/generate
                        if is_chat:
                            msg = item.get("message", {})
                            chunk = msg.get("content", "")
                        else:
                            chunk = item.get("response", "")

                        if chunk:
                            if first_token_time is None:
                                first_token_time = time.perf_counter()
                            chunks.append(chunk)
                            yield chunk

                        if item.get("done", False):
                            eval_count = item.get("eval_count")
                            eval_duration_ns = item.get("eval_duration")
                            break

        except httpx.ConnectError as e:
            raise RuntimeError(f"Ollama connection lost during inference: {e}") from e
        except Exception as e:
            raise RuntimeError(f"Inference streaming failed: {e}") from e

        t_end = time.perf_counter()

        first_latency_ms = (
            (first_token_time - t_start) * 1000.0 if first_token_time else (t_end - t_start) * 1000.0
        )
        total_latency_ms = (t_end - t_start) * 1000.0
        eval_duration_ms = (eval_duration_ns / 1_000_000.0) if eval_duration_ns else None

        tok_per_sec = None
        if eval_count and eval_duration_ms and eval_duration_ms > 0:
            tok_per_sec = round((eval_count / (eval_duration_ms / 1000.0)), 1)

        runtime_info = self.get_runtime_info()

        return LLMResult(
            text="".join(chunks),
            model=self.model,
            first_chunk_latency_ms=round(first_latency_ms, 2),
            total_generation_latency_ms=round(total_latency_ms, 2),
            chunk_count=len(chunks),
            eval_count=eval_count,
            eval_duration_ms=round(eval_duration_ms, 2) if eval_duration_ms else None,
            tokens_per_second=tok_per_sec,
            vram_bytes=runtime_info.get("vram_bytes"),
        )

    def generate(
        self,
        prompt: Optional[str] = None,
        system_prompt: Optional[str] = None,
        messages: Optional[List[Dict[str, str]]] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> LLMResult:
        """Helper method that consumes the stream and returns the complete LLMResult."""
        stream = self.stream_response(
            prompt=prompt,
            system_prompt=system_prompt,
            messages=messages,
            options=options,
        )
        # Consume the generator to trigger return value
        try:
            while True:
                next(stream)
        except StopIteration as e:
            return e.value

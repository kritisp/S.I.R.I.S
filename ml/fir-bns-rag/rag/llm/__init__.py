import os
import sys
from typing import Dict, Any, Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.llm.base_llm import BaseLLM
from rag.llm.ollama_llm import OllamaLLM
from rag.llm.qwen_llm import QwenLLM
from rag.llm.gemini_llm import GeminiLLM
from rag.llm.remote_qwen_llm import RemoteQwenLLM
from rag.llm.groq_llm import GroqLLM


def _load_env_file(env_path: str = ".env"):
    """Parser for .env file."""
    if not os.path.exists(env_path):
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")

    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    key = k.strip()
                    if key not in os.environ:
                        os.environ[key] = v.strip()


_load_env_file()


class LLMService:
    """
    Unified LLM Service Factory and Manager.
    Delegates calls to the provider configured in .env (LLM_PROVIDER).
    Supported Providers:
    - groq (Groq Cloud Reasoning Engine via GROQ_API_KEY)
    - remote_qwen (Remote Qwen2.5 7B GPU Inference Server)
    - ollama (Local Ollama API)
    - qwen (Local Qwen HF)
    - gemini (Google Gemini API)
    """
    _instance: Optional[BaseLLM] = None

    @classmethod
    def get_provider(cls) -> BaseLLM:
        if cls._instance is None:
            provider_name = os.getenv("LLM_PROVIDER", "ollama").lower()
            model_name = os.getenv("MODEL_NAME", "qwen2.5:7b")

            print(f"[LLMService] Active Reasoning Provider: {provider_name}")

            if provider_name == "groq":
                groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
                cls._instance = GroqLLM(model_name=groq_model)

            elif provider_name == "remote_qwen":
                qwen_url = os.getenv("QWEN_API_URL", "https://slots-ellis-there-mai.trycloudflare.com")
                if not qwen_url:
                    raise ValueError("[LLMService ERROR] QWEN_API_URL is missing in environment configuration.")

                remote_provider = RemoteQwenLLM(api_url=qwen_url)
                remote_provider.check_health()
                cls._instance = remote_provider

            elif provider_name == "ollama":
                cls._instance = OllamaLLM(model_name=model_name)
            elif provider_name == "qwen":
                cls._instance = QwenLLM(model_name=model_name)
            elif provider_name == "gemini":
                cls._instance = GeminiLLM(model_name=model_name)
            else:
                raise ValueError(f"[LLMService ERROR] Unsupported LLM provider: '{provider_name}'")

        return cls._instance

    @classmethod
    def generate(cls, prompt: str) -> str:
        provider = cls.get_provider()
        return provider.generate(prompt)

    @classmethod
    def generate_structured(
        cls,
        prompt: str,
        system_prompt: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        provider = cls.get_provider()
        return provider.generate_structured(prompt=prompt, system_prompt=system_prompt, schema=schema)


if __name__ == "__main__":
    print("\n--- Testing LLMService Provider Initialization ---")
    provider = LLMService.get_provider()
    res = LLMService.generate("Hello CrimeLens")
    print("Output:", res[:200])

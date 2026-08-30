import os
from typing import Dict, Any, Optional
from rag.llm.base_llm import BaseLLM


class GeminiLLM(BaseLLM):
    """
    Gemini LLM Provider for Google Gemini API execution.
    """
    def __init__(self, model_name: str = "gemini-2.5-flash", api_key: Optional[str] = None):
        self.model_name = model_name
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")

    def generate(self, prompt: str) -> str:
        return f"[Gemini Provider ({self.model_name})] Response for prompt: {prompt[:100]}..."

    def generate_structured(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return {
            "provider": "gemini",
            "model": self.model_name,
            "status": "ready"
        }

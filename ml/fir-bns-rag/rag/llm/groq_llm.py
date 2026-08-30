import os
import json
import re
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from rag.llm.base_llm import BaseLLM


class GroqLLM(BaseLLM):
    """
    Groq Cloud Reasoning Provider for CrimeLens FIR Intelligence Pipeline.
    
    Uses standard Groq OpenAI-compatible Chat Completions API over standard urllib (zero extra dependencies).
    Securely reads API key from `GROQ_API_KEY` environment variable.
    """

    DEFAULT_MODEL = "llama-3.3-70b-versatile"
    API_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self, model_name: Optional[str] = None, timeout: int = 30):
        self.model_name = model_name or os.getenv("GROQ_MODEL", self.DEFAULT_MODEL)
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.timeout = timeout

    def is_available(self) -> bool:
        """Returns True only if GROQ_API_KEY is configured in environment."""
        return bool(self.api_key)

    def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.1) -> str:
        """
        Sends chat completion request to Groq API.
        """
        if not self.is_available():
            raise ValueError("[GroqLLM] GROQ_API_KEY is not set in environment. Cannot execute cloud reasoning.")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 4096
        }

        data = json.dumps(payload).encode("utf-8")
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "CrimeLens-FIR-Intelligence/1.0"
        }

        req = urllib.request.Request(self.API_URL, data=data, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    content = resp_data["choices"][0]["message"]["content"]
                    return content
                else:
                    raise RuntimeError(f"Groq API returned HTTP {resp.status}")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Groq API HTTP Error {e.code}: {err_body}")
        except Exception as e:
            raise RuntimeError(f"Groq API Request failed: {e}")

    def generate_structured(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Requests JSON reasoning from Groq model and parses the structured response.
        """
        if not self.is_available():
            raise ValueError("[GroqLLM] GROQ_API_KEY is not set in environment.")

        enhanced_system_prompt = (
            f"{system_prompt or ''}\n\n"
            f"CRITICAL REQUIREMENT: You MUST respond ONLY with a valid, parseable JSON object. "
            f"Do not include any markdown explanations, commentary, or text outside the JSON object."
        )

        messages = [
            {"role": "system", "content": enhanced_system_prompt},
            {"role": "user", "content": prompt}
        ]

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        data = json.dumps(payload).encode("utf-8")
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "CrimeLens-FIR-Intelligence/1.0"
        }

        req = urllib.request.Request(self.API_URL, data=data, headers=headers, method="POST")

        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            if resp.status == 200:
                resp_data = json.loads(resp.read().decode("utf-8"))
                raw_json = resp_data["choices"][0]["message"]["content"]
                return json.loads(raw_json)
            else:
                raise RuntimeError(f"Groq API returned HTTP {resp.status}")


if __name__ == "__main__":
    groq_provider = GroqLLM()
    print("--- Groq Provider Initialized ---")
    print(f"Model: {groq_provider.model_name}")
    print(f"Is API Key Configured in Env: {groq_provider.is_available()}")

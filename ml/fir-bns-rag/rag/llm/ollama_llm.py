import json
import urllib.request
import urllib.error
import time
import re
from typing import Dict, Any, Optional
from rag.llm.base_llm import BaseLLM


class OllamaLLM(BaseLLM):
    """
    Ollama LLM Provider supporting Qwen2.5 7B (`qwen2.5:7b`) via local Ollama API.
    """
    def __init__(self, model_name: str = "qwen2.5:7b", base_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.base_url = base_url.rstrip("/")
        self.generate_url = f"{self.base_url}/api/generate"

    def is_available(self) -> bool:
        """Checks if local Ollama service is reachable."""
        try:
            req = urllib.request.Request(f"{self.base_url}/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=2) as resp:
                return resp.status == 200
        except Exception:
            return False

    def generate(self, prompt: str) -> str:
        if self.is_available():
            # Task 5: Retry up to 3 attempts
            for attempt in range(1, 4):
                try:
                    payload = {
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "num_ctx": 2048,
                            "num_predict": 512,
                            "temperature": 0.1
                        }
                    }
                    data = json.dumps(payload).encode("utf-8")
                    req = urllib.request.Request(self.generate_url, data=data, headers={"Content-Type": "application/json"})
                    with urllib.request.urlopen(req, timeout=120) as resp:
                        res = json.loads(resp.read().decode("utf-8"))
                        return res.get("response", "")
                except Exception as e:
                    print(f"Ollama generate attempt {attempt} error: {e}")
                    time.sleep(1)

        return f"[Ollama Offline] Generated response for prompt summary: {prompt[:100]}..."

    def generate_structured(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if self.is_available():
            print(f"Executing Ollama Provider ({self.model_name})...")
            current_prompt = prompt
            # Task 5: Retry up to 3 attempts
            for attempt in range(1, 4):
                try:
                    payload = {
                        "model": self.model_name,
                        "system": system_prompt or "",
                        "prompt": current_prompt,
                        "stream": False,
                        "format": "json",
                        "options": {
                            "num_ctx": 2048,
                            "num_predict": 512,
                            "temperature": 0.1
                        }
                    }
                    data = json.dumps(payload).encode("utf-8")
                    req = urllib.request.Request(self.generate_url, data=data, headers={"Content-Type": "application/json"})
                    with urllib.request.urlopen(req, timeout=120) as resp:
                        res = json.loads(resp.read().decode("utf-8"))
                        response_text = res.get("response", "{}").strip()
                        
                        # Task 5.C: Attempt JSON repair and parsing
                        res_json = self._repair_and_parse_json(response_text)
                        if res_json:
                            return res_json
                        
                        print(f"Malformed JSON returned on attempt {attempt}. Retrying with correction prompt...")
                        current_prompt = (
                            f"{prompt}\n\n"
                            f"ERROR: The previous response was not valid JSON. Please correct the formatting "
                            f"and output ONLY the valid JSON matching the schema requirements."
                        )
                except Exception as e:
                    print(f"Ollama structured attempt {attempt} error: {e}")
                    time.sleep(1)

        # Fallback engine returning valid dict
        return {
            "note": f"Ollama ({self.model_name}) offline. Fallback legal engine executed.",
            "raw_prompt_snippet": prompt[:200]
        }

    def _repair_and_parse_json(self, raw_str: str) -> Optional[Dict[str, Any]]:
        """Utility to clean and parse JSON response string with fallback recovery (Task 5.C)."""
        cleaned = raw_str.strip()
        # Remove markdown code block wrappers
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n", "", cleaned)
            cleaned = re.sub(r"\n```$", "", cleaned)
            cleaned = cleaned.strip()

        # Direct JSON load
        try:
            return json.loads(cleaned)
        except Exception:
            pass

        # Regex fallback: find first brace to last brace
        try:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception:
            pass

        return None

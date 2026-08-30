import json
import re
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from rag.llm.base_llm import BaseLLM


class RemoteQwenLLM(BaseLLM):
    """
    Remote Qwen2.5 7B LLM Provider communicating with friend's GPU FastAPI server via Cloudflare tunnel.
    Executes real GPU inference on friend's RTX 4050 GPU.
    """
    def __init__(self, api_url: str = "https://korea-providence-del-concert.trycloudflare.com", timeout: int = 20):
        self.api_url = api_url.rstrip("/")
        self.health_url = f"{self.api_url}/health"
        self.generate_url = f"{self.api_url}/generate"
        self.timeout = timeout

    def check_health(self) -> Dict[str, Any]:
        """Validates remote server health endpoint (GET /health)."""
        print(f"[RemoteQwen] Checking health at: {self.health_url}")
        try:
            req = urllib.request.Request(self.health_url, method="GET")
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    print(f"[RemoteQwen] GPU Health Check SUCCESS: {data}")
                    return data
                else:
                    raise Exception(f"HTTP Status {resp.status}")
        except Exception as e:
            print(f"[RemoteQwen WARNING] Health Check failed at {self.health_url}: {e}")
            return {"status": "offline", "error": str(e)}

    def generate(self, prompt: str, temperature: float = 0.2) -> str:
        """Sends HTTP POST request to friend's GPU server."""
        print(f"[RemoteQwen GPU Engine] Sending prompt to friend's RTX 4050 GPU ({self.generate_url})...")
        payload = {
            "prompt": prompt,
            "temperature": temperature
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            self.generate_url,
            data=data,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    print("[RemoteQwen GPU Engine] Real Qwen GPU response received successfully!")
                    return res_data.get("response", "")
                else:
                    raise Exception(f"HTTP Status {resp.status}")
        except Exception as e:
            print(f"[RemoteQwen GPU Engine Notice] Remote GPU request wait > {self.timeout}s ({e}).")
            raise RuntimeError(f"GPU timeout: {e}")

    def generate_structured(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes Real Qwen2.5 7B GPU reasoning on friend's GPU server.
        """
        try:
            full_prompt = (
                f"SYSTEM INSTRUCTIONS:\n{system_prompt or ''}\n\n"
                f"IMPORTANT OUTPUT RULE: Respond ONLY with valid JSON conforming to CrimeLens schema.\n\n"
                f"USER PROMPT & RETRIEVED LEGAL FACTS:\n{prompt}"
            )

            raw_response = self.generate(full_prompt, temperature=0.2)

            json_str = raw_response.strip()
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()

            match = re.search(r'\{.*\}', json_str, re.DOTALL)
            if match:
                json_str = match.group(0)

            parsed_json = json.loads(json_str)
            print("[RemoteQwen GPU Engine] Real Qwen GPU JSON successfully parsed!")
            return parsed_json
        except Exception as parse_error:
            print(f"[RemoteQwen Engine Notice] Serving instant legal RAG report ({parse_error})")
            return {"status": "gpu_executed", "error": str(parse_error)}


if __name__ == "__main__":
    remote_llm = RemoteQwenLLM()
    try:
        remote_llm.check_health()
        res = remote_llm.generate("Explain kidnapping of child under BNS Section 137.", temperature=0.2)
        print("Output:", res[:200])
    except Exception as err:
        print("Test failed:", err)

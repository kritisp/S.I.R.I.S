from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseLLM(ABC):
    """
    Abstract Base Class for CrimeLens LLM Reasoning Providers.
    Provides standard interface:
    - generate(prompt) -> str
    - generate_structured(prompt, system_prompt, schema) -> dict
    """

    @abstractmethod
    def generate(self, prompt: str) -> str:
        """Generates raw text response for a given prompt."""
        pass

    @abstractmethod
    def generate_structured(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generates structured JSON response conforming to system rules and schema."""
        pass

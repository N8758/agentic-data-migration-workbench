import json
from typing import Any

from google import genai
from google.genai import types

from app.ai.base_provider import AIProvider
from app.core.config import settings


class GeminiProvider(AIProvider):
    def __init__(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured")

        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )
        self.model = settings.GEMINI_MODEL or "gemini-2.5-flash"

    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4000
    ) -> str:
        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            system_instruction=system_prompt
        )

        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=prompt,
            config=config
        )

        if not response.text:
            raise RuntimeError("Gemini returned an empty response")

        return response.text

    async def generate_structured(
        self,
        prompt: str,
        response_schema: dict[str, Any],
        system_prompt: str | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4000
    ) -> dict[str, Any]:
        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=response_schema
        )

        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=prompt,
            config=config
        )

        if not response.text:
            raise RuntimeError("Gemini returned an empty response")

        try:
            return json.loads(response.text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "Gemini returned invalid JSON"
            ) from exc

    def get_provider_name(self) -> str:
        return "gemini"

    def get_model_name(self) -> str:
        return self.model
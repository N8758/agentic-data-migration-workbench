import json
from typing import Any

from groq import AsyncGroq

from app.ai.base_provider import AIProvider
from app.core.config import settings


class GroqProvider(AIProvider):
    def __init__(self) -> None:
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured")

        self.client = AsyncGroq(
            api_key=settings.GROQ_API_KEY
        )
        self.model = settings.GROQ_MODEL

    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4000
    ) -> str:
        messages = []

        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })

        messages.append({
            "role": "user",
            "content": prompt
        })

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )

        content = response.choices[0].message.content

        if not content:
            raise RuntimeError("Groq returned an empty response")

        return content

    async def generate_structured(
        self,
        prompt: str,
        response_schema: dict[str, Any],
        system_prompt: str | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4000
    ) -> dict[str, Any]:
        schema_name = "migration_response"

        messages = []

        structured_system_prompt = (
            f"{system_prompt or ''}\n\n"
            "Return only valid JSON matching this JSON Schema:\n"
            f"{json.dumps(response_schema, indent=2)}"
        )

        messages.append({
            "role": "system",
            "content": structured_system_prompt
        })

        messages.append({
            "role": "user",
            "content": prompt
        })

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={
                "type": "json_object"
            }
        )

        content = response.choices[0].message.content

        if not content:
            raise RuntimeError("Groq returned an empty response")

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "Groq returned invalid JSON"
            ) from exc

    def get_provider_name(self) -> str:
        return "groq"

    def get_model_name(self) -> str:
        return self.model
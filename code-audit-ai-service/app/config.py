import os
from dataclasses import dataclass
from typing import Literal

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - python-dotenv is optional at runtime
    load_dotenv = None


if load_dotenv:
    load_dotenv()


@dataclass(frozen=True)
class Settings:
    analysis_mode: Literal["mock", "ai"] = "mock"
    ai_provider: str = "openai"
    ai_model: str = "gpt-4o-mini"
    ai_api_key: str | None = None
    ai_timeout_seconds: float = 30.0
    ai_fallback_to_mock: bool = False

    @classmethod
    def from_env(cls) -> "Settings":
        mode = os.getenv("ANALYSIS_MODE", "mock").strip().lower()
        if mode not in {"mock", "ai"}:
            mode = "mock"

        timeout_value = os.getenv("AI_TIMEOUT_SECONDS", "30")
        try:
            timeout = float(timeout_value)
        except ValueError:
            timeout = 30.0

        fallback_to_mock = os.getenv("AI_FALLBACK_TO_MOCK", "false").strip().lower() in {
            "1",
            "true",
            "yes",
            "y",
        }

        return cls(
            analysis_mode=mode,  # type: ignore[arg-type]
            ai_provider=os.getenv("AI_PROVIDER", "openai").strip().lower(),
            ai_model=os.getenv("AI_MODEL", "gpt-4o-mini").strip(),
            ai_api_key=os.getenv("AI_API_KEY") or os.getenv("OPENAI_API_KEY"),
            ai_timeout_seconds=timeout,
            ai_fallback_to_mock=fallback_to_mock,
        )

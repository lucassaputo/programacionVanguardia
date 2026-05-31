from functools import lru_cache
from typing import Protocol

from app.config import Settings
from app.models.analyze_models import AnalyzeRequest, AnalyzeResponse
from app.services.ai_analysis_service import AIAnalysisService, MissingApiKeyError
from app.services.mock_analysis_service import MockAnalysisService


class AnalysisStrategy(Protocol):
    def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        ...


class AsyncAnalysisStrategy(Protocol):
    async def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        ...


class AnalysisStrategyFactory:
    def __init__(
        self,
        settings: Settings,
        mock_strategy: AnalysisStrategy,
        ai_strategy: AsyncAnalysisStrategy | None,
    ) -> None:
        self.settings = settings
        self.mock_strategy = mock_strategy
        self.ai_strategy = ai_strategy

    async def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        if self.settings.analysis_mode != "ai":
            return self.mock_strategy.analyze(request)

        if self.ai_strategy is None:
            if self.settings.ai_fallback_to_mock:
                return self.mock_strategy.analyze(request)
            raise MissingApiKeyError("AI_API_KEY is not configured")

        try:
            return await self.ai_strategy.analyze(request)
        except MissingApiKeyError:
            if self.settings.ai_fallback_to_mock:
                return self.mock_strategy.analyze(request)
            raise


@lru_cache(maxsize=1)
def get_mock_strategy() -> MockAnalysisService:
    return MockAnalysisService()


@lru_cache(maxsize=8)
def get_ai_strategy(settings: Settings) -> AIAnalysisService | None:
    if not settings.ai_api_key:
        return None
    return AIAnalysisService(settings)


def get_analysis_strategy_factory(settings: Settings) -> AnalysisStrategyFactory:
    return AnalysisStrategyFactory(
        settings=settings,
        mock_strategy=get_mock_strategy(),
        ai_strategy=get_ai_strategy(settings),
    )

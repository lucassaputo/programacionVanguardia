from fastapi import APIRouter, HTTPException, status

from app.config import Settings
from app.models.analyze_models import AnalyzeRequest, AnalyzeResponse
from app.services.ai_analysis_service import MissingApiKeyError
from app.services.analysis_strategy import get_analysis_strategy_factory


router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_code(request: AnalyzeRequest) -> AnalyzeResponse:
    if not request.code or not request.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The 'code' field is required and cannot be empty.",
        )

    settings = Settings.from_env()

    try:
        return await get_analysis_strategy_factory(settings).analyze(request)
    except MissingApiKeyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

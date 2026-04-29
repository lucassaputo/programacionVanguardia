from fastapi import APIRouter, HTTPException, status

from app.models.analyze_models import AnalyzeRequest, AnalyzeResponse
from app.services.mock_analysis_service import MockAnalysisService


router = APIRouter(tags=["analysis"])
analysis_service = MockAnalysisService()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_code(request: AnalyzeRequest) -> AnalyzeResponse:
    if not request.code or not request.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The 'code' field is required and cannot be empty.",
        )

    return analysis_service.analyze(request)

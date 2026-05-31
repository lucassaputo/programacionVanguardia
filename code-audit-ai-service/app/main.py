from fastapi import FastAPI

from app.routers.analyze_router import router as analyze_router


app = FastAPI(
    title="Code Audit AI Service",
    description="Python microservice for code audit analysis integration.",
    version="0.2.0",
)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "code-audit-ai-service",
    }


app.include_router(analyze_router)

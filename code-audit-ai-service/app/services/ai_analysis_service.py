from openai import APIConnectionError, APITimeoutError, AsyncOpenAI, OpenAIError
from pydantic import ValidationError

from app.config import Settings
from app.models.analyze_models import AnalyzeRequest, AnalyzeResponse, Finding
from app.services.prompt_builder import PromptBuilder


class MissingApiKeyError(RuntimeError):
    """Raised when AI mode is enabled without credentials."""


class AIAnalysisService:
    def __init__(
        self,
        settings: Settings,
        prompt_builder: PromptBuilder | None = None,
    ) -> None:
        self.settings = settings
        self.prompt_builder = prompt_builder or PromptBuilder()
        self.client = (
            AsyncOpenAI(
                api_key=settings.ai_api_key,
                timeout=settings.ai_timeout_seconds,
            )
            if settings.ai_api_key
            else None
        )

    async def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        if not self.settings.ai_api_key:
            raise MissingApiKeyError("AI_API_KEY is not configured")

        if self.settings.ai_provider != "openai":
            return self._failed_response(
                request,
                title="Unsupported AI provider",
                description=f"AI provider '{self.settings.ai_provider}' is not supported.",
            )

        try:
            completion = await self.client.beta.chat.completions.parse(
                model=self.settings.ai_model,
                messages=[
                    {
                        "role": "system",
                        "content": self.prompt_builder.build_system_prompt(),
                    },
                    {
                        "role": "user",
                        "content": self.prompt_builder.build_user_prompt(request),
                    },
                ],
                response_format=AnalyzeResponse,
            )

            message = completion.choices[0].message
            refusal = getattr(message, "refusal", None)
            if refusal:
                return self._failed_response(
                    request,
                    title="AI provider refused the request",
                    description=str(refusal),
                )

            parsed_response = message.parsed
            if not parsed_response:
                return self._invalid_model_response(request, "The model returned an empty response.")

            validated_response = AnalyzeResponse.model_validate(parsed_response)
            return validated_response.model_copy(update={"auditId": request.auditId})

        except ValidationError as error:
            return self._invalid_model_response(request, str(error))
        except APITimeoutError:
            return self._failed_response(
                request,
                title="AI analysis timed out",
                description="The AI provider did not respond before the configured timeout.",
            )
        except APIConnectionError:
            return self._failed_response(
                request,
                title="AI provider connection error",
                description="The service could not connect to the AI provider.",
            )
        except OpenAIError as error:
            return self._failed_response(
                request,
                title="AI provider error",
                description=f"The AI provider returned an error: {error}",
            )
        except Exception:
            return self._failed_response(
                request,
                title="Unexpected AI analysis error",
                description="An unexpected error occurred while analyzing the code.",
            )

    def _invalid_model_response(self, request: AnalyzeRequest, details: str) -> AnalyzeResponse:
        return self._failed_response(
            request,
            title="Invalid AI response",
            description=f"The model response could not be normalized to the expected contract. {details}",
        )

    def _failed_response(
        self,
        request: AnalyzeRequest,
        title: str,
        description: str,
    ) -> AnalyzeResponse:
        return AnalyzeResponse(
            auditId=request.auditId,
            status="failed",
            findings=[
                Finding(
                    type="best_practice",
                    severity="warning",
                    title=title,
                    description=description,
                    line=None,
                    suggestion="Review the AI service configuration and try again.",
                )
            ],
            pedagogicalExplanation=(
                "No se pudo completar el analisis con IA. El servicio devolvio una "
                "respuesta controlada para mantener estable el contrato con Java."
            ),
            refactoredCode=request.code,
        )

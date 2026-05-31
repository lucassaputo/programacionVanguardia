import json

from app.models.analyze_models import AnalyzeRequest, AnalyzeResponse


class PromptBuilder:
    """Builds the messages sent to the LLM."""

    def build_system_prompt(self) -> str:
        schema = AnalyzeResponse.model_json_schema()
        return (
            "Act as a Senior Developer specialized in secure code reviews, clean code, "
            "refactoring, and pedagogy for programming students.\n"
            "Analyze the submitted code for security vulnerabilities, obvious syntax "
            "errors, bad practices, and refactoring opportunities.\n"
            "Return only valid JSON compatible with this JSON Schema. Do not include "
            "markdown, comments, or extra text outside the JSON object.\n"
            f"JSON Schema:\n{json.dumps(schema, ensure_ascii=False)}"
        )

    def build_user_prompt(self, request: AnalyzeRequest) -> str:
        return (
            f"auditId: {request.auditId}\n"
            f"language: {request.language}\n"
            "code:\n"
            "```text\n"
            f"{request.code}\n"
            "```\n\n"
            "The response must keep the same auditId and must use status='success' "
            "when analysis completes. If no issues are found, return an empty findings "
            "array and provide a brief pedagogical explanation."
        )

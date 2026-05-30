import json
from functools import cached_property

from app.models.analyze_models import AnalyzeRequest, AnalyzeResponse


class PromptBuilder:
    """Builds the messages sent to the LLM."""

    @cached_property
    def _response_schema_json(self) -> str:
        return json.dumps(AnalyzeResponse.model_json_schema(), ensure_ascii=False)

    def build_system_prompt(self) -> str:
        return (
            "Act as a Senior Developer specialized in secure code reviews, clean code, "
            "refactoring, and pedagogy for programming students.\n"
            "Analyze the submitted code for security vulnerabilities, obvious syntax "
            "errors, bad practices, and refactoring opportunities.\n"
            "Prioritize concrete findings that are visible in the submitted code. "
            "Do not invent files, dependencies, runtime behavior, or line numbers. "
            "Use line=null when the issue cannot be mapped to a specific line.\n"
            "Return only valid JSON compatible with this JSON Schema. Do not include "
            "markdown, comments, or extra text outside the JSON object.\n"
            f"JSON Schema:\n{self._response_schema_json}"
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
            "array and provide a brief pedagogical explanation. Keep refactoredCode "
            "close to the original code and change only the parts needed to illustrate "
            "the most important improvement."
        )

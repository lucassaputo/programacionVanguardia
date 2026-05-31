from app.models.analyze_models import AnalyzeRequest, AnalyzeResponse, Finding


class MockAnalysisService:
    """Stable mock used by Java integration and local development."""

    def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        return AnalyzeResponse(
            auditId=request.auditId,
            status="success",
            findings=[
                Finding(
                    type="security",
                    severity="critical",
                    title="Possible SQL Injection",
                    description="The code concatenates user input directly into SQL.",
                    line=1,
                    suggestion="Use parameterized queries or PreparedStatement.",
                )
            ],
            pedagogicalExplanation=(
                "SQL Injection ocurre cuando datos externos se concatenan directamente "
                "en una consulta SQL, permitiendo que un atacante modifique la intencion "
                "original de la consulta."
            ),
            refactoredCode=(
                'PreparedStatement stmt = connection.prepareStatement("SELECT * FROM users WHERE id = ?");\n'
                "stmt.setInt(1, userId);"
            ),
        )

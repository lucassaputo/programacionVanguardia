from app.models.analyze_models import AnalyzeRequest, AnalyzeResponse, Finding


class MockAnalysisService:
    """Temporary mock service. Replace this class with a real AI analyzer later."""

    def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        return AnalyzeResponse(
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
                "en una consulta SQL, permitiendo que un atacante modifique la intención "
                "original de la consulta."
            ),
            refactoredCode=(
                'PreparedStatement stmt = connection.prepareStatement("SELECT * FROM users WHERE id = ?");\n'
                "stmt.setInt(1, userId);"
            ),
        )

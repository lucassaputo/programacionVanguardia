# Code Audit AI Service

Microservicio Python con FastAPI para validar la integración REST entre el backend Java Spring Boot y el backend Python de auditoría de código.

Este primer entregable no se conecta a OpenAI ni a ningún LLM. El endpoint `/analyze` devuelve una respuesta mock estable para que el backend Java pueda consumir el contrato JSON.

## Requisitos

- Python 3.12 o superior
- pip

## Instalación local

Desde la carpeta `code-audit-ai-service`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

En Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Ejecutar localmente

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Swagger queda disponible en:

```text
http://localhost:8000/docs
```

## Health check

```bash
curl http://localhost:8000/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "code-audit-ai-service"
}
```

## Probar análisis mock

```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "auditId": "6d6b0a3a-4d7c-4d92-bb8f-3f6d7b91b111",
    "language": "java",
    "code": "String sql = \"SELECT * FROM users WHERE id=\" + userId;"
  }'
```

Respuesta esperada:

```json
{
  "status": "success",
  "findings": [
    {
      "type": "security",
      "severity": "critical",
      "title": "Possible SQL Injection",
      "description": "The code concatenates user input directly into SQL.",
      "line": 1,
      "suggestion": "Use parameterized queries or PreparedStatement."
    }
  ],
  "pedagogicalExplanation": "SQL Injection ocurre cuando datos externos se concatenan directamente en una consulta SQL, permitiendo que un atacante modifique la intención original de la consulta.",
  "refactoredCode": "PreparedStatement stmt = connection.prepareStatement(\"SELECT * FROM users WHERE id = ?\");\nstmt.setInt(1, userId);"
}
```

## Validaciones

- `auditId` es obligatorio.
- `language` es obligatorio.
- `code` es obligatorio.
- Si `code` llega vacío, el servicio responde HTTP 400 con un mensaje claro.

## Ejecutar con Docker

Construir imagen:

```bash
docker build -t code-audit-ai-service .
```

Ejecutar contenedor:

```bash
docker run --rm -p 8000:8000 code-audit-ai-service
```

## Preparado para IA real

La lógica actual vive en `app/services/mock_analysis_service.py`. En una siguiente iteración se puede reemplazar `MockAnalysisService` por un servicio real que invoque un proveedor de IA, manteniendo el contrato HTTP expuesto por `/analyze`.

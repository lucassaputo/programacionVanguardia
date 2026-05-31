# Code Audit AI Service

Microservicio Python con FastAPI para analizar codigo fuente dentro de la plataforma de auditoria. Expone el contrato REST consumido por el backend Java y puede ejecutarse en modo mock o en modo IA.

Importante: Java no debe cambiar su contrato. El endpoint `POST /analyze` mantiene la misma entrada y devuelve siempre un JSON compatible con `AnalyzeResponse`.

## Requisitos

- Python 3.12 o superior
- pip
- API key de OpenAI solo si se usa `ANALYSIS_MODE=ai`

## Instalacion local

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

## Variables de entorno

```env
ANALYSIS_MODE=mock
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
AI_API_KEY=
AI_TIMEOUT_SECONDS=30
```

Valores soportados:

- `ANALYSIS_MODE=mock`: usa la respuesta fija para desarrollo e integracion con Java.
- `ANALYSIS_MODE=ai`: llama a OpenAI y valida la respuesta con Pydantic.
- `AI_PROVIDER=openai`: proveedor soportado actualmente.
- `AI_MODEL=gpt-4o-mini`: modelo usado para el analisis.
- `AI_API_KEY`: clave tomada desde el entorno. Nunca debe hardcodearse.
- `AI_TIMEOUT_SECONDS=30`: timeout de llamada al proveedor IA.

## Ejecutar en modo mock

```bash
ANALYSIS_MODE=mock python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

En Windows PowerShell:

```powershell
$env:ANALYSIS_MODE="mock"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Ejecutar en modo IA

```bash
ANALYSIS_MODE=ai AI_PROVIDER=openai AI_MODEL=gpt-4o-mini AI_API_KEY=tu_api_key python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

En Windows PowerShell:

```powershell
$env:ANALYSIS_MODE="ai"
$env:AI_PROVIDER="openai"
$env:AI_MODEL="gpt-4o-mini"
$env:AI_API_KEY="tu_api_key"
$env:AI_TIMEOUT_SECONDS="30"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
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

## Probar /analyze

```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "auditId": "6d6b0a3a-4d7c-4d92-bb8f-3f6d7b91b111",
    "language": "java",
    "code": "String sql = \"SELECT * FROM users WHERE id=\" + userId;"
  }'
```

Respuesta esperada en modo mock:

```json
{
  "auditId": "6d6b0a3a-4d7c-4d92-bb8f-3f6d7b91b111",
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
  "pedagogicalExplanation": "SQL Injection ocurre cuando datos externos se concatenan directamente en una consulta SQL, permitiendo que un atacante modifique la intencion original de la consulta.",
  "refactoredCode": "PreparedStatement stmt = connection.prepareStatement(\"SELECT * FROM users WHERE id = ?\");\nstmt.setInt(1, userId);"
}
```

## Ejemplo .env

```env
ANALYSIS_MODE=ai
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
AI_API_KEY=sk-...
AI_TIMEOUT_SECONDS=30
```

## Manejo de errores

- Si `ANALYSIS_MODE=ai` y falta `AI_API_KEY`, responde HTTP 500 con `AI_API_KEY is not configured`.
- Si OpenAI devuelve timeout, error de conexion o error del proveedor, el endpoint responde JSON con `status="failed"`.
- Si la respuesta del modelo no cumple el contrato, se captura el error de validacion y se devuelve un finding tecnico controlado.
- Si ocurre una excepcion inesperada, el servicio responde un fallback compatible con `AnalyzeResponse`.

## Validaciones

- `auditId` es obligatorio.
- `language` es obligatorio.
- `code` es obligatorio.
- Si `code` llega vacio, el servicio responde HTTP 400 con un mensaje claro.

## Ejecutar con Docker

Construir imagen:

```bash
docker build -t code-audit-ai-service .
```

Ejecutar contenedor en modo mock:

```bash
docker run --rm -p 8000:8000 -e ANALYSIS_MODE=mock code-audit-ai-service
```

Ejecutar contenedor en modo IA:

```bash
docker run --rm -p 8000:8000 \
  -e ANALYSIS_MODE=ai \
  -e AI_PROVIDER=openai \
  -e AI_MODEL=gpt-4o-mini \
  -e AI_API_KEY=tu_api_key \
  code-audit-ai-service
```

## Alcance

Este servicio solo analiza codigo y devuelve JSON. No implementa persistencia ni base de datos; la persistencia queda del lado del backend Java.

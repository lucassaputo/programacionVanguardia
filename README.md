# programacionVanguardia
TP progamación de vanguardia 1C 2026
# Plataforma de Auditoria de Codigo

Trabajo practico de Programacion de Vanguardia 1C 2026.

La solucion implementa el flujo end-to-end base del Sprint 1 y agrega las capacidades necesarias para cerrar el Sprint 3:

```text
Frontend -> Backend Java -> Servicio Python -> Backend Java -> Frontend
```

Ademas, incluye persistencia de auditorias y hallazgos, procesamiento asincronico, historial consultable con paginacion, filtros, metricas, nivel de riesgo, estimacion de tokens/costo IA, rate limiting, Docker Compose con SQL Server y modo IA real configurable para etapa posterior.

## Componentes

| Carpeta | Tecnologia | Responsabilidad |
|---|---|---|
| `backend` | Spring Boot 3.2.5 / Java 17 | Registro, login JWT, proteccion de endpoints y orquestacion de auditorias |
| `code-audit-ai-service` | FastAPI / Python | Analisis de codigo en modo mock o IA |
| `Frontend` | React, Vite, Monaco Editor | Login visual, editor de codigo, envio al backend y visualizacion de hallazgos |
| `infra` | Docker Compose | Entorno local de demo |

## Estado funcional

| US | Estado | Evidencia |
|---|---|---|
| US-01 Registro usuario | Completa para demo | `POST /api/auth/register`, BCrypt, email duplicado |
| US-02 Login usuario | Completa para demo | `POST /api/auth/login`, respuesta con JWT |
| US-03 Validacion sesion JWT | Completa para demo | Filtro JWT y `/api/audits` protegido |
| US-04 Editor codigo | Completa | Monaco Editor en React con seleccion de lenguaje |
| US-06 Enviar codigo | Completa para demo | Frontend envia `language` y `code` a Java con Bearer token |
| US-07 Integracion Java-Python | Completa para demo | Java crea auditoria `pending` y procesa contra Python en background |
| US-08 Integracion Python-IA | Completa para demo mock | FastAPI responde contrato `AnalyzeResponse` |
| US-09 Mostrar hallazgos | Completa para demo | Frontend hace polling del detalle y renderiza severidad, linea, descripcion y sugerencia |

## Avance Sprint 3

| Capacidad | Estado | Evidencia |
|---|---|---|
| Historial de auditorias | Completa | `GET /api/audits?page=0&size=8` lista auditorias persistidas |
| Detalle de auditoria | Completa | `GET /api/audits/{auditId}` devuelve codigo, hallazgos y riesgo |
| Filtros | Completa | Filtro por lenguaje, nivel de riesgo y paginacion |
| Metricas | Completa | `GET /api/audits/metrics` resume totales y severidades |
| Riesgo general | Completa | `risk_level` persistido y mostrado en React |
| Entorno reproducible | Completa | Docker Compose levanta frontend, backend, Python y SQL Server |
| IA real | Post Sprint 3 | Preparada con `ANALYSIS_MODE=ai`, pendiente de activacion operativa |

## Persistencia

El backend persiste:

- Usuarios en `users`.
- Auditorias en `audits`.
- Hallazgos en `findings`.
- Nivel de riesgo general por auditoria en `risk_level`.
- Estado de procesamiento en `status`: `pending`, `processing`, `success`, `failed`.
- Estimacion de tokens y costo IA en `estimated_tokens` y `estimated_cost_usd`.

La ejecucion local directa usa H2 en memoria. Docker Compose levanta SQL Server 2022 y configura el backend para usarlo.

## Endpoints principales

### Backend Java

Base URL local:

```text
http://localhost:8080
```

Endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/audits`
- `GET /api/audits`
- `GET /api/audits/{auditId}`
- `GET /api/audits/metrics`

`/api/audits` requiere:

```http
Authorization: Bearer <token>
```

Body esperado:

```json
{
  "language": "java",
  "code": "String sql = \"SELECT * FROM users WHERE id=\" + userId;"
}
```

`POST /api/audits` responde `202 Accepted` y devuelve una auditoria en cola. El frontend consulta luego `GET /api/audits/{auditId}` hasta que el estado sea `success` o `failed`.

Estados posibles:

- `pending`: auditoria creada y en cola.
- `processing`: worker analizando con el servicio Python.
- `success`: analisis finalizado correctamente.
- `failed`: analisis fallido, con mensaje controlado en el detalle.

`GET /api/audits` acepta `language`, `riskLevel`, `page` y `size`.

### Servicio Python

Base URL local:

```text
http://localhost:8000
```

Endpoints:

- `GET /health`
- `POST /analyze`
- `GET /docs`

## Ejecucion local sin Docker

### 1. Levantar Python en modo mock

```powershell
cd code-audit-ai-service
$env:ANALYSIS_MODE="mock"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Levantar Backend Java

```powershell
cd backend
$env:JWT_SECRET="auditoria-codigo-secret-key-2026-segura-32chars"
mvn spring-boot:run
```

### 3. Levantar frontend React

```powershell
cd Frontend
npm install
npm run dev
```

Abrir `http://localhost:5173`.

## Ejecucion con Docker Compose

```powershell
copy infra\.env.example infra\.env
docker compose up --build
```

## Tests

Backend:

```powershell
cd backend && mvn test
```

Frontend E2E:

```powershell
cd Frontend && npx playwright install chromium && npm run test:e2e
```

Python:

```powershell
cd code-audit-ai-service && pytest
```

## Modo IA real

Por defecto Docker Compose usa `ANALYSIS_MODE=mock`. Para activar IA real:

```powershell
$env:AI_API_KEY="tu_api_key"
docker compose -f docker-compose.yml -f infra/docker-compose.ai.yml up --build
```
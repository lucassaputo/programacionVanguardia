# Frontend React

Frontend principal de la plataforma de auditoria de codigo.

## Stack

- React 18
- Vite
- Monaco Editor
- Playwright para pruebas end-to-end

## Funcionalidades

- Registro visual.
- Login visual.
- Persistencia automatica del JWT en `localStorage`.
- Cierre automatico de sesion cuando expira el JWT.
- Editor de codigo con seleccion de lenguaje.
- Envio de `language` y `code` a `POST /api/audits`.
- Seguimiento por polling de `GET /api/audits/{auditId}` hasta `success` o `failed`.
- Cancelacion del seguimiento de una auditoria en curso.
- Visualizacion de hallazgos con severidad, linea, descripcion y sugerencia.
- Render de explicacion pedagogica y codigo sugerido.
- Historial de auditorias persistidas por usuario.
- Detalle de auditoria con codigo original.
- Nivel de riesgo general por auditoria.
- Metricas agregadas de auditorias/hallazgos.
- Filtros de historial por lenguaje y riesgo.
- Paginacion de historial.
- Estados visibles: `pending`, `processing`, `success`, `failed`.
- Estimacion de tokens y costo IA por auditoria.
- Manejo especifico de errores de sesion, validacion, rate limit y presupuesto excedido.

## Ejecutar local

```powershell
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```

El backend debe estar disponible en:

```text
http://localhost:8080
```

Se puede cambiar con:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8080"
npm run dev
```

## Build

```powershell
npm run build
```

## Tests end-to-end

Instalar Chromium una vez:

```powershell
npx playwright install chromium
```

Ejecutar:

```powershell
npm run test:e2e
```

El test E2E mockea el contrato asincronico actual:

1. `POST /api/audits` devuelve una auditoria `pending`.
2. La UI consulta `GET /api/audits/{auditId}`.
3. El detalle final devuelve `success` con hallazgos.

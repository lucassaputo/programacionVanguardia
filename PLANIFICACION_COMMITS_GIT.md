# Planificacion de commits para subir a Git

Objetivo: ordenar los cambios actuales en commits logicos y defendibles para demostrar uso de Git sin generar un unico commit gigante. Esta version prioriza que todos los integrantes tengan al menos un commit propio y verificable en el historial.

La recomendacion es trabajar sobre una rama de integracion, por ejemplo:

```powershell
git switch -c feature/integracion-final
```

Si la rama ya existe, usarla directamente:

```powershell
git switch feature/integracion-final
```

## Criterio de autoria

La forma mas defendible de cumplir el requisito es que cada integrante haga al menos un commit desde su propia cuenta o maquina. No conviene usar `--author` para simular autoria. Solo deberia usarse si la persona realmente hizo esa parte, el equipo lo aprueba y se usa su nombre/email correcto.

Si una sola persona integra el trabajo final, puede mantener commits separados por componente y mencionar la colaboracion en el pull request, pero eso no reemplaza commits reales de cada integrante.

## Validar historial actual

Antes de crear commits nuevos, revisar si el historial ya muestra participacion de todos:

```powershell
git log --format="%h`t%an`t%s" --all
```

Integrantes que deben aparecer:

- Lucas Saputo
- Nicolas Strasberg
- Juan Ignacio Drovetto
- Julio Severino
- Laura
- Valentin Simaldone

Si alguno no aparece, esa persona debe hacer un commit real sobre una parte acotada del proyecto.

## Plan recomendado por integrante

Este orden esta pensado para que cada integrante tenga al menos un commit nuevo y el historial quede claro.

### Commit 1 - Lucas Saputo

Mensaje:

```text
refactor(backend): consolidar autenticacion JWT
```

Archivos sugeridos:

- `backend/pom.xml`
- `backend/src/main/java/com/auditoria/AuditoriaApplication.java`
- `backend/src/main/java/com/auditoria/config/PasswordEncoderConfig.java`
- `backend/src/main/java/com/auditoria/config/SecurityConfig.java`
- `backend/src/main/java/com/auditoria/controller/AuthController.java`
- `backend/src/main/java/com/auditoria/dto/RegisterRequestDTO.java`
- `backend/src/main/java/com/auditoria/dto/UserResponseDTO.java`
- `backend/src/main/java/com/auditoria/dto/LoginRequestDTO.java`
- `backend/src/main/java/com/auditoria/dto/LoginResponseDTO.java`
- `backend/src/main/java/com/auditoria/entity/User.java`
- `backend/src/main/java/com/auditoria/repository/UserRepository.java`
- `backend/src/main/java/com/auditoria/service/UserService.java`
- `backend/src/main/java/com/auditoria/security/JwtTokenProvider.java`
- `backend/src/main/java/com/auditoria/security/JwtAuthenticationFilter.java`
- `backend/src/main/resources/application.properties`

Motivo: varios archivos ya tienen historia previa, por eso el mensaje usa "consolidar" y no "agregar desde cero".

### Commit 2 - Nicolas Strasberg

Mensaje:

```text
feat(backend): agregar validaciones y errores controlados
```

Archivos sugeridos:

- `backend/src/main/java/com/auditoria/controller/HealthController.java`
- `backend/src/main/java/com/auditoria/exception/GlobalExceptionHandler.java`
- `backend/src/main/java/com/auditoria/exception/AnalysisBudgetExceededException.java`
- `backend/src/main/java/com/auditoria/exception/AuditNotFoundException.java`
- `backend/src/main/java/com/auditoria/exception/RateLimitExceededException.java`
- `backend/src/main/java/com/auditoria/exception/UnsupportedLanguageException.java`
- `backend/src/main/java/com/auditoria/model/SupportedLanguage.java`
- `backend/src/main/java/com/auditoria/service/RateLimiterService.java`
- `backend/src/main/java/com/auditoria/service/AnalysisCostEstimate.java`
- `backend/src/main/java/com/auditoria/service/AnalysisCostEstimator.java`

### Commit 3 - Juan Ignacio Drovetto

Mensaje:

```text
feat(backend): integrar auditorias persistidas con python
```

Archivos sugeridos:

- `backend/src/main/java/com/auditoria/controller/AuditController.java`
- `backend/src/main/java/com/auditoria/config/RestClientConfig.java`
- `backend/src/main/java/com/auditoria/service/PythonClientService.java`
- `backend/src/main/java/com/auditoria/service/AuditService.java`
- `backend/src/main/java/com/auditoria/service/AuditAnalysisWorker.java`
- `backend/src/main/java/com/auditoria/dto/AnalyzeRequestDTO.java`
- `backend/src/main/java/com/auditoria/dto/AnalyzeResponseDTO.java`
- `backend/src/main/java/com/auditoria/dto/PythonAnalyzeRequestDTO.java`
- `backend/src/main/java/com/auditoria/dto/FindingDTO.java`
- `backend/src/main/java/com/auditoria/dto/AuditDetailDTO.java`
- `backend/src/main/java/com/auditoria/dto/AuditSummaryDTO.java`
- `backend/src/main/java/com/auditoria/dto/AuditMetricsDTO.java`
- `backend/src/main/java/com/auditoria/entity/Audit.java`
- `backend/src/main/java/com/auditoria/entity/Finding.java`
- `backend/src/main/java/com/auditoria/repository/AuditRepository.java`
- `backend/src/main/java/com/auditoria/repository/FindingRepository.java`
- `backend/src/main/java/com/auditoria/model/AuditStatus.java`
- `backend/src/main/java/com/auditoria/model/RiskLevel.java`
- `backend/src/main/resources/application-local.properties`
- `backend/src/main/resources/application-docker.properties`

Registrar tambien la eliminacion del archivo reemplazado:

- `backend/src/main/java/com/auditoria/ClienteAuditoriaIA.java`

### Commit 4 - Julio Severino

Mensaje:

```text
feat(ai-service): agregar servicio fastapi para analisis de codigo
```

Archivos sugeridos:

- `code-audit-ai-service/Dockerfile`
- `code-audit-ai-service/.dockerignore`
- `code-audit-ai-service/requirements.txt`
- `code-audit-ai-service/README.md`
- `code-audit-ai-service/app/config.py`
- `code-audit-ai-service/app/main.py`
- `code-audit-ai-service/app/models/analyze_models.py`
- `code-audit-ai-service/app/routers/analyze_router.py`
- `code-audit-ai-service/app/services/analysis_strategy.py`
- `code-audit-ai-service/app/services/ai_analysis_service.py`
- `code-audit-ai-service/app/services/mock_analysis_service.py`
- `code-audit-ai-service/app/services/prompt_builder.py`

### Commit 5 - Laura

Mensaje:

```text
feat(frontend): agregar flujo principal de auditorias
```

Archivos sugeridos:

- `Frontend/package.json`
- `Frontend/package-lock.json`
- `Frontend/index.html`
- `Frontend/vite.config.js`
- `Frontend/src/api.js`
- `Frontend/src/main.jsx`
- `Frontend/README.md`

### Commit 6 - Valentin Simaldone

Mensaje:

```text
feat(frontend): mejorar editor historial y estilos
```

Archivos sugeridos:

- `Frontend/src/styles.css`
- `Frontend/playwright.config.js`
- `Frontend/Dockerfile`
- `Frontend/.dockerignore`
- `Frontend/nginx.conf`

Registrar tambien la eliminacion de los prototipos reemplazados por `Frontend/`:

- `index.html`
- `script.js`
- `style.css`
- `front Valen/editor.html`
- `front Valen/editor-script.js`
- `front Valen/editor-styles.css`

### Commit 7 - Tests del flujo de auditoria

Responsable sugerido: equipo completo. Si falta un commit propio de algun integrante, este commit puede dividirse para que esa persona tome una parte real.

Mensaje:

```text
test: cubrir flujo de auditoria end to end
```

Archivos sugeridos:

- `backend/src/test/java/com/auditoria/Sprint1EndToEndTest.java`
- `Frontend/tests/sprint1.spec.js`
- `code-audit-ai-service/tests/test_analyze_router.py`

### Commit 8 - Infraestructura y documentacion final

Responsable sugerido: Julio Severino o integrante que necesite completar evidencia de participacion.

Mensaje:

```text
chore(infra): agregar docker compose y documentacion de ejecucion
```

Archivos sugeridos:

- `docker-compose.yml`
- `infra/.env.example`
- `infra/docker-compose.yml`
- `infra/docker-compose.ai.yml`
- `backend/Dockerfile`
- `backend/.dockerignore`
- `README.md`
- `.gitignore`
- `PLANIFICACION_COMMITS_GIT.md`

No commitear `infra/.env`, porque contiene configuracion local y secretos de demo.

## Comandos sugeridos para cada integrante

Cada integrante debe configurar su identidad local antes de commitear:

```powershell
git config user.name "Nombre Apellido"
git config user.email "email-usado-en-github@example.com"
```

Luego debe agregar solo sus archivos:

```powershell
git add archivo1 archivo2 carpeta/
git commit -m "mensaje del commit"
```

Verificar autores:

```powershell
git log --format="%h`t%an`t%s" -n 20
```

Subir la rama:

```powershell
git push origin feature/integracion-final
```

## Checklist antes del push final

- [ ] Confirmar que todos los integrantes aparecen en `git log`.
- [ ] Confirmar que `infra/.env` no queda trackeado.
- [ ] Confirmar que los archivos historicos reemplazados se registran como eliminados.
- [ ] Ejecutar `mvn test` en `backend`.
- [ ] Ejecutar `npm run build` en `Frontend`.
- [ ] Ejecutar tests Python luego de instalar `requirements.txt`.
- [ ] Ejecutar `docker compose config`.
- [ ] Revisar que cada commit tenga un mensaje claro y corresponda a un conjunto logico de archivos.
- [ ] Abrir pull request o merge request hacia `develop` o la rama acordada por el equipo.
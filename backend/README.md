# Backend Java — Microservicio de Gestión y Persistencia

Microservicio construido con **Spring Boot 3.2.5** y **Java 17+**. Actúa como orquestador del sistema: gestiona el registro y autenticación de usuarios mediante JWT, y será el punto de entrada para enviar código al microservicio de análisis Python.

---

## Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| Java | 17+ | Lenguaje |
| Spring Boot | 3.2.5 | Framework principal |
| Spring Security | (incluido en Boot) | Autenticación y autorización |
| Spring Data JPA | (incluido en Boot) | Persistencia |
| Hibernate | 6.4.4 | ORM |
| H2 | (incluido en Boot) | Base de datos en memoria |
| JJWT | 0.12.6 | Generación y validación de tokens JWT |
| BCrypt | (incluido en Security) | Hash de contraseñas |

---

## Estructura del proyecto

```
backend/
└── src/main/java/com/auditoria/
    ├── AuditoriaApplication.java       # Punto de entrada
    ├── config/
    │   ├── SecurityConfig.java         # Configuración de Spring Security + filtro JWT
    │   └── PasswordEncoderConfig.java  # Bean BCryptPasswordEncoder
    ├── controller/
    │   └── AuthController.java         # Endpoints de autenticación
    ├── dto/
    │   ├── RegisterRequestDTO.java     # Body del registro
    │   ├── LoginRequestDTO.java        # Body del login
    │   ├── LoginResponseDTO.java       # Respuesta del login (token)
    │   └── UserResponseDTO.java        # Respuesta del registro
    ├── entity/
    │   └── User.java                   # Entidad JPA + implementa UserDetails
    ├── exception/
    │   ├── EmailAlreadyExistsException.java
    │   └── GlobalExceptionHandler.java # Manejo centralizado de errores
    ├── repository/
    │   └── UserRepository.java         # Consultas a la BD
    ├── security/
    │   ├── JwtTokenProvider.java       # Generación y validación de tokens JWT
    │   └── JwtAuthenticationFilter.java # Filtro que intercepta requests con JWT
    └── service/
        └── UserService.java            # Lógica de negocio: register, login, loadUserByUsername
```

---

## Endpoints

### POST `/api/auth/register`
Registra un nuevo usuario. La contraseña se almacena hasheada con BCrypt.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "minimo8caracteres"
}
```

**Response `201 Created`:**
```json
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "createdAt": "2026-05-07T14:02:10.383"
}
```

**Errores posibles:**
- `400 Bad Request` — email inválido o password menor a 8 caracteres
- `409 Conflict` — el email ya está registrado

---

### POST `/api/auth/login`
Autentica un usuario con sus credenciales y devuelve un token JWT válido por 24 horas.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "minimo8caracteres"
}
```

**Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "email": "usuario@ejemplo.com",
  "expiresAt": "2026-05-08T14:02:10.383"
}
```

**Errores posibles:**
- `401 Unauthorized` — credenciales incorrectas
- `400 Bad Request` — campos vacíos o email con formato inválido

---

### Endpoints protegidos
Cualquier endpoint fuera de `/api/auth/**` requiere autenticación. Se debe incluir el token en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

---

## Cómo levantar el backend

### Requisitos previos
- Java 17 o superior instalado (`java -version`)
- Maven instalado (`mvn -version`)

### 1. Definir la variable de entorno del secret JWT

**PowerShell:**
```powershell
$env:JWT_SECRET = "auditoria-codigo-secret-key-2026-segura-32chars"
```

> El secret debe tener al menos 32 caracteres. Nunca commitear el valor real.

### 2. Correr el servidor

```powershell
cd backend
mvn spring-boot:run
```

El servidor arranca en `http://localhost:8080`.

### 3. Consola H2 (base de datos)

Disponible en `http://localhost:8080/h2-console` con los siguientes datos:
- **JDBC URL:** `jdbc:h2:mem:auditoriadb`
- **User:** `sa`
- **Password:** (vacío)

> La base de datos es en memoria: los datos se pierden al reiniciar el servidor. Esto es intencional para desarrollo; en producción se reemplaza.

---

## Cómo funciona la autenticación JWT

```
1. Cliente hace POST /api/auth/login con email + password
2. Backend verifica la password contra el hash en BD (BCrypt)
3. Si es válida, genera un token JWT firmado con el JWT_SECRET
4. El token contiene: email del usuario, fecha de emisión, fecha de expiración
5. Cliente guarda el token y lo envía en cada request siguiente como header:
   Authorization: Bearer <token>
6. El JwtAuthenticationFilter intercepta cada request,
   extrae el token, verifica la firma y carga el usuario en el contexto de seguridad
```

El servidor **no guarda** los tokens — la validación es matemática mediante la firma HMAC-SHA256.

---

## Base de datos

### Tabla `users`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | BIGINT (PK, auto) | Identificador único |
| `email` | VARCHAR(255) UNIQUE | Email del usuario |
| `password` | VARCHAR(255) | Hash BCrypt de la contraseña |
| `created_at` | TIMESTAMP | Fecha de registro (auto) |

---

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `JWT_SECRET` | Sí | Clave para firmar tokens JWT (mínimo 32 caracteres) |

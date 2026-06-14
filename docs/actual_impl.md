# GameConnect API — Walkthrough de Implementación Actual

> **Fecha:** 2026-06-13  
> **Stack:** NestJS 11 + Prisma 7 + PostgreSQL 16 + TypeScript 5.7  
> **Propósito:** API REST para red social de videojuegos

---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Infraestructura y DevOps](#2-infraestructura-y-devops)
3. [Base de Datos (Prisma)](#3-base-de-datos-prisma)
4. [Módulo Prisma (Capa de Datos)](#4-módulo-prisma-capa-de-datos)
5. [Módulo Auth](#5-módulo-auth)
6. [Módulo Media](#6-módulo-media)
7. [Módulo Email](#7-módulo-email)
8. [Módulos Scaffold (Vacíos)](#8-módulos-scaffold-vacíos)
9. [Endpoints Actuales](#9-endpoints-actuales)
10. [Swagger / Documentación de API](#10-swagger--documentación-de-api)
11. [Issue Sprint 1 — Estado](#11-issue-sprint-1--estado)

---

## 1. Arquitectura General

```
gameconnect-api/
├── prisma/
│   ├── schema.prisma          ← Schema completo de BD
│   ├── migrations/            ← Migraciones SQL generadas
│   └── seed.ts                ← Seed básico
├── src/
│   ├── main.ts                ← Entry point (bootstrap NestJS + Swagger)
│   ├── app.module.ts          ← Módulo raíz (importa todos los módulos)
│   ├── generated/prisma/      ← Prisma Client generado
│   ├── prisma/
│   │   ├── prisma.module.ts   ← Módulo global de Prisma
│   │   └── prisma.service.ts  ← Servicio Prisma (conexión a PostgreSQL)
│   └── modules/
│       ├── auth/              ← COMPLETO (registro, login, refresh, JWT, OAuth Google)
│       ├── media/             ← COMPLETO (subida a Cloudinary)
│       ├── email/             ← PARCIAL (servicio listo, sin endpoints)
│       ├── chat/              ← VACÍO (solo módulo)
│       ├── feed/              ← VACÍO (solo módulo)
│       ├── games/             ← VACÍO (solo módulo)
│       ├── moderation/        ← VACÍO (solo módulo)
│       ├── notifications/     ← VACÍO (solo módulo)
│       ├── posts/             ← VACÍO (solo módulo)
│       ├── search/            ← VACÍO (solo módulo)
│       └── users/             ← VACÍO (solo módulo)
├── docker-compose.yml         ← PostgreSQL + Valkey + Meilisearch + API
├── Dockerfile                 ← Multi-stage (deps + dev)
└── test/                      ← Test e2e (básico)
```

**Framework**: NestJS 11 con decorators y módulos.  
**ORM**: Prisma 7 con adaptador `@prisma/adapter-pg` para PostgreSQL.  
**Lenguaje**: TypeScript 5.7 con `module: "nodenext"` y `moduleResolution: "nodenext"`.

---

## 2. Infraestructura y DevOps

### Docker Compose (`docker-compose.yml`)

Levanta 4 servicios:

| Servicio | Imagen | Puerto | Propósito |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | `5433:5432` | Base de datos principal |
| `valkey` | `valkey/valkey:7-alpine` | `6379:6379` | Cache / colas (Redis-compatible) |
| `meilisearch` | `getmeili/meilisearch:v1.7` | `7700:7700` | Motor de búsqueda |
| `api` | `gameconnect-api` (build local) | `3000:3000` | API NestJS |

**Detalles importantes:**
- PostgreSQL se expone en puerto `5433` (no `5432`) para no colisionar con una instalación local.
- La variable `DATABASE_URL` dentro del contenedor apunta a `postgres:5432` (nombre del servicio Docker), no a `localhost`.
- `src/` y `prisma/` se montan como volúmenes para hot-reload en desarrollo.
- La API espera a que PostgreSQL, Valkey y Meilisearch estén saludables antes de arrancar.

### Dockerfile

Multi-stage con dos etapas:
- **`deps`**: Instala dependencias con `pnpm install --frozen-lockfile`. Cachea `node_modules`.
- **`dev`**: Copia el cliente generado de Prisma, archivos de configuración y `src/`. Corre `pnpm start:dev` (hot reload).

### Configuración de Build

- `nest-cli.json`: `deleteOutDir: true` — limpia `dist/` antes de cada build.
- `tsconfig.build.json`: extiende `tsconfig.json`, excluye `node_modules`, `test`, `dist`, `*.spec.ts`.
- `pnpm-workspace.yaml`: lista de paquetes con `allowBuilds` para permitir scripts de postinstall (`bcrypt`, `prisma`, `esbuild`, etc.).

---

## 3. Base de Datos (Prisma)

### Schema (`prisma/schema.prisma`)

Datasource: **PostgreSQL**.  
Generador: Prisma Client con salida en `src/generated/prisma` y formato `cjs`.

#### Enums

```prisma
UserState     → ACTIVE | TO_DELETE
UserRole      → MODERATOR | USER
FavoriteType  → POST | GAME
GroupRole     → OWNER | ADMIN | MEMBER
FolloweeType  → USER | GAME
MessageType   → GROUP_MESSAGE | DIRECT_MESSAGE
EventType     → LIKE | FOLLOW | COMMENT | MENTION | MESSAGE
ReportStatus  → PENDING | RESOLVED | DISMISSED
ReportTarget  → POST | REVIEW | COMMENT | USER | GAME
ReportReason  → NSFW | HATE | SPAM | OTHER
```

#### Modelos (14 tablas)

| Modelo | Descripción | Columnas clave |
|---|---|---|
| **User** | Usuario de la plataforma | `id`, `username`, `displayName`, `email`, `role`, `bio`, `profilePic`, `coverPic`, `verified`, `state`, `bannedAt`, `deletedAt` |
| **UserAuth** | Autenticación por proveedor (local/Google/Discord) | `provider`, `providerId`, `passwordHash`, `refreshToken` |
| **Follow** | Relación de seguimiento (usuario o juego) | `followerId`, `followedId`, `followedType` |
| **Post** | Publicación o reseña de juego | `author`, `content` (markdown), `media` (JSON), `hashtags[]`, `isReview`, `isRepost`, `reviewedGame`, `reviewScore`, `likesCounter`, `commentsCounter` |
| **Comment** | Comentario en post (con anidamiento) | `parentId` (post), `commentParentId` (subcomentario), `content`, `media` |
| **Game** | Videojuego (metadata desde IGDB) | `metadata` (JSON), `score`, `reviewRatingCount` |
| **GameStaff** | Personal/desarrollador asociado a un juego | `userId`, `gameId`, `staffTitle` |
| **Like** | Like a un post | `userId`, `postId` |
| **Favorite** | Favorito (post o juego) | `userId`, `itemId`, `itemType` |
| **Message** | Mensaje de chat (DM o grupal) | `sentBy`, `conversationId`, `replyToId`, `type`, `messageText`, `attachedMedia` |
| **Conversation** | Conversación de chat (DM/grupo) | `name`, `groupPicture`, `createdBy` |
| **GroupMember** | Miembro de conversación grupal | `userId`, `conversationId`, `role`, `joinedAt`, `leftAt` |
| **Notification** | Notificación de evento | `userId`, `type`, `payload` (JSON), `read` |
| **Report** | Reporte de moderación | `reporterId`, `targetId`, `targetType`, `reason`, `status`, `resolvedBy` |

**Relaciones importantes:**
- `Post` tiene auto-relación para reposts (`originalPostId`).
- `Comment` tiene auto-relación para subcomentarios anidados (`commentParentId`).
- `Message` tiene auto-relación para respuestas (`replyToId`).
- `Report` se relaciona con `User` dos veces: como `reporter` y como `resolver`.

### Migraciones

Ya existe una migración inicial: `20260608164511_init`.  
Lock file: `provider = "postgresql"`.

### Seed (`prisma/seed.ts`)

Crea un usuario de prueba con email `seed@example.com`, username `seeduser`, autenticación local con un hash dummy. El seed es idempotente (verifica si el email ya existe antes de crear).

---

## 4. Módulo Prisma (Capa de Datos)

### `PrismaService` (`src/prisma/prisma.service.ts`)

- Extiende `PrismaClient` e implementa `OnModuleInit` / `OnModuleDestroy`.
- Usa `@prisma/adapter-pg` para la conexión a PostgreSQL.
- Lee `DATABASE_URL` de `process.env`.
- Se conecta al iniciar el módulo y se desconecta al destruirlo.

### `PrismaModule` (`src/prisma/prisma.module.ts`)

- Decorado con `@Global()` — no es necesario importarlo en cada módulo, está disponible globalmente.
- Exporta `PrismaService` para que cualquier módulo lo inyecte.

---

## 5. Módulo Auth

### Estado: **COMPLETO**

#### DTOs

| DTO | Campos | Validación |
|---|---|---|
| `RegisterDto` | `email`, `password` | `@IsEmail()`, `@IsString()`, `@MinLength(6)` |
| `LoginDto` | `email`, `password` | `@IsEmail()`, `@IsString()`, `@MinLength(6)` |
| `RefreshDto` | `refreshToken` | `@IsString()` |

#### Servicio (`AuthService`)

**Flujo de registro (`register`):**
1. Hashea la contraseña con `bcrypt` (10 rounds).
2. Crea el `User` con estado `ACTIVE` y rol `USER`.
3. Crea el `UserAuth` con provider `'local'` y el hash.
4. Genera tokens (access + refresh) con JWT.
5. Guarda el refresh token en `UserAuth.refreshToken`.
6. Devuelve `{ accessToken, refreshToken }`.

**Flujo de login (`login`):**
1. Busca el `User` por email.
2. Busca el `UserAuth` con provider `'local'` para ese usuario.
3. Compara contraseña con `bcrypt.compare`.
4. Genera tokens y guarda el refresh token.
5. Devuelve `{ accessToken, refreshToken }`.

**Flujo de refresh (`refresh`):**
1. Verifica el refresh token JWT (usa `JWT_REFRESH_SECRET` o `JWT_SECRET` como fallback).
2. Busca el `UserAuth` que tenga ese `refreshToken`.
3. Genera un nuevo access token.
4. Devuelve `{ accessToken }` (NO rota el refresh token).

**Generación de tokens (`generateTokens`):**
- Payload: `{ sub: userId, authId }`.
- Access token: firmado con `JWT_SECRET`, expira según `JWT_EXPIRATION`.
- Refresh token: firmado con `JWT_REFRESH_SECRET` (o `JWT_SECRET` como fallback), expira según `JWT_REFRESH_EXPIRATION`.

#### Estrategia JWT (`JwtStrategy`)

- Usa `passport-jwt` con `ExtractJwt.fromAuthHeaderAsBearerToken()`.
- Lee `JWT_SECRET` de configuración.
- `validate()` devuelve `{ userId, authId }` que se inyecta en `request.user`.

#### Guard (`JwtAuthGuard`)

- Extiende `AuthGuard('jwt')` de Passport.
- Listo para proteger endpoints con `@UseGuards(JwtAuthGuard)`.

#### Controlador (`AuthController`)

| Endpoint | Método | Body | Descripción |
|---|---|---|---|
| `POST /register` | `register(dto)` | `{ email, password }` | Registra usuario y devuelve tokens |
| `POST /login` | `login(dto)` | `{ email, password }` | Login y devuelve tokens |
| `POST /refresh` | `refresh(dto)` | `{ refreshToken }` | Refresca access token |

#### Módulo (`AuthModule`)

- Importa `JwtModule.register({})` (configuración vacía — el service usa `ConfigService` directamente) y `PassportModule`.
- Provee `AuthService` y `JwtStrategy`.

#### OAuth Google

- **No implementado.** El README menciona endpoints `GET /auth/google` y `GET /auth/google/callback`, pero no existen en el controlador. Las variables `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` están documentadas como opcionales. El schema sí soporta OAuth (campo `providerId` en `UserAuth`).

---

## 6. Módulo Media

### Estado: **COMPLETO**

#### Cloudinary Provider

- Provider con token `'CLOUDINARY'`.
- Lee `CLOUDINARY_CLOUD`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` de ConfigService.
- Configura el SDK de `cloudinary` v2.

#### Servicio (`MediaService`)

- Método `upload(file: Express.Multer.File)`:
  - Usa `cloudinary.uploader.upload_stream()` para subir el buffer del archivo.
  - Devuelve `{ url: result.secure_url }`.

#### Controlador (`MediaController`)

| Endpoint | Método | Body | Descripción |
|---|---|---|---|
| `POST /media` | `upload(file)` | `multipart/form-data` (campo `file`) | Sube archivo a Cloudinary |

- Usa `FileInterceptor('file')` de `@nestjs/platform-express`.
- Validación: si no hay archivo, lanza `BadRequestException('No file provided')`.
- Documentado con Swagger (`@ApiConsumes('multipart/form-data')`).

---

## 7. Módulo Email

### Estado: **PARCIAL** (servicio implementado, sin endpoints)

#### Servicio (`EmailService`)

- Inicializa cliente de **Resend** con `RESEND_API_KEY`.
- Método `send(to, subject, html)`:
  - Envía email usando `resend.emails.send()`.
  - Remitente configurable via `RESEND_FROM` (default: `noreply@example.com`).

#### Módulo (`EmailModule`)

- Provee y exporta `EmailService` para que otros módulos lo inyecten.

---

## 8. Módulos Scaffold (Vacíos)

Los siguientes módulos existen solo como `@Module({})` sin controladores, servicios ni proveedores:

| Módulo | Directorios adicionales | Estado |
|---|---|---|
| `ChatModule` | `dto/`, `entities/`, `types/` | Scaffold |
| `FeedModule` | `dto/`, `entities/`, `types/` | Scaffold |
| `GamesModule` | `dto/`, `entities/`, `types/` | Scaffold |
| `ModerationModule` | `dto/`, `entities/`, `types/` | Scaffold |
| `NotificationsModule` | `dto/`, `entities/`, `types/` | Scaffold |
| `PostsModule` | `dto/`, `entities/`, `types/` | Scaffold |
| `SearchModule` | `dto/`, `entities/`, `types/` | Scaffold |
| `UsersModule` | `dto/`, `entities/`, `types/` | Scaffold |

Los directorios `dto/`, `entities/` y `types/` existen pero están vacíos. Son preparación para futuros desarrollos.

---

## 9. Endpoints Actuales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/health` | No | Health check del servidor |
| `POST` | `/register` | No | Registro de usuario |
| `POST` | `/login` | No | Login con email/password |
| `POST` | `/refresh` | No | Refrescar access token |
| `POST` | `/media` | No | Subir archivo a Cloudinary |

**Nota:** Ningún endpoint requiere autenticación JWT actualmente (el guard `JwtAuthGuard` existe pero no se aplica en ningún controlador).

---

## 10. Swagger / Documentación de API

- Configurado en `main.ts` con `SwaggerModule`.
- Título: "GameConnect API", descripción: "API de la red social de videojuegos", versión "1.0".
- Bearer Auth configurado en `DocumentBuilder` (para cuando se implementen endpoints protegidos).
- Disponible en `http://localhost:3000/api`.
- Todos los endpoints existentes están decorados con `@ApiTags` y `@ApiOperation`.
- Los DTOs usan `@ApiProperty()` para generar schemas correctos.

---

## 11. Issue Sprint 1 — Estado

Basado en `docs/ISSUES_SPRINT_1.txt`, esto es lo que está implementado vs. pendiente:

### Completado ✅
- ✅ Dockerizar servicios (PostgreSQL, Meilisearch, Valkey, API, Cloudinary)
- ✅ `docker compose up` funciona
- ✅ Schema completo de BD en Prisma (14 modelos)
- ✅ Migración inicial creada y funcional
- ✅ Seed de Prisma funcional e idempotente
- ✅ Scaffold de NestJS compila sin errores
- ✅ Swagger en `/api`
- ✅ `GET /health` responde 200
- ✅ `POST /register` — registro básico con JWT
- ✅ `POST /refresh` — refresh token
- ✅ `POST /media` — subida a Cloudinary
- ✅ Estrategia JWT implementada (access + refresh)
- ✅ README documentado

### Pendiente ❌
- ❌ `POST /login` — existe pero no está en la lista del ticket (fue extra)
- ❌ OAuth Google endpoints (`/auth/google`, `/auth/google/callback`) — mencionados en README pero no implementados
- ❌ Cliente conectado con flujo de tokens (es frontend, no aplica aquí)
- ❌ Módulos funcionales: Chat, Feed, Games, Moderation, Notifications, Posts, Search, Users (solo scaffold)
- ❌ Validaciones de datos en registro (el ticket dice "sin validaciones por ahora", pero los DTOs ya tienen `class-validator`)
- ❌ Endpoints protegidos con JWT (el guard existe pero no se usa)

---

## Resumen Técnico

```
Framework:      NestJS 11
ORM:            Prisma 7 + @prisma/adapter-pg
Base de datos:  PostgreSQL 16
Cache/Colas:    Valkey 7 (Redis-compatible)
Búsqueda:       Meilisearch 1.7
Auth:           JWT (Passport + @nestjs/jwt)
Media:          Cloudinary
Email:          Resend
Docs API:       Swagger (@nestjs/swagger)
Empaquetado:    pnpm
Contenedores:   Docker + Docker Compose
Node.js:        22 (Alpine)
```

**Próximos pasos lógicos:** implementar los módulos vacíos empezando por Posts y Users, conectar el guard JWT a los endpoints protegidos, y construir el feed.

# GameConnect API

API NestJS + Prisma + PostgreSQL para la red social de videojuegos GameConnect.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS 11 |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL 16 |
| Cache | Valkey 7 (Redis-compatible) |
| Búsqueda | Meilisearch 1.7 |
| Auth | JWT (access + refresh tokens) |
| Archivos | Supabase Storage |
| Email | Resend |
| Documentación | Swagger UI (`/api`) |

## Prerrequisitos

- [Node.js 22+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (`corepack enable`)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)

## Quickstart con Docker

```bash
# 1. Clonar y entrar al directorio
cd gameconnect-api

# 2. Copiar variables de entorno y editar
cp .env.example .env

# 3. Levantar todo (PostgreSQL + Valkey + Meilisearch + API)
docker compose up -d

# 4. Esperar a que los servicios estén healthy (~10s)
docker compose ps

# 5. Ejecutar migraciones y seed
docker compose exec api pnpm prisma migrate dev
docker compose exec api pnpm prisma db seed

# 6. Verificar
curl http://localhost:3000/health
```

La API corre en `http://localhost:3000`. Swagger UI en `http://localhost:3000/api`.

## Desarrollo local (sin Docker para la API)

```bash
# Levantar solo infra (PostgreSQL, Valkey, Meilisearch)
docker compose up -d postgres valkey meilisearch

# Instalar dependencias
pnpm install

# Migraciones y seed
pnpm prisma migrate dev
pnpm prisma db seed

# Arrancar con hot reload
pnpm start:dev
```

## Variables de entorno

Copiar `.env.example` → `.env` y llenar:

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `DB_USER` | Usuario PostgreSQL | `admin` | Sí |
| `DB_PASSWORD` | Password PostgreSQL | `admin` | Sí |
| `DB_NAME` | Nombre de la base | `gameconnect_db` | Sí |
| `DATABASE_URL` | Connection string Prisma | `postgresql://admin:admin@localhost:5433/gameconnect_db` | Sí |
| `PORT` | Puerto de la API | `3000` | No (default: 3000) |
| `NODE_ENV` | Entorno | `development` | No |
| `JWT_SECRET` | Firma JWT | `supersecretkeychangeinproduction` | Sí |
| `JWT_EXPIRATION` | TTL access token | `15m` | Sí |
| `JWT_REFRESH_EXPIRATION` | TTL refresh token | `7d` | Sí |
| `VALKEY_URL` | URL Valkey | `redis://localhost:6379` | Sí |
| `MEILI_URL` | URL Meilisearch | `http://localhost:7700` | Sí |
| `MEILI_MASTER_KEY` | API key Meilisearch | `decanatocienciaytecnologiaucla` | Sí |
| `SUPABASE_URL` | URL proyecto Supabase | `https://xxx.supabase.co` | Sí (media) |
| `SUPABASE_PUBLISHABLE_KEY` | Service role key Supabase | `eyJhbG...` | Sí (media) |
| `SUPABASE_STORAGE_BUCKET` | Bucket name | `gameconnect-storage` | Sí (media) |
| `RESEND_API_KEY` | API key Resend | `re_xxxxxxxx` | Sí (email) |
| `RESEND_FROM` | Email remitente | `noreply@example.com` | Sí (email) |
| `IGDB_CLIENT_ID` | Client ID IGDB | — | No (futuro) |
| `IGDB_CLIENT_SECRET` | Client Secret IGDB | — | No (futuro) |

> **Docker**: docker-compose.yml sobreescribe `DATABASE_URL` automáticamente para apuntar a `postgres:5432` (interno). En local usa `localhost:5433` (puerto expuesto).

## Arquitectura

```
src/
├── app.module.ts              ← Módulo raíz (importa todos los submódulos)
├── main.ts                    ← Bootstrap: CORS, ValidationPipe, Swagger
├── generated/prisma/          ← Cliente Prisma generado (no tocar)
├── common/                    ← Pipes, interceptors, filtros compartidos
└── modules/
    ├── auth/                  ← Login, register, refresh, logout, JWT guard
    ├── users/                 ← Perfil de usuario
    ├── posts/                 ← Publicaciones, reviews, reposts
    ├── games/                 ← Catálogo de juegos (IGDB metadata)
    ├── media/                 ← Upload de archivos (Supabase Storage)
    ├── chat/                  ← Mensajes directos y grupales (WebSocket)
    ├── feed/                  ← Timeline personalizado
    ├── notifications/         ← Notificaciones push
    ├── moderation/            ← Reportes, ban, resolución
    ├── search/                ← Búsqueda full-text (Meilisearch)
    └── email/                 ← Envío de emails transaccionales (Resend)
```

**Reglas**:
- Controllers reciben request y retornan response. Lógica en Services.
- DTOs con `class-validator` + `@ApiProperty` para validación y Swagger.
- `PrismaService` es global — se inyecta directamente sin importar módulo.
- Endpoints protegidos usan `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`.
- Ver `docs/nestjs-guide.md` para guía completa del equipo.

## Endpoints principales

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/health` | Estado del servidor | No |
| `POST` | `/auth/register` | Registro (email, password, username?) | No |
| `POST` | `/auth/login` | Login con email/password | No |
| `POST` | `/auth/refresh` | Renovar access token | No |
| `POST` | `/auth/logout` | Cerrar sesión (limpia refresh token) | **Sí** |
| `GET` | `/users/profile` | Perfil del usuario autenticado | **Sí** |
| `POST` | `/media/upload` | Subir archivo a Supabase | — |

> **Swagger UI**: `http://localhost:3000/api` — documentación interactiva de todos los endpoints con esquemas de request/response.

### Ejemplo: registro y uso

```bash
# Registrar usuario
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gc.dev","password":"Password123!","username":"testuser"}'

# Respuesta: { accessToken, refreshToken, user }

# Acceder a endpoint protegido
curl http://localhost:3000/users/profile \
  -H "Authorization: Bearer <accessToken>"
```

## Seed: datos de prueba

El seed crea datos realistas para desarrollo:

| Email | Password | Rol |
|-------|----------|-----|
| `admin@gc.dev` | `Password123!` | ADMIN |
| `mod@gc.dev` | `Password123!` | MODERATOR |
| `user@gc.dev` | `Password123!` | USER |

Incluye: 2 juegos, 5 posts (con reviews), 4 comentarios, follows, likes, favorites, 1 conversación con mensajes, y notificaciones.

```bash
# Ejecutar seed
docker compose exec api pnpm prisma db seed

# Reset completo (cuidado: borra datos)
docker compose exec api pnpm prisma migrate reset
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm start:dev` | Desarrollo con hot reload |
| `pnpm build` | Compilar producción (`dist/`) |
| `pnpm start:prod` | Ejecutar build de producción |
| `pnpm lint` | ESLint + fix automático |
| `pnpm test` | Unit tests (Jest) |
| `pnpm test:e2e` | End-to-end tests |
| `pnpm prisma migrate dev` | Crear/ejecutar migración |
| `pnpm prisma db seed` | Ejecutar seed |
| `pnpm prisma studio` | GUI para explorar datos |
| `pnpm prisma generate` | Regenerar cliente Prisma |

## Troubleshooting

### `docker compose up` falla con error de Prisma

```bash
# Regenerar cliente dentro del contenedor
docker compose exec api pnpm prisma generate

# Verificar que la DB esté healthy
docker compose ps
```

### `@supabase/supabase-js` module not found

```bash
# Rebuild sin cache
docker compose build --no-cache api
docker compose up -d
```

### Puerto 3000 ocupado

Cambiar `PORT` en `.env` o matar el proceso:
```bash
lsof -ti:3000 | xargs kill -9
```

### Migración falla por drift

Si el schema de la DB no coincide con las migraciones:
```bash
# Reset completo (borra datos, reaplica migraciones, ejecuta seed)
docker compose exec api pnpm prisma migrate reset
```

### Swagger no muestra endpoints

Verificar que `nest-cli.json` tenga el plugin de Swagger habilitado. Si no aparecen los DTOs, reiniciar la API:
```bash
docker compose restart api
```

### Error de conexión a PostgreSQL

Verificar que las credenciales en `.env` coincidan con `docker-compose.yml`:
- Docker usa `postgres:5432` (interno)
- Local usa `localhost:5433` (puerto expuesto)
- `DATABASE_URL` debe apuntar al correcto según tu entorno

## Docs adicionales

- `docs/nestjs-guide.md` — Guía del equipo: estructura de módulos, JWT flow, cómo proteger endpoints, DTOs, Prisma, errores y convenciones.

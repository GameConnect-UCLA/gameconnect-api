# GameConnect API

API NestJS para GameConnect, red social de videojuegos.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS 11 |
| ORM | Prisma 7 |
| DB | PostgreSQL 16 |
| Cache | Valkey 7 (Redis-compatible) |
| Búsqueda | Meilisearch 1.7 |
| Colas | BullMQ |
| Auth | JWT (access + refresh tokens) |
| Archivos | Supabase Storage |
| Email | Resend |
| Docs | Swagger UI (`/api`) |

## Services & Connectivity

```
                   ┌─────────────┐
                   │   supabase  │ (storage externo)
                   │   resend    │ (email externo)
                   └──────┬──────┘
                          │ HTTPS
┌──────────┐        ┌─────┴──────┐        ┌──────────────┐
│  client  │──HTTP──│    api     │──TCP──│   postgres   │
│ :mobile  │  :3000 │  NestJS    │ :5432 │   (interno)  │
└──────────┘        │            │        └──────────────┘
                    │            │──TCP──┐
                    │            │ :6379 │ valkey (cache)
                    │            │        └──────────────┘
                    │            │──HTTP─┐
                    │            │ :7700 │ meilisearch
                    └────────────┘        └──────────────┘
```

Todo se levanta con `docker compose up -d`. La API espera health checks de postgres, valkey y meilisearch antes de arrancar.

Puertos expuestos al host:
- API: `3000` (Swagger en `/api`)
- PostgreSQL: `5433` (para no colisionar con PG local; docker interno usa `5432`)
- Valkey: `6379`
- Meilisearch: `7700`
- Prisma Studio: `5555`

## Directory Map

```
src/
├── main.ts                  Bootstrap: CORS, ValidationPipe, Swagger
├── app.module.ts            Módulo raíz (importa todos los submódulos)
├── generated/prisma/        Cliente Prisma autogenerado (no editar)
├── prisma/                  PrismaModule + PrismaService (global)
└── modules/
    ├── auth/                Register, login, refresh, logout, JWT guard/strategy
    ├── users/               Perfiles de usuario
    ├── posts/               Posts, reviews, reposts
    ├── games/               Catálogo de juegos (metadata IGDB)
    ├── media/               Upload a Supabase Storage
    ├── chat/                Mensajería WebSocket (directa + grupal)
    ├── feed/                Timeline personalizado
    ├── notifications/       Notificaciones push
    ├── moderation/          Reportes, bans, resolución
    ├── search/              Búsqueda full-text (Meilisearch)
    ├── email/               Emails transaccionales (Resend)
    └── meili/               Cliente Meilisearch compartido
```

Cada módulo sigue esta estructura interna:

```
modules/{name}/
├── dto/                 DTOs request/response
├── {name}.module.ts     @Module({ imports, providers, controllers, exports })
├── {name}.controller.ts @Controller() — solo recibe/retorna, lógica en service
├── {name}.service.ts    @Injectable() — lógica de negocio
└── *.guard.ts | *.strategy.ts   (si aplica)
```

## Build Order

Crear features en este orden. Cada paso se verifica antes de seguir.

1. **Schema Prisma** — definir modelos, relaciones, enums en `prisma/schema.prisma`
2. **Migración** — `docker compose exec api pnpm prisma migrate dev --name describe_el_cambio`
3. **Cliente** — `docker compose exec api pnpm prisma generate` (regenera `src/generated/prisma/`)
4. **Módulo NestJS** — service primero, controller después, DTOs al final
5. **AppModule** — importar el nuevo módulo en `src/app.module.ts`
6. **Seed** — si la feature necesita datos de prueba, agregar a `prisma/seed.ts`
7. **Tests** — unit (`*.spec.ts` en el módulo) y e2e si aplica

## Docker Commands

```bash
docker compose up -d                              # Levantar todo (DB + cache + search + API + studio)
docker compose up -d postgres valkey meilisearch  # Solo infraestructura (API corre local con pnpm)
docker compose build api                          # Rebuild de la imagen API (sin cache si cambió package.json)
docker compose down                               # Detener todo
docker compose down -v                            # Detener y borrar volúmenes (BD se pierde)

docker compose exec api pnpm prisma generate      # Regenerar cliente Prisma tras cambiar schema
docker compose exec api pnpm prisma migrate dev   # Crear y aplicar migración
docker compose exec api pnpm prisma db seed       # Ejecutar seed
docker compose exec api pnpm prisma studio        # GUI de la BD en http://localhost:5555

docker compose exec api pnpm lint                 # ESLint
docker compose exec api pnpm test                 # Unit tests (Jest)
docker compose exec api pnpm test:e2e             # End-to-end tests
```

## Conventions

**Nombrado:**
- Archivos: `kebab-case` (`auth.service.ts`, `jwt-auth.guard.ts`)
- Clases: `PascalCase` (`AuthService`, `JwtAuthGuard`)
- Rutas HTTP: `snake-case` (`/users/profile`, `/auth/refresh`)

**Controllers:**
- Solo reciben request y retornan response. Toda la lógica va en Services.
- Endpoints protegidos: `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`
- El módulo que use `JwtAuthGuard` debe importar `AuthModule`

**DTOs:**
- Siempre con `class-validator` (validación) + `@ApiProperty` (Swagger)
- Swagger auto-detecta tipos de retorno por el plugin en `nest-cli.json`
- Basta con declarar el return type del controller: `getProfile(): Promise<UserResponseDto>`

**PrismaService:**
- Es global (`@Global()` en PrismaModule). Se inyecta directamente en cualquier service.
- No se necesita `imports: [PrismaModule]` en otros módulos.
- Queries solo en Services, nunca en Controllers.
- Usar `select` explícito para evitar leaks de campos.

**Errores:**
- Usar excepciones nativas de NestJS: `NotFoundException`, `BadRequestException`, `UnauthorizedException`, `ForbiddenException`

**Estilo:**
- Simplicidad ante todo. Nada de overengineering.
- Código que se entienda sin comentarios. Si necesita comentario, probablemente se puede simplificar.
- Prettier: `singleQuote: true`, `trailingComma: 'all'`

## Auth Flow

```
POST /auth/register (email, password, username?) → { accessToken, refreshToken, user }
POST /auth/login    (email, password)            → { accessToken, refreshToken, user }
POST /auth/refresh  (refreshToken en body)       → { accessToken, refreshToken, user }
POST /auth/logout   (Bearer + refreshToken?)     → { success: true }
```

Flujo:
1. Register/Login retorna ambos tokens + datos del usuario
2. Cliente guarda tokens y envía `Authorization: Bearer <accessToken>` en cada request
3. `JwtAuthGuard` decodifica el token → `req.user = { userId, authId }`
4. Access token expira → refrescar con `POST /auth/refresh`
5. Logout invalida el refresh token

## Pitfalls

- **DATABASE_URL**: docker compose la sobreescribe a `postgresql://...@postgres:5432/...`. Si corres la API local, usa la de `.env` (`localhost:5433`)
- **bcrypt**: necesita compilar binarios nativos. Si falla el build, verificar que `pnpm-workspace.yaml` tenga `bcrypt: true` en `allowBuilds`
- **Prisma client**: cada vez que cambia `schema.prisma`, hay que correr `prisma generate` dentro del contenedor
- **Migraciones**: usar `prisma migrate dev`, no editar archivos en `prisma/migrations/` a mano
- **`src/generated/prisma/`**: autogenerado, no editar nunca
- **Puerto 5433 vs 5432**: Docker mapea `5433:5432`. La API dentro del container se conecta a `postgres:5432`; desde el host es `localhost:5433`
- **Prisma Studio** corre en container separado en puerto `5555`, conectado a la misma DB

# NestJS Guide — GameConnect API

## Estructura

```
src/modules/{module}/
├── dto/             ← DTOs de request/response (con class-validator + @ApiProperty)
├── {module}.module.ts  ← @Module({ imports, providers, controllers, exports })
├── {module}.controller.ts  ← @Controller() rutas HTTP
├── {module}.service.ts     ← @Injectable() lógica de negocio
└── *.guard.ts | *.strategy.ts  ← Auth/security
```

**Reglas:**
- Controllers solo reciben/responden. Lógica en Services.
- DTOs siempre con `class-validator` + `@ApiProperty` para Swagger.
- PrismaService es global — no necesitas importar PrismaModule.

## JWT Flow

```
POST /register (email, password, username?) → { accessToken, refreshToken, user }
POST /login    (email, password)            → { accessToken, refreshToken, user }
POST /refresh  (refreshToken)               → { accessToken, refreshToken, user }
POST /logout   (Bearer + refreshToken?)     → { success: true }
```

**Flujo:**
1. Register/Login → tokens + user
2. Client guarda tokens
3. Cada request protegido lleva `Authorization: Bearer <accessToken>`
4. `JwtAuthGuard` verifica token → `req.user = { userId, authId }`
5. Access token expira → refresh con el refresh token

## Proteger un endpoint

```typescript
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Get('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async getProfile(@Req() req: any) {
  return this.users.findById(req.user.userId);
}
```

**Requisitos:**
1. Tu modulo debe importar `AuthModule` para acceder a `JwtAuthGuard`.
2. El controller debe inyectar el AuthGuard en cada endpoint protegido.

## DTOs de Respuesta para Swagger

El plugin `@nestjs/swagger` en `nest-cli.json` auto-detecta tipos de retorno:

```typescript
export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true }) username: string | null;
  @ApiProperty() role: string;
  // ...
}
```

El controller con return type explicito basta:
```typescript
@Get('profile')
getProfile(): Promise<UserResponseDto> { ... }
```

No necesitas `@ApiResponse()` manual — el plugin lo genera.

## Prisma

- `PrismaService` es global y se inyecta directamente.
- Queries solo en Services, nunca en Controllers.
- Select fields explicitos en queries para evitar leaks.

## Errores

Usar excepciones nativas de NestJS:

```typescript
throw new UnauthorizedException();       // 401
throw new NotFoundException('User');     // 404
throw new BadRequestException('msg');    // 400
throw new ForbiddenException();          // 403
```

## Convenciones

- Misma nomenclatura que `gameconnect-mobile/docs/CONVENTIONS.md`.
- Archivos: `kebab-case` (ej. `auth.service.ts`, `jwt-auth.guard.ts`).
- Clases: `PascalCase` (ej. `AuthService`, `JwtAuthGuard`).
- Rutas: `snake-case` (ej. `/users/profile`, `/auth/logout`).

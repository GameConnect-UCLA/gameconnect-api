# ─── Stage 1: Dependencies ──────────────────────────────────────────
# Instala TODAS las dependencias (dev + prod). Cachea esta capa
# para que cambios en src/ no re-trigger pnpm install.
FROM node:22-alpine AS deps

# corepack está incluido en Node 22+. Lo habilitamos y preparamos pnpm.
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copia solo los archivos de lock/manifest — maximiza cache de Docker
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# --frozen-lockfile: falla si el lockfile no está sincronizado (reproducible)
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Desarrollo ────────────────────────────────────────────
# Imagen para development con hot reload. src/ y prisma/ se montan
# como volumes en docker-compose para cambios en tiempo real.
FROM node:22-alpine AS dev

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Hereda node_modules + archivos de manifiesto del stage deps
# (pnpm-workspace.yaml contiene allowBuilds, necesario para prisma generate)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copia schema de Prisma y genera el cliente tipado
# (si cambias schema.prisma, re-ejecuta: docker compose exec api pnpm prisma generate)
COPY prisma ./prisma
RUN pnpm prisma generate

# Copia archivos de configuración necesarios para nest build/start + prisma CLI
COPY tsconfig.json tsconfig.build.json nest-cli.json prisma.config.ts ./

# Copia src — será sobreescrito por el volume en compose, sirve como fallback
COPY src ./src

EXPOSE 3000

CMD ["pnpm", "start:dev"]

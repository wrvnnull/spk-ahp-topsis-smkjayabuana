# =============================================================================
# Backend Dockerfile - SPK AHP-TOPSIS (NestJS)
# =============================================================================
# Multi-stage build:
#   stage 1 (build): install all deps + build NestJS production bundle
#   stage 2 (production): minimal runtime image dengan hanya production artifacts
#
# Image ini TIDAK memuat:
#   - .env, credential, thesis, logo resmi, Excel, atau data siswa asli
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (termasuk devDependencies untuk build)
COPY backend/package.json backend/package-lock.json* ./backend/
COPY backend/prisma ./backend/prisma/

RUN cd backend && \
    npm ci && \
    npm run prisma:generate

# Copy source code (hanya backend/*, tidak termasuk .env atau data sensitif)
COPY backend/src ./backend/src
COPY backend/tsconfig.* ./backend/
COPY backend/nest-cli.json ./backend/

# Build production bundle
RUN cd backend && npm run build

# Compile seed.ts ke JS untuk production (tanpa ts-node)
RUN cd backend && npx tsc prisma/seed.ts \
    --outDir prisma/ \
    --module commonjs \
    --target es2021 \
    --esModuleInterop \
    --skipLibCheck \
    --resolveJsonModule \
    --rootDir prisma

# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Install hanya production dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --only=production

# Copy Prisma schema dan generated client untuk produksi
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/node_modules/.prisma ./backend/node_modules/.prisma
COPY --from=build /app/backend/node_modules/prisma ./backend/node_modules/prisma
COPY --from=build /app/backend/node_modules/.bin/prisma ./backend/node_modules/.bin/prisma

# Copy build output dan file pendukung
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/tsconfig.* ./backend/
COPY --from=build /app/backend/nest-cli.json ./backend/

# Copy entrypoint script
COPY backend/docker-entrypoint.sh ./backend/docker-entrypoint.sh
RUN chmod +x ./backend/docker-entrypoint.sh

# Expose port
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Entry point
WORKDIR /app/backend
CMD ["node", "dist/main"]

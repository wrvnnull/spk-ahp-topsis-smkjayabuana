# =============================================================================
# Frontend Dockerfile - SPK AHP-TOPSIS (Next.js)
# =============================================================================
# Multi-stage build:
#   stage 1 (build): install dependencies + build Next.js production bundle
#   stage 2 (production): minimal runtime image dengan next start
#
# Image ini TIDAK memuat:
#   - .env.local, credential, thesis, logo resmi, atau data sensitif
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm ci

# Copy source code (hanya frontend/*, tidak termasuk .env.local atau data sensitif)
COPY frontend/ ./frontend/

# Build production bundle
RUN cd frontend && npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Copy build output
COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/frontend/public ./frontend/public
COPY --from=build /app/frontend/package.json ./frontend/package.json
COPY --from=build /app/frontend/package-lock.json* ./frontend/

# Install hanya production dependencies
WORKDIR /app/frontend
RUN npm ci --only=production

# Expose port
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Entry point
CMD ["npx", "next", "start", "-p", "3001"]

# syntax=docker/dockerfile:1.7
# Next.js production image — standalone build (configured di next.config.ts).
# Build arg NEXT_PUBLIC_API_URL WAJIB di-set saat build (di-inlined ke JS bundle).

ARG NODE_VERSION=22-alpine

# ─── Stage 1: Install deps ───────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps

WORKDIR /app

# Install deps dengan npm ci (deterministic dari package-lock.json)
# --legacy-peer-deps: safeguard untuk React 19 / Next.js 16 yang mungkin ada peer dep conflict
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# NEXT_PUBLIC_API_URL di-inlined saat build time
ARG NEXT_PUBLIC_API_URL
# Round 27: WebSocket VPS relay. PRIMARY_WS pakai URL ini, FALLBACK_WS ke API_BASE.
# Set ke kosong jika tidak ada VPS relay (PRIMARY_WS akan fallback ke API_BASE).
ARG NEXT_PUBLIC_WS_RELAY_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_WS_RELAY_URL=${NEXT_PUBLIC_WS_RELAY_URL} \
    NEXT_DISABLE_TURBOPACK=1 \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build (output: standalone — lihat next.config.ts)
RUN npm run build

# ─── Stage 3: Runtime ────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

# ponytail: curl needed for Docker healthcheck; install in the runner layer so the
# probe works without affecting the build layer or build cache.
RUN apk add --no-cache curl

# Copy standalone output (sudah include minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static + public assets harus di-copy terpisah di Next.js standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Standalone build generate server.js
CMD ["node", "server.js"]

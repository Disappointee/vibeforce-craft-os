# =============================================================================
# Vibeforce Flow OS — Frontend Production Multi-Stage Dockerfile
# =============================================================================

# ── Stage 1: Dependencies ──
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Builder ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables
ARG NEXT_PUBLIC_POCKETBASE_URL
ARG NEXT_PUBLIC_DEFAULT_HOURLY_RATE=150
ARG NEXT_PUBLIC_APP_MODE=agency
ENV NEXT_PUBLIC_POCKETBASE_URL=${NEXT_PUBLIC_POCKETBASE_URL}
ENV NEXT_PUBLIC_DEFAULT_HOURLY_RATE=${NEXT_PUBLIC_DEFAULT_HOURLY_RATE}
ENV NEXT_PUBLIC_APP_MODE=${NEXT_PUBLIC_APP_MODE}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ── Stage 3: Production Runner ──
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget ca-certificates

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build & static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]

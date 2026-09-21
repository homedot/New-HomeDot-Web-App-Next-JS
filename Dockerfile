FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
# The npm download cache is kept between builds (BuildKit cache mount), so
# unchanged packages aren't re-fetched even when package-lock.json changes.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund

FROM base AS builder
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CHAT_SOCKET_ENDPOINT
ARG NEXT_PUBLIC_BASE_PATH
ARG NEXT_PUBLIC_API_STAGING_BASE_URL
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CHAT_SOCKET_ENDPOINT=$NEXT_PUBLIC_CHAT_SOCKET_ENDPOINT
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_API_STAGING_BASE_URL=$NEXT_PUBLIC_API_STAGING_BASE_URL
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Persist Turbopack's filesystem cache (and the downloaded Google fonts) across
# builds. Without this every Docker build starts cold (~2.3x slower). The cache
# lives outside the image, so it doesn't bloat the runner stage.
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

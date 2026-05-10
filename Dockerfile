# Production-style image (Phase 11 / PRD §24.3). Build context = repo root.
# Requires build-time env for Next/Payload (pass via --build-arg or Compose `build.args`).
#
#   docker build -t blank-saas \
#     --build-arg DATABASE_URL=postgres://... \
#     --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
#     .
#
# Runtime: set DATABASE_URL, PAYLOAD_SECRET, BETTER_AUTH_SECRET, etc., then:
#   docker run --rm -p 3000:3000 --env-file .env.production blank-saas

FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/blank_saas
ENV DATABASE_URL=${DATABASE_URL}

# Client / prerender (inlined at build time by Next.js)
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
ARG NEXT_PUBLIC_POSTHOG_KEY=
ENV NEXT_PUBLIC_POSTHOG_KEY=${NEXT_PUBLIC_POSTHOG_KEY}
ARG NEXT_PUBLIC_POSTHOG_HOST=
ENV NEXT_PUBLIC_POSTHOG_HOST=${NEXT_PUBLIC_POSTHOG_HOST}
ARG NEXT_PUBLIC_FEATURE_GRANULAR_PERMISSIONS=
ENV NEXT_PUBLIC_FEATURE_GRANULAR_PERMISSIONS=${NEXT_PUBLIC_FEATURE_GRANULAR_PERMISSIONS}
ARG SITE_URL=
ENV SITE_URL=${SITE_URL}

RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /home/nextjs \
  && chown nextjs:nodejs /home/nextjs
ENV HOME=/home/nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Payload CLI (`payload migrate`) resolves `./src/payload.config.ts` via tsconfig paths — needs sources + tsconfig.json.
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
RUN printf '%s\n' \
  '/// <reference types="next" />' \
  '/// <reference types="next/image-types/global" />' \
  '' \
  '// Minimal stub: docker runner image when repo root next-env.d.ts is absent.' \
  > next-env.d.ts \
  && chown nextjs:nodejs next-env.d.ts

USER nextjs
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]

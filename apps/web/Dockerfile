FROM rust:1.94 AS rust-builder

RUN cargo install wasm-pack --locked

WORKDIR /app

COPY packages/parser .

RUN wasm-pack build --target web --out-dir ./pkg

FROM oven/bun:1 AS builder

WORKDIR /app

COPY . .
COPY --from=rust-builder /app ./packages/parser

ENV NODE_ENV=production
ENV NEXT_PRIVATE_STANDALONE true
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN bun install --frozen-lockfile

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL:-postgresql://user:password@localhost:5432/app_db}

RUN cd apps/api && bun install
RUN cd packages/db && bun run generate

WORKDIR apps/web

RUN bun run build

FROM oven/bun:1 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN mkdir .next
RUN chown bun:bun .next

COPY --from=builder --chown=bun:bun /app/apps/web/.next/standalone ./next/standalone
COPY --from=builder --chown=bun:bun /app/apps/web/.next/static ./next/standalone/apps/web/.next/static
COPY --from=builder --chown=bun:bun /app/apps/web/public ./next/standalone/apps/web/public

USER bun

EXPOSE 3000

CMD node next/standalone/apps/web/server.js
FROM rust:1.94 AS rust-builder

RUN cargo install wasm-pack --locked

WORKDIR /app

COPY packages/parser .

RUN wasm-pack build --target web --out-dir ./pkg

FROM oven/bun:1 AS bun-builder

RUN apt update && apt upgrade -y && apt install curl -y

WORKDIR /app

ENV TURBO_TELEMETRY_DISABLED=1

COPY --from=rust-builder /app ./packages/parser

COPY apps/api ./apps/api
COPY packages/db ./packages/db
COPY package.json .
COPY turbo.json .
COPY bun.lock .

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL:-postgresql://user:password@localhost:5432/app_db}

RUN cd apps/api && bun install
RUN cd packages/db && bun run generate

EXPOSE 3001

CMD bun run migrate && bun apps/api/src/index.ts
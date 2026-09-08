# Project Transfer / Handover Document

**Project:** LLM Trace Coding
**Repository:** llm-trace-coding
**Version:** 1.0.0

---

## 1. Executive Summary

### Purpose

LLM Trace Coding is a platform for ingesting, analyzing, and visualizing traces from Large Language Model (LLM) execution pipelines. It enables developers to upload code files, process them through a Rust-based parser, generate execution traces, and annotate those traces with axial codes for qualitative analysis. The platform supports feedback tracking, trace relationships, and project-level organization.

### High-Level Architecture

The project is a Turborepo monorepo containing two applications and four shared packages:

```mermaid
graph TB
    subgraph Applications
        Web[Web App - Next.js]
        API[API Server - Elysia/Bun]
    end
    subgraph SharedPackages
        DB[DB Package - Prisma]
        Parser[Parser - Rust/WASM]
        GenRoute[Route Type Generator]
    end
    subgraph ConfigPackages
        ESLint[ESLint Config]
        TSConfig[TypeScript Config]
    end
    Web -- "Eden client" --> API
    API -- "@repo/db" --> DB
    API -- "@repo/parser" --> Parser
    Web -- "devDep" --> ESLint
    Web -- "devDep" --> TSConfig
    API -- "devDep" --> ESLint
    API -- "devDep" --> TSConfig
```

### Main Technologies

| Layer                   | Technology                                              |
| ----------------------- | ------------------------------------------------------- |
| Package Manager         | Bun (bun@1.3.9)                                         |
| Monorepo Tool           | Turborepo v2                                            |
| Web Frontend            | Next.js 16 / React 19                                   |
| API Server              | Elysia with Bun runtime                                 |
| Database ORM            | Prisma ORM v7                                           |
| Database                | PostgreSQL 15                                           |
| UI Components           | shadcn/ui (New York style) + Tailwind CSS v4            |
| Parser                  | Rust compiled to WebAssembly via wasm-pack              |
| E2E Testing             | Playwright with playwright-bdd                          |
| CI/CD                   | GitLab CI (lint, test, convert, SAST, Secret-Detection) |
| Container Orchestration | Docker Compose                                          |

### Current Status

The project is in active development. Both the web application and API server are functional. The Rust parser package builds successfully and integrates with both applications. CI/CD pipelines are configured for linting, testing, converting BDD features, and SAST/Secret-Detection scanning across all packages.

---

## 2. Repository Structure

```
llm-trace-coding
├── apps/
│   ├── api/                      # API server (Elysia + Bun)
│   │   ├── src/index.ts          # Entry point
│   │   ├── src/lib/              # API library utilities
│   │   ├── src/modules/          # API route modules
│   │   ├── test/                 # Unit tests
│   │   ├── Dockerfile            # Production container image
│   │   ├── bunfig.toml           # Bun configuration (test settings)
│   │   ├── bun.lock              # Bun lockfile for API
│   │   ├── eslint.config.mjs     # ESLint configuration
│   │   ├── tsconfig.json         # TypeScript configuration
│   │   └── package.json
│   │
│   └── web/                      # Web application (Next.js)
│       ├── app/                  # Next.js App Router pages
│       ├── components/           # React components (shadcn/ui + custom)
│       ├── hooks/                # Custom React hooks
│       ├── lib/                  # Utility functions
│       ├── state/                # Zustand store
│       ├── e2e/                  # Playwright E2E tests
│       ├── public/               # Static assets
│       ├── api-types.ts          # Generated API types (Eden)
│       ├── next.config.ts        # Next.js configuration
│       ├── next-env.d.ts         # Next.js type definitions
│       ├── components.json       # shadcn/ui configuration
│       ├── eslint.config.mjs     # ESLint configuration
│       ├── postcss.config.mjs    # PostCSS configuration
│       ├── playwright.config.ts  # Playwright configuration
│       ├── tsconfig.json         # TypeScript configuration
│       ├── Dockerfile            # Production container image
│       ├── README.md             # Web app documentation
│       └── package.json
│
├── packages/
│   ├── db/                       # Database package (Prisma ORM)
│   │   ├── src/index.ts          # Re-exported Prisma client
│   │   ├── prisma/schema/        # Prisma schema files (multi-file)
│   │   ├── generated/prisma/     # Generated Prisma client output
│   │   ├── prisma.config.ts      # Prisma configuration
│   │   └── package.json
│   │
│   ├── parser/                   # Rust parser (WASM target)
│   │   ├── src/                  # Rust source code
│   │   ├── pkg/                  # Generated WASM bindings (JS + WASM)
│   │   ├── Cargo.toml            # Rust package manifest (WASM library)
│   │   ├── Cargo.lock            # Rust dependency lockfile
│   │   ├── README.md             # Parser documentation
│   │   └── package.json          # npm wrapper for wasm-pack (scripts: build, lint, format, test, clean)
│   │
│   ├── eslint-config/            # Shared ESLint configurations
│   │   ├── README.md             # ESLint config documentation
│   │   ├── base.js               # Base ESLint rules
│   │   ├── next.js               # Next.js-specific rules
│   │   └── react-internal.js     # React monorepo rules
│   │
│   ├── generate-route-types/     # API route type generator
│   │   ├── generate-types.ts     # Generates TypeScript types from API
│   │   ├── cleanup-openapi.ts    # Cleans OpenAPI artifacts
│   │   ├── tsconfig.json         # TypeScript configuration
│   │   └── package.json
│   │
│   └── typescript-config/        # Shared TypeScript configurations
│       ├── base.json             # Base TS config
│       ├── nextjs.json           # Next.js-specific TS config
│       ├── react-library.json    # React library TS config
│       └── package.json
│
├── .dockerignore                 # Docker ignore rules
├── .env.example                  # Environment variable template
├── .env                          # Local environment (gitignored)
├── .gitignore                    # Git ignore rules
├── .gitlab-ci.yml                # CI/CD pipeline
├── .npmrc                        # npm/bun registry config (empty)
├── .prettierrc                   # Prettier configuration
├── .turbo/                       # Turborepo cache
├── .vscode/                      # VS Code workspace settings (empty)
├── README.md                     # Project README
├── bun.lock                      # Bun lockfile
├── docker-compose.yml            # Local Docker services
├── package.json                  # Root workspace configuration
├── turbo.json                    # Turborepo task configuration
└── tsconfig.json                 # (not present at root)
```

### Package Descriptions

| Package                         | Name                         | Purpose                                                                                                                                                                                                                    |
| ------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`                      | `@repo/web`                  | Next.js frontend application. Serves the UI, handles routing, state management with Zustand, and communicates with the API via Elysia Eden.                                                                                |
| `apps/api`                      | `@repo/api`                  | Elysia-based API server running on Bun. Provides REST endpoints, integrates with the Rust parser, manages database operations through Prisma, and supports OpenAI/compatible LLM calls.                                    |
| `packages/db`                   | `@repo/db`                   | Prisma ORM package. Contains database schema definitions, the generated Prisma client, and migration utilities. Shared by both `@repo/web` and `@repo/api`.                                                                |
| `packages/parser`               | `@repo/parser`               | Rust library compiled to WebAssembly. Parses code files and generates trace data. Built independently and consumed as a JavaScript module by both applications. Dependencies: csv, regex, serde, serde_json, wasm-bindgen. |
| `packages/eslint-config`        | `@repo/eslint-config`        | Shared ESLint configuration presets for the monorepo.                                                                                                                                                                      |
| `packages/typescript-config`    | `@repo/typescript-config`    | Shared TypeScript compiler options for the monorepo.                                                                                                                                                                       |
| `packages/generate-route-types` | `@repo/generate-route-types` | Utility that generates TypeScript types from the Elysia API's OpenAPI specification.                                                                                                                                       |

---

## 3. Local Development Setup

### Prerequisites

| Requirement | Minimum Version   | Notes                            |
| ----------- | ----------------- | -------------------------------- |
| OS          | macOS 14+ / Linux | Windows requires WSL2            |
| Bun         | 1.3.9+            | https://bun.sh/docs/installation |
| Node.js     | 20.x+             | For Turborepo tooling            |
| Rust        | 1.75+             | For building the parser package  |
| Docker      | 24.0+             | For local PostgreSQL             |
| Git         | 2.40+             | For version control              |

### One-Time Setup

```bash
# 1. Install all workspace dependencies
bun i

# 2. Configure environment variables
cp .env.example .env
# Edit .env and set your values (see Section 5 for details)

# 3. Copy env into packages/db
cp .env ./packages/db/.env

# 4. Initialize the database
cd packages/db
bunx prisma generate
bunx prisma migrate dev
cd ../..

# 5. Build the Rust parser
cd packages/parser
bun run build
cd ../..
```

### Starting Development Servers

```bash
# Start all services in one command (recommended)
bun dev

# This runs both the API server and web app concurrently
```

The above command starts:

- **API server** at `http://localhost:3001`
- **Web application** at `http://localhost:3000`

### Docker for Database

```bash
docker compose start db
```

### Development Workflow

1. Ensure `.env` is configured with database credentials matching your Docker setup.
2. Run `bun dev` to start both applications.
3. Make changes — the web app uses Next.js hot reload; the API server uses Elysia's built-in dev mode.
4. For database schema changes:
   - Edit the schema in `packages/db/prisma/schema/`
   - Run `cd packages/db && bunx prisma migrate dev --name <description>`
   - Commit the new migration file
5. For parser changes:
   - Edit Rust source in `packages/parser/src/`
   - Run `cd packages/parser && bun run build`
   - The generated WASM bindings are in `packages/parser/pkg/`
6. Run tests:
   - Unit tests: `bun run test` (from workspace root)
   - E2E tests: `bun run test:e2e`

---

## 4. Build & Deployment

### Docker Deployment

#### Docker Compose (Local/Dev)

The `docker-compose.yml` file defines:

- **PostgreSQL 15** (`db`) — Database service on port 5432
- **Web App** (`llmtc-frontend`) — Next.js app on port 3000
- **API Server** (`llmtc-backend`) — Elysia API on port 3001

```bash
docker compose up -d
```

#### Production Container Images

Both `apps/web/Dockerfile` and `apps/api/Dockerfile` follow a multi-stage build pattern:

**Web App (`apps/web/Dockerfile`):**

1. **Builder stage** (based on `oven/bun:1-alpine`):
   - Installs dependencies, generates Prisma client, builds the Rust parser, runs Turborepo build
2. **Runner stage** (based on `oven/bun:1-alpine`):
   - Copies built artifacts, exposes port 3000
3. Uses non-root user `appuser` for security

**API Server (`apps/api/Dockerfile`):**

1. **Builder stage** (based on `oven/bun:1-alpine`):
   - Installs dependencies, generates Prisma client, builds the API
2. **Runner stage** (based on `oven/bun:1-alpine`):
   - Copies built artifacts, exposes port 3001
3. Uses non-root user `appuser` for security

### CI/CD Pipeline (GitLab)

The `.gitlab-ci.yml` defines the following pipeline stages:

| Stage  | Jobs                                                     | Purpose                                     |
| ------ | -------------------------------------------------------- | ------------------------------------------- |
| `lint` | `lint-api`, `lint-web`, `lint-eslint`, `lint-typescript` | ESLint checks across all packages           |
| `test` | `test-api`, `test-web`, `test-generate-route-types`      | Unit tests across packages                  |
| `sast` | `sast`                                                   | GitLab SAST security scanning               |
| `e2e`  | `e2e`                                                    | Playwright E2E tests (runs on every commit) |

### Deployment Checklist

- [ ] Environment variables configured in deployment target
- [ ] Database migrations applied (`bunx prisma migrate deploy`)
- [ ] Prisma client regenerated (`bunx prisma generate`)
- [ ] Rust parser built (`bun run build` in `packages/parser`)
- [ ] All builds pass (`bun run build`)
- [ ] E2E tests pass (`bun run test:e2e`)
- [ ] Docker images built (`docker compose build`)

---

## 5. Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable              | Required    | Description                                                                                             |
| --------------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_URL`     | No          | Public URL of the web application. Default: `http://localhost:3000`                                     |
| `NEXT_PUBLIC_API_URL` | No          | Public URL of the API server. Default: `http://localhost:3001`                                          |
| `DATABASE_URL`        | Yes         | PostgreSQL connection string. Use `postgresql://user:pass@localhost:5432/dbname` for local development. |
| `OPENAI_API_KEY`      | Conditional | Required if using OpenAI for AI features. Can be any OpenAI-compatible API key.                         |
| `OPENAI_URL`          | Conditional | Base URL for OpenAI-compatible API.                                                                     |
| `OPENAI_MODEL`        | Conditional | Model name to use with OpenAI-compatible API.                                                           |

### Database Configuration

The database uses Prisma ORM v7 with a **multi-file schema** located in `packages/db/prisma/schema/`. This means the schema is split across multiple `.prisma` files that are imported via the main `schema.prisma` file.

Key Prisma config is in `packages/db/prisma.config.ts`:

- Schema directory: `prisma/schema/`
- Output directory: `../generated/prisma/`
- Schema file: `schema.prisma`
- TS client: enabled
- Accent support: enabled

### shadcn/ui Configuration

Configured via `apps/web/components.json`:

- Style: **New York**
- Base color: **zinc**
- Icon library: **lucide-react**
- Aliases: `@` maps to `apps/web`

### Turborepo Configuration

Defined in `turbo.json`:

- **Global env**: `NEXT_PUBLIC_URL`, `NEXT_PUBLIC_API_URL`, `DATABASE_URL`, `OPENAI_MODEL`, `OPENAI_URL`, `OPENAI_API_KEY`
- **Global deps**: `.env`
- **Tasks**:
  - `build`: depends on `^build` (upstream), outputs `.next/**`, `target/release/**`, `pkg/**`, caches output
  - `generate`: generates types
  - `migrate`: runs database migrations
  - `lint`: linting
  - `check-types`: type checking
  - `test`: no deps, no cache
  - `test:e2e`: no deps, no cache
  - `dev`: no deps, no cache, persistent (runs forever)

### ESLint Configuration

Defined in `packages/eslint-config/`:

- **Base rules** (`base.js`): TypeScript support, React hooks, import sorting, security, unused imports
- **Next.js rules** (`next.js`): Extends base + Next.js-specific rules
- **React internal rules** (`react-internal.js`): Prevents importing components from other workspace packages without explicit `@/` prefix

---

## 6. Database Management

### Prisma Commands

All Prisma commands must be executed from the `packages/db` directory:

```bash
cd packages/db
```

| Command                                        | Description                                    |
| ---------------------------------------------- | ---------------------------------------------- |
| `bunx prisma generate`                         | Generate the Prisma client                     |
| `bunx prisma db pull`                          | Pull schema changes from the database          |
| `bunx prisma migrate dev --name <description>` | Create and apply a new migration (development) |
| `bunx prisma migrate deploy`                   | Apply pending migrations (production)          |
| `bunx prisma migrate reset`                    | Reset the database to initial state            |
| `bunx prisma studio`                           | Open Prisma Studio GUI for database management |
| `bunx prisma format`                           | Format schema files                            |

### Database Schema Overview

The schema is defined across multiple files in `packages/db/prisma/schema/`. The main `schema.prisma` contains only the generator and datasource configuration; all models are defined in separate files.

```mermaid
erDiagram
    Project ||--o{ TraceList : "has"
    TraceList ||--o{ Trace : "contains"
    TraceList ||--o{ AxialCode : "categorized-by"
    TraceList ||--o{ File : "includes"
    Trace }o--|| Trace : "parent"
    Trace ||--o{ TraceConnection : "linked-via"
    Trace ||--o{ TraceConnection : "target-of"
    AxialCode ||--o{ TraceConnection : "reason-for"
    AxialCode ||--o{ Trace : "assigned-to"
    File ||--o{ Trace : "produced"

    Project {
        String id PK
        String name
        String description
        DateTime createdAt
        String assessmentCriteria
    }

    TraceList {
        String id PK
        String name
        DateTime createdAt
        DateTime completedAt
        String projectId FK
    }

    Trace {
        String id PK
        String name
        String system
        String input
        String output
        String openCode
        String context
        Feedback feedback
        Boolean isFlagged
        String parentId
        String traceListId FK
        String fileId FK
        String axialCodeId FK
    }

    AxialCode {
        String id PK
        String title
        String description
        String reason
        String traceListId FK
    }

    TraceConnection {
        String id PK
        String axialCodeId FK
        String traceId FK
        String reason
    }

    File {
        String id PK
        String name
        Int size
        String traceListId FK
    }

    Job {
        String id PK
        JobStatus status
        String error
        Json metadata
        DateTime createdAt
        DateTime updatedAt
    }
```

### Enums

| Enum        | Values                              | Used By |
| ----------- | ----------------------------------- | ------- |
| `JobStatus` | `PROCESSING`, `COMPLETED`, `FAILED` | `Job`   |
| `Feedback`  | `positive`, `negative`              | `Trace` |

### Schema Files

| File                 | Models                                              |
| -------------------- | --------------------------------------------------- |
| `schema.prisma`      | Generator & datasource configuration only           |
| `job.prisma`         | `Job`, `JobStatus`                                  |
| `trace.prisma`       | `Trace`, `TraceList`, `TraceConnection`, `Feedback` |
| `axial-codes.prisma` | `AxialCode`                                         |
| `project.prisma`     | `Project`                                           |
| `file.prisma`        | `File`                                              |

### Key Relationships

- **Project** has many **TraceLists** (cascade delete)
- **TraceList** has many **Traces**, **AxialCodes**, and **Files** (cascade delete)
- **Trace** has a self-referencing **parent** relation (cascade delete on child)
- **Trace** belongs to one **File** and one **TraceList** (cascade delete)
- **Trace** optionally belongs to one **AxialCode**
- **TraceConnection** links a **Trace** to an **AxialCode** with a reason (cascade delete on axialCode)
- **File** belongs to one **TraceList** (cascade delete)
- **AxialCode** optionally belongs to one **TraceList** (cascade delete)

### Migrations

Migrations are stored in `packages/db/prisma/migrations/`. Each migration contains:

- `migration.sql` — The SQL to apply
- `migration_lock.toml` — Lock file for migration tracking

To create a new migration after schema changes:

```bash
cd packages/db
bunx prisma migrate dev --name add_new_field
```

This generates a new migration file and applies it to the database.

---

## 7. API & Parser Packages

### API Server (`apps/api`)

The API server is built with **Elysia** running on the **Bun** runtime. It provides the backend for the web application.

**Entry point:** `apps/api/src/index.ts`

**Dependencies:** `@elysiajs/cors`, `@elysiajs/swagger`, `@langchain/openai`, `@repo/db`, `@repo/parser`, `@sinclair/typebox`, `elysia`, `zod`

**Key capabilities:**

- REST API endpoints (details in codebase)
- Integration with the Rust parser for code trace generation
- Database operations through `@repo/db` (Prisma client)
- OpenAI/compatible LLM integration via LangChain
- OpenAPI documentation generation via Elysia Swagger
- Eden client types for type-safe frontend communication

**Running tests:**

```bash
cd apps/api
bun test
```

### Rust Parser (`packages/parser`)

The parser is a **Rust** library compiled to **WebAssembly (WASM)** using `wasm-pack`. It analyzes code files and generates trace data.

**Build process:**

```bash
cd packages/parser
bun run build
```

This runs `wasm-pack build --target web`, producing:

- `pkg/parser_bg.wasm` — The compiled WASM binary
- `pkg/parser.js` — JavaScript bindings
- `pkg/parser.d.ts` — TypeScript type definitions
- `pkg/parser_snippets.js` — Helper utilities

**Dependencies:**

- `wasm-bindgen` — Rust/WASM interop
- `serde`, `serde_json` — JSON serialization
- `csv`, `regex` — Data parsing utilities
- `console_error_panic_hook` — Better error messages in browser

**Important:** The generated files in `packages/parser/pkg/` should be committed to the repository. When making changes to the Rust source, rebuild and commit the updated `pkg/` directory.

### Route Type Generator (`packages/generate-route-types`)

Generates TypeScript types from the Elysia API's OpenAPI specification using Elysia's Eden feature.

```bash
cd packages/generate-route-types
bun run generate-route-types
```

- `generate-route-types` — Runs `cleanup-openapi.ts` then `generate-types.ts`

These types enable type-safe API calls from the web frontend via Eden.

---

## 8. Frontend (`apps/web`)

### Technology Stack

- **Framework:** Next.js 16.1.6 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 with `@theme` configuration
- **UI Library:** shadcn/ui (New York style, zinc color palette)
- **State Management:** Zustand with `persist` middleware (localStorage)
- **API Client:** Elysia Eden for type-safe API communication
- **Data Tables:** TanStack React Table
- **Charts:** Recharts 3.8.0
- **Markdown:** react-markdown
- **Icons:** lucide-react
- **Themes:** next-themes
- **Dates:** date-fns
- **UI Utilities:** class-variance-authority, clsx, tailwind-merge, sonner, tw-animate-css
- **Testing:** Playwright with playwright-bdd for E2E tests

### Project Structure

```
apps/web/
├── app/                    # Next.js App Router
│   ├── [projectId]/        # Dynamic route for project-specific pages
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── state/                  # Zustand stores
├── e2e/                    # Playwright E2E tests
│   ├── tests/              # BDD test files (*.feature, *.steps.ts)
│   └── utils/              # Test utilities
├── public/                 # Static assets
├── next.config.ts          # Next.js configuration
├── components.json         # shadcn/ui configuration
└── package.json
```

### Key Configuration

**`next.config.ts`:**

- Output mode: `standalone` for optimized Docker deployment
- `outputFileTracingRoot` set to monorepo root for proper file tracing

**`components.json` (shadcn/ui):**

- Style: New York
- Base color: zinc
- Icon library: lucide-react
- Component directory: `components/ui`
- RSC: enabled

### Development

```bash
# Start web app only
turbo dev --filter=@repo/web

# Build web app only
turbo build --filter=@repo/web

# Run E2E tests
bun run test:e2e
```

### State Management

The frontend uses Zustand stores in `apps/web/state/`. The store is configured with `persist` middleware to persist state to localStorage.

---

## 9. Testing

### Test Types and Commands

| Type                | Command             | Location                                                | Framework                   |
| ------------------- | ------------------- | ------------------------------------------------------- | --------------------------- |
| Unit Tests (API)    | `bun run test`      | `apps/api/test/`, `packages/generate-route-types/test/` | Bun test                    |
| Unit Tests (Parser) | `cargo nextest run` | `packages/parser/src/`                                  | cargo nextest               |
| E2E Tests           | `bun run test:e2e`  | `apps/web/e2e/`                                         | Playwright + playwright-bdd |

### Unit Tests

Unit tests use Bun's built-in test runner. They are located in the `test/` directory of each package.

```bash
# Run all tests across the monorepo
bun run test

# Run tests for a specific package
turbo test --filter=@repo/api
turbo test --filter=@repo/generate-route-types
```

### E2E Tests

E2E tests use Playwright with a BDD (Behavior-Driven Development) plugin. Tests are written as:

- `.feature` files — Gherkin-style test scenarios (Given/When/Then)
- `.steps.ts` files — Step definition implementations

```bash
# Run all E2E tests
bun run test:e2e

# Run E2E tests in headed mode (see browser)
bun run test:e2e --headed

# Run E2E tests for a specific feature
bun run test:e2e --grep "<feature-name>"
```

### CI Integration

- **Unit tests** run in the `test` stage of the GitLab CI pipeline
- **E2E tests** run in the `e2e` stage on every commit to the main branch
- Test failures block the pipeline and prevent deployment

---

## 10. Troubleshooting

### Common Issues

#### `bun dev` fails with database connection errors

**Cause:** PostgreSQL is not running or `.env` has incorrect credentials.

**Fix:**

```bash
# Ensure Docker services are running
docker compose up -d

# Verify database is accessible
docker compose exec postgres pg_isready

# Check .env DATABASE_URL matches your Docker setup
cat .env | grep DATABASE_URL
```

#### Prisma client is out of sync

**Cause:** Schema changes not reflected in the generated client.

**Fix:**

```bash
cd packages/db
bunx prisma generate
bunx prisma migrate dev
```

#### Parser WASM not found

**Cause:** The Rust parser has not been built or the `pkg/` directory is stale.

**Fix:**

```bash
cd packages/parser
bun run build
# Verify output files exist
ls pkg/
```

#### TypeScript errors in workspace packages

**Cause:** Missing type generation or stale build artifacts.

**Fix:**

```bash
# Clean and rebuild everything
rm -rf .turbo node_modules
bun install
bun run build
```

#### E2E tests fail

**Cause:** API server or database not running during test execution.

**Fix:**

```bash
# Ensure all services are running
bun dev &
# Wait for services to start, then run tests
bun run test:e2e
```

### Useful Diagnostic Commands

```bash
# Check all running services
docker compose ps

# View application logs
docker compose logs -f

# Check Turborepo cache status
turbo doctor

# Verify workspace dependencies
bun install --frozen-lockfile

# Check Prisma schema validity
cd packages/db && bunx prisma validate

# Check Rust parser compilation
cd packages/parser && cargo check
```

---

## 11. Quick Reference — All Commands

### Root-Level Commands

| Command               | Description                               |
| --------------------- | ----------------------------------------- |
| `bun install`         | Install all workspace dependencies        |
| `bun dev`             | Start all development servers (API + Web) |
| `bun run build`       | Build all packages                        |
| `bun run generate`    | Generate route types and Prisma client    |
| `bun run migrate`     | Run database migrations                   |
| `bun run lint`        | Lint all packages                         |
| `bun run format`      | Format all files with Prettier            |
| `bun run check-types` | Type check all packages                   |
| `bun run test`        | Run all unit tests                        |
| `bun run test:e2e`    | Run Playwright E2E tests                  |

### Turborepo Filter Commands

| Command                             | Description               |
| ----------------------------------- | ------------------------- |
| `turbo dev --filter=@repo/web`      | Start only the web app    |
| `turbo dev --filter=@repo/api`      | Start only the API server |
| `turbo build --filter=@repo/web`    | Build only the web app    |
| `turbo build --filter=@repo/api`    | Build only the API server |
| `turbo build --filter=@repo/parser` | Build only the parser     |
| `turbo test --filter=@repo/api`     | Test only the API server  |

### Database Commands (run from `packages/db`)

| Command                                 | Description                   |
| --------------------------------------- | ----------------------------- |
| `bunx prisma generate`                  | Generate Prisma client        |
| `bunx prisma migrate dev --name <desc>` | Create and apply migration    |
| `bunx prisma migrate deploy`            | Apply migrations (production) |
| `bunx prisma db pull`                   | Pull schema from database     |
| `bunx prisma studio`                    | Open Prisma Studio GUI        |
| `bunx prisma format`                    | Format schema files           |

### Parser Commands (run from `packages/parser`)

| Command         | Description                |
| --------------- | -------------------------- |
| `bun run build` | Build WASM with wasm-pack  |
| `cargo check`   | Check Rust code for errors |
| `cargo test`    | Run Rust unit tests        |

### Docker Commands

| Command                                         | Description           |
| ----------------------------------------------- | --------------------- |
| `docker compose up -d`                          | Start all services    |
| `docker compose down`                           | Stop all services     |
| `docker compose logs -f`                        | View logs             |
| `docker compose exec postgres psql -U postgres` | Open PostgreSQL shell |

### Route Type Generator (run from `packages/generate-route-types`)

| Command                        | Description                                             |
| ------------------------------ | ------------------------------------------------------- |
| `bun run generate-route-types` | Generate TypeScript types from API (cleans & generates) |

---

## 12. Onboarding Checklist

Use this checklist when onboarding a new developer:

- [ ] **Prerequisites installed** — Bun, Node.js, Rust, Docker, Git
- [ ] **Repository cloned** — `git clone` and navigate to project root
- [ ] **Dependencies installed** — `bun install` completes successfully
- [ ] **Environment configured** — `.env` file created and filled in
- [ ] **Database initialized** — Prisma generated and migrations applied
- [ ] **Parser built** — `bun run build` in `packages/parser` succeeds
- [ ] **Full build passes** — `bun run build` completes without errors
- [ ] **Development servers start** — `bun dev` starts both apps
- [ ] **Web app accessible** — http://localhost:3000 loads correctly
- [ ] **API server accessible** — http://localhost:3001 responds
- [ ] **Unit tests pass** — `bun run test` succeeds
- [ ] **E2E tests pass** — `bun run test:e2e` succeeds
- [ ] **Code review of first PR** — Submit a small change and open a PR
- [ ] **CI pipeline understood** — Review `.gitlab-ci.yml` and pipeline stages

---

_End of document._

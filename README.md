# LLM-Trace-Coding-Platform

A full-stack web application for **qualitative coding of LLM traces**. It lets researchers import LLM execution traces (OpenTelemetry OTLP/JSONL), perform **open coding** and **axial coding** on them, define **assessment/judge criteria**, and generate AI-assisted analysis — keeping a human in the loop at every step.

This document is the primary onboarding reference for developers joining the project. It is derived directly from the source code, configuration, and the Architecture Decision Records under [`docs/ADR/`](docs/ADR).

---

## 1. Project Overview

### Purpose

The platform supports a qualitative-research workflow over LLM traces:

1. **Import traces** — upload OTLP/JSONL trace files into a project version.
2. **Open coding** — annotate individual traces / trace groups with codes.
3. **Axial coding** — group open codes into higher-level categories (AI-assisted, non-iterative generation).
4. **Assessment & Judge templates** — define evaluation criteria and generate LLM-judge templates from coded data.
5. **Statistics / Overview** — view aggregate analytics per project version.

A local LLM (via **Ollama**) powers the AI-assisted generation steps. The design is explicitly **human-in-the-loop** ([ADR-017](docs/ADR/ADR-017-human-in-the-loop-design-principle.md)) and **local-first** ([ADR-022](docs/ADR/ADR-022-local-first-deployment.md)).

### High-level architecture

```
┌────────────────────┐      HTTPS/REST       ┌──────────────────────────┐
│   Frontend (SPA)   │ ───────────────────▶  │  Backend API (.NET 10)   │
│  React 19 + Vite   │   VITE_API_URL        │  Modular monolith / CQRS │
│  Radix UI + RQuery │ ◀───────────────────  │  Minimal APIs + Mediator │
└────────────────────┘      JSON             └────────────┬─────────────┘
                                                          │ EF Core (Npgsql)
                                            ┌─────────────┴─────────────┐
                                            │      PostgreSQL 18         │
                                            │ (one DbContext per module  │
                                            │  — see ADR-004)            │
                                            └────────────────────────────┘
                                            ▲
              ┌─────────────────────────────┘
              │ Microsoft.Extensions.AI + OllamaSharp
   ┌──────────┴──────────┐
   │  Ollama (external)  │  default model: gpt-oss:120b-cloud
   └─────────────────────┘
```

The backend is a **modular monolith** ([ADR-001](docs/ADR/ADR-001-modular-monolith-architecture.md)): each domain is an isolated .NET project with its own `DbContext` and migrations, communicating through `*.Contracts` projects rather than direct references ([ADR-005](docs/ADR/ADR-005-contracts-pattern-inter-module-communication.md)). A separate **MigrationRunner** console app applies all module migrations on startup. Everything is orchestrated with Docker Compose ([ADR-014](docs/ADR/ADR-014-docker-docker-compose.md)).

> **Note on ADR naming:** Some ADRs reference "Next.js". The actual frontend is **React 19 + Vite** (a single-page app), not Next.js. Trust the code over the ADR titles where they conflict.

### Main technologies

| Area            | Technology                                                                |
| --------------- | ------------------------------------------------------------------------- |
| Backend         | ASP.NET Core Minimal APIs on **.NET 10**                                  |
| Backend pattern | CQRS via source-generated **Mediator** (`Mediator.SourceGenerator` 3.0.1) |
| ORM             | **Entity Framework Core 10** + Npgsql (PostgreSQL provider)               |
| Database        | **PostgreSQL 18**                                                         |
| AI abstraction  | **Microsoft.Extensions.AI** + **OllamaSharp** (Ollama provider)           |
| Validation      | **FluentValidation 12** (pipeline behavior)                               |
| Logging         | **Serilog** (console sink)                                                |
| Frontend        | **React 19** + **TypeScript 5** + **Vite 8**                              |
| Data fetching   | **TanStack React Query 5**                                                |
| UI              | **Radix UI Themes** + `lucide-react` + `@visx` charts                     |
| Routing         | **React Router 7**                                                        |
| Testing         | xUnit + NSubstitute + Shouldly (backend); Vitest + Cypress (frontend)     |

---

## 2. Tech Stack (details)

- **Backend framework:** ASP.NET Core Minimal APIs (.NET 10, `Microsoft.NET.Sdk.Web`). Entry point registers modules and maps endpoint groups.
- **Frontend framework:** React 19 + Vite 8 with the **React Compiler** enabled (`babel-plugin-react-compiler` via `@vitejs/plugin-react`).
- **Database:** PostgreSQL 18 (Docker image `postgres:18`).
- **ORM:** EF Core 10 with `Npgsql.EntityFrameworkCore.PostgreSQL`. **One `DbContext` per module** ([ADR-004](docs/ADR/ADR-004-separate-dbcontext-per-module.md)).
- **Authentication:** ⚠️ **Not implemented yet.** Every endpoint hardcodes `UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7")` with a `// TODO: Get from claims` comment. Entities implement `IUserOwned` and use `entity.HasAccess(userId)` so auth can be slotted in later ([ADR-023](docs/ADR/ADR-023-userid-forward-compatibility.md)).
- **Message brokers:** None. Inter-module communication is in-process via Mediator + Contracts.
- **Cloud services:** None required for local dev. CI pushes images to **Docker Hub** and runs **SonarQube** analysis. The default AI model `gpt-oss:120b-cloud` is a cloud-hosted Ollama model (free), but Ollama itself runs as an external dependency you control.
- **Other important libraries:** `Scriban` (templating, used in Judge template generation), `Serilog.AspNetCore`, `Swashbuckle.AspNetCore` (Swagger), `react-resizable-panels` ([ADR-010](docs/ADR/ADR-010-react-resizable-panels.md)), `@visx/*` (charts).

---

## 3. Project Structure

```
LLM-Trace-Coding-Platform/
├── backend/                 # .NET 10 solution (LlmTracing.sln)
│   ├── Api/                 # Entry point: hosts, endpoints, DI wiring, Swagger, CORS
│   ├── Shared/              # Result<T>, ErrorCode, validation behavior, AI ChatClientBuilder
│   ├── Shared.Tests/
│   ├── MigrationRunner/     # Console app: applies every module's EF migrations on startup
│   ├── <Module>/            # Domain module (DbContext + Features/ CQRS handlers)
│   ├── <Module>.Contracts/  # Cross-module query/response types (no circular deps)
│   ├── <Module>.Tests/      # xUnit unit tests for that module
│   ├── Dbcompose.yaml       # DB-only compose (Postgres + migrator) for local/dev/tests
│   ├── dockerfile           # Builds the Api image
│   ├── global.json          # Pins .NET SDK 10
│   └── dotnet-tools.json    # Local tools (csharpier)
├── frontend/
│   └── webapp/              # React 19 + Vite SPA
│       ├── src/             # Application source (see §5)
│       ├── cypress/         # E2E tests + DB seed/reset helpers
│       ├── Dockerfile       # Multi-stage build → nginx static serve
│       ├── nginx.conf       # Serves the built SPA on port 8080
│       └── package.json
├── docs/ADR/                # Architecture Decision Records (ADR-001 … ADR-028)
├── .github/workflows/       # CI/CD pipelines (backend, frontend, e2e, release, sonar)
├── docker-compose.yaml      # Full stack: frontend + backend + db + migrator
└── README.md
```

### Backend modules

Each domain module follows the same internal layout (`Data/`, `Features/`, `Extensions/`). Current modules:

| Module               | Responsibility                                                                    |
| -------------------- | --------------------------------------------------------------------------------- |
| `Projects`           | Project management (note: the `DbContext` lives under the `Project/` project)     |
| `ProjectVersions`    | Versioning within projects                                                        |
| `Traces`             | Trace import (OTLP/JSONL), querying, **and open-coding features**                 |
| `AxialCodes`         | Axial code generation / interpretation                                            |
| `AssessmentCriteria` | Evaluation criteria definitions                                                   |
| `JudgeTemplates`     | LLM-judge template generation (uses Scriban)                                      |
| `Statistics`         | Aggregate analytics per version                                                   |
| `Settings`           | LLM provider configuration (`ChatClientConfiguration`)                            |
| `Shared`             | Cross-cutting: `Result<T>`, `ErrorCode`, validation pipeline, `ChatClientBuilder` |

> There are also `Opencode/` and `Opencode.Contracts/` projects, but `Api/Program.cs` does **not** register an Opencode module — open-coding endpoints currently live inside the `Traces` module (`EditOpenCode`, `GetVersionOpencode`, etc.). Treat the standalone `Opencode` project as legacy unless you confirm otherwise.

The `*.Contracts` projects exist so one module can call another via Mediator without a circular project reference (e.g. `ProjectVersions` resolves a project through `Projects.Contracts`).

---

## 4. Backend

### Entry point — `Api/Program.cs`

`Program.cs` is the composition root. In order it:

1. Configures Kestrel + `FormOptions` for a **500 MB** max request/upload size (large trace files).
2. Registers Swagger, the source-generated Mediator (`AddMediator`, scoped lifetime), and each module's DI via `Add<Module>Module(configuration)`.
3. Configures CORS from `Cors:AllowedOrigins` (comma-separated).
4. Configures Serilog from configuration + console sink.
5. Maps each module's endpoint group (`Map<Module>Endpoints()`).

### API architecture

- **Minimal APIs**, grouped by module under `Api/Endpoints/<Module>/`. Each file is a static class with a `Map…Endpoints(this WebApplication app)` extension method, tagged with `.WithTags("…")` for Swagger.
- Endpoints are thin: they build a request/query record and `await mediator.Send(request)`, then call `.ToHttpResult()`.
- **REST conventions** ([ADR-012](docs/ADR/ADR-012-restful-api-design.md)), versioned under `/v1/...`, e.g.
  `GET /v1/projects/{projectId:guid}/versions/{versionId:guid}/traces`.

### CQRS feature structure ([ADR-006](docs/ADR/ADR-006-cqrs-mediatr.md))

There are no traditional Controllers/Services/Repositories. Each use case is a self-contained vertical slice under `Features/`:

```
Features/
  ImportTraces/
    ImportTracesRequest.cs          # Record + inline FluentValidation validator
    ImportTracesHandler.cs          # IRequestHandler<TRequest, Result<TResponse>>
    ImportTracesResponse.cs         # Response DTO
  GetTraceGroupSummary/
    GetTraceGroupSummaryQuery.cs     # Queries use *Query.cs / *QueryValidator.cs
    GetTraceGroupSummaryHandler.cs
    GetTraceGroupSummaryResponse.cs
```

- **Handlers** = the "service" layer. They take a request, use the module's `DbContext` directly (no separate repository layer — EF Core's `DbSet`/`IQueryable` is the repository), and return `Result<T>`.
- **Models / Entities** live in `<Module>/Data/Models/` and the `DbContext` in `<Module>/Data/`. Entities implement `IUserOwned`.
- **Configuration / DI:** `<Module>/Extensions/ApplicationExtensions.cs` registers the `DbContext` (Npgsql, connection string `"Default"`) and any module services.

### Validation, logging, error handling

- **Validation:** FluentValidation validators are defined inline next to each request. `Shared/Middleware/FeatureRequestValidatorBehavior.cs` is a Mediator pipeline behavior that runs validation **before** every handler ([ADR-008](docs/ADR/ADR-008-fluentvalidation-mediatr-pipeline.md)). On failure it short-circuits with `ValidationError`.
- **Logging:** Serilog, console sink, configured from the `Logging` section in `appsettings.json`.
- **Error handling — the Result pattern** ([ADR-013](docs/ADR/ADR-013-result-pattern-error-handling.md)): handlers never throw for expected errors. They return an `ErrorCode` (implicitly converted to `Result<T>`) or the response object. `Api/Extensions/ResultExtensions.cs` (`ToHttpResult()`) maps error codes → HTTP status codes.

  **Error codes** (`Shared/ErrorCode.cs`) include: `ValidationError`, `EntityNotFound`, `NoPermission`, `DatabaseError`, `NoChanges`, `Unauthorized`, `FileReadError`, `InvalidRequest`, `UnsupportedFileType`, `ProjectVersionNameAlreadyExists`, `LlmConfigError`. _(Verify the full current list in the source.)_

- **Ownership:** call `entity.HasAccess(userId)` (`Shared/Extensions/AccessExtensions.cs`) before mutations.

### AI integration

`Shared/Builders/ChatClientBuilder.cs` implements a fluent builder (`WithProvider/WithEndpoint/WithModel/Build`) returning a `Result<IChatClient>` (`Microsoft.Extensions.AI`). Today only the `ollama` provider is wired (via `OllamaSharp`), backed by an `IHttpClientFactory` client named `"ollama"`. Provider config is stored in the `Settings` module (`ChatClientConfiguration`) and defaults come from the `AI` config section ([ADR-021](docs/ADR/ADR-021-microsoft-extensions-ai-abstraction.md)).

### Backend commands

```bash
# Build the solution
dotnet build backend/LlmTracing.sln

# Run the API (from backend/)
dotnet run --project Api          # Swagger at https://localhost:7030/swagger

# Run all tests
dotnet test backend/LlmTracing.sln

# Run one module's tests
dotnet test backend/Traces.Tests

# Run a single test by name
dotnet test backend/Projects.Tests --filter "FullyQualifiedName~CreateProjectHandlerTests"

# Format C# (csharpier — restore tools first)
dotnet tool restore
dotnet csharpier .
```

> The backend has no `package.json`/npm scripts; it is driven entirely by the `dotnet` CLI. EF migration commands are documented in §7 (Database).

---

## 5. Frontend

Located in `frontend/webapp/`.

### Folder structure (`src/`)

```
src/
├── main.tsx            # Bootstraps React: BrowserRouter → QueryClientProvider → Radix Theme → App
├── App.tsx             # Route definitions (React Router 7), all pages lazy-loaded via React.lazy
├── queryClient.ts      # Shared TanStack Query client
├── globals.css
├── components/         # App-wide layout (AppLayout, Sidebar + sub-components, ui/)
├── feature/            # One folder per feature; each has components/ and hooks/
│   ├── home/  traces/  projects/  versions/  overview/
│   ├── opencode/       (incl. traceGroup/ with trace + LLM views)
│   ├── axialcode/      assessmentCriteria/  judgeTemplate/  settings/
├── shared/
│   ├── api/            # Per-domain API clients (projects.ts, traces.ts, …) + queryKeys.ts + api.ts (BASE_URL)
│   ├── types/          # TypeScript domain types (project, version, trace, …)
│   ├── components/     # Shared UI (e.g. NotFoundPage)
│   ├── styling/        # colors.ts (Radix theme tokens), shared styles
│   └── util/
├── lib/
└── assets/
```

This is a **feature-first** organisation: page components live under `feature/<name>/`, with co-located `components/` and `hooks/`. Cross-feature concerns live in `shared/`.

### Routing

Defined declaratively in `App.tsx`; all pages are code-split with `React.lazy` + `<Suspense>`, nested inside a shared `<AppLayout>`:

| Path                                                        | Page               |
| ----------------------------------------------------------- | ------------------ |
| `/`                                                         | Home               |
| `/traces`                                                   | Trace list         |
| `/projects/:id`                                             | Project detail     |
| `/projects/:id/versions/:versionId/overview`                | Version overview   |
| `/projects/:id/versions/:versionId/open-code`               | Open coding        |
| `/projects/:id/versions/:versionId/open-code/:traceGroupId` | Trace group detail |
| `/projects/:id/versions/:versionId/axial-code`              | Axial coding       |
| `/projects/:id/versions/:versionId/judge-template`          | Judge templates    |
| `*`                                                         | Not Found          |

### State management & API communication

- **Server state:** TanStack React Query. Cache keys are centralised in `src/shared/api/queryKeys.ts`. Per-domain fetch functions live in `src/shared/api/*.ts`.
- **Base URL:** `src/shared/api/api.ts` exports `BASE_URL = import.meta.env.VITE_API_URL`.
- **UI/local state:** plain React state/hooks (React Compiler enabled, so manual memoization is largely unnecessary).
- **UI library:** Radix UI Themes, configured in `main.tsx` with theme tokens from `shared/styling/colors.ts`.

### Environment configuration

Copy `.env.example` → `.env`. `VITE_API_URL` is the only variable needed to run the SPA (defaults shown in §8). `TEST_DATABASE_URL` is used by Cypress DB seeding.

### Frontend npm scripts

Run from `frontend/webapp/`.

| Command                  | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| `npm run dev`            | Start the Vite dev server (http://localhost:5173) with HMR           |
| `npm run build`          | Type-check (`tsc -b`) then produce a production build (`vite build`) |
| `npm run preview`        | Serve the production build locally                                   |
| `npm run lint`           | Run ESLint over `.ts`/`.tsx`, reporting unused disable directives    |
| `npm run lint:fix`       | ESLint with `--fix` (auto-fix)                                       |
| `npm run test`           | Run Vitest unit tests                                                |
| `npm run test:watch`     | Run Vitest in watch mode                                             |
| `npm run prettier`       | Format the project with Prettier (`--write`)                         |
| `npm run prettier:check` | Check formatting without writing (used in CI)                        |
| `npm run docker:up`      | Start Postgres + MigrationRunner via `backend/Dbcompose.yaml`        |
| `npm run docker:down`    | Stop those containers                                                |
| `npm run docker:reset`   | Full reset: `down -v` then `up` (used before Cypress runs)           |

### Build process

`npm run build` runs the TypeScript project-reference build then Vite. The Docker image (`frontend/webapp/Dockerfile`) is multi-stage: build the SPA, then serve the static `dist/` with nginx (`nginx.conf`) on port 8080. `VITE_API_URL` must be passed as a **build arg** because Vite inlines env vars at build time (see `docker-compose.yaml`).

---

## 6. Services Summary

The full stack (`docker-compose.yaml`, project name `TraceEvalCompose`) is four services:

| Service    | Build context                          | Host port     | Purpose                                                       |
| ---------- | -------------------------------------- | ------------- | ------------------------------------------------------------- |
| `frontend` | `frontend/webapp`                      | `3000` → 8080 | nginx serving the built SPA                                   |
| `backend`  | `backend`                              | `8080` → 8080 | ASP.NET Core API                                              |
| `db`       | `postgres:18` image                    | `5432`        | PostgreSQL database                                           |
| `migrator` | `backend` (MigrationRunner/Dockerfile) | —             | Applies all EF migrations, then exits (`restart: on-failure`) |

The `migrator` (`MigrationRunner`) injects every module's `DbContext` and calls `Database.MigrateAsync()` for each, with retry (5 attempts, 3s backoff) to wait for Postgres ([ADR-026](docs/ADR/ADR-026-migration-runner-modular-migrations.md)).

---

## 7. Database

- **Technology:** PostgreSQL 18 (Docker).
- **ORM / schema location:** EF Core 10. Schema is code-first; entities live in `backend/<Module>/Data/Models/`, each module's `DbContext` in `backend/<Module>/Data/`.
- **Migrations location:** `backend/<Module>/Migrations/` — **each module owns its migrations** ([ADR-026](docs/ADR/ADR-026-migration-runner-modular-migrations.md)).
- **Connection configuration:** connection string `"Default"`. Locally set it in `backend/Api/appsettings.json` (defaults to `Host=localhost;Port=5432;Database=mydb;Username=user;Password=password`). In Docker it's supplied via the `ConnectionStrings__Default` env var.
- **Applying migrations at runtime:** the `MigrationRunner` service runs them automatically on `docker compose up`.

### Creating, running, and rolling back migrations

Replace `<Module>` with the project whose schema changed (e.g. `Traces`, `Projects`, `ProjectVersions`, `AxialCodes`, `AssessmentCriteria`, `JudgeTemplates`, `Settings`). All commands use `Api` as the startup project.

```bash
# Create a migration
dotnet ef migrations add <MigrationName> --project backend/<Module> --startup-project backend/Api

# Apply migrations to the local DB
dotnet ef database update --project backend/<Module> --startup-project backend/Api

# Roll back to a specific earlier migration (apply down-scripts)
dotnet ef database update <PreviousMigrationName> --project backend/<Module> --startup-project backend/Api

# Remove the last (unapplied) migration
dotnet ef migrations remove --project backend/<Module> --startup-project backend/Api
```

> Run migration commands **per module** — there is no single "migrate everything" CLI command outside the MigrationRunner.

> ⚠️ **Known issue — stale `migrator` image.** When you change the MigrationRunner or add/modify a migration, Docker Compose will keep using the **previously built `migrator` image**, so your new migrations won't be applied. You must manually rebuild it: stop the stack, delete the old image, and restart.
>
> ```bash
> docker compose stop migrator
> docker compose rm -f migrator          # remove the stopped container
> docker image rm traceevalcompose-migrator   # delete the cached image (name may vary)
> docker compose up --build migrator     # rebuild and re-run
> ```
>
> If you're unsure of the image name, list it with `docker image ls | grep migrator`. A full `docker compose up --build` from a clean state also works, but targeted removal is faster.

### Seeding

There is **no application-level seed script**. Seeding exists only for **Cypress E2E tests**: `frontend/webapp/cypress/db/` (`seedDb.ts`, `resetDb.ts`, `db.ts`) connects directly to Postgres via the `pg` driver using `TEST_DATABASE_URL`, with seed payloads in `cypress/testData/`. If you need dev seed data, that requires developer input — it is not yet built.

---

## 8. Environment Variables

### Frontend (`frontend/webapp/.env`)

| Variable            | Required         | Description                                                                                                                                   |
| ------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`      | Yes              | Base URL of the backend API. Dev default: `https://localhost:7030`. In the Docker build it's passed as a build arg (`http://localhost:8080`). |
| `TEST_DATABASE_URL` | Only for Cypress | Postgres connection string used by Cypress DB seeding. Default: `postgresql://user:password@localhost:5432/mydb`.                             |

### Backend (`appsettings.json` keys / `__` env-var overrides)

| Variable                     | Required     | Description                                                                                    |
| ---------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `ConnectionStrings__Default` | Yes          | PostgreSQL connection string.                                                                  |
| `Cors__AllowedOrigins`       | Yes          | Comma-separated allowed origins. Dev default: `http://localhost:5173,http://localhost:5248`.   |
| `AI__Provider`               | Yes          | LLM provider. Currently only `Ollama` is implemented.                                          |
| `AI__Ollama__Endpoint`       | Yes (Ollama) | Ollama base URL, e.g. `http://localhost:11434/` (Docker: `http://host.docker.internal:11434`). |
| `AI__Ollama__Model`          | Yes (Ollama) | Default model, e.g. `gpt-oss:120b-cloud`. Changeable at runtime in app settings.               |
| `AI__Ollama__TimeoutMinutes` | No           | Request timeout in minutes (default `10`).                                                     |
| `Logging__LogLevel__*`       | No           | Standard .NET log-level configuration.                                                         |

---

## 9. Running the Project

### Prerequisites

- **.NET SDK 10** (pinned in `backend/global.json`)
- **Node.js 22** (CI uses Node 22) + npm
- **Docker** + Docker Compose
- **Ollama** installed separately (the compose stack does **not** run Ollama)

### Recommended AI model setup

By default the app uses `gpt-oss:120b-cloud` — a free cloud-hosted Ollama model that gives the best results for axial coding / qualitative analysis. Pull it before starting:

```bash
ollama pull gpt-oss:120b-cloud
```

To run a fully local model instead, `llama3.1:8b` is recommended (a capable GPU is strongly advised — local generation can take ~2–3 min/request). Verify GPU usage with `ollama ps` (look for `100% GPU`).

### Option A — Full stack via Docker Compose

```bash
ollama pull gpt-oss:120b-cloud      # once
docker compose up --build           # from repo root
```

- Frontend → http://localhost:3000
- Backend API → http://localhost:8080
- Postgres → localhost:5432
- `migrator` runs migrations automatically, then exits.

### Option B — Local development (hot reload)

```bash
# 1. Start Postgres + run migrations (from frontend/webapp/)
npm run docker:up

# 2. Backend (from backend/)
dotnet run --project Api            # https://localhost:7030  (Swagger at /swagger)

# 3. Frontend (from frontend/webapp/)
cp .env.example .env                # ensure VITE_API_URL points at the backend
npm install
npm run dev                         # http://localhost:5173
```

### Production build

- Backend image: `docker build -f backend/dockerfile backend/`
- Frontend image: `docker build -f frontend/webapp/Dockerfile --build-arg VITE_API_URL=<url> frontend/webapp/`
- Or simply `docker compose up --build` to build all images.

---

## 10. Development Workflow

### Add a new API endpoint / feature (backend)

1. In the relevant module, create a `Features/<FeatureName>/` folder with:
   - `<FeatureName>Request.cs` (or `…Query.cs`) — a record **plus** an inline FluentValidation validator.
   - `<FeatureName>Handler.cs` — `IRequestHandler<TRequest, Result<TResponse>>`; use the module `DbContext`, return an `ErrorCode` or the response.
   - `<FeatureName>Response.cs`.
2. If another module needs to call it, add the request/response to that module's `*.Contracts` project.
3. Map it in `Api/Endpoints/<Module>/<Module>Endpoints.cs`: build the request, `mediator.Send(...)`, return `.ToHttpResult()`, tag with `.WithTags(...)`.
4. Add a handler unit test in `<Module>.Tests` (xUnit + NSubstitute + Shouldly).

### Add a new database model

1. Add the entity to `<Module>/Data/Models/` (implement `IUserOwned` if user-owned).
2. Register it on the module's `DbContext`.
3. Create + apply a migration (see §7).

### Add a frontend page

1. Create `src/feature/<name>/<Name>Page.tsx` (+ `components/`, `hooks/`).
2. Add a lazy route in `src/App.tsx`.
3. Add API functions in `src/shared/api/<name>.ts` and a cache key in `queryKeys.ts`; fetch via React Query.

### Coding conventions, linting, formatting

- **Backend:** csharpier (config in `backend/.csharpierrc.json`); `dotnet csharpier .` ([ADR-028](docs/ADR/ADR-028-code-formatting-prettier-csharpier.md)). CI fails on formatting drift.
- **Frontend:** ESLint (`eslint.config.js`) + Prettier (`.prettierrc`). Run `npm run lint:fix` and `npm run prettier`. CI runs `prettier:check`, `lint`, `build`, and `test`.
- **Static analysis:** SonarQube on both backend and frontend ([ADR-018](docs/ADR/ADR-018-static-code-analysis-sonarqube-eslint.md)); config in `sonar-project.properties`.

### Pull request requirements

Per the PR template, every PR must include unit tests for changed business logic, Cypress E2E tests matching acceptance criteria, local verification of all relevant scenarios, and a **complete** backend + frontend implementation (no partial PRs).

---

## 11. Testing ([ADR-020](docs/ADR/ADR-020-testing-strategy.md))

| Layer         | Stack                            | How to run                                                       |
| ------------- | -------------------------------- | ---------------------------------------------------------------- |
| Backend unit  | xUnit + NSubstitute + Shouldly   | `dotnet test backend/LlmTracing.sln`                             |
| Frontend unit | Vitest + Testing Library (jsdom) | `npm run test`                                                   |
| E2E           | Cypress                          | `npx cypress open` / `npx cypress run` (from `frontend/webapp/`) |

**Cypress** resets and seeds the database before each run via Docker. `cypress.config.ts` runs `npm run docker:reset` on `before:run`, then registers `task` hooks (`resetDb`, `seedProjects`, `seedTraces`, …) that talk to Postgres directly. Requirements:

- Frontend running at `http://localhost:5173`, API at `https://localhost:7030`, Docker available.
- Test data lives in `cypress/testData/`; specs in `cypress/e2e/`.

**Coverage / integration tests:** there is no dedicated coverage threshold or separate integration-test suite configured in the repo. Add this if required — it needs developer input.

---

## 12. Deployment ([ADR-019](docs/ADR/ADR-019-cicd-pipeline-strategy.md))

CI/CD runs on GitHub Actions (`.github/workflows/`):

| Workflow                                                          | Trigger                     | Purpose                                                            |
| ----------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------ |
| `ci-backend.yml`                                                  | push/PR to `main`/`dev`     | Restore, build, csharpier check, `dotnet test`                     |
| `ci-frontend.yml`                                                 | push/PR to `main`/`dev`     | Install, prettier check, lint, build, Vitest                       |
| `reusable.cypress-e2e.yml`                                        | called by others            | Full Dockerised E2E run                                            |
| `nightly.yml`                                                     | cron (Tue–Fri 01:00 UTC)    | Nightly E2E suite                                                  |
| `release.yml`                                                     | after CI succeeds on `main` | E2E gate, then **build & push images to Docker Hub**               |
| `reusable.sonarqube-dotnet.yml` / `reusable.sonarqube-nextjs.yml` | called by CI                | SonarQube analysis (needs `SONAR_TOKEN`, `SONAR_HOST_URL` secrets) |

**Production configuration:** containers are built from `backend/dockerfile`, `frontend/webapp/Dockerfile` (nginx), and `MigrationRunner/Dockerfile`, orchestrated by `docker-compose.yaml`. The design targets **local-first / self-hosted** deployment ([ADR-022](docs/ADR/ADR-022-local-first-deployment.md)); there is no managed cloud deployment pipeline beyond the Docker Hub image push.

---

## 13. Troubleshooting

| Symptom                                               | Likely cause / fix                                                                                                                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend can't reach the API / CORS errors            | Check `VITE_API_URL` in `.env` matches the running API, and that the API's `Cors__AllowedOrigins` includes the frontend origin.                                         |
| `VITE_API_URL` changes not taking effect in Docker    | Vite inlines env at **build** time — rebuild the frontend image (it's a build arg, not a runtime env var).                                                              |
| AI / generation requests fail (`LlmConfigError`)      | Ensure Ollama is running and the model is pulled (`ollama pull gpt-oss:120b-cloud`). From Docker, the backend reaches the host via `http://host.docker.internal:11434`. |
| Local AI generation extremely slow                    | Model may be on CPU — run `ollama ps` and confirm `100% GPU`; otherwise expect ~2–3 min/request.                                                                        |
| DB connection refused on startup                      | Postgres not up yet. The MigrationRunner retries 5×; for local dev wait for `npm run docker:up` to finish or check the `db` container.                                  |
| Migrations didn't apply / schema out of date          | Inspect the `migrator` container logs; re-run `npm run docker:reset`, or apply manually per module (§7).                                                                |
| **New/changed migration not applied after a rebuild** | **Known issue:** Docker reuses the old cached `migrator` image. Stop the container, delete the image, and restart — see the boxed note in §7.                           |
| `dotnet` build fails with an SDK version error        | Install .NET SDK 10 — it's pinned by `backend/global.json`.                                                                                                             |
| Large trace upload rejected                           | The API caps requests at 500 MB (set in `Program.cs`); split larger files.                                                                                              |
| Cypress fails to start / stale data                   | It runs `docker:reset` before each run — ensure Docker is running and ports 5432/5173/7030 are free.                                                                    |
| csharpier / prettier CI failures                      | Run `dotnet csharpier .` (backend) and `npm run prettier` (frontend) before pushing.                                                                                    |

---

## 14. Further Reading

The [`docs/ADR/`](docs/ADR) directory documents the rationale behind every major decision (architecture, CQRS, per-module DbContexts, the Contracts pattern, the Result pattern, AI abstraction, testing and CI strategy, etc.). Start with `ADR-001` and `ADR-002` for the big picture.

---

### Items requiring developer input

- **Authentication** is not implemented (hardcoded `UserId`); the real claims-based flow is TODO.
- **Application-level DB seeding** does not exist (only Cypress test seeding).
- **Code-coverage thresholds / dedicated integration tests** are not configured.
- The standalone **`Opencode`** project is not registered in `Program.cs` — confirm whether it is active or legacy before building on it.
- Several **ADRs reference "Next.js"** while the implementation is React + Vite — verify intent when relevant.

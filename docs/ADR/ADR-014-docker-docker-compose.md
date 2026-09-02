# ADR-014: Docker and Docker Compose for Containerisation and Local Deployment

## Status
Accepted

## Date
2026

---

## Context

A hard constraint from stakeholders requires the application to run fully locally on developer hardware (laptop, desktop, MacBook, Mac mini) without external server infrastructure. The application must be startable by any developer or end user without complex manual configuration. It must also run consistently on Windows, macOS, and Linux.

---

## Decision

The application is containerised using **Docker**, and local multi-container orchestration is managed via **Docker Compose**. All services (frontend, backend, PostgreSQL) are defined in a single `docker-compose.yml` and started with `docker compose up`.

---

## Alternatives Considered

### Manual Local Installation (No Containerisation)

**Pros:**
- No Docker dependency on the host machine

**Cons:**
- Environment-specific configuration differences cause "works on my machine" problems
- Database, runtime, and dependency versions must be manually managed per machine
- Complex onboarding for new developers

### Kubernetes (Local via Minikube or Kind)

**Pros:**
- Production-representative local environment
- Supports the future cloud deployment target

**Cons:**
- Significant operational overhead for a local-first, single-machine use case
- Overkill for the current project scope and team size

---

## Consequences

### Positive
- Any developer can start a fully working environment in minutes with a single command
- Eliminates environment inconsistency between team members
- Consistent behaviour across Windows, macOS, and Linux
- Application can be migrated to cloud environments without changes to core application code — only the hosting configuration changes
- Satisfies NFR-14 and RV-01 through RV-04 directly

### Negative
- Docker must be installed on the host machine
- Docker Desktop on macOS/Windows has a resource overhead compared to native Linux Docker

### Risks
- Docker Desktop licensing changes could affect team members using it commercially

---

## Dependencies

- ADR-001: Modular Monolith Architecture
- ADR-011: PostgreSQL
- ADR-022: Local-First Deployment Constraint

---

## References

- `Applicatie Stack.docx` — Containerisation section
- `Requirementsdocument` — NFR-14, RV-01, RV-04
- `Quality Document` — Portability fit criteria

---

## Confidence Assessment

Fully supported by documentation.

# ADR-001: Modular Monolith Architecture

## Status
Accepted

## Date
2026

---

## Context

The LLM-Trace Coding Platform requires a backend architecture that satisfies two competing constraints documented by stakeholders. First, the system must run as a fully local, single-machine installation that any developer can start with a single `docker compose up` command. Second, the architecture must not prevent the platform from being migrated to a hosted, multi-user cloud environment in the future without requiring a rewrite.

Two conventional options were evaluated: a traditional monolith and a microservices architecture.

A traditional monolith would satisfy the local deployment requirement cheaply. However, it would produce tight coupling between concerns over time, making horizontal scaling painful and future extraction of independent services difficult.

A full microservices split would satisfy the scalability requirement but introduces distributed deployment complexity, inter-service networking, and significant operational overhead that is disproportionate to the current project scope and team size.

---

## Decision

The backend is implemented as a **modular monolith**. The system runs as a single deployable process and a single Docker artifact, while the internal codebase is divided into clearly bounded, independently compilable modules. Each module owns its own DbContext, migration history, and business logic, and interacts with other modules exclusively through published contract interfaces rather than direct code dependencies.

---

## Alternatives Considered

### Traditional Monolith

**Pros:**
- Simplest deployment model
- No inter-service communication overhead
- Fastest initial development velocity

**Cons:**
- Tends toward tight coupling over time
- Difficult to extract independent services later
- Makes horizontal scaling of individual concerns painful

### Microservices

**Pros:**
- Maximum deployment flexibility
- Independent scaling per service
- Clear operational boundaries

**Cons:**
- Significant operational overhead for local deployment
- Distributed tracing, networking, and inter-service communication add complexity disproportionate to project scope
- Crushes development velocity at early project stages
- Contradicts the local single-machine deployment constraint

---

## Consequences

### Positive
- Single `docker compose up` starts the complete system locally
- Module boundaries enforce separation of concerns from the start
- Each module can be developed, tested, and maintained independently
- Module boundaries serve as natural seams for future extraction into microservices
- No rewrite is required when deployment topology changes — extraction is a hosting concern, not an architectural one

### Negative
- Requires discipline to maintain module boundaries; direct coupling is technically possible and must be actively avoided
- All modules share one process; a crash in one module affects all

### Risks
- Module boundary violations are not enforced at compile time beyond the contract convention; requires code review discipline and CI enforcement

---

## Dependencies

- ADR-004: Separate DbContext per Module
- ADR-005: Contracts Pattern for Inter-Module Communication
- ADR-006: CQRS with MediatR within Modules
- ADR-014: Docker and Docker Compose for Containerisation
- ADR-026: Migration Runner for Modular Database Migrations

---

## References

- `Maintainability.docx` — System Overview, Layer descriptions, Module definitions
- `Quality Document` — Section 3.1.1 Architecture Backend
- `Requirementsdocument` — NFR-05 (layered architecture), NFR-04 (modular and extensible)

---

## Confidence Assessment

Fully supported by project documentation. The rationale, constraints, and trade-offs are explicitly described in Maintainability.docx and the Quality Document.

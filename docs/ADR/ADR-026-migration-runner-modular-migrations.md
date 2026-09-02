# ADR-026: Migration Runner for Modular Database Migrations

## Status
Accepted

## Date
2026

---

## Context

The modular monolith architecture (ADR-001) and the decision to give each module its own DbContext (ADR-004) result in multiple independent EF Core migration histories — one per module. At deployment time, all migrations from all modules must be applied to the database in a consistent, repeatable manner.

Running migrations manually per module would be error-prone and would complicate the `docker compose up` startup process.

---

## Decision

A **centralised migration runner** is implemented that discovers all module DbContexts, collects their pending migrations, and executes them during application startup. All module migrations are applied in a single automated step as part of deployment.

---

## Alternatives Considered

### Manual Migration Execution per Module

**Pros:**
- No custom runner required

**Cons:**
- Error-prone — migrations could be missed
- Complicates the startup process
- Requires developer knowledge of each module's migration state
- Incompatible with the one-command `docker compose up` startup requirement

### Third-Party Migration Tools (e.g., DbUp, Fluent Migrator)

**Pros:**
- Established, well-tested migration runners
- Support complex migration scenarios

**Cons:**
- Introduce an additional library dependency with its own conventions
- EF Core's built-in migration mechanism is already in use per module; a third-party tool would require mapping between EF Core migrations and its own format
- Adds unnecessary complexity for the current requirement

---

## Consequences

### Positive
- All module migrations are applied automatically on startup — no manual steps required
- Consistent with the `docker compose up` single-command startup requirement
- New modules can be added and their migrations are automatically discovered and applied
- Simplifies onboarding for new developers

### Negative
- Custom runner must be maintained as modules are added or modified
- Migration ordering across modules must be managed carefully if cross-module schema dependencies exist (though these should be avoided per ADR-004)

### Risks
- If a migration fails mid-run, partial migration state must be handled and rolled back safely

---

## Dependencies

- ADR-001: Modular Monolith Architecture
- ADR-004: Separate DbContext per Module
- ADR-011: PostgreSQL
- ADR-014: Docker and Docker Compose

---

## References

- Team-provided information
- `Maintainability.docx` — Module DbContext descriptions

---

## Confidence Assessment

Based on team-provided information. The architectural motivation is fully corroborated by the documented modular structure in Maintainability.docx.

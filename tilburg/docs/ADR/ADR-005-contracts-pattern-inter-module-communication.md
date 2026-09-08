# ADR-005: Contracts Pattern for Inter-Module Communication

## Status
Accepted

## Date
2026

---

## Context

In a modular monolith, modules inevitably need data owned by other modules. For example, the ProjectVersions module must verify that a given project exists before acting, but the project data is owned by the Projects module.

The naive solution — taking a direct C# project reference to another module — defeats the purpose of the module boundary. It creates compile-time coupling that makes future service extraction impossible without significant refactoring.

---

## Decision

Each module that exposes data to other modules publishes a **`*.Contracts` project** — a thin C# library containing only request and response record types, with no business logic and no EF dependencies. Consuming modules reference only the Contracts project, never the owning module directly. Requests are dispatched via MediatR, and the handler fulfilling the request lives in the owning module.

---

## Alternatives Considered

### Direct Module Project Reference

**Pros:**
- Simplest implementation
- No indirection

**Cons:**
- Creates compile-time coupling between modules
- Prevents independent extraction of modules into services
- Violates the modular monolith boundary principle

### Shared Domain Library

**Pros:**
- Centralises domain types

**Cons:**
- Grows into a coupling point as all modules depend on it
- Does not provide a clear ownership boundary

---

## Consequences

### Positive
- Module boundaries are enforced at the project reference level
- The Contracts project is a pre-drawn service extraction boundary: request/response types map cleanly to gRPC proto definitions, OpenAPI schemas, or message bus envelopes
- When a module is extracted, only the MediatR dispatch call needs to be replaced with a network call — no business logic changes
- The contract project becomes a shared NuGet package upon extraction

### Negative
- Additional project files and indirection increase solution complexity slightly
- Developers must discipline themselves to use contracts rather than direct references

### Risks
- Without CI enforcement of project references, a developer could inadvertently add a direct module dependency

---

## Dependencies

- ADR-001: Modular Monolith Architecture
- ADR-004: Separate DbContext per Module
- ADR-006: CQRS with MediatR

---

## References

- `Maintainability.docx` — Contracts section, Contracts as the Microservice Boundary section

---

## Confidence Assessment

Fully supported. The Contracts pattern and its microservice extraction rationale are explicitly documented in Maintainability.docx.

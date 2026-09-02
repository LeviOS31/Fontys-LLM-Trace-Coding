# ADR-025: HasOpenCode Property Denormalised on Trace Entity

## Status
Accepted

## Date
2026

---

## Context

The platform's trace list view must display whether each trace has an associated open code. Naively, this would require either a join between the Traces and Opencode modules or a cross-module contract call per trace to check for an associated open code.

However, the modular monolith architecture (ADR-001) prohibits direct cross-module database joins, and executing a contract call per trace in a list would create N+1 query patterns at scale.

---

## Decision

A **`HasOpenCode` boolean property** is stored directly on the Trace entity and maintained by the Traces module. It is updated when an open code is added or removed.

---

## Alternatives Considered

### Cross-Module Contract Query per Trace

**Pros:**
- No denormalisation
- Always accurate

**Cons:**
- Requires a contract call to the Opencode module for every trace in the list
- Creates N+1 query overhead for large trace lists
- Violates the principle of avoiding per-item cross-module calls in list contexts

### EF Core Navigation Property / Join in the Traces Module

**Pros:**
- No denormalisation

**Cons:**
- Would require the Traces module to take a dependency on the Opencode module
- Directly violates the module boundary principle (ADR-004, ADR-005)

---

## Consequences

### Positive
- Trace list queries return `HasOpenCode` in a single database query with no cross-module calls
- Eliminates N+1 query patterns for open code presence checking
- Simplifies trace list implementation
- Respects module boundaries — no dependency introduced between Traces and Opencode

### Negative
- Denormalised property requires synchronisation — `HasOpenCode` must be updated when open codes are created or deleted
- Introduces a consistency risk if update logic is missed in any code path

### Risks
- If the `HasOpenCode` flag is not correctly maintained in all code paths, the UI may display stale data

---

## Dependencies

- ADR-001: Modular Monolith Architecture
- ADR-004: Separate DbContext per Module
- ADR-005: Contracts Pattern for Inter-Module Communication

---

## References

- Team-provided information
- `Maintainability.docx` — Opencode module description, Traces module description

---

## Confidence Assessment

Based on team-provided information. The architectural motivation (avoiding cross-module joins in list contexts) is directly corroborated by the documented module boundary principles in Maintainability.docx.

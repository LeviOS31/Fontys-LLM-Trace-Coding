# ADR-004: Separate DbContext per Module

## Status
Accepted

## Date
2026

---

## Context

The modular monolith architecture (ADR-001) requires that modules remain independently maintainable and extractable. A key architectural question is whether all modules should share a single Entity Framework DbContext or whether each module should own its own.

Sharing a single DbContext would allow cross-module entity relationships and joins but creates coupling between modules at the data layer, undermining the module boundary.

---

## Decision

Each backend module maintains its **own dedicated DbContext** and owns its own database schema slice and migration history. No module accesses another module's DbContext directly.

---

## Alternatives Considered

### Shared Single DbContext

**Pros:**
- Simpler initial setup
- Allows cross-module joins at the ORM layer

**Cons:**
- Creates tight coupling at the data layer between modules
- Prevents independent module extraction
- A change in one module's schema can affect others
- Violates the module boundary principle

---

## Consequences

### Positive
- Each module is a fully self-contained unit at both the code and data layer
- Modules can be extracted into independent services without data layer refactoring
- Schema changes in one module cannot inadvertently affect another
- Enables independent migration management per module

### Negative
- Cannot perform ORM-level joins across module boundaries
- Cross-module data access must go through the Contracts pattern, which adds indirection

### Risks
- Data consistency across modules must be managed at the application level rather than via database foreign keys across module schemas

---

## Dependencies

- ADR-001: Modular Monolith Architecture
- ADR-005: Contracts Pattern for Inter-Module Communication
- ADR-026: Migration Runner for Modular Database Migrations

---

## References

- `Maintainability.docx` — Each module description, DbContext references
- `Quality Document` — Section 3.1.1

---

## Confidence Assessment

Fully supported. Every module in Maintainability.docx explicitly documents its own DbContext.

# ADR-011: PostgreSQL as the Primary Database

## Status
Accepted

## Date
2026

---

## Context

The platform stores structured project and coding data (projects, versions, traces, open codes, axial codes) as well as semi-structured LLM trace data in variable JSON formats. A database technology needed to be selected that handles both relational data and flexible, variable JSON structures efficiently without requiring a separate NoSQL database.

---

## Decision

**PostgreSQL** is used as the single primary database for the platform.

---

## Alternatives Considered

### Relational Database + Separate NoSQL Database (e.g., PostgreSQL + MongoDB)

**Pros:**
- Dedicated NoSQL store optimised for document storage

**Cons:**
- Introduces operational complexity of managing two separate database systems
- Increases deployment footprint
- Complicates transactions across both stores

### SQLite

**Pros:**
- Zero-configuration, embedded
- Simple local deployment

**Cons:**
- Limited support for concurrent writes
- Less capable querying for complex relational and JSON workloads
- Not suitable for future cloud/multi-user deployment

---

## Consequences

### Positive
- JSONB support allows efficient storage and querying of variable LLM trace data without a separate NoSQL database
- Strong relational capabilities handle the structured domain model (projects, versions, codes)
- Robust and reliable for production workloads
- Single database technology reduces operational complexity
- Compatible with future cloud deployment (managed PostgreSQL services widely available)
- Supported by EF Core via Npgsql provider

### Negative
- Heavier than SQLite for purely local, single-user use cases

### Risks
- JSONB queries are PostgreSQL-specific; migrating to a different RDBMS would require query rewriting

---

## Dependencies

- ADR-004: Separate DbContext per Module
- ADR-026: Migration Runner for Modular Database Migrations

---

## References

- `Applicatie Stack.docx` — Database section

---

## Confidence Assessment

Fully supported by documentation.

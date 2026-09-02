# ADR-024: IQueryable with PostgreSQL ILike for Dynamic Filtering and Search

## Status
Accepted

## Date
2026

---

## Context

The platform requires filtering and searching across traces, open codes, and axial codes. Filters include date, open code presence, axial code, trace ID, and free-text search. These filters must be composable — users may apply multiple filters simultaneously — and must be evaluated efficiently at the database level rather than in application memory.

---

## Decision

Filtering is implemented using **dynamically composed `IQueryable` expressions**. Free-text search is implemented using **PostgreSQL's `ILike` operator** via EF Core's `EF.Functions.ILike` for case-insensitive matching.

---

## Alternatives Considered

### In-Memory Filtering (Load All Records, Filter in Application)

**Pros:**
- No database-specific query logic

**Cons:**
- Retrieves all records from the database regardless of filter
- Unacceptable performance for large trace datasets
- Wastes database I/O and application memory

### PostgreSQL Full-Text Search (tsvector/tsquery)

**Pros:**
- More powerful for natural language search across large text corpora
- Supports ranking by relevance

**Cons:**
- Significantly more complex to implement and maintain
- Requires index management and text vector maintenance
- Disproportionate for the current search requirements (simple case-insensitive substring matching)

---

## Consequences

### Positive
- Filters are composed before query execution — only matching records are retrieved from the database
- `ILike` is a native PostgreSQL operator, executing efficiently at the database layer
- Dynamic `IQueryable` composition allows any combination of filters without requiring separate query implementations per filter combination
- Aligns with the performance requirement to handle 1000 JSONL traces without degradation

### Negative
- `ILike` is PostgreSQL-specific — not portable to other RDBMS systems
- `ILike` behaviour cannot be practically unit tested; coverage is provided through E2E tests (accepted trade-off, see ADR-020)

### Risks
- `ILike` without a `pg_trgm` index may be slow on very large text columns; index strategy should be reviewed if trace volumes grow significantly

---

## Dependencies

- ADR-011: PostgreSQL as Primary Database
- ADR-020: Testing Strategy

---

## References

- Team-provided information
- `Quality Document` — Performance Efficiency fit criteria (1000 trace dataset)
- `Requirementsdocument` — FR-12 (trace filter and sort functionality)

---

## Confidence Assessment

Based on team-provided information. The performance motivation is corroborated by documented performance requirements. The ILike unit test trade-off is explicitly acknowledged by the team.

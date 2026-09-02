# ADR-020: Testing Strategy — Unit Testing, E2E Testing, TDD, and BDD

## Status
Accepted

## Date
2026

---

## Context

The project requires a testing strategy that validates both functional correctness and non-functional quality across a full-stack application. Different parts of the system have different testing characteristics: backend business logic is well-suited to unit testing, while complete user workflows require end-to-end validation. Some functionality (such as PostgreSQL-specific ILike queries) is not practically unit-testable and requires E2E coverage instead.

---

## Decision

The project uses a **combined testing strategy**:

- **Unit tests** cover backend custom business logic (handlers, services, processing logic) in isolation
- **End-to-end tests** validate complete user flows using Gherkin acceptance criteria
- **Test-Driven Development (TDD)** is applied to backend development where possible
- **Behaviour-Driven Development (BDD)** frames acceptance criteria as Gherkin scenarios
- **Regression testing** is performed manually at the end of each sprint

---

## Alternatives Considered

### Unit Tests Only

**Pros:**
- Fast execution
- High isolation

**Cons:**
- Cannot validate full user flows or database-specific behaviour
- PostgreSQL-specific functionality (ILike, JSONB queries) cannot be meaningfully unit tested

### Integration Tests as Primary Strategy

**Pros:**
- Tests components together

**Cons:**
- Slower than unit tests
- Complex setup for database-dependent tests
- The project's E2E approach covers integration concerns sufficiently

---

## Consequences

### Positive
- Unit tests provide fast feedback on business logic correctness
- E2E tests validate that acceptance criteria are met in the working product
- TDD drives focused implementation and improves test coverage of custom logic
- BDD/Gherkin makes acceptance criteria concrete, testable, and readable by non-developers
- Database-specific behaviour (ILike) is covered by E2E tests, accepting the trade-off explicitly

### Negative
- E2E tests are slower to execute and more brittle than unit tests
- TDD requires discipline and adds time to initial implementation

### Risks
- Flaky E2E tests can create friction in the CI pipeline
- Sprint regression testing is manual and subject to human error

---

## Dependencies

- ADR-019: CI/CD Pipeline Strategy
- ADR-024: IQueryable with PostgreSQL ILike for Dynamic Filtering

---

## References

- `Quality Document` — Sections 3.2.1, 3.2.3, 3.2.7, 3.3 Definition of Done
- `Requirementsdocument` — NFR-07

---

## Confidence Assessment

Fully supported by documentation.

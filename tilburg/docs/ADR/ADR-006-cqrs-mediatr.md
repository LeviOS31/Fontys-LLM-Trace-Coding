# ADR-006: CQRS Pattern with MediatR within Modules

## Status
Accepted

## Date
2026

---

## Context

The backend requires a consistent, maintainable pattern for handling API requests and routing them to business logic. The system uses a modular monolith where each module contains its own Features folder with request handlers.

MediatR was adopted as the in-process messaging library to implement the CQRS (Command Query Responsibility Segregation) pattern within each module.

No formal evaluation of alternative libraries was conducted. The decision was based on MediatR being a well-established, widely adopted library in the .NET ecosystem that directly supports the architectural goals of the project.

---

## Decision

All API requests are handled via **MediatR**. Each module organises its logic into Command and Query handlers following the **CQRS pattern**. The API layer maps HTTP verbs to `Mediator.Send()` calls and contains no business logic.

---

## Alternatives Considered

### Direct Service Injection

**Pros:**
- No additional library dependency
- Simpler for very small projects

**Cons:**
- Controllers or endpoints accumulate direct dependencies on service classes
- Harder to maintain consistent request/response handling as the codebase grows
- Makes it harder to enforce cross-cutting concerns (validation, logging) consistently

> No formal comparative evaluation was conducted. The team selected MediatR based on its established position in the .NET ecosystem and its alignment with the modular architecture.

---

## Consequences

### Positive
- API layer remains thin — endpoints do nothing but dispatch to handlers
- Business logic is isolated in handlers, which are independently testable
- Pipeline behaviours (FluentValidation, logging) can be applied consistently to all requests
- Reduces direct coupling between API endpoints and business logic
- Supports the Contracts pattern: cross-module requests use the same MediatR dispatch mechanism

### Negative
- Introduces an additional library dependency
- Indirection between API endpoint and handler can make tracing request flow slightly less direct for new developers

### Risks
- MediatR is a community library; long-term maintenance depends on its open-source ecosystem

---

## Dependencies

- ADR-001: Modular Monolith Architecture
- ADR-005: Contracts Pattern for Inter-Module Communication
- ADR-008: FluentValidation in the MediatR Pipeline

---

## References

- `Maintainability.docx` — Layer 1 (API Gateway), Layer 2 (Modules), `Mediator.Send()` references

---

## Confidence Assessment

The use of MediatR and CQRS is fully evidenced in documentation. No formal alternatives evaluation was documented; this is stated explicitly in this ADR.

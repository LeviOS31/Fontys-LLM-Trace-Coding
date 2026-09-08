# ADR-008: FluentValidation in the MediatR Pipeline

## Status
Accepted

## Date
2026

---

## Context

All incoming API requests require validation before business logic executes. The system needs a consistent, maintainable validation strategy that applies uniformly across all modules without duplicating validation logic inside individual handlers.

FluentValidation was adopted without a formal comparative evaluation of alternatives. The decision was based on its well-established position in the .NET ecosystem and its native support for pipeline integration via MediatR.

---

## Decision

Validation is implemented using **FluentValidation**, integrated as a MediatR pipeline behaviour. All incoming requests are validated before their handlers execute. No handler contains inline validation logic.

---

## Alternatives Considered

### DataAnnotations (built-in .NET)

**Pros:**
- No additional dependency
- Native .NET support

**Cons:**
- Validation rules are defined as attributes on DTOs, mixing concerns
- Limited support for complex, cross-field validation rules
- Not natively integrated with MediatR pipeline

> No formal comparative evaluation was conducted. FluentValidation was selected based on team familiarity and ecosystem fit.

---

## Consequences

### Positive
- Validation is centralised and consistent — all requests are validated at the same pipeline stage
- Validation rules are defined separately from handler logic, maintaining separation of concerns
- Complex, conditional validation rules are expressible in a readable, fluent syntax
- Integration with MediatR pipeline means no handler needs to manually trigger validation

### Negative
- Additional library dependency
- Developers must learn FluentValidation's API conventions

### Risks
- None identified beyond standard library dependency risk

---

## Dependencies

- ADR-006: CQRS with MediatR

---

## References

- `Maintainability.docx` — Layer 2 description: "The Mediator pipeline receives every request and runs FluentValidation before the handler executes"

---

## Confidence Assessment

Use of FluentValidation is confirmed by documentation. No formal alternatives evaluation was documented; stated explicitly.

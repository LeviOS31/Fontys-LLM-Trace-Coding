# ADR-013: Result Pattern for Error Handling

## Status
Accepted

## Date
2026

---

## Context

The backend needs a consistent approach to communicating the outcome of operations — including both success and expected failure cases — between layers. Using exceptions for expected business failures (e.g., a record not found, a validation constraint violated) is an established anti-pattern because exceptions are expensive and conflate expected outcomes with unexpected errors.

A Result-based pattern was adopted. No formal evaluation of alternative libraries (such as `OneOf` or `ErrorOr`) was conducted. The team implemented a custom `Result<T>` type as a shared primitive in the Shared library.

---

## Decision

A custom **`Result<T>` type** is used throughout the backend to represent the explicit outcome of operations. All handlers return `Result<T>`. The API layer maps Result outcomes to appropriate HTTP responses.

---

## Alternatives Considered

### Exceptions for All Error Cases

**Pros:**
- Built into .NET; no additional type required

**Cons:**
- Exceptions are expensive when used for control flow
- Forces callers to use try/catch for expected business scenarios
- Makes error paths implicit rather than explicit in method signatures

> No formal evaluation of `OneOf`, `ErrorOr`, or other Result libraries was conducted. The custom `Result<T>` implementation was chosen for simplicity and full control over the type's behaviour.

---

## Consequences

### Positive
- Error handling is explicit — method signatures communicate that an operation can fail
- Reduces use of exceptions for expected, non-exceptional scenarios
- Improves readability of handler logic and control flow
- Centralised in the Shared library, available to all modules consistently

### Negative
- Custom type requires team familiarity with the pattern
- More verbose than throwing exceptions

### Risks
- Without consistent enforcement, developers may mix exception-based and Result-based error handling

---

## Dependencies

- ADR-006: CQRS with MediatR

---

## References

- `Maintainability.docx` — Shared library description: "the `Result<T>` error type, ErrorCode, the validation pipeline behavior"

---

## Confidence Assessment

Use of `Result<T>` is confirmed by documentation. No formal alternatives evaluation was documented; stated explicitly. The custom implementation detail is inferred from the Shared library description.

# ADR-028: Code Formatting Standards — Prettier and CSharpier

## Status
Accepted

## Date
2026

---

## Context

A consistent code formatting standard is required to ensure the codebase remains readable and maintainable across all team members. Without automated formatting enforcement, code style inconsistencies accumulate over time and create noise in code reviews.

---

## Decision

**Prettier** is used for frontend code formatting (TypeScript, React). **CSharpier** is used for backend code formatting (C#). Both are enforced as CI quality gates — no pull request can be merged with formatting violations.

---

## Alternatives Considered

No formal evaluation of alternative formatting tools was documented. Prettier and CSharpier are the established standard formatters for their respective ecosystems.

---

## Consequences

### Positive
- Consistent formatting across all code, regardless of developer or IDE
- Formatting disputes are eliminated — the formatter is the authority
- Code reviews focus on logic and design rather than formatting
- Automated enforcement in CI prevents unformatted code from reaching the main branch

### Negative
- Developers must configure their IDE to use the correct formatter
- Some opinionated formatting choices may conflict with individual preferences

### Risks
- None identified beyond minor developer setup friction

---

## Dependencies

- ADR-019: CI/CD Pipeline Strategy

---

## References

- `Quality Document` — Sections 3.2.5, 3.3.1, 3.4 Quality Gates table

---

## Confidence Assessment

Fully supported by documentation.

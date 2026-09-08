# ADR-018: Static Code Analysis with SonarQube and ESLint

## Status
Accepted

## Date
2026

---

## Context

The primary stakeholder explicitly requires a clean, maintainable codebase that can be handed over and extended by future developers. The team identified a risk that AI-generated code (used during development) could reduce maintainability if not subject to the same quality standards as handwritten code. A static analysis strategy was needed to enforce quality standards consistently.

---

## Decision

**SonarQube** is used for backend static analysis (C#). **ESLint** is used for frontend static analysis (TypeScript/React). Both are integrated into the CI/CD pipeline and enforced as quality gates on every pull request.

---

## Alternatives Considered

No formal evaluation of alternative static analysis tools was documented. SonarQube and ESLint are the established standard tools for their respective ecosystems.

---

## Consequences

### Positive
- Automated detection of code smells, security vulnerabilities, and maintainability risks
- Enforced consistently via CI — no code reaches the main branch without passing analysis
- Directly addresses the risk of AI-generated code reducing maintainability
- Cyclomatic complexity and function length limits enforced automatically (≤10 complexity, ≤100 lines per function)
- Zero issues required before a PR can be merged

### Negative
- SonarQube requires a running instance (self-hosted or SonarCloud) to be configured in the CI pipeline
- False positives can slow development if rules are not carefully calibrated

### Risks
- Overly strict SonarQube rules may flag acceptable patterns, requiring rule tuning

---

## Dependencies

- ADR-019: CI/CD Pipeline Strategy

---

## References

- `Applicatie Stack.docx` — Code Quality section
- `Quality Document` — Section 3.2.4, 3.4 Quality Gates, fit criteria for Maintainability

---

## Confidence Assessment

Fully supported by documentation.

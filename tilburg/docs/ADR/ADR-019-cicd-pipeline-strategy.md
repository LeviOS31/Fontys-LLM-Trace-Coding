# ADR-019: CI/CD Pipeline Strategy

## Status
Accepted

## Date
2026

---

## Context

The project requires automated, repeatable quality validation to enforce its Definition of Done. Manual quality checks at scale are inconsistent and error-prone. A CI/CD pipeline was designed to enforce quality gates at two levels: pull requests to the development branch, and pull requests to the main branch.

---

## Decision

A **GitHub Actions CI/CD pipeline** is implemented with the following gate structure:

- **On every pull request to dev:** linting, format check, static code analysis, build validation, unit tests
- **On pull request to main and nightly:** all of the above, plus end-to-end tests
- **Nightly:** full pipeline runs on workdays

No code is merged unless all applicable checks pass.

---

## Alternatives Considered

No formal evaluation of alternative CI platforms was documented. GitHub Actions was selected as the natural choice given the project uses GitHub as its repository host (ADR-002).

---

## Consequences

### Positive
- Quality is enforced consistently and automatically — human error in quality checking is eliminated
- The pipeline is the enforcement mechanism for the Definition of Done
- Nightly runs catch regressions introduced by accumulated changes
- E2E tests on the main branch gate provide a final functional verification before release

### Negative
- Pipeline configuration must be maintained as the project evolves
- E2E tests add execution time to the pipeline

### Risks
- Flaky E2E tests can block the pipeline and require investigation time

---

## Dependencies

- ADR-002: Monorepo Repository Structure
- ADR-018: Static Code Analysis with SonarQube and ESLint

---

## References

- `Quality Document` — Section 3.2.6, 3.4 Quality Gates table

---

## Confidence Assessment

Fully supported by documentation.

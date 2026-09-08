# ADR-002: Monorepo Repository Structure

## Status
Accepted

## Date
2026

---

## Context

The project consists of two primary codebases: a Next.js frontend and a .NET backend. A decision was required on whether to host these in separate repositories or a single unified repository.

For a platform where the frontend and backend must evolve closely together — for example, adding a new trace import feature requires both a backend endpoint and a corresponding frontend component — the repository strategy directly affects development velocity, versioning, and CI/CD complexity.

---

## Decision

The entire codebase — frontend (Next.js), backend (.NET), and shared configuration — is maintained in a **single GitHub monorepo**.

---

## Alternatives Considered

### Separate Repositories (Polyrepo)

**Pros:**
- Clear ownership boundary per codebase
- Independent versioning per service

**Cons:**
- Full-stack features require coordinated commits and PRs across two repositories
- Versioning synchronisation between frontend and backend becomes an explicit overhead
- CI/CD pipelines must coordinate across repositories
- Harder to enforce end-to-end test coverage across both codebases in a single pipeline

---

## Consequences

### Positive
- Full-stack features can be built and submitted in a single pull request
- Unified versioning ensures frontend and backend are always in sync
- End-to-end testing is simpler to configure within one pipeline
- Eliminates synchronisation overhead between separate repositories
- Recommended approach confirmed by teaching staff

### Negative
- Repository grows in size as both codebases expand
- CI pipeline must be configured to detect which parts of the codebase changed to avoid unnecessary full builds

### Risks
- Without careful pipeline scoping, all CI jobs run on every change regardless of which codebase was modified

---

## Dependencies

- ADR-003: C# .NET 10 Backend
- ADR-007: React and TypeScript Frontend
- ADR-019: CI/CD Pipeline Strategy

---

## References

- `Applicatie Stack.docx` — Repository section

---

## Confidence Assessment

Fully supported by project documentation.

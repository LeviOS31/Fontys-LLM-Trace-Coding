# ADR-010: React-Resizable-Panels for Resizable UI Layout

## Status
Accepted

## Date
2026

---

## Context

The platform's coding interface requires resizable panel layouts, allowing users to adjust the space allocated to the trace list, detail view, and coding panels. A dedicated library was required for this functionality.

The primary constraint was that the project already uses Radix UI as its component library, which is a comprehensive solution for most UI components. Any additional library needed to be small and focused to avoid bundle bloat and conflicts with existing dependencies.

---

## Decision

**`react-resizable-panels`** is used to implement resizable panel layouts.

---

## Alternatives Considered

### Other Resizable Panel Libraries Bundled Within Larger Packages

**Pros:**
- Potentially more features

**Cons:**
- Bundled into larger packages that conflicted with the existing Radix UI library
- Required significantly more setup and configuration effort
- Introduced features not needed by the project

No suitable small, standalone alternatives were identified during evaluation.

---

## Consequences

### Positive
- Specifically built for React, providing native integration with the frontend stack
- Minimal footprint — focused solely on resizable panel functionality
- No conflicts with Radix UI
- Low configuration overhead

### Negative
- Introduces an additional library dependency for a single UI concern

### Risks
- Small, focused libraries can have less active maintenance communities than larger frameworks

---

## Dependencies

- ADR-007: React with Next.js and TypeScript
- ADR-009: Radix UI Component Library

---

## References

- Team-provided information: library evaluation during frontend dependency selection

---

## Confidence Assessment

Based on team-provided information. Not documented in the provided project documentation. Assumptions about conflict with larger libraries and absence of suitable standalone alternatives are stated as provided by the team.

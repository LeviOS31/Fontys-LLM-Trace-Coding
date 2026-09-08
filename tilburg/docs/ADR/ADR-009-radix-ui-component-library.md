# ADR-009: Radix UI as Frontend Component Library

## Status
Accepted

## Date
2026

---

## Context

Building accessible, consistent UI components from scratch is time-consuming. The platform requires a component library that supports rapid development, provides accessible components, enables custom styling, and supports keyboard shortcuts — a specific requirement from the product owner for power user support.

---

## Decision

**Radix UI** is used as the headless UI component library for the frontend.

---

## Alternatives Considered

### Heavy UI Frameworks (e.g., Material UI, Ant Design, Chakra UI)

**Pros:**
- Pre-styled, complete out-of-the-box look

**Cons:**
- Opinionated styling that is difficult to override
- Large bundle sizes
- Can conflict with custom design systems
- Less control over keyboard interaction behaviour

---

## Consequences

### Positive
- Headless (unstyled) components give full control over visual design
- Accessibility is built-in, reducing the need to implement ARIA patterns manually
- Lightweight — does not introduce a heavy UI framework overhead
- Supports keyboard shortcuts, directly satisfying the power user requirement (NFR and product owner expectation)
- Consistent component behaviour across the application

### Negative
- Styling must be written manually; more initial CSS/design work compared to pre-styled libraries

### Risks
- None identified beyond standard library dependency risk

---

## Dependencies

- ADR-007: React with Next.js and TypeScript

---

## References

- `Applicatie Stack.docx` — UI Component Library section

---

## Confidence Assessment

Fully supported by documentation.

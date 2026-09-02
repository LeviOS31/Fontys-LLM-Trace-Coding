# ADR-021: Microsoft.Extensions.AI as AI Integration Abstraction Layer

## Status
Accepted

## Date
2026

---

## Context

The platform integrates with LLM providers to support axial code generation, open code suggestions, and prompt template generation. The primary LLM backend is a local Ollama instance. However, the requirements explicitly state that the system must support future LLM provider alternatives (e.g., cloud-based providers such as Fontys AI) without requiring changes to core application logic.

A direct integration with Ollama's HTTP API would create vendor lock-in at the application level.

---

## Decision

**Microsoft.Extensions.AI** is used as an abstraction layer over LLM provider integrations. All application code interacts with the AI abstraction interface; provider-specific implementations are confined to the integration layer.

---

## Alternatives Considered

### Direct Ollama HTTP Client Integration

**Pros:**
- No additional dependency
- Full control over API calls

**Cons:**
- Creates vendor lock-in — switching providers requires changes throughout application code
- Violates the Separation of Concerns principle documented in the Quality Document

### Semantic Kernel Directly (Without Microsoft.Extensions.AI Abstraction)

**Pros:**
- Powerful AI orchestration capabilities

**Cons:**
- Semantic Kernel's abstraction layer is heavier and more opinionated
- Microsoft.Extensions.AI provides a lighter, more composable abstraction compatible with the broader .NET ecosystem

---

## Consequences

### Positive
- Swapping LLM providers requires changes only within the integration layer, not throughout the application
- Supports the documented future migration path to cloud-based providers
- Aligns with the Separation of Concerns architectural principle
- Microsoft.Extensions.AI is a first-party Microsoft library with long-term support aligned with .NET LTS

### Negative
- Abstractions may lag behind provider-specific features or capabilities

### Risks
- Microsoft.Extensions.AI is a relatively new library; its API surface may evolve with breaking changes

---

## Dependencies

- ADR-003: C# .NET 10 Backend
- ADR-017: Human-in-the-Loop Design Principle
- ADR-022: Local-First Deployment Constraint

---

## References

- `Applicatie Stack.docx` — Backend section (Semantic Kernel reference)
- `Quality Document` — Section 3.1.3 Separation of Concerns (LLM integration layer isolation)
- `Requirementsdocument` — FR-36, FR-37, RV-02, NFR-08

---

## Confidence Assessment

Use of Microsoft.Extensions.AI is confirmed by team-provided information. The LLM abstraction principle is corroborated by documentation. The library name is not explicitly referenced in the provided project documents; stated explicitly.

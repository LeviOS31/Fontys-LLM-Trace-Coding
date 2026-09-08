# ADR-003: C# and .NET 10 LTS as Backend Technology

## Status
Accepted

## Date
2026

---

## Context

A backend language and framework needed to be selected for the LLM-Trace Coding Platform. The platform works intensively with LLMs, requires a clean modular architecture, and must be maintainable by the team over the project period and by future developers thereafter. Four options were formally evaluated.

---

## Decision

The backend is implemented using **C# with ASP.NET Core on .NET 10 LTS**, using Semantic Kernel as the AI orchestration framework.

---

## Alternatives Considered

### Python (FastAPI or Django with LangChain or LlamaIndex)

**Pros:**
- Industry standard for AI development
- Best native integration with LLM libraries out of the box
- Largest AI ecosystem

**Cons:**
- Dynamically typed; harder to maintain strict, error-free codebases at scale
- Higher risk of technical debt in a complex, long-lived codebase
- Weaker architectural enforcement than statically typed alternatives

### Java (Spring Boot with Spring AI or LangChain4j)

**Pros:**
- Strong team familiarity with Java
- Mature framework with excellent scalability, security, and architecture support

**Cons:**
- AI ecosystem slightly behind Python and C# at time of decision
- Spring AI integration can feel verbose
- Slower AI prototyping cycle

### Go (Golang with Gin/Fiber and LangChainGo)

**Pros:**
- Excellent performance and low memory usage
- Statically typed, compiles to a single binary
- Ollama itself is built in Go

**Cons:**
- AI orchestration ecosystem (agents, memory, complex workflows) less mature and poorly documented
- No team experience with Go, reducing initial development velocity

---

## Consequences

### Positive
- Strong typing reduces runtime errors and improves long-term maintainability
- .NET 10 LTS provides a stable, supported foundation for the project lifetime
- Semantic Kernel provides enterprise-ready AI orchestration (prompts, agents, memory) competitive with LangChain
- ASP.NET Core Minimal API supports clean, testable backend structure
- Aligns with team experience and existing knowledge

### Negative
- The latest bleeding-edge AI community libraries and experimental models often appear in Python first before being ported to C#

### Risks
- Dependency on Microsoft's continued investment in Semantic Kernel and AI tooling for .NET

---

## Dependencies

- ADR-001: Modular Monolith Architecture
- ADR-006: CQRS with MediatR
- ADR-021: Microsoft.Extensions.AI Abstraction Layer

---

## References

- `Applicatie Stack.docx` — Backend section, alternatives evaluation

---

## Confidence Assessment

Fully supported. All four alternatives are explicitly evaluated in Applicatie Stack.docx with documented pros and cons.

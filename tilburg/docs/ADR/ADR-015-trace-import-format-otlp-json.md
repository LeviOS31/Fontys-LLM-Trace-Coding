# ADR-015: Trace Import Format — OTLP/JSON with OpenLLMetry

## Status
Accepted

## Date
2026

---

## Context

The platform must import LLM traces from real-world LLM-powered applications. A decision was required on which file types and formats to support. Supporting too many formats increases implementation complexity unnecessarily; supporting formats not used in practice reduces the platform's relevance.

A formal research study was conducted (`Research - Traces Format.docx`) using literature study, available product analysis, and a C# parsing prototype.

---

## Decision

The platform supports **JSONL files formatted using OTLP/JSON with OpenLLMetry semantic conventions** as the primary trace import format.

---

## Alternatives Considered

### CSV

**Pros:**
- Simple, widely understood

**Cons:**
- Requires a fixed column schema upfront
- LLM traces have variable attributes and variable chat lengths — CSV cannot represent this flexibly
- Not scalable for LLM trace data

### YAML

**Pros:**
- Human-readable

**Cons:**
- No popular standardisation for LLM traces
- No LLM-powered applications found during research that export traces in YAML format

### Plain JSON (Without OTLP Standardisation)

**Pros:**
- Flexible

**Cons:**
- No standardised structure — each application would produce different JSON shapes
- Would require custom parsing per source application

---

## Consequences

### Positive
- OTLP/JSON is the standardised export format of OpenTelemetry, the most widely adopted observability platform
- OpenLLMetry defines 23 standardised LLM-specific attributes, ensuring sufficient context for quality analysis
- Supporting one well-adopted standard avoids unnecessary complexity while covering diverse real-world LLM applications
- Future-proof: the standard is actively maintained by the community
- C# parsing prototype confirmed technical feasibility using `Newtonsoft.Json` + `Google.Protobuf` + OpenTelemetry `.proto` files

### Negative
- Applications not instrumented with OpenTelemetry/OpenLLMetry cannot import traces without pre-processing
- Not all OpenLLMetry attributes are present in every trace (e.g., `gen_ai.request.reasoning_summary` is OpenAI-specific)

### Risks
- Emerging proprietary trace formats from major LLM providers (OpenAI, Anthropic) were not evaluated and may gain adoption
- Prototype was not tested with malformed or very large trace files

---

## Dependencies

- ADR-003: C# .NET 10 Backend
- Functional Requirement FR-09 (JSON trace import)

---

## References

- `Research - Traces Format.docx` — full research paper and prototype

---

## Confidence Assessment

Fully supported by formal research documentation including a working prototype.

# ADR-022: Local-First Deployment with No Mandatory External Dependencies

## Status
Accepted

## Date
2026

---

## Context

The platform is designed for researchers and engineers who analyse LLM outputs. A key stakeholder requirement is that the platform runs entirely on local hardware without requiring external servers or commercial LLM services. This protects data privacy, eliminates running costs, and enables use in environments without reliable internet connectivity.

---

## Decision

The platform is **local-first**: all data is stored within the platform on local hardware, and no mandatory dependency on external commercial LLM services exists. The default LLM backend is a local Ollama instance. All services run via `docker compose up` on the user's own machine.

---

## Alternatives Considered

### Cloud-Hosted Deployment with Cloud LLM Providers

**Pros:**
- No hardware requirements for users
- Access to more powerful LLM models

**Cons:**
- Violates the data privacy requirement — user data would leave the local environment
- Introduces running costs
- Creates mandatory dependency on external commercial services (explicitly excluded: RV-02)
- Requires internet connectivity

---

## Consequences

### Positive
- All data remains on the user's hardware — no data leaves the local environment (NFR-09, RV-03)
- No mandatory external service costs
- Works in offline or restricted network environments
- Users retain full control of their data
- Architecture remains cloud-migratable without core code changes (portability criterion)

### Negative
- LLM performance is bounded by local hardware capabilities (16–32 GB RAM target)
- Users must have Docker installed and sufficient hardware resources

### Risks
- Local Ollama models may produce lower quality outputs than cloud-hosted models for some use cases

---

## Dependencies

- ADR-014: Docker and Docker Compose
- ADR-021: Microsoft.Extensions.AI Abstraction Layer

---

## References

- `Requirementsdocument` — RV-01, RV-02, RV-03, RV-04, NFR-09, NFR-11, NFR-14
- `Product Canvas.docx` — Lokale Performance success criterion

---

## Confidence Assessment

Fully supported by documentation.

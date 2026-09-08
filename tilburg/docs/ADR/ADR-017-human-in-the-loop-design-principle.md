# ADR-017: Human-in-the-Loop as a Core Design Principle

## Status
Accepted

## Date
2026

---

## Context

The platform uses AI (LLMs) to assist with tasks including axial code grouping and prompt template generation. A fundamental architectural decision is whether AI outputs are applied automatically or always require user confirmation before being persisted.

Given the research context (quality evaluation of AI-generated outputs), automatically trusting AI outputs would undermine the platform's purpose. The platform is explicitly designed to evaluate and correct AI behaviour, not to automate it unconditionally.

---

## Decision

**All AI-generated outputs require explicit user confirmation before being persisted.** No AI action is applied automatically without human review. This is defined as the Human-in-the-Loop (HITL) principle and is enforced throughout the system design.

---

## Alternatives Considered

### Automatic AI Output Persistence

**Pros:**
- Faster workflow for high-confidence operations

**Cons:**
- Contradicts the platform's purpose of evaluating AI quality
- Removes user agency, violating the stated design principle
- Explicitly excluded in the requirements: automatic decision-making without user confirmation is listed as out-of-scope

---

## Consequences

### Positive
- Users retain full control over all data in the system
- AI-generated outputs are clearly distinguished from user-entered data (NFR-10)
- Supports the platform's research purpose — users evaluate and correct AI outputs systematically
- All AI suggestions are presented as editable drafts

### Negative
- Adds confirmation steps that slow the workflow compared to fully automated processing

### Risks
- User fatigue from repeated confirmation steps could reduce adoption for large-scale analysis tasks

---

## Dependencies

- ADR-021: Microsoft.Extensions.AI Abstraction Layer
- Functional Requirements FR-18, FR-19, FR-22
- Non-Functional Requirement NFR-10
- Constraint RV-02

---

## References

- `Product Canvas.docx` — Human-in-the-Loop section
- `Requirementsdocument` — Scope (Out-of-Scope: automatic decision-making), NFR-10
- `Quality Document` — Usability fit criteria: "All LLM suggestions are presented as editable drafts. No AI output is persisted without explicit user confirmation"

---

## Confidence Assessment

Fully supported across multiple documents. Explicitly documented as both an architectural principle and a quality criterion.

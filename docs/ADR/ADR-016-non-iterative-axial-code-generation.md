# ADR-016: Non-Iterative Axial Code Generation per Project Version

## Status
Accepted

## Date
2026

---

## Context

The platform supports multiple versions of a project, enabling comparison of LLM output quality across iterations. When a new version is evaluated, a decision is required on whether to reuse axial codes from previous versions or generate new axial codes fresh from the current version's open codes.

A formal research study was conducted (`Research - Reuse of Axial Codes.docx`) simulating five consecutive versions with 30 open codes each, comparing iterative (reuse) and non-iterative (fresh generation) approaches.

---

## Decision

Axial codes are generated **fresh per project version** from the open codes within that version only. Existing axial codes from previous versions are not directly reused in the automated grouping process.

---

## Alternatives Considered

### Iterative Reuse of Existing Axial Codes

Process: new open codes are assigned to existing axial codes; new axial codes are created only when no existing category fits.

**Pros:**
- Maintains consistent category labels across versions
- Supports direct comparison of axial code distributions between versions

**Cons:**
- Research demonstrated quality degradation across successive versions: average reviewer comments increased from ~4.5 in version 1 to ~9 in version 5 for the iterative approach, versus ~4 for the non-iterative approach
- Forces new open codes into existing categories even when the LLM output has evolved
- Reduces the flexibility to capture genuinely new or evolving failure patterns

---

## Consequences

### Positive
- Each version's axial codes accurately reflect the patterns present in that version's traces
- Categorisation quality remains consistent across versions
- No accumulating bias from prior axial code sets

### Negative
- Axial code labels may differ between versions, requiring manual alignment for cross-version comparison
- Users must manually review and reconcile axial code names across versions when performing comparative analysis

### Risks
- The research was conducted with a single LLM model (`qwen3.5:397b`) and sets of 30 open codes; results may vary with different models or larger datasets
- Prompt design significantly influences output quality and was not exhaustively evaluated

---

## Dependencies

- Functional Requirements FR-19, FR-20, FR-28

---

## References

- `Research - Reuse of Axial Codes.docx` — research design, results, and conclusion

---

## Confidence Assessment

Fully supported by formal research documentation with empirical results.

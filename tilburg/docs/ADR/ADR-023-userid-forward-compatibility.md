# ADR-023: UserId Integration for Future Multi-User Support

## Status
Accepted

## Date
2026

---

## Context

Authentication, multi-tenant user management, and RBAC are explicitly out of scope for the current project phase. However, the platform may in the future support multiple concurrent users in a hosted environment. Adding UserId to the data model after the fact would require significant database migrations and application-level changes across all modules.

---

## Decision

**UserId fields and ownership checks (`IUserOwned`)** are implemented throughout the data model and application layer now, as a forward-compatibility measure. No login system, authentication provider, or user management UI is implemented in the current phase.

---

## Alternatives Considered

### Add UserId Only When Authentication Is Implemented

**Pros:**
- No unnecessary complexity in the current phase

**Cons:**
- Would require schema migrations across all entities at a later stage
- Would require ownership checks to be added throughout handler logic retrospectively
- Higher refactoring cost and risk of missing data isolation at a later stage

---

## Consequences

### Positive
- Future authentication implementation requires only adding a login mechanism and populating UserId — no schema migrations or handler logic changes needed
- Data ownership isolation is already structurally present in the codebase
- Reduces future migration complexity and risk

### Negative
- Adds fields and checks to the current codebase that serve no active function
- Could confuse developers unfamiliar with the forward-compatibility intent

### Risks
- If the authentication approach chosen in the future does not align with the current UserId model, adaptation may still be required
- No specific authentication provider (e.g., ASP.NET Core Identity, Keycloak, OAuth2) has been selected or anticipated at this stage

---

## Dependencies

- ADR-001: Modular Monolith Architecture

---

## References

- `Maintainability.docx` — Shared library description: `IUserOwned` interface
- Team-provided information

---

## Confidence Assessment

`IUserOwned` is confirmed in Maintainability.docx. Forward-compatibility intent is team-provided. No authentication provider has been selected or anticipated at this stage; stated explicitly.

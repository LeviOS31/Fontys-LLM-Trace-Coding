# ADR-012: RESTful API Design

## Status
Accepted

## Date
2026

---

## Context

A communication protocol between the frontend and backend needed to be selected. The platform is a web application where the frontend (Next.js) communicates with the backend (.NET) over HTTP. The API design style needed to be stateless, well-understood by the team, and compatible with standard tooling.

---

## Decision

The backend exposes a **RESTful API** over HTTP.

---

## Alternatives Considered

### GraphQL

**Pros:**
- Flexible querying — clients request exactly the fields they need
- Reduces over-fetching for complex nested data

**Cons:**
- More complex to implement and maintain
- Caching is more complex than HTTP-level caching
- Overhead disproportionate to the platform's UI needs

### gRPC

**Pros:**
- High performance binary protocol
- Strong typing via protobuf

**Cons:**
- Poor browser support without additional proxying
- Not suitable as a primary browser-to-backend API

---

## Consequences

### Positive
- Industry standard — well understood by all team members
- Stateless design aligns with the platform's request/response model
- Clear separation between frontend and backend via HTTP contract
- Compatible with standard tooling (Swagger/OpenAPI, Postman, browser dev tools)
- Aligns with Next.js fetch patterns and standard HTTP client libraries

### Negative
- REST can lead to over-fetching or under-fetching for complex UI screens that require data from multiple resources

### Risks
- None identified for the current scope

---

## Dependencies

- ADR-003: C# .NET 10 Backend
- ADR-007: React with Next.js and TypeScript

---

## References

- `Applicatie Stack.docx` — API section

---

## Confidence Assessment

Fully supported by documentation.

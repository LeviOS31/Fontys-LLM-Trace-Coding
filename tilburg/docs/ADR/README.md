# Architecture Decision Records — LLM-Trace Coding Platform

This document serves as the index for all Architecture Decision Records (ADRs) produced for the LLM-Trace Coding Platform project (Fontys University of Applied Sciences ICT, CSS1T, 2026).

ADRs are intended for assessors, future developers, and project handover purposes.

---

## Index

| ADR | Title | Status | Evidence |
|---|---|---|---|
| [ADR-001](ADR-001-modular-monolith-architecture.md) | Modular Monolith Architecture | Accepted | Project documentation |
| [ADR-002](ADR-002-monorepo-repository-structure.md) | Monorepo Repository Structure | Accepted | Project documentation |
| [ADR-003](ADR-003-csharp-dotnet10-backend.md) | C# and .NET 10 LTS as Backend Technology | Accepted | Project documentation |
| [ADR-004](ADR-004-separate-dbcontext-per-module.md) | Separate DbContext per Module | Accepted | Project documentation |
| [ADR-005](ADR-005-contracts-pattern-inter-module-communication.md) | Contracts Pattern for Inter-Module Communication | Accepted | Project documentation |
| [ADR-006](ADR-006-cqrs-mediatr.md) | CQRS Pattern with MediatR within Modules | Accepted | Project documentation + team |
| [ADR-007](ADR-007-react-nextjs-typescript-frontend.md) | React with Next.js and TypeScript as Frontend Technology | Accepted | Project documentation |
| [ADR-008](ADR-008-fluentvalidation-mediatr-pipeline.md) | FluentValidation in the MediatR Pipeline | Accepted | Project documentation + team |
| [ADR-009](ADR-009-radix-ui-component-library.md) | Radix UI as Frontend Component Library | Accepted | Project documentation |
| [ADR-010](ADR-010-react-resizable-panels.md) | React-Resizable-Panels for Resizable UI Layout | Accepted | Team-provided |
| [ADR-011](ADR-011-postgresql-primary-database.md) | PostgreSQL as the Primary Database | Accepted | Project documentation |
| [ADR-012](ADR-012-restful-api-design.md) | RESTful API Design | Accepted | Project documentation |
| [ADR-013](ADR-013-result-pattern-error-handling.md) | Result Pattern for Error Handling | Accepted | Project documentation + team |
| [ADR-014](ADR-014-docker-docker-compose.md) | Docker and Docker Compose for Containerisation | Accepted | Project documentation |
| [ADR-015](ADR-015-trace-import-format-otlp-json.md) | Trace Import Format — OTLP/JSON with OpenLLMetry | Accepted | Research document |
| [ADR-016](ADR-016-non-iterative-axial-code-generation.md) | Non-Iterative Axial Code Generation per Project Version | Accepted | Research document |
| [ADR-017](ADR-017-human-in-the-loop-design-principle.md) | Human-in-the-Loop as a Core Design Principle | Accepted | Project documentation |
| [ADR-018](ADR-018-static-code-analysis-sonarqube-eslint.md) | Static Code Analysis with SonarQube and ESLint | Accepted | Project documentation |
| [ADR-019](ADR-019-cicd-pipeline-strategy.md) | CI/CD Pipeline Strategy | Accepted | Project documentation |
| [ADR-020](ADR-020-testing-strategy.md) | Testing Strategy — Unit, E2E, TDD, and BDD | Accepted | Project documentation |
| [ADR-021](ADR-021-microsoft-extensions-ai-abstraction.md) | Microsoft.Extensions.AI as AI Integration Abstraction Layer | Accepted | Project documentation + team |
| [ADR-022](ADR-022-local-first-deployment.md) | Local-First Deployment with No Mandatory External Dependencies | Accepted | Project documentation |
| [ADR-023](ADR-023-userid-forward-compatibility.md) | UserId Integration for Future Multi-User Support | Accepted | Project documentation + team |
| [ADR-024](ADR-024-iqueryable-ilike-dynamic-filtering.md) | IQueryable with PostgreSQL ILike for Dynamic Filtering | Accepted | Team-provided |
| [ADR-025](ADR-025-hasOpenCode-denormalised-trace.md) | HasOpenCode Property Denormalised on Trace Entity | Accepted | Team-provided |
| [ADR-026](ADR-026-migration-runner-modular-migrations.md) | Migration Runner for Modular Database Migrations | Accepted | Team-provided |
| [ADR-027](ADR-027-ai-assisted-frontend-design-lovable.md) | AI-Assisted Frontend Design with Lovable | Accepted | Team-provided |
| [ADR-028](ADR-028-code-formatting-prettier-csharpier.md) | Code Formatting Standards — Prettier and CSharpier | Accepted | Project documentation |

---

## Evidence Legend

| Label | Meaning |
|---|---|
| Project documentation | Decision is fully supported by one or more provided project documents |
| Research document | Decision is supported by a formal research paper produced as part of the project |
| Project documentation + team | Decision is confirmed in documentation and supplemented by team-provided context |
| Team-provided | Decision is based on team-provided information; not explicitly documented in provided project documents |

---

## Dependency Overview

The following diagram summarises the key dependencies between ADRs.

```
ADR-001 Modular Monolith
  ├── ADR-004 Separate DbContext
  │     └── ADR-026 Migration Runner
  ├── ADR-005 Contracts Pattern
  │     └── ADR-006 CQRS + MediatR
  │           └── ADR-008 FluentValidation
  │           └── ADR-013 Result Pattern
  └── ADR-014 Docker / Docker Compose
        └── ADR-022 Local-First Deployment
              └── ADR-021 Microsoft.Extensions.AI

ADR-002 Monorepo
  └── ADR-019 CI/CD Pipeline
        └── ADR-018 Static Analysis
        └── ADR-020 Testing Strategy
        └── ADR-028 Code Formatting

ADR-003 C# .NET 10
  └── ADR-006 CQRS + MediatR
  └── ADR-021 Microsoft.Extensions.AI

ADR-007 React + Next.js + TypeScript
  └── ADR-009 Radix UI
  └── ADR-010 React-Resizable-Panels
  └── ADR-027 AI-Assisted Design (Lovable)

ADR-011 PostgreSQL
  └── ADR-024 IQueryable + ILike
  └── ADR-025 HasOpenCode Denormalised
  └── ADR-026 Migration Runner
```

---

*Generated as part of the LLM-Trace Coding Platform project — Fontys ICT CSS1T 2026.*

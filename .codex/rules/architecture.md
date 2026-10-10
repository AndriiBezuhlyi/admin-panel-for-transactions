# Architecture

- `src/app`: application providers, router, query client, and shared layout.
- `src/pages`: route-level screens that compose features.
- `src/features/transactions`: transaction domain logic, validation, queries, aggregation, and UI.
- `src/features/exchange-rates`: exchange-rate logic, validation, queries, and UI.
- `src/shared/api`: shared HTTP client and safe application errors.
- `src/shared/lib`: reusable domain-agnostic utilities.
- `src/shared/ui`: reusable UI shared across features.

## Boundaries

- Keep providers and routing in the application layer.
- Pages compose features and should not own substantial domain logic.
- Features own their domain-specific logic, data access, validation, and UI.
- Shared modules must remain domain-agnostic.
- `shared` must not import from `pages` or feature-specific modules.
- Avoid circular dependencies.

## Shared Code

- Move code to `shared` only when it has a real cross-feature use case.
- Do not create shared abstractions for a single consumer.
- If features need common domain-independent behavior, extract only the part that is genuinely shared.

## Routing and State

- Keep route definitions in the application layer.
- Preserve direct navigation and reload support for application routes.
- Prefer existing server state, URL state, and local component state before introducing another global state solution.

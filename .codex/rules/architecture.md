# Architecture

- `src/app`: application providers, query client, router, and shared layout.
- `src/pages`: route screens composing feature modules; pages are loaded lazily by `src/app/router.tsx`.
- `src/features/transactions`: transaction model, validation, queries, financial aggregation, and transaction UI.
- `src/features/exchange-rates`: rate validation, queries, and currency-rate UI.
- `src/shared/api`: HTTP client and safe application errors.
- `src/shared/lib`: reusable non-React utilities such as the configured decimal implementation.
- `src/shared/ui`: small UI elements shared across features.
- `src/test`, colocated `*.test.ts(x)`, and `e2e`: test infrastructure and cases.

Keep providers and routing at the application boundary. Pages compose features; feature modules own their domain behavior. Shared code must not import pages or feature-specific code. Avoid circular imports and abstractions without real consumers.

Preserve existing working boundaries during focused changes. If a dependency between features becomes problematic, propose or perform only the extraction needed by the authorized task. Do not restructure the entire project to satisfy an abstract architecture pattern.

Prefer established dependencies and platform APIs. Keep TypeScript strict, npm, Vite, and the current styling approach. Major changes outside the authorized scope require approval; do not request it again for changes already explicitly approved.

Maintain route error and loading fallbacks. Adding a page does not require a new state manager or a framework migration. Production hosting must support an `index.html` fallback for browser routes and direct detail links.

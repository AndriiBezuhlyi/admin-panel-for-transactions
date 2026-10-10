# Project Context

## Product

Finance Panel is a transaction dashboard for connected businesses.

Current screens:

- dashboard;
- transactions;
- transaction details;
- exchange rates;
- currency converter.
- data sources, including shared fetch status, current currency-rate coverage, known limitations, and clearly labeled historical audit observations.

User-facing UI is Ukrainian.

## Stack

- React + Vite + TypeScript.
- React Router Data Mode with lazy page modules.
- TanStack Query for server state.
- React state and Ant Design Form for local interaction.
- Ant Design + CSS Modules; global styles in `src/index.css`.
- Zod for API validation.
- `decimal.js` for monetary calculations.
- Vitest + React Testing Library + Playwright.

Use `package.json` and `package-lock.json` as the source of truth for dependencies and versions.

## Routes and Layout

Routes:

- `/dashboard`
- `/transactions`
- `/transactions/:id`
- `/exchange-rates`
- `/converter`
- `/data-sources`

`/` redirects to `/dashboard`.

The dashboard uses a compact desktop layout with panel scrolling and must remain usable on mobile without page-wide overflow.

## Current Backend Limitations

Finance endpoints currently provide:

- no stable transaction IDs;
- no transaction dates;
- no authentication or business isolation;
- no mutation endpoints;
- no server-side pagination.

Transaction detail IDs currently use source + array index and are not stable after response reordering.

Search and pagination are currently client-side.

Do not assume unavailable backend fields or capabilities.

For large datasets, backend pagination and aggregates will be required instead of loading the full dataset.

## Migration

`oldFiles` was removed after migration.

`.migration-backup` is a local history archive, not an application dependency.

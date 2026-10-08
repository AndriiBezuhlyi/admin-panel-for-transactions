# Project Context

## Product

Finance Panel is a transaction dashboard intended to help connected businesses inspect financial data. Current screens are overview, transactions, transaction details, exchange rates, and a currency converter. User-facing UI is Ukrainian; communicate with the user in Ukrainian. Use English for new developer documentation, comments, and identifiers; do not translate existing content as unrelated cleanup.

## Established Stack

- React + Vite + TypeScript with strict checking.
- React Router Data Mode, with lazy page modules.
- TanStack Query for server state; React state and Ant Design Form for local interaction.
- Ant Design for UI, forms, and tables; CSS Modules for layout, `src/index.css` for global styles.
- Zod for runtime API validation; `decimal.js` for monetary calculations.
- npm and `package-lock.json`; ESLint, Prettier, Vitest, React Testing Library, and Playwright.

Use `package.json` and the lock file for actual dependency versions; do not add Next.js, Redux, Zustand, or another UI system without an approved concrete need.

## Existing Routes and Layout

`/` redirects to `/dashboard`. Other routes are `/transactions`, `/transactions/:id`, `/exchange-rates`, and `/converter`.

The overview puts currency rates on the left, the USD summary and separate original USD/EUR totals in the center, and all transactions on the right. Preserve its compact desktop layout and panel scrolling; keep the mobile layout usable without page-wide overflow.

## Current API Limitations

The finance endpoints return a complete dataset without stable transaction IDs, transaction dates, authentication, mutation endpoints, or server pagination. Detail IDs currently combine source and array index, so they are not durable identifiers after response reordering.

Do not invent missing fields, business isolation, editing capabilities, or server behavior. Current search and pagination operate locally; amount sorting compares original numbers across currencies, not converted economic value. Large datasets require backend pagination and aggregates rather than loading everything to compute totals.

The old project was migrated and `oldFiles` removed. Do not reintroduce it; `.migration-backup` is a local history archive, not an application dependency.

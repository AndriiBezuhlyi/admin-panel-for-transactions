# Development Progress

## 2026-10-10 — Data sources page

- Added `/data-sources`, navigation, and `src/pages/DataSourcesPage.tsx` with CSS Modules. The page shows both finance sources and CurrencyFreaks, safe endpoint URLs, calculation roles, fetched-record counts, timestamps, refresh, and known limitations.
- Reused existing query caches and extracted endpoint constants in the owning query modules. Finance status remains explicitly shared; errors are not attributed to an individual source without evidence. The finance2 casing finding is labeled as a historical audit observation; currency coverage is checked against the loaded validated rate map.
- Added component tests and browser scenarios in `src/pages/DataSourcesPage.test.tsx` and `e2e/app.spec.ts`; updated `.codex/rules/project.md` to document the new screen and route.
- New environment variables and dependencies: none.
- Verification: ESLint, TypeScript/production build, three component tests, two targeted Playwright scenarios, and all 21 audit-script tests passed. Desktop (1440×1000) and mobile (390×844) screenshots were reviewed with mocked provider data; no runtime exceptions or horizontal overflow. Browser plugin was unavailable, so the existing Playwright/Edge workflow was used. Context7 authentication failed; official Ant Design documentation was consulted.

## 2026-10-10 — Canonical repository skill layout

- Consolidated the complete financial audit skill and all five script/test resources under `.agents/skills/financial-api-audit/`, replacing the discovery-only entry with the full `SKILL.md`.
- Updated documented invocation paths and removed `.codex/skills/financial-api-audit/` after verifying copied resources and passing all 21 offline tests. The repository-root calculation remains correct at the same directory depth.
- Verified YAML metadata, resource paths, current-schema loading, and formatting. `.codex/rules/` was preserved unchanged; no environment variables or dependencies were introduced.

## 2026-10-10 — Financial API audit skill

- Added `.codex/skills/financial-api-audit/SKILL.md` and isolated scripts for current-response inspection, grouped backend findings, safe Markdown output, and optional offline PDF export. Added `.agents/skills/financial-api-audit/SKILL.md` as the discovery entry pointing to the canonical skill.
- Reused production Zod schemas and normalization in memory through a scoped Node loader and existing TypeScript; no frontend files, dependencies, or credentials were changed. Updated `.gitignore` to exclude local audit reports.
- Live audit fetched all three sources, inspected 17 transactions and the validated rate map, and found nine recoverable currency-casing occurrences grouped as one warning. Example report: `reports/api-audit/financial-api-audit-2026-10-10-2008.md`; its sibling PDF contains two pages.
- Verification: 21 deterministic Node tests, ESLint, skill metadata/link checks, and formatting checks passed. PDF signature, page count, and offline print layout were verified. The bundled Python skill validator was unavailable; YAML was parsed and metadata constraints checked with existing Node tooling. Context7 authentication failed; official documentation was consulted.
- New environment variables: none. Credentials use the existing Vite environment configuration and remain out of output. Reports contain limited sanitized examples; raw provider responses are not persisted.

## 2026-10-08 — Reusable empty state

- Added `src/shared/ui/EmptyState.tsx` with a Ukrainian default title, optional description and action, and accessible status semantics.
- Updated `src/pages/TransactionsPage.tsx` to distinguish missing transactions from unmatched filters, without showing an empty state during loading or errors.
- Added component coverage in `src/shared/ui/EmptyState.test.tsx` and browser coverage in `e2e/app.spec.ts`.
- Reused Ant Design Empty and Typography to preserve existing styling without new dependencies or stylesheets.
- New environment variables: none.
- Verification: ESLint, TypeScript/production build, two component tests, and the targeted Playwright empty-data/filter scenario passed. Chrome DevTools could not retain its browser connection; Playwright provided browser verification. Context7 authentication failed; Ant Design's official documentation was used instead.

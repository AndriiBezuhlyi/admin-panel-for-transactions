---
name: financial-api-audit
description: Audit the current finance API responses and exchange-rate data in this repository and produce an actionable backend data-quality report. Use for requests to audit the finance API, check current backend financial data, inspect API data quality, find malformed transactions, or prepare a backend API issue report. This audits data; it does not repair the frontend.
---

# Financial API Audit

Read the repository's `AGENTS.md` and applicable project, API/state, financial, security, architecture, and verification rules. Inspect current clients, schemas, normalization, tests, and environment-variable names before running. Do not infer missing backend contracts.

## Run

From the repository root, with dependencies installed and Node.js 24.11 or newer:

```sh
node .agents/skills/financial-api-audit/scripts/run.mjs
node .agents/skills/financial-api-audit/scripts/run.mjs --pdf
node --test .agents/skills/financial-api-audit/scripts/audit.test.mjs
```

The script discovers provider URLs and credential variable names from the current query modules, loads configuration in memory using existing Vite environment precedence, and reuses project Zod schemas and transaction normalization. It exposes private schemas only in the audit process using Node module hooks and the installed TypeScript compiler; it does not edit frontend files. If expected source identifiers change, stop and adapt the audit adapter to the new code rather than falling back to invented schemas.

Requests are read-only, independent, timed out after 60 seconds, and do not follow redirects with credentials. Markdown reports go to `reports/api-audit/financial-api-audit-YYYY-MM-DD-HHmm.md` using Europe/Paris filename time, with a suffix if necessary. Existing reports are never overwritten. Raw responses stay in memory, not files.

## Interpret

- Compare raw values with validated/normalized values: schema rejection, missing fields/types, malformed entries, currency casing/whitespace, unsupported current rates, invalid monetary strings, representation/precision risks, status casing/whitespace/conflicts, optional observed identifiers and duplicates, HTTP/content-type/JSON failures, and empty responses.
- `error`: rejected contract or values capable of breaking processing or corrupting sums. `warning`: recoverable formatting or suspicious inconsistencies. `info`: observations needing context. Group by source, issue, and field; counts are occurrences, not necessarily unique records.
- Lowercase valid currency remains valid after normalization. Missing current rate is not proof of an invalid ISO code. Do not add an ISO list. Failed rate validation makes rate support checks unavailable, not failed for every currency.
- Status absence, zero amounts, and negative amounts are allowed by current rules. Report their statistics without inventing defects. Unknown statuses are warnings against documented examples, not an invented enum violation. `status ?? type ?? null` determines inclusion; conflicting or normalized-looking values can change inclusion.
- Source/index IDs, absent transaction dates, authentication, mutations, and server pagination are documented limitations, separately labeled in the report. Do not present them as newly discovered defects.

The report contains source availability, schema/normalization coverage, grouped findings with paths/counts/minimal sanitized examples, expected/actual behavior, impact, recommended backend fixes, statistics, and a prioritized action list. Review it before handing it off. Do not send it to third parties unless asked.

## Safety and Optional PDF

Never print keys, headers, credential URLs, raw errors, or complete responses. Examples permit only short field-level values; identifiers and arbitrary text are withheld. Configured secret values are redacted again from the final report. Generated reports are local and ignored by Git; publish only after reviewing data sensitivity.

`--pdf` uses the existing Playwright package and installed Microsoft Edge, as configured by this project. It escapes Markdown into an offline, readable print layout, blocks browser network requests, and generates the sibling PDF. Markdown remains canonical. To convert an existing report without fetching APIs:

```sh
node .agents/skills/financial-api-audit/scripts/report-pdf.mjs reports/api-audit/REPORT.md
```

No browser or dependency is automatically installed. PDF failure keeps the Markdown report and is reported separately. Exit codes: `0` all sources fetched, `2` incomplete fetch/configuration (report still produced), `3` PDF failure, `1` audit setup/output failure. Data findings do not alone fail the command.

After skill implementation changes, run focused offline tests, relevant project checks, and update `docs/progress.md`. A normal audit does not require a frontend repair or a progress entry unless it changes project state beyond generating reports. Summarize actual source success, findings, report paths, and limitations; never claim a successful live audit from fixtures.

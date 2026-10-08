# Finance Panel — Project Instructions

These instructions apply to `AdminPanelForTransactions` and its descendants. They add project-specific guidance to the global instructions.

## Loading Topic Rules

Before working, read the mandatory rules below and every topic whose condition matches the task. Read additional topics if the scope changes. Apply all matching rules together, including during code review.

Paths are relative to this file. "Load" or "import" means opening and reading the referenced Markdown file; these links are not executable imports or automatic `.codex/rules` discovery. Do not rely on a directory name to load instructions. If a required file is missing, report it instead of inventing its contents.

## Project Context — Always

Read [project.md](.codex/rules/project.md) at the start of every task. It describes the product, stack, existing screens, and current backend limitations.

## Security — Always

Read [security.md](.codex/rules/security.md) at the start of every task. Apply it especially to API requests, credentials, logging, browser inspection, authentication, and business data.

## Architecture — Structure and Integration

Read [architecture.md](.codex/rules/architecture.md) when adding or moving modules, introducing shared code, changing imports, routes or providers, or proposing dependencies and configuration changes.

## React and UI — Components and Interaction

Read [react-ui.md](.codex/rules/react-ui.md) when working on React components, pages, forms, tables, navigation, styling, accessibility, or visible text and errors.

## API and State — Requests and Data Ownership

Read [api-state.md](.codex/rules/api-state.md) when working on API clients, response schemas, queries, caching, refresh, errors, cancellation, filters, pagination, or shared state.

## Financial Logic — Amounts and Currencies

Read [financial.md](.codex/rules/financial.md) when working on transaction normalization or inclusion, totals, currency rates, conversion, monetary formatting, comparisons, or financial tests.

## Verification — Implementation and Debugging

Read [verification.md](.codex/rules/verification.md) before implementation, debugging, tests, or changes to developer tooling. Use its task-specific checks before reporting completion. Read it for documentation changes when validating scripts, paths, or instructions.

## Project Documentation — Progress and Synchronization

Read [verification.md](.codex/rules/verification.md) when completing meaningful implementation work or when a task changes documented project behavior, configuration, environment variables, or database structure.

## Common Combinations

| Task                                      | Additional rules beyond Project Context and Security                              |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| Add a page or feature                     | Architecture, React and UI, Verification; API and State when it loads data        |
| Change transaction totals or conversion   | Financial Logic, API and State, Verification; React and UI when display changes   |
| Fix table search, filters, or pagination  | React and UI, API and State, Verification; Financial Logic when comparing amounts |
| Change layout or error presentation       | React and UI, Verification; API and State when error handling changes             |
| Add authentication or business switching  | Architecture, API and State, React and UI, Verification                           |
| Change dependencies, build, or deployment | Architecture, Verification; API and State if request behavior changes             |
| Update local instructions                 | Project Context, Security, Verification; read any topic being edited              |                        |
| Complete a meaningful feature or fix | Verification; update `docs/progress.md` and any affected project documentation |

Keep this file as the rule index. Maintain detailed guidance in the topic files and update links and conditions when adding or renaming a topic.

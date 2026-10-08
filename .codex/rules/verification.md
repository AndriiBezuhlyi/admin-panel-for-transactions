# Verification and Developer Workflow

Run commands from the project root using npm. Inspect `package.json` and relevant configs before assuming script behavior; keep lock-file changes consistent with approved dependency work.

## Available Commands

| Command                | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `npm run dev`          | Local Vite development server                                  |
| `npm run lint`         | ESLint                                                         |
| `npm run build`        | TypeScript project checks followed by production build         |
| `npm test`             | Vitest unit/component tests in jsdom                           |
| `npm run test:e2e`     | Playwright browser scenarios                                   |
| `npm run format:check` | Prettier check for `src` and `README.md`                       |
| `npm run format`       | Formats `src` and `README.md`; avoid unrelated bulk formatting |

For Markdown outside the formatting script's scope, use the installed formatter on explicit paths: `npm exec -- prettier --check AGENTS.md ".codex/rules/*.md"`. Use `--write` only on files being changed.

## Match Checks to the Change

- Financial or normalization changes: relevant Vitest cases, lint, and TypeScript/build checks.
- UI/routing/forms/query behavior: relevant component tests and browser scenarios; check console, network, and affected desktop/mobile behavior when practical.
- Build/dependency changes: build, lint, and relevant tests.
- Documentation/rules only: check formatting, relative links, named paths, scripts, and consistency with source. No application build or browser run is needed unless app behavior changed.

Unit tests live beside code in `*.test.ts(x)`; common setup is in `src/test/setup.ts`. Browser tests live in `e2e`. Use mocked provider responses for deterministic tests, including failure paths. Live requests are not the default test strategy.

Playwright currently uses installed Microsoft Edge in headless mode and starts Vite at `127.0.0.1:5179`. Check `playwright.config.ts`; do not silently switch browsers, install runtimes, or change project tooling just to bypass a failure.

Browser checks should cover navigation, deep-link reloads, filtering, converter validation, API failure behavior, and overview overflow when affected. Inspect screenshots when they help evaluate appearance. Do not claim complete UI verification from static inspection alone.

Report relevant checks that failed or could not run and why. Sandbox execution restrictions are not application bugs. Use the permitted approval process where necessary; do not weaken tests or suppress diagnostics to obtain a passing result.

## Project Documentation

After meaningful implementation work:

- Update `docs/progress.md`.
- If `docs/progress.md` does not exist, create it before writing the first progress entry.
- Keep it as a lightweight development journal, not a full technical specification.
- Record:
  - a short summary of the completed work;
  - the main files that were added, changed, moved, or removed;
  - important implementation decisions when they are not obvious;
  - names of any new environment variables introduced by the task, without secret values.
- Keep entries concise and factual.

If the task changes database structure, including tables, fields, relations, indexes, constraints, or migrations:

- Update `docs/db-schema.md`.
- If `docs/db-schema.md` does not exist yet, create it when the project first introduces database structure that needs documentation.

If the task materially changes project setup, architecture, screens, stack, or known backend limitations:

- Update the relevant existing project documentation, including `.codex/rules/project.md` when appropriate.

Do not expose or copy secret values into documentation.
Do not add progress entries for trivial changes that do not affect project state or developer understanding.

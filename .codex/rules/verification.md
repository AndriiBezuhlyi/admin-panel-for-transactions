# Verification and Developer Workflow

Run commands from the project root using npm. Inspect `package.json` and relevant configs before assuming script behavior.

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

For Markdown outside the formatting script's scope, use:

`npm exec -- prettier --check AGENTS.md ".codex/rules/*.md"`

Use `--write` only on files being changed.

## Match Checks to the Change

- Financial or normalization changes:
  - relevant Vitest cases;
  - lint;
  - build.

- UI, routing, forms, or query behavior:
  - relevant component tests;
  - relevant browser scenarios;
  - console, network, and affected desktop/mobile behavior when practical.

- Build or dependency changes:
  - build;
  - lint;
  - relevant tests.

- Documentation or rule changes only:
  - formatting;
  - relative links;
  - referenced paths;
  - scripts;
  - consistency with source.

  No application build or browser run is needed unless application behavior also changed.

## Tests

Unit tests live beside code in `*.test.ts(x)`.

Common test setup:

`src/test/setup.ts`

Browser tests live in:

`e2e/`

Use mocked provider responses for deterministic tests, including failure paths. Live provider requests are not the default test strategy.

## Playwright

Playwright currently:

- uses installed Microsoft Edge;
- runs headless;
- starts Vite at `127.0.0.1:5179`.

Check `playwright.config.ts` before changing this behavior.

Do not silently switch browsers, install browser runtimes, or change project tooling solely to bypass a failing test.

When affected by a task, browser checks should cover relevant cases such as:

- navigation;
- deep-link reloads;
- filtering;
- converter validation;
- API failure behavior;
- overview overflow.

Use screenshots when they help evaluate visual behavior.

Sandbox or execution-environment restrictions are not application bugs.

## Project Documentation

After meaningful implementation work:

- Update `docs/progress.md`.
- If it does not exist, create it before writing the first entry.
- Keep it as a lightweight development journal rather than a full technical specification.
- Record:
  - a short summary of the completed work;
  - the main files added, changed, moved, or removed;
  - important implementation decisions when they are not obvious;
  - names of new environment variables introduced by the task, without their values.

Keep entries concise and factual.

If the task changes database structure, including tables, fields, relations, indexes, constraints, or migrations:

- Update `docs/db-schema.md`.
- If it does not exist yet, create it when the project first introduces database structure that requires documentation.

If the task materially changes project setup, architecture, screens, stack, or known backend limitations:

- Update the relevant existing project documentation, including `.codex/rules/project.md` when appropriate.

Do not add progress entries for trivial changes that do not affect project state or developer understanding.

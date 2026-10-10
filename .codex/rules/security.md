# Project Security

## Client-Side Provider Credentials

The current prototype calls external providers directly using `VITE_*` environment variables.

- Values exposed through Vite client environment variables are included in the browser bundle and must not be treated as secrets.
- `.gitignore` does not make client-side credentials private.
- Before public production deployment, provider credentials must be moved behind a backend or another approved server-side layer.
- Do not introduce a backend automatically during unrelated frontend work.

## Logging and Business Data

- Keep logs limited to safe stage names, status codes, and permitted aggregates.
- Do not log:
  - request headers;
  - credential-bearing URLs;
  - entire provider responses;
  - unnecessary transaction or business data.
- Prefer mock data for tests, screenshots, traces, and debugging artifacts.

## Rendering External Data

- Render API-provided text through normal React text interpolation.
- Do not introduce `dangerouslySetInnerHTML` for transaction labels or other untrusted external content unless the task explicitly requires trusted HTML and its sanitization strategy is approved.

## Authentication and Business Isolation

- Authentication and business isolation are not implemented by the current API.
- Do not describe the prototype as having production-grade authorization or tenant isolation.
- Frontend filtering must never be treated as a security boundary.
- Future authorization and tenant-access checks must be enforced by the backend.

## Sensitive Local Artifacts

Keep the following out of commits:

- `.env.local`
- `.migration-backup`
- `test-results`
- `playwright-report`

Treat browser traces, screenshots, network recordings, and history archives as potentially sensitive because they may contain business or transaction data.

Do not inspect or copy `.migration-backup` during ordinary application tasks unless the task specifically requires it.

# Project Security

Never print or commit credentials. Do not read secret values when variable names or `.env.example` suffice. Do not modify `.env.local`, rotate credentials, or copy secret-bearing configuration unless necessary and explicitly authorized.

The current prototype calls external providers directly using VITE environment variables. Those variables are public in a browser bundle; `.gitignore` does not make them secret. Before public production deployment, provider credentials must be owned by a backend or approved server layer. Do not create a backend automatically during unrelated frontend work.

Keep logs useful but limited to safe stage names, status codes, and permitted aggregates. Do not log request headers, credential-bearing URLs, raw fetch errors, entire provider responses, or unnecessary business transaction details. Mock data is preferred for screenshots, tests, and traces.

Render API content through React text interpolation. Do not insert untrusted HTML or introduce `dangerouslySetInnerHTML` for transaction labels.

Authentication and business isolation are not implemented by the current API. Do not describe the prototype as having production authorization. Future access checks must be enforced by backend; frontend filtering does not provide tenant isolation.

Keep `.env.local`, `.migration-backup`, `test-results`, and `playwright-report` out of commits. Treat traces, screenshots, network recordings, and history archives as potentially sensitive. Do not open or copy `.migration-backup` for ordinary application tasks.

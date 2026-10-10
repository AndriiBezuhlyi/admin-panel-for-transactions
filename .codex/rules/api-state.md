# API and State

## API Contracts

Use `src/shared/api/client.ts` for HTTP requests. Treat JSON as `unknown` until validated with Zod in the owning feature. Normalize provider formats before use.

Finance sources:

- `/api/finance1`
- `/api/finance2`
- Base URL: `https://cpa-server-vtel.onrender.com`
- Authentication header: `x-api-key` from `VITE_FINANCE_API_KEY`

`finance1` returns a `transactions` array of objects; `finance2` returns amount/currency strings.

CurrencyFreaks uses `https://api.currencyfreaks.com/v2.0/rates/latest` with `VITE_CURRENCYFREAKS_API_KEY`. Its validated response contains a USD base, provider date, and rate map.

## Server State

Keep server data in feature-level TanStack Query hooks. Reuse existing query keys and do not create duplicate caches or copy query results into global state.

Current query behavior:

- transactions stale time: 1 minute;
- exchange rates stale time: 15 minutes;
- manual refresh forces a fetch;
- window-focus refetch is disabled;
- retry at most once for HTTP 5xx responses.

Forward the query `AbortSignal` to fetch and preserve existing timeouts. Keep independent data sources' loading and error states separate.

Cached data may remain visible after a background error, but must not be presented as successfully refreshed. Preserve relevant fetch timestamps and provider rate dates.

## Client State and Backend Boundaries

Keep search, inclusion filters, and page number in URL parameters. Keep transient UI state in React and form state in Ant Design Form. Existing table sorting is local.

When authentication and business switching are introduced, scope relevant query keys by business and clear sensitive cached data on logout.

Do not emulate unsupported server-side pagination or mutations. Dataset-wide summaries for paginated data must come from backend aggregates.

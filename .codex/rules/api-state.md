# API and State

## Boundaries and Contracts

Use `src/shared/api/client.ts` for HTTP requests. Treat JSON as `unknown` until validated with Zod in the owning feature. Normalize provider formats before rendering and preserve decimal strings.

Current finance sources are `/api/finance1` and `/api/finance2` at `https://cpa-server-vtel.onrender.com`. Requests use the `x-api-key` header populated from `VITE_FINANCE_API_KEY`. The first source has a `transactions` array of objects; the second is an array of amount/currency strings.

CurrencyFreaks uses `https://api.currencyfreaks.com/v2.0/rates/latest` and `VITE_CURRENCYFREAKS_API_KEY`. Its validated response has USD base, a provider date, and a rate map. Never put actual key values in code or documentation.

## Query Ownership

Keep server data in feature-level TanStack Query hooks. Reuse existing query keys; do not create independent caches for the same responses or copy query results into a global store.

Current freshness windows are 1 minute for transactions and 15 minutes for rates. Manual refresh forces a fetch. Window-focus refetch is disabled. Retry currently permits at most one retry for HTTP 5xx responses; do not retry authorization or validation failures blindly.

Forward the query's AbortSignal to fetch and preserve the existing timeout. Intentional cancellation is not a user-facing failure. Keep independent sources' loading/error states separate so rate failures do not blank transaction data.

Background errors can coexist with cached results. Do not present cached summaries as newly refreshed after a failed request. Show the relevant fetch timestamp and the provider's rate date without implying real-time rates.

## Client State and Future Backend Work

Keep search, inclusion filter, and page number in URL parameters; keep transient UI state in React and form values in Ant Design Form. Existing table sorting is local. For new shareable sort controls, consider URL state within the task's scope.

When authentication and business switching are actually introduced, scope all relevant query keys by business and clear sensitive cached data on logout. Backend authorization remains mandatory; browser route guards are only a UI concern.

Do not simulate server-side pagination or mutation support. Official summaries for a paginated dataset must come from backend aggregates, not the currently loaded rows. Financial mutations require explicit API contracts and idempotency before automatic retries or optimistic updates.

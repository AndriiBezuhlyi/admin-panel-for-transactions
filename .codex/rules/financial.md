# Financial Logic

## Transaction Inclusion

Preserve all normalized transactions for display. Include a transaction in totals only when its resolved status is `paid` or absent. Status resolution currently uses `status ?? type ?? null`; pending, rejected, and other explicit statuses are excluded.

Normalize currency codes to uppercase. Transaction IDs formed from source and index are temporary view identifiers; never use them as accounting references or mutation identifiers.

## Precision and Conversion

Store amounts and rates as decimal strings. Use `Money` from `src/shared/lib/money.ts`, the configured `decimal.js` clone with 40 significant digits and `ROUND_HALF_UP`. Do not use JavaScript Number arithmetic, `parseFloat`, or Number-based rounding for money. A number already rounded by an upstream JSON producer cannot be repaired by converting it to a string.

The main summary always uses USD. CurrencyFreaks rates mean units of currency per 1 USD:

- To USD: `amount / sourceRate`.
- Between currencies: `amount / sourceRate * targetRate`.
- USD has rate 1. Equal source and target currencies need no conversion.

Required rates must be present, finite, and positive. Fail clearly rather than silently ignoring a transaction or substituting a guessed rate.

For the report summary, keep intermediate decimal precision and round only the final total to two decimal places. Separate USD/EUR totals sum included transactions in their original currencies, without conversion. The converter rounds its final preview result to two places.

These are current display/report rules, not universal currency minor-unit rules or accounting settlement rules. If future operations require per-transaction rounding, other currencies' minor units, historical rates, or different policies, establish the business contract before changing behavior.

The frontend provides preliminary equivalents. Backend must determine authoritative accounting amounts and operations. Do not change precision or rounding as cosmetic cleanup.

## Required Cases When This Logic Changes

Cover paid/missing/excluded statuses, lowercase currencies, exact decimal sums, large string amounts, final-only rounding, empty data, multiple currencies, equal-currency conversion, and missing or invalid rates. Preserve the string-valued `{ total, currency: 'USD' }` result contract unless the task explicitly changes it.

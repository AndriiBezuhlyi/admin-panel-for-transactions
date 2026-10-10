# Financial Logic

## Transaction Inclusion

Preserve all normalized transactions for display. Include a transaction in totals only when its resolved status is `paid` or absent.

Status resolution:
`status ?? type ?? null`

Exclude `pending`, `rejected`, and other explicit non-paid statuses.

Normalize currency codes to uppercase.

## Precision and Conversion

Store monetary amounts and rates as decimal strings.

Use `Money` from `src/shared/lib/money.ts`, the configured `decimal.js` clone with 40 significant digits and `ROUND_HALF_UP`.

Do not use JavaScript `Number`, `parseFloat`, or Number-based rounding for monetary calculations. Precision already lost upstream cannot be recovered by converting a number to a string.

The main summary uses USD.

CurrencyFreaks rates represent currency units per 1 USD:

- To USD: `amount / sourceRate`
- Between currencies: `amount / sourceRate * targetRate`
- USD rate: `1`
- Equal source and target currencies require no conversion.

Required rates must be present, finite, and positive. Fail clearly instead of skipping transactions or guessing rates.

For report summaries:

- keep full intermediate decimal precision;
- round only the final total to two decimal places;
- USD/EUR separate totals sum included transactions already denominated in that currency without conversion.

The converter rounds only its final preview result to two decimal places.

These are current product rules, not universal accounting or currency minor-unit rules. Do not change rounding or precision behavior without an explicit business requirement.

Frontend values are preliminary equivalents; authoritative accounting amounts belong to the backend.

## Required Cases

When financial logic changes, cover:

- paid, missing, and excluded statuses;
- lowercase currencies;
- exact decimal sums;
- large string amounts;
- final-only rounding;
- empty data;
- multiple currencies;
- equal-currency conversion;
- missing or invalid rates.

Preserve the string-valued `{ total, currency: 'USD' }` result contract unless explicitly changed.

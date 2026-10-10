const severityOrder = { error: 0, warning: 1, info: 2 }
const documentedStatuses = new Set(['paid', 'pending', 'rejected'])
const object = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const typeOf = (value) =>
  value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value

export function redact(text, secrets = []) {
  let result = String(text)
  for (const secret of [...new Set(secrets)]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)) {
    for (const representation of new Set([
      secret,
      encodeURIComponent(secret),
    ])) {
      result = result.split(representation).join('[REDACTED]')
    }
  }
  return result
    .replace(/https?:\/\/[^\s<>]+/gi, '[URL withheld]')
    .replace(
      /(?:bearer\s+|(?:api[_-]?key|authorization|password|secret|token)\s*[:=]\s*)[^\s,;]+/gi,
      '[REDACTED]',
    )
}

function safeExample(value, secrets) {
  if (value === undefined) return '[missing]'
  if (value === null) return 'null'
  if (typeof value === 'number') return String(value)
  if (typeof value !== 'string') return `[${typeOf(value)} withheld]`
  const safe = redact(value, secrets)
  if (safe.includes('[REDACTED]') || safe.includes('[URL withheld]'))
    return '[REDACTED]'
  // Only short currency/status/decimal-like values; arbitrary business text is withheld.
  if (safe.length > 60 || !/^[\sA-Za-z0-9+.,_-]*$/.test(safe))
    return `[string withheld; length ${value.length}]`
  return JSON.stringify(safe).replace(/\|/g, '\\|')
}

function parse(schema, data) {
  try {
    return schema.safeParse(data)
  } catch (error) {
    return {
      success: false,
      error: { issues: error.issues ?? [{ code: 'invalid_value', path: [] }] },
    }
  }
}

export function auditResponses(
  responses,
  contracts,
  { timestamp = new Date().toISOString(), secrets = [] } = {},
) {
  const grouped = new Map()
  const metadata = []
  const statistics = []
  let rates = null
  let normalizedCount = 0

  function add(
    source,
    code,
    severity,
    category,
    field,
    path,
    raw,
    expected,
    actual,
    impact,
    fix,
  ) {
    const key = `${source}|${code}|${field}`
    const finding = grouped.get(key) ?? {
      source,
      code,
      severity,
      category,
      field,
      count: 0,
      examples: [],
      expected,
      actual,
      impact,
      fix,
    }
    if (severityOrder[severity] < severityOrder[finding.severity]) {
      Object.assign(finding, { severity, expected, actual, impact, fix })
    }
    finding.count += 1
    if (finding.examples.length < 3)
      finding.examples.push({ path, value: safeExample(raw, secrets) })
    grouped.set(key, finding)
  }

  function rejectSchema(source, result, prefix = '$') {
    if (result.success) return
    for (const issue of result.error.issues) {
      // Never copy Zod messages/input or arbitrary property names into the report.
      const allowed = new Set([
        'transactions',
        'amount',
        'currency',
        'status',
        'type',
        'base',
        'date',
        'rates',
      ])
      const parts = issue.path.map((part) =>
        typeof part === 'number'
          ? `[${part}]`
          : allowed.has(part)
            ? `.${part}`
            : '.[field]',
      )
      const path = `${prefix}${parts.join('')}`
      add(
        source,
        `SCHEMA_${issue.code}`,
        'error',
        'Response contract',
        path.replace(/\[\d+\]/g, '[*]'),
        path,
        undefined,
        'Values accepted by the current project Zod schema.',
        `Schema rejected this path (${issue.code}).`,
        'The frontend may reject the entire source rather than partially display it.',
        'Return the required structure and types; validate the response before sending it.',
      )
    }
  }

  // Validate rates first, irrespective of response input order.
  const rateResponse = responses.find((item) => item.name === 'exchange-rates')
  if (rateResponse?.ok) {
    const validation = parse(contracts.ratesSchema, rateResponse.data)
    rejectSchema('exchange-rates', validation)
    if (validation.success) rates = { ...validation.data.rates, USD: '1' }
  }

  for (const name of ['finance1', 'finance2', 'exchange-rates']) {
    const response = responses.find((item) => item.name === name) ?? {
      name,
      ok: false,
      failure: 'not supplied',
    }
    const rows =
      name === 'finance1' && object(response.data)
        ? response.data.transactions
        : name === 'finance2'
          ? response.data
          : undefined
    metadata.push({
      name,
      fetched: response.ok,
      httpStatus: response.status ?? 'unavailable',
      records: Array.isArray(rows)
        ? rows.length
        : name === 'exchange-rates' && object(response.data?.rates)
          ? Object.keys(response.data.rates).length
          : null,
    })
    if (!response.ok) {
      add(
        name,
        'SOURCE_FAILED',
        'error',
        'HTTP/API behavior',
        '$',
        '$',
        undefined,
        'A successful JSON response.',
        `Source unavailable (${response.failure ?? 'request failed'}).`,
        'The audit is incomplete; dependent totals or rate checks may be unavailable.',
        'Check server availability, configured access, and response generation for this source.',
      )
      continue
    }
    if (
      response.contentType &&
      response.contentType !== 'application/json' &&
      !response.contentType.endsWith('+json')
    ) {
      add(
        name,
        'CONTENT_TYPE',
        'warning',
        'HTTP/API behavior',
        'Content-Type',
        'Content-Type',
        response.contentType,
        'application/json or a JSON media type.',
        'JSON response used another media type.',
        'Clients may interpret the response incorrectly.',
        'Send a correct JSON Content-Type header.',
      )
    }
    if (name === 'exchange-rates') continue
    const schema =
      name === 'finance1'
        ? contracts.firstSourceSchema
        : contracts.secondSourceSchema
    // For valid arrays inspect entries independently, retaining coverage after a malformed row.
    if (!Array.isArray(rows)) {
      rejectSchema(name, parse(schema, response.data))
      continue
    }
    const validations = rows.map((row) =>
      parse(schema, name === 'finance1' ? { transactions: [row] } : [row]),
    )
    const validRows = rows.filter((_, index) => validations[index].success)
    let normalizedRows = []
    try {
      normalizedRows = contracts.normalizeTransactions(
        { transactions: name === 'finance1' ? validRows : [] },
        name === 'finance2' ? validRows : [],
      )
      normalizedCount += normalizedRows.length
    } catch {
      add(
        name,
        'NORMALIZATION_FAILURE',
        'error',
        'Response contract',
        '$',
        '$',
        undefined,
        'Schema-valid entries accepted by current normalization.',
        'Normalization failed for schema-valid entries.',
        'Schema and normalization assumptions may disagree.',
        'Investigate the provider contract against current normalization before changing either.',
      )
    }
    let normalizedIndex = 0
    const stats = {
      source: name,
      records: rows.length,
      malformedEntries: 0,
      normalizationCorrections: 0,
      currencies: {},
      rawCurrencyForms: {},
      statuses: {},
      missingStatuses: 0,
      nullStatuses: 0,
      unsupportedCurrencies: rates ? 0 : null,
      zeroAmounts: 0,
      negativeAmounts: 0,
      validEntries: 0,
    }
    const representations = new Map()
    const ids = new Map()
    let idsPresent = 0
    if (!rows.length)
      add(
        name,
        'EMPTY_SOURCE',
        'info',
        'Data consistency',
        '$',
        '$',
        undefined,
        'An array; whether empty is expected depends on business context.',
        'The source returned an empty array.',
        'No transactions from this source are available. This is not proof of partial data.',
        'Confirm the requested business scope and whether an empty result is expected.',
      )
    rows.forEach((row, index) => {
      const base =
        name === 'finance1' ? `$.transactions[${index}]` : `$[${index}]`
      const validation = validations[index]
      const normalized = validation.success
        ? normalizedRows[normalizedIndex++]
        : undefined
      if (!validation.success) {
        stats.malformedEntries += 1
        const issues = validation.error.issues.map((issue) => ({
          ...issue,
          path: name === 'finance1' ? issue.path.slice(2) : issue.path.slice(1),
        }))
        rejectSchema(name, { success: false, error: { issues } }, base)
      } else {
        stats.validEntries += 1
      }
      let amount,
        currency,
        status = null
      if (name === 'finance1') {
        if (!object(row)) return
        amount = row.amount
        currency = row.currency
        status = row.status ?? row.type ?? null
        for (const field of ['amount', 'currency', 'status', 'type']) {
          const alternate = field[0].toUpperCase() + field.slice(1)
          if (row[field] === undefined && Object.hasOwn(row, alternate))
            add(
              name,
              'FIELD_NAME',
              'warning',
              'Data consistency',
              field,
              `${base}.${field}`,
              undefined,
              `Field name ${field}.`,
              'A differently capitalized field name was observed.',
              'The expected field is absent; alternate fields are ignored.',
              `Use the documented ${field} field consistently.`,
            )
        }
        if (status === null) {
          stats.missingStatuses += 1
          if (row.status === null || row.type === null) stats.nullStatuses += 1
        }
        for (const field of ['status', 'type']) {
          if (typeof row[field] !== 'string') continue
          const value = row[field]
          if (value !== value.trim())
            add(
              name,
              'STATUS_WHITESPACE',
              'warning',
              'Transaction status',
              field,
              `${base}.${field}`,
              value,
              'A status without surrounding whitespace.',
              'Status includes surrounding whitespace.',
              'Inclusion uses an exact match; a paid-looking status may be excluded.',
              'Emit canonical status tokens without whitespace.',
            )
          if (value.trim() !== value.trim().toLowerCase())
            add(
              name,
              'STATUS_CASE',
              'warning',
              'Transaction status',
              field,
              `${base}.${field}`,
              value,
              'Canonical lowercase status tokens.',
              'Status casing differs from documented examples.',
              'The frontend does not normalize status casing; paid-looking values may be excluded.',
              'Use lowercase status tokens consistently.',
            )
          if (!documentedStatuses.has(value.trim().toLowerCase()))
            add(
              name,
              'UNKNOWN_STATUS',
              'warning',
              'Transaction status',
              field,
              `${base}.${field}`,
              value,
              'A documented status or an explicitly agreed new value.',
              'An explicit status is not among paid, pending, rejected examples.',
              'It is excluded from totals; the schema accepts strings and does not define an enum.',
              'Document the status and intended inclusion behavior; align the API contract with clients.',
            )
        }
        if (row.status != null && row.type != null && row.status !== row.type)
          add(
            name,
            'STATUS_CONFLICT',
            'warning',
            'Transaction status',
            'status/type',
            base,
            undefined,
            'One authoritative status, or agreeing status/type aliases.',
            'status and type differ; status takes precedence.',
            'Clients using different aliases may compute different totals.',
            'Choose one authoritative status field; align or remove the legacy alias.',
          )
        if (Object.hasOwn(row, 'id')) {
          if (
            typeof row.id === 'string' ||
            (typeof row.id === 'number' && Number.isFinite(row.id))
          ) {
            idsPresent += 1
            const id = `${typeof row.id}:${row.id}`
            if (ids.has(id)) {
              const previous = ids.get(id)
              const conflict = ['amount', 'currency', 'status', 'type'].some(
                (field) =>
                  JSON.stringify(previous[field]) !==
                  JSON.stringify(row[field]),
              )
              add(
                name,
                conflict ? 'CONFLICTING_ID' : 'DUPLICATE_ID',
                'warning',
                'Data consistency',
                'id',
                `${base}.id`,
                '[identifier withheld]',
                'An agreed identifier contract if optional IDs are supplied.',
                conflict
                  ? 'A repeated ID has conflicting financial fields.'
                  : 'A supplied ID was repeated.',
                'Optional ID uniqueness is not guaranteed by the current contract; these records need review before relying on this field.',
                'Confirm the meaning and uniqueness of optional IDs, then resolve conflicting records if they are intended as transaction identifiers.',
              )
            } else ids.set(id, row)
          } else
            add(
              name,
              'ID_TYPE',
              'warning',
              'Data consistency',
              'id',
              `${base}.id`,
              undefined,
              'A consistent non-null identifier if optional IDs are supplied.',
              'Optional ID has an unusable type.',
              'The current client uses source/index IDs; server identifiers cannot be trusted.',
              'Define and consistently populate an identifier contract.',
            )
        }
      } else {
        if (typeof row !== 'string') return
        const parts = row.trim().split(/\s+/)
        amount = parts[0]
        currency = parts[1]
        stats.missingStatuses += 1
        if (row !== row.trim() || /\s{2,}|\t|\n/.test(row.trim())) {
          stats.normalizationCorrections += 1
          add(
            name,
            'ENTRY_WHITESPACE',
            'warning',
            'Data consistency',
            '$[*]',
            base,
            undefined,
            'One space between amount and currency, no surrounding whitespace.',
            'Transaction string needs whitespace normalization.',
            'Currently recoverable, but formatting differs between records.',
            'Emit consistently formatted transaction strings or agree a structured response contract.',
          )
        }
      }
      const currencyPath = `${base}.currency`
      const currencyValidation = parse(contracts.currencySchema, currency)
      if (!currencyValidation.success) {
        add(
          name,
          'INVALID_CURRENCY',
          'error',
          'Currency quality',
          'currency',
          currencyPath,
          currency,
          'A currency string accepted by the project schema.',
          'Currency is missing, malformed, or has an unexpected type.',
          'Normalization rejects the entry or the entire source.',
          'Provide a non-empty supported currency code in the currency field.',
        )
      } else {
        const canonical = currencyValidation.data
        stats.currencies[canonical] = (stats.currencies[canonical] ?? 0) + 1
        const form = safeExample(currency, secrets)
        stats.rawCurrencyForms[form] = (stats.rawCurrencyForms[form] ?? 0) + 1
        if (currency !== currency.trim()) {
          stats.normalizationCorrections += 1
          add(
            name,
            'CURRENCY_WHITESPACE',
            'warning',
            'Currency quality',
            'currency',
            currencyPath,
            currency,
            'A code without surrounding whitespace.',
            'Currency needs trimming.',
            'Currently normalized by the frontend.',
            'Trim currency values before emitting responses.',
          )
        }
        if (currency.trim() !== canonical) {
          stats.normalizationCorrections += 1
          add(
            name,
            'CURRENCY_CASE',
            'warning',
            'Currency quality',
            'currency',
            currencyPath,
            currency,
            'Canonical uppercase currency codes.',
            'Raw currency casing is not canonical; normalized codes are checked separately for rate support.',
            'Currently recoverable; inconsistent casing complicates aggregation across clients.',
            'Emit uppercase currency codes consistently.',
          )
        }
        if (rates && !Object.hasOwn(rates, canonical)) {
          stats.unsupportedCurrencies += 1
          const included = normalized?.included === true
          add(
            name,
            'UNSUPPORTED_CURRENCY',
            included ? 'error' : 'warning',
            'Currency quality',
            'currency',
            currencyPath,
            currency,
            'A code available in the currently validated exchange-rate map.',
            `No current rate for normalized code ${canonical}; ISO validity is not established.`,
            included
              ? 'An included transaction can prevent the USD summary from being calculated.'
              : 'Future inclusion would require a supported conversion rate.',
            'Verify the currency code and agree a reliable rate source or an explicit unsupported-currency policy.',
          )
        }
      }
      if (!parse(contracts.amountSchema, amount).success) {
        add(
          name,
          'INVALID_AMOUNT',
          'error',
          'Amount quality',
          'amount',
          `${base}.amount`,
          amount,
          'A finite decimal amount accepted by the project schema.',
          'Amount is missing, malformed, or has an unexpected type.',
          'The source cannot be processed reliably.',
          'Emit valid decimal amounts with a consistent representation.',
        )
      } else {
        const representation = typeOf(amount)
        representations.set(
          representation,
          (representations.get(representation) ?? 0) + 1,
        )
        const text = String(amount).trim()
        if (/^-0*(?:\.0*)?$/.test(text) || /^\+?0*(?:\.0*)?$/.test(text))
          stats.zeroAmounts += 1
        else if (text.startsWith('-')) stats.negativeAmounts += 1
        if (typeof amount === 'string' && amount !== amount.trim())
          add(
            name,
            'AMOUNT_WHITESPACE',
            'warning',
            'Amount quality',
            'amount',
            `${base}.amount`,
            amount,
            'A decimal string without surrounding whitespace.',
            'Amount needs trimming.',
            'Currently accepted after frontend normalization.',
            'Trim decimal strings at the API boundary.',
          )
        if (
          typeof amount === 'number' &&
          Math.abs(amount) > Number.MAX_SAFE_INTEGER
        )
          add(
            name,
            'UNSAFE_NUMBER',
            'error',
            'Amount quality',
            'amount',
            `${base}.amount`,
            undefined,
            'Exact decimal strings for amounts beyond safe JSON-number precision.',
            'Numeric amount exceeds the safe integer magnitude.',
            'Precision may already be lost before decimal conversion.',
            'Serialize exact monetary amounts as decimal strings or contract-defined minor units.',
          )
        if ((text.split('.')[1]?.length ?? 0) > 2)
          add(
            name,
            'EXTRA_PRECISION',
            'info',
            'Amount quality',
            'amount',
            `${base}.amount`,
            undefined,
            'Precision consistent with the business contract.',
            'Amount has more than two decimal places; the current schema permits it.',
            'The report rounds the final equivalent to two places; extra precision may be legitimate.',
            'Confirm and document amount precision and accounting rounding policy; do not discard precision blindly.',
          )
        if (text.replace(/[^0-9]/g, '').replace(/^0+/, '').length > 40)
          add(
            name,
            'PRECISION_LIMIT',
            'warning',
            'Amount quality',
            'amount',
            `${base}.amount`,
            undefined,
            'Precision within an agreed monetary representation.',
            'Amount has more significant digits than the configured 40-digit decimal arithmetic.',
            'Arithmetic can round significant digits even when the string parses.',
            'Agree a maximum amount/precision contract or a higher authoritative server precision.',
          )
      }
      const statusKey =
        status === null
          ? '(absent)'
          : typeof status === 'string'
            ? safeExample(status, secrets)
            : `[${typeOf(status)}]`
      stats.statuses[statusKey] = (stats.statuses[statusKey] ?? 0) + 1
    })
    if (representations.size > 1)
      add(
        name,
        'AMOUNT_REPRESENTATION',
        'warning',
        'Amount quality',
        'amount',
        '$',
        undefined,
        'A consistent monetary representation within each source.',
        [...representations.keys()].sort().join(' and ') +
          ' amount values coexist.',
        'Clients must handle multiple types; numeric values may have upstream precision loss.',
        'Prefer one documented decimal-string representation for this source.',
      )
    if (idsPresent && idsPresent < rows.length)
      add(
        name,
        'OPTIONAL_ID_COVERAGE',
        'info',
        'Data consistency',
        'id',
        '$',
        undefined,
        'Consistent optional identifier coverage when IDs are supplied.',
        `${idsPresent} of ${rows.length} rows contain usable IDs. IDs are not currently required.`,
        'This is not a missing-required-field error; identity remains a known backend limitation.',
        'Define a stable identifier contract if introducing IDs.',
      )
    statistics.push(stats)
  }
  const findings = [...grouped.values()].sort(
    (a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity] ||
      a.source.localeCompare(b.source, 'en') ||
      a.code.localeCompare(b.code, 'en') ||
      a.field.localeCompare(b.field, 'en'),
  )
  return {
    timestamp,
    metadata,
    findings,
    statistics,
    normalizedCount,
    rateSupportAvailable: rates !== null,
  }
}

function cell(value) {
  return String(value)
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\|/g, '\\|')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function renderReport(audit, secrets = []) {
  const count = (severity) =>
    audit.findings.filter((item) => item.severity === severity).length
  const lines = [
    '# Financial API Audit Report',
    '',
    '## Audit metadata',
    '',
    `- Timestamp (UTC): ${audit.timestamp}`,
    '- Source labels are used instead of credential-bearing URLs.',
    `- Records successfully normalized: ${audit.normalizedCount}`,
    `- Currency support check: ${audit.rateSupportAvailable ? 'available from validated current rates' : 'unavailable; no unsupported-currency claims were inferred'}`,
    '',
    '| Source | Fetched | HTTP status | Records inspected |',
    '| --- | --- | --- | --- |',
    ...audit.metadata.map(
      (item) =>
        `| ${item.name} | ${item.fetched ? 'yes' : 'no'} | ${item.httpStatus} | ${item.records ?? 'not applicable/unavailable'} |`,
    ),
    '',
    '## Executive summary',
    '',
    `- Total distinct findings: ${audit.findings.length}`,
    `- Errors: ${count('error')}`,
    `- Warnings: ${count('warning')}`,
    `- Informational findings: ${count('info')}`,
    `- Total grouped occurrences: ${audit.findings.reduce((sum, item) => sum + item.count, 0)}`,
    '- Counts describe issue occurrences; a record may contribute to multiple issues.',
    audit.metadata.some((item) => !item.fetched)
      ? '- Audit coverage is incomplete because at least one source was not fetched.'
      : count('error')
        ? '- Backend validation or conversion compatibility issues need attention before these responses can be relied on.'
        : audit.findings.length
          ? '- No blocking schema error was found; review the recoverable inconsistencies and observations below.'
          : '- No anomalies detected within the current project contracts and available checks.',
    '',
    '## Findings',
    '',
  ]
  if (!audit.findings.length) lines.push('None.', '')
  audit.findings.forEach((item, index) => {
    lines.push(
      `### ${index + 1}. ${item.code}`,
      '',
      `- Severity: ${item.severity}`,
      `- Source/API: ${item.source}`,
      `- Category: ${item.category}`,
      `- Affected field/path: ${cell(item.field)}`,
      `- Count: ${item.count}`,
      '- Sanitized examples:',
      ...item.examples.map(
        (example) => `  - ${cell(example.path)}: ${cell(example.value)}`,
      ),
      `- Expected: ${cell(item.expected)}`,
      `- Actual: ${cell(item.actual)}`,
      `- Impact: ${cell(item.impact)}`,
      `- Recommended backend fix: ${cell(item.fix)}`,
      '',
    )
  })
  lines.push(
    '## Data quality statistics',
    '',
    '| Source | Transactions | Valid entries | Malformed entries | Currency/entry normalization corrections | Unsupported currencies | Zero amounts | Negative amounts |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...audit.statistics.map(
      (item) =>
        `| ${item.source} | ${item.records} | ${item.validEntries} | ${item.malformedEntries} | ${item.normalizationCorrections} | ${item.unsupportedCurrencies ?? 'not checked'} | ${item.zeroAmounts} | ${item.negativeAmounts} |`,
    ),
    '',
  )
  for (const stats of audit.statistics) {
    const aggregate = (value) =>
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b, 'en'))
        .map(([key, count]) => `${cell(key)}: ${count}`)
        .join('; ') || 'none'
    lines.push(
      `### ${stats.source}`,
      '',
      `- Normalized currencies observed: ${aggregate(stats.currencies)}`,
      `- Raw currency forms: ${aggregate(stats.rawCurrencyForms)}`,
      `- Raw statuses observed: ${aggregate(stats.statuses)}`,
      `- Missing/null resolved status: ${stats.missingStatuses} (explicit null aliases: ${stats.nullStatuses}). Allowed by the current inclusion rules.`,
      '',
    )
  }
  lines.push(
    '## Existing known limitations',
    '',
    'The documented APIs do not guarantee stable transaction IDs or dates, business authentication/isolation, mutation endpoints, or server pagination. Current detail IDs use source/index. These are baseline limitations, not newly discovered defects. Zero and negative amounts and absent statuses are not prohibited by the current schemas.',
    '',
    '## Backend action list',
    '',
  )
  const actions = [
    ...new Map(
      audit.findings.map((item) => [`${item.severity}|${item.fix}`, item]),
    ).values(),
  ]
  if (!actions.length)
    lines.push(
      'No new backend fix identified by this audit. Maintain contract validation and review known limitations separately.',
    )
  actions.forEach((item, index) =>
    lines.push(
      `${index + 1}. [${item.severity}] ${cell(item.fix)} (${item.source}; ${item.code})`,
    ),
  )
  return redact(lines.join('\n') + '\n', secrets)
}

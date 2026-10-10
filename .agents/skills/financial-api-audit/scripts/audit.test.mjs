import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadProjectContracts, discoverSources } from './project-contracts.mjs'
import { auditResponses, renderReport } from './audit.mjs'
import { fetchSource, saveReport } from './run.mjs'
import { markdownToHtml } from './report-pdf.mjs'

const contracts = await loadProjectContracts()

const timestamp = '2026-10-10T10:00:00.000Z'
function responses(
  first = [{ type: 'paid', amount: '100.00', currency: 'USD' }],
  second = ['80 EUR'],
  rates = { USD: '1', EUR: '0.8' },
) {
  return [
    {
      name: 'finance1',
      ok: true,
      status: 200,
      contentType: 'application/json',
      data: { transactions: first },
    },
    {
      name: 'finance2',
      ok: true,
      status: 200,
      contentType: 'application/json',
      data: second,
    },
    {
      name: 'exchange-rates',
      ok: true,
      status: 200,
      contentType: 'application/json',
      data: { base: 'USD', date: timestamp, rates },
    },
  ]
}
const audit = (values) => auditResponses(values, contracts, { timestamp })
const find = (result, code) =>
  result.findings.filter((item) => item.code === code)

test('grouping preserves the highest severity regardless of record order', () => {
  const first = { amount: '100', currency: 'XYZ', type: 'pending' }
  const second = { amount: '100', currency: 'XYZ', type: 'paid' }
  for (const rows of [
    [first, second],
    [second, first],
  ]) {
    const issue = find(audit(responses(rows)), 'UNSUPPORTED_CURRENCY')[0]
    assert.equal(issue.count, 2)
    assert.equal(issue.severity, 'error')
  }
})

test('valid populated responses produce no new findings and deterministic reports', () => {
  const result = audit(responses())
  assert.deepEqual(result.findings, [])
  assert.equal(result.normalizedCount, 2)
  assert.equal(renderReport(result), renderReport(audit(responses())))
})

test('lowercase valid currency is formatting, not an unsupported code', () => {
  const result = audit(
    responses([{ amount: '100', currency: 'usd', type: 'paid' }]),
  )
  assert.equal(find(result, 'CURRENCY_CASE').length, 1)
  assert.equal(find(result, 'UNSUPPORTED_CURRENCY').length, 0)
  assert.equal(result.statistics[0].currencies.USD, 1)
})

test('unsupported currency is checked against validated rates, not an invented ISO list', () => {
  const result = audit(
    responses([{ amount: '100', currency: 'XYZ', type: 'paid' }]),
  )
  assert.equal(find(result, 'UNSUPPORTED_CURRENCY')[0].severity, 'error')
  assert.match(
    find(result, 'UNSUPPORTED_CURRENCY')[0].actual,
    /ISO validity is not established/,
  )
})

test('whitespace, status casing and repeated corrections are grouped', () => {
  const result = audit(
    responses(
      [
        { amount: ' 100 ', currency: ' usd ', type: ' Paid ' },
        { amount: '200', currency: ' usd ', type: ' Paid ' },
      ],
      [' 80   eur '],
    ),
  )
  assert.equal(
    find(result, 'CURRENCY_CASE').find((item) => item.source === 'finance1')
      .count,
    2,
  )
  assert.equal(find(result, 'STATUS_CASE')[0].count, 2)
  assert.equal(find(result, 'STATUS_WHITESPACE')[0].count, 2)
  assert.equal(find(result, 'ENTRY_WHITESPACE')[0].count, 1)
  assert.equal(find(result, 'AMOUNT_WHITESPACE')[0].count, 1)
})

test('malformed, missing, null, NaN and infinity amounts/currencies are rejected', () => {
  for (const amount of [
    'oops',
    'NaN',
    'Infinity',
    NaN,
    Infinity,
    null,
    {},
    undefined,
  ]) {
    const result = audit(responses([{ amount, currency: 'USD', type: 'paid' }]))
    assert.equal(find(result, 'INVALID_AMOUNT').length, 1)
    assert.equal(result.statistics[0].malformedEntries, 1)
  }
  for (const currency of [undefined, null, {}, 'US Dollar', '']) {
    assert.equal(
      find(audit(responses([{ amount: '100', currency }])), 'INVALID_CURRENCY')
        .length,
      1,
    )
  }
})

test('unknown and conflicting explicit statuses are recoverable warnings', () => {
  const result = audit(
    responses([
      { amount: '100', currency: 'USD', status: 'refund', type: 'paid' },
    ]),
  )
  assert.equal(find(result, 'UNKNOWN_STATUS')[0].severity, 'warning')
  assert.equal(find(result, 'STATUS_CONFLICT')[0].severity, 'warning')
})

test('missing statuses and zero/negative values are allowed, not invented bugs', () => {
  const result = audit(
    responses([
      { amount: '0', currency: 'USD' },
      { amount: '-5', currency: 'USD', type: null },
    ]),
  )
  assert.deepEqual(result.findings, [])
  assert.equal(result.statistics[0].missingStatuses, 2)
  assert.equal(result.statistics[0].zeroAmounts, 1)
  assert.equal(result.statistics[0].negativeAmounts, 1)
})

test('malformed source contracts, rows and rate schema failure remain explicit', () => {
  const values = responses(
    [null, { amount: '5', currency: 'USD' }],
    [25, '100 USD extra'],
  )
  values[2].data.rates.EUR = '0'
  const result = audit(values)
  assert.equal(result.statistics[0].malformedEntries, 1)
  assert.equal(result.statistics[1].malformedEntries, 2)
  assert.equal(result.rateSupportAvailable, false)
  assert.equal(find(result, 'UNSUPPORTED_CURRENCY').length, 0)
  values[0].data = { wrong: [] }
  assert.ok(
    audit(values).findings.some(
      (item) =>
        item.source === 'finance1' && item.category === 'Response contract',
    ),
  )
})

test('optional supplied identifiers are checked without requiring undocumented IDs', () => {
  const result = audit(
    responses([
      { id: 'example-id', amount: '5', currency: 'USD', type: 'paid' },
      { id: 'example-id', amount: '6', currency: 'USD', type: 'paid' },
    ]),
  )
  assert.equal(find(result, 'CONFLICTING_ID').length, 1)
  assert.equal(find(result, 'CONFLICTING_ID')[0].severity, 'warning')
  assert.ok(!renderReport(result).includes('example-id'))
})

test('amount representation and precision risks are distinct from schema validity', () => {
  const result = audit(
    responses([
      { amount: 100, currency: 'USD' },
      { amount: '1.005', currency: 'USD' },
      { amount: Number.MAX_SAFE_INTEGER * 2, currency: 'USD' },
    ]),
  )
  assert.equal(find(result, 'AMOUNT_REPRESENTATION').length, 1)
  assert.equal(find(result, 'EXTRA_PRECISION')[0].severity, 'info')
  assert.equal(find(result, 'UNSAFE_NUMBER')[0].severity, 'error')
})

test('reports redact configured secrets, authorization data and URLs', () => {
  const secret = 'test-key-123456'
  const values = responses([
    {
      amount: secret,
      currency: secret,
      status: `Bearer ${secret}`,
      type: 'paid',
    },
  ])
  const result = auditResponses(values, contracts, {
    timestamp,
    secrets: [secret],
  })
  const text = renderReport(result, [secret])
  assert.ok(!text.includes(secret))
  assert.ok(!text.includes('Bearer'))
  assert.ok(!text.includes('apikey='))
  assert.match(text, /REDACTED/)
})

test('individual HTTP, JSON and content type failures keep other source coverage', async () => {
  const source = {
    name: 'finance1',
    url: 'https://fixture.invalid/finance1',
    envName: 'TEST_KEY',
    auth: 'header',
  }
  const env = { TEST_KEY: 'fixture-key' }
  const failed = await fetchSource(
    source,
    env,
    async () => new Response('', { status: 401 }),
  )
  const invalid = await fetchSource(
    source,
    env,
    async () => new Response('not-json', { status: 200 }),
  )
  assert.equal(failed.status, 401)
  assert.equal(invalid.failure, 'invalid JSON')
  const values = responses()
  values[0] = failed
  values[1].contentType = 'text/plain'
  const result = audit(values)
  assert.equal(find(result, 'SOURCE_FAILED').length, 1)
  assert.equal(find(result, 'CONTENT_TYPE').length, 1)
  assert.equal(
    result.metadata.find((item) => item.name === 'finance2').fetched,
    true,
  )
})

test('requests never leak credential URLs on network failure and refuse redirects', async () => {
  const source = {
    name: 'exchange-rates',
    url: 'https://fixture.invalid/rates',
    envName: 'TEST_KEY',
    auth: 'query',
  }
  const response = await fetchSource(
    source,
    { TEST_KEY: 'fixture-key' },
    async (url, options) => {
      assert.equal(options.redirect, 'error')
      throw new Error(String(url))
    },
  )
  assert.ok(!JSON.stringify(response).includes('fixture-key'))
  assert.equal(response.ok, false)
})

const directory = await mkdtemp(join(tmpdir(), 'financial-api-audit-test-'))
after(() => rm(directory, { recursive: true, force: true }))
test('same-minute reports do not overwrite previous reports', async () => {
  const date = new Date(timestamp)
  const first = await saveReport('first', date, directory)
  const second = await saveReport('second', date, directory)
  assert.notEqual(first, second)
  assert.equal(await readFile(first, 'utf8'), 'first')
  assert.equal(await readFile(second, 'utf8'), 'second')
})

test('PDF markup escapes all report text and contains no remote resources', () => {
  const html = markdownToHtml(
    '# Financial API Audit Report\n<script>bad()</script>\n| A | B |\n| --- | --- |\n| 1 | 2 |',
  )
  assert.ok(!html.includes('<script>'))
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /<table>/)
  assert.match(html, /default-src 'none'/)
})

test('source URLs and credential variable names are discovered from current clients', () => {
  const sources = discoverSources()
  assert.equal(sources.length, 3)
  assert.equal(sources[0].envName, 'VITE_FINANCE_API_KEY')
  assert.equal(sources[2].envName, 'VITE_CURRENCYFREAKS_API_KEY')
})

test('all rows with the same formatting defect are counted, with bounded examples', () => {
  const result = audit(
    responses(
      Array.from({ length: 20 }, () => ({
        amount: '100',
        currency: 'usd',
        type: 'paid',
      })),
    ),
  )
  const issue = find(result, 'CURRENCY_CASE')[0]
  assert.equal(issue.count, 20)
  assert.equal(issue.examples.length, 3)
})

test('null required fields and alternate names are detected; optional null status is allowed', () => {
  const result = audit(
    responses([
      { Amount: '5', amount: undefined, currency: null, status: null },
    ]),
  )
  assert.equal(find(result, 'FIELD_NAME').length, 1)
  assert.equal(find(result, 'INVALID_AMOUNT').length, 1)
  assert.equal(find(result, 'INVALID_CURRENCY').length, 1)
})

test('rate unavailability preserves inspection without unsupported-currency claims', () => {
  const values = responses([{ amount: '100', currency: 'XYZ' }])
  values[2] = {
    name: 'exchange-rates',
    ok: false,
    failure: 'network or timeout',
  }
  const result = audit(values)
  assert.equal(result.normalizedCount, 2)
  assert.equal(find(result, 'UNSUPPORTED_CURRENCY').length, 0)
  assert.equal(result.statistics[0].unsupportedCurrencies, null)
})

test('empty responses are contextual observations, not inferred missing records', () => {
  const result = audit(responses([], []))
  assert.equal(find(result, 'EMPTY_SOURCE').length, 2)
  assert.ok(
    find(result, 'EMPTY_SOURCE').every((item) => item.severity === 'info'),
  )
})

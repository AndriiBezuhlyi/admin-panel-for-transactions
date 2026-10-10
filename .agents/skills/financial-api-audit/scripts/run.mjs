import { mkdir, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnv } from 'vite'
import {
  root,
  discoverSources,
  loadProjectContracts,
} from './project-contracts.mjs'
import { auditResponses, renderReport } from './audit.mjs'

export async function fetchSource(source, env, fetcher = fetch) {
  const key = env[source.envName]
  if (!key)
    return {
      name: source.name,
      ok: false,
      failure: 'credential not configured',
    }
  const url = new URL(source.url)
  const headers = { Accept: 'application/json' }
  if (source.auth === 'header') headers['x-api-key'] = key
  else url.searchParams.set('apikey', key)
  try {
    const response = await fetcher(url, {
      headers,
      signal: AbortSignal.timeout(60000),
      redirect: 'error',
    })
    if (!response.ok)
      return {
        name: source.name,
        ok: false,
        status: response.status,
        failure: 'non-success HTTP status',
      }
    const text = await response.text()
    if (text.length > 10 * 1024 * 1024)
      return {
        name: source.name,
        ok: false,
        status: response.status,
        failure: 'response exceeds audit size limit',
      }
    let data
    try {
      data = JSON.parse(text)
    } catch {
      return {
        name: source.name,
        ok: false,
        status: response.status,
        failure: 'invalid JSON',
      }
    }
    return {
      name: source.name,
      ok: true,
      status: response.status,
      contentType:
        response.headers
          .get('content-type')
          ?.split(';')[0]
          .trim()
          .toLowerCase() ?? '(missing)',
      data,
    }
  } catch {
    // Never expose the raw fetch error: Node may include the credential-bearing URL.
    return {
      name: source.name,
      ok: false,
      failure: 'network, timeout, or rejected redirect',
    }
  }
}

export async function saveReport(
  markdown,
  date = new Date(),
  directory = resolve(root, 'reports/api-audit'),
) {
  await mkdir(directory, { recursive: true })
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(date)
    .replace(' ', '-')
    .replace(':', '')
  const base = `financial-api-audit-${parts}`
  for (let index = 0; index < 10000; index += 1) {
    const path = resolve(directory, `${base}${index ? `-${index}` : ''}.md`)
    try {
      await writeFile(path, markdown, { flag: 'wx', mode: 0o600 })
      return path
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
    }
  }
  throw new Error('Report filename allocation exhausted')
}

async function main() {
  const args = process.argv.slice(2)
  if (args.some((arg) => arg !== '--pdf'))
    throw new Error('Unsupported audit option')
  // Existing Vite loading rules: .env, .env.local, mode files, then process environment.
  const env = loadEnv('development', root, '')
  const sources = discoverSources()
  const secrets = Object.entries(env)
    .filter(([name]) =>
      /key|secret|token|password|authorization|credential/i.test(name),
    )
    .map(([, value]) => value)
  const contracts = await loadProjectContracts()
  const responses = await Promise.all(
    sources.map((source) => fetchSource(source, env)),
  )
  const audit = auditResponses(responses, contracts, { secrets })
  const path = await saveReport(renderReport(audit, secrets))
  console.info(`Markdown report: ${relative(root, path)}`)
  console.info(
    `Sources fetched: ${audit.metadata.filter((item) => item.fetched).length}/${sources.length}; grouped findings: ${audit.findings.length}`,
  )
  process.exitCode = responses.every((response) => response.ok) ? 0 : 2
  if (args.includes('--pdf')) {
    try {
      const { reportToPdf } = await import('./report-pdf.mjs')
      const pdf = await reportToPdf(path)
      console.info(
        `PDF report: ${relative(root, pdf.path)}; pages: ${pdf.pages}`,
      )
    } catch {
      console.error('PDF generation failed; Markdown report remains available.')
      process.exitCode = 3
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch(() => {
    console.error(
      'Audit setup/output failed. Inspect project contracts and local tooling without exposing credentials.',
    )
    process.exitCode = 1
  })
}

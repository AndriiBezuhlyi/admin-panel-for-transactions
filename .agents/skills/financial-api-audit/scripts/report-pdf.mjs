import { readFile, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'
import { root } from './project-contracts.mjs'

const escape = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/)
  const blocks = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line.trim()) continue
    if (line.startsWith('|')) {
      const table = []
      while (index < lines.length && lines[index].startsWith('|'))
        table.push(lines[index++])
      index -= 1
      const rows = table
        .filter((row) => !/^\|[\s|:-]+\|$/.test(row))
        .map((row, i) => {
          const tag = i === 0 ? 'th' : 'td'
          return `<tr>${row
            .slice(1, -1)
            .split(/(?<!\\)\|/)
            .map((value) => `<${tag}>${escape(value.trim())}</${tag}>`)
            .join('')}</tr>`
        })
      blocks.push(`<table>${rows.join('')}</table>`)
    } else {
      const heading = /^(#{1,4}) (.*)$/.exec(line)
      blocks.push(
        heading
          ? `<h${heading[1].length}>${escape(heading[2])}</h${heading[1].length}>`
          : `<p${line.startsWith('  ') ? ' class="indent"' : ''}>${escape(line)}</p>`,
      )
    }
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Financial API Audit Report</title><style>
    body { font: 11px/1.5 Arial, sans-serif; color: #202c40; }
    h1 { font-size: 23px; } h2 { font-size: 17px; margin-top: 24px; border-bottom: 1px solid #ddd; } h3 { font-size: 13px; }
    h1,h2,h3 { break-after: avoid; } p { margin: 5px 0; overflow-wrap: anywhere; } .indent { margin-left: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; margin: 12px 0; }
    th,td { padding: 5px; border: 1px solid #ddd; text-align: left; overflow-wrap: anywhere; } th { background: #f2f4f8; }
    tr { break-inside: avoid; }
  </style></head><body>${blocks.join('\n')}</body></html>`
}

export async function reportToPdf(markdownPath) {
  const path = resolve(markdownPath)
  const reportRoot = resolve(root, 'reports/api-audit')
  if (!path.startsWith(reportRoot + sep) || !path.endsWith('.md'))
    throw new Error('Expected a local audit Markdown report')
  const markdown = await readFile(path, 'utf8')
  if (!markdown.startsWith('# Financial API Audit Report'))
    throw new Error('Not a financial audit report')
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const page = await browser.newPage()
    await page.route('**/*', (route) => route.abort())
    await page.setContent(markdownToHtml(markdown))
    if ((await page.locator('h1').innerText()) !== 'Financial API Audit Report')
      throw new Error('Print layout verification failed')
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
    })
    if (!buffer.subarray(0, 5).equals(Buffer.from('%PDF-')))
      throw new Error('Invalid PDF')
    const pdfPath = path.replace(/\.md$/, '.pdf')
    await writeFile(pdfPath, buffer, { flag: 'wx', mode: 0o600 })
    return {
      path: pdfPath,
      pages: (buffer.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? [])
        .length,
    }
  } finally {
    await browser.close()
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  reportToPdf(process.argv[2] ?? '')
    .then((result) =>
      console.info(
        `PDF report: ${relative(root, result.path)}; pages: ${result.pages}`,
      ),
    )
    .catch(() => {
      console.error(
        'PDF generation failed. Use an existing local audit report and installed Microsoft Edge; outputs are not overwritten.',
      )
      process.exitCode = 1
    })
}

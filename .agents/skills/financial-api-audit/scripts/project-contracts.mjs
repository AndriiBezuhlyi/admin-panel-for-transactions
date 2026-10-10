import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

export const root = fileURLToPath(new URL('../../../../', import.meta.url))

// Expose existing private schemas only in memory. Never rewrite production files.
export async function loadProjectContracts() {
  const modelPath = resolve(root, 'src/features/transactions/model.ts')
  const ratesPath = resolve(root, 'src/features/exchange-rates/queries.ts')
  const aliases = new Map([
    [
      modelPath,
      [
        'firstSourceSchema',
        'secondSourceSchema',
        'amountSchema',
        'currencySchema',
      ],
    ],
    [ratesPath, ['schema']],
  ])
  const hooks = registerHooks({
    resolve(specifier, context, next) {
      if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
        const candidate = fileURLToPath(new URL(specifier, context.parentURL))
        if (
          candidate.startsWith(resolve(root, 'src')) &&
          existsSync(`${candidate}.ts`)
        ) {
          return next(pathToFileURL(`${candidate}.ts`).href, context)
        }
      }
      return next(specifier, context)
    },
    load(url, context, next) {
      if (!url.startsWith('file:') || !url.endsWith('.ts'))
        return next(url, context)
      const filename = fileURLToPath(url)
      if (!filename.startsWith(resolve(root, 'src'))) return next(url, context)
      let source = readFileSync(filename, 'utf8')
      const exposed = aliases.get(filename)
      if (exposed) {
        const tree = ts.createSourceFile(
          filename,
          source,
          ts.ScriptTarget.Latest,
          true,
        )
        const names = new Set(
          tree.statements
            .filter(ts.isVariableStatement)
            .flatMap((statement) => statement.declarationList.declarations)
            .filter((declaration) => ts.isIdentifier(declaration.name))
            .map((declaration) => declaration.name.text),
        )
        if (exposed.some((name) => !names.has(name)))
          throw new Error('Project schema adapter is outdated')
        source += `\nexport { ${exposed.join(', ')} };\n`
      }
      return {
        shortCircuit: true,
        format: 'module',
        source: ts.transpileModule(source, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2023,
            module: ts.ModuleKind.ESNext,
          },
        }).outputText,
      }
    },
  })
  try {
    const [model, rates] = await Promise.all([
      import(pathToFileURL(modelPath).href),
      import(pathToFileURL(ratesPath).href),
    ])
    return { ...model, ratesSchema: rates.schema }
  } finally {
    hooks.deregister()
  }
}

export function discoverSources() {
  const files = [
    'src/features/transactions/queries.ts',
    'src/features/exchange-rates/queries.ts',
  ]
  const values = files.map((file) => {
    const source = readFileSync(resolve(root, file), 'utf8')
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
    const urls = []
    const envNames = new Set()
    function visit(node) {
      if (ts.isStringLiteral(node) && /^https:\/\//.test(node.text))
        urls.push(node.text)
      if (
        ts.isPropertyAccessExpression(node) &&
        node.expression.getText(tree) === 'import.meta.env'
      )
        envNames.add(node.name.text)
      ts.forEachChild(node, visit)
    }
    visit(tree)
    return { urls, envNames: [...envNames] }
  })
  if (values[0].envNames.length !== 1 || values[1].envNames.length !== 1)
    throw new Error('Ambiguous credential configuration')
  const finance1 = values[0].urls.find((url) =>
    new URL(url).pathname.endsWith('/finance1'),
  )
  const finance2 = values[0].urls.find((url) =>
    new URL(url).pathname.endsWith('/finance2'),
  )
  if (!finance1 || !finance2 || values[1].urls.length !== 1)
    throw new Error('API discovery adapter is outdated')
  return [
    {
      name: 'finance1',
      url: finance1,
      envName: values[0].envNames[0],
      auth: 'header',
    },
    {
      name: 'finance2',
      url: finance2,
      envName: values[0].envNames[0],
      auth: 'header',
    },
    {
      name: 'exchange-rates',
      url: values[1].urls[0],
      envName: values[1].envNames[0],
      auth: 'query',
    },
  ]
}

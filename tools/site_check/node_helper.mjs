import { readFile } from 'node:fs/promises'
import MiniSearch from 'minisearch'

// These are VitePress 1.6.4's build/load options. This site's config adds no
// tokenize/processTerm override (see VPLocalSearchBox.vue and the local plugin).
const searchOptions = {
  fields: ['title', 'titles', 'text'],
  storeFields: ['title', 'titles'],
  searchOptions: {
    fuzzy: 0.2,
    prefix: true,
    boost: { title: 4, text: 2, titles: 1 },
  },
}

async function main() {
  const [operation, ...args] = process.argv.slice(2)
  if (operation === 'emoji' && args.length === 0) {
    process.stdin.setEncoding('utf8')
    let text = ''
    for await (const chunk of process.stdin) text += chunk
    return /\p{Emoji_Presentation}|\uFE0F/u.test(text)
  }
  if (operation !== 'search' || args.length !== 2) {
    throw new Error('usage: node_helper.mjs emoji | search <index.js> <query>')
  }

  const [indexPath, query] = args
  const source = await readFile(indexPath, 'utf8')
  // The generated index is a self-contained ESM module, even when its .js file
  // is outside a package with type: module (as in the isolated test fixtures).
  const module = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  if (typeof module.default !== 'string') {
    throw new Error('search index default export must be a MiniSearch JSON string')
  }
  const serialized = JSON.parse(module.default)
  if (!serialized || typeof serialized.documentIds !== 'object' || serialized.documentIds === null) {
    throw new Error('search index must contain documentIds')
  }
  const index = MiniSearch.loadJSON(module.default, searchOptions)
  return {
    results: index.search(query),
    documentIds: Object.values(serialized.documentIds),
  }
}

try {
  process.stdout.write(`${JSON.stringify(await main())}\n`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`node_helper: ${message.replace(/\s+/g, ' ')}\n`)
  process.exitCode = 1
}

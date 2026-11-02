import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parse } from '@vue/compiler-dom'
import { parse as parseSfc, babelParse } from 'vue/compiler-sfc'
import { createMarkdownRenderer } from 'vitepress'
import { createDisplayTextLookup } from '../docs/.vitepress/theme/bunny-site.mjs'
import { garmentModel, formatTarget } from '../docs/.vitepress/theme/components/garment-measurements.mjs'
import { measurementModel } from '../docs/.vitepress/theme/components/body-measurements.mjs'

// A copied data tree lets the same assertions exercise a mutation without editing
// the working catalog. Audit/evidence fields are intentionally not page content.
const root = process.env.BUNNY_RENDER_DATA_ROOT ?? fileURLToPath(new URL('../', import.meta.url))
// The Markdown override is the docs directory itself, not a repository root.
const markdownRoot = process.env.BUNNY_RENDER_MARKDOWN_ROOT ?? resolve(root, 'docs')
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const json = (path) => JSON.parse(read(path))
const displayText = json('docs/.vitepress/data/bunny/display-text.json')
const display = createDisplayTextLookup(displayText)
const forbidden = /Phase\s*(?!Final(?![a-z]))[A-Z]|阶段\s*[A-Z]|新图|新侧面|新批准|旧图|旧读数|旧测点|重读|复读|不沿用|不继承|更换前|本轮|历史|工作稿/u

// Unicode format characters (including zero-width spaces/joiners) must not
// let visually adjacent letters bypass the same assertion.
const renderedText = (text) => text.replace(/\p{Cf}/gu, '')
const textBlocks = new Set(['p', 'li', 'td', 'th', 'dt', 'dd', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'summary', 'caption', 'figcaption', 'pre', 'code'])

function flattenedText(node) {
  if (node.type === 2) return node.content
  if (node.tag === 'br') return '\n'
  if (['script', 'style'].includes(node.tag)) return ''
  return (node.children ?? []).map(flattenedText).join('')
}

// The parser bundled with the installed Vue SFC compiler understands TS as
// well as JS and decodes string escapes. No code from a fixture is executed.
function javascriptLiterals(source, expression = false) {
  let ast
  const options = { sourceType: 'module', plugins: ['typescript'], allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true }
  if (expression) {
    try { ast = babelParse(`(${source})`, options) } catch { /* event handlers can contain statements */ }
  }
  ast ??= babelParse(source, options)
  const literals = []
  function walk(node) {
    if (!node || typeof node !== 'object') return
    if (node.type === 'StringLiteral') literals.push({ text: node.value, line: node.loc.start.line })
    if (node.type === 'TemplateElement') literals.push({ text: node.value.cooked ?? node.value.raw, line: node.loc.start.line })
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'comments', 'leadingComments', 'innerComments', 'trailingComments', 'tokens'].includes(key)) continue
      if (Array.isArray(value)) value.forEach(walk)
      else if (value && typeof value === 'object') walk(value)
    }
  }
  walk(ast)
  return literals
}

const displayFile = 'docs/.vitepress/data/bunny/display-text.json'
const garmentFile = 'catalog/bunny/garment-measurements.json'
const bodyFile = 'catalog/bunny/body-measurements.json'
const daggerFile = 'catalog/bunny/dagger-dimensions.json'

function stringLeaves(value, path = '$') {
  if (typeof value === 'string') return [[path, value]]
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]) => stringLeaves(child,
    Array.isArray(value) ? `${path}[${key}]` : `${path}[${JSON.stringify(key)}]`))
}

function assertRendered(entries, sourceFiles = []) {
  const hits = []
  // Models contain generated labels as well as catalog strings. Locate a failed
  // string in its actual JSON source (including display-text replacements), not
  // at a made-up model path. Only rendered entries can trigger an assertion.
  const sources = sourceFiles.flatMap((file) => stringLeaves(json(file)).map(([path, text]) => [`${file}#${path}`, text]))
  for (const [location, text] of entries) {
    if (typeof text !== 'string') continue
    for (const match of renderedText(text).matchAll(new RegExp(forbidden.source, 'gu'))) {
      const origins = sources.filter(([, value]) => value === text).map(([path]) => path)
      const path = origins.length ? origins.join(' | ')
        : sourceFiles.length ? `${sourceFiles[0]}#$ (rendered model field ${location})` : location
      hits.push(`${path}: matched ${JSON.stringify(match[0])}: ${text}`)
    }
  }
  assert.equal(hits.length, 0, hits.join('\n'))
}

function fields(object, names, prefix, transform = display) {
  return names.map((name) => [`${prefix}.${name}`, transform(object?.[name])])
}

test('all 18 garment models display current image readings without process commentary', () => {
  const data = json('catalog/bunny/garment-measurements.json')
  const models = Object.keys(data.sources).map((id) => garmentModel(data, id))
  assert.equal(models.length, 18)
  const entries = [
    ...fields(data.designUnit, ['definition'], 'designUnit'),
    ...fields(data, ['exposureRule'], 'garment'),
    ...Object.entries(displayText['@labels']).filter(([id]) => id.startsWith('garment.')),
    ...Object.entries(data.metrics).flatMap(([id, metric]) => fields(metric, ['label'], `metrics.${id}`)),
  ]
  for (const model of models) {
    const path = `garment.${model.id}`
    entries.push(...fields(model, ['label'], path), ...fields(model.source, ['sha256'], `${path}.source`))
    entries.push(...fields(model.registration, ['label', 'reason'], `${path}.registration`))
    for (const anchor of model.registration.anchors) {
      entries.push([`${path}.registration.${anchor.id}`, display(anchor.label || anchor.id)])
    }
    for (const row of model.rows) {
      const rowPath = `${path}.${row.id}`
      // Includes notes/definitions for every source, plus comparison-table reasons.
      entries.push(...fields(row, ['symbol', 'label', 'targetText', 'reason', 'definition', 'notes'], rowPath))
      entries.push(...fields(row, ['statusLabel'], rowPath, (value) => value))
      entries.push(...fields(row.referencePosition, ['basis'], `${rowPath}.referencePosition`))
    }
    for (const row of model.derived) {
      const rowPath = `${path}.derived.${row.id}`
      entries.push(...fields(row, ['label', 'referenceSourceLabel', 'reason'], rowPath))
      entries.push([`${rowPath}.indicationLabel`, row.indicationLabel])
      entries.push([`${rowPath}.targetText`, display(formatTarget(row.target))])
      entries.push([`${rowPath}.notes`, display(data.displayNotes?.derived?.[model.id]?.[row.id] ?? row.notes)])
    }
  }
  assertRendered(entries, [garmentFile, displayFile])
})

test('body models apply display text to every rendered definition and unavailable-point reason', () => {
  const data = json('catalog/bunny/body-measurements.json')
  const models = Object.keys(data.views).map((id) => measurementModel(data, id))
  assert.equal(models.length, 3)
  const entries = []
  for (const model of models) {
    const path = `body.${model.id}`
    entries.push([`${path}.viewLabel`, displayText['@labels'][path]], [`${path}.widthRatio`, model.widthRatio])
    for (const row of model.rows) {
      const rowPath = `${path}.${row.id}`
      entries.push(...fields(row, ['symbol', 'label', 'status'], rowPath))
      entries.push(...fields(row, row.px === null ? ['reason'] : ['definition', 'coordinates', 'uncertainty', 'endpointNotes'], rowPath))
    }
  }
  assertRendered(entries, [bodyFile, displayFile])
})

test('dagger specification prose accompanying the page readings has no process commentary', () => {
  const data = json('catalog/bunny/dagger-dimensions.json')
  const entries = [
    ...fields(data.designUnit, ['definition'], 'dagger.designUnit'),
    ...fields(data.definitions, Object.keys(data.definitions), 'dagger.definitions'),
    ...fields(data.designTargets, ['meaning'], 'dagger.designTargets'),
    ...fields(data.referenceBasis, ['meaning'], 'dagger.referenceBasis'),
    ...fields(data.carryingDesign, ['definition', 'note', 'visibleAppearance'], 'dagger.carryingDesign'),
    ...fields(data.currentDimensions, ['meaning'], 'dagger.currentDimensions'),
    ...data.figureObservations.flatMap((item, i) => fields(item, ['meaning'], `dagger.figureObservations.${i}`)),
  ]
  // These structures are downloadable prose, not a rendered Vue model. Walk
  // only the requested prose keys, wherever they occur, without scanning audit.
  function collectStructure(value, path = '$') {
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      const next = Array.isArray(value) ? `${path}[${key}]` : `${path}[${JSON.stringify(key)}]`
      if (key === 'observedStructure' || key === 'tab_position') {
        entries.push(...stringLeaves(child, next).map(([keyPath, text]) => [`${daggerFile}#${keyPath}`, text]))
      } else if (key !== 'auditNotes') collectStructure(child, next)
    }
  }
  collectStructure(data)
  assertRendered(entries, [daggerFile, displayFile])
})

// Source markers are inserted by renderer hooks after Markdown parsing. They
// leave VitePress's real token parsing, plugins and HTML rendering in place and
// give the HTML AST original Markdown line ranges (not rendered HTML lines).
function trackMarkdownSources(md) {
  md.core.ruler.push('bunny-test-source-lines', (state) => {
    for (const token of state.tokens) {
      if (token.type === 'inline' && token.map) {
        for (const child of token.children ?? []) child.map ??= token.map
      }
    }
  })
  const marker = (token) => token.map && !token.hidden ? `<!--bunny-source:${token.map[0]}:${token.map[1]}-->` : ''
  const renderToken = md.renderer.renderToken.bind(md.renderer)
  md.renderer.renderToken = (tokens, index, ...args) => marker(tokens[index]) + renderToken(tokens, index, ...args)
  for (const [name, render] of Object.entries(md.renderer.rules)) {
    md.renderer.rules[name] = (tokens, index, ...args) => marker(tokens[index]) + render(tokens, index, ...args)
  }
}

function markdownEntries(md, path, source) {
  const env = { relativePath: path.replace(/^docs\//, '') }
  const html = md.render(source, env)
  const content = env.content ?? source
  const offset = source.slice(0, source.length - content.length).split('\n').length - 1
  const lines = source.split('\n')
  const entries = []
  let range = [0, content.split('\n').length]
  function add(text, detail = '', sourceRange = range) {
    if (typeof text !== 'string') return
    // A paragraph can span lines; report the source lines containing the match.
    const words = [...renderedText(text).matchAll(new RegExp(forbidden.source, 'gu'))].map(([word]) => word)
    const matchingLines = lines.flatMap((line, index) => index >= offset + sourceRange[0] && index < offset + sourceRange[1]
      && words.some((word) => line.includes(word)) ? [index + 1] : [])
    // A match across a soft break is absent from any one source line. Locate
    // its start within the original range, allowing whitespace at that break.
    const sourceText = lines.slice(offset + sourceRange[0], offset + sourceRange[1]).join('\n')
    const normalizedSource = renderedText(sourceText)
    const spanningMatch = forbidden.exec(normalizedSource)
    const spanningLine = spanningMatch ? normalizedSource.slice(0, spanningMatch.index).split('\n').length - 1 : 0
    const sourceLines = matchingLines.length ? matchingLines.join(',') : offset + sourceRange[0] + spanningLine + 1
    entries.push([`${path}:${sourceLines}${detail}`, text])
  }
  function collect(node) {
    if (node.type === 3) {
      const match = /^bunny-source:(\d+):(\d+)$/.exec(node.content)
      if (match) range = [Number(match[1]), Number(match[2])]
      return
    }
    if (['script', 'style'].includes(node.tag)) return
    if (node.type === 5) {
      add(node.content.content, ' (Vue interpolation)')
      for (const literal of javascriptLiterals(node.content.content, true)) add(literal.text, ' (Vue interpolation string)')
    }
    for (const prop of node.props ?? []) {
      if (prop.type === 6 && ['alt', 'caption', 'detail', 'title', 'aria-label'].includes(prop.name)) {
        add(prop.value?.content, ` (${node.tag}.${prop.name})`)
      }
      if (prop.type === 7 && prop.exp) {
        for (const literal of javascriptLiterals(prop.exp.content, true)) {
          add(literal.text, ` (${node.tag} v-${prop.name} string)`)
        }
      }
    }
    const blockRange = [...range]
    // Markers can split a single rendered text run at every Markdown softbreak.
    // Rejoin sibling text nodes across comments, retaining their source range;
    // never join across elements, where there may be a real layout boundary.
    let pending = ''
    let pendingRange
    function flush() {
      if (pending) add(pending, '', pendingRange)
      pending = ''
      pendingRange = undefined
    }
    for (const child of node.children ?? []) {
      if (child.type === 3) { collect(child); continue }
      if (child.type === 2) {
        pending += child.content
        pendingRange = pendingRange ? [Math.min(pendingRange[0], range[0]), Math.max(pendingRange[1], range[1])] : [...range]
      } else {
        flush()
        collect(child)
      }
    }
    flush()
    // Inspect the visible phrase across inline elements, including highlighted
    // code spans; separate paragraphs are never flattened together.
    if (textBlocks.has(node.tag)) {
      add(flattenedText(node), ` (<${node.tag}> text)`, [blockRange[0], Math.max(blockRange[1], range[1])])
    }
  }
  collect(parse(html, { whitespace: 'preserve' }))
  // Scanned frontmatter: title/titleTemplate (document title), description
  // (page metadata), category (ReferenceCard), hero/features (home theme), and
  // prev/next (default-theme footer text). Nested content includes image alt,
  // action text, feature title/details/linkText and textual feature icons.
  // Excluded top-level controls: layout/bunny/layer select components/data;
  // sidebar/aside/navbar/outline/footer/editLink/lastUpdated/markdownStyles,
  // search/releaseReady configure behavior; pageClass is a CSS class. The
  // outline label/sidebar entries come from theme config, not frontmatter.
  // head is handled below: script/style, URLs and routing attributes are not
  // prose, but title text, accessible names and every meta content value are.
  // Nested link/src are URLs, theme is styling, and target/rel configure
  // links; these are not text or accessible names. Other nested strings retain
  // the previous scan coverage, including icons and any image variants.
  range = [-offset, 0]
  const frontmatter = env.frontmatter ?? {}
  for (const key of ['title', 'titleTemplate', 'description', 'category', 'hero', 'features', 'prev', 'next']) {
    for (const [keyPath, text] of stringLeaves(frontmatter[key], `frontmatter.${key}`)) {
      if (/\["(?:link|theme|src|target|rel)"\]$/.test(keyPath)) continue
      add(text, ` (${keyPath})`)
    }
  }
  for (const [index, item] of (frontmatter.head ?? []).entries()) {
    const [tag, attrs = {}, content] = item
    const keyPath = `frontmatter.head[${index}]`
    if (tag === 'title') add(content, ` (${keyPath}[2])`)
    for (const name of ['alt', 'title', 'aria-label']) add(attrs[name], ` (${keyPath}[1].${name})`)
    if (tag === 'meta') add(attrs.content, ` (${keyPath}[1].content)`)
  }
  return entries
}

function filesUnder(directory, accept, excluded = new Set()) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
    if (excluded.has(entry.name)) return []
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? filesUnder(path, accept, excluded) : entry.isFile() && accept(path) ? [path] : []
  })
}

// There is no dagger JSON component: tables/prose use the real VitePress
// Markdown renderer, including pages outside the Bunny directory.
test('every Markdown page under docs renders no process commentary', async () => {
  const md = await createMarkdownRenderer(markdownRoot)
  trackMarkdownSources(md)
  const pages = filesUnder(markdownRoot, (path) => path.endsWith('.md'), new Set(['public', '.vitepress']))
  assert.ok(pages.length >= 3)
  // Keep the former Bunny-page count and mandatory home-page coverage.
  assert.ok(readdirSync(resolve(markdownRoot, 'characters/bunny')).filter((name) => name.endsWith('.md')).length >= 3)
  assert.ok(pages.includes(resolve(markdownRoot, 'index.md')), 'docs/index.md must be present')
  const entries = pages.flatMap((path) => markdownEntries(md, `docs/${relative(markdownRoot, path)}`, readFileSync(path, 'utf8')))
  assertRendered(entries)
})

// Derive expected redirect and reading-order coverage from the real page
// frontmatter, independently of the structures whose strings are scanned.
let pageInventory
async function bunnyPages() {
  pageInventory ??= (async () => {
    const docs = resolve(root, 'docs')
    const md = await createMarkdownRenderer(docs)
    return filesUnder(resolve(docs, 'characters/bunny'), (path) => path.endsWith('.md')).map((path) => {
      const env = {}
      md.render(readFileSync(path, 'utf8'), env)
      return { path: `/${relative(docs, path).replace(/\.md$/, '').replace(/index$/, '')}`, frontmatter: env.frontmatter ?? {} }
    })
  })()
  return pageInventory
}

test('asset names and redirect stub titles render no process commentary', async () => {
  const namesFile = 'docs/.vitepress/data/bunny/asset-names.json'
  const anchorsFile = 'docs/.vitepress/data/bunny/anchor-map.json'
  const names = json(namesFile)
  // These are the same two collections read by bunny-site.data.mjs.
  const manifests = ['bunny', 'origins'].map((id) => json(`catalog/${id}/manifest.json`))
  const expectedNames = manifests.flatMap((manifest) => manifest.assets.map(({ id }) => id)).sort()
  assert.ok(expectedNames.length > 0, 'the manifests must enumerate assets')
  for (const manifest of manifests) assert.equal(manifest.assets.length, manifest.asset_count, `${manifest.character_id} manifest asset count`)
  assert.deepEqual(Object.keys(names).sort(), expectedNames, `${namesFile}: every manifest asset needs a name`)
  for (const [id, value] of Object.entries(names)) assert.ok(typeof value === 'string' && value.trim(), `${namesFile}#${id}: nonempty asset name`)
  const entries = stringLeaves(names).map(([path, text]) => [`${namesFile}#${path}`, text])
  const stubs = json(anchorsFile).stubs
  const expectedStubs = (await bunnyPages()).filter(({ frontmatter }) => frontmatter.bunny === 'stub').map(({ path }) => path).sort()
  assert.ok(expectedStubs.length > 0, 'redirect stub pages must be present')
  assert.deepEqual(Object.keys(stubs).sort(), expectedStubs, `${anchorsFile}: every stub page needs a title`)
  for (const [key, stub] of Object.entries(stubs)) {
    assert.ok(typeof stub.title === 'string' && stub.title.trim(), `${anchorsFile}#${key}: nonempty stub title`)
    entries.push([`${anchorsFile}#$["stubs"][${JSON.stringify(key)}]["title"]`, stub.title])
  }
  assertRendered(entries)
})

test('reading-order navigation titles render no process commentary', async () => {
  const path = 'docs/.vitepress/bunny-navigation.mjs'
  const { READING_ORDER } = await import(pathToFileURL(resolve(root, path)).href)
  assert.ok(Array.isArray(READING_ORDER) && READING_ORDER.length > 0)
  const expected = (await bunnyPages()).filter(({ frontmatter }) => frontmatter.bunny && frontmatter.bunny !== 'stub').map(({ path }) => path).sort()
  assert.deepEqual(READING_ORDER.map(({ path }) => path).sort(), expected, `${path}: every non-stub Bunny page needs a reading-order entry`)
  const lines = read(path).split('\n')
  assertRendered(READING_ORDER.map((entry, index) => {
    const line = lines.findIndex((text) => text.includes(entry.title)) + 1
    return [`${path}:${line || 1} (READING_ORDER[${index}].title)`, entry.title]
  }))
})

test('Bunny SVG text and accessible names contain no process commentary', () => {
  const paths = filesUnder(resolve(root, 'docs/public/characters/bunny'), (path) => path.endsWith('.svg'))
  assert.ok(paths.length > 0, 'Bunny SVG sources must be present in the copied data root')
  const body = json(bodyFile)
  const garment = json(garmentFile)
  const expected = [
    ...Object.keys(body.views).map((id) => measurementModel(body, id).resources.ruler),
    ...Object.keys(garment.sources).map((id) => garmentModel(garment, id).resources.ruler).filter(Boolean),
  ].map((url) => resolve(root, `docs/public${url}`)).sort()
  assert.equal(new Set(expected).size, expected.length, 'ruler resources must be unique')
  assert.deepEqual(paths.filter((path) => path.endsWith('-ruler-latest.svg')).sort(), expected, 'ruler SVGs must cover every catalog ruler resource')
  const entries = []
  for (const path of paths) {
    const name = relative(root, path)
    function collect(node, element = 'svg') {
      if (['script', 'style'].includes(node.tag)) return
      if (node.tag) element = ['title', 'desc', 'text'].includes(node.tag) ? node.tag : element
      if (node.type === 2) entries.push([`${name}:${node.loc.start.line} (SVG <${element}>)`, node.content])
      if (['title', 'desc', 'text'].includes(node.tag)) {
        entries.push([`${name}:${node.loc.start.line} (SVG <${node.tag}> text)`, flattenedText(node)])
      }
      for (const prop of node.props ?? []) {
        if (prop.type === 6 && ['alt', 'title', 'aria-label'].includes(prop.name)) {
          entries.push([`${name}:${prop.loc.start.line} (SVG <${node.tag}> ${prop.name})`, prop.value?.content])
        }
      }
      for (const child of node.children ?? []) collect(child, element)
    }
    collect(parse(readFileSync(path, 'utf8'), { whitespace: 'preserve' }))
  }
  assertRendered(entries)
})

test('every layer card and layer overview render no process commentary', () => {
  const path = 'docs/.vitepress/data/bunny/layers.json'
  const layers = json(path)
  assert.ok(layers.find(({ layer }) => layer === 9))
  const entries = layers.flatMap((layer, i) => [
    ...fields(layer, ['name', 'summary', 'leftRight'], `${path}#$[${i}]`, (value) => value),
    ...layer.facts.flatMap((fact, j) => fields(fact, ['term', 'value', 'note'], `${path}#$[${i}].facts[${j}]`, (value) => value)),
  ])
  assertRendered(entries)
})

test('home hero, color chips, captions, chapters and latest entries render no process commentary', () => {
  const path = 'docs/.vitepress/data/bunny/home.json'
  const home = json(path)
  const entries = fields(home, ['chipNote', 'status', 'updated'], `${path}#$`, (value) => value)
  for (const [collection, names] of Object.entries({
    tabs: ['label', 'caption'], facts: ['term', 'value', 'note'],
    chips: ['name', 'use'], chapters: ['label'], highlights: ['date', 'title', 'caption'],
  })) {
    assert.ok(Array.isArray(home[collection]), `${path}#$.${collection} must be an array`)
    entries.push(...home[collection].flatMap((item, i) => fields(item, names, `${path}#$.${collection}[${i}]`, (value) => value)))
  }
  assertRendered(entries)
})


test('Vue templates, script strings and site config strings contain no process commentary', () => {
  const paths = filesUnder(resolve(root, 'docs/.vitepress/theme'), (path) => path.endsWith('.vue'))
  assert.ok(paths.length > 0, 'Vue theme components must be present in the copied data root')
  const entries = []
  let templateStrings = 0
  let scriptStrings = 0
  for (const path of paths) {
    const file = relative(root, path)
    const { descriptor, errors } = parseSfc(readFileSync(path, 'utf8'), { filename: file })
    assert.deepEqual(errors, [], `${file}: SFC parse errors`)
    function add(text, line, detail) {
      if (typeof text === 'string') {
        templateStrings++
        entries.push([`${file}:${line} (${detail})`, text])
      }
    }
    function expression(source, line, detail) {
      for (const literal of javascriptLiterals(source, true)) add(literal.text, line + literal.line - 1, detail)
    }
    function collect(node) {
      if (['script', 'style'].includes(node.tag)) return
      if (node.type === 2) add(node.content, node.loc.start.line, 'template text')
      if (node.type === 5) {
        add(node.content.content, node.content.loc.start.line, 'Vue interpolation')
        expression(node.content.content, node.content.loc.start.line, 'Vue interpolation string')
      }
      for (const prop of node.props ?? []) {
        if (prop.type === 6) add(prop.value?.content, prop.value?.loc.start.line ?? prop.loc.start.line, `<${node.tag}> ${prop.name}`)
        if (prop.type === 7 && prop.exp) expression(prop.exp.content, prop.exp.loc.start.line, `<${node.tag}> v-${prop.name} string`)
      }
      if (textBlocks.has(node.tag)) add(flattenedText(node), node.loc.start.line, `<${node.tag}> text`)
      for (const child of node.children ?? []) collect(child)
    }
    if (descriptor.template?.ast) collect(descriptor.template.ast)
    for (const block of [descriptor.script, descriptor.scriptSetup].filter(Boolean)) {
      for (const literal of javascriptLiterals(block.content)) {
        scriptStrings++
        entries.push([`${file}:${block.loc.start.line + literal.line - 1} (script string)`, literal.text])
      }
    }
  }
  const config = 'docs/.vitepress/config.mts'
  const literals = javascriptLiterals(read(config))
  assert.ok(templateStrings > 0 && scriptStrings > 0 && literals.length > 0, 'Vue and config scans must visit strings')
  entries.push(...literals.map(({ text, line }) => [`${config}:${line} (config string)`, text]))
  assertRendered(entries)
})

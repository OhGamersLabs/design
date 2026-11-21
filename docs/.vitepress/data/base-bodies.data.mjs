import { defineLoader } from 'vitepress'
import { fileURLToPath } from 'node:url'
import { loadBaseBodies } from '../base-bodies.mjs'

const root = new URL('../../../', import.meta.url)

export default defineLoader({
  watch: [
    fileURLToPath(new URL('docs/.vitepress/data/base-bodies/base-bodies.json', root)),
    fileURLToPath(new URL('catalog/base-bodies/manifest.json', root)),
    fileURLToPath(new URL('docs/public/site/thumbs/index.json', root)),
  ],
  load: () => loadBaseBodies(fileURLToPath(root)),
})

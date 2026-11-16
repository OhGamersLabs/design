import { defineLoader } from 'vitepress'
import { fileURLToPath } from 'node:url'
import { loadCharacters } from '../characters.mjs'

const root = new URL('../../../', import.meta.url)

export default defineLoader({
  watch: [
    fileURLToPath(new URL('docs/.vitepress/data/*/*.json', root)),
    fileURLToPath(new URL('catalog/*/manifest.json', root)),
    fileURLToPath(new URL('docs/public/site/thumbs/index.json', root)),
  ],
  load: () => loadCharacters(fileURLToPath(root)),
})

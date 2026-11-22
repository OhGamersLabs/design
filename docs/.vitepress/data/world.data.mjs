import { defineLoader } from 'vitepress'
import { fileURLToPath } from 'node:url'
import { loadWorld } from '../world.mjs'

const root = new URL('../../../', import.meta.url)

export default defineLoader({
  watch: [
    fileURLToPath(new URL('docs/.vitepress/data/world/world.json', root)),
  ],
  load: () => loadWorld(fileURLToPath(root)),
})

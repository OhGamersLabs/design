import { loadWorld } from '../world.mjs'

export default {
  watch: ['./world/world.json'],
  load() {
    return loadWorld()
  },
}

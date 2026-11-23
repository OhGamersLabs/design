import { loadStory } from '../story.mjs'

export default {
  watch: ['./story/story.json', '../../../catalog/story/manifest.json', '../../public/site/thumbs/index.json'],
  load() {
    return loadStory()
  },
}

import { computed } from 'vue'
import { useData } from 'vitepress'
import { data } from '../data/site.data.mjs'
import { characterForPage } from './character-site.mjs'

export function useCharacter(explicitId: () => string | undefined = () => undefined) {
  const { page } = useData()
  return computed(() => characterForPage(data.characters, page.value.relativePath, explicitId()))
}

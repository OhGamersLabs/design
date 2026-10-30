/** @typedef {import('./theme/bunny-site-types').ArchiveData} ArchiveData */
/** @typedef {import('./theme/bunny-site-types').ChangeRecord} ChangeRecord */
/** @typedef {{relativePath: string, frontmatter?: {search?: boolean}}} SearchEnvironment */

/** @param {string} value @returns {string} */
function escapeText(value) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      default: return '&#39;'
    }
  })
}

/**
 * Expand archive-only components before rendering, then honor parsed frontmatter.
 * @param {{archive: ArchiveData, names: Record<string, string>, changes: ChangeRecord[]}} input
 * @returns {(src: string, env: SearchEnvironment, md: import('vitepress').MarkdownRenderer) => string}
 */
export function createSearchRender({ archive, names, changes }) {
  return (src, env, md) => {
    if (env.relativePath === 'characters/bunny/archive.md') {
      src = src.replace(/<ArchiveGrid\s+group\s*=\s*["']([^"']+)["']\s*\/\s*>/g, (_, id) => {
        const group = archive.groups.find((entry) => entry.id === id)
        if (!group) throw new Error(`Unknown archive group: ${id}`)
        return '\n\n' + group.items.map((item) => {
          const name = Object.hasOwn(names, item.asset) ? names[item.asset] : undefined
          if (!name) throw new Error(`Missing archive asset name: ${item.asset}`)
          return `<p>${escapeText(`${name} · ${item.date} · 已改为${item.replacedBy}`)}</p>`
        }).join('\n\n') + '\n\n'
      })
      src = src.replace(/<ChangelogTable\s*\/\s*>/g, () => '\n\n' + changes
        .toSorted((a, b) => b.date.localeCompare(a.date) || a.order - b.order)
        .map(({ date, log }) => `<p>${escapeText(`${date} · ${log.change} · ${log.reason} · ${log.caption}`)}</p>`)
        .join('\n\n') + '\n\n')
    }
    const html = md.render(src, env)
    if (env.frontmatter?.search === false) return ''
    return html
  }
}

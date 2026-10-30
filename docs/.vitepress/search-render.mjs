/** Parse frontmatter before deciding whether a page belongs in local search. */
export function createSearchRender() {
  return (src, env, md) => {
    const html = md.render(src, env)
    return env.frontmatter?.search === false ? '' : html
  }
}

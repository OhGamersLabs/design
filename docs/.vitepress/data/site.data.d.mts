import type { SiteData } from '../theme/character-site-types'
export declare const data: SiteData
// VitePress transforms this loader into the named data export for the client.
declare const loader: { watch: string[]; load: () => SiteData }
export default loader

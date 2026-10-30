import type { BunnySiteData } from '../theme/bunny-site-types'
export declare const data: BunnySiteData
// VitePress transforms this loader into the named data export for the client.
declare const loader: { watch: string[]; load: () => BunnySiteData }
export default loader

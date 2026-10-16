# OhGamers design site

## Goal and authority
Publish the approved Bunny final artwork and whitepaper at https://design.ohgamers.org. The user selected GitHub + VitePress + the existing private R2 bucket. Other characters join the same structure later. The supplied cloud migration package is the sole source of Bunny content; local older versions must not be substituted.

## Architecture
VitePress 1.6.4 builds Chinese Markdown from docs/. A Cloudflare Worker named ohgamers-design serves static HTML and exposes only exact release URLs declared in catalog/releases.json. The Worker binding PUBLIC_RELEASES accesses the existing ohgamers bucket in account 9ef45508273746d6ed19ac93e11b76b1. Bucket public domains stay disabled. No listing endpoint or arbitrary R2 key parameter exists. Each publishable object lives below x_ops/design/characters/<id>/releases/<version>/. Files are immutable by version, and uploads must refuse existing keys.

## Content and user experience
docs/characters/<id>/ contains character chapters; docs/standards/ contains common standards. Only Bunny appears in character navigation. catalog/ describes released assets; tools/ holds validation and deployment helpers. The initial skeleton explicitly waits for the approved migration package, rather than inventing a whitepaper. Published pages support Chinese, mobile and desktop, chapter navigation, accessible image enlargement and original/PDF links.

## Publication boundary and licensing
Only the 19 approved final images, whitepaper PDF and explicitly approved asset package may enter the release manifest. Production build requires a nonempty manifest and final Bunny content. Never put local credential files, original working material, other candidates or secrets in git, static output or R2 public paths. Preserve LICENSE verbatim. README states the software license does not grant character/IP rights; no additional asset license is granted.

## Deployment and recovery
Use Workers static assets plus an R2 binding and custom domain design.ohgamers.org. Check exact-host DNS/custom-domain conflicts immediately before binding. Do not overwrite an existing record or service. No new token, new subscription, new persistent credential or agreement may be created silently. Credentials stay in local process memory and are mapped to Wrangler environment variables only. Record the deployed version, verify HTTPS, approved media and denied unlisted paths, then capture desktop/mobile screenshots. Keep the previous deployment/version and manifest for rollback; domain bindings need separate restoration if changed.

## Verification
Tests enforce exact manifest lookup, traversal rejection, method restriction, no R2 access for unknown paths, metadata-derived MIME/headers and object hash validation. Build checks validate public URLs and object prefixes. Browser checks cover Chinese rendering, navigation, image enlargement, PDF links and mobile overflow. The release cannot be marked complete without migration content and live HTTPS checks.

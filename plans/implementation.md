# Design Site Implementation Plan

**Goal:** Prepare and ship the approved Bunny whitepaper site without exposing private R2 objects.

**Architecture:** VitePress static pages + Cloudflare Worker exact release allowlist + private R2. Content arrives in a separately approved migration package.

**Tech stack:** VitePress 1.6.4, Vue, Node test runner, Wrangler 4.151.1.

**Spec:** plans/design-site.md

## Global constraints
- Preserve LICENSE; no automatic character/IP license.
- Domain design.ohgamers.org; account 9ef45508273746d6ed19ac93e11b76b1; existing bucket ohgamers remains private.
- R2 object prefix x_ops/design/characters/<id>/releases/<version>/; exact public-path allowlist only.
- No migration content substitutes, credentials in repo/build, new token or new billing.

## Tasks
1. Prepare VitePress shell: package/config, Chinese home, Bunny chapter shell, standards, responsive style, zoomable-image component and README license boundary. Verify with VitePress build and browser on desktop/mobile.
2. Implement private R2 gateway and catalog validator with Node tests first. Unknown or encoded paths must return 404 without R2 reads; GET/HEAD only. Public object headers come from a validated catalog, with SHA-256 and size checks before publication.
3. Add local credential-safe Wrangler launcher, production content gate and deployment configuration. Check no secrets enter static output and dry-run the bundle.
4. When the approved package arrives: map its 19 final images and PDF into versioned catalog, integrate actual Markdown chapters, validate hashes and build. Upload only listed files with no-overwrite checks. Inspect target domain conflicts again, deploy, record revision, verify HTTPS and capture desktop/mobile screenshots.

## Review focus
- Encoded traversal and arbitrary keys cannot cause R2 access.
- A nonempty release requires exact files, hashes and final-content readiness.
- Missing R2 objects return 404 and cannot reveal bucket internals.
- Download and image routes use MIME from the manifest, not user input.
- An empty skeleton can be previewed locally but cannot be released to production.

import { validateCatalog } from './catalog.js';

function errorResponse(status, method, extraHeaders = {}) {
  const message = { 404: 'Not found', 405: 'Method not allowed', 503: 'Service unavailable' }[status];
  return new Response(method === 'HEAD' ? null : message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

/** The binding can access the bucket; this handler only reads exact catalog keys. */
export function createHandler(doc) {
  const releases = validateCatalog(doc);

  return {
    async fetch(request, env) {
      // Keep the un-decoded path: URL.pathname can normalize traversal segments.
      const rawPath = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*([^?#]*)/i.exec(request.url)?.[1] || '/';
      const media = rawPath === '/media' || rawPath.startsWith('/media/') || rawPath.startsWith('/media\\');
      if (!media) return env.ASSETS.fetch(request);

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return errorResponse(405, request.method, { Allow: 'GET, HEAD' });
      }
      if (/[?%\\#]/.test(request.url)) return errorResponse(404, request.method);

      const asset = releases.get(rawPath);
      if (!asset) return errorResponse(404, request.method);

      try {
        const object = request.method === 'HEAD'
          ? await env.PUBLIC_RELEASES.head(asset.key)
          : await env.PUBLIC_RELEASES.get(asset.key);
        if (!object) return errorResponse(404, request.method);
        if (object.size !== asset.size) return errorResponse(503, request.method);

        const filename = asset.downloadName || rawPath.slice(rawPath.lastIndexOf('/') + 1);
        const disposition = asset.contentType === 'application/zip' ? 'attachment' : 'inline';
        return new Response(request.method === 'HEAD' ? null : object.body, {
          status: 200,
          headers: {
            'Content-Type': asset.contentType,
            'Content-Length': String(asset.size),
            'Content-Disposition': `${disposition}; filename="${filename}"`,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      } catch {
        // Never expose provider errors, internal bucket paths, or diagnostics.
        return errorResponse(503, request.method);
      }
    },
  };
}

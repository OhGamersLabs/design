import { validateCatalog } from './catalog.js';

function errorResponse(status, method, extraHeaders = {}) {
  const message = { 404: 'Not found', 405: 'Method not allowed', 412: 'Precondition failed', 503: 'Service unavailable' }[status];
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

function matchesEtag(header, etag, weak = true) {
  if (header === null) return false;
  const normalize = (value) => weak ? value.replace(/^W\//, '') : value;
  return header.split(',').some((value) => {
    const tag = value.trim();
    return tag === '*' || (weak || !tag.startsWith('W/')) && normalize(tag) === normalize(etag);
  });
}

function conditionalStatus(headers, object) {
  const ifMatch = headers.get('If-Match');
  if (ifMatch !== null && !matchesEtag(ifMatch, object.httpEtag, false)) return 412;
  const modified = Math.floor(new Date(object.uploaded).getTime() / 1000) * 1000;
  const unmodifiedSince = Date.parse(headers.get('If-Unmodified-Since'));
  if (ifMatch === null && Number.isFinite(unmodifiedSince) && modified > unmodifiedSince) return 412;
  const ifNoneMatch = headers.get('If-None-Match');
  if (matchesEtag(ifNoneMatch, object.httpEtag)) return 304;
  const modifiedSince = Date.parse(headers.get('If-Modified-Since'));
  if (ifNoneMatch === null && Number.isFinite(modifiedSince) && modified <= modifiedSince) return 304;
  return 200;
}

/** The binding can access the bucket; this handler only reads exact catalog keys. */
export function createHandler(doc) {
  const images = validateCatalog(doc);

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

      const asset = images.get(rawPath);
      if (!asset) return errorResponse(404, request.method);

      try {
        const object = request.method === 'HEAD'
          ? await env.PUBLIC_RELEASES.head(asset.key)
          : await env.PUBLIC_RELEASES.get(asset.key, { onlyIf: request.headers });
        if (!object) return errorResponse(404, request.method);

        const status = conditionalStatus(request.headers, object);
        if (status === 412 || (status === 200 && request.method === 'GET' && !('body' in object))) {
          return errorResponse(412, request.method);
        }
        const filename = rawPath.slice(rawPath.lastIndexOf('/') + 1);
        return new Response(request.method === 'HEAD' || status === 304 ? null : object.body, {
          status,
          headers: {
            'Content-Type': asset.contentType,
            'Content-Length': String(object.size),
            'Content-Disposition': `inline; filename="${filename}"`,
            'ETag': object.httpEtag,
            'Last-Modified': new Date(object.uploaded).toUTCString(),
            'Cache-Control': 'public, max-age=60, must-revalidate',
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

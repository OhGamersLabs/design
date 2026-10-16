const CHARACTER = /^[a-z0-9][a-z0-9-]{0,63}$/;
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z0-9-]+)?$/;
const FILENAME = /^[A-Za-z0-9._-]+$/;
const SHA256 = /^[a-fA-F0-9]{64}$/;
const CONTENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'application/zip',
]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFilename(value) {
  return typeof value === 'string' && FILENAME.test(value) && !value.includes('..');
}

/** Validate the public release boundary without Node or platform dependencies. */
export function validateCatalog(doc, { production = false } = {}) {
  if (!isRecord(doc) || doc.schemaVersion !== 1 ||
      typeof doc.contentReady !== 'boolean' || !Array.isArray(doc.assets)) {
    throw new Error('Invalid release catalog schema.');
  }
  if (production && (!doc.contentReady || doc.assets.length === 0)) {
    throw new Error('Production requires approved content and a nonempty release catalog.');
  }

  const paths = new Map();
  const keys = new Set();
  for (const source of doc.assets) {
    if (!isRecord(source) || typeof source.character !== 'string' ||
        !CHARACTER.test(source.character) || typeof source.version !== 'string' ||
        !VERSION.test(source.version) || typeof source.path !== 'string' ||
        typeof source.key !== 'string' || typeof source.sha256 !== 'string' ||
        !SHA256.test(source.sha256) || !Number.isSafeInteger(source.size) ||
        source.size <= 0 || !CONTENT_TYPES.has(source.contentType)) {
      throw new Error('Invalid release asset metadata.');
    }

    const prefix = `/media/${source.character}/${source.version}/`;
    const filename = source.path.slice(prefix.length);
    if (!source.path.startsWith(prefix) || !isFilename(filename) ||
        source.key !== `x_ops/design/characters/${source.character}/releases/${source.version}/${filename}`) {
      throw new Error('Release asset path and key must match the approved release prefix.');
    }
    if (source.downloadName !== undefined && !isFilename(source.downloadName)) {
      throw new Error('Invalid release download filename.');
    }
    if (paths.has(source.path) || keys.has(source.key)) {
      throw new Error('Duplicate public release path or R2 key.');
    }

    // Copy only approved metadata so later source-object changes cannot redirect reads.
    const asset = Object.freeze({
      character: source.character,
      version: source.version,
      path: source.path,
      key: source.key,
      sha256: source.sha256,
      size: source.size,
      contentType: source.contentType,
      ...(source.downloadName === undefined ? {} : { downloadName: source.downloadName }),
    });
    paths.set(asset.path, asset);
    keys.add(asset.key);
  }
  return paths;
}

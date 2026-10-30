const CHARACTER = /^[a-z0-9][a-z0-9-]{0,63}$/;
const FILENAME = /^[a-z0-9][a-z0-9-]*-latest\.(png|jpe?g|webp)$/;
const CONTENT_TYPES = new Map([
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['webp', 'image/webp'],
]);
const ASSET_FIELDS = new Set(['character', 'path', 'key', 'contentType']);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactMatch(pattern, value) {
  return typeof value === 'string' && pattern.exec(value)?.[0] === value;
}

/** Validate stable public identities without freezing replaceable R2 metadata. */
export function validateCatalog(doc, { production = false } = {}) {
  if (!isRecord(doc) || doc.schemaVersion !== 2 ||
      typeof doc.contentReady !== 'boolean' || !Array.isArray(doc.assets)) {
    throw new Error('Invalid image catalog schema.');
  }
  if (production && (!doc.contentReady || doc.assets.length === 0)) {
    throw new Error('Production requires approved content and a nonempty image catalog.');
  }

  const paths = new Map();
  const keys = new Set();
  for (const source of doc.assets) {
    if (!isRecord(source) || Object.keys(source).some((key) => !ASSET_FIELDS.has(key)) ||
        !exactMatch(CHARACTER, source.character) || typeof source.path !== 'string' ||
        typeof source.key !== 'string') {
      throw new Error('Invalid image asset metadata.');
    }
    const prefix = `/media/${source.character}/`;
    const filename = source.path.slice(prefix.length);
    if (!source.path.startsWith(prefix) || !exactMatch(FILENAME, filename) ||
        source.key !== `x_ops/design/characters/${source.character}/latest/${filename}` ||
        CONTENT_TYPES.get(filename.split('.').at(-1)) !== source.contentType) {
      throw new Error('Image path, key and type must match the approved latest image.');
    }
    if (paths.has(source.path) || keys.has(source.key)) {
      throw new Error('Duplicate public image path or R2 key.');
    }

    // Copy only approved metadata so later source-object changes cannot redirect reads.
    const asset = Object.freeze({
      character: source.character,
      path: source.path,
      key: source.key,
      contentType: source.contentType,
    });
    paths.set(asset.path, asset);
    keys.add(asset.key);
  }
  return paths;
}

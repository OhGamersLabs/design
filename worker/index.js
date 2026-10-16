import catalog from '../catalog/releases.json' with { type: 'json' };
import { createHandler } from './handler.js';

export default createHandler(catalog);

/**
 * Backward-compatible re-export shim.
 *
 * All image logic lives in src/utils/imageResolvers.js.
 * This file exists so existing imports of getPlayerImage / normalizePlayerName
 * from './data/playerImages' continue to work without any changes to callers.
 *
 * To change the image provider or add manual overrides, edit imageResolvers.js.
 */
export { getPlayerImage, normalizePlayerName } from '../utils/imageResolvers';

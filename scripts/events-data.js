/**
 * @fileoverview Central re-export hub for AuraEvent celebration data templates and persistence.
 * Composes seed templates and browser storage logic.
 */

export { DEFAULT_CELEBRATIONS, normalizeEventRecord } from './events-seed.js';
export {
  safeStorageGet,
  safeStorageSet,
  loadPersistedEvents,
  saveEventsToStorage,
  getStoredActiveEventId,
  saveActiveEventId,
  resetEventsStorage
} from './events-storage.js';

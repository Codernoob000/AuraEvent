/**
 * @fileoverview Storage operations and local state persistence for AuraEvent celebrations.
 * Encapsulates safe access to browser localStorage with full fallback handling.
 */

import { APP_CONFIG } from './config.js';
import { DEFAULT_CELEBRATIONS, normalizeEventRecord } from './events-seed.js';

/**
 * Safe getter for browser localStorage with explicit error handling.
 * @param {string} key - Storage key.
 * @returns {string|null} Stored value or null.
 */
export function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (_storageError) {
    // Non-blocking fallback for storage access restrictions (e.g. private browsing)
    return null;
  }
}

/**
 * Safe setter for browser localStorage with explicit error handling.
 * @param {string} key - Storage key.
 * @param {string} value - Stored string value.
 * @returns {boolean} True if persisted successfully, false on failure.
 */
export function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (_storageError) {
    // Gracefully handle storage quota exhaustion or private browsing restrictions
    return false;
  }
}

/**
 * Loads persisted celebration events from browser localStorage.
 * Falls back to DEFAULT_CELEBRATIONS if storage is empty or invalid.
 * @returns {import('./types.js').Celebration[]} List of celebration event objects.
 */
export function loadPersistedEvents() {
  const rawData = safeStorageGet(APP_CONFIG.STORAGE_KEYS.EVENTS);
  if (!rawData) return DEFAULT_CELEBRATIONS;

  try {
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(normalizeEventRecord);
    }
  } catch (_parseError) {
    // Malformed JSON falls back gracefully to default seed events
    return DEFAULT_CELEBRATIONS;
  }
  return DEFAULT_CELEBRATIONS;
}

/**
 * Saves current list of events to browser localStorage.
 * @param {import('./types.js').Celebration[]} eventsList - Array of event objects.
 * @returns {boolean} True if successfully saved.
 */
export function saveEventsToStorage(eventsList) {
  try {
    const serialized = JSON.stringify(eventsList);
    return safeStorageSet(APP_CONFIG.STORAGE_KEYS.EVENTS, serialized);
  } catch (_serializeError) {
    return false;
  }
}

/**
 * Retrieves the active event ID from storage or returns default.
 * @param {import('./types.js').Celebration[]} eventsList - Current events array.
 * @returns {string} Active event ID.
 */
export function getStoredActiveEventId(eventsList) {
  const storedId = safeStorageGet(APP_CONFIG.STORAGE_KEYS.ACTIVE_EVENT_ID);
  if (storedId && eventsList.some(evt => evt.id === storedId)) {
    return storedId;
  }
  return eventsList[0]?.id || DEFAULT_CELEBRATIONS[0].id;
}

/**
 * Saves the active event ID to storage.
 * @param {string} eventId - Unique event identifier.
 * @returns {boolean} True if saved.
 */
export function saveActiveEventId(eventId) {
  return safeStorageSet(APP_CONFIG.STORAGE_KEYS.ACTIVE_EVENT_ID, String(eventId));
}

/**
 * Resets local storage for events back to seed defaults.
 * @returns {boolean} True if reset.
 */
export function resetEventsStorage() {
  return safeStorageSet(APP_CONFIG.STORAGE_KEYS.EVENTS, JSON.stringify(DEFAULT_CELEBRATIONS));
}

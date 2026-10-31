/**
 * @fileoverview Application configuration constants and public endpoint definitions.
 * Security Note: Strictly conforms to Rule 1 of the Security Constitution.
 * Client files contain ZERO secrets, private tokens, or backend credentials.
 */

/* eslint-disable no-unused-vars */

/**
 * Public client-side configuration parameters.
 * All API requests route securely through the local backend proxy.
 */
export const APP_CONFIG = Object.freeze({
  /** Application title and branding */
  APP_NAME: 'AuraEvent',
  APP_VERSION: '1.0.0',

  /** Base URL for secure backend API */
  API_BASE_URL: '/api',

  /** Google Services public client endpoints */
  GOOGLE_CALENDAR_ENDPOINT: 'https://calendar.google.com/calendar/render',

  /** Public client identifier placeholder (Public key only, never private secret - Rule 1) */
  GOOGLE_CLIENT_ID: 'PUBLIC_CLIENT_PLACEHOLDER_ONLY.apps.googleusercontent.com',

  /** Rate limit retry baseline in milliseconds */
  DEFAULT_RETRY_DELAY_MS: 1000,

  /** Maximum retry attempts for resilient network requests */
  MAX_RETRY_ATTEMPTS: 3,

  /** Debounce delay for input calculations */
  DEBOUNCE_DELAY_MS: 250,

  /** Storage keys for client persistence */
  STORAGE_KEYS: Object.freeze({
    EVENTS: 'aura_event_planner_data_v1',
    ACTIVE_EVENT_ID: 'aura_event_planner_active_id_v1',
    THEME: 'aura_event_planner_theme_v1'
  })
});


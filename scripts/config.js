/**
 * @fileoverview Application configuration constants, schemas, and endpoint definitions.
 * Security Note: Strictly conforms to Rule 1 of the Security Constitution.
 * Client files contain ZERO secrets, private tokens, or backend credentials.
 */

/**
 * Public client-side configuration parameters and shared business constants.
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
    THEME: 'aura_event_planner_theme_v1',
    OWNER_TOKEN_PREFIX: 'aura_owner_',
    TOKEN_BUDGET: 'aura_event_token_budget_v1'
  }),

  /** Supported event types across planner */
  EVENT_TYPES: Object.freeze([
    'Wedding',
    'Birthday',
    'Corporate Event',
    'Community Event',
    'Anniversary',
    'Social Gathering'
  ]),

  /** Supported currencies */
  CURRENCIES: Object.freeze({
    USD: 'USD',
    INR: 'INR'
  }),

  /** Default proportional budget allocation ratios */
  DEFAULT_BUDGET_RATIOS: Object.freeze({
    CATERING: 0.4,
    VENUE: 0.25,
    DECOR: 0.2,
    ENTERTAINMENT: 0.15,
    PHOTOGRAPHY: 0.15
  }),

  /** Vendor contract lifecycle states */
  VENDOR_STATUSES: Object.freeze([
    'Researching',
    'Quoted',
    'Contract Sent',
    'Confirmed',
    'Completed'
  ]),

  /** Run-of-show milestone phases */
  TIMELINE_PHASES: Object.freeze([
    'Planning',
    'Preparation',
    'Execution',
    'Day of',
    'Ceremony',
    'Reception',
    'Breakdown'
  ]),

  /** Expense line item payment statuses */
  EXPENSE_STATUSES: Object.freeze(['Paid in Full', 'Deposit Paid', 'Pending']),

  /** Business rule limits and thresholds */
  LIMITS: Object.freeze({
    MAX_EVENT_NAME_LENGTH: 120,
    MAX_THEME_PROMPT_LENGTH: 120,
    MAX_VIBE_LENGTH: 80,
    MAX_BUDGET: 10000000,
    MIN_BUDGET: 100,
    DEFAULT_BUDGET: 10000,
    MAX_GUESTS: 50000,
    MIN_GUESTS: 1,
    DEFAULT_GUESTS: 50
  }),

  /** Default color palette fallbacks */
  FALLBACK_PALETTES: Object.freeze([
    '#0F172A',
    '#92400E',
    '#065F46',
    '#B45309',
    '#D97706',
    '#475569'
  ])
});

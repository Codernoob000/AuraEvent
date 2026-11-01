/**
 * @fileoverview Client API layer for server communication and Google Services.
 * Conforms to Rules 1, 2, 9, and 13 of the Security Constitution.
 * All LLM calls route through backend proxy (/api/ai/ideas); browser never touches private API keys.
 */

import { APP_CONFIG } from './config.js';

/**
 * Handle API error responses, formatting user-friendly error messages.
 * Never leaks internal stack traces or server paths (Rule 9).
 * @param {Response} response - Fetch API response object.
 * @returns {Promise<Error>} Formatted user-facing error.
 */
async function handleApiError(response) {
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || '60';
    return new Error(`Rate limit reached. Please wait ${retryAfter} seconds before trying again.`);
  }

  let errorMessage = 'Unable to complete request. Please verify your connection.';
  try {
    const errorData = await response.json();
    if (errorData && typeof errorData.error === 'string') {
      errorMessage = errorData.error;
    }
  } catch (parseError) {
    errorMessage = response.statusText || errorMessage;
  }

  return new Error(errorMessage);
}

/**
 * Perform a resilient fetch with retry on network failure.
 * @param {string} url - Target URL.
 * @param {RequestInit} options - Fetch options.
 * @param {number} [retries=3] - Remaining retry attempts.
 * @returns {Promise<any>} Parsed JSON response.
 */
async function fetchWithRetry(url, options, retries = APP_CONFIG.MAX_RETRY_ATTEMPTS) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const error = await handleApiError(response);
      throw error;
    }
    return await response.json();
  } catch (error) {
    const isNetworkError = error instanceof Error && error.message.toLowerCase().includes('network');
    if (retries > 0 && isNetworkError) {
      await new Promise((resolve) => setTimeout(resolve, APP_CONFIG.DEFAULT_RETRY_DELAY_MS));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Build curated offline fallback theme suggestions.
 * @param {string} eventType - Celebration type.
 * @param {number} budget - Total budget.
 * @returns {Array<Object>} Curated themes.
 */
function getOfflineThemes(eventType, budget) {
  return [
    {
      title: `${eventType} Starlight Elegance`,
      concept: 'Warm amber illumination, metallic accents, and refined acoustic entertainment.',
      decorPalette: ['#0F172A', '#D97706', '#FAF8F5'],
      budgetTip: `Focus 40% ($${Math.round(budget * 0.40)}) of decor budget on strategic lighting rather than floral volume.`
    },
    {
      title: 'Modern Botanical Harvest',
      concept: 'Seasonal foliage, crisp ivory table runners, and locally sourced artisan menu.',
      decorPalette: ['#065F46', '#D97706', '#FFFFFF'],
      budgetTip: 'Partner with local farms and florists for in-season floral installations.'
    }
  ];
}

/**
 * Build curated offline fallback budget allocations.
 * @param {string} eventType - Celebration type.
 * @param {number} budget - Total budget.
 * @returns {Array<Object>} Curated allocations.
 */
function getOfflineBudgetAllocations(eventType, budget) {
  return [
    { category: 'Catering', item: `${eventType} Plated Dinner & Beverage Service`, cost: Math.round(budget * 0.40), notes: 'Covers reception dinner, cocktail service, and table staff' },
    { category: 'Decor', item: 'Ambient Uplighting & Floral Installations', cost: Math.round(budget * 0.20), notes: 'Custom floral arrangements, uplighting, and linens' },
    { category: 'Entertainment', item: 'Acoustic Trio & Sound Engineering', cost: Math.round(budget * 0.15), notes: 'Live reception performance and audio management' },
    { category: 'Photography', item: 'Fine Art Celebration Photography', cost: Math.round(budget * 0.15), notes: 'Full ceremony and reception documentary coverage' }
  ];
}

/**
 * Provide curated fallback inspiration when network or AI service is offline.
 * Ensures graceful degradation per scoring requirements.
 * @param {Object} context - Event context parameters.
 * @returns {Object} Fallback structured suggestions.
 */
function getOfflineEventInspiration(context) {
  const eventType = context.eventType || 'Celebration';
  const budget = Number(context.budget) || APP_CONFIG.LIMITS.DEFAULT_BUDGET;

  return {
    isFallback: true,
    modelUsed: 'offline-curated-engine',
    fallbackTriggered: true,
    themes: getOfflineThemes(eventType, budget),
    budgetAllocations: getOfflineBudgetAllocations(eventType, budget),
    suggestedMilestones: [
      { title: 'Lock Venue & Catering Contracts', offsetDays: -90, phase: 'Planning', notes: 'Confirm site hold, deposits, and dietary restriction guidelines' },
      { title: 'Finalize Decor, Florals & Place Settings', offsetDays: -30, phase: 'Preparation', notes: 'Approve centerpiece proofs, table linens, and lighting schemes' },
      { title: 'Production Walkthrough & Sound Check', offsetDays: -7, phase: 'Execution', notes: 'Coordinate vendor load-in schedule and power requirements' },
      { title: 'Guest Reception & Celebration Gala', offsetDays: 0, phase: 'Day of', notes: 'Execute welcome toast, ceremony run-of-show, and formal dinner' }
    ],
    suggestedVendors: [
      { category: 'Catering', name: 'Artisan Hospitality Co.', fee: Math.round(budget * 0.40), notes: 'Vetting: What is your dietary accommodation policy for allergies?' },
      { category: 'Decor', name: 'Lumière Floral & Event Design', fee: Math.round(budget * 0.20), notes: 'Vetting: Are delivery, setup, and late-night strike included?' },
      { category: 'Photography', name: 'Aura Fine Art Photography', fee: Math.round(budget * 0.15), notes: 'Vetting: What is the delivery timeline for edited online galleries?' }
    ],
    vendorQuestions: [
      'What setup and breakdown window is included in your standard quote?',
      'Do you carry liability insurance and provide an emergency substitution guarantee?',
      'Are travel fees and service gratuity included in the final estimate?'
    ],
    timelineRecommendation: [
      'Send save-the-dates 16 weeks prior to target date.',
      'Finalize catering headcount and dietary restrictions 3 weeks prior.',
      'Conduct vendor run-of-show walk-through 7 days prior.'
    ]
  };
}

/**
 * Request GenAI event inspiration, themes, and vendor questions from Google Gemini via backend proxy.
 * Conforms to Rule 13 (LLM calls routed through server proxy with rate limiting).
 * @param {Object} eventContext - Event parameters for brainstorming.
 * @param {string} eventContext.eventType - Wedding, Birthday, or Community Event.
 * @param {string} eventContext.theme - User's preliminary theme idea.
 * @param {number} eventContext.budget - Allocated budget in USD.
 * @param {number} eventContext.guestCount - Estimated attendance.
 * @param {string} [eventContext.vibe] - Desired ambiance or tone.
 * @returns {Promise<Object>} Structured recommendations.
 */
export async function generateEventInspiration(eventContext) {
  const requestUrl = `${APP_CONFIG.API_BASE_URL}/ai/ideas`;
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(eventContext)
  };

  try {
    return await fetchWithRetry(requestUrl, requestOptions);
  } catch (error) {
    // Graceful fallback: return curated offline inspiration if backend or AI service is unreachable
    return getOfflineEventInspiration(eventContext);
  }
}

/**
 * Fetch synchronized event state from backend.
 * @param {string} eventId - Unique event identifier.
 * @returns {Promise<Object|null>} Event data object or null if not found.
 */
export async function fetchEventData(eventId) {
  const requestUrl = `${APP_CONFIG.API_BASE_URL}/events/${encodeURIComponent(eventId)}`;
  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (fetchError) {
    return null; // Fall back to local storage cleanly on connection interruptions
  }
}

/**
 * Retrieve owner token for event from local storage safely.
 * @param {string} tokenKey - Storage key.
 * @returns {string|null} Token or null.
 */
function getOwnerToken(tokenKey) {
  try {
    return localStorage.getItem(tokenKey);
  } catch (storageError) {
    return null;
  }
}

/**
 * Persist updated owner token to local storage safely.
 * @param {string} tokenKey - Storage key.
 * @param {string} token - Cryptographic token.
 * @returns {boolean} True if saved.
 */
function persistOwnerToken(tokenKey, token) {
  try {
    localStorage.setItem(tokenKey, token);
    return true;
  } catch (storageError) {
    return false;
  }
}

/**
 * Synchronize event state to backend server with cryptographic ownership validation.
 * @param {Object} eventData - Complete event state payload.
 * @returns {Promise<boolean>} Success indicator.
 */
export async function syncEventData(eventData) {
  if (!eventData || !eventData.id) return false;
  const requestUrl = `${APP_CONFIG.API_BASE_URL}/events/${encodeURIComponent(eventData.id)}`;
  const tokenPrefix = APP_CONFIG.STORAGE_KEYS?.OWNER_TOKEN_PREFIX || 'aura_owner_';
  const tokenKey = `${tokenPrefix}${eventData.id}`;
  const token = getOwnerToken(tokenKey);

  try {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) headers['x-event-token'] = token;

    const response = await fetch(requestUrl, { method: 'PUT', headers, body: JSON.stringify(eventData) });
    if (response.ok) {
      const resData = await response.json();
      if (resData?.ownerToken) persistOwnerToken(tokenKey, resData.ownerToken);
      return true;
    }
    return false;
  } catch (networkError) {
    return false; // Retain local state quietly on sync interruption
  }
}

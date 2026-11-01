/**
 * @fileoverview Google Gemini AI Service integration and prompt proxy.
 * Conforms to Rules 1, 3, 9, and 13 of the Security Constitution.
 * Server-side only; API key never leaves backend; enforces token quotas and prompt sanitization.
 */

/** Token usage registry tracked per IP/user identifier with rolling window */
const USER_TOKEN_REGISTRY = new Map();

/** 1-hour rolling budget window in milliseconds */
const TOKEN_WINDOW_MS = 60 * 60 * 1000;

/** Default estimated tokens per request */
const DEFAULT_ESTIMATED_TOKENS = 400;

/** Maximum allowed token consumption per user session */
const MAX_USER_TOKEN_BUDGET = Number(process.env.MAX_USER_TOKEN_BUDGET) || 10000;

/** Default Google Gemini Model identifier */
const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/** Ordered live fallback chain for resilient degradation */
const COMPATIBLE_LIVE_FALLBACKS = Object.freeze(['gemini-3.6-flash', 'gemini-3-flash-preview']);

/** Gemini API HTTP request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 35000;

/** Gemini generation configuration parameters */
const GENERATION_CONFIG = Object.freeze({
  temperature: 0.7,
  maxOutputTokens: 1500,
  responseMimeType: 'application/json'
});

/** Maximum allowed characters for sanitized theme prompt */
const MAX_PROMPT_LENGTH = 300;

/** Maximum allowed characters for user identifier */
const MAX_USER_ID_LENGTH = 80;

/**
 * Sanitize user prompt to prevent prompt injection attacks.
 * Filters structural delimiters and common injection phrases (Rule 13).
 * @param {string} rawPrompt - Untrusted user input.
 * @returns {string} Sanitized prompt string.
 */
export function sanitizePromptInput(rawPrompt) {
  if (typeof rawPrompt !== 'string') return '';
  return rawPrompt
    .replace(/```/g, '')
    .replace(/system:/gi, '')
    .replace(/assistant:/gi, '')
    .replace(/user:/gi, '')
    .replace(/ignore previous instructions/gi, '')
    .trim()
    .slice(0, MAX_PROMPT_LENGTH);
}

/**
 * Track and verify token consumption against per-user budget.
 * Enforces sliding 1-hour quota and prevents runaway cost exhaustion (Rule 13).
 * @param {string} userIdentifier - IP address or session ID.
 * @param {number} [estimatedTokens=400] - Estimated token cost.
 * @returns {boolean} True if within budget, false if exceeded.
 */
export function checkAndUpdateTokenBudget(
  userIdentifier,
  estimatedTokens = DEFAULT_ESTIMATED_TOKENS
) {
  const safeId =
    typeof userIdentifier === 'string' && userIdentifier.trim()
      ? userIdentifier.trim().slice(0, MAX_USER_ID_LENGTH)
      : 'anonymous-client';
  const safeTokens = Math.max(1, Number(estimatedTokens) || DEFAULT_ESTIMATED_TOKENS);
  const now = Date.now();
  const record = USER_TOKEN_REGISTRY.get(safeId);

  if (!record || now - record.windowStart > TOKEN_WINDOW_MS) {
    USER_TOKEN_REGISTRY.set(safeId, { tokens: safeTokens, windowStart: now });
    return true;
  }

  if (record.tokens + safeTokens > MAX_USER_TOKEN_BUDGET) {
    return false;
  }

  record.tokens += safeTokens;
  return true;
}

/**
 * Build system prompt instructing Google Gemini to generate structured event inspiration.
 * @param {Object} params - Event parameters.
 * @param {string} params.eventType - Celebration type.
 * @param {string} params.theme - Sanitized theme prompt.
 * @param {string} [params.vibe] - Desired atmosphere.
 * @param {number} params.budget - Budget amount.
 * @param {number} params.guestCount - Guest headcount.
 * @returns {string} Complete formatted prompt.
 */
function buildGeminiPrompt(params) {
  const { eventType, theme, vibe, budget, guestCount } = params;
  return `You are a world-class celebration planning consultant.
Provide structured creative planning advice for:
- Event Type: ${eventType}
- Theme: ${theme}
- Atmosphere: ${vibe || 'Festive and memorable'}
- Budget: $${budget}
- Guests: ${guestCount}

Respond ONLY with a valid JSON object matching this exact schema:
{
  "themes": [
    {
      "title": "Creative Theme Name",
      "concept": "1-2 sentence decor, lighting, and ambiance description.",
      "decorPalette": ["#hex1", "#hex2", "#hex3"],
      "budgetTip": "Actionable financial advice to keep costs under budget."
    }
  ],
  "budgetAllocations": [
    {
      "category": "Catering",
      "item": "Signature Plated Dinner & Beverage Service",
      "cost": 5000,
      "notes": "Farm-to-table seasonal catering package"
    },
    {
      "category": "Decor",
      "item": "Ambient Lighting & Floral Installations",
      "cost": 2500,
      "notes": "Warm candelabras and botanical centerpieces"
    },
    {
      "category": "Entertainment",
      "item": "Acoustic Trio & Audio Engineering",
      "cost": 1800,
      "notes": "Ceremony and dinner background music"
    }
  ],
  "suggestedMilestones": [
    {
      "title": "Lock Venue & Key Vendor Contracts",
      "offsetDays": -60,
      "phase": "Planning",
      "notes": "Finalize deposits and cancellation contingency terms"
    },
    {
      "title": "Menu Tasting & Floral Design Review",
      "offsetDays": -30,
      "phase": "Preparation",
      "notes": "Lock in dietary accommodations and table layouts"
    },
    {
      "title": "Final Walkthrough & Audio Engineering Check",
      "offsetDays": -7,
      "phase": "Execution",
      "notes": "Confirm vendor load-in schedule and power requirements"
    },
    {
      "title": "Guest Arrival & Celebration Reception",
      "offsetDays": 0,
      "phase": "Day of",
      "notes": "Execute run-of-show ceremony and dinner service"
    }
  ],
  "suggestedVendors": [
    {
      "category": "Catering",
      "name": "Artisan Hospitality Group",
      "fee": 5000,
      "notes": "Inquire: What setup and breakdown window is included in standard fee?"
    },
    {
      "category": "Decor",
      "name": "Lumière Floral & Event Styling",
      "fee": 2500,
      "notes": "Inquire: Are delivery and on-site strikes included in quote?"
    },
    {
      "category": "Photography",
      "name": "Aura Narrative Photography",
      "fee": 2200,
      "notes": "Inquire: What is the delivery turnaround for high-res edited gallery?"
    }
  ],
  "vendorQuestions": [
    "What setup and breakdown window is included in your standard quote?",
    "Do you carry liability insurance and provide an emergency substitution guarantee?",
    "Are travel fees and service gratuity included in the final estimate?"
  ],
  "timelineRecommendation": [
    "Lock venue and primary vendor contracts 8 weeks out.",
    "Finalize menu tasting and guest count 4 weeks out.",
    "Conduct vendor run-of-show walk-through 7 days out."
  ]
}`;
}

/**
 * Dispatch HTTP request to a specific Gemini model endpoint with timeout and safe error logging.
 * Never logs or exposes raw API keys.
 * @param {string} modelId - Model ID (e.g. 'gemini-3.8-flash').
 * @param {Object} requestBody - Google Gemini API payload.
 * @param {string} apiKey - Server-side Gemini API key.
 * @param {string} primaryModel - Name of primary configured model.
 * @returns {Promise<{ ok: boolean, data?: Object, status: number }>} Dispatch result.
 */
async function dispatchGeminiRequest(modelId, requestBody, apiKey, primaryModel) {
  try {
    process.stdout.write(`[GEMINI] Calling model endpoint: ${modelId}\n`);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (!response.ok) {
      process.stderr.write(
        `[GEMINI] ${modelId} returned HTTP ${response.status}. Attempting fallback...\n`
      );
      return { ok: false, status: response.status };
    }

    const json = await response.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      process.stderr.write(`[GEMINI] ${modelId} returned empty response content.\n`);
      return { ok: false, status: 200 };
    }

    const parsedData = JSON.parse(rawText);
    const isFallback = modelId !== primaryModel;
    process.stdout.write(
      `[GEMINI] Success: Response generated by ${modelId} (fallback: ${isFallback ? 'YES' : 'NO'})\n`
    );
    return {
      ok: true,
      data: {
        ...parsedData,
        isFallback: false,
        modelUsed: modelId,
        fallbackTriggered: isFallback
      },
      status: 200
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown network failure';
    process.stderr.write(`[GEMINI] ${modelId} error: ${errorMsg}. Attempting fallback...\n`);
    return { ok: false, status: 0 };
  }
}

/**
 * Attempt generation across ordered model candidate list.
 * @param {Array<string>} models - Ordered list of model names.
 * @param {Object} requestBody - Google Gemini API payload.
 * @param {string} apiKey - API key.
 * @param {string} primaryModel - Primary model name.
 * @returns {Promise<Object|null>} Generated data or null.
 */
async function tryLiveModels(models, requestBody, apiKey, primaryModel) {
  for (const model of models) {
    const res = await dispatchGeminiRequest(model, requestBody, apiKey, primaryModel);
    if (res.ok) return res.data;
  }
  return null;
}

/**
 * Query the Google Gemini API with model configurability and resilient degradation.
 * Conforms to Rules 1, 9, and 13 of the Security Constitution.
 * Logs model attempts and execution status without exposing API keys.
 * @param {Object} params - Validated event parameters.
 * @returns {Promise<Object>} Structured event suggestions with model metadata.
 */
export async function queryGeminiApi(params) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    process.stderr.write('[GEMINI] No GEMINI_API_KEY detected. Activating offline fallback.\n');
    return getCuratedOfflinePlan(params);
  }

  const primaryModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const sanitizedTheme = sanitizePromptInput(params.theme);
  const promptText = buildGeminiPrompt({ ...params, theme: sanitizedTheme });
  const requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: GENERATION_CONFIG
  };

  try {
    const candidateModels = [
      primaryModel,
      ...COMPATIBLE_LIVE_FALLBACKS.filter(m => m !== primaryModel)
    ];
    const liveResult = await tryLiveModels(candidateModels, requestBody, apiKey, primaryModel);
    if (liveResult) return liveResult;

    process.stderr.write(
      '[GEMINI] All live models exhausted. Activating curated offline engine.\n'
    );
    return getCuratedOfflinePlan(params);
  } catch (unexpectedError) {
    const msg = unexpectedError instanceof Error ? unexpectedError.message : 'Unknown exception';
    process.stderr.write(
      `[GEMINI] Unexpected query error: ${msg}. Falling back to curated engine.\n`
    );
    return getCuratedOfflinePlan(params);
  }
}

import { getCuratedOfflinePlan } from './curatedOfflinePlans.js';
export { getCuratedOfflinePlan };

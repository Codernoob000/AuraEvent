/**
 * @fileoverview Shared utility functions for formatting, sanitization, dates, and export.
 * Follows Single Responsibility Principle, WCAG 2.1 AA, and Security Constitution.
 */

/* global DOMPurify */

/** Currency formatter instance for US Dollars */
const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

/** Currency formatter instance for Indian Rupees (INR) */
const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

/** Date formatter instance for readable event display */
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

/**
 * Format a numeric amount as currency (USD default, supports INR).
 * @param {number} amount - The numeric dollar amount.
 * @param {string} [currency='USD'] - Target currency code ('USD' or 'INR').
 * @returns {string} Formatted currency string (e.g., "$12,500" or "₹12,500").
 */
export function formatCurrency(amount, currency = 'USD') {
  const safeAmount = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0;
  if (currency === 'INR') {
    return INR_FORMATTER.format(safeAmount);
  }
  return CURRENCY_FORMATTER.format(safeAmount);
}

/**
 * Format an ISO date string into human-readable text.
 * @param {string|Date} dateInput - ISO date string or Date instance.
 * @returns {string} Formatted date string (e.g., "Sat, Oct 24, 2026").
 */
export function formatDate(dateInput) {
  if (!dateInput) return 'Unscheduled';
  const parsedDate = new Date(dateInput);
  if (Number.isNaN(parsedDate.getTime())) return 'Invalid date';
  return DATE_FORMATTER.format(parsedDate);
}

/**
 * Sanitize untrusted input to prevent Cross-Site Scripting (XSS).
 * Conforms to Rules 11 and 13 of the Security Constitution.
 * @param {string} dirtyInput - Untrusted user input or LLM response.
 * @returns {string} Clean, safe string.
 */
export function sanitizeHTML(dirtyInput) {
  if (typeof dirtyInput !== 'string') return '';
  if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
    return DOMPurify.sanitize(dirtyInput, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'ul', 'ol', 'li', 'br', 'span'],
      ALLOWED_ATTR: ['class']
    });
  }
  // Fallback: encode entities safely
  return dirtyInput
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Create a debounced wrapper around a function.
 * @param {Function} callback - Function to execute after delay.
 * @param {number} delayMs - Delay in milliseconds.
 * @returns {Function} Debounced function.
 */
export function debounce(callback, delayMs = 250) {
  let timeoutId = null;
  return function debounced(...args) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Generate a cryptographically robust UUID string.
 * @returns {string} UUIDv4 identifier.
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomHex = Math.floor(Math.random() * 16);
    const value = character === 'x' ? randomHex : (randomHex & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Calculate the number of days remaining until an event date.
 * @param {string} targetDateISO - The event date in ISO format.
 * @returns {number} Days remaining (positive: future, 0: today, negative: past).
 */
export function calculateDaysRemaining(targetDateISO) {
  if (!targetDateISO) return 0;
  const now = new Date();
  const target = new Date(targetDateISO);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate detailed countdown (days, hours, minutes, seconds) to an event date.
 * @param {string} targetDateISO - The event date in ISO format.
 * @returns {Object} Object with days, hours, minutes, seconds, isPast.
 */
export function calculateDetailedCountdown(targetDateISO) {
  if (!targetDateISO) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
  const target = new Date(targetDateISO).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, isPast: false };
}

/**
 * Format a Date object to Google Calendar compatible ISO string (YYYYMMDDTHHMMSSZ).
 * @param {Date} dateObj - JavaScript Date object.
 * @returns {string} Google Calendar timestamp string.
 */
function toGoogleCalendarDate(dateObj) {
  return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Build a Google Calendar direct-add URL for an event milestone.
 * @param {Object} options - Calendar milestone options.
 * @param {string} options.title - Milestone or event title.
 * @param {string} options.description - Detailed description.
 * @param {string} options.location - Venue location.
 * @param {string} options.startDateISO - Start date string.
 * @param {number} [options.durationHours=2] - Duration in hours.
 * @returns {string} Google Calendar Add URL.
 */
export function buildGoogleCalendarUrl(options) {
  const { title, description, location, startDateISO, durationHours = 2 } = options;
  const startDate = startDateISO ? new Date(startDateISO) : new Date();
  const endDate = new Date(startDate.getTime() + durationHours * 3600 * 1000);

  const startFormatted = toGoogleCalendarDate(startDate);
  const endFormatted = toGoogleCalendarDate(endDate);

  const queryParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Celebration Milestone',
    dates: `${startFormatted}/${endFormatted}`,
    details: description || 'Scheduled with AuraEvent Celebration Planner',
    location: location || ''
  });

  return `https://calendar.google.com/calendar/render?${queryParams.toString()}`;
}

/**
 * Build RFC 5545 iCalendar content for an entire celebration schedule.
 * @param {Object} eventData - Complete event state.
 * @returns {string} Standard .ics file content.
 */
export function generateICalendarPayload(eventData) {
  const nowStamp = toGoogleCalendarDate(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AuraEvent//Celebration & Event Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const milestones = Array.isArray(eventData.milestones) ? eventData.milestones : [];
  milestones.forEach((item) => {
    const itemDate = item.date ? new Date(item.date) : new Date();
    const endDate = new Date(itemDate.getTime() + 3600 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${item.id || generateUUID()}@auraevent.app`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${toGoogleCalendarDate(itemDate)}`,
      `DTEND:${toGoogleCalendarDate(endDate)}`,
      `SUMMARY:${item.title || 'Event Milestone'}`,
      `DESCRIPTION:${item.phase || 'General'} Phase - Notes: ${item.notes || 'None'}`,
      `STATUS:${item.completed ? 'COMPLETED' : 'CONFIRMED'}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Trigger download of text/data file in client browser.
 * @param {string} content - Text file content.
 * @param {string} fileName - Destination filename.
 * @param {string} mimeType - File MIME type.
 */
export function triggerFileDownload(content, fileName, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(downloadLink.href);
}

/**
 * Safely resolves an untrusted color input into a valid CSS hex color.
 * Handles 6-digit hexes (#8B0000, #FFD700, #E67E22), hexes in descriptions (Emerald Green (#043927)),
 * named colors (Copper, Sage Green, Burgundy, Gold, Terracotta, Navy), hexes without hashes, and objects.
 * @param {string|Object|any} rawColor - Untrusted color input from LLM or template.
 * @param {number} [fallbackIndex=0] - Index for deterministically selecting fallback color.
 * @returns {string} Valid uppercase hex color starting with '#'.
 */
export function resolveCssColor(rawColor, fallbackIndex = 0) {
  const FALLBACK_PALETTE = ['#0F172A', '#92400E', '#065F46', '#B45309', '#D97706', '#475569'];
  if (!rawColor) {
    return FALLBACK_PALETTE[fallbackIndex % FALLBACK_PALETTE.length];
  }

  let str = rawColor;
  if (typeof rawColor === 'object' && rawColor !== null) {
    str = rawColor.hex || rawColor.color || rawColor.value || rawColor.code || rawColor.name || '';
  }

  if (typeof str !== 'string' || !str.trim()) {
    return FALLBACK_PALETTE[fallbackIndex % FALLBACK_PALETTE.length];
  }

  str = str.trim();

  // 1. Direct hex match with hash anywhere in string: e.g. "#8B0000", "Emerald Green (#043927)"
  const hexMatch = str.match(/#([0-9a-fA-F]{3,8})\b/);
  if (hexMatch) return hexMatch[0].toUpperCase();

  // 2. 3-digit or 6-digit hex without hash: e.g. "8B0000", "FFD700"
  if (/^[0-9a-fA-F]{6}$/.test(str) || /^[0-9a-fA-F]{3}$/.test(str)) {
    return `#${str.toUpperCase()}`;
  }

  // 3. Named colors dictionary (case-insensitive substring/equality matching)
  const lower = str.toLowerCase();
  const COLOR_NAME_MAP = {
    // Compound names first
    'dusty rose': '#DCAE96',
    'blush pink': '#F472B6',
    'champagne gold': '#F59E0B',
    'sage green': '#52796F',
    'emerald green': '#043927',
    'midnight navy': '#0F172A',
    'forest green': '#14532D',
    'slate blue': '#475569',
    'royal blue': '#1D4ED8',
    'sky blue': '#38BDF8',
    // Single-word names
    burgundy: '#8B0000',
    gold: '#FFD700',
    terracotta: '#E67E22',
    copper: '#B87333',
    sage: '#52796F',
    emerald: '#043927',
    navy: '#1E3A8A',
    rose: '#E11D48',
    blush: '#FBCFE8',
    champagne: '#FDE68A',
    amber: '#D97706',
    ivory: '#FAF8F5',
    lavender: '#C084FC',
    plum: '#701A75',
    eucalyptus: '#4A7C59',
    slate: '#475569',
    bronze: '#92400E',
    coral: '#FB7185',
    olive: '#65A30D',
    forest: '#14532D',
    crimson: '#991B1B',
    rust: '#C2410C',
    ochre: '#CC7722',
    charcoal: '#334155',
    silver: '#94A3B8',
    teal: '#0D9488',
    peach: '#FDBA74',
    mint: '#6EE7B7',
    mauve: '#C084FC',
    mustard: '#EAB308',
    lilac: '#C4B5FD',
    maroon: '#800000',
    indigo: '#4338CA',
    pearl: '#F8FAFC'
  };

  const entries = Object.entries(COLOR_NAME_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [name, hex] of entries) {
    if (lower.includes(name)) return hex;
  }

  return FALLBACK_PALETTE[fallbackIndex % FALLBACK_PALETTE.length];
}

/**
 * Calculate concrete ISO date string (YYYY-MM-DD) given celebration date and day offset.
 * @param {string} eventDateISO - The celebration target date.
 * @param {number} [offsetDays=0] - Days before event (negative), after (positive), or 0 (day of).
 * @returns {string} YYYY-MM-DD date string.
 */
export function calculateMilestoneDate(eventDateISO, offsetDays = 0) {
  let baseDate = new Date();
  if (eventDateISO) {
    const parsed = new Date(eventDateISO);
    if (!isNaN(parsed.getTime())) {
      baseDate = parsed;
    }
  }
  const targetDate = new Date(baseDate.getTime() + (Number(offsetDays) || 0) * 86400000);
  return targetDate.toISOString().split('T')[0];
}

/**
 * Normalizes and validates Gemini AI plan results into an interactive, editable plan schema.
 * Resilient against partial returns, legacy formats, or malformed inputs.
 * @param {Object} rawPlan - Raw AI output.
 * @param {Object} activeEvent - Current celebration workspace context.
 * @returns {Object} Normalized plan structure with selectable items.
 */
export function normalizeAIPlan(rawPlan, activeEvent = {}) {
  const plan = rawPlan && typeof rawPlan === 'object' ? rawPlan : {};
  const eventBudget = Number(activeEvent.budget) || 20000;
  const eventType = activeEvent.type || 'Celebration';

  // 1. Themes
  const themes = Array.isArray(plan.themes) && plan.themes.length > 0
    ? plan.themes.map((t, idx) => ({
        id: t.id || `theme-${idx + 1}`,
        title: typeof t.title === 'string' ? t.title : `${eventType} Theme Concept`,
        concept: typeof t.concept === 'string' ? t.concept : 'Curated celebration aesthetic and ambiance.',
        decorPalette: Array.isArray(t.decorPalette) ? t.decorPalette : ['#0F172A', '#D97706', '#FAF8F5'],
        budgetTip: typeof t.budgetTip === 'string' ? t.budgetTip : 'Optimize vendor contract terms to control costs.'
      }))
    : [
        {
          id: 'theme-1',
          title: `${eventType} Atelier Elegance`,
          concept: 'Refined architectural lighting, bespoke floral installations, and acoustic soundscapes.',
          decorPalette: ['#0F172A', '#D97706', '#FAF8F5'],
          budgetTip: 'Allocate 40% to catering and 20% to decor to maximize guest impact.'
        }
      ];

  // 2. Budget Allocations
  let budgetAllocations = [];
  if (Array.isArray(plan.budgetAllocations) && plan.budgetAllocations.length > 0) {
    budgetAllocations = plan.budgetAllocations.map((b, idx) => ({
      id: b.id || `ai-budget-${idx + 1}`,
      category: b.category || 'Catering',
      item: b.item || `${eventType} Service Item`,
      cost: Number(b.cost) > 0 ? Number(b.cost) : Math.round(eventBudget * 0.2),
      notes: b.notes || 'Allocated by Gemini AI Atelier',
      selected: true
    }));
  } else {
    budgetAllocations = [
      {
        id: 'ai-budget-1',
        category: 'Catering',
        item: `${eventType} Plated Dinner & Beverage`,
        cost: Math.round(eventBudget * 0.40),
        notes: 'Reception dinner service and table hospitality',
        selected: true
      },
      {
        id: 'ai-budget-2',
        category: 'Decor',
        item: 'Floral Installations & Ambient Lighting',
        cost: Math.round(eventBudget * 0.20),
        notes: 'Table runners, floral centerpieces, and uplighting',
        selected: true
      },
      {
        id: 'ai-budget-3',
        category: 'Entertainment',
        item: 'Live Performance & Audio Engineering',
        cost: Math.round(eventBudget * 0.15),
        notes: 'Sound equipment checkout and live performance',
        selected: true
      },
      {
        id: 'ai-budget-4',
        category: 'Photography',
        item: 'Fine Art Celebration Photography',
        cost: Math.round(eventBudget * 0.15),
        notes: 'Complete event documentary coverage',
        selected: true
      }
    ];
  }

  // 3. Suggested Milestones
  let suggestedMilestones = [];
  if (Array.isArray(plan.suggestedMilestones) && plan.suggestedMilestones.length > 0) {
    suggestedMilestones = plan.suggestedMilestones.map((m, idx) => ({
      id: m.id || `ai-ms-${idx + 1}`,
      title: m.title || `Milestone Phase ${idx + 1}`,
      offsetDays: typeof m.offsetDays === 'number' ? m.offsetDays : (-60 + idx * 25),
      phase: m.phase || (idx === 0 ? 'Planning' : idx === 1 ? 'Preparation' : 'Execution'),
      notes: m.notes || 'Suggested by Gemini AI Atelier',
      selected: true
    }));
  } else if (Array.isArray(plan.timelineRecommendation) && plan.timelineRecommendation.length > 0) {
    suggestedMilestones = plan.timelineRecommendation.map((line, idx) => ({
      id: `ai-ms-${idx + 1}`,
      title: String(line).replace(/^[-*•\d.]+\s*/, '').slice(0, 80),
      offsetDays: idx === 0 ? -60 : idx === 1 ? -30 : idx === 2 ? -7 : 0,
      phase: idx === 0 ? 'Planning' : idx === 1 ? 'Preparation' : 'Execution',
      notes: String(line),
      selected: true
    }));
  } else {
    suggestedMilestones = [
      {
        id: 'ai-ms-1',
        title: 'Lock Venue & Catering Contracts',
        offsetDays: -90,
        phase: 'Planning',
        notes: 'Confirm venue holds, security deposit, and dietary guidelines',
        selected: true
      },
      {
        id: 'ai-ms-2',
        title: 'Finalize Decor, Florals & Layout',
        offsetDays: -30,
        phase: 'Preparation',
        notes: 'Approve centerpiece proofs, table linens, and lighting schemes',
        selected: true
      },
      {
        id: 'ai-ms-3',
        title: 'Vendor Load-In & Audio Sound Check',
        offsetDays: -7,
        phase: 'Execution',
        notes: 'Verify electrical capacity and vendor arrival schedule',
        selected: true
      },
      {
        id: 'ai-ms-4',
        title: 'Celebration Reception & Gala Toast',
        offsetDays: 0,
        phase: 'Day of',
        notes: 'Execute run-of-show timeline, welcome speech, and toast',
        selected: true
      }
    ];
  }

  // 4. Suggested Vendors
  let suggestedVendors = [];
  if (Array.isArray(plan.suggestedVendors) && plan.suggestedVendors.length > 0) {
    suggestedVendors = plan.suggestedVendors.map((v, idx) => ({
      id: v.id || `ai-ven-${idx + 1}`,
      category: v.category || 'Catering',
      name: v.name || `${eventType} Vendor Partner ${idx + 1}`,
      fee: Number(v.fee) > 0 ? Number(v.fee) : Math.round(eventBudget * 0.2),
      notes: v.notes || (plan.vendorQuestions?.[idx] || 'Recommended by Gemini AI'),
      selected: true
    }));
  } else {
    suggestedVendors = [
      {
        id: 'ai-ven-1',
        category: 'Catering',
        name: 'Artisan Culinary & Hospitality',
        fee: Math.round(eventBudget * 0.40),
        notes: plan.vendorQuestions?.[0] || 'Inquire: What setup/breakdown window is included in quote?',
        selected: true
      },
      {
        id: 'ai-ven-2',
        category: 'Decor',
        name: 'Lumière Floral & Event Styling',
        fee: Math.round(eventBudget * 0.20),
        notes: plan.vendorQuestions?.[1] || 'Inquire: Are strikes and delivery included in quote?',
        selected: true
      },
      {
        id: 'ai-ven-3',
        category: 'Photography',
        name: 'Aura Documentary Studio',
        fee: Math.round(eventBudget * 0.15),
        notes: plan.vendorQuestions?.[2] || 'Inquire: What is the delivery turnaround for high-res images?',
        selected: true
      }
    ];
  }

  return {
    id: plan.id || generateUUID(),
    createdAt: plan.createdAt || new Date().toISOString(),
    modelUsed: plan.modelUsed || 'gemini-3.8-flash',
    isFallback: Boolean(plan.isFallback),
    fallbackTriggered: Boolean(plan.fallbackTriggered),
    themes,
    budgetAllocations,
    suggestedMilestones,
    suggestedVendors,
    vendorQuestions: Array.isArray(plan.vendorQuestions) ? plan.vendorQuestions : []
  };
}

/**
 * Render countdown display values to DOM nodes safely.
 * Centralizes DOM countdown element updates across views.
 * @param {string|Date} targetDateISO - ISO target date string or Date object.
 * @param {Document|HTMLElement} [rootNode=document] - Root DOM document or container.
 * @returns {Object} Countdown calculation result object.
 */
export function renderCountdownDisplay(targetDateISO, rootNode = (typeof document !== 'undefined' ? document : null)) {
  const countdown = calculateDetailedCountdown(targetDateISO);
  if (!rootNode) return countdown;

  const cdDays = rootNode.getElementById ? rootNode.getElementById('countdown-days') : rootNode.querySelector?.('#countdown-days');
  const cdHours = rootNode.getElementById ? rootNode.getElementById('countdown-hours') : rootNode.querySelector?.('#countdown-hours');
  const cdMins = rootNode.getElementById ? rootNode.getElementById('countdown-mins') : rootNode.querySelector?.('#countdown-mins');
  const cdSecs = rootNode.getElementById ? rootNode.getElementById('countdown-secs') : rootNode.querySelector?.('#countdown-secs');
  const cdSummary = rootNode.getElementById ? rootNode.getElementById('hero-countdown-summary') : rootNode.querySelector?.('#hero-countdown-summary');

  if (cdDays) cdDays.textContent = String(countdown.days).padStart(2, '0');
  if (cdHours) cdHours.textContent = String(countdown.hours).padStart(2, '0');
  if (cdMins) cdMins.textContent = String(countdown.minutes).padStart(2, '0');
  if (cdSecs) cdSecs.textContent = String(countdown.seconds).padStart(2, '0');

  if (cdSummary) {
    if (countdown.isPast) {
      cdSummary.textContent = 'Celebrated';
    } else if (countdown.days === 0) {
      cdSummary.textContent = 'Today!';
    } else {
      cdSummary.textContent = `${countdown.days} Days to go`;
    }
  }

  return countdown;
}

/**
 * Applies recommended AI inspiration items (budget allocations, milestones, vendors)
 * to a target celebration workspace with de-duplication and without overwriting existing data.
 * @param {Object} celebration - The target celebration event object.
 * @param {Object} candidates - Recommendation items to apply.
 * @param {Array<Object>} [candidates.expensesToAdd] - Selected budget items.
 * @param {Array<Object>} [candidates.budgetAllocations] - Alternative key for budget items.
 * @param {Array<Object>} [candidates.milestonesToAdd] - Selected milestone items.
 * @param {Array<Object>} [candidates.suggestedMilestones] - Alternative key for milestone items.
 * @param {Array<Object>} [candidates.vendorsToAdd] - Selected vendor items.
 * @param {Array<Object>} [candidates.suggestedVendors] - Alternative key for vendor items.
 * @param {Object} [options] - Custom dependency hooks.
 * @param {Function} [options.idGenerator=generateUUID] - ID generator function.
 * @param {Function} [options.dateCalculator=calculateMilestoneDate] - Milestone date calculator.
 * @returns {{ addedExpenses: number, addedMilestones: number, addedVendors: number }} Counts of added items.
 */
export function applyRecommendationsToCelebration(celebration, candidates = {}, options = {}) {
  if (!celebration || typeof celebration !== 'object') {
    return { addedExpenses: 0, addedMilestones: 0, addedVendors: 0 };
  }

  const idGen = options.idGenerator || generateUUID;
  const dateCalc = options.dateCalculator || calculateMilestoneDate;

  celebration.expenses = Array.isArray(celebration.expenses) ? celebration.expenses : [];
  celebration.milestones = Array.isArray(celebration.milestones) ? celebration.milestones : [];
  celebration.vendors = Array.isArray(celebration.vendors) ? celebration.vendors : [];

  // 1. Budget & Expenses
  const budgetList = candidates.expensesToAdd || candidates.budgetAllocations || [];
  const existingExpenses = new Set(
    celebration.expenses.map((e) => (e.description || e.item || '').toLowerCase().trim()).filter(Boolean)
  );
  let addedExpenses = 0;
  budgetList.forEach((item) => {
    const itemDesc = (item.description || item.item || '').trim();
    const descKey = itemDesc.toLowerCase();
    if (descKey && !existingExpenses.has(descKey)) {
      celebration.expenses.push({
        id: idGen(),
        category: item.category || 'General',
        description: itemDesc,
        estimated: Number(item.estimated || item.cost) || 0,
        actual: Number(item.actual || item.cost) || 0,
        status: item.status || 'Pending'
      });
      existingExpenses.add(descKey);
      addedExpenses++;
    }
  });

  // 2. Timeline Milestones
  const milestoneList = candidates.milestonesToAdd || candidates.suggestedMilestones || [];
  const existingMilestones = new Set(
    celebration.milestones.map((m) => (m.title || '').toLowerCase().trim()).filter(Boolean)
  );
  let addedMilestones = 0;
  milestoneList.forEach((m) => {
    const title = (m.title || '').trim();
    const titleKey = title.toLowerCase();
    if (titleKey && !existingMilestones.has(titleKey)) {
      const milestoneDate = m.date || dateCalc(celebration.date, m.offsetDays);
      celebration.milestones.push({
        id: idGen(),
        title: title,
        phase: m.phase || 'Planning',
        date: milestoneDate,
        notes: m.notes || 'Recommended by Gemini AI',
        completed: Boolean(m.completed)
      });
      existingMilestones.add(titleKey);
      addedMilestones++;
    }
  });
  celebration.milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 3. Vendors
  const vendorList = candidates.vendorsToAdd || candidates.suggestedVendors || [];
  const existingVendors = new Set(
    celebration.vendors.map((v) => (v.name || '').toLowerCase().trim()).filter(Boolean)
  );
  let addedVendors = 0;
  vendorList.forEach((v) => {
    const name = (v.name || '').trim();
    const nameKey = name.toLowerCase();
    if (nameKey && !existingVendors.has(nameKey)) {
      celebration.vendors.push({
        id: idGen(),
        category: v.category || 'General',
        name: name,
        contact: v.contact || 'Pending outreach',
        fee: Number(v.fee) || 0,
        status: v.status || 'Quoted'
      });
      existingVendors.add(nameKey);
      addedVendors++;
    }
  });

  return { addedExpenses, addedMilestones, addedVendors };
}



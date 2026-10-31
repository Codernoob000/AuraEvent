/**
 * @fileoverview Default celebration data templates and state persistence engine.
 * Supports multi-event planning (Weddings, Birthdays, Community Galas).
 */

import { APP_CONFIG } from './config.js';

/** Default pre-seeded celebration templates */
export const DEFAULT_CELEBRATIONS = [
  {
    id: 'evt-wedding-01',
    name: "Maya & Leo's Autumn Wedding",
    type: 'Wedding',
    date: '2026-11-20',
    budget: 24000,
    guestCount: 120,
    expenses: [
      { id: 'exp-1', category: 'Venue', description: 'Harborview Estate & Lawn Rental', estimated: 7500, actual: 7500, status: 'Paid in Full' },
      { id: 'exp-2', category: 'Catering', description: 'Farm-to-Table Dinner (120 guests)', estimated: 8400, actual: 8200, status: 'Deposit Paid' },
      { id: 'exp-3', category: 'Photography', description: 'Full Day Photography + Video Reel', estimated: 3200, actual: 3200, status: 'Deposit Paid' },
      { id: 'exp-4', category: 'Entertainment', description: 'String Quartet & Evening Jazz Trio', estimated: 2400, actual: 2100, status: 'Pending' },
      { id: 'exp-5', category: 'Decor', description: 'Seasonal Autumn Floral Installations', estimated: 1800, actual: 1950, status: 'Deposit Paid' }
    ],
    milestones: [
      { id: 'ms-1', title: 'Vendor Arrival & Floral Setup', phase: 'Ceremony', date: '2026-11-20T11:00', notes: 'Check centerpieces and arbor placement.', completed: true },
      { id: 'ms-2', title: 'Wedding Ceremony & Vow Exchange', phase: 'Ceremony', date: '2026-11-20T14:30', notes: 'String quartet plays processional.', completed: false },
      { id: 'ms-3', title: 'Sunset Cocktails & Hor d’oeuvres', phase: 'Reception', date: '2026-11-20T16:00', notes: 'Lawn games and bar service open.', completed: false },
      { id: 'ms-4', title: 'Reception Banquet & First Dance', phase: 'Reception', date: '2026-11-20T18:00', notes: 'Speeches and banquet dinner service.', completed: false },
      { id: 'ms-5', title: 'Sparkler Farewell & Venue Teardown', phase: 'Breakdown', date: '2026-11-20T22:30', notes: 'Pack guest favors and vendor departure.', completed: false }
    ],
    vendors: [
      { id: 'ven-1', category: 'Venue', name: 'Harborview Estate', contact: 'events@harborview.com', fee: 7500, status: 'Confirmed' },
      { id: 'ven-2', category: 'Catering', name: 'Heritage Artisan Kitchen', contact: 'chef@heritagekitchen.com', fee: 8200, status: 'Confirmed' },
      { id: 'ven-3', category: 'Photography', name: 'Lumina Wedding Studios', contact: 'info@luminastudios.com', fee: 3200, status: 'Confirmed' },
      { id: 'ven-4', category: 'Music', name: 'Velvet Strings & Trio', contact: 'booking@velvetstrings.com', fee: 2100, status: 'Quoted' }
    ],
    savedPlans: [],
    vendorChecklist: [
      { id: 'chk-1', text: 'Confirm final headcount with Heritage Artisan Kitchen (120 guests)', completed: true },
      { id: 'chk-2', text: 'Sign sound ordinance waiver with Harborview Estate', completed: false }
    ]
  },
  {
    id: 'evt-birthday-02',
    name: "Marcus's 40th Starlight Birthday",
    type: 'Birthday',
    date: '2026-12-05',
    budget: 6500,
    guestCount: 50,
    expenses: [
      { id: 'exp-b1', category: 'Venue', description: 'Rooftop Lounge Private Terrace', estimated: 2200, actual: 2200, status: 'Paid in Full' },
      { id: 'exp-b2', category: 'Catering', description: 'Artisan Tapas & Craft Cocktails', estimated: 2600, actual: 2450, status: 'Deposit Paid' },
      { id: 'exp-b3', category: 'Entertainment', description: 'Vinyl DJ & Retro Lighting', estimated: 1200, actual: 1200, status: 'Confirmed' }
    ],
    milestones: [
      { id: 'ms-b1', title: 'Rooftop Soundcheck & Ambient Decor', phase: 'Ceremony', date: '2026-12-05T17:00', notes: 'Verify LED stargazers and audio levels.', completed: false },
      { id: 'ms-b2', title: 'Guest Arrival & Welcome Toast', phase: 'Reception', date: '2026-12-05T19:00', notes: 'Signature cocktails and acoustic set.', completed: false },
      { id: 'ms-b3', title: 'Midnight Birthday Cake & Speeches', phase: 'Reception', date: '2026-12-05T21:30', notes: 'Surprise video montage presentation.', completed: false }
    ],
    vendors: [
      { id: 'ven-b1', category: 'Venue', name: 'Skyline Terrace Lounge', contact: 'marcus-party@skylineterrace.com', fee: 2200, status: 'Confirmed' },
      { id: 'ven-b2', category: 'Entertainment', name: 'Groove Collective DJ', contact: 'dj@groovecollective.com', fee: 1200, status: 'Confirmed' }
    ],
    savedPlans: [],
    vendorChecklist: [
      { id: 'chk-1', text: 'Confirm final headcount with Heritage Artisan Kitchen (120 guests)', completed: true },
      { id: 'chk-2', text: 'Sign sound ordinance waiver with Harborview Estate', completed: false }
    ]
  },
  {
    id: 'evt-community-03',
    name: 'Riverside Summer Community Gala',
    type: 'Community Event',
    date: '2026-08-15',
    budget: 15000,
    guestCount: 350,
    expenses: [
      { id: 'exp-c1', category: 'Venue', description: 'Riverside Amphitheater Municipal Permit', estimated: 2500, actual: 2500, status: 'Paid in Full' },
      { id: 'exp-c2', category: 'Entertainment', description: 'Community Brass Band & Stage AV', estimated: 4500, actual: 4200, status: 'Deposit Paid' },
      { id: 'exp-c3', category: 'Catering', description: 'Local Food Truck Collective Subsidies', estimated: 5000, actual: 4800, status: 'Pending' }
    ],
    milestones: [
      { id: 'ms-c1', title: 'Volunteer Rally & Stage Assembly', phase: 'Ideation', date: '2026-08-15T08:00', notes: 'Safety walk-through with city officials.', completed: true },
      { id: 'ms-c2', title: 'Gates Open & Community Welcoming', phase: 'Reception', date: '2026-08-15T11:00', notes: 'Mayor welcome speech and band fanfare.', completed: false }
    ],
    vendors: [
      { id: 'ven-c1', category: 'Venue', name: 'City Parks Administration', contact: 'permits@riverside.gov', fee: 2500, status: 'Confirmed' }
    ],
    savedPlans: [],
    vendorChecklist: [
      { id: 'chk-1', text: 'Confirm final headcount with Heritage Artisan Kitchen (120 guests)', completed: true },
      { id: 'chk-2', text: 'Sign sound ordinance waiver with Harborview Estate', completed: false }
    ]
  },
  {
    id: 'evt-corporate-04',
    name: 'NexaTech Global Innovation Gala 2026',
    type: 'Corporate Event',
    date: '2026-10-15',
    budget: 45000,
    guestCount: 250,
    expenses: [
      { id: 'exp-cr1', category: 'Venue', description: 'Metropolitan Convention Hall & Atrium', estimated: 18000, actual: 18000, status: 'Paid in Full' },
      { id: 'exp-cr2', category: 'Catering', description: 'Executive Banquet & Keynote Breakfast', estimated: 15000, actual: 14500, status: 'Deposit Paid' },
      { id: 'exp-cr3', category: 'Entertainment', description: 'Keynote Stage AV, LED Walls & Hologram Rig', estimated: 8000, actual: 8200, status: 'Confirmed' }
    ],
    milestones: [
      { id: 'ms-cr1', title: 'Keynote Speaker Tech Rehearsal', phase: 'Ceremony', date: '2026-10-15T08:30', notes: 'Microphone checks and teleprompter cues.', completed: true },
      { id: 'ms-cr2', title: 'Executive Welcome & Product Keynote', phase: 'Ceremony', date: '2026-10-15T10:00', notes: 'Main plenary hall livestream activation.', completed: false },
      { id: 'ms-cr3', title: 'Awards Banquet & Networking Gala', phase: 'Reception', date: '2026-10-15T18:00', notes: 'Presentation of Annual Engineering Awards.', completed: false }
    ],
    vendors: [
      { id: 'ven-cr1', category: 'Venue', name: 'Metropolitan Convention Center', contact: 'sales@metroconventions.com', fee: 18000, status: 'Confirmed' },
      { id: 'ven-cr2', category: 'AV & Production', name: 'Apex Media Systems', contact: 'ops@apexmedia.com', fee: 8200, status: 'Confirmed' }
    ],
    savedPlans: []
  }
];

/**
 * Load persisted celebration events from browser localStorage.
 * Falls back to DEFAULT_CELEBRATIONS if storage is empty.
 * @returns {Array<Object>} List of celebration event objects.
 */
export function loadPersistedEvents() {
  try {
    const rawData = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.EVENTS);
    if (!rawData) return DEFAULT_CELEBRATIONS;
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((evt) => ({
        ...evt,
        expenses: Array.isArray(evt.expenses) ? evt.expenses : [],
        milestones: Array.isArray(evt.milestones) ? evt.milestones : [],
        vendors: Array.isArray(evt.vendors) ? evt.vendors : [],
        savedPlans: Array.isArray(evt.savedPlans) ? evt.savedPlans : [],
        vendorChecklist: Array.isArray(evt.vendorChecklist) ? evt.vendorChecklist : []
      }));
    }
    return DEFAULT_CELEBRATIONS;
  } catch {
    return DEFAULT_CELEBRATIONS;
  }
}

/**
 * Save current list of events to browser localStorage.
 * @param {Array<Object>} eventsList - Array of event objects.
 */
export function saveEventsToStorage(eventsList) {
  try {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.EVENTS, JSON.stringify(eventsList));
  } catch {
    // Storage quota handled gracefully
  }
}

/**
 * Retrieve the active event ID from storage or return default.
 * @param {Array<Object>} eventsList - Current events array.
 * @returns {string} Active event ID.
 */
export function getStoredActiveEventId(eventsList) {
  try {
    const storedId = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_EVENT_ID);
    if (storedId && eventsList.some((evt) => evt.id === storedId)) {
      return storedId;
    }
  } catch {
    // Fallback to first item
  }
  return eventsList[0]?.id || 'evt-wedding-01';
}

/**
 * Save the active event ID to storage.
 * @param {string} eventId - Unique event identifier.
 */
export function saveActiveEventId(eventId) {
  try {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_EVENT_ID, eventId);
  } catch {
    // Silently continue
  }
}


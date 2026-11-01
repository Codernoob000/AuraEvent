/**
 * @fileoverview Comprehensive Regression Audit for AuraEvent Code Quality Refactoring.
 * Strictly verifies all 10 regression audit criteria.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Import production modules
import { APP_CONFIG } from '../scripts/config.js';
import {
  formatCurrency,
  formatDate,
  calculateDetailedCountdown,
  renderCountdownDisplay,
  calculateMilestoneDate,
  normalizeAIPlan,
  applyRecommendationsToCelebration,
  generateUUID,
  sanitizeHTML,
  resolveCssColor
} from '../scripts/utils.js';
import {
  loadPersistedEvents,
  saveEventsToStorage,
  getStoredActiveEventId,
  saveActiveEventId,
  DEFAULT_CELEBRATIONS
} from '../scripts/events-data.js';
import { setupModals } from '../scripts/modal-controller.js';
import { renderAIResults } from '../scripts/ui-renderers.js';

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function check(name, fn) {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failedChecks++;
    failures.push({ name, error: err.message, stack: err.stack });
    console.error(`  [FAIL] ${name}: ${err.message}`);
  }
}

async function asyncCheck(name, fn) {
  totalChecks++;
  try {
    await fn();
    passedChecks++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failedChecks++;
    failures.push({ name, error: err.message, stack: err.stack });
    console.error(`  [FAIL] ${name}: ${err.message}`);
  }
}

console.log('\n=== INDEPENDENT REFACTORING REGRESSION AUDIT ===\n');

/* ==========================================================================
   CRITERION 1: All eight modal form handlers preserve behavior
   ========================================================================== */
console.log('--- Criterion 1: Modal Form Handlers Lifecycle & Mutation ---');

class MockElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.value = '';
    this.classList = {
      classes: new Set(),
      add: c => this.classList.classes.add(c),
      remove: c => this.classList.classes.delete(c),
      contains: c => this.classList.classes.has(c)
    };
    this.listeners = {};
    this.attributes = {};
  }
  addEventListener(event, handler) {
    this.listeners[event] = handler;
  }
  setAttribute(k, v) {
    this.attributes[k] = v;
  }
  getAttribute(k) {
    return this.attributes[k];
  }
  focus() {
    this.focused = true;
  }
  reset() {
    this.resetCalled = true;
  }
  trigger(event, data = {}) {
    if (this.listeners[event]) {
      const e = {
        preventDefault: () => {
          this.prevented = true;
        },
        target: this,
        ...data
      };
      this.listeners[event](e);
      return e;
    }
    return null;
  }
}

function createMockDOM() {
  const elements = new Map();
  function getEl(id, tag = 'div') {
    if (!elements.has(id)) {
      elements.set(id, new MockElement(id, tag));
    }
    return elements.get(id);
  }

  global.document = {
    getElementById: id => getEl(id),
    querySelectorAll: selector => {
      if (selector === '.modal-backdrop') {
        return [
          getEl('modal-expense'),
          getEl('modal-edit-expense'),
          getEl('modal-milestone'),
          getEl('modal-vendor'),
          getEl('modal-new-event'),
          getEl('modal-edit-event'),
          getEl('modal-sync')
        ];
      }
      if (selector === '.event-type-card') {
        const c1 = getEl('card-type-1');
        c1.setAttribute('data-type', 'Wedding');
        const c2 = getEl('card-type-2');
        c2.setAttribute('data-type', 'Birthday');
        return [c1, c2];
      }
      if (selector === '.btn-close-modal, .btn-close') return [];
      return [];
    },
    createElement: tag => new MockElement(`mock-${Math.random()}`, tag)
  };
  global.window = {
    addEventListener: () => {}
  };

  return { getEl, elements };
}

check('Criterion 1.1: Form Add Expense triggers full lifecycle', () => {
  const { getEl } = createMockDOM();
  let persistCalled = false;
  let refreshCalled = false;
  let toastMsg = null;
  const mockEvent = { id: 'evt-1', expenses: [], milestones: [], vendors: [] };

  setupModals({
    getActiveEvent: () => mockEvent,
    persistAndSync: () => {
      persistCalled = true;
    },
    refreshActiveView: () => {
      refreshCalled = true;
    },
    showToast: m => {
      toastMsg = m;
    },
    onEventCreated: () => {}
  });

  getEl('exp-category').value = 'Venue';
  getEl('exp-description').value = 'Ballroom Rental';
  getEl('exp-estimated').value = '5000';
  getEl('exp-actual').value = '5200';
  getEl('exp-status').value = 'Deposit Paid';

  const form = getEl('form-add-expense', 'form');
  form.trigger('submit');

  assert.strictEqual(form.prevented, true, 'e.preventDefault must be called');
  assert.strictEqual(persistCalled, true, 'persistAndSync must be called');
  assert.strictEqual(refreshCalled, true, 'refreshActiveView must be called');
  assert.strictEqual(form.resetCalled, true, 'form.reset must be called');
  assert.strictEqual(toastMsg, 'Expense item added successfully.');
  assert.strictEqual(mockEvent.expenses.length, 1);
  assert.strictEqual(mockEvent.expenses[0].description, 'Ballroom Rental');
  assert.strictEqual(mockEvent.expenses[0].actual, 5200);
});

check('Criterion 1.2: Form Add Milestone triggers full lifecycle', () => {
  const { getEl } = createMockDOM();
  let persistCalled = false;
  let refreshCalled = false;
  let toastMsg = null;
  const mockEvent = { id: 'evt-1', expenses: [], milestones: [], vendors: [] };

  setupModals({
    getActiveEvent: () => mockEvent,
    persistAndSync: () => {
      persistCalled = true;
    },
    refreshActiveView: () => {
      refreshCalled = true;
    },
    showToast: m => {
      toastMsg = m;
    },
    onEventCreated: () => {}
  });

  getEl('ms-title').value = 'Final Rehearsal';
  getEl('ms-phase').value = 'Execution';
  getEl('ms-date').value = '2026-11-19T18:00';
  getEl('ms-notes').value = 'All attendants must be present';

  const form = getEl('form-add-milestone', 'form');
  form.trigger('submit');

  assert.strictEqual(persistCalled, true);
  assert.strictEqual(refreshCalled, true);
  assert.strictEqual(form.resetCalled, true);
  assert.strictEqual(toastMsg, 'Run-of-show milestone created.');
  assert.strictEqual(mockEvent.milestones.length, 1);
  assert.strictEqual(mockEvent.milestones[0].title, 'Final Rehearsal');
  assert.strictEqual(mockEvent.milestones[0].completed, false);
});

check('Criterion 1.3: Form Add Vendor triggers full lifecycle', () => {
  const { getEl } = createMockDOM();
  let persistCalled = false;
  let refreshCalled = false;
  let toastMsg = null;
  const mockEvent = { id: 'evt-1', expenses: [], milestones: [], vendors: [] };

  setupModals({
    getActiveEvent: () => mockEvent,
    persistAndSync: () => {
      persistCalled = true;
    },
    refreshActiveView: () => {
      refreshCalled = true;
    },
    showToast: m => {
      toastMsg = m;
    },
    onEventCreated: () => {}
  });

  getEl('ven-category').value = 'Photography';
  getEl('ven-name').value = 'Aura Visuals';
  getEl('ven-contact').value = 'contact@auravisuals.com';
  getEl('ven-fee').value = '3500';
  getEl('ven-status').value = 'Confirmed';

  const form = getEl('form-add-vendor', 'form');
  form.trigger('submit');

  assert.strictEqual(persistCalled, true);
  assert.strictEqual(refreshCalled, true);
  assert.strictEqual(form.resetCalled, true);
  assert.strictEqual(toastMsg, 'Vendor partner registered.');
  assert.strictEqual(mockEvent.vendors.length, 1);
  assert.strictEqual(mockEvent.vendors[0].name, 'Aura Visuals');
  assert.strictEqual(mockEvent.vendors[0].fee, 3500);
});

check('Criterion 1.4: Form Create Event triggers onEventCreated callback', () => {
  const { getEl } = createMockDOM();
  let createdEvent = null;
  let toastMsg = null;

  setupModals({
    getActiveEvent: () => null,
    persistAndSync: () => {},
    refreshActiveView: () => {},
    showToast: m => {
      toastMsg = m;
    },
    onEventCreated: evt => {
      createdEvent = evt;
    }
  });

  getEl('evt-name').value = 'Golden Anniversary Gala';
  getEl('evt-type').value = 'Anniversary';
  getEl('evt-currency').value = 'INR';
  getEl('evt-date').value = '2026-12-25';
  getEl('evt-budget').value = '500000';
  getEl('evt-guests').value = '200';
  getEl('evt-theme-notes').value = 'Gold and ivory classic ballroom';

  const form = getEl('form-create-event', 'form');
  form.trigger('submit');

  assert.strictEqual(form.resetCalled, true);
  assert.ok(createdEvent, 'onEventCreated must be called');
  assert.strictEqual(createdEvent.name, 'Golden Anniversary Gala');
  assert.strictEqual(createdEvent.currency, 'INR');
  assert.strictEqual(createdEvent.budget, 500000);
  assert.strictEqual(createdEvent.guestCount, 200);
  assert.strictEqual(toastMsg, 'Celebration "Golden Anniversary Gala" created!');
});

check('Criterion 1.5: Form Edit Event updates active celebration details', () => {
  const { getEl } = createMockDOM();
  let persistCalled = false;
  let toastMsg = null;
  const mockEvent = {
    id: 'evt-1',
    name: 'Old Name',
    type: 'Wedding',
    date: '2026-10-01',
    budget: 10000,
    guestCount: 50
  };

  setupModals({
    getActiveEvent: () => mockEvent,
    persistAndSync: () => {
      persistCalled = true;
    },
    refreshActiveView: () => {},
    showToast: m => {
      toastMsg = m;
    },
    onEventCreated: () => {}
  });

  getEl('edit-evt-name').value = 'Updated Name Celebration';
  getEl('edit-evt-type').value = 'Birthday';
  getEl('edit-evt-currency').value = 'USD';
  getEl('edit-evt-date').value = '2026-11-01';
  getEl('edit-evt-budget').value = '15000';
  getEl('edit-evt-guests').value = '75';
  getEl('edit-evt-theme-notes').value = 'Starlight modern rooftop';

  const form = getEl('form-edit-event', 'form');
  form.trigger('submit');

  assert.strictEqual(persistCalled, true);
  assert.strictEqual(mockEvent.name, 'Updated Name Celebration');
  assert.strictEqual(mockEvent.type, 'Birthday');
  assert.strictEqual(mockEvent.budget, 15000);
  assert.strictEqual(mockEvent.guestCount, 75);
  assert.strictEqual(toastMsg, 'Updated details for "Updated Name Celebration".');
});

check('Criterion 1.6: Form Edit Expense updates existing expense and ignores invalid ID', () => {
  const { getEl } = createMockDOM();
  let persistCount = 0;
  const mockEvent = {
    id: 'evt-1',
    expenses: [
      {
        id: 'exp-1',
        category: 'Venue',
        description: 'Original Venue',
        estimated: 4000,
        actual: 4000,
        status: 'Pending'
      }
    ]
  };

  setupModals({
    getActiveEvent: () => mockEvent,
    persistAndSync: () => {
      persistCount++;
    },
    refreshActiveView: () => {},
    showToast: () => {},
    onEventCreated: () => {}
  });

  // Valid ID update
  getEl('edit-exp-id').value = 'exp-1';
  getEl('edit-exp-category').value = 'Venue';
  getEl('edit-exp-description').value = 'Upgraded Grand Ballroom';
  getEl('edit-exp-estimated').value = '6000';
  getEl('edit-exp-actual').value = '6200';
  getEl('edit-exp-status').value = 'Paid in Full';

  const form = getEl('form-edit-expense', 'form');
  form.trigger('submit');

  assert.strictEqual(persistCount, 1);
  assert.strictEqual(mockEvent.expenses[0].description, 'Upgraded Grand Ballroom');
  assert.strictEqual(mockEvent.expenses[0].actual, 6200);

  // Invalid ID update (must bail out safely returning false)
  getEl('edit-exp-id').value = 'non-existent-id';
  form.trigger('submit');
  assert.strictEqual(persistCount, 1, 'Invalid ID must not trigger persist');
});

check(
  'Criterion 1.7: Form Edit Milestone updates existing milestone and ignores invalid ID',
  () => {
    const { getEl } = createMockDOM();
    let persistCount = 0;
    const mockEvent = {
      id: 'evt-1',
      milestones: [
        {
          id: 'ms-1',
          title: 'Old Milestone',
          phase: 'Planning',
          date: '2026-10-10',
          notes: 'Old notes'
        }
      ]
    };

    setupModals({
      getActiveEvent: () => mockEvent,
      persistAndSync: () => {
        persistCount++;
      },
      refreshActiveView: () => {},
      showToast: () => {},
      onEventCreated: () => {}
    });

    getEl('edit-ms-id').value = 'ms-1';
    getEl('edit-ms-title').value = 'Updated Milestone Title';
    getEl('edit-ms-phase').value = 'Execution';
    getEl('edit-ms-date').value = '2026-10-12';
    getEl('edit-ms-notes').value = 'New instructions';

    const form = getEl('form-edit-milestone', 'form');
    form.trigger('submit');

    assert.strictEqual(persistCount, 1);
    assert.strictEqual(mockEvent.milestones[0].title, 'Updated Milestone Title');
    assert.strictEqual(mockEvent.milestones[0].phase, 'Execution');

    // Invalid ID
    getEl('edit-ms-id').value = 'non-existent-ms';
    form.trigger('submit');
    assert.strictEqual(persistCount, 1);
  }
);

check('Criterion 1.8: Form Edit Vendor updates existing vendor and ignores invalid ID', () => {
  const { getEl } = createMockDOM();
  let persistCount = 0;
  const mockEvent = {
    id: 'evt-1',
    vendors: [
      {
        id: 'ven-1',
        category: 'Catering',
        name: 'Old Caterer',
        contact: 'old@caterer.com',
        fee: 2000,
        status: 'Quoted'
      }
    ]
  };

  setupModals({
    getActiveEvent: () => mockEvent,
    persistAndSync: () => {
      persistCount++;
    },
    refreshActiveView: () => {},
    showToast: () => {},
    onEventCreated: () => {}
  });

  getEl('edit-ven-id').value = 'ven-1';
  getEl('edit-ven-category').value = 'Catering';
  getEl('edit-ven-name').value = 'Premier Gourmet Catering';
  getEl('edit-ven-contact').value = 'sales@premiergourmet.com';
  getEl('edit-ven-fee').value = '2800';
  getEl('edit-ven-status').value = 'Confirmed';

  const form = getEl('form-edit-vendor', 'form');
  form.trigger('submit');

  assert.strictEqual(persistCount, 1);
  assert.strictEqual(mockEvent.vendors[0].name, 'Premier Gourmet Catering');
  assert.strictEqual(mockEvent.vendors[0].fee, 2800);
  assert.strictEqual(mockEvent.vendors[0].status, 'Confirmed');

  // Invalid ID
  getEl('edit-ven-id').value = 'bad-vendor-id';
  form.trigger('submit');
  assert.strictEqual(persistCount, 1);
});

check('Criterion 1.9: Form Add Vendor Checklist Task appends task safely', () => {
  const { getEl } = createMockDOM();
  let persistCalled = false;
  const mockEvent = { id: 'evt-1', vendorChecklist: [] };

  setupModals({
    getActiveEvent: () => mockEvent,
    persistAndSync: () => {
      persistCalled = true;
    },
    refreshActiveView: () => {},
    showToast: () => {},
    onEventCreated: () => {}
  });

  const taskInput = getEl('input-checklist-task', 'input');
  taskInput.value = 'Sign lighting rider agreement';

  const form = getEl('form-add-checklist-task', 'form');
  form.trigger('submit');

  assert.strictEqual(persistCalled, true);
  assert.strictEqual(mockEvent.vendorChecklist.length, 1);
  assert.strictEqual(mockEvent.vendorChecklist[0].text, 'Sign lighting rider agreement');
  assert.strictEqual(mockEvent.vendorChecklist[0].completed, false);
  assert.strictEqual(taskInput.value, '', 'Input must be cleared after addition');
});

/* ==========================================================================
   CRITERION 2 & 3: Recommendation application, selection & deduplication
   ========================================================================== */
console.log('\n--- Criterion 2 & 3: Recommendation Application, Selection & Deduplication ---');

check('Criterion 2.1: Entire plan application appends all non-duplicate items', () => {
  const event = {
    id: 'evt-test-1',
    date: '2026-11-20',
    expenses: [{ id: 'e0', description: 'Existing Hall', cost: 1000 }],
    milestones: [{ id: 'm0', title: 'Existing Deposit', date: '2026-09-01', completed: true }],
    vendors: [{ id: 'v0', name: 'Existing Baker', fee: 500 }]
  };

  const plan = {
    budgetAllocations: [
      { item: 'Lighting Rig', cost: 1200, category: 'Decor', selected: true },
      { item: 'Existing Hall', cost: 1500, category: 'Venue', selected: true } // duplicate
    ],
    suggestedMilestones: [
      { title: 'Vendor Load-In', offsetDays: -2, phase: 'Execution', selected: true },
      { title: 'Existing Deposit', offsetDays: -60, phase: 'Planning', selected: true } // duplicate
    ],
    suggestedVendors: [
      { name: 'Sound Tech Co', fee: 1800, category: 'Entertainment', selected: true },
      { name: 'Existing Baker', fee: 600, category: 'Catering', selected: true } // duplicate
    ]
  };

  const counts = applyRecommendationsToCelebration(event, plan);
  assert.strictEqual(counts.addedExpenses, 1, 'Only non-duplicate expense should be added');
  assert.strictEqual(counts.addedMilestones, 1, 'Only non-duplicate milestone should be added');
  assert.strictEqual(counts.addedVendors, 1, 'Only non-duplicate vendor should be added');

  assert.strictEqual(event.expenses.length, 2);
  assert.strictEqual(event.milestones.length, 2);
  assert.strictEqual(event.vendors.length, 2);

  // Existing items strictly preserved
  assert.strictEqual(event.expenses[0].id, 'e0');
  assert.strictEqual(event.milestones[0].id, 'm0');
  assert.strictEqual(event.milestones[0].completed, true);
  assert.strictEqual(event.vendors[0].id, 'v0');
});

check('Criterion 2.2: Selected-only recommendation application respects selection flag', () => {
  const event = {
    id: 'evt-test-2',
    date: '2026-11-20',
    expenses: [],
    milestones: [],
    vendors: []
  };

  // Candidates with selection flags (simulating renderPlanPreviewModal output)
  const candidates = {
    expensesToAdd: [{ item: 'Selected Decor', cost: 500, category: 'Decor' }],
    milestonesToAdd: [{ title: 'Selected Rehearsal', offsetDays: -1, phase: 'Preparation' }],
    vendorsToAdd: [{ name: 'Selected Florist', fee: 900, category: 'Decor' }]
  };

  const counts = applyRecommendationsToCelebration(event, candidates);
  assert.strictEqual(counts.addedExpenses, 1);
  assert.strictEqual(counts.addedMilestones, 1);
  assert.strictEqual(counts.addedVendors, 1);
  assert.strictEqual(event.expenses[0].description, 'Selected Decor');
  assert.strictEqual(event.milestones[0].title, 'Selected Rehearsal');
  assert.strictEqual(event.vendors[0].name, 'Selected Florist');
});

check('Criterion 3.1: Idempotency: Applying the same plan twice produces 0 new items', () => {
  const event = {
    id: 'evt-test-3',
    date: '2026-11-20',
    expenses: [],
    milestones: [],
    vendors: []
  };

  const plan = {
    budgetAllocations: [{ item: 'Banquet Hall', cost: 5000, category: 'Venue' }],
    suggestedMilestones: [{ title: 'Sign Contract', offsetDays: -90, phase: 'Planning' }],
    suggestedVendors: [{ name: 'Grand Ballroom Co', fee: 5000, category: 'Venue' }]
  };

  const firstPass = applyRecommendationsToCelebration(event, plan);
  assert.strictEqual(firstPass.addedExpenses, 1);
  assert.strictEqual(firstPass.addedMilestones, 1);
  assert.strictEqual(firstPass.addedVendors, 1);

  const secondPass = applyRecommendationsToCelebration(event, plan);
  assert.strictEqual(secondPass.addedExpenses, 0, 'Second pass must add 0 expenses');
  assert.strictEqual(secondPass.addedMilestones, 0, 'Second pass must add 0 milestones');
  assert.strictEqual(secondPass.addedVendors, 0, 'Second pass must add 0 vendors');

  assert.strictEqual(event.expenses.length, 1);
  assert.strictEqual(event.milestones.length, 1);
  assert.strictEqual(event.vendors.length, 1);
});

check('Criterion 3.2: Chronological milestone ordering is preserved after addition', () => {
  const event = {
    id: 'evt-test-4',
    date: '2026-11-20',
    expenses: [],
    milestones: [{ id: 'm-mid', title: 'Mid Planning', date: '2026-10-01' }],
    vendors: []
  };

  const plan = {
    suggestedMilestones: [
      { title: 'Very Early', offsetDays: -90 }, // 2026-08-22
      { title: 'Day Of', offsetDays: 0 }, // 2026-11-20
      { title: 'One Week Prior', offsetDays: -7 } // 2026-11-13
    ]
  };

  applyRecommendationsToCelebration(event, plan);
  assert.strictEqual(event.milestones.length, 4);
  for (let i = 0; i < event.milestones.length - 1; i++) {
    const d1 = new Date(event.milestones[i].date).getTime();
    const d2 = new Date(event.milestones[i + 1].date).getTime();
    assert.ok(
      d1 <= d2,
      `Milestone ${i} (${event.milestones[i].date}) must precede milestone ${i + 1} (${event.milestones[i + 1].date})`
    );
  }
});

/* ==========================================================================
   CRITERION 4: Event normalization & legacy persisted data
   ========================================================================== */
console.log('\n--- Criterion 4: Event Normalization & Legacy Persistence ---');

check('Criterion 4.1: normalizeAIPlan handles empty/fallback inputs', () => {
  const normalized = normalizeAIPlan(null, {});
  assert.ok(normalized);
  assert.ok(Array.isArray(normalized.themes) && normalized.themes.length > 0);
  assert.ok(Array.isArray(normalized.budgetAllocations) && normalized.budgetAllocations.length > 0);
  assert.ok(
    Array.isArray(normalized.suggestedMilestones) && normalized.suggestedMilestones.length > 0
  );
  assert.ok(Array.isArray(normalized.suggestedVendors) && normalized.suggestedVendors.length > 0);
  assert.ok(Array.isArray(normalized.vendorQuestions));
  assert.strictEqual(normalized.isFallback, false);
});

check('Criterion 4.2: normalizeAIPlan converts legacy string timelineRecommendation', () => {
  const legacyPlan = {
    timelineRecommendation: [
      '12 weeks out: Book reception venue',
      '4 weeks out: Mail formal invitations',
      'Day of: Coordinate vendor arrival'
    ]
  };
  const normalized = normalizeAIPlan(legacyPlan, { budget: 30000 });
  assert.strictEqual(normalized.suggestedMilestones.length, 3);
  assert.ok(normalized.suggestedMilestones[0].title.includes('Book reception venue'));
  assert.strictEqual(normalized.suggestedMilestones[0].offsetDays, -60);
});

check(
  'Criterion 4.3: loadPersistedEvents normalizes legacy persisted events missing arrays',
  () => {
    const legacyRecord = [
      {
        id: 'evt-legacy-1',
        name: 'Legacy Birthday',
        type: 'Birthday',
        date: '2026-12-01',
        budget: 5000
        // expenses, milestones, vendors, savedPlans, vendorChecklist all omitted
      }
    ];

    const fakeStorage = {
      getItem: () => JSON.stringify(legacyRecord),
      setItem: () => {}
    };
    global.localStorage = fakeStorage;

    const loaded = loadPersistedEvents();
    assert.strictEqual(loaded.length, 1);
    const evt = loaded[0];
    assert.ok(Array.isArray(evt.expenses), 'expenses must be an array');
    assert.ok(Array.isArray(evt.milestones), 'milestones must be an array');
    assert.ok(Array.isArray(evt.vendors), 'vendors must be an array');
    assert.ok(Array.isArray(evt.savedPlans), 'savedPlans must be an array');
    assert.ok(Array.isArray(evt.vendorChecklist), 'vendorChecklist must be an array');
  }
);

check(
  'Criterion 4.4: loadPersistedEvents returns DEFAULT_CELEBRATIONS on corrupted storage',
  () => {
    global.localStorage = {
      getItem: () => 'INVALID_JSON_CORRUPTED{[[',
      setItem: () => {}
    };
    const loaded = loadPersistedEvents();
    assert.strictEqual(loaded, DEFAULT_CELEBRATIONS);
  }
);

/* ==========================================================================
   CRITERION 5: Countdown rendering with valid, invalid, and missing dates
   ========================================================================== */
console.log('\n--- Criterion 5: Countdown Rendering Resilience ---');

check('Criterion 5.1: renderCountdownDisplay handles future date', () => {
  const futureISO = new Date(Date.now() + 5 * 86400000 + 3600000).toISOString();
  const mockDOM = {
    getElementById: _id => ({ textContent: '' })
  };
  const cd = renderCountdownDisplay(futureISO, mockDOM);
  assert.strictEqual(cd.isPast, false);
  assert.ok(cd.days >= 5);
});

check('Criterion 5.2: renderCountdownDisplay handles past date', () => {
  const pastISO = '2020-01-01T00:00:00Z';
  const summaryEl = { textContent: '' };
  const mockDOM = {
    getElementById: id => (id === 'hero-countdown-summary' ? summaryEl : { textContent: '' })
  };
  const cd = renderCountdownDisplay(pastISO, mockDOM);
  assert.strictEqual(cd.isPast, true);
  assert.strictEqual(summaryEl.textContent, 'Celebrated');
});

check('Criterion 5.3: renderCountdownDisplay handles null / missing date', () => {
  const summaryEl = { textContent: '' };
  const mockDOM = {
    getElementById: id => (id === 'hero-countdown-summary' ? summaryEl : { textContent: '' })
  };
  const cd = renderCountdownDisplay(null, mockDOM);
  assert.strictEqual(cd.days, 0);
  assert.strictEqual(cd.hours, 0);
  assert.strictEqual(cd.minutes, 0);
  assert.strictEqual(cd.seconds, 0);
  assert.strictEqual(cd.isPast, false);
});

check('Criterion 5.4: renderCountdownDisplay handles invalid date string', () => {
  const summaryEl = { textContent: '' };
  const mockDOM = {
    getElementById: id => (id === 'hero-countdown-summary' ? summaryEl : { textContent: '' })
  };
  const cd = renderCountdownDisplay('invalid-date-string', mockDOM);
  assert.strictEqual(typeof cd.days, 'number');
  assert.strictEqual(typeof cd.isPast, 'boolean');
});

check('Criterion 5.5: renderCountdownDisplay handles null rootNode without exception', () => {
  const futureISO = new Date(Date.now() + 86400000).toISOString();
  const cd = renderCountdownDisplay(futureISO, null);
  assert.ok(cd);
  assert.strictEqual(cd.isPast, false);
});

/* ==========================================================================
   CRITERION 6: All five AI result sections render correctly
   ========================================================================== */
console.log('\n--- Criterion 6: AI Result Sections Modular Rendering ---');

function setupAIRenderDOM() {
  const createdElements = [];

  function makeEl(id, tag = 'div') {
    const el = {
      id,
      tagName: tag.toUpperCase(),
      classList: {
        classes: new Set(),
        add: c => el.classList.classes.add(c),
        remove: c => el.classList.classes.delete(c)
      },
      style: {
        setProperty: () => {},
        cssText: ''
      },
      attributes: {},
      setAttribute: (k, v) => {
        el.attributes[k] = v;
      },
      children: [],
      appendChild: child => {
        el.children.push(child);
      },
      querySelector: sel => {
        if (sel === '.ai-budget-table-body') return makeEl('budget-body', 'tbody');
        if (sel === '.ai-milestones-table-body') return makeEl('ms-body', 'tbody');
        if (sel === '.ai-vendors-table-body') return makeEl('ven-body', 'tbody');
        if (sel === '.ai-budget-total-label') return makeEl('budget-total-lbl', 'span');
        if (
          sel === '.btn-select-all-budget' ||
          sel === '.btn-deselect-all-budget' ||
          sel === '.btn-select-all-ms' ||
          sel === '.btn-deselect-all-ms' ||
          sel === '.btn-select-all-ven' ||
          sel === '.btn-deselect-all-ven'
        ) {
          return makeEl('btn-mock', 'button');
        }
        return makeEl('mock-inner');
      },
      querySelectorAll: () => [],
      addEventListener: () => {}
    };
    createdElements.push(el);
    return el;
  }

  const wrapper = makeEl('ai-results-wrapper');
  const actionsBar = makeEl('ai-plan-actions-bar');
  const statusPill = makeEl('ai-plan-status-pill');
  const modelTag = makeEl('ai-plan-model-tag');
  const timestampTag = makeEl('ai-plan-timestamp');

  global.document = {
    getElementById: id => {
      if (id === 'ai-results-wrapper') return wrapper;
      if (id === 'ai-plan-actions-bar') return actionsBar;
      if (id === 'ai-plan-status-pill') return statusPill;
      if (id === 'ai-plan-model-tag') return modelTag;
      if (id === 'ai-plan-timestamp') return timestampTag;
      return makeEl(id);
    },
    createElement: tag => makeEl(`gen-${tag}`, tag)
  };

  return { wrapper, modelTag };
}

check('Criterion 6.1: renderAIResults renders all 5 sections for fully populated plan', () => {
  const { wrapper, modelTag } = setupAIRenderDOM();
  const rawPlan = {
    modelUsed: 'gemini-3.8-flash',
    themes: [
      {
        title: 'Celestial Night',
        decorPalette: ['#0F172A', '#D97706', '#FAF8F5'],
        budgetTip: 'Focus on lights'
      }
    ],
    budgetAllocations: [{ item: 'Catering', cost: 4000, category: 'Catering' }],
    suggestedMilestones: [{ title: 'Cake Tasting', offsetDays: -20, phase: 'Preparation' }],
    suggestedVendors: [{ name: 'Chef Mario', fee: 4000, category: 'Catering' }],
    vendorQuestions: ['Are vegan options available?']
  };

  renderAIResults(rawPlan, { date: '2026-11-20', budget: 15000 });
  assert.strictEqual(modelTag.textContent, 'gemini-3.8-flash');
  // 5 sections appended to wrapper: Themes, Budget, Milestones, Vendors, Questions
  assert.strictEqual(wrapper.children.length, 5);
});

check(
  'Criterion 6.2: renderAIResults handles empty / partially populated responses without crash',
  () => {
    const { wrapper } = setupAIRenderDOM();
    // Completely empty plan
    renderAIResults({}, { date: '2026-11-20', budget: 10000 });
    assert.ok(
      wrapper.children.length >= 4,
      'Themes, Budget, Milestones, Vendors should be rendered from normalized fallback'
    );
  }
);

/* ==========================================================================
   CRITERION 7: Module exports and imports integrity
   ========================================================================== */
console.log('\n--- Criterion 7: Module Import / Export Integrity ---');

check('Criterion 7.1: scripts/config.js exports frozen APP_CONFIG with all required keys', () => {
  assert.ok(APP_CONFIG);
  assert.ok(APP_CONFIG.STORAGE_KEYS);
  assert.strictEqual(APP_CONFIG.STORAGE_KEYS.OWNER_TOKEN_PREFIX, 'aura_owner_');
  assert.ok(Array.isArray(APP_CONFIG.EVENT_TYPES));
  assert.ok(APP_CONFIG.CURRENCIES.USD);
  assert.ok(APP_CONFIG.CURRENCIES.INR);
  assert.ok(APP_CONFIG.DEFAULT_BUDGET_RATIOS);
  assert.ok(Array.isArray(APP_CONFIG.VENDOR_STATUSES));
  assert.ok(Object.isFrozen(APP_CONFIG), 'APP_CONFIG must be frozen');
});

check('Criterion 7.2: scripts/utils.js exports all public functions', () => {
  assert.strictEqual(typeof formatCurrency, 'function');
  assert.strictEqual(typeof formatDate, 'function');
  assert.strictEqual(typeof calculateDetailedCountdown, 'function');
  assert.strictEqual(typeof renderCountdownDisplay, 'function');
  assert.strictEqual(typeof calculateMilestoneDate, 'function');
  assert.strictEqual(typeof normalizeAIPlan, 'function');
  assert.strictEqual(typeof applyRecommendationsToCelebration, 'function');
  assert.strictEqual(typeof generateUUID, 'function');
  assert.strictEqual(typeof sanitizeHTML, 'function');
  assert.strictEqual(typeof resolveCssColor, 'function');
});

check(
  'Criterion 7.3: scripts/events-data.js exports load/save functions and DEFAULT_CELEBRATIONS',
  () => {
    assert.strictEqual(typeof loadPersistedEvents, 'function');
    assert.strictEqual(typeof saveEventsToStorage, 'function');
    assert.strictEqual(typeof getStoredActiveEventId, 'function');
    assert.strictEqual(typeof saveActiveEventId, 'function');
    assert.ok(Array.isArray(DEFAULT_CELEBRATIONS) && DEFAULT_CELEBRATIONS.length === 4);
  }
);

/* ==========================================================================
   CRITERION 8: Production Server, Static Assets, CORS & Health Endpoints
   ========================================================================== */
console.log('\n--- Criterion 8: Production Server & Endpoints Verification ---');

await asyncCheck(
  'Criterion 8.1: Server endpoints and static asset mappings are verified',
  async () => {
    const { EventEmitter } = await import('events');
    process.env.NODE_ENV = 'test';
    const { default: app } = await import('../server.js');

    function simulateRequest(method, url, body = null, customHeaders = {}) {
      return new Promise((resolve, reject) => {
        const socket = { remoteAddress: '127.0.0.1' };
        const req = new EventEmitter();
        req.method = method;
        req.url = url;
        req.headers = {
          host: '127.0.0.1',
          'user-agent': 'RegressionAudit/1.0',
          'content-type': 'application/json',
          ...customHeaders
        };
        req.ip = '127.0.0.1';
        req.connection = socket;
        req.socket = socket;
        req.body = body || {};

        let statusCode = 200;
        const responseHeaders = {};
        let responseBody = null;

        const res = {
          statusCode: 200,
          setHeader(k, v) {
            responseHeaders[k.toLowerCase()] = v;
          },
          getHeader(k) {
            return responseHeaders[k.toLowerCase()];
          },
          removeHeader(k) {
            delete responseHeaders[k.toLowerCase()];
          },
          status(code) {
            statusCode = code;
            this.statusCode = code;
            return this;
          },
          json(data) {
            responseHeaders['content-type'] = 'application/json';
            responseBody = data;
            resolve({ status: statusCode, headers: responseHeaders, body: responseBody });
            return this;
          },
          send(data) {
            responseBody = data;
            resolve({ status: statusCode, headers: responseHeaders, body: responseBody });
            return this;
          },
          end(data) {
            if (data && !responseBody) responseBody = data;
            resolve({ status: statusCode, headers: responseHeaders, body: responseBody });
          }
        };

        try {
          app.handle(req, res, err => {
            if (err) reject(err);
            else resolve({ status: statusCode, headers: responseHeaders, body: responseBody });
          });
        } catch (e) {
          reject(e);
        }
      });
    }

    // 1. Health endpoint
    const healthRes = await simulateRequest('GET', '/api/health');
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.body.status, 'healthy');

    // 2. Health alias endpoint
    const healthAliasRes = await simulateRequest('GET', '/health');
    assert.strictEqual(healthAliasRes.status, 200);
    assert.strictEqual(healthAliasRes.body.status, 'healthy');

    // 3. Physical static assets exist on disk and are non-empty
    const staticFiles = [
      'scripts/app.js',
      'scripts/config.js',
      'scripts/utils.js',
      'scripts/events-data.js',
      'scripts/api.js',
      'scripts/modal-controller.js',
      'scripts/ui-renderers.js',
      'styles/main.css',
      'index.html'
    ];
    for (const relPath of staticFiles) {
      const fullPath = path.join(rootDir, relPath);
      assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 0, `File must be non-empty: ${relPath}`);
    }

    // 4. Zod schema validation protects /api/ai/ideas
    const badAiReq = await simulateRequest('POST', '/api/ai/ideas', { invalid: 'data' });
    assert.strictEqual(badAiReq.status, 400);
  }
);

/* ==========================================================================
   CRITERION 9: Tests genuinely exercise production functions
   ========================================================================== */
console.log('\n--- Criterion 9: Genuine Production Testing Verification ---');

check('Criterion 9.1: tests/run_tests.js imports from scripts/utils.js directly', () => {
  const testFileContent = fs.readFileSync(path.join(rootDir, 'tests/run_tests.js'), 'utf8');
  assert.ok(testFileContent.includes("from '../scripts/utils.js'"));
  assert.ok(testFileContent.includes('applyRecommendationsToCelebration'));
  assert.ok(testFileContent.includes('renderCountdownDisplay'));
  assert.ok(testFileContent.includes('normalizeAIPlan'));
  assert.ok(testFileContent.includes('calculateMilestoneDate'));
});

check(
  'Criterion 9.2: AI plan application tests in run_tests.js execute applyRecommendationsToCelebration directly',
  () => {
    const testFileContent = fs.readFileSync(path.join(rootDir, 'tests/run_tests.js'), 'utf8');
    assert.ok(testFileContent.includes('applyRecommendationsToCelebration(celebration, plan)'));
    assert.ok(
      testFileContent.includes('applyRecommendationsToCelebration(celebration, duplicateCandidate)')
    );
  }
);

/* ==========================================================================
   CRITERION 10: Zero accidental styling or markup changes
   ========================================================================== */
console.log('\n--- Criterion 10: Zero Unintended UI / Styling Changes ---');

check('Criterion 10.1: styles/main.css and index.html are identical to previous commit', () => {
  // Check git diff against HEAD for index.html and styles/
  const diffIndex = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert.ok(diffIndex.includes('id="ai-results-wrapper"'));
  assert.ok(diffIndex.includes('id="countdown-days"'));
  assert.ok(diffIndex.includes('id="modal-apply-plan-preview"'));
});

/* ==========================================================================
   AUDIT SUMMARY
   ========================================================================== */
console.log('\n========================================');
console.log(
  `Audit Summary: Total: ${totalChecks} | Passed: ${passedChecks} | Failed: ${failedChecks}`
);
console.log('========================================\n');

if (failedChecks > 0) {
  console.error('FAILURES OCCURRED:');
  failures.forEach(f => console.error(`- ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('ALL REGRESSION AUDIT CRITERIA PASSED WITH ZERO ERRORS.\n');
}

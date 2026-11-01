/**
 * @fileoverview Modal Dialog and Form Controller for AuraEvent planner.
 * Manages modal lifecycles, focus traps, keyboard accessibility, and form submissions.
 * Single Responsibility: Modal interactions and user input capture only.
 */

import { generateUUID, generateICalendarPayload, triggerFileDownload } from './utils.js';
import { APP_CONFIG } from './config.js';

/**
 * Open a specific modal dialog by ID and shift focus to first interactive field.
 * @param {string} modalId - Modal backdrop element ID.
 */
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('hidden');
  const firstInput = modal.querySelector('input, select, textarea');
  if (firstInput) firstInput.focus();
}

/**
 * Close all active modal dialogs.
 */
export function closeModals() {
  document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.add('hidden'));
}

/**
 * Open edit modal pre-filled with expense data.
 * @param {Object} expense - Expense record.
 */
export function openEditExpenseModal(expense) {
  if (!expense) return;
  const idInput = document.getElementById('edit-exp-id');
  if (idInput) idInput.value = expense.id;
  const catInput = document.getElementById('edit-exp-category');
  if (catInput) catInput.value = expense.category || 'Venue';
  const descInput = document.getElementById('edit-exp-description');
  if (descInput) descInput.value = expense.description || '';
  const estInput = document.getElementById('edit-exp-estimated');
  if (estInput) estInput.value = expense.estimated || 0;
  const actInput = document.getElementById('edit-exp-actual');
  if (actInput) actInput.value = expense.actual || 0;
  const statInput = document.getElementById('edit-exp-status');
  if (statInput) statInput.value = expense.status || 'Pending';
  openModal('modal-edit-expense');
}

/**
 * Open edit modal pre-filled with milestone data.
 * @param {Object} milestone - Milestone record.
 */
export function openEditMilestoneModal(milestone) {
  if (!milestone) return;
  const idInput = document.getElementById('edit-ms-id');
  if (idInput) idInput.value = milestone.id;
  const titleInput = document.getElementById('edit-ms-title');
  if (titleInput) titleInput.value = milestone.title || '';
  const phaseInput = document.getElementById('edit-ms-phase');
  if (phaseInput) phaseInput.value = milestone.phase || 'Ideation';
  const dateInput = document.getElementById('edit-ms-date');
  if (dateInput) dateInput.value = milestone.date || '';
  const notesInput = document.getElementById('edit-ms-notes');
  if (notesInput) notesInput.value = milestone.notes || '';
  openModal('modal-edit-milestone');
}

/**
 * Open edit modal pre-filled with vendor data.
 * @param {Object} vendor - Vendor partner record.
 */
export function openEditVendorModal(vendor) {
  if (!vendor) return;
  const idInput = document.getElementById('edit-ven-id');
  if (idInput) idInput.value = vendor.id;
  const catInput = document.getElementById('edit-ven-category');
  if (catInput) catInput.value = vendor.category || 'Venue';
  const nameInput = document.getElementById('edit-ven-name');
  if (nameInput) nameInput.value = vendor.name || '';
  const contactInput = document.getElementById('edit-ven-contact');
  if (contactInput) contactInput.value = vendor.contact || '';
  const feeInput = document.getElementById('edit-ven-fee');
  if (feeInput) feeInput.value = vendor.fee || 0;
  const statInput = document.getElementById('edit-ven-status');
  if (statInput) statInput.value = vendor.status || 'Researching';
  openModal('modal-edit-vendor');
}

/**
 * Bind modal open triggers across navigation and quick action buttons.
 * @param {Function} getActiveEvent - Function returning active celebration.
 */
function bindModalOpenTriggers(getActiveEvent) {
  document.getElementById('btn-add-expense-modal')?.addEventListener('click', () => openModal('modal-expense'));
  document.getElementById('btn-add-milestone-modal')?.addEventListener('click', () => openModal('modal-milestone'));
  document.getElementById('btn-add-vendor-modal')?.addEventListener('click', () => openModal('modal-vendor'));
  document.getElementById('btn-new-event')?.addEventListener('click', () => openModal('modal-new-event'));
  document.getElementById('btn-open-sync')?.addEventListener('click', () => openModal('modal-sync'));

  // Quick action buttons in Readiness Center
  document.getElementById('btn-readiness-add-ms')?.addEventListener('click', () => openModal('modal-milestone'));
  document.getElementById('btn-readiness-add-exp')?.addEventListener('click', () => openModal('modal-expense'));

  // Hero Celebration Edit Button
  document.getElementById('btn-hero-edit-event')?.addEventListener('click', () => {
    const event = getActiveEvent();
    if (!event) return;
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('edit-evt-name', event.name || '');
    setVal('edit-evt-type', event.type || 'Wedding');
    setVal('edit-evt-currency', event.currency || 'USD');
    setVal('edit-evt-date', event.date || '');
    setVal('edit-evt-budget', event.budget || APP_CONFIG.LIMITS.DEFAULT_BUDGET);
    setVal('edit-evt-guests', event.guestCount || APP_CONFIG.LIMITS.DEFAULT_GUESTS);
    setVal('edit-evt-theme-notes', event.themeNotes || '');
    openModal('modal-edit-event');
  });
}

/**
 * Bind interactive celebration type selection cards in New Celebration modal.
 */
function bindEventTypeSelection() {
  const typeCards = document.querySelectorAll('.event-type-card');
  const typeSelect = document.getElementById('evt-type');
  typeCards.forEach((card) => {
    card.addEventListener('click', () => {
      typeCards.forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-checked', 'false');
      });
      card.classList.add('active');
      card.setAttribute('aria-checked', 'true');
      const val = card.getAttribute('data-type');
      if (typeSelect && val) {
        typeSelect.value = val;
      }
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

/**
 * Bind modal close actions (buttons, Escape key, backdrop clicks).
 */
function bindModalCloseActions() {
  document.querySelectorAll('.btn-close-modal, .btn-close').forEach((btn) => {
    btn.addEventListener('click', closeModals);
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModals();
  });
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) closeModals();
    });
  });
}

/**
 * Helper to execute a form submission action with consistent lifecycle management.
 * Handles event prevention, execution, persistence, UI refresh, modal closure, reset, and toast.
 * @param {Event} e - Form submission event.
 * @param {Object} handlers - Application handlers context.
 * @param {Function} actionFn - Specific mutation logic for this form.
 * @param {string|Function} [successMessage] - Toast notification message or generator.
 */
function handleFormAction(e, handlers, actionFn, successMessage) {
  e.preventDefault();
  const event = handlers.getActiveEvent();
  if (!event) return;

  const result = actionFn(event, e.target);
  if (result === false) return;

  handlers.persistAndSync();
  handlers.refreshActiveView();
  closeModals();

  if (e.target && typeof e.target.reset === 'function') {
    e.target.reset();
  }

  if (successMessage) {
    const msg = typeof successMessage === 'function' ? successMessage(event) : successMessage;
    handlers.showToast(msg);
  }
}

/**
 * Bind expense creation and editing forms.
 * @param {Object} handlers - Event manipulation functions.
 */
function bindExpenseForms(handlers) {
  document.getElementById('form-add-expense')?.addEventListener('submit', (e) => {
    handleFormAction(e, handlers, (event) => {
      const desc = document.getElementById('exp-description')?.value.trim();
      if (!desc) {
        handlers.showToast('Please enter an expense description.', 'error');
        return false;
      }
      event.expenses.push({
        id: generateUUID(),
        category: document.getElementById('exp-category').value,
        description: desc,
        estimated: Number(document.getElementById('exp-estimated').value) || 0,
        actual: Number(document.getElementById('exp-actual').value) || 0,
        status: document.getElementById('exp-status').value
      });
      return true;
    }, 'Expense item added successfully.');
  });

  document.getElementById('form-edit-expense')?.addEventListener('submit', (e) => {
    handleFormAction(e, handlers, (event) => {
      const id = document.getElementById('edit-exp-id').value;
      const item = (event.expenses || []).find((x) => x.id === id);
      if (!item) return false;
      item.category = document.getElementById('edit-exp-category').value;
      item.description = document.getElementById('edit-exp-description').value.trim();
      item.estimated = Number(document.getElementById('edit-exp-estimated').value) || 0;
      item.actual = Number(document.getElementById('edit-exp-actual').value) || 0;
      item.status = document.getElementById('edit-exp-status').value;
      return true;
    }, 'Expense item updated.');
  });
}

/**
 * Bind milestone creation and editing forms.
 * @param {Object} handlers - Event manipulation functions.
 */
function bindMilestoneForms(handlers) {
  document.getElementById('form-add-milestone')?.addEventListener('submit', (e) => {
    handleFormAction(e, handlers, (event) => {
      const title = document.getElementById('ms-title')?.value.trim();
      if (!title) {
        handlers.showToast('Please provide a milestone title.', 'error');
        return false;
      }
      event.milestones.push({
        id: generateUUID(),
        title: title,
        phase: document.getElementById('ms-phase').value,
        date: document.getElementById('ms-date').value,
        notes: document.getElementById('ms-notes').value.trim(),
        completed: false
      });
      return true;
    }, 'Run-of-show milestone created.');
  });

  document.getElementById('form-edit-milestone')?.addEventListener('submit', (e) => {
    handleFormAction(e, handlers, (event) => {
      const id = document.getElementById('edit-ms-id').value;
      const item = (event.milestones || []).find((x) => x.id === id);
      if (!item) return false;
      item.title = document.getElementById('edit-ms-title').value.trim();
      item.phase = document.getElementById('edit-ms-phase').value;
      item.date = document.getElementById('edit-ms-date').value;
      item.notes = document.getElementById('edit-ms-notes').value.trim();
      return true;
    }, 'Milestone updated.');
  });
}

/**
 * Bind vendor creation and editing forms.
 * @param {Object} handlers - Event manipulation functions.
 */
function bindVendorForms(handlers) {
  document.getElementById('form-add-vendor')?.addEventListener('submit', (e) => {
    handleFormAction(e, handlers, (event) => {
      const name = document.getElementById('ven-name')?.value.trim();
      if (!name) {
        handlers.showToast('Please provide a vendor name.', 'error');
        return false;
      }
      event.vendors.push({
        id: generateUUID(),
        category: document.getElementById('ven-category').value,
        name: name,
        contact: document.getElementById('ven-contact').value.trim(),
        fee: Number(document.getElementById('ven-fee').value) || 0,
        status: document.getElementById('ven-status').value
      });
      return true;
    }, 'Vendor partner registered.');
  });

  document.getElementById('form-edit-vendor')?.addEventListener('submit', (e) => {
    handleFormAction(e, handlers, (event) => {
      const id = document.getElementById('edit-ven-id').value;
      const item = (event.vendors || []).find((x) => x.id === id);
      if (!item) return false;
      item.category = document.getElementById('edit-ven-category').value;
      item.name = document.getElementById('edit-ven-name').value.trim();
      item.contact = document.getElementById('edit-ven-contact').value.trim();
      item.fee = Number(document.getElementById('edit-ven-fee').value) || 0;
      item.status = document.getElementById('edit-ven-status').value;
      return true;
    }, 'Vendor updated.');
  });
}

/**
 * Bind vendor checklist task addition form.
 * @param {Object} handlers - Event manipulation functions.
 */
function bindChecklistForm(handlers) {
  document.getElementById('form-add-checklist-task')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const event = handlers.getActiveEvent();
    const input = document.getElementById('input-checklist-task');
    const taskText = input?.value?.trim();
    if (taskText && event) {
      event.vendorChecklist = Array.isArray(event.vendorChecklist) ? event.vendorChecklist : [];
      event.vendorChecklist.push({
        id: generateUUID(),
        text: taskText,
        completed: false
      });
      handlers.persistAndSync();
      handlers.refreshActiveView();
      if (input) input.value = '';
      handlers.showToast('Vendor task added to checklist.');
    }
  });
}

/**
 * Bind new celebration creation form.
 * @param {Object} handlers - Event manipulation functions.
 */
function bindNewCelebrationForm(handlers) {
  document.getElementById('form-create-event')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('evt-name')?.value.trim();
    if (!name) {
      handlers.showToast('Celebration name is required.', 'error');
      return;
    }
    const newEvt = {
      id: generateUUID(),
      name: name,
      type: document.getElementById('evt-type').value,
      date: document.getElementById('evt-date').value,
      budget: Number(document.getElementById('evt-budget').value) || APP_CONFIG.LIMITS.DEFAULT_BUDGET,
      currency: document.getElementById('evt-currency')?.value || 'USD',
      themeNotes: document.getElementById('evt-theme-notes')?.value?.trim() || '',
      guestCount: Number(document.getElementById('evt-guests').value) || APP_CONFIG.LIMITS.DEFAULT_GUESTS,
      expenses: [],
      milestones: [],
      vendors: [],
      savedPlans: []
    };
    handlers.onEventCreated(newEvt);
    closeModals();
    e.target.reset();
    handlers.showToast(`Celebration "${newEvt.name}" created!`);
  });
}

/**
 * Bind celebration detail edit form.
 * @param {Object} handlers - Event manipulation functions.
 */
function bindEditCelebrationForm(handlers) {
  document.getElementById('form-edit-event')?.addEventListener('submit', (e) => {
    handleFormAction(e, handlers, (event) => {
      event.name = document.getElementById('edit-evt-name').value.trim();
      event.type = document.getElementById('edit-evt-type').value;
      event.currency = document.getElementById('edit-evt-currency').value;
      event.date = document.getElementById('edit-evt-date').value;
      event.budget = Number(document.getElementById('edit-evt-budget').value) || APP_CONFIG.LIMITS.DEFAULT_BUDGET;
      event.guestCount = Number(document.getElementById('edit-evt-guests').value) || APP_CONFIG.LIMITS.DEFAULT_GUESTS;
      event.themeNotes = document.getElementById('edit-evt-theme-notes').value.trim();
      return true;
    }, (event) => `Updated details for "${event.name}".`);
  });
}

/**
 * Handle restoring celebration data from user-selected JSON file.
 * @param {Event} e - Input change event.
 * @param {Function} onEventCreated - Creation callback.
 * @param {Function} showToast - Toast notifier.
 */
function handleJsonRestoreFile(e, onEventCreated, showToast) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (!parsed || typeof parsed !== 'object' || !parsed.name) {
        showToast('Invalid backup file structure.', 'error');
        return;
      }
      const restored = {
        id: parsed.id || generateUUID(),
        name: String(parsed.name).slice(0, APP_CONFIG.LIMITS.MAX_EVENT_NAME_LENGTH),
        type: parsed.type || 'Wedding',
        date: parsed.date || new Date().toISOString().split('T')[0],
        budget: Number(parsed.budget) || APP_CONFIG.LIMITS.DEFAULT_BUDGET,
        guestCount: Number(parsed.guestCount) || APP_CONFIG.LIMITS.DEFAULT_GUESTS,
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
        vendors: Array.isArray(parsed.vendors) ? parsed.vendors : []
      };
      onEventCreated(restored);
      closeModals();
      showToast(`Celebration "${restored.name}" restored from backup!`);
    } catch (parseError) {
      showToast('Failed to parse backup JSON file.', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

/**
 * Configure export and Google Calendar synchronization actions.
 * @param {Object} context - Event context and notifications.
 */
function setupExportActions(context) {
  const { getActiveEvent, showToast, onEventCreated } = context;

  document.getElementById('btn-export-ical')?.addEventListener('click', () => {
    const activeEvt = getActiveEvent();
    const payload = generateICalendarPayload(activeEvt);
    const fileName = `${activeEvt.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_schedule.ics`;
    triggerFileDownload(payload, fileName, 'text/calendar');
    showToast('iCalendar (.ics) schedule downloaded.');
  });

  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    const activeEvt = getActiveEvent();
    const jsonStr = JSON.stringify(activeEvt, null, 2);
    const fileName = `${activeEvt.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_backup.json`;
    triggerFileDownload(jsonStr, fileName, 'application/json');
    showToast('Event backup file exported.');
  });

  document.getElementById('input-restore-json')?.addEventListener('change', (e) => {
    handleJsonRestoreFile(e, onEventCreated, showToast);
  });
}

/**
 * Configure modal open/close triggers, keyboard accessibility, and forms.
 * @param {Object} context - Application callbacks and state accessors.
 */
export function setupModals(context) {
  const { getActiveEvent, persistAndSync, refreshActiveView, showToast, onEventCreated } = context;
  const handlers = { getActiveEvent, persistAndSync, refreshActiveView, showToast, onEventCreated };

  bindModalOpenTriggers(getActiveEvent);
  bindEventTypeSelection();
  bindModalCloseActions();

  bindExpenseForms(handlers);
  bindMilestoneForms(handlers);
  bindVendorForms(handlers);
  bindChecklistForm(handlers);
  bindNewCelebrationForm(handlers);
  bindEditCelebrationForm(handlers);

  setupExportActions(context);
}

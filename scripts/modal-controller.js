/**
 * @fileoverview Modal Dialog and Form Controller for AuraEvent planner.
 * Manages modal lifecycles, focus traps, keyboard accessibility, and form submissions.
 * Single Responsibility: Modal interactions and user input capture only.
 */

import { generateUUID, generateICalendarPayload, triggerFileDownload } from './utils.js';

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
 * Configure modal open/close triggers and keyboard accessibility.
 * @param {Object} context - Application callbacks and state accessors.
 */
export function setupModals(context) {
  const { getActiveEvent, persistAndSync, refreshActiveView, showToast, onEventCreated } = context;

  document.getElementById('btn-add-expense-modal')?.addEventListener('click', () => openModal('modal-expense'));
  document.getElementById('btn-add-milestone-modal')?.addEventListener('click', () => openModal('modal-milestone'));
  document.getElementById('btn-add-vendor-modal')?.addEventListener('click', () => openModal('modal-vendor'));
  document.getElementById('btn-new-event')?.addEventListener('click', () => openModal('modal-new-event'));
  document.getElementById('btn-open-sync')?.addEventListener('click', () => openModal('modal-sync'));

  // Readiness Center Quick Actions
  document.getElementById('btn-readiness-add-ms')?.addEventListener('click', () => openModal('modal-milestone'));
  document.getElementById('btn-readiness-add-exp')?.addEventListener('click', () => openModal('modal-expense'));

  // Edit Active Celebration Action
  document.getElementById('btn-hero-edit-event')?.addEventListener('click', () => {
    const event = getActiveEvent();
    if (!event) return;
    const nameEl = document.getElementById('edit-evt-name');
    if (nameEl) nameEl.value = event.name || '';
    const typeEl = document.getElementById('edit-evt-type');
    if (typeEl) typeEl.value = event.type || 'Wedding';
    const currEl = document.getElementById('edit-evt-currency');
    if (currEl) currEl.value = event.currency || 'USD';
    const dateEl = document.getElementById('edit-evt-date');
    if (dateEl) dateEl.value = event.date || '';
    const budEl = document.getElementById('edit-evt-budget');
    if (budEl) budEl.value = event.budget || 10000;
    const gstEl = document.getElementById('edit-evt-guests');
    if (gstEl) gstEl.value = event.guestCount || 50;
    const notesEl = document.getElementById('edit-evt-theme-notes');
    if (notesEl) notesEl.value = event.themeNotes || '';
    openModal('modal-edit-event');
  });

  // Interactive Visual Event Type Selection Cards in New Celebration Modal
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

  document.querySelectorAll('.btn-close-modal, .btn-close').forEach((btn) => {
    btn.addEventListener('click', closeModals);
  });

  // Close on Escape key or backdrop click
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModals();
  });
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) closeModals();
    });
  });

  setupFormSubmissions({ getActiveEvent, persistAndSync, refreshActiveView, showToast, onEventCreated });
  setupExportActions({ getActiveEvent, showToast, onEventCreated });
}

/**
 * Attach submission handlers to modal forms.
 * @param {Object} handlers - Event manipulation functions.
 */
function setupFormSubmissions(handlers) {
  const { getActiveEvent, persistAndSync, refreshActiveView, showToast, onEventCreated } = handlers;

  // Add Expense Form
  document.getElementById('form-add-expense')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const event = getActiveEvent();
    const newExpense = {
      id: generateUUID(),
      category: document.getElementById('exp-category').value,
      description: document.getElementById('exp-description').value.trim(),
      estimated: Number(document.getElementById('exp-estimated').value) || 0,
      actual: Number(document.getElementById('exp-actual').value) || 0,
      status: document.getElementById('exp-status').value
    };
    event.expenses.push(newExpense);
    persistAndSync();
    refreshActiveView();
    closeModals();
    e.target.reset();
    showToast('Expense item added successfully.');
  });

  // Add Milestone Form
  document.getElementById('form-add-milestone')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const event = getActiveEvent();
    const newMilestone = {
      id: generateUUID(),
      title: document.getElementById('ms-title').value.trim(),
      phase: document.getElementById('ms-phase').value,
      date: document.getElementById('ms-date').value,
      notes: document.getElementById('ms-notes').value.trim(),
      completed: false
    };
    event.milestones.push(newMilestone);
    persistAndSync();
    refreshActiveView();
    closeModals();
    e.target.reset();
    showToast('Run-of-show milestone created.');
  });

  // Add Vendor Form
  document.getElementById('form-add-vendor')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const event = getActiveEvent();
    const newVendor = {
      id: generateUUID(),
      category: document.getElementById('ven-category').value,
      name: document.getElementById('ven-name').value.trim(),
      contact: document.getElementById('ven-contact').value.trim(),
      fee: Number(document.getElementById('ven-fee').value) || 0,
      status: document.getElementById('ven-status').value
    };
    event.vendors.push(newVendor);
    persistAndSync();
    refreshActiveView();
    closeModals();
    e.target.reset();
    showToast('Vendor partner registered.');
  });

  // Create New Celebration Form
  document.getElementById('form-create-event')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const currency = document.getElementById('evt-currency')?.value || 'USD';
    const themeNotes = document.getElementById('evt-theme-notes')?.value?.trim() || '';
    const newEvt = {
      id: generateUUID(),
      name: document.getElementById('evt-name').value.trim(),
      type: document.getElementById('evt-type').value,
      date: document.getElementById('evt-date').value,
      budget: Number(document.getElementById('evt-budget').value) || 10000,
      currency: currency,
      themeNotes: themeNotes,
      guestCount: Number(document.getElementById('evt-guests').value) || 50,
      expenses: [],
      milestones: [],
      vendors: [],
      savedPlans: []
    };
    onEventCreated(newEvt);
    closeModals();
    e.target.reset();
    showToast(`Celebration "${newEvt.name}" created!`);
  });

  // Edit Active Celebration Form
  document.getElementById('form-edit-event')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const event = getActiveEvent();
    if (!event) return;
    event.name = document.getElementById('edit-evt-name').value.trim();
    event.type = document.getElementById('edit-evt-type').value;
    event.currency = document.getElementById('edit-evt-currency').value;
    event.date = document.getElementById('edit-evt-date').value;
    event.budget = Number(document.getElementById('edit-evt-budget').value) || 10000;
    event.guestCount = Number(document.getElementById('edit-evt-guests').value) || 50;
    event.themeNotes = document.getElementById('edit-evt-theme-notes').value.trim();
    persistAndSync();
    refreshActiveView();
    closeModals();
    showToast(`Updated details for "${event.name}".`);
  });

  // Edit Expense Form
  document.getElementById('form-edit-expense')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const event = getActiveEvent();
    const id = document.getElementById('edit-exp-id').value;
    const item = (event.expenses || []).find((x) => x.id === id);
    if (item) {
      item.category = document.getElementById('edit-exp-category').value;
      item.description = document.getElementById('edit-exp-description').value.trim();
      item.estimated = Number(document.getElementById('edit-exp-estimated').value) || 0;
      item.actual = Number(document.getElementById('edit-exp-actual').value) || 0;
      item.status = document.getElementById('edit-exp-status').value;
      persistAndSync();
      refreshActiveView();
      closeModals();
      showToast('Expense item updated.');
    }
  });

  // Edit Milestone Form
  document.getElementById('form-edit-milestone')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const event = getActiveEvent();
    const id = document.getElementById('edit-ms-id').value;
    const item = (event.milestones || []).find((x) => x.id === id);
    if (item) {
      item.title = document.getElementById('edit-ms-title').value.trim();
      item.phase = document.getElementById('edit-ms-phase').value;
      item.date = document.getElementById('edit-ms-date').value;
      item.notes = document.getElementById('edit-ms-notes').value.trim();
      persistAndSync();
      refreshActiveView();
      closeModals();
      showToast('Milestone updated.');
    }
  });

  // Edit Vendor Form
  document.getElementById('form-edit-vendor')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const event = getActiveEvent();
    const id = document.getElementById('edit-ven-id').value;
    const item = (event.vendors || []).find((x) => x.id === id);
    if (item) {
      item.category = document.getElementById('edit-ven-category').value;
      item.name = document.getElementById('edit-ven-name').value.trim();
      item.contact = document.getElementById('edit-ven-contact').value.trim();
      item.fee = Number(document.getElementById('edit-ven-fee').value) || 0;
      item.status = document.getElementById('edit-ven-status').value;
      persistAndSync();
      refreshActiveView();
      closeModals();
      showToast('Vendor updated.');
    }
  });

  // Add Vendor Checklist Task Form
  document.getElementById('form-add-checklist-task')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const event = getActiveEvent();
    const input = document.getElementById('input-checklist-task');
    const taskText = input?.value?.trim();
    if (taskText) {
      event.vendorChecklist = Array.isArray(event.vendorChecklist) ? event.vendorChecklist : [];
      event.vendorChecklist.push({
        id: generateUUID(),
        text: taskText,
        completed: false
      });
      persistAndSync();
      refreshActiveView();
      if (input) input.value = '';
      showToast('Vendor task added to checklist.');
    }
  });
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
          name: String(parsed.name).slice(0, 100),
          type: parsed.type || 'Wedding',
          date: parsed.date || new Date().toISOString().split('T')[0],
          budget: Number(parsed.budget) || 10000,
          guestCount: Number(parsed.guestCount) || 50,
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
          milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
          vendors: Array.isArray(parsed.vendors) ? parsed.vendors : []
        };
        onEventCreated(restored);
        closeModals();
        showToast(`Celebration "${restored.name}" restored from backup!`);
      } catch {
        showToast('Failed to parse backup JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}


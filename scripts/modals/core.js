/**
 * @fileoverview Core modal lifecycles, focus management, and accessibility bindings.
 * Handles opening, closing, prefilling edit dialogs, and event type card selection.
 */

import { APP_CONFIG } from '../config.js';

/**
 * Opens a specific modal dialog by ID and shifts focus to first interactive field.
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
 * Closes all active modal dialogs.
 */
export function closeModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
}

/**
 * Opens edit modal pre-filled with expense data.
 * @param {import('../types.js').Expense} expense - Expense record.
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
 * Opens edit modal pre-filled with milestone data.
 * @param {import('../types.js').Milestone} milestone - Milestone record.
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
 * Opens edit modal pre-filled with vendor data.
 * @param {import('../types.js').Vendor} vendor - Vendor partner record.
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
 * Binds modal open triggers across navigation and quick action buttons.
 * @param {Function} getActiveEvent - Function returning active celebration.
 */
export function bindModalOpenTriggers(getActiveEvent) {
  document.getElementById('btn-add-expense-modal')?.addEventListener('click', () => {
    openModal('modal-expense');
  });
  document.getElementById('btn-add-milestone-modal')?.addEventListener('click', () => {
    openModal('modal-milestone');
  });
  document.getElementById('btn-add-vendor-modal')?.addEventListener('click', () => {
    openModal('modal-vendor');
  });
  document.getElementById('btn-new-event')?.addEventListener('click', () => {
    openModal('modal-new-event');
  });
  document.getElementById('btn-open-sync')?.addEventListener('click', () => {
    openModal('modal-sync');
  });

  // Quick action buttons in Readiness Center
  document.getElementById('btn-readiness-add-ms')?.addEventListener('click', () => {
    openModal('modal-milestone');
  });
  document.getElementById('btn-readiness-add-exp')?.addEventListener('click', () => {
    openModal('modal-expense');
  });

  // Hero Celebration Edit Button
  document.getElementById('btn-hero-edit-event')?.addEventListener('click', () => {
    const event = getActiveEvent();
    if (!event) return;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
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
 * Binds interactive celebration type selection cards in New Celebration modal.
 */
export function bindEventTypeSelection() {
  const typeCards = document.querySelectorAll('.event-type-card');
  const typeSelect = document.getElementById('evt-type');
  typeCards.forEach(card => {
    card.addEventListener('click', () => {
      typeCards.forEach(c => {
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
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

/**
 * Binds modal close actions (buttons, Escape key, backdrop clicks).
 */
export function bindModalCloseActions() {
  document.querySelectorAll('.btn-close-modal, .btn-close').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModals();
  });
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) closeModals();
    });
  });
}


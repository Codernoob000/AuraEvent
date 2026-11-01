/**
 * @fileoverview Celebration creation and editing modal form bindings.
 */

import { generateUUID } from '../utils.js';
import { APP_CONFIG } from '../config.js';
import { closeModals } from './core.js';
import { handleFormAction } from './helpers.js';

/**
 * Binds new celebration creation form.
 * @param {Object} handlers - Event manipulation functions.
 */
export function bindNewCelebrationForm(handlers) {
  document.getElementById('form-create-event')?.addEventListener('submit', e => {
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
      budget:
        Number(document.getElementById('evt-budget').value) || APP_CONFIG.LIMITS.DEFAULT_BUDGET,
      currency: document.getElementById('evt-currency')?.value || 'USD',
      themeNotes: document.getElementById('evt-theme-notes')?.value?.trim() || '',
      guestCount:
        Number(document.getElementById('evt-guests').value) || APP_CONFIG.LIMITS.DEFAULT_GUESTS,
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
 * Binds celebration detail edit form.
 * @param {Object} handlers - Event manipulation functions.
 */
export function bindEditCelebrationForm(handlers) {
  document.getElementById('form-edit-event')?.addEventListener('submit', e => {
    handleFormAction(
      e,
      handlers,
      event => {
        event.name = document.getElementById('edit-evt-name').value.trim();
        event.type = document.getElementById('edit-evt-type').value;
        event.currency = document.getElementById('edit-evt-currency').value;
        event.date = document.getElementById('edit-evt-date').value;
        event.budget =
          Number(document.getElementById('edit-evt-budget').value) ||
          APP_CONFIG.LIMITS.DEFAULT_BUDGET;
        event.guestCount =
          Number(document.getElementById('edit-evt-guests').value) ||
          APP_CONFIG.LIMITS.DEFAULT_GUESTS;
        event.themeNotes = document.getElementById('edit-evt-theme-notes').value.trim();
        return true;
      },
      event => `Updated details for "${event.name}".`
    );
  });
}

/**
 * @fileoverview Form action lifecycle execution helpers.
 * Handles preventDefault, mutation, persistence, UI refresh, and notifications.
 */

import { closeModals } from './core.js';

/**
 * Executes a form submission action with consistent lifecycle management.
 * Handles event prevention, execution, persistence, UI refresh, modal closure, reset, and toast.
 * @param {Event} e - Form submission event.
 * @param {Object} handlers - Application handlers context.
 * @param {Function} handlers.getActiveEvent - Getter for active event.
 * @param {Function} handlers.persistAndSync - Persistence callback.
 * @param {Function} handlers.refreshActiveView - View refresh callback.
 * @param {Function} handlers.showToast - Toast notifier.
 * @param {Function} actionFn - Specific mutation logic for this form.
 * @param {string|Function} [successMessage] - Toast notification message or generator.
 */
export function handleFormAction(e, handlers, actionFn, successMessage) {
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


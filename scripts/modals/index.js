/**
 * @fileoverview Main orchestrator and public interface for AuraEvent modal controllers.
 * Coordinates dialog lifecycles, form submissions, and export actions.
 */

import {
  openModal,
  closeModals,
  openEditExpenseModal,
  openEditMilestoneModal,
  openEditVendorModal,
  bindModalOpenTriggers,
  bindEventTypeSelection,
  bindModalCloseActions
} from './core.js';
import { bindExpenseForms } from './forms-expenses.js';
import { bindMilestoneForms } from './forms-milestones.js';
import { bindVendorForms, bindChecklistForm } from './forms-vendors.js';
import { bindNewCelebrationForm, bindEditCelebrationForm } from './forms-celebrations.js';
import { setupExportActions } from './export.js';

export {
  openModal,
  closeModals,
  openEditExpenseModal,
  openEditMilestoneModal,
  openEditVendorModal
};

/**
 * Configures modal open/close triggers, keyboard accessibility, forms, and exports.
 * @param {Object} context - Application callbacks and state accessors.
 * @param {Function} context.getActiveEvent - Getter for currently active celebration.
 * @param {Function} context.persistAndSync - Saves and remotely synchronizes state.
 * @param {Function} context.refreshActiveView - Updates all UI modules.
 * @param {Function} context.showToast - Displays toast message.
 * @param {Function} context.onEventCreated - Callback when new event is created or restored.
 */
export function setupModals(context) {
  const { getActiveEvent, persistAndSync, refreshActiveView, showToast, onEventCreated } = context;
  const handlers = {
    getActiveEvent,
    persistAndSync,
    refreshActiveView,
    showToast,
    onEventCreated
  };

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

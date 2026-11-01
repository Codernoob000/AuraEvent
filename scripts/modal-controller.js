/**
 * @fileoverview Main entrypoint and backwards-compatible re-export for AuraEvent modal controllers.
 * Delegates to modular controllers under scripts/modals/.
 */

export {
  openModal,
  closeModals,
  openEditExpenseModal,
  openEditMilestoneModal,
  openEditVendorModal,
  setupModals
} from './modals/index.js';

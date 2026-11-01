/**
 * @fileoverview Main entrypoint and backwards-compatible re-export for AuraEvent UI renderers.
 * Delegates to specialized single-responsibility modules in scripts/renderers/.
 */

export {
  renderMastheadMetrics,
  renderBudgetModule,
  renderTimelineRibbon,
  renderVendorModule,
  renderAIResults,
  renderSavedPlansModal,
  renderPlanPreviewModal
} from './renderers/index.js';

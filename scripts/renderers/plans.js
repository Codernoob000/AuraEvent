/**
 * @fileoverview Saved plan management and application preview modal renderers.
 * Handles saved plan archives and duplicate detection previews for AuraEvent.
 */

import { formatCurrency, formatDate, sanitizeHTML, calculateMilestoneDate } from '../utils.js';

/**
 * Creates a single saved plan card element.
 * @param {import('../types.js').SavedPlan} saved - Saved plan record.
 * @param {Function} onLoadPlan - Load callback.
 * @param {Function} onDeletePlan - Delete callback.
 * @returns {HTMLElement} Card DOM element.
 */
function createSavedPlanCard(saved, onLoadPlan, onDeletePlan) {
  const card = document.createElement('div');
  card.className = 'saved-plan-card';
  const plan = saved.planData || saved;
  const themeTitle = plan.themes?.[0]?.title || 'Celebration Plan';
  const numBudget = (plan.budgetAllocations || []).length;
  const numMs = (plan.suggestedMilestones || []).length;
  const numVen = (plan.suggestedVendors || []).length;

  card.innerHTML = `
    <div class="saved-plan-meta">
      <span class="saved-plan-title">${sanitizeHTML(themeTitle)}</span>
      <span class="saved-plan-date">Saved on ${formatDate(saved.savedAt || saved.createdAt)}</span>
      <span class="saved-plan-stats">${numBudget} expenses · ${numMs} milestones · ${numVen} vendors</span>
    </div>
    <div style="display: flex; gap: 0.5rem; align-items: center;">
      <button type="button" class="btn btn-primary btn-sm btn-load-plan">Load into Atelier</button>
      <button type="button" class="btn btn-outline btn-sm btn-delete-plan">Delete</button>
    </div>
  `;

  card.querySelector('.btn-load-plan').addEventListener('click', () => onLoadPlan(plan));
  card.querySelector('.btn-delete-plan').addEventListener('click', () => onDeletePlan(saved.id));
  return card;
}

/**
 * Renders the saved plans list inside #modal-saved-plans.
 * @param {import('../types.js').Celebration} event - Active celebration event object.
 * @param {Function} onLoadPlan - Callback when user clicks "Load into Atelier".
 * @param {Function} onDeletePlan - Callback when user deletes a saved plan.
 */
export function renderSavedPlansModal(event, onLoadPlan, onDeletePlan) {
  const container = document.getElementById('saved-plans-list-container');
  if (!container) return;
  container.innerHTML = '';

  const plans = Array.isArray(event?.savedPlans) ? event.savedPlans : [];
  const countSpan = document.getElementById('saved-plans-count');
  if (countSpan) countSpan.textContent = String(plans.length);

  if (plans.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--color-text-secondary);">
        <p style="font-size: var(--text-base); font-weight: 600; margin-bottom: 0.5rem;">No saved plans for "${sanitizeHTML(event?.name || 'this celebration')}"</p>
        <p style="font-size: var(--text-xs); color: var(--color-text-tertiary);">Generate an AI plan in the Inspiration Atelier and click "Save Plan" to archive it here.</p>
      </div>
    `;
    return;
  }

  plans.forEach(saved => {
    container.appendChild(createSavedPlanCard(saved, onLoadPlan, onDeletePlan));
  });
}

/**
 * Identifies potential duplicate candidate items against current celebration state.
 * @param {{ expenses: Array<Object>, milestones: Array<Object>, vendors: Array<Object> }} candidates - Candidate recommendation arrays.
 * @param {import('../types.js').Celebration} event - Current celebration state.
 * @returns {number} Total count of potential duplicates.
 */
function findPlanDuplicates(candidates, event) {
  const existingExpenses = Array.isArray(event.expenses) ? event.expenses : [];
  const existingMilestones = Array.isArray(event.milestones) ? event.milestones : [];
  const existingVendors = Array.isArray(event.vendors) ? event.vendors : [];

  const dupExp = candidates.expenses.filter(c =>
    existingExpenses.some(
      e => (e.description || '').toLowerCase().trim() === (c.item || '').toLowerCase().trim()
    )
  );
  const dupMs = candidates.milestones.filter(c =>
    existingMilestones.some(
      m => (m.title || '').toLowerCase().trim() === (c.title || '').toLowerCase().trim()
    )
  );
  const dupVen = candidates.vendors.filter(c =>
    existingVendors.some(
      v => (v.name || '').toLowerCase().trim() === (c.name || '').toLowerCase().trim()
    )
  );

  return dupExp.length + dupMs.length + dupVen.length;
}

/**
 * Generates preview HTML markup for candidate application list.
 * @param {{ expenses: Array<Object>, milestones: Array<Object>, vendors: Array<Object> }} candidates - Filtered candidate items.
 * @param {import('../types.js').Celebration} event - Active celebration.
 * @returns {string} Formatted HTML.
 */
function buildPlanPreviewHTML(candidates, event) {
  return `
    <div style="margin-bottom: var(--space-3);">
      <strong>Budget Items to Add (${candidates.expenses.length}):</strong>
      <ul style="padding-left: 1.25rem; font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 4px;">
        ${candidates.expenses.map(e => `<li><strong>${sanitizeHTML(e.category)}:</strong> ${sanitizeHTML(e.item)} (${formatCurrency(e.cost)})</li>`).join('') || '<li>None selected</li>'}
      </ul>
    </div>
    <div style="margin-bottom: var(--space-3);">
      <strong>Milestones to Schedule (${candidates.milestones.length}):</strong>
      <ul style="padding-left: 1.25rem; font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 4px;">
        ${candidates.milestones.map(m => `<li><strong>${formatDate(calculateMilestoneDate(event.date, m.offsetDays))}:</strong> ${sanitizeHTML(m.title)} [${sanitizeHTML(m.phase)}]</li>`).join('') || '<li>None selected</li>'}
      </ul>
    </div>
    <div>
      <strong>Vendors to Register (${candidates.vendors.length}):</strong>
      <ul style="padding-left: 1.25rem; font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 4px;">
        ${candidates.vendors.map(v => `<li><strong>${sanitizeHTML(v.category)}:</strong> ${sanitizeHTML(v.name)} (${formatCurrency(v.fee)})</li>`).join('') || '<li>None selected</li>'}
      </ul>
    </div>
  `;
}

/**
 * Renders the plan application preview dialog.
 * Detects duplicates against existing expenses, milestones, and vendors.
 * @param {import('../types.js').Celebration} event - Active celebration event object.
 * @param {Object} planData - AI Plan data.
 * @param {boolean} [isEntire=false] - Whether user chose entire plan or selected only.
 * @returns {{ expensesToAdd: Array<Object>, milestonesToAdd: Array<Object>, vendorsToAdd: Array<Object> }} Items to be applied.
 */
export function renderPlanPreviewModal(event, planData, isEntire = false) {
  const modal = document.getElementById('modal-apply-plan-preview');
  if (!modal || !event || !planData) {
    return { expensesToAdd: [], milestonesToAdd: [], vendorsToAdd: [] };
  }

  document.getElementById('preview-event-name').textContent = event.name;
  document.getElementById('preview-event-stats').textContent =
    `${event.type} · Target Date: ${formatDate(event.date)} · Budget: ${formatCurrency(event.budget)}`;

  const candidates = {
    expenses: isEntire
      ? planData.budgetAllocations || []
      : (planData.budgetAllocations || []).filter(b => b.selected),
    milestones: isEntire
      ? planData.suggestedMilestones || []
      : (planData.suggestedMilestones || []).filter(m => m.selected),
    vendors: isEntire
      ? planData.suggestedVendors || []
      : (planData.suggestedVendors || []).filter(v => v.selected)
  };

  const totalDuplicates = findPlanDuplicates(candidates, event);
  const dupAlert = document.getElementById('preview-duplicates-alert');
  const dupText = document.getElementById('preview-duplicates-text');
  if (dupAlert && dupText) {
    dupAlert.classList.toggle('hidden', totalDuplicates === 0);
    if (totalDuplicates > 0) {
      dupText.textContent = `${totalDuplicates} potential duplicate item(s) found in existing celebration records. AuraEvent will safely preserve all existing items and append non-duplicate recommendations.`;
    }
  }

  const totalCost = candidates.expenses.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
  document.getElementById('preview-count-expenses').textContent = String(
    candidates.expenses.length
  );
  document.getElementById('preview-total-cost').textContent = formatCurrency(totalCost);
  document.getElementById('preview-count-milestones').textContent = String(
    candidates.milestones.length
  );
  document.getElementById('preview-count-vendors').textContent = String(candidates.vendors.length);

  const detailContainer = document.getElementById('preview-items-detail');
  if (detailContainer) {
    detailContainer.innerHTML = buildPlanPreviewHTML(candidates, event);
  }

  return {
    expensesToAdd: candidates.expenses,
    milestonesToAdd: candidates.milestones,
    vendorsToAdd: candidates.vendors
  };
}

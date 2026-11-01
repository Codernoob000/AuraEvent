/**
 * @fileoverview Google Gemini AI plan output renderers for AuraEvent planner.
 * Renders budget allocations and vendor proposals, coordinating the overall results view.
 */

import { formatCurrency, sanitizeHTML, normalizeAIPlan } from '../utils.js';
import { renderThemesSection, renderVendorQuestionsSection } from './ai-themes.js';
import { renderMilestonesSection } from './ai-milestones.js';

/**
 * Renders budget allocations table sub-section.
 * @param {import('../types.js').AIPlan} plan - Normalized AI plan object.
 * @param {Function} [onPlanUpdated] - Notification callback when user edits fields.
 * @returns {HTMLElement} The constructed budget section element.
 */
function renderBudgetAllocationsSection(plan, onPlanUpdated) {
  const budgetSection = document.createElement('div');
  budgetSection.className = 'ai-section-box';
  const calculateTotal = () =>
    (plan.budgetAllocations || [])
      .filter(b => b.selected)
      .reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
  const totalAllocated = calculateTotal();

  budgetSection.innerHTML = `
    <div class="ai-section-box-header">
      <h4 class="ai-section-box-title">💰 Recommended Budget Allocations (<span class="ai-budget-total-label">${formatCurrency(totalAllocated)}</span>)</h4>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <button type="button" class="ai-select-all-btn btn-select-all-budget">Select All</button>
        <span style="color: var(--color-border-subtle);">|</span>
        <button type="button" class="ai-select-all-btn btn-deselect-all-budget">Deselect All</button>
      </div>
    </div>
    <div style="overflow-x: auto;">
      <table class="ai-item-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">Apply</th>
            <th style="width: 120px;">Category</th>
            <th>Item / Service</th>
            <th style="width: 130px;">Suggested Cost</th>
            <th>Strategic Purpose</th>
          </tr>
        </thead>
        <tbody class="ai-budget-table-body"></tbody>
      </table>
    </div>
  `;

  const budgetTbody = budgetSection.querySelector('.ai-budget-table-body');
  const updateBudgetTotal = () => {
    const label = budgetSection.querySelector('.ai-budget-total-label');
    if (label) label.textContent = formatCurrency(calculateTotal());
  };

  (plan.budgetAllocations || []).forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="ai-chk-budget" ${b.selected ? 'checked' : ''} aria-label="Select ${sanitizeHTML(b.item)}">
      </td>
      <td><span class="badge badge-info">${sanitizeHTML(b.category)}</span></td>
      <td>
        <input type="text" class="ai-inline-input ai-budget-item-input" value="${sanitizeHTML(b.item)}">
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span>$</span>
          <input type="number" class="ai-inline-input ai-budget-cost-input" value="${Number(b.cost) || 0}" min="1" step="50">
        </div>
      </td>
      <td style="color: var(--color-text-secondary); font-size: var(--text-xs);">${sanitizeHTML(b.notes)}</td>
    `;

    tr.querySelector('.ai-chk-budget').addEventListener('change', e => {
      b.selected = e.target.checked;
      updateBudgetTotal();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-budget-item-input').addEventListener('input', e => {
      b.item = e.target.value.trim();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-budget-cost-input').addEventListener('input', e => {
      b.cost = Number(e.target.value) || 0;
      updateBudgetTotal();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    budgetTbody.appendChild(tr);
  });

  budgetSection.querySelector('.btn-select-all-budget').addEventListener('click', () => {
    (plan.budgetAllocations || []).forEach(b => (b.selected = true));
    budgetSection.querySelectorAll('.ai-chk-budget').forEach(chk => (chk.checked = true));
    updateBudgetTotal();
    if (onPlanUpdated) onPlanUpdated(plan);
  });
  budgetSection.querySelector('.btn-deselect-all-budget').addEventListener('click', () => {
    (plan.budgetAllocations || []).forEach(b => (b.selected = false));
    budgetSection.querySelectorAll('.ai-chk-budget').forEach(chk => (chk.checked = false));
    updateBudgetTotal();
    if (onPlanUpdated) onPlanUpdated(plan);
  });

  return budgetSection;
}

/**
 * Renders vendor partners table sub-section.
 * @param {import('../types.js').AIPlan} plan - Normalized AI plan object.
 * @param {Function} [onPlanUpdated] - Notification callback when user edits fields.
 * @returns {HTMLElement} The constructed vendors section element.
 */
function renderVendorsSection(plan, onPlanUpdated) {
  const vendorsSection = document.createElement('div');
  vendorsSection.className = 'ai-section-box';
  vendorsSection.innerHTML = `
    <div class="ai-section-box-header">
      <h4 class="ai-section-box-title">🤝 Suggested Vendor Partners &amp; Tasks</h4>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <button type="button" class="ai-select-all-btn btn-select-all-ven">Select All</button>
        <span style="color: var(--color-border-subtle);">|</span>
        <button type="button" class="ai-select-all-btn btn-deselect-all-ven">Deselect All</button>
      </div>
    </div>
    <div style="overflow-x: auto;">
      <table class="ai-item-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">Apply</th>
            <th style="width: 120px;">Category</th>
            <th>Vendor Name / Partner</th>
            <th style="width: 130px;">Est. Fee</th>
            <th>Vetting Task / Contract Inquiry</th>
          </tr>
        </thead>
        <tbody class="ai-vendors-table-body"></tbody>
      </table>
    </div>
  `;

  const venTbody = vendorsSection.querySelector('.ai-vendors-table-body');
  (plan.suggestedVendors || []).forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="ai-chk-ven" ${v.selected ? 'checked' : ''} aria-label="Select ${sanitizeHTML(v.name)}">
      </td>
      <td><span class="badge badge-accent">${sanitizeHTML(v.category)}</span></td>
      <td>
        <input type="text" class="ai-inline-input ai-ven-name-input" value="${sanitizeHTML(v.name)}">
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span>$</span>
          <input type="number" class="ai-inline-input ai-ven-fee-input" value="${Number(v.fee) || 0}" min="0" step="50">
        </div>
      </td>
      <td>
        <input type="text" class="ai-inline-input ai-ven-notes-input" value="${sanitizeHTML(v.notes || '')}">
      </td>
    `;

    tr.querySelector('.ai-chk-ven').addEventListener('change', e => {
      v.selected = e.target.checked;
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-ven-name-input').addEventListener('input', e => {
      v.name = e.target.value.trim();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-ven-fee-input').addEventListener('input', e => {
      v.fee = Number(e.target.value) || 0;
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-ven-notes-input').addEventListener('input', e => {
      v.notes = e.target.value.trim();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    venTbody.appendChild(tr);
  });

  vendorsSection.querySelector('.btn-select-all-ven').addEventListener('click', () => {
    (plan.suggestedVendors || []).forEach(v => (v.selected = true));
    vendorsSection.querySelectorAll('.ai-chk-ven').forEach(chk => (chk.checked = true));
    if (onPlanUpdated) onPlanUpdated(plan);
  });
  vendorsSection.querySelector('.btn-deselect-all-ven').addEventListener('click', () => {
    (plan.suggestedVendors || []).forEach(v => (v.selected = false));
    vendorsSection.querySelectorAll('.ai-chk-ven').forEach(chk => (chk.checked = false));
    if (onPlanUpdated) onPlanUpdated(plan);
  });

  return vendorsSection;
}

/**
 * Updates AI results action bar and model status pill.
 * @param {import('../types.js').AIPlan} plan - Normalized AI plan.
 */
function updateAIStatusHeader(plan) {
  const actionsBar = document.getElementById('ai-plan-actions-bar');
  const statusPill = document.getElementById('ai-plan-status-pill');
  if (actionsBar) actionsBar.classList.remove('hidden');
  if (statusPill) statusPill.classList.remove('hidden');

  const modelTag = document.getElementById('ai-plan-model-tag');
  if (modelTag) {
    modelTag.textContent = plan.isFallback
      ? 'offline-curated-engine'
      : plan.modelUsed || 'gemini-3.8-flash';
    modelTag.className = plan.isFallback ? 'badge badge-warning' : 'badge badge-success';
  }

  const timestampTag = document.getElementById('ai-plan-timestamp');
  if (timestampTag) {
    timestampTag.textContent = `Generated ${new Date(plan.createdAt || Date.now()).toLocaleTimeString()}`;
  }
}

/**
 * Renders GenAI generated inspiration themes, vendor questions, and schedule tips.
 * @param {Object} rawPlan - Results returned by Google Gemini proxy.
 * @param {import('../types.js').Celebration} activeEvent - Current celebration workspace context.
 * @param {Function} [onPlanUpdated] - Notification callback when user edits fields.
 */
export function renderAIResults(rawPlan, activeEvent, onPlanUpdated) {
  const wrapper = document.getElementById('ai-results-wrapper');
  if (!wrapper) return;
  wrapper.innerHTML = '';

  const plan = normalizeAIPlan(rawPlan, activeEvent);
  updateAIStatusHeader(plan);

  wrapper.appendChild(renderThemesSection(plan, onPlanUpdated));
  wrapper.appendChild(renderBudgetAllocationsSection(plan, onPlanUpdated));
  wrapper.appendChild(renderMilestonesSection(plan, activeEvent, onPlanUpdated));
  wrapper.appendChild(renderVendorsSection(plan, onPlanUpdated));

  const questionsSection = renderVendorQuestionsSection(plan);
  if (questionsSection) wrapper.appendChild(questionsSection);
}

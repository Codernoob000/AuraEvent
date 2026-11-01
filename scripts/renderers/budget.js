/**
 * @fileoverview Budget and expense ledger renderers for AuraEvent planner.
 * Renders budget KPIs, category spending gauges, and tabular expense line items.
 */

import { formatCurrency, sanitizeHTML } from '../utils.js';

/**
 * Helper to select badge color class for expense payment status.
 * @param {string} status - Payment status.
 * @returns {string} Badge class.
 */
function getExpenseStatusBadge(status) {
  if (status === 'Paid in Full') return 'badge-success';
  if (status === 'Deposit Paid') return 'badge-info';
  return 'badge-warning';
}

/**
 * Renders visual category spending progress bars in Budget panel.
 * @param {import('../types.js').Expense[]} expenses - List of expense items.
 * @param {number} targetBudget - Overall celebration target budget.
 * @param {string} currency - Currency code.
 */
function renderCategorySpendingBars(expenses, targetBudget, currency) {
  const container = document.getElementById('budget-category-bars');
  if (!container) return;
  container.innerHTML = '';

  const catMap = {};
  expenses.forEach(item => {
    const cat = item.category || 'General';
    catMap[cat] = (catMap[cat] || 0) + (Number(item.actual) || 0);
  });

  const categories = Object.keys(catMap);
  if (categories.length === 0) {
    container.innerHTML =
      '<p style="font-size: var(--text-xs); color: var(--color-text-tertiary); grid-column: 1 / -1;">No expense line items recorded yet.</p>';
    return;
  }

  categories.forEach(cat => {
    const cost = catMap[cat];
    const catPct = targetBudget > 0 ? Math.min(100, Math.round((cost / targetBudget) * 100)) : 0;

    const barItem = document.createElement('div');
    barItem.className = 'category-bar-item';
    barItem.innerHTML = `
      <div class="category-bar-header">
        <span class="category-bar-name">${sanitizeHTML(cat)}</span>
        <span class="category-bar-cost tabular-nums">${formatCurrency(cost, currency)} (${catPct}%)</span>
      </div>
      <div class="category-bar-track" aria-hidden="true">
        <div class="category-bar-fill" style="width: ${catPct}%;"></div>
      </div>
    `;
    container.appendChild(barItem);
  });
}

/**
 * Populates table rows for expense line items.
 * @param {import('../types.js').Expense[]} expenses - List of expense objects.
 * @param {Function} onDelete - Delete callback.
 * @param {Function} onEdit - Edit callback.
 * @param {string} [currency='USD'] - Currency code.
 */
function renderExpenseTableRows(expenses, onDelete, onEdit, currency = 'USD') {
  const tbody = document.getElementById('budget-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (expenses.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; color: var(--color-text-tertiary); padding: 2rem;">No expenses recorded yet. Click "Add Expense Item" above.</td></tr>';
    return;
  }

  expenses.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${sanitizeHTML(item.category)}</strong></td>
      <td>${sanitizeHTML(item.description)}</td>
      <td class="currency tabular-nums">${formatCurrency(item.estimated, currency)}</td>
      <td class="currency tabular-nums"><strong>${formatCurrency(item.actual, currency)}</strong></td>
      <td><span class="badge ${getExpenseStatusBadge(item.status)}">${sanitizeHTML(item.status)}</span></td>
      <td>
        <div style="display: inline-flex; gap: 0.35rem;">
          <button type="button" class="btn btn-outline btn-sm btn-edit-expense" data-id="${sanitizeHTML(item.id)}" aria-label="Edit ${sanitizeHTML(item.description)}">
            Edit
          </button>
          <button type="button" class="btn btn-outline btn-sm btn-delete-expense" data-id="${sanitizeHTML(item.id)}" aria-label="Delete ${sanitizeHTML(item.description)}">
            Remove
          </button>
        </div>
      </td>
    `;
    tr.querySelector('.btn-edit-expense')?.addEventListener(
      'click',
      () => onEdit && onEdit(item.id)
    );
    tr.querySelector('.btn-delete-expense')?.addEventListener(
      'click',
      () => onDelete && onDelete(item.id)
    );
    tbody.appendChild(tr);
  });
}

/**
 * Renders budget view summary, visual category distribution, and tabular expense rows.
 * @param {import('../types.js').Celebration} event - Active event object.
 * @param {Function} onDeleteExpense - Callback when an expense is deleted.
 * @param {Function} onEditExpense - Callback when an expense is edited.
 */
export function renderBudgetModule(event, onDeleteExpense, onEditExpense) {
  const currency = event.currency || 'USD';
  const targetBudget = Number(event.budget) || 0;
  const expenses = Array.isArray(event.expenses) ? event.expenses : [];
  const totalCommitted = expenses.reduce((sum, item) => sum + (Number(item.actual) || 0), 0);
  const variance = targetBudget - totalCommitted;
  const guests = Number(event.guestCount) || 1;
  const costPerGuest = Math.round(totalCommitted / guests);

  const setNodeText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setNodeText('budget-view-target', formatCurrency(targetBudget, currency));
  setNodeText('budget-view-committed', formatCurrency(totalCommitted, currency));
  setNodeText('budget-view-per-guest', formatCurrency(costPerGuest, currency));
  setNodeText('budget-view-variance', formatCurrency(variance, currency));

  // Variance Pill
  const variancePill = document.getElementById('budget-variance-pill');
  if (variancePill) {
    variancePill.textContent = totalCommitted > targetBudget ? 'Over Budget' : 'On Budget';
    variancePill.className =
      totalCommitted > targetBudget ? 'badge badge-danger' : 'badge badge-success';
  }

  // Over-budget alert banner
  const overbudgetAlert = document.getElementById('budget-overbudget-alert');
  if (overbudgetAlert) {
    overbudgetAlert.classList.toggle('hidden', totalCommitted <= targetBudget);
  }

  // Overview progress fill
  const pct =
    targetBudget > 0 ? Math.min(Math.round((totalCommitted / targetBudget) * 100), 100) : 0;
  const fillElem = document.getElementById('overview-budget-progress-fill');
  if (fillElem) {
    fillElem.style.width = `${pct}%`;
    fillElem.classList.toggle('over-budget', totalCommitted > targetBudget);
  }

  renderCategorySpendingBars(expenses, targetBudget, currency);
  renderExpenseTableRows(expenses, onDeleteExpense, onEditExpense, currency);
}


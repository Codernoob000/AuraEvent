/**
 * @fileoverview Overview and masthead metric renderers for AuraEvent planner.
 * Renders hero showcase, top navigation badges, overview cards, and readiness center.
 */

import {
  formatCurrency,
  formatDate,
  calculateDaysRemaining,
  renderCountdownDisplay,
  sanitizeHTML
} from '../utils.js';

/**
 * Renders top navigation badge and hero showcase banner.
 * @param {import('../types.js').Celebration} event - Active celebration event object.
 * @param {string} currency - Currency code.
 * @param {number} targetBudget - Planned budget ceiling.
 * @param {number} daysLeft - Days until target date.
 */
function renderNavAndHeroMetrics(event, currency, targetBudget, daysLeft) {
  const setNodeText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setNodeText('nav-event-type-badge', event.type || 'Celebration');
  setNodeText('metric-target-budget', formatCurrency(targetBudget, currency));
  setNodeText('metric-days-remaining', String(daysLeft));
  setNodeText('metric-event-date', formatDate(event.date));

  // Celebration Hero Cover Banner
  setNodeText('hero-event-title', event.name || 'Untitled Celebration');
  setNodeText('hero-event-type-badge', event.type || 'Celebration');
  setNodeText('hero-event-date', formatDate(event.date));
  setNodeText('hero-event-guests', `${event.guestCount || 0} Guests`);
  setNodeText('hero-event-budget', `${formatCurrency(targetBudget, currency)} Budget`);

  // Live Countdown Clock
  renderCountdownDisplay(event.date);
}

/**
 * Renders category preview chips in Overview card.
 * @param {import('../types.js').Expense[]} expenses - List of expense objects.
 * @param {string} currency - Active celebration currency.
 */
function renderOverviewCategoryChips(expenses, currency) {
  const container = document.getElementById('overview-category-preview-list');
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
      '<span style="font-size: var(--text-xs); color: var(--color-text-tertiary);">No expense categories recorded yet.</span>';
    return;
  }

  categories.slice(0, 5).forEach(cat => {
    const chip = document.createElement('span');
    chip.className = 'category-chip';
    chip.innerHTML = `<strong>${sanitizeHTML(cat)}:</strong> ${formatCurrency(catMap[cat], currency)}`;
    container.appendChild(chip);
  });
}

/**
 * Renders Overview operations column metrics.
 * @param {import('../types.js').Celebration} event - Active event.
 * @param {string} currency - Currency code.
 * @param {number} targetBudget - Planned budget ceiling.
 * @param {number} totalSpent - Actual total spending.
 * @param {number} variance - Budget variance.
 */
function renderOverviewMetrics(event, currency, targetBudget, totalSpent, variance) {
  const setNodeText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setNodeText('overview-planned-ceiling', formatCurrency(targetBudget, currency));
  setNodeText('overview-allocated-spend', formatCurrency(totalSpent, currency));
  setNodeText('overview-remaining-balance', formatCurrency(variance, currency));

  const spentPct = targetBudget > 0 ? Math.round((totalSpent / targetBudget) * 100) : 0;
  setNodeText('metric-total-spent', formatCurrency(totalSpent, currency));
  setNodeText('metric-spent-percent', `${spentPct}% of budget allocated`);

  const confirmedVendors = (event.vendors || []).filter(v => v.status === 'Confirmed').length;
  const totalVendors = (event.vendors || []).length;
  setNodeText('metric-vendors-progress', `${confirmedVendors} / ${totalVendors}`);

  const elVariance = document.getElementById('metric-budget-variance');
  if (elVariance) {
    if (variance < 0) {
      elVariance.textContent = `${formatCurrency(Math.abs(variance), currency)} Over Budget`;
      elVariance.style.color = 'var(--color-danger)';
    } else {
      elVariance.textContent = `${formatCurrency(variance, currency)} Remaining`;
      elVariance.style.color = '#CBD5E1';
    }
  }

  // Category Preview Chips in Overview
  renderOverviewCategoryChips(event.expenses || [], currency);
}

/**
 * Renders Event Readiness & Action Center synthesizing milestones, vendors, and budget health.
 * @param {import('../types.js').Celebration} event - Active celebration event object.
 * @param {string} currency - Currency code.
 * @param {number} targetBudget - Planned budget.
 * @param {number} totalSpent - Total committed spend.
 * @param {number} variance - Budget variance.
 */
function renderReadinessCenter(event, currency, targetBudget, totalSpent, variance) {
  const totalMilestones = (event.milestones || []).length;
  const completedMilestones = (event.milestones || []).filter(m => m.completed).length;
  const totalVendors = (event.vendors || []).length;
  const confirmedVendors = (event.vendors || []).filter(v => v.status === 'Confirmed').length;

  const mScore = totalMilestones > 0 ? completedMilestones / totalMilestones : 0.5;
  const vScore = totalVendors > 0 ? confirmedVendors / totalVendors : 0.5;
  const bScore =
    totalSpent <= targetBudget
      ? 1.0
      : Math.max(0.3, 1 - (totalSpent - targetBudget) / (targetBudget || 1));
  const readinessIndex = Math.min(
    100,
    Math.max(0, Math.round((mScore * 0.45 + vScore * 0.35 + bScore * 0.2) * 100))
  );

  const elReadinessPct = document.getElementById('readiness-pct-text');
  if (elReadinessPct) elReadinessPct.textContent = `${readinessIndex}%`;

  const elReadinessFill = document.getElementById('readiness-progress-fill');
  if (elReadinessFill) elReadinessFill.style.width = `${readinessIndex}%`;

  const elReadinessPill = document.getElementById('readiness-status-pill');
  if (elReadinessPill) {
    if (readinessIndex >= 80) {
      elReadinessPill.textContent = 'High Readiness';
      elReadinessPill.className = 'badge badge-success';
    } else if (readinessIndex >= 50) {
      elReadinessPill.textContent = 'On Schedule';
      elReadinessPill.className = 'badge badge-info';
    } else {
      elReadinessPill.textContent = 'Action Required';
      elReadinessPill.className = 'badge badge-warning';
    }
  }

  // Next Milestone Card
  const elNextMs = document.getElementById('readiness-next-milestone');
  if (elNextMs) {
    const nextMilestone = (event.milestones || []).find(m => !m.completed);
    if (nextMilestone) {
      elNextMs.innerHTML = `<strong>${sanitizeHTML(nextMilestone.title)}</strong> (${sanitizeHTML(nextMilestone.phase)}) — ${formatDate(nextMilestone.date)}`;
    } else if (totalMilestones > 0) {
      elNextMs.textContent = 'All scheduled milestones accomplished!';
    } else {
      elNextMs.textContent = 'No milestones scheduled yet. Add run-of-show milestones below.';
    }
  }

  // Vendor Progress Card
  const elVenProg = document.getElementById('readiness-vendor-progress');
  if (elVenProg) {
    if (totalVendors > 0) {
      const pct = Math.round((confirmedVendors / totalVendors) * 100);
      elVenProg.textContent = `${confirmedVendors} of ${totalVendors} vendors confirmed (${pct}% of roster)`;
    } else {
      elVenProg.textContent =
        'No vendor partners registered yet. Add venue, catering, and audio partners.';
    }
  }

  // Financial Health Card
  const elBudStatus = document.getElementById('readiness-budget-status');
  if (elBudStatus) {
    if (variance < 0) {
      elBudStatus.innerHTML = `<span style="color: var(--color-danger); font-weight: 700;">Over budget by ${formatCurrency(Math.abs(variance), currency)}.</span> Review line items to rebalance.`;
    } else {
      const spentPct = targetBudget > 0 ? Math.round((totalSpent / targetBudget) * 100) : 0;
      elBudStatus.innerHTML = `<span style="color: var(--color-success); font-weight: 700;">${formatCurrency(variance, currency)}</span> remaining within planned ceiling (${100 - spentPct}% available).`;
    }
  }
}

/**
 * Updates top masthead metric cards and hero celebration showcase.
 * Single coordinator delegating to sub-renderers.
 * @param {import('../types.js').Celebration} event - Active celebration object.
 */
export function renderMastheadMetrics(event) {
  const currency = event.currency || 'USD';
  const targetBudget = Number(event.budget) || 0;
  const totalSpent = (event.expenses || []).reduce(
    (acc, item) => acc + (Number(item.actual) || 0),
    0
  );
  const variance = targetBudget - totalSpent;
  const daysLeft = calculateDaysRemaining(event.date);

  renderNavAndHeroMetrics(event, currency, targetBudget, daysLeft);
  renderOverviewMetrics(event, currency, targetBudget, totalSpent, variance);
  renderReadinessCenter(event, currency, targetBudget, totalSpent, variance);
}


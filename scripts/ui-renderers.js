/**
 * @fileoverview DOM Rendering engine for AuraEvent planner.
 * Renders metrics, budget tables, timeline ribbons, and AI suggestions.
 * Strictly enforces single responsibility, DOMPurify sanitization, and WCAG 2.1 AA.
 */

import { formatCurrency, formatDate, calculateDaysRemaining, calculateDetailedCountdown, sanitizeHTML, buildGoogleCalendarUrl, resolveCssColor, calculateMilestoneDate, normalizeAIPlan } from './utils.js';

/**
 * Update top masthead metric cards and hero celebration showcase.
 * @param {Object} event - Active event object.
 */
export function renderMastheadMetrics(event) {
  const currency = event.currency || 'USD';
  const targetBudget = Number(event.budget) || 0;
  const totalSpent = (event.expenses || []).reduce((acc, item) => acc + (Number(item.actual) || 0), 0);
  const variance = targetBudget - totalSpent;
  const spentPct = targetBudget > 0 ? Math.round((totalSpent / targetBudget) * 100) : 0;
  const daysLeft = calculateDaysRemaining(event.date);

  const confirmedVendors = (event.vendors || []).filter((v) => v.status === 'Confirmed').length;
  const totalVendors = (event.vendors || []).length;
  const completedMilestones = (event.milestones || []).filter((m) => m.completed).length;
  const totalMilestones = (event.milestones || []).length;

  // Header and Pulse Metrics
  const elNavBadge = document.getElementById('nav-event-type-badge');
  if (elNavBadge) elNavBadge.textContent = event.type || 'Celebration';

  const elTarget = document.getElementById('metric-target-budget');
  if (elTarget) elTarget.textContent = formatCurrency(targetBudget, currency);

  const elSpent = document.getElementById('metric-total-spent');
  if (elSpent) elSpent.textContent = formatCurrency(totalSpent, currency);

  const elSpentPct = document.getElementById('metric-spent-percent');
  if (elSpentPct) elSpentPct.textContent = `${spentPct}% of budget allocated`;

  const elDays = document.getElementById('metric-days-remaining');
  if (elDays) elDays.textContent = String(daysLeft);

  const elDate = document.getElementById('metric-event-date');
  if (elDate) elDate.textContent = formatDate(event.date);

  const elVendorsProg = document.getElementById('metric-vendors-progress');
  if (elVendorsProg) elVendorsProg.textContent = `${confirmedVendors} / ${totalVendors}`;

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

  // Celebration Hero Cover Banner
  const heroTitle = document.getElementById('hero-event-title');
  if (heroTitle) heroTitle.textContent = event.name || 'Untitled Celebration';

  const heroTypeBadge = document.getElementById('hero-event-type-badge');
  if (heroTypeBadge) heroTypeBadge.textContent = event.type || 'Celebration';

  const heroDate = document.getElementById('hero-event-date');
  if (heroDate) heroDate.textContent = formatDate(event.date);

  const heroGuests = document.getElementById('hero-event-guests');
  if (heroGuests) heroGuests.textContent = `${event.guestCount || 0} Guests`;

  const heroBudget = document.getElementById('hero-event-budget');
  if (heroBudget) heroBudget.textContent = `${formatCurrency(targetBudget, currency)} Budget`;

  // Live Countdown Clock
  const countdown = calculateDetailedCountdown(event.date);
  const cdDays = document.getElementById('countdown-days');
  const cdHours = document.getElementById('countdown-hours');
  const cdMins = document.getElementById('countdown-mins');
  const cdSecs = document.getElementById('countdown-secs');
  const cdSummary = document.getElementById('hero-countdown-summary');

  if (cdDays) cdDays.textContent = String(countdown.days).padStart(2, '0');
  if (cdHours) cdHours.textContent = String(countdown.hours).padStart(2, '0');
  if (cdMins) cdMins.textContent = String(countdown.minutes).padStart(2, '0');
  if (cdSecs) cdSecs.textContent = String(countdown.seconds).padStart(2, '0');
  if (cdSummary) {
    if (countdown.isPast) {
      cdSummary.textContent = 'Celebrated';
    } else if (countdown.days === 0) {
      cdSummary.textContent = 'Today!';
    } else {
      cdSummary.textContent = `${countdown.days} Days to go`;
    }
  }

  // Overview Operations Left Column
  const plCeiling = document.getElementById('overview-planned-ceiling');
  if (plCeiling) plCeiling.textContent = formatCurrency(targetBudget, currency);

  const alSpend = document.getElementById('overview-allocated-spend');
  if (alSpend) alSpend.textContent = formatCurrency(totalSpent, currency);

  const remBal = document.getElementById('overview-remaining-balance');
  if (remBal) remBal.textContent = formatCurrency(variance, currency);

  // Category Preview Chips in Overview
  renderOverviewCategoryChips(event.expenses || [], currency);

  // Event Readiness & Action Center Synthesis
  const mScore = totalMilestones > 0 ? (completedMilestones / totalMilestones) : 0.5;
  const vScore = totalVendors > 0 ? (confirmedVendors / totalVendors) : 0.5;
  const bScore = totalSpent <= targetBudget ? 1.0 : Math.max(0.3, 1 - (totalSpent - targetBudget) / (targetBudget || 1));
  const readinessIndex = Math.min(100, Math.max(0, Math.round((mScore * 0.45 + vScore * 0.35 + bScore * 0.2) * 100)));

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

  // Readiness: Next Milestone
  const elNextMs = document.getElementById('readiness-next-milestone');
  if (elNextMs) {
    const nextMilestone = (event.milestones || []).find((m) => !m.completed);
    if (nextMilestone) {
      elNextMs.innerHTML = `<strong>${sanitizeHTML(nextMilestone.title)}</strong> (${sanitizeHTML(nextMilestone.phase)}) — ${formatDate(nextMilestone.date)}`;
    } else if (totalMilestones > 0) {
      elNextMs.textContent = 'All scheduled milestones accomplished!';
    } else {
      elNextMs.textContent = 'No milestones scheduled yet. Add run-of-show milestones below.';
    }
  }

  // Readiness: Vendor Progress
  const elVenProg = document.getElementById('readiness-vendor-progress');
  if (elVenProg) {
    if (totalVendors > 0) {
      const pct = Math.round((confirmedVendors / totalVendors) * 100);
      elVenProg.textContent = `${confirmedVendors} of ${totalVendors} vendors confirmed (${pct}% of roster)`;
    } else {
      elVenProg.textContent = 'No vendor partners registered yet. Add venue, catering, and audio partners.';
    }
  }

  // Readiness: Financial Health
  const elBudStatus = document.getElementById('readiness-budget-status');
  if (elBudStatus) {
    if (variance < 0) {
      elBudStatus.innerHTML = `<span style="color: var(--color-danger); font-weight: 700;">Over budget by ${formatCurrency(Math.abs(variance), currency)}.</span> Review line items to rebalance.`;
    } else {
      elBudStatus.innerHTML = `<span style="color: var(--color-success); font-weight: 700;">${formatCurrency(variance, currency)}</span> remaining within planned ceiling (${100 - spentPct}% available).`;
    }
  }
}

/**
 * Render category preview chips in Overview card.
 * @param {Array<Object>} expenses - List of expense objects.
 * @param {string} currency - Active celebration currency.
 */
function renderOverviewCategoryChips(expenses, currency) {
  const container = document.getElementById('overview-category-preview-list');
  if (!container) return;
  container.innerHTML = '';

  const catMap = {};
  expenses.forEach((item) => {
    const cat = item.category || 'General';
    catMap[cat] = (catMap[cat] || 0) + (Number(item.actual) || 0);
  });

  const categories = Object.keys(catMap);
  if (categories.length === 0) {
    container.innerHTML = '<span style="font-size: var(--text-xs); color: var(--color-text-tertiary);">No expense categories recorded yet.</span>';
    return;
  }

  categories.slice(0, 5).forEach((cat) => {
    const chip = document.createElement('span');
    chip.className = 'category-chip';
    chip.innerHTML = `<strong>${sanitizeHTML(cat)}:</strong> ${formatCurrency(catMap[cat], currency)}`;
    container.appendChild(chip);
  });
}

/**
 * Render budget view summary, visual category distribution, and tabular expense rows.
 * @param {Object} event - Active event object.
 * @param {Function} onDeleteExpense - Callback when an expense is deleted.
 */
export function renderBudgetModule(event, onDeleteExpense, onEditExpense) {
  const currency = event.currency || 'USD';
  const targetBudget = Number(event.budget) || 0;
  const expenses = Array.isArray(event.expenses) ? event.expenses : [];
  const totalCommitted = expenses.reduce((sum, item) => sum + (Number(item.actual) || 0), 0);
  const variance = targetBudget - totalCommitted;
  const guests = Number(event.guestCount) || 1;
  const costPerGuest = Math.round(totalCommitted / guests);

  document.getElementById('budget-view-target').textContent = formatCurrency(targetBudget, currency);
  document.getElementById('budget-view-committed').textContent = formatCurrency(totalCommitted, currency);
  document.getElementById('budget-view-per-guest').textContent = formatCurrency(costPerGuest, currency);
  document.getElementById('budget-view-variance').textContent = formatCurrency(variance, currency);

  // Variance Pill
  const variancePill = document.getElementById('budget-variance-pill');
  if (variancePill) {
    if (totalCommitted > targetBudget) {
      variancePill.textContent = 'Over Budget';
      variancePill.className = 'badge badge-danger';
    } else {
      variancePill.textContent = 'On Budget';
      variancePill.className = 'badge badge-success';
    }
  }

  // Over-budget alert banner
  const overbudgetAlert = document.getElementById('budget-overbudget-alert');
  if (overbudgetAlert) {
    overbudgetAlert.classList.toggle('hidden', totalCommitted <= targetBudget);
  }

  // Overview progress fill
  const pct = targetBudget > 0 ? Math.min(Math.round((totalCommitted / targetBudget) * 100), 100) : 0;
  const fillElem = document.getElementById('overview-budget-progress-fill');
  if (fillElem) {
    fillElem.style.width = `${pct}%`;
    fillElem.classList.toggle('over-budget', totalCommitted > targetBudget);
  }

  // Category Spending Distribution Bars
  renderCategorySpendingBars(expenses, targetBudget, currency);

  renderExpenseTableRows(expenses, onDeleteExpense, currency);
}

/**
 * Render visual category spending progress bars in Budget panel.
 * @param {Array<Object>} expenses - List of expense items.
 * @param {number} targetBudget - Overall celebration target budget.
 * @param {string} currency - Currency code.
 */
function renderCategorySpendingBars(expenses, targetBudget, currency) {
  const container = document.getElementById('budget-category-bars');
  if (!container) return;
  container.innerHTML = '';

  const catMap = {};
  expenses.forEach((item) => {
    const cat = item.category || 'General';
    catMap[cat] = (catMap[cat] || 0) + (Number(item.actual) || 0);
  });

  const categories = Object.keys(catMap);
  if (categories.length === 0) {
    container.innerHTML = '<p style="font-size: var(--text-xs); color: var(--color-text-tertiary); grid-column: 1 / -1;">No expense line items recorded yet.</p>';
    return;
  }

  categories.forEach((cat) => {
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
 * Populate table rows for expense line items.
 * @param {Array<Object>} expenses - List of expense objects.
 * @param {Function} onDelete - Delete callback.
 * @param {string} currency - Currency code.
 */
function renderExpenseTableRows(expenses, onDelete, currency = 'USD') {
  const tbody = document.getElementById('budget-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (expenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-text-tertiary); padding: 2rem;">No expenses recorded yet. Click "Add Expense Item" above.</td></tr>';
    return;
  }

  expenses.forEach((item) => {
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
    tr.querySelector('.btn-edit-expense')?.addEventListener('click', () => onEditExpense && onEditExpense(item.id));
    tr.querySelector('.btn-delete-expense')?.addEventListener('click', () => onDelete(item.id));
    tbody.appendChild(tr);
  });
}

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
 * Render Run-of-Show Chrono-Ribbon timeline milestones.
 * @param {Object} event - Active event object.
 * @param {Function} onToggleMilestone - Toggle completion callback.
 * @param {Function} onDeleteMilestone - Delete callback.
 * @param {string} [activePhase='all'] - Filter by phase.
 */
export function renderTimelineRibbon(event, onToggleMilestone, onDeleteMilestone, activePhase = 'all', onEditMilestone = null) {
  const container = document.getElementById('timeline-full-ribbon');
  const overviewList = document.getElementById('overview-milestones-list');
  const milestones = Array.isArray(event.milestones) ? event.milestones : [];

  if (container) container.innerHTML = '';
  if (overviewList) overviewList.innerHTML = '';

  if (milestones.length === 0) {
    const emptyMsg = '<p style="color: var(--color-text-tertiary); padding: 1.5rem; text-align: center;">No milestones defined yet. Click "Add Milestone" above to schedule run-of-show tracks.</p>';
    if (container) container.innerHTML = emptyMsg;
    if (overviewList) overviewList.innerHTML = emptyMsg;
    return;
  }

  // Filter milestones by active phase
  const filteredMilestones = (activePhase === 'all' || !activePhase)
    ? milestones
    : milestones.filter((m) => m.phase === activePhase);

  if (filteredMilestones.length === 0) {
    container.innerHTML = `<p style="color: var(--color-text-tertiary); padding: 1.5rem; text-align: center;">No milestones recorded for phase "${sanitizeHTML(activePhase)}".</p>`;
  } else {
    filteredMilestones.forEach((item) => {
      const node = createTimelineNodeElement(item, onToggleMilestone, onDeleteMilestone, onEditMilestone);
      container.appendChild(node);
    });
  }

  // Overview gets the top 3 uncompleted milestones (or first 3 if all completed)
  const upcoming = milestones.filter((m) => !m.completed);
  const overviewSubset = upcoming.length > 0 ? upcoming.slice(0, 3) : milestones.slice(0, 3);
  overviewSubset.forEach((item) => {
    const briefNode = createTimelineNodeElement(item, onToggleMilestone, null, null);
    if (overviewList) overviewList.appendChild(briefNode);
  });
}

/**
 * Create a single timeline node DOM element with Google Calendar integration.
 * @param {Object} item - Milestone item object.
 * @param {Function} onToggle - Toggle callback.
 * @param {Function|null} onDelete - Delete callback.
 * @param {Function|null} onEdit - Edit callback.
 * @returns {HTMLElement} Node DOM element.
 */
function createTimelineNodeElement(item, onToggle, onDelete, onEdit = null) {
  const gcalUrl = buildGoogleCalendarUrl({
    title: item.title,
    description: item.notes,
    startDateISO: item.date
  });

  const node = document.createElement('div');
  node.className = `timeline-node ${item.completed ? 'completed' : ''}`;
  node.innerHTML = `
    <div class="timeline-marker" aria-hidden="true">${item.completed ? '✓' : ''}</div>
    <div class="timeline-header">
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <span class="badge badge-info" style="font-size: var(--text-xs);">${sanitizeHTML(item.phase || 'General')}</span>
        <span class="timeline-title">${sanitizeHTML(item.title)}</span>
      </div>
      <span class="timeline-date">${formatDate(item.date)}</span>
    </div>
    <p class="timeline-notes">${sanitizeHTML(item.notes || 'No specific notes.')}</p>
    <div class="timeline-actions">
      <button type="button" class="btn btn-outline btn-sm btn-toggle-ms" aria-label="Toggle completion for ${sanitizeHTML(item.title)}">
        ${item.completed ? 'Mark Incomplete' : 'Mark Completed'}
      </button>
      <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" aria-label="Add ${sanitizeHTML(item.title)} to Google Calendar">
        <span>+ Google Calendar</span>
      </a>
      ${onEdit ? `<button type="button" class="btn btn-outline btn-sm btn-edit-ms" aria-label="Edit milestone ${sanitizeHTML(item.title)}">Edit</button>` : ''}
      ${onDelete ? `<button type="button" class="btn btn-outline btn-sm btn-delete-ms" aria-label="Delete milestone ${sanitizeHTML(item.title)}">Remove</button>` : ''}
    </div>
  `;

  node.querySelector('.btn-toggle-ms').addEventListener('click', () => onToggle(item.id));
  if (onEdit) {
    node.querySelector('.btn-edit-ms')?.addEventListener('click', () => onEdit(item.id));
  }
  if (onDelete) {
    node.querySelector('.btn-delete-ms').addEventListener('click', () => onDelete(item.id));
  }
  return node;
}

/**
 * Render vendor directory rows.
 * @param {Object} event - Active event object.
 * @param {Function} onDeleteVendor - Delete callback.
 * @param {Function} onUpdateVendorStatus - Update status callback.
 */
export function renderVendorModule(event, onDeleteVendor, onUpdateVendorStatus, onEditVendor = null, onToggleChecklist = null, onDeleteChecklist = null) {
  const currency = event.currency || 'USD';
  const tbody = document.getElementById('vendor-table-body');
  const overviewList = document.getElementById('overview-vendors-list');
  const vendors = Array.isArray(event.vendors) ? event.vendors : [];

  if (tbody) tbody.innerHTML = '';
  if (overviewList) overviewList.innerHTML = '';

  if (vendors.length === 0) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-text-tertiary); padding: 2rem;">No vendors added yet. Click "Add Vendor" above.</td></tr>';
    if (overviewList) overviewList.innerHTML = '<p style="color: var(--color-text-tertiary); font-size: var(--text-sm); padding: var(--space-2) 0;">No vendors currently registered.</p>';
  } else {
    vendors.forEach((ven) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${sanitizeHTML(ven.category)}</strong></td>
        <td>${sanitizeHTML(ven.name)}</td>
        <td>${sanitizeHTML(ven.contact)}</td>
        <td class="currency tabular-nums">${formatCurrency(ven.fee, currency)}</td>
        <td><span class="badge ${ven.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}">${sanitizeHTML(ven.status)}</span></td>
        <td>
          <div style="display: inline-flex; gap: 0.35rem;">
            <button type="button" class="btn btn-outline btn-sm btn-advance-ven" aria-label="Advance contract status for ${sanitizeHTML(ven.name)}">
              Advance
            </button>
            <button type="button" class="btn btn-outline btn-sm btn-edit-ven" aria-label="Edit vendor ${sanitizeHTML(ven.name)}">
              Edit
            </button>
            <button type="button" class="btn btn-outline btn-sm btn-delete-ven" aria-label="Delete vendor ${sanitizeHTML(ven.name)}">
              Remove
            </button>
          </div>
        </td>
      `;
      tr.querySelector('.btn-advance-ven')?.addEventListener('click', () => onUpdateVendorStatus && onUpdateVendorStatus(ven.id));
      tr.querySelector('.btn-edit-ven')?.addEventListener('click', () => onEditVendor && onEditVendor(ven.id));
      tr.querySelector('.btn-delete-ven')?.addEventListener('click', () => onDeleteVendor(ven.id));
      if (tbody) tbody.appendChild(tr);
    });

    vendors.slice(0, 3).forEach((ven) => {
      const div = document.createElement('div');
      div.style.padding = '0.5rem 0';
      div.style.borderBottom = '1px solid var(--color-border-subtle)';
      div.innerHTML = `<strong>${sanitizeHTML(ven.name)}</strong> (${sanitizeHTML(ven.category)}) — <span class="badge ${ven.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}">${sanitizeHTML(ven.status)}</span>`;
      if (overviewList) overviewList.appendChild(div);
    });
  }

  // Render Vendor Checklist Tasks
  const checklistContainer = document.getElementById('vendor-checklist-items');
  const checklistCounter = document.getElementById('vendor-checklist-counter');
  const tasks = Array.isArray(event.vendorChecklist) ? event.vendorChecklist : [];

  if (checklistCounter) {
    const completedCount = tasks.filter((t) => t.completed).length;
    checklistCounter.textContent = `${completedCount} / ${tasks.length} Completed`;
  }

  if (checklistContainer) {
    checklistContainer.innerHTML = '';
    if (tasks.length === 0) {
      checklistContainer.innerHTML = '<li style="color: var(--color-text-tertiary); font-size: var(--text-sm); padding: var(--space-2) 0;">No checklist tasks added yet. Add a vendor task above.</li>';
    } else {
      tasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = `vendor-checklist-row ${task.completed ? 'completed' : ''}`;
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.justifyContent = 'space-between';
        li.style.padding = 'var(--space-2) var(--space-3)';
        li.style.background = 'var(--color-bg-subtle)';
        li.style.border = '1px solid var(--color-border-subtle)';
        li.style.borderRadius = 'var(--radius-md)';
        li.style.fontSize = 'var(--text-sm)';

        li.innerHTML = `
          <label style="display: flex; align-items: center; gap: var(--space-2); cursor: pointer; margin: 0; flex: 1;">
            <input type="checkbox" class="chk-task-toggle" ${task.completed ? 'checked' : ''} aria-label="${sanitizeHTML(task.text)}">
            <span style="${task.completed ? 'text-decoration: line-through; color: var(--color-text-tertiary);' : 'font-weight: 500;'}">${sanitizeHTML(task.text)}</span>
          </label>
          <button type="button" class="btn btn-outline btn-sm btn-delete-task" style="margin-left: var(--space-2);" aria-label="Delete task">Remove</button>
        `;

        li.querySelector('.chk-task-toggle')?.addEventListener('change', () => onToggleChecklist && onToggleChecklist(task.id));
        li.querySelector('.btn-delete-task')?.addEventListener('click', () => onDeleteChecklist && onDeleteChecklist(task.id));
        checklistContainer.appendChild(li);
      });
    }
  }
}

/**
 * Render GenAI generated inspiration themes, vendor questions, and schedule tips.
 * Accurately parses color swatches to eliminate blank swatch defects.
 * @param {Object} aiResults - Results returned by Google Gemini proxy.
 */
export function renderAIResults(rawPlan, activeEvent, onPlanUpdated) {
  const wrapper = document.getElementById('ai-results-wrapper');
  if (!wrapper) return;
  wrapper.innerHTML = '';

  const plan = normalizeAIPlan(rawPlan, activeEvent);

  // Reveal Action Bar and Status Pill
  const actionsBar = document.getElementById('ai-plan-actions-bar');
  const statusPill = document.getElementById('ai-plan-status-pill');
  if (actionsBar) actionsBar.classList.remove('hidden');
  if (statusPill) statusPill.classList.remove('hidden');

  const modelTag = document.getElementById('ai-plan-model-tag');
  if (modelTag) {
    modelTag.textContent = plan.isFallback ? 'offline-curated-engine' : (plan.modelUsed || 'gemini-3.8-flash');
    modelTag.className = plan.isFallback ? 'badge badge-warning' : 'badge badge-success';
  }

  const timestampTag = document.getElementById('ai-plan-timestamp');
  if (timestampTag) {
    timestampTag.textContent = `Generated ${new Date(plan.createdAt || Date.now()).toLocaleTimeString()}`;
  }

  // 1. Creative Themes Section
  const themesSection = document.createElement('div');
  themesSection.className = 'ai-section-box';
  themesSection.innerHTML = `
    <div class="ai-section-box-header">
      <h4 class="ai-section-box-title">🎨 Curated Themes &amp; Color Palettes</h4>
      <span style="font-size: var(--text-xs); color: var(--color-text-secondary);">Editable aesthetic concepts</span>
    </div>
  `;

  (plan.themes || []).forEach((theme) => {
    const card = document.createElement('div');
    card.className = 'theme-card';
    card.style.marginBottom = 'var(--space-3)';

    const titleRow = document.createElement('div');
    titleRow.style.marginBottom = '0.5rem';
    titleRow.innerHTML = `
      <label class="form-label" style="font-size: var(--text-xs); margin-bottom: 2px;">Theme Concept Title</label>
      <input type="text" class="ai-inline-input ai-theme-title-input" value="${sanitizeHTML(theme.title)}" style="font-weight: 700; font-size: var(--text-base);">
    `;
    titleRow.querySelector('.ai-theme-title-input').addEventListener('input', (e) => {
      theme.title = e.target.value.trim();
      if (onPlanUpdated) onPlanUpdated(plan);
    });

    const concept = document.createElement('p');
    concept.style.cssText = 'font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: 0.5rem;';
    concept.textContent = theme.concept || '';

    const swatchesContainer = document.createElement('div');
    swatchesContainer.className = 'theme-palette-swatches';

    const palette = Array.isArray(theme.decorPalette) ? theme.decorPalette : [];
    palette.forEach((col, idx) => {
      const hex = resolveCssColor(col, idx);
      const labelText = typeof col === 'string' && col.length > 1 && !col.startsWith('#')
        ? col
        : hex;

      const chip = document.createElement('span');
      chip.className = 'color-swatch-chip';
      chip.title = `${labelText} (${hex})`;

      const swatch = document.createElement('span');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = hex;
      swatch.style.setProperty('--swatch-color', hex);
      swatch.setAttribute('data-color', hex);
      swatch.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.className = 'color-swatch-label';
      label.textContent = labelText;

      chip.appendChild(swatch);
      chip.appendChild(label);
      swatchesContainer.appendChild(chip);
    });

    const tip = document.createElement('p');
    tip.style.cssText = 'font-size: var(--text-xs); color: var(--color-accent-hover); font-weight: 600;';
    tip.textContent = `💡 Pro Tip: ${theme.budgetTip || 'Balance core aesthetics with vendor costs.'}`;

    card.appendChild(titleRow);
    card.appendChild(concept);
    card.appendChild(swatchesContainer);
    card.appendChild(tip);
    themesSection.appendChild(card);
  });
  wrapper.appendChild(themesSection);

  // 2. Budget Allocations Section
  const budgetSection = document.createElement('div');
  budgetSection.className = 'ai-section-box';
  const totalAllocated = (plan.budgetAllocations || []).filter(b => b.selected).reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
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
  (plan.budgetAllocations || []).forEach((b) => {
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

    tr.querySelector('.ai-chk-budget').addEventListener('change', (e) => {
      b.selected = e.target.checked;
      updateBudgetTotal();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-budget-item-input').addEventListener('input', (e) => {
      b.item = e.target.value.trim();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-budget-cost-input').addEventListener('input', (e) => {
      b.cost = Number(e.target.value) || 0;
      updateBudgetTotal();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    budgetTbody.appendChild(tr);
  });

  const updateBudgetTotal = () => {
    const newTotal = (plan.budgetAllocations || []).filter(b => b.selected).reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
    const label = budgetSection.querySelector('.ai-budget-total-label');
    if (label) label.textContent = formatCurrency(newTotal);
  };

  budgetSection.querySelector('.btn-select-all-budget').addEventListener('click', () => {
    (plan.budgetAllocations || []).forEach(b => b.selected = true);
    budgetSection.querySelectorAll('.ai-chk-budget').forEach(chk => chk.checked = true);
    updateBudgetTotal();
    if (onPlanUpdated) onPlanUpdated(plan);
  });
  budgetSection.querySelector('.btn-deselect-all-budget').addEventListener('click', () => {
    (plan.budgetAllocations || []).forEach(b => b.selected = false);
    budgetSection.querySelectorAll('.ai-chk-budget').forEach(chk => chk.checked = false);
    updateBudgetTotal();
    if (onPlanUpdated) onPlanUpdated(plan);
  });

  wrapper.appendChild(budgetSection);

  // 3. Suggested Milestones Section
  const milestonesSection = document.createElement('div');
  milestonesSection.className = 'ai-section-box';
  milestonesSection.innerHTML = `
    <div class="ai-section-box-header">
      <h4 class="ai-section-box-title">⏱️ Suggested Run-of-Show Milestones</h4>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <button type="button" class="ai-select-all-btn btn-select-all-ms">Select All</button>
        <span style="color: var(--color-border-subtle);">|</span>
        <button type="button" class="ai-select-all-btn btn-deselect-all-ms">Deselect All</button>
      </div>
    </div>
    <div style="overflow-x: auto;">
      <table class="ai-item-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">Apply</th>
            <th style="width: 140px;">Target Date</th>
            <th>Milestone Title</th>
            <th style="width: 130px;">Phase</th>
            <th>Notes &amp; Details</th>
          </tr>
        </thead>
        <tbody class="ai-milestones-table-body"></tbody>
      </table>
    </div>
  `;

  const msTbody = milestonesSection.querySelector('.ai-milestones-table-body');
  (plan.suggestedMilestones || []).forEach((m) => {
    const concreteDate = calculateMilestoneDate(activeEvent?.date, m.offsetDays);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="ai-chk-ms" ${m.selected ? 'checked' : ''} aria-label="Select ${sanitizeHTML(m.title)}">
      </td>
      <td>
        <span class="badge badge-info" style="font-size: var(--text-xs);">${formatDate(concreteDate)}</span>
        <div style="font-size: 11px; color: var(--color-text-tertiary);">${m.offsetDays === 0 ? 'Day of event' : `${Math.abs(m.offsetDays)}d ${m.offsetDays < 0 ? 'prior' : 'after'}`}</div>
      </td>
      <td>
        <input type="text" class="ai-inline-input ai-ms-title-input" value="${sanitizeHTML(m.title)}">
      </td>
      <td>
        <select class="ai-inline-input ai-ms-phase-select">
          <option value="Planning" ${m.phase === 'Planning' ? 'selected' : ''}>Planning</option>
          <option value="Preparation" ${m.phase === 'Preparation' ? 'selected' : ''}>Preparation</option>
          <option value="Execution" ${m.phase === 'Execution' ? 'selected' : ''}>Execution</option>
          <option value="Day of" ${m.phase === 'Day of' || m.phase === 'Ceremony' || m.phase === 'Reception' ? 'selected' : ''}>Day of</option>
        </select>
      </td>
      <td>
        <input type="text" class="ai-inline-input ai-ms-notes-input" value="${sanitizeHTML(m.notes || '')}">
      </td>
    `;

    tr.querySelector('.ai-chk-ms').addEventListener('change', (e) => {
      m.selected = e.target.checked;
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-ms-title-input').addEventListener('input', (e) => {
      m.title = e.target.value.trim();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-ms-phase-select').addEventListener('change', (e) => {
      m.phase = e.target.value;
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-ms-notes-input').addEventListener('input', (e) => {
      m.notes = e.target.value.trim();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    msTbody.appendChild(tr);
  });

  milestonesSection.querySelector('.btn-select-all-ms').addEventListener('click', () => {
    (plan.suggestedMilestones || []).forEach(m => m.selected = true);
    milestonesSection.querySelectorAll('.ai-chk-ms').forEach(chk => chk.checked = true);
    if (onPlanUpdated) onPlanUpdated(plan);
  });
  milestonesSection.querySelector('.btn-deselect-all-ms').addEventListener('click', () => {
    (plan.suggestedMilestones || []).forEach(m => m.selected = false);
    milestonesSection.querySelectorAll('.ai-chk-ms').forEach(chk => chk.checked = false);
    if (onPlanUpdated) onPlanUpdated(plan);
  });

  wrapper.appendChild(milestonesSection);

  // 4. Suggested Vendors Section
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
  (plan.suggestedVendors || []).forEach((v) => {
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

    tr.querySelector('.ai-chk-ven').addEventListener('change', (e) => {
      v.selected = e.target.checked;
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-ven-name-input').addEventListener('input', (e) => {
      v.name = e.target.value.trim();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-ven-fee-input').addEventListener('input', (e) => {
      v.fee = Number(e.target.value) || 0;
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-ven-notes-input').addEventListener('input', (e) => {
      v.notes = e.target.value.trim();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    venTbody.appendChild(tr);
  });

  vendorsSection.querySelector('.btn-select-all-ven').addEventListener('click', () => {
    (plan.suggestedVendors || []).forEach(v => v.selected = true);
    vendorsSection.querySelectorAll('.ai-chk-ven').forEach(chk => chk.checked = true);
    if (onPlanUpdated) onPlanUpdated(plan);
  });
  vendorsSection.querySelector('.btn-deselect-all-ven').addEventListener('click', () => {
    (plan.suggestedVendors || []).forEach(v => v.selected = false);
    vendorsSection.querySelectorAll('.ai-chk-ven').forEach(chk => chk.checked = false);
    if (onPlanUpdated) onPlanUpdated(plan);
  });

  wrapper.appendChild(vendorsSection);

  // 5. Vendor Interview Questions
  const questions = Array.isArray(plan.vendorQuestions) ? plan.vendorQuestions : [];
  if (questions.length > 0) {
    const qBox = document.createElement('div');
    qBox.className = 'ai-section-box';
    qBox.innerHTML = `
      <h4 class="ai-section-box-title" style="margin-bottom: 0.5rem;">📋 Strategic Vendor Interview Questions</h4>
      <ul style="padding-left: 1.25rem; font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.6;">
        ${questions.map((q) => `<li>${sanitizeHTML(q)}</li>`).join('')}
      </ul>
    `;
    wrapper.appendChild(qBox);
  }
}

/**
 * Render the saved plans list inside #modal-saved-plans.
 * @param {Object} event - Active celebration event object.
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

  plans.forEach((saved) => {
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
    container.appendChild(card);
  });
}

/**
 * Render the plan application preview dialog.
 * Detects duplicates against existing expenses, milestones, and vendors.
 * @param {Object} event - Active celebration event object.
 * @param {Object} planData - AI Plan data.
 * @param {boolean} isEntire - Whether user chose entire plan or selected only.
 * @returns {Object} Items to be applied { expensesToAdd, milestonesToAdd, vendorsToAdd }.
 */
export function renderPlanPreviewModal(event, planData, isEntire = false) {
  const modal = document.getElementById('modal-apply-plan-preview');
  if (!modal || !event || !planData) return { expensesToAdd: [], milestonesToAdd: [], vendorsToAdd: [] };

  document.getElementById('preview-event-name').textContent = event.name;
  document.getElementById('preview-event-stats').textContent = `${event.type} · Target Date: ${formatDate(event.date)} · Budget: ${formatCurrency(event.budget)}`;

  // Filter items
  const expensesCandidates = isEntire
    ? (planData.budgetAllocations || [])
    : (planData.budgetAllocations || []).filter(b => b.selected);

  const milestonesCandidates = isEntire
    ? (planData.suggestedMilestones || [])
    : (planData.suggestedMilestones || []).filter(m => m.selected);

  const vendorsCandidates = isEntire
    ? (planData.suggestedVendors || [])
    : (planData.suggestedVendors || []).filter(v => v.selected);

  // De-duplication check against existing data
  const existingExpenses = Array.isArray(event.expenses) ? event.expenses : [];
  const existingMilestones = Array.isArray(event.milestones) ? event.milestones : [];
  const existingVendors = Array.isArray(event.vendors) ? event.vendors : [];

  const duplicateExpenses = expensesCandidates.filter(c =>
    existingExpenses.some(e => e.description.toLowerCase().trim() === (c.item || '').toLowerCase().trim())
  );
  const duplicateMilestones = milestonesCandidates.filter(c =>
    existingMilestones.some(m => m.title.toLowerCase().trim() === (c.title || '').toLowerCase().trim())
  );
  const duplicateVendors = vendorsCandidates.filter(c =>
    existingVendors.some(v => v.name.toLowerCase().trim() === (c.name || '').toLowerCase().trim())
  );

  const totalDuplicates = duplicateExpenses.length + duplicateMilestones.length + duplicateVendors.length;
  const dupAlert = document.getElementById('preview-duplicates-alert');
  const dupText = document.getElementById('preview-duplicates-text');
  if (dupAlert && dupText) {
    if (totalDuplicates > 0) {
      dupAlert.classList.remove('hidden');
      dupText.textContent = `${totalDuplicates} potential duplicate item(s) found in existing celebration records. AuraEvent will safely preserve all existing items and append non-duplicate recommendations.`;
    } else {
      dupAlert.classList.add('hidden');
    }
  }

  // Calculate totals
  const totalCost = expensesCandidates.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
  document.getElementById('preview-count-expenses').textContent = String(expensesCandidates.length);
  document.getElementById('preview-total-cost').textContent = formatCurrency(totalCost);
  document.getElementById('preview-count-milestones').textContent = String(milestonesCandidates.length);
  document.getElementById('preview-count-vendors').textContent = String(vendorsCandidates.length);

  // Build detail breakdown
  const detailContainer = document.getElementById('preview-items-detail');
  if (detailContainer) {
    detailContainer.innerHTML = `
      <div style="margin-bottom: var(--space-3);">
        <strong>Budget Items to Add (${expensesCandidates.length}):</strong>
        <ul style="padding-left: 1.25rem; font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 4px;">
          ${expensesCandidates.map(e => `<li><strong>${sanitizeHTML(e.category)}:</strong> ${sanitizeHTML(e.item)} (${formatCurrency(e.cost)})</li>`).join('') || '<li>None selected</li>'}
        </ul>
      </div>
      <div style="margin-bottom: var(--space-3);">
        <strong>Milestones to Schedule (${milestonesCandidates.length}):</strong>
        <ul style="padding-left: 1.25rem; font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 4px;">
          ${milestonesCandidates.map(m => `<li><strong>${formatDate(calculateMilestoneDate(event.date, m.offsetDays))}:</strong> ${sanitizeHTML(m.title)} [${sanitizeHTML(m.phase)}]</li>`).join('') || '<li>None selected</li>'}
        </ul>
      </div>
      <div>
        <strong>Vendors to Register (${vendorsCandidates.length}):</strong>
        <ul style="padding-left: 1.25rem; font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 4px;">
          ${vendorsCandidates.map(v => `<li><strong>${sanitizeHTML(v.category)}:</strong> ${sanitizeHTML(v.name)} (${formatCurrency(v.fee)})</li>`).join('') || '<li>None selected</li>'}
        </ul>
      </div>
    `;
  }

  return {
    expensesToAdd: expensesCandidates,
    milestonesToAdd: milestonesCandidates,
    vendorsToAdd: vendorsCandidates
  };
}


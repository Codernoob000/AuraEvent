/**
 * @fileoverview Main Application Controller for AuraEvent Celebration Planner.
 * Coordinates state, active celebration views, tab navigation, and AI workflows.
 * Strictly adheres to single responsibility, zero console.log, and < 300 lines.
 */

import { loadPersistedEvents, saveEventsToStorage, getStoredActiveEventId, saveActiveEventId } from './events-data.js';
import { renderMastheadMetrics, renderBudgetModule, renderTimelineRibbon, renderVendorModule, renderAIResults, renderSavedPlansModal, renderPlanPreviewModal } from './ui-renderers.js';
import { generateEventInspiration, syncEventData } from './api.js';
import { setupModals, openModal, closeModals, openEditExpenseModal, openEditMilestoneModal, openEditVendorModal } from './modal-controller.js';
import { generateUUID, calculateMilestoneDate, normalizeAIPlan, formatCurrency, calculateDetailedCountdown, renderCountdownDisplay, applyRecommendationsToCelebration } from './utils.js';

/** In-memory active application state */
const APP_STATE = {
  events: [],
  activeId: null
};

let CURRENT_TIMELINE_PHASE = 'all';
let COUNTDOWN_TICKER_INTERVAL = null;

/**
 * Update real-time celebration countdown clock.
 */
function updateCountdownTicker() {
  const event = getActiveEvent();
  if (!event) return;
  renderCountdownDisplay(event.date);
}

/**
 * Display a user-facing toast notification.
 * @param {string} message - Notification text.
 * @param {'success'|'error'} [type='success'] - Toast style.
 */
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

/**
 * Retrieve the active celebration event object.
 * @returns {Object} Active event.
 */
export function getActiveEvent() {
  return APP_STATE.events.find((evt) => evt.id === APP_STATE.activeId) || APP_STATE.events[0];
}

/**
 * Persist state to local storage and trigger asynchronous server sync.
 */
export function persistAndSync() {
  saveEventsToStorage(APP_STATE.events);
  const activeEvt = getActiveEvent();
  if (activeEvt) {
    syncEventData(activeEvt).catch(() => {});
  }
}

/**
 * Populate event selector dropdown in header masthead.
 */
function updateEventSelectorOptions() {
  const selectElem = document.getElementById('event-select-input');
  if (!selectElem) return;
  selectElem.innerHTML = '';
  APP_STATE.events.forEach((evt) => {
    const opt = document.createElement('option');
    opt.value = evt.id;
    opt.textContent = `${evt.name} (${evt.type})`;
    if (evt.id === APP_STATE.activeId) opt.selected = true;
    selectElem.appendChild(opt);
  });
}

/**
 * Refresh all UI modules for the active event.
 */
export function refreshActiveView() {
  const event = getActiveEvent();
  if (!event) return;

  // Personalize aesthetic theme based on celebration type
  if (typeof document !== 'undefined' && document.body) {
    document.body.setAttribute('data-event-type', event.type || 'Wedding');
  }

  // Ensure live countdown ticker is running
  if (!COUNTDOWN_TICKER_INTERVAL && typeof window !== 'undefined') {
    COUNTDOWN_TICKER_INTERVAL = setInterval(updateCountdownTicker, 1000);
  }

  renderMastheadMetrics(event);
  renderBudgetModule(event, handleDeleteExpense, handleEditExpense);
  renderTimelineRibbon(event, handleToggleMilestone, handleDeleteMilestone, CURRENT_TIMELINE_PHASE, handleEditMilestone);
  renderVendorModule(event, handleDeleteVendor, handleUpdateVendorStatus, handleEditVendor, handleToggleChecklist, handleDeleteChecklist);

  // Update counter badges
  const bBudget = document.getElementById('badge-budget-count');
  const bTimeline = document.getElementById('badge-timeline-count');
  const bVendors = document.getElementById('badge-vendors-count');
  if (bBudget) bBudget.textContent = String((event.expenses || []).length);
  if (bTimeline) bTimeline.textContent = String((event.milestones || []).length);
  if (bVendors) bVendors.textContent = String((event.vendors || []).length);

  // Update AI Workspace Active Celebration Banner
  const wsName = document.getElementById('ai-workspace-event-name');
  const wsMeta = document.getElementById('ai-workspace-event-meta');
  const savedCount = document.getElementById('saved-plans-count');
  if (wsName) wsName.textContent = event.name;
  if (wsMeta) wsMeta.textContent = `${event.type} · ${formatCurrency(event.budget, event.currency || 'USD')} · ${event.guestCount} guests`;
  if (savedCount) savedCount.textContent = String((event.savedPlans || []).length);

  // Pre-fill AI inputs with active celebration parameters
  const aiType = document.getElementById('ai-event-type');
  const aiBudget = document.getElementById('ai-budget-input');
  const aiGuests = document.getElementById('ai-guest-count');
  if (aiType && event.type) aiType.value = event.type;
  if (aiBudget && event.budget) aiBudget.value = event.budget;
  if (aiGuests && event.guestCount) aiGuests.value = event.guestCount;
}

/**
 * Handle deleting an expense line item.
 * @param {string} expenseId - Expense UUID.
 */
function handleDeleteExpense(expenseId) {
  const event = getActiveEvent();
  event.expenses = (event.expenses || []).filter((item) => item.id !== expenseId);
  persistAndSync();
  refreshActiveView();
  showToast('Expense item removed.', 'success');
}

/**
 * Handle opening edit expense modal.
 * @param {string} expenseId - Expense UUID.
 */
function handleEditExpense(expenseId) {
  const event = getActiveEvent();
  const expense = (event.expenses || []).find((e) => e.id === expenseId);
  if (expense) openEditExpenseModal(expense);
}

/**
 * Handle opening edit milestone modal.
 * @param {string} milestoneId - Milestone UUID.
 */
function handleEditMilestone(milestoneId) {
  const event = getActiveEvent();
  const ms = (event.milestones || []).find((m) => m.id === milestoneId);
  if (ms) openEditMilestoneModal(ms);
}

/**
 * Handle opening edit vendor modal.
 * @param {string} vendorId - Vendor UUID.
 */
function handleEditVendor(vendorId) {
  const event = getActiveEvent();
  const ven = (event.vendors || []).find((v) => v.id === vendorId);
  if (ven) openEditVendorModal(ven);
}

/**
 * Toggle vendor checklist task completion state.
 * @param {string} taskId - Task UUID.
 */
function handleToggleChecklist(taskId) {
  const event = getActiveEvent();
  const task = (event.vendorChecklist || []).find((t) => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    persistAndSync();
    refreshActiveView();
  }
}

/**
 * Remove a vendor checklist task.
 * @param {string} taskId - Task UUID.
 */
function handleDeleteChecklist(taskId) {
  const event = getActiveEvent();
  event.vendorChecklist = (event.vendorChecklist || []).filter((t) => t.id !== taskId);
  persistAndSync();
  refreshActiveView();
  showToast('Vendor task removed.');
}

/**
 * Toggle milestone completion status.
 * @param {string} milestoneId - Milestone UUID.
 */
function handleToggleMilestone(milestoneId) {
  const event = getActiveEvent();
  const ms = (event.milestones || []).find((m) => m.id === milestoneId);
  if (ms) {
    ms.completed = !ms.completed;
    persistAndSync();
    refreshActiveView();
    showToast(ms.completed ? 'Milestone completed!' : 'Milestone reopened.', 'success');
  }
}

/**
 * Handle deleting a timeline milestone.
 * @param {string} milestoneId - Milestone UUID.
 */
function handleDeleteMilestone(milestoneId) {
  const event = getActiveEvent();
  event.milestones = (event.milestones || []).filter((m) => m.id !== milestoneId);
  persistAndSync();
  refreshActiveView();
  showToast('Milestone removed.', 'success');
}

/**
 * Handle deleting a vendor partner.
 * @param {string} vendorId - Vendor UUID.
 */
function handleDeleteVendor(vendorId) {
  const event = getActiveEvent();
  event.vendors = (event.vendors || []).filter((v) => v.id !== vendorId);
  persistAndSync();
  refreshActiveView();
  showToast('Vendor removed.', 'success');
}

/**
 * Advance vendor contract status along lifecycle stages.
 * @param {string} vendorId - Vendor UUID.
 */
function handleUpdateVendorStatus(vendorId) {
  const event = getActiveEvent();
  const stages = ['Researching', 'Quoted', 'Contract Sent', 'Confirmed'];
  const ven = (event.vendors || []).find((v) => v.id === vendorId);
  if (ven) {
    const currentIndex = stages.indexOf(ven.status);
    const nextIndex = (currentIndex + 1) % stages.length;
    ven.status = stages[nextIndex];
    persistAndSync();
    refreshActiveView();
    showToast(`Vendor status updated to "${ven.status}".`);
  }
}

/**
 * Setup tab switching navigation.
 */
function setupNavigationTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const targetPanelId = tab.getAttribute('aria-controls');
      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  bindTabJump('.btn-nav-to-budget', 'tab-budget');
  bindTabJump('.btn-nav-to-timeline', 'tab-timeline');
  bindTabJump('.btn-nav-to-vendors', 'tab-vendors');
  bindTabJump('#btn-quick-ai-ideas', 'tab-ai-atelier');
  bindTabJump('#btn-launch-ai-workshop', 'tab-ai-atelier');
}

/**
 * Setup timeline phase filter buttons.
 */
function setupTimelineFilters() {
  const filterBtns = document.querySelectorAll('.btn-timeline-filter');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      CURRENT_TIMELINE_PHASE = btn.getAttribute('data-phase') || 'all';
      const event = getActiveEvent();
      if (event) {
        renderTimelineRibbon(event, handleToggleMilestone, handleDeleteMilestone, CURRENT_TIMELINE_PHASE);
      }
    });
  });
}

/**
 * Helper to bind buttons to specific navigation tabs.
 * @param {string} selector - CSS button selector.
 * @param {string} tabId - Target tab identifier.
 */
function bindTabJump(selector, tabId) {
  document.querySelectorAll(selector).forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = document.getElementById(tabId);
      if (targetTab) targetTab.click();
    });
  });
}

/**
 * Configure AI brainstorming form submission.
 */
let CURRENT_GENERATED_PLAN = null;
let PENDING_APPLY_CONTEXT = null;

/**
 * Handle loading a saved plan into the active Atelier view.
 * @param {Object} plan - Saved plan object.
 */
function handleLoadSavedPlan(plan) {
  const activeEvt = getActiveEvent();
  CURRENT_GENERATED_PLAN = normalizeAIPlan(plan, activeEvt);
  renderAIResults(CURRENT_GENERATED_PLAN, activeEvt, (p) => { CURRENT_GENERATED_PLAN = p; });
  closeModals();
  showToast('Loaded saved plan into Atelier.');
}

/**
 * Handle deleting a saved plan from active celebration library.
 * @param {string} savedId - Saved plan UUID.
 */
function handleDeleteSavedPlan(savedId) {
  const activeEvt = getActiveEvent();
  activeEvt.savedPlans = (activeEvt.savedPlans || []).filter((p) => p.id !== savedId);
  persistAndSync();
  renderSavedPlansModal(activeEvt, handleLoadSavedPlan, handleDeleteSavedPlan);
  const countSpan = document.getElementById('saved-plans-count');
  if (countSpan) countSpan.textContent = String(activeEvt.savedPlans.length);
  showToast('Saved plan removed.');
}

/**
 * Configure AI brainstorming form submission and interactive plan actions.
 */
function setupAIWorkshop() {
  const form = document.getElementById('form-ai-generator');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const activeEvt = getActiveEvent();
    const payload = {
      eventType: document.getElementById('ai-event-type').value,
      theme: document.getElementById('ai-theme-prompt').value.trim(),
      vibe: document.getElementById('ai-vibe').value.trim(),
      budget: Number(document.getElementById('ai-budget-input').value) || activeEvt.budget,
      guestCount: Number(document.getElementById('ai-guest-count').value) || activeEvt.guestCount
    };

    const shimmer = document.getElementById('ai-loading-indicator');
    const submitBtn = document.getElementById('btn-generate-ai');
    shimmer?.classList.remove('hidden');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const results = await generateEventInspiration(payload);
      CURRENT_GENERATED_PLAN = normalizeAIPlan(results, activeEvt);
      renderAIResults(CURRENT_GENERATED_PLAN, activeEvt, (p) => { CURRENT_GENERATED_PLAN = p; });
      showToast('Gemini inspiration generated successfully!');
    } catch {
      showToast('Unable to reach AI service. Showing offline suggestions.', 'error');
    } finally {
      shimmer?.classList.add('hidden');
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Regenerate Plan
  document.getElementById('btn-regenerate-ai-plan')?.addEventListener('click', () => {
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  });

  // Save Plan
  document.getElementById('btn-save-ai-plan')?.addEventListener('click', () => {
    if (!CURRENT_GENERATED_PLAN) {
      showToast('No generated plan to save.', 'error');
      return;
    }
    const activeEvt = getActiveEvent();
    activeEvt.savedPlans = Array.isArray(activeEvt.savedPlans) ? activeEvt.savedPlans : [];
    const planSnapshot = JSON.parse(JSON.stringify(CURRENT_GENERATED_PLAN));
    activeEvt.savedPlans.unshift({
      id: generateUUID(),
      savedAt: new Date().toISOString(),
      planData: planSnapshot
    });
    persistAndSync();
    const countSpan = document.getElementById('saved-plans-count');
    if (countSpan) countSpan.textContent = String(activeEvt.savedPlans.length);
    const themeTitle = planSnapshot.themes?.[0]?.title || 'Celebration Plan';
    showToast(`Plan "${themeTitle}" saved to celebration!`);
  });

  // View Saved Plans
  document.getElementById('btn-view-saved-plans')?.addEventListener('click', () => {
    const activeEvt = getActiveEvent();
    renderSavedPlansModal(activeEvt, handleLoadSavedPlan, handleDeleteSavedPlan);
    openModal('modal-saved-plans');
  });

  // Apply Entire Plan Trigger
  document.getElementById('btn-apply-entire-plan')?.addEventListener('click', () => {
    if (!CURRENT_GENERATED_PLAN) {
      showToast('Generate a plan first before applying.', 'error');
      return;
    }
    const activeEvt = getActiveEvent();
    PENDING_APPLY_CONTEXT = { isEntire: true };
    renderPlanPreviewModal(activeEvt, CURRENT_GENERATED_PLAN, true);
    openModal('modal-apply-plan-preview');
  });

  // Apply Selected Recommendations Trigger
  document.getElementById('btn-apply-selected-plan')?.addEventListener('click', () => {
    if (!CURRENT_GENERATED_PLAN) {
      showToast('Generate a plan first before applying.', 'error');
      return;
    }
    const activeEvt = getActiveEvent();
    PENDING_APPLY_CONTEXT = { isEntire: false };
    renderPlanPreviewModal(activeEvt, CURRENT_GENERATED_PLAN, false);
    openModal('modal-apply-plan-preview');
  });

  // Confirm Apply in Preview Modal
  document.getElementById('btn-confirm-apply-plan')?.addEventListener('click', () => {
    const confirmChk = document.getElementById('chk-confirm-apply-plan');
    if (confirmChk && !confirmChk.checked) {
      showToast('Please check the confirmation box to proceed.', 'error');
      return;
    }
    const activeEvt = getActiveEvent();
    if (!activeEvt || !CURRENT_GENERATED_PLAN) return;

    const isEntire = PENDING_APPLY_CONTEXT?.isEntire ?? true;
    const candidates = renderPlanPreviewModal(activeEvt, CURRENT_GENERATED_PLAN, isEntire);

    const { addedExpenses, addedMilestones, addedVendors } = applyRecommendationsToCelebration(activeEvt, candidates);

    persistAndSync();
    refreshActiveView();
    closeModals();
    showToast(`Applied to ${activeEvt.name}: +${addedExpenses} expenses, +${addedMilestones} milestones, +${addedVendors} vendors!`);
  });

  // Modal close handlers
  document.getElementById('btn-cancel-apply-plan')?.addEventListener('click', closeModals);
  document.getElementById('btn-close-apply-plan-modal')?.addEventListener('click', closeModals);
  document.getElementById('btn-close-saved-plans-modal')?.addEventListener('click', closeModals);
  document.getElementById('btn-close-saved-plans-bottom')?.addEventListener('click', closeModals);
}

/**
 * Callback when a new celebration is created in modal.
 * @param {Object} newEvt - Newly created celebration event.
 */
function handleEventCreated(newEvt) {
  APP_STATE.events.unshift(newEvt);
  APP_STATE.activeId = newEvt.id;
  saveActiveEventId(newEvt.id);
  persistAndSync();
  updateEventSelectorOptions();
  refreshActiveView();
}

/**
 * Initialize application state and listeners on DOMContentLoaded.
 */
function initializeApp() {
  APP_STATE.events = loadPersistedEvents();
  APP_STATE.activeId = getStoredActiveEventId(APP_STATE.events);

  updateEventSelectorOptions();
  refreshActiveView();
  setupNavigationTabs();
  setupTimelineFilters();
  setupModals({
    getActiveEvent,
    persistAndSync,
    refreshActiveView,
    showToast,
    onEventCreated: handleEventCreated
  });
  setupAIWorkshop();

  document.getElementById('event-select-input')?.addEventListener('change', (e) => {
    APP_STATE.activeId = e.target.value;
    saveActiveEventId(APP_STATE.activeId);
    refreshActiveView();
    showToast('Switched active celebration.');
  });

  // URL Deep Linking support (tabs, events, modals)
  try {
    const params = new URLSearchParams(window.location.search);
    const initialEvent = params.get('event');
    if (initialEvent && APP_STATE.events.some((e) => e.id === initialEvent)) {
      APP_STATE.activeId = initialEvent;
      saveActiveEventId(APP_STATE.activeId);
      const sel = document.getElementById('event-select-input');
      if (sel) sel.value = initialEvent;
      refreshActiveView();
    }
    const initialTab = params.get('tab') || window.location.hash.replace('#', '');
    if (initialTab) {
      const tabBtn = document.getElementById(`tab-${initialTab}`) || document.querySelector(`[aria-controls="panel-${initialTab}"]`);
      if (tabBtn) tabBtn.click();
    }
    const initialModal = params.get('modal');
    if (initialModal === 'new-event') {
      const btnNew = document.getElementById('btn-new-event');
      if (btnNew) btnNew.click();
    }
  } catch {
    // Deep linking non-blocking enhancement
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

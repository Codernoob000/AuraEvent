/**
 * @fileoverview AI suggested milestones section renderer for AuraEvent planner.
 */

import { formatDate, sanitizeHTML, calculateMilestoneDate } from '../utils.js';

/**
 * Renders run-of-show milestones table sub-section.
 * @param {import('../types.js').AIPlan} plan - Normalized AI plan object.
 * @param {import('../types.js').Celebration} activeEvent - Current celebration workspace context.
 * @param {Function} [onPlanUpdated] - Notification callback when user edits fields.
 * @returns {HTMLElement} The constructed milestones section element.
 */
export function renderMilestonesSection(plan, activeEvent, onPlanUpdated) {
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
  (plan.suggestedMilestones || []).forEach(m => {
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

    tr.querySelector('.ai-chk-ms').addEventListener('change', e => {
      m.selected = e.target.checked;
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-ms-title-input').addEventListener('input', e => {
      m.title = e.target.value.trim();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-ms-phase-select').addEventListener('change', e => {
      m.phase = e.target.value;
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    tr.querySelector('.ai-ms-notes-input').addEventListener('input', e => {
      m.notes = e.target.value.trim();
      if (onPlanUpdated) onPlanUpdated(plan);
    });
    msTbody.appendChild(tr);
  });

  milestonesSection.querySelector('.btn-select-all-ms').addEventListener('click', () => {
    (plan.suggestedMilestones || []).forEach(m => (m.selected = true));
    milestonesSection.querySelectorAll('.ai-chk-ms').forEach(chk => (chk.checked = true));
    if (onPlanUpdated) onPlanUpdated(plan);
  });
  milestonesSection.querySelector('.btn-deselect-all-ms').addEventListener('click', () => {
    (plan.suggestedMilestones || []).forEach(m => (m.selected = false));
    milestonesSection.querySelectorAll('.ai-chk-ms').forEach(chk => (chk.checked = false));
    if (onPlanUpdated) onPlanUpdated(plan);
  });

  return milestonesSection;
}

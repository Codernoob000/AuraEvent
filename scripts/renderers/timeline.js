/**
 * @fileoverview Run-of-show Chrono-Ribbon timeline renderers for AuraEvent planner.
 * Renders chronological milestone ribbons, filtering, and Google Calendar deep links.
 */

import { formatDate, sanitizeHTML, buildGoogleCalendarUrl } from '../utils.js';

/**
 * Creates a single timeline node DOM element with Google Calendar integration.
 * @param {import('../types.js').Milestone} item - Milestone item object.
 * @param {Function} onToggle - Toggle callback.
 * @param {Function|null} onDelete - Delete callback.
 * @param {Function|null} [onEdit=null] - Edit callback.
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
 * Renders Run-of-Show Chrono-Ribbon timeline milestones.
 * @param {import('../types.js').Celebration} event - Active event object.
 * @param {Function} onToggleMilestone - Toggle completion callback.
 * @param {Function} onDeleteMilestone - Delete callback.
 * @param {string} [activePhase='all'] - Filter by phase.
 * @param {Function|null} [onEditMilestone=null] - Edit callback.
 */
export function renderTimelineRibbon(
  event,
  onToggleMilestone,
  onDeleteMilestone,
  activePhase = 'all',
  onEditMilestone = null
) {
  const container = document.getElementById('timeline-full-ribbon');
  const overviewList = document.getElementById('overview-milestones-list');
  const milestones = Array.isArray(event.milestones) ? event.milestones : [];

  if (container) container.innerHTML = '';
  if (overviewList) overviewList.innerHTML = '';

  if (milestones.length === 0) {
    const emptyMsg =
      '<p style="color: var(--color-text-tertiary); padding: 1.5rem; text-align: center;">No milestones defined yet. Click "Add Milestone" above to schedule run-of-show tracks.</p>';
    if (container) container.innerHTML = emptyMsg;
    if (overviewList) overviewList.innerHTML = emptyMsg;
    return;
  }

  const filteredMilestones =
    activePhase === 'all' || !activePhase
      ? milestones
      : milestones.filter(m => m.phase === activePhase);

  if (filteredMilestones.length === 0) {
    if (container) {
      container.innerHTML = `<p style="color: var(--color-text-tertiary); padding: 1.5rem; text-align: center;">No milestones recorded for phase "${sanitizeHTML(activePhase)}".</p>`;
    }
  } else if (container) {
    filteredMilestones.forEach(item => {
      container.appendChild(
        createTimelineNodeElement(item, onToggleMilestone, onDeleteMilestone, onEditMilestone)
      );
    });
  }

  const upcoming = milestones.filter(m => !m.completed);
  const overviewSubset = upcoming.length > 0 ? upcoming.slice(0, 3) : milestones.slice(0, 3);
  overviewSubset.forEach(item => {
    if (overviewList) {
      overviewList.appendChild(createTimelineNodeElement(item, onToggleMilestone, null, null));
    }
  });
}

/**
 * @fileoverview Vendor directory and task checklist renderers for AuraEvent planner.
 * Handles vendor tables, contract lifecycles, and interactive checklist rows.
 */

import { formatCurrency, sanitizeHTML } from '../utils.js';

/**
 * Creates a single checklist task row DOM element.
 * @param {import('../types.js').VendorChecklistTask} task - Checklist item.
 * @param {Function|null} onToggle - Toggle callback.
 * @param {Function|null} onDelete - Delete callback.
 * @returns {HTMLLIElement} Formatted list item.
 */
function createChecklistRowElement(task, onToggle, onDelete) {
  const li = document.createElement('li');
  li.className = `vendor-checklist-row ${task.completed ? 'completed' : ''}`;
  li.innerHTML = `
    <label style="display: flex; align-items: center; gap: var(--space-2); cursor: pointer; margin: 0; flex: 1;">
      <input type="checkbox" class="chk-task-toggle" ${task.completed ? 'checked' : ''} aria-label="${sanitizeHTML(task.text)}">
      <span style="${task.completed ? 'text-decoration: line-through; color: var(--color-text-tertiary);' : 'font-weight: 500;'}">${sanitizeHTML(task.text)}</span>
    </label>
    <button type="button" class="btn btn-outline btn-sm btn-delete-task" style="margin-left: var(--space-2);" aria-label="Delete task">Remove</button>
  `;
  li.querySelector('.chk-task-toggle')?.addEventListener(
    'change',
    () => onToggle && onToggle(task.id)
  );
  li.querySelector('.btn-delete-task')?.addEventListener(
    'click',
    () => onDelete && onDelete(task.id)
  );
  return li;
}

/**
 * Renders vendor checklist tasks section.
 * @param {import('../types.js').VendorChecklistTask[]} tasks - Vendor checklist items.
 * @param {Function|null} onToggleChecklist - Toggle task completion.
 * @param {Function|null} onDeleteChecklist - Delete task.
 */
function renderVendorChecklist(tasks, onToggleChecklist, onDeleteChecklist) {
  const checklistContainer = document.getElementById('vendor-checklist-items');
  const checklistCounter = document.getElementById('vendor-checklist-counter');

  if (checklistCounter) {
    const completedCount = tasks.filter(t => t.completed).length;
    checklistCounter.textContent = `${completedCount} / ${tasks.length} Completed`;
  }

  if (!checklistContainer) return;
  checklistContainer.innerHTML = '';

  if (tasks.length === 0) {
    checklistContainer.innerHTML =
      '<li style="color: var(--color-text-tertiary); font-size: var(--text-sm); padding: var(--space-2) 0;">No checklist tasks added yet. Add a vendor task above.</li>';
    return;
  }

  tasks.forEach(task => {
    checklistContainer.appendChild(
      createChecklistRowElement(task, onToggleChecklist, onDeleteChecklist)
    );
  });
}

/**
 * Renders vendor directory table rows.
 * @param {import('../types.js').Vendor[]} vendors - Vendor records.
 * @param {string} currency - Currency code.
 * @param {Function} onDeleteVendor - Delete callback.
 * @param {Function} onUpdateVendorStatus - Status advance callback.
 * @param {Function|null} onEditVendor - Edit callback.
 */
function renderVendorTable(vendors, currency, onDeleteVendor, onUpdateVendorStatus, onEditVendor) {
  const tbody = document.getElementById('vendor-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (vendors.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; color: var(--color-text-tertiary); padding: 2rem;">No vendors added yet. Click "Add Vendor" above.</td></tr>';
    return;
  }

  vendors.forEach(ven => {
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
          <button type="button" class="btn btn-outline btn-sm btn-delete-ven" data-id="${sanitizeHTML(ven.id)}" aria-label="Delete vendor ${sanitizeHTML(ven.name)}">
            Remove
          </button>
        </div>
      </td>
    `;
    tr.querySelector('.btn-advance-ven')?.addEventListener(
      'click',
      () => onUpdateVendorStatus && onUpdateVendorStatus(ven.id)
    );
    tr.querySelector('.btn-edit-ven')?.addEventListener(
      'click',
      () => onEditVendor && onEditVendor(ven.id)
    );
    tr.querySelector('.btn-delete-ven')?.addEventListener('click', () => onDeleteVendor(ven.id));
    tbody.appendChild(tr);
  });
}

/**
 * Renders vendor directory rows, overview cards, and checklist tasks.
 * Single coordinator delegating to sub-renderers.
 * @param {import('../types.js').Celebration} event - Active event object.
 * @param {Function} onDeleteVendor - Delete callback.
 * @param {Function} onUpdateVendorStatus - Update status callback.
 * @param {Function|null} [onEditVendor=null] - Edit vendor callback.
 * @param {Function|null} [onToggleChecklist=null] - Toggle task callback.
 * @param {Function|null} [onDeleteChecklist=null] - Delete task callback.
 */
export function renderVendorModule(
  event,
  onDeleteVendor,
  onUpdateVendorStatus,
  onEditVendor = null,
  onToggleChecklist = null,
  onDeleteChecklist = null
) {
  const currency = event.currency || 'USD';
  const vendors = Array.isArray(event.vendors) ? event.vendors : [];
  const overviewList = document.getElementById('overview-vendors-list');

  renderVendorTable(vendors, currency, onDeleteVendor, onUpdateVendorStatus, onEditVendor);

  if (overviewList) {
    overviewList.innerHTML = '';
    if (vendors.length === 0) {
      overviewList.innerHTML =
        '<p style="color: var(--color-text-tertiary); font-size: var(--text-sm); padding: var(--space-2) 0;">No vendors currently registered.</p>';
    } else {
      vendors.slice(0, 3).forEach(ven => {
        const div = document.createElement('div');
        div.style.padding = '0.5rem 0';
        div.style.borderBottom = '1px solid var(--color-border-subtle)';
        div.innerHTML = `<strong>${sanitizeHTML(ven.name)}</strong> (${sanitizeHTML(ven.category)}) — <span class="badge ${ven.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}">${sanitizeHTML(ven.status)}</span>`;
        overviewList.appendChild(div);
      });
    }
  }

  const tasks = Array.isArray(event.vendorChecklist) ? event.vendorChecklist : [];
  renderVendorChecklist(tasks, onToggleChecklist, onDeleteChecklist);
}

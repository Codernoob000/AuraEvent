/**
 * @fileoverview Expense creation and editing modal form bindings.
 */

import { generateUUID } from '../utils.js';
import { handleFormAction } from './helpers.js';

/**
 * Binds expense creation and editing forms.
 * @param {Object} handlers - Event manipulation functions.
 */
export function bindExpenseForms(handlers) {
  document.getElementById('form-add-expense')?.addEventListener('submit', e => {
    handleFormAction(
      e,
      handlers,
      event => {
        const desc = document.getElementById('exp-description')?.value.trim();
        if (!desc) {
          handlers.showToast('Please enter an expense description.', 'error');
          return false;
        }
        event.expenses.push({
          id: generateUUID(),
          category: document.getElementById('exp-category').value,
          description: desc,
          estimated: Number(document.getElementById('exp-estimated').value) || 0,
          actual: Number(document.getElementById('exp-actual').value) || 0,
          status: document.getElementById('exp-status').value
        });
        return true;
      },
      'Expense item added successfully.'
    );
  });

  document.getElementById('form-edit-expense')?.addEventListener('submit', e => {
    handleFormAction(
      e,
      handlers,
      event => {
        const id = document.getElementById('edit-exp-id').value;
        const item = (event.expenses || []).find(x => x.id === id);
        if (!item) return false;
        item.category = document.getElementById('edit-exp-category').value;
        item.description = document.getElementById('edit-exp-description').value.trim();
        item.estimated = Number(document.getElementById('edit-exp-estimated').value) || 0;
        item.actual = Number(document.getElementById('edit-exp-actual').value) || 0;
        item.status = document.getElementById('edit-exp-status').value;
        return true;
      },
      'Expense item updated.'
    );
  });
}


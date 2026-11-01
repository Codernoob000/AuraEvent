/**
 * @fileoverview Milestone creation and editing modal form bindings.
 */

import { generateUUID } from '../utils.js';
import { handleFormAction } from './helpers.js';

/**
 * Binds milestone creation and editing forms.
 * @param {Object} handlers - Event manipulation functions.
 */
export function bindMilestoneForms(handlers) {
  document.getElementById('form-add-milestone')?.addEventListener('submit', e => {
    handleFormAction(
      e,
      handlers,
      event => {
        const title = document.getElementById('ms-title')?.value.trim();
        if (!title) {
          handlers.showToast('Please provide a milestone title.', 'error');
          return false;
        }
        event.milestones.push({
          id: generateUUID(),
          title: title,
          phase: document.getElementById('ms-phase').value,
          date: document.getElementById('ms-date').value,
          notes: document.getElementById('ms-notes').value.trim(),
          completed: false
        });
        return true;
      },
      'Run-of-show milestone created.'
    );
  });

  document.getElementById('form-edit-milestone')?.addEventListener('submit', e => {
    handleFormAction(
      e,
      handlers,
      event => {
        const id = document.getElementById('edit-ms-id').value;
        const item = (event.milestones || []).find(x => x.id === id);
        if (!item) return false;
        item.title = document.getElementById('edit-ms-title').value.trim();
        item.phase = document.getElementById('edit-ms-phase').value;
        item.date = document.getElementById('edit-ms-date').value;
        item.notes = document.getElementById('edit-ms-notes').value.trim();
        return true;
      },
      'Milestone updated.'
    );
  });
}


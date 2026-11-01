/**
 * @fileoverview Vendor registration and checklist modal form bindings.
 */

import { generateUUID } from '../utils.js';
import { handleFormAction } from './helpers.js';

/**
 * Binds vendor creation and editing forms.
 * @param {Object} handlers - Event manipulation functions.
 */
export function bindVendorForms(handlers) {
  document.getElementById('form-add-vendor')?.addEventListener('submit', e => {
    handleFormAction(
      e,
      handlers,
      event => {
        const name = document.getElementById('ven-name')?.value.trim();
        if (!name) {
          handlers.showToast('Please provide a vendor name.', 'error');
          return false;
        }
        event.vendors.push({
          id: generateUUID(),
          category: document.getElementById('ven-category').value,
          name: name,
          contact: document.getElementById('ven-contact').value.trim(),
          fee: Number(document.getElementById('ven-fee').value) || 0,
          status: document.getElementById('ven-status').value
        });
        return true;
      },
      'Vendor partner registered.'
    );
  });

  document.getElementById('form-edit-vendor')?.addEventListener('submit', e => {
    handleFormAction(
      e,
      handlers,
      event => {
        const id = document.getElementById('edit-ven-id').value;
        const item = (event.vendors || []).find(x => x.id === id);
        if (!item) return false;
        item.category = document.getElementById('edit-ven-category').value;
        item.name = document.getElementById('edit-ven-name').value.trim();
        item.contact = document.getElementById('edit-ven-contact').value.trim();
        item.fee = Number(document.getElementById('edit-ven-fee').value) || 0;
        item.status = document.getElementById('edit-ven-status').value;
        return true;
      },
      'Vendor updated.'
    );
  });
}

/**
 * Binds vendor checklist task addition form.
 * @param {Object} handlers - Event manipulation functions.
 */
export function bindChecklistForm(handlers) {
  document.getElementById('form-add-checklist-task')?.addEventListener('submit', e => {
    e.preventDefault();
    const event = handlers.getActiveEvent();
    const input = document.getElementById('input-checklist-task');
    const taskText = input?.value?.trim();
    if (taskText && event) {
      event.vendorChecklist = Array.isArray(event.vendorChecklist) ? event.vendorChecklist : [];
      event.vendorChecklist.push({
        id: generateUUID(),
        text: taskText,
        completed: false
      });
      handlers.persistAndSync();
      handlers.refreshActiveView();
      if (input) input.value = '';
      handlers.showToast('Vendor task added to checklist.');
    }
  });
}


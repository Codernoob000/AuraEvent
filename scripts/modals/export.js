/**
 * @fileoverview Export and import operations for AuraEvent celebrations.
 * Handles iCalendar (.ics) exports, JSON backups, and backup restorations.
 */

import { generateUUID, generateICalendarPayload, triggerFileDownload } from '../utils.js';
import { APP_CONFIG } from '../config.js';
import { closeModals } from './core.js';

/**
 * Handles restoring celebration data from user-selected JSON file.
 * @param {Event} e - Input change event.
 * @param {Function} onEventCreated - Creation callback.
 * @param {Function} showToast - Toast notifier.
 */
export function handleJsonRestoreFile(e, onEventCreated, showToast) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = event => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (!parsed || typeof parsed !== 'object' || !parsed.name) {
        showToast('Invalid backup file structure.', 'error');
        return;
      }
      const restored = {
        id: parsed.id || generateUUID(),
        name: String(parsed.name).slice(0, APP_CONFIG.LIMITS.MAX_EVENT_NAME_LENGTH),
        type: parsed.type || 'Wedding',
        date: parsed.date || new Date().toISOString().split('T')[0],
        budget: Number(parsed.budget) || APP_CONFIG.LIMITS.DEFAULT_BUDGET,
        guestCount: Number(parsed.guestCount) || APP_CONFIG.LIMITS.DEFAULT_GUESTS,
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
        vendors: Array.isArray(parsed.vendors) ? parsed.vendors : []
      };
      onEventCreated(restored);
      closeModals();
      showToast(`Celebration "${restored.name}" restored from backup!`);
    } catch (_parseError) {
      showToast('Failed to parse backup JSON file.', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

/**
 * Configures export and Google Calendar synchronization actions.
 * @param {Object} context - Event context and notifications.
 * @param {Function} context.getActiveEvent - Active celebration accessor.
 * @param {Function} context.showToast - Toast notification callback.
 * @param {Function} context.onEventCreated - Event restoration callback.
 */
export function setupExportActions(context) {
  const { getActiveEvent, showToast, onEventCreated } = context;

  document.getElementById('btn-export-ical')?.addEventListener('click', () => {
    const activeEvt = getActiveEvent();
    const payload = generateICalendarPayload(activeEvt);
    const fileName = `${activeEvt.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_schedule.ics`;
    triggerFileDownload(payload, fileName, 'text/calendar');
    showToast('iCalendar (.ics) schedule downloaded.');
  });

  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    const activeEvt = getActiveEvent();
    const jsonStr = JSON.stringify(activeEvt, null, 2);
    const fileName = `${activeEvt.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_backup.json`;
    triggerFileDownload(jsonStr, fileName, 'application/json');
    showToast('Event backup file exported.');
  });

  document.getElementById('input-restore-json')?.addEventListener('change', e => {
    handleJsonRestoreFile(e, onEventCreated, showToast);
  });
}

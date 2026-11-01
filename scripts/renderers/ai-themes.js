/**
 * @fileoverview Aesthetic themes and strategic vendor questions renderers for AI Atelier.
 */

import { sanitizeHTML, resolveCssColor } from '../utils.js';

/**
 * Renders curated aesthetic themes and swatches sub-section.
 * @param {import('../types.js').AIPlan} plan - Normalized AI plan object.
 * @param {Function} [onPlanUpdated] - Notification callback when user edits fields.
 * @returns {HTMLElement} The constructed themes section element.
 */
export function renderThemesSection(plan, onPlanUpdated) {
  const themesSection = document.createElement('div');
  themesSection.className = 'ai-section-box';
  themesSection.innerHTML = `
    <div class="ai-section-box-header">
      <h4 class="ai-section-box-title">🎨 Curated Themes &amp; Color Palettes</h4>
      <span style="font-size: var(--text-xs); color: var(--color-text-secondary);">Editable aesthetic concepts</span>
    </div>
  `;

  (plan.themes || []).forEach(theme => {
    const card = document.createElement('div');
    card.className = 'theme-card';
    card.style.marginBottom = 'var(--space-3)';

    const titleRow = document.createElement('div');
    titleRow.style.marginBottom = '0.5rem';
    titleRow.innerHTML = `
      <label class="form-label" style="font-size: var(--text-xs); margin-bottom: 2px;">Theme Concept Title</label>
      <input type="text" class="ai-inline-input ai-theme-title-input" value="${sanitizeHTML(theme.title)}" style="font-weight: 700; font-size: var(--text-base);">
    `;
    titleRow.querySelector('.ai-theme-title-input').addEventListener('input', e => {
      theme.title = e.target.value.trim();
      if (onPlanUpdated) onPlanUpdated(plan);
    });

    const concept = document.createElement('p');
    concept.style.cssText =
      'font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: 0.5rem;';
    concept.textContent = theme.concept || '';

    const swatchesContainer = document.createElement('div');
    swatchesContainer.className = 'theme-palette-swatches';

    const palette = Array.isArray(theme.decorPalette) ? theme.decorPalette : [];
    palette.forEach((col, idx) => {
      const hex = resolveCssColor(col, idx);
      const labelText =
        typeof col === 'string' && col.length > 1 && !col.startsWith('#') ? col : hex;

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
    tip.style.cssText =
      'font-size: var(--text-xs); color: var(--color-accent-hover); font-weight: 600;';
    tip.textContent = `💡 Pro Tip: ${theme.budgetTip || 'Balance core aesthetics with vendor costs.'}`;

    card.appendChild(titleRow);
    card.appendChild(concept);
    card.appendChild(swatchesContainer);
    card.appendChild(tip);
    themesSection.appendChild(card);
  });

  return themesSection;
}

/**
 * Renders strategic vendor questions sub-section.
 * @param {import('../types.js').AIPlan} plan - Normalized AI plan object.
 * @returns {HTMLElement|null} The constructed questions box or null if empty.
 */
export function renderVendorQuestionsSection(plan) {
  const questions = Array.isArray(plan.vendorQuestions) ? plan.vendorQuestions : [];
  if (questions.length === 0) return null;

  const qBox = document.createElement('div');
  qBox.className = 'ai-section-box';
  qBox.innerHTML = `
    <h4 class="ai-section-box-title" style="margin-bottom: 0.5rem;">📋 Strategic Vendor Interview Questions</h4>
    <ul style="padding-left: 1.25rem; font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.6;">
      ${questions.map(q => `<li>${sanitizeHTML(q)}</li>`).join('')}
    </ul>
  `;
  return qBox;
}


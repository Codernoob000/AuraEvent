// Real-browser in-page functional verification module
import { formatCurrency, calculateDetailedCountdown } from '../scripts/utils.js';

function runChecks() {
  const results = {
    checks: [],
    errors: []
  };

  function assert(name, condition, details = '') {
    if (condition) {
      results.checks.push({ name, status: 'PASS', details: String(details) });
    } else {
      results.checks.push({ name, status: 'FAIL', details: String(details) });
      results.errors.push(`Assertion failed: ${name} - ${details}`);
    }
  }

  try {
    // 1. Obsolete Gemini 1.5 Promo Check
    const promoCard = document.getElementById('card-gemini-promo');
    assert('Obsolete Gemini 1.5 promo card removed from DOM', promoCard === null, 'card-gemini-promo does not exist');

    // 2. Readiness & Action Center Present
    const readinessCenter = document.querySelector('.readiness-action-center');
    assert('Readiness & Action Center present in DOM', readinessCenter !== null, 'Replaces obsolete promo card');
    const readinessPct = document.getElementById('readiness-pct-text');
    assert('Readiness percentage gauge rendered', readinessPct && readinessPct.textContent.includes('%'), readinessPct?.textContent);
    const readinessStatus = document.getElementById('readiness-status-pill');
    assert('Readiness status pill active', readinessStatus && readinessStatus.textContent.length > 0, readinessStatus?.textContent);

    // 3. Countdown Clock Values
    const days = document.getElementById('countdown-days');
    const hours = document.getElementById('countdown-hours');
    const mins = document.getElementById('countdown-mins');
    const secs = document.getElementById('countdown-secs');
    assert('Countdown clock slots all present', days && hours && mins && secs, 'Days, Hours, Mins, Secs present');
    assert('Countdown days value computed', days && parseInt(days.textContent, 10) >= 0, `Days remaining: ${days?.textContent}`);

    // 4. Hero Banner and Monogram
    const heroTitle = document.getElementById('hero-event-title');
    assert('Hero title rendered', heroTitle && heroTitle.textContent.length > 0, heroTitle?.textContent);
    const brandCrest = document.querySelector('.brand-crest');
    assert('Brand crest monogram present', brandCrest !== null, 'Crest with champagne gold styling');

    // 5. Active Celebration Identity Badge
    const navBadge = document.getElementById('nav-event-type-badge');
    assert('Nav celebration type badge rendered', navBadge && navBadge.textContent.length > 0, navBadge?.textContent);

    // 6. Event Selector Dropdown
    const selector = document.getElementById('event-select-input');
    assert('Event workspace selector populated', selector && selector.options.length >= 4, `Options: ${selector?.options.length}`);

    // 7. Test Theme Attribute on Body
    assert('Body has data-event-type attribute', document.body.hasAttribute('data-event-type'), document.body.getAttribute('data-event-type'));

    // 8. Test Navigation Tabs
    const tabs = document.querySelectorAll('.nav-tab');
    assert('Navigation tabs count equals 5', tabs.length === 5, 'Overview, Budget, Timeline, Vendors, AI Atelier');

    // 9. Budget Math & Category Distribution
    const budgetCeiling = document.getElementById('overview-planned-ceiling');
    const budgetSpent = document.getElementById('overview-allocated-spend');
    const budgetRemaining = document.getElementById('overview-remaining-balance');
    const budgetBars = document.getElementById('budget-category-bars');
    assert('Budget metric displays present', budgetCeiling && budgetSpent && budgetRemaining, 'Ceiling, Spend, Remaining');
    assert('Category spending distribution bars present', budgetBars !== null && budgetBars.children.length > 0, `Category bars: ${budgetBars?.children.length}`);

    // 10. Timeline Phase Filter Ribbon
    const filterButtons = document.querySelectorAll('.btn-timeline-filter');
    assert('Timeline phase filter ribbon present', filterButtons.length >= 6, `Found ${filterButtons.length} filter buttons`);

    // 11. Modal Form Controls Accessibility (Labels)
    const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
    let missingLabels = 0;
    inputs.forEach(input => {
      const id = input.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledby = input.getAttribute('aria-labelledby');
        if (!label && !ariaLabel && !ariaLabelledby) {
          missingLabels++;
        }
      }
    });
    assert('All form controls have accessible labels', missingLabels === 0, `Missing labels: ${missingLabels}`);

    // 12. Skip to Content Link
    const skipLink = document.querySelector('.skip-link');
    assert('Skip link present and points to #main-content', skipLink && skipLink.getAttribute('href') === '#main-content');

    // 13. AI Atelier Model Metadata
    const modelTag = document.getElementById('ai-plan-model-tag');
    assert('AI Atelier model tag specifies gemini-3.8-flash', modelTag && modelTag.textContent.includes('gemini-3.8-flash'), modelTag?.textContent);

    // 14. Plan Confirmation Modal & Saved Plans Modal
    const confirmModal = document.getElementById('modal-apply-plan-preview');
    assert('Safe plan confirmation modal present in DOM', confirmModal !== null, 'modal-apply-plan-preview');
    const savedPlansModal = document.getElementById('modal-saved-plans');
    assert('Saved plans modal present in DOM', savedPlansModal !== null, 'modal-saved-plans');

    // 15. Currency Formatting Math
    const formattedINR = formatCurrency(125000, 'INR');
    assert('INR currency formatting verified in browser', formattedINR.includes('₹') && formattedINR.includes('1,25,000'), formattedINR);

    // 16. Detailed Countdown Calculation Math
    const cd = calculateDetailedCountdown('2026-11-20T12:00:00Z');
    assert('Detailed countdown object verified in browser', typeof cd.days === 'number' && typeof cd.hours === 'number', `Days: ${cd.days}`);

  } catch (err) {
    results.errors.push('Harness error: ' + err.message);
  }

  const el = document.createElement('div');
  el.id = 'HARNESS_OUTPUT';
  el.textContent = JSON.stringify(results);
  document.body.appendChild(el);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(runChecks, 500));
} else {
  setTimeout(runChecks, 500);
}

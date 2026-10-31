# AuraEvent — Prioritized Fix Plan & Engineering Roadmap

This roadmap organizes all identified improvements, architectural hardening opportunities, and feature enhancements by priority tier. Each action item includes affected files, user impact, step-by-step implementation procedures, and verification criteria.

---

## Priority 1: Critical (Security, Data Integrity & Core Execution)

### Item 1.1: Content Security Policy & Inline Swatch Rendering Fix
- **Status:** **COMPLETED & VERIFIED**
- **Affected Files:** `server.js`, `index.html`, `scripts/ui-renderers.js`, `scripts/utils.js`, `styles/main.css`.
- **User Impact:** Color palette swatches in the AI Inspiration Atelier previously appeared blank/white because CSP blocked inline styles and color parsing lacked normalization for compound color names.
- **Implementation Steps:**
  1. Updated `style-src` in `server.js` and `index.html` to permit `'unsafe-inline'`.
  2. Implemented comprehensive multi-tier parsing in `scripts/utils.js` (`resolveCssColor`) supporting 6-digit hexes, embedded hexes, named colors, and objects.
  3. Switched `renderAIResults` in `scripts/ui-renderers.js` to direct DOM construction with `element.style.backgroundColor` and CSS property setting.
  4. Added `.color-swatch` CSS custom property fallback in `styles/main.css`.
- **Verification:** Tested with `#8B0000`, `#FFD700`, `#E67E22`, `Copper`, `Sage Green`, `Emerald Green (#043927)`. Automated test passing in `tests/run_tests.js`.

### Item 1.2: Global `.hidden` CSS Utility & AI Loading Shimmer Repair
- **Status:** **COMPLETED & VERIFIED**
- **Affected Files:** `styles/main.css`, `index.html`.
- **User Impact:** An 80px grey rectangular shimmer box was permanently visible on screen before, during, and after AI generation because `.hidden` was only defined for modal elements.
- **Implementation Steps:**
  1. Added global `.hidden { display: none !important; }` in `styles/main.css`.
  2. Enhanced `#ai-loading-indicator` with an accessible spinner and descriptive message.
  3. Ensured zero layout shift when idle.
- **Verification:** Verified element is completely hidden on page load and reappears only while an AI generation request is in flight.

### Item 1.3: Cryptographic Event Ownership Token Enforcement
- **Status:** **COMPLETED & VERIFIED**
- **Affected Files:** `server.js`, `scripts/api.js`.
- **User Impact:** Prevents malicious clients or script injections from mutating another user's event data by guessing or targeting event IDs.
- **Implementation Steps:**
  1. On creation of an event in `server.js`, a 128-bit UUID `ownerToken` is assigned and associated with the record.
  2. Client stores this token in `localStorage` under `aura_owner_${eventId}`.
  3. Subsequent `PUT` requests require header `x-event-token: <token>`.
  4. Mismatches return `403 Forbidden`.
- **Verification:** Automated security test `Security: Rule 4 (Event Ownership)` verifies rejection of unauthorized mutations.

---

## Priority 2: High (Noticeable Bugs, Degraded UX & Resilience)

### Item 2.1: Multi-Tier Gemini 3 Fallback Hierarchy
- **Status:** **COMPLETED & VERIFIED**
- **Affected Files:** `services/geminiService.js`, `tests/run_tests.js`.
- **User Impact:** Prevents user-facing HTTP 503 errors and hanging requests when Google Gemini 3.8 Flash experiences regional queue congestion.
- **Implementation Steps:**
  1. Primary model set to `gemini-3.8-flash` with a 35-second abort signal.
  2. Fallback tier 1 targets `gemini-3.6-flash`.
  3. Fallback tier 2 targets `gemini-3-flash-preview`.
  4. Terminal fallback activates `getCuratedOfflinePlan()`.
  5. Response JSON includes safe metadata: `modelUsed`, `fallbackTriggered`, and `isFallback`.
- **Verification:** Automated tests verify fallback progression without throwing unhandled exceptions.

### Item 2.2: JSON Backup Schema Validation on Restore
- **Status:** **COMPLETED & VERIFIED**
- **Affected Files:** `scripts/modal-controller.js`, `tests/run_tests.js`.
- **User Impact:** Prevents app state corruption if a user attempts to upload an invalid, malformed, or hostile JSON backup.
- **Implementation Steps:**
  1. Wrap `JSON.parse()` in `try/catch`.
  2. Enforce `Array.isArray(parsed)`.
  3. Validate mandatory fields (`id`, `name`, `type`, `date`, `budget`) on every restored element.
  4. Show clear error toasts on validation failure.
- **Verification:** Automated test `Critical Path: JSON Backup Integrity` confirms rejection of malformed or invalid schemas.

---

## Priority 3: Medium (Polish, Edge Cases & Performance)

### Item 3.1: Expense & Vendor Table Responsive Scrolling
- **Affected Files:** `styles/main.css`, `index.html`.
- **User Impact:** On mobile devices (<480px width), wide expense ledgers and vendor directory tables can cause horizontal page blowout if not contained in a scroll container.
- **Implementation Steps:**
  1. Wrap `<table>` elements in `<div class="table-responsive-container">`.
  2. Apply `overflow-x: auto; -webkit-overflow-scrolling: touch;`.
  3. Add subtle shadow cues indicating horizontal scrollability.
- **Verification:** Test on mobile viewport (375x667px); verify page body does not scroll horizontally.

### Item 3.2: Multi-Currency & Locale Support
- **Affected Files:** `scripts/utils.js`, `scripts/ui-renderers.js`.
- **User Impact:** International users planning celebrations outside the United States may require EUR (€), GBP (£), CAD ($), or AUD ($) formatting.
- **Implementation Steps:**
  1. Add currency selector to celebration creation modal.
  2. Upgrade `formatCurrency()` to accept currency code (default `'USD'`) utilizing `Intl.NumberFormat(navigator.language, { style: 'currency', currency })`.
- **Verification:** Test formatted outputs for `$10,000`, `€10.000`, and `£10,000`.

---

## Priority 4: Low (Cosmetic Enhancements & Future Scope)

### Item 4.1: Drag-and-Drop Run-of-Show Reordering
- **Affected Files:** `scripts/ui-renderers.js`, `scripts/app.js`.
- **User Impact:** Users can re-order timeline milestones interactively using pointer drag interactions rather than editing milestone timestamps.
- **Implementation Steps:**
  1. Add HTML5 `draggable="true"` to `.timeline-card` elements.
  2. Add drag start, drag over, and drop event listeners.
  3. Recompute milestone sequence and call `persistAndSync()`.
- **Verification:** Drag milestone up or down; verify timeline updates and persists post-refresh.

### Item 4.2: Vendor PDF Contract Attachment Preview
- **Affected Files:** `scripts/modal-controller.js`, `index.html`.
- **User Impact:** Event organizers can attach local PDF invoices or contracts to vendor records.
- **Implementation Steps:**
  1. Store file metadata and Base64 representation in IndexedDB (bypassing localStorage 5MB limit).
  2. Display download/preview badge on vendor row.
- **Verification:** Upload sample PDF; verify file opens in new tab.


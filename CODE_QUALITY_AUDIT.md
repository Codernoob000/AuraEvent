# AuraEvent — Comprehensive Code Quality & Architectural Audit (99+ Target)

**Evaluator Score Baseline:** 89/100  
**Target Score:** 99+/100  
**Standard:** Clean Code, Single Responsibility Principle, Zero Warnings, Zero Regressions

---

## 1. Concrete Issues Catalog by Category

### A. Long Functions (>40 lines) & Deep Nesting
1. **`services/geminiService.js`**:
   - `buildGeminiPrompt` (lines 65–162, 98 lines): Large inline JSON schema template embedded in template literal.
   - `queryGeminiApi` (lines 176–261, 86 lines): Monolithic function with nested `dispatchModelRequest` (lines 196–236, 41 lines) and fallback iteration.
   - `getCuratedOfflinePlan` (lines 269–373, 105 lines): Large hardcoded data structure generator.
2. **`scripts/utils.js`**:
   - `resolveCssColor` (lines 247–330, 84 lines): Re-creates a 40+ key `COLOR_NAME_MAP` object inside the function body on every single invocation.
   - `normalizeAIPlan` (lines 357–538, 182 lines): Monolithic normalization routine handling themes, budget, milestones, and vendors in one giant function.
   - `applyRecommendationsToCelebration` (lines 591–675, 85 lines): Single function handling 3 distinct domain entities (expenses, milestones, vendors).
3. **`scripts/ui-renderers.js`**:
   - `renderMastheadMetrics` (lines 13–150, 138 lines): Multi-responsibility function updating top navbar badge, metric cards, hero banner, countdown, left column operations, and readiness center.
   - `renderVendorModule` (lines 427–518, 92 lines): Manages vendor table rows, overview list items, checklist progress counter, and checklist items.
   - `renderPlanPreviewModal` (lines 1016–1100, 85 lines): Combines candidate filtering, de-duplication scanning across 3 collections, cost summation, and DOM HTML templating.
4. **`scripts/modal-controller.js`**:
   - `setupModals` (lines 93–167, 75 lines): Long registration loop for all open/close listeners.
   - `setupFormSubmissions` (lines 203–346, 144 lines): Registers 8 separate form submission handlers in a single routine.
   - `setupExportActions` (lines 352–403, 52 lines): Export and JSON restore file reader handling.
5. **`scripts/app.js`**:
   - `setupAIWorkshop` (lines 351–471, 121 lines): AI generation event listener, regenerate button, save plan button, view saved plans modal, apply entire/selected triggers, confirm apply listener.
   - `refreshActiveView` (lines 87–129, 43 lines): Coordinates theme attributes, countdown ticker, metrics, budget, timeline, vendors, badges, and workspace inputs.
   - `initializeApp` (lines 489–537, 49 lines): State hydration, listeners, deep linking parameter parsing.
6. **`scripts/api.js`**:
   - `getOfflineEventInspiration` (lines 94–198, 105 lines): Redundant structure duplicating curated plan generation.

---

### B. Dead Code, Unused Imports/Variables, Commented-out Code
1. **`scripts/ui-renderers.js`**:
   - `import { ..., calculateDetailedCountdown, ... } from './utils.js';` — `calculateDetailedCountdown` is imported but never called (`renderCountdownDisplay` is used instead).
2. **`scripts/app.js`**:
   - `import { ..., calculateMilestoneDate, ..., calculateDetailedCountdown, ... } from './utils.js';` — both `calculateMilestoneDate` and `calculateDetailedCountdown` are imported but never invoked.
3. **`scripts/config.js`**:
   - Line 7: `/* eslint-disable no-unused-vars */` — linter suppression comment instead of clean explicit exports.

---

### C. Missing or Weak Error Handling (Silent Catch Blocks, Unhandled Promises)
1. **`scripts/events-data.js`**:
   - Line 157: Silent `catch { // Storage quota handled gracefully }` — does not capture error instance or warn.
   - Line 173: Silent `catch { // Fallback to first item }`.
   - Line 186: Silent `catch { // Silently continue }`.
2. **`scripts/api.js`**:
   - Line 28: Silent `catch { // Keep fallback message if JSON parsing fails }`.
   - Line 232: Silent `catch { // Ignore private browsing storage restriction }`.
   - Line 256: Silent `catch { // Ignore write failure }`.
3. **`scripts/app.js`**:
   - Line 64: `syncEventData(activeEvt).catch(() => {});` — unhandled promise rejection suppression.
   - Line 534: Silent `catch { // Deep linking non-blocking enhancement }`.
4. **`scripts/utils.js`**:
   - `normalizeAIPlan(plan, null)` crashes with `TypeError: Cannot read properties of null (reading 'budget')` because default parameter only covers `undefined`, not `null`.
5. **`services/geminiService.js`**:
   - Line 258: `catch { return getCuratedOfflinePlan(params); }` — omits error parameter and audit logging.

---

### D. Magic Numbers & Unextracted Constants
1. **`server.js`**:
   - Rate limit windows (`60 * 1000`), max counts (`60`, `10`, `15`), retry-after (`60`), JSON body limit (`1mb`), token threshold (`400`), budget ceiling (`10000000`), guest limit (`50000`), owner token length (`16`).
2. **`services/geminiService.js`**:
   - Timeout milliseconds (`35000`), max output tokens (`1500`), temperature (`0.7`), rolling window (`60 * 60 * 1000`), max budget (`10000`).
3. **`scripts/utils.js`**:
   - Milliseconds per day (`86400000`), seconds per hour (`3600`), calendar duration (`2`).
4. **`scripts/config.js`**:
   - Missing constants for timeline phases (`Planning`, `Preparation`, `Execution`, `Day of`, `Breakdown`), payment statuses (`Paid in Full`, `Deposit Paid`, `Pending`), and validation limits.

---

### E. Missing or Incomplete JSDoc / Type Annotations
1. **`server.js`**: Express route callbacks lack `@param` and `@returns` documentation; Zod schemas lack detailed JSDoc.
2. **`services/geminiService.js`**: `dispatchModelRequest` lacks JSDoc; `buildGeminiPrompt` parameters lack detailed property typing.
3. **`scripts/ui-renderers.js`**: Sub-renderer functions lack complete `@param` definitions.
4. **`scripts/modal-controller.js`**: Sub-handlers lack documentation for event target signatures and return types.
5. **`scripts/app.js`**: State variables and internal event dispatchers lack JSDoc.

---

## 2. Systematic Refactoring Plan

| Phase | Target Module | Concrete Changes |
| :--- | :--- | :--- |
| **Phase 2.1** | `scripts/config.js` | Add `TIMELINE_PHASES`, `EXPENSE_STATUSES`, `LIMITS`, `TIMEOUTS`, `COLOR_PALETTES`. Remove eslint-disable. Freeze all constants. |
| **Phase 2.2** | `scripts/utils.js` | Extract `COLOR_NAME_MAP` to module scope. Add `null` guard in `normalizeAIPlan`. Decompose `normalizeAIPlan` and `applyRecommendationsToCelebration` into single-responsibility sub-helpers. Add comprehensive JSDoc. |
| **Phase 2.3** | `services/geminiService.js` | Extract request dispatcher, externalize constants, catch specific errors, provide sanitized logging, decompose prompt building. |
| **Phase 2.4** | `scripts/events-data.js` | Implement safe storage accessors (`safeGetItem`, `safeSetItem`), eliminate silent catch blocks, add complete JSDoc. |
| **Phase 2.5** | `scripts/api.js` | Replace silent catch blocks with explicit safe handlers, eliminate code duplication, improve error typing and JSDoc. |
| **Phase 2.6** | `scripts/modal-controller.js` | Decompose `setupFormSubmissions` into per-entity form binders, add input validation at boundaries, complete JSDoc. |
| **Phase 2.7** | `scripts/ui-renderers.js` | Remove unused imports. Decompose `renderMastheadMetrics`, `renderVendorModule`, and `renderPlanPreviewModal` into focused helpers. Complete JSDoc. |
| **Phase 2.8** | `scripts/app.js` | Remove unused imports. Decompose `setupAIWorkshop`. Handle promise rejections explicitly. Complete JSDoc. |
| **Phase 2.9** | `server.js` | Externalize magic constants, add comprehensive JSDoc for routes, harden error logging. |
| **Phase 2.10** | `package.json` & Tooling | Add format and code-quality scripts, verify `npm test` and `npm run lint` with 0 warnings. |

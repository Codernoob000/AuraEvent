# BLUEPRINT.md — Celebration & Event Planner (AuraEvent)
## Architecture Specification & Security-First Design Blueprint

---

## 1. Chosen Vertical & User Personas

### Vertical
**Celebration & Event Management** (Milestone Events: Weddings, Birthday Celebrations, Community Festivals & Galas).

### Core Problem & User Pain
Planning significant celebrations is notoriously chaotic. Organizers typically juggle detached spreadsheets for budgets, disjointed calendar invites for schedules, email threads for vendor negotiations, and blank-page anxiety for creative themes. A single miscalculation can trigger severe budget overrun, vendor no-shows, or timeline collapse during the event.

### Primary User Personas
1. **The Milestone Celebrant (e.g. Wedding Couple / Birthday Host)**:
   - *Needs*: High-level financial clarity, timeline milestones, inspirational theme concepts that respect budget limits, and a simple checklist of vendor requirements.
   - *Device*: Mobile during venue visits, desktop during weekend planning sessions.
2. **The Community / Non-Profit Organizer**:
   - *Needs*: Meticulous expense vs. budget allocation, multi-phase run-of-show (Setup, Welcome, Program, Teardown), vendor contact rosters, and exportable schedules for volunteers.
   - *Device*: Desktop and tablet in field conditions.

---

## 2. Problem → Feature Mapping Table

| Problem Requirement | Proposed Solution Feature | Architectural Realization |
|:---------------------|:--------------------------|:---------------------------|
| **Multi-Event Organization** (Weddings, Birthdays, Community Events) | Event Profile Switcher & Templates with customized preset budgets, schedules, and vendor checklists. | Modular state engine with predefined presets for Wedding, Birthday, and Community Gala. |
| **Budget Management & Expense Tracking** | Dynamic Category Budget Allocator with live variance calculations, cost-per-guest metrics, and visual status indicators (Under/On/Over). | Tabular ledger calculations with zero floating-point rounding errors and real-time visual progress gauges. |
| **Interactive Chronological Timelines** | Run-of-Show Chrono-Ribbon with phases (Ideation, Logistics, Ceremony, Reception, Breakdown), milestone filters, and status toggles. | Event timeline model with time-remaining countdowns and milestone completion markers. |
| **Vendor Management & Checklist** | Structured Vendor Registry with categorized contacts (Catering, Venue, Photo, Music, Decor), quotes, payment status, and actionable deliverables. | Filterable vendor directory linked directly to budget line-items for automatic cost synchronization. |
| **Personalized Event Ideas via GenAI** | AI Event Planning Workshop generating bespoke decor, schedules, theme variations, and curated vendor questions. | Backend AI Proxy communicating securely with Google Gemini API, with input sanitization, token budgeting, and output purification. |
| **Calendar Synchronization** | Google Services Integration: Google Calendar RFC 5545 `.ics` Export and direct `calendar.google.com` event synchronization. | Deterministic calendar generator converting timeline milestones into standard calendar events with reminders. |

---

## 3. Technology Stack Justification (7 Scoring Parameters)

| Component | Choice | Justification Across the 7 Parameters |
|:----------|:-------|:---------------------------------------|
| **Frontend Framework** | **Semantic HTML5, CSS3 Tokens, Vanilla ES2022 Modules** | - **Code Quality**: Zero bundler bloat, native web platform standards, clean separation of concerns.<br>- **Security**: No npm client-side supply chain vulnerabilities, zero client-side secrets, full CSP compliance.<br>- **Efficiency**: 0ms build step, sub-second initial paint, zero runtime overhead, total footprint < 150KB.<br>- **Testing**: 100% testable via standard DOM test runners without mock transformers.<br>- **Accessibility**: Native semantic elements (`<button>`, `<main>`, `<dialog>`, `<nav>`) for baseline WCAG 2.1 AA.<br>- **Problem Fit**: Instant responsiveness for planners on mobile or desktop. |
| **Client Sanitization** | **DOMPurify** | - **Security (Rule 11 & 13)**: Guarantees that GenAI-generated suggestions or user notes never execute unauthorized scripts. |
| **Backend Server** | **Node.js + Express** | - **Code Quality**: Standardized routing, middleware pipelines, modular service layer.<br>- **Security (Rules 1-13)**: Native integration with Helmet.js, express-rate-limit, CORS, and Zod.<br>- **Efficiency**: Lightweight asynchronous event loop, sub-10ms API responses.<br>- **Testing**: Simple unit and integration testing with native Node test runner. |
| **Security Middleware** | **Helmet.js** | - **Security (Rule 7)**: Strict CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-Powered-By removal. |
| **Rate Limiting** | **express-rate-limit** | - **Security (Rule 2)**: Strict 4-tier rate limits (Auth, General API, AI Proxy, Uploads) preventing DoS and cost exhaustion. |
| **Validation Engine** | **Zod** | - **Security (Rule 3)**: Strict runtime type checking, string length caps, regex validation, and input trimming on all API endpoints. |
| **AI Engine** | **Google Gemini API (1.5 Flash / 2.0)** | - **Google Services**: Official Google GenAI SDK integration with graceful fallback mode.<br>- **Security (Rule 13)**: Server-side proxy with max_tokens caps, prompt injection sanitization, and per-user token quotas. |
| **Calendar Service** | **Google Calendar Web Integration & RFC 5545 engine** | - **Google Services**: Direct URL schema generation (`calendar.google.com/calendar/render`) plus universal standard iCal export for full offline/online calendar portability. |

---

## 4. Google Services Architecture

### 1. Google Gemini API (Generative AI)
- **Role**: Creative event brainstorming assistant, vendor interview guide generator, and run-of-show schedule optimizer.
- **Architectural Flow**:
  1. Client sends event parameters (Type: "Wedding", Theme: "Vintage Autumn", Guests: 120, Budget: \$18,000) to `/api/ai/ideas`.
  2. Server rate limiter checks quota (10 requests/min per IP/user).
  3. Server Zod schema validates input boundaries (character lengths, enum values).
  4. Server sanitizes prompt to neutralize prompt injection attacks.
  5. Server calls Google Gemini API with explicit `max_tokens: 800` and temperature controls.
  6. Server tracks token consumption in a per-session ledger.
  7. Server parses and validates Gemini structured JSON response, returning clean data to client.
  8. Client sanitizes rendered output using DOMPurify before DOM insertion.
  9. **Graceful Fallback**: If `GEMINI_API_KEY` is not configured or external Google API fails, the backend seamlessly falls back to a curated, offline expert recommendation engine without application crash.

### 2. Google Calendar Integration
- **Role**: Seamless synchronization of celebration run-of-show milestones to user's Google Calendar.
- **Architectural Flow**:
  1. User selects "Export Run of Show" or "Add Milestone to Google Calendar".
  2. Client/Server generates standard RFC 5545 `.ics` payload for universal import.
  3. Direct deep-link generator constructs `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...` allowing single-click addition into the user's primary Google Calendar account.
  4. Includes location coordinates, reminders, and vendor contact info within the calendar event description.

---

## 5. File & Folder Structure

```
challenge_5/
├── .codex/
│   └── hooks.json
├── .gemini/
│   └── settings.json
├── .impeccable/
│   ├── config.local.json
│   └── surfaces/
│       └── index-html.md
├── scripts/
│   ├── api.js             # Client API layer (isolated Google Services & backend calls)
│   ├── app.js             # Main frontend application state, UI events, renderers
│   ├── config.js          # Client configuration & public endpoints (zero secrets)
│   └── utils.js           # Shared utilities (currency formatting, date math, sanitization, debounce)
├── styles/
│   └── main.css           # Atelier Chroniqueur design system tokens, layout, a11y, responsive
├── tests/
│   ├── run_tests.js       # Node.js automated test runner (Unit, Security, Integration)
│   └── test_suite.html    # Browser-based automated test runner for DOM & UI
├── .env.example           # Documented template of required environment variables
├── .gitignore             # Comprehensive exclusions (.env, node_modules, keys, coverage)
├── BLUEPRINT.md           # Architecture and security blueprint (Agent 1 deliverable)
├── CODE_REVIEW_REPORT.md  # Code quality audit report (Agent 5 deliverable)
├── DESIGN.md              # Impeccable design system specification (Agent 2 deliverable)
├── index.html             # Semantic accessible HTML5 application entry point
├── LICENSE                # MIT License
├── package.json           # Exact pinned dependencies, scripts, engines
├── PERFORMANCE_NOTES.md   # Performance & efficiency report (Agent 8 deliverable)
├── PRODUCT.md             # Impeccable product truth record
├── README.md              # Comprehensive documentation (Agent 7 deliverable)
├── SECURITY_AUDIT.md      # 13-category security compliance audit (Agent 6 deliverable)
├── server.js              # Hardened Express backend (Helmet, RateLimit, Zod, Gemini API proxy)
├── SUBMISSION_SUMMARY.md  # Final evaluation & submission summary (Agent 9 deliverable)
└── TEST_REPORT.md         # Comprehensive test execution report (Agent 4 deliverable)
```

---

## 6. Security Threat Model (13-Rule Security Constitution)

| Rule Category | Threat / Vulnerability | Mitigation Strategy |
|:--------------|:-----------------------|:--------------------|
| **Rule 1: Secrets & Env** | API keys or credentials leaked to client bundles or git repository. | - Zero hardcoded secrets in any file.<br>- All server keys stored in `.env` (gitignored).<br>- `config.js` on frontend contains only public URL routes and placeholders.<br>- Comprehensive `.env.example` with setup guide. |
| **Rule 2: Rate Limiting** | DoS, brute-force attacks, and AI quota exhaustion. | - `express-rate-limit` active on all endpoints:<br>  * General API: 60 req/min/IP<br>  * AI Proxy: 10 req/min/user<br>  * Uploads / Mutating operations: 15 req/min/IP<br>- Returns `429 Too Many Requests` with `Retry-After` header. |
| **Rule 3: Input Validation** | Malformed payloads, oversized strings, prototype pollution, injection. | - Zod schemas validate every endpoint request body.<br>- String length limits, type validation, enum whitelisting.<br>- Input strings trimmed and sanitized before processing.<br>- Rejection returns `400 Bad Request` with structured error details (no 500s). |
| **Rule 4: Auth & Ownership** | Unauthorized access, data tampering between sessions. | - Session tokens signed with strong random secrets (minimum 32 characters).<br>- Resource operations scoped to active session/event ownership.<br>- In-memory or database queries parameterized by event ID. |
| **Rule 5: Database Security** | SQL/NoSQL injection, data corruption. | - Parameterized queries or structured ORM methods exclusively.<br>- Zero string concatenation in query construction.<br>- Database credentials stored only in `.env`.<br>- Raw database error stacks stripped before client response. |
| **Rule 6: CORS Configuration** | Cross-origin request forgery from untrusted domains. | - Whitelisted explicit origin via `process.env.ALLOWED_ORIGIN`.<br>- Wildcard `*` strictly prohibited in production.<br>- Allowed HTTP methods restricted to `['GET', 'POST', 'PUT', 'DELETE']`. |
| **Rule 7: HTTP Security Headers** | Clickjacking, MIME-sniffing, XSS, information leakage. | - Helmet.js configured on Express server.<br>- CSP headers enforcing script and style origins.<br>- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.<br>- `X-Powered-By` header stripped.<br>- CSP meta tag in `index.html`. |
| **Rule 8: File Upload Security** | Malicious file execution, storage exhaustion. | - Uploads restricted to JSON event backups or receipt images.<br>- Server-side MIME type and extension validation.<br>- Strict 5MB file size limit.<br>- Uploads stored outside web root with randomized UUID filenames. |
| **Rule 9: Error Handling & Logging** | Information disclosure via stack traces or server paths. | - Central error handling middleware catches all exceptions.<br>- Generic client responses: `{"error": "Something went wrong. Please try again."}`.<br>- Detailed server-side audit logs with timestamp, route, and sanitized error context. |
| **Rule 10: Dependency Security** | Supply chain vulnerabilities, outdated packages. | - Exact pinned dependency versions in `package.json` (no `^` or `~`).<br>- Zero high/critical vulnerabilities on `npm audit`. |
| **Rule 11: XSS Prevention** | Script injection via user event notes or vendor reviews. | - No raw `innerHTML` with dynamic untrusted data.<br>- DOMPurify sanitization applied to any formatted user notes or LLM output.<br>- Native DOM APIs (`textContent`, `createElement`) used for rendering. |
| **Rule 12: Deployment Readiness** | Unintended dev flags, exposed ports in production. | - Pre-flight checklist verified before build lock.<br>- Debug logging toggled off in production mode. |
| **Rule 13: AI/LLM Security** | Prompt injection, cost runaway, data extraction. | - Browser NEVER calls Google Gemini API directly.<br>- Server-side proxy enforces `max_tokens: 800`.<br>- User prompts sanitized to filter delimiter injection.<br>- Output validated against expected schema and sanitized with DOMPurify. |

---

## 7. Accessibility Plan (WCAG 2.1 AA Compliance)

1. **Navigation Model**:
   - Skip-to-main-content link (`#main-content`) is the first focusable element on the page.
   - Distinct ARIA landmarks: `<header role="banner">`, `<nav aria-label="Main Navigation">`, `<main id="main-content">`, `<aside aria-label="AI Inspiration Workshop">`, `<footer role="contentinfo">`.
2. **Keyboard Navigation**:
   - Every interactive element is a native `<button>`, `<a>`, `<input>`, or `<select>`. Zero `<div onclick>`.
   - Modals and drawers implement focus trapping and `Escape` key listeners.
   - High-contrast, unmistakable `:focus-visible` outline rings (`2px solid #D97706`).
3. **Screen Readers & ARIA**:
   - Explicit `<label for="...">` associations for every form input.
   - `aria-live="polite"` regions for dynamic budget calculations and AI generation status.
   - Descriptive `alt` tags and `aria-hidden="true"` on purely decorative SVGs.
4. **Color Contrast & Motion**:
   - Normal text contrast ≥ 5.9:1 (surpassing 4.5:1 minimum).
   - Large text and interactive controls ≥ 4.5:1 (surpassing 3:1 minimum).
   - `@media (prefers-reduced-motion: reduce)` disables all animations and transitions.

---

## 8. Assumptions & Environment Dependencies

1. **Google Services Credentials**: The application functions out-of-the-box with full mock resilience when `GEMINI_API_KEY` is not present, while seamlessly enabling live Google Cloud Gemini AI features as soon as a key is provided in `.env`.
2. **Persistence**: The primary event planner state persists in browser `localStorage` and synchronizes with the server API (`/api/events`), enabling immediate usability without mandatory external database provisioning.
3. **Deployment**: Compatible with any standard Node.js hosting platform (Google Cloud Run, Vercel, Render) or static edge CDN paired with the Node API.


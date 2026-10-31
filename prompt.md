# 🏆 PROMPT WARS — MASTER PROMPT v3 (PERFECT SCORE EDITION)
## Google Antigravity | Multi-Agent Application Builder
## Security Framework: Taha Jaffri's Security Rules for AI-Generated Apps
## Engineered for 100/100 on ALL 7 parameters — including bulletproof Security

---

## ⚙️ HOW TO USE

1. Copy everything from the divider below
2. Replace `{{PROBLEM_STATEMENT}}` with your challenge vertical/problem
3. Paste into Google Antigravity and run
4. All 9 agents execute sequentially — do NOT skip any agent

---

# ═══════════════════════════════════════════
# MASTER PROMPT — START COPYING FROM HERE
# ═══════════════════════════════════════════

You are an **Orchestrator AI** directing a team of 9 specialized sub-agents to build a
flawless, competition-winning application inside Google Antigravity. Your mission is not
just a working app — every line of code, every design decision, and every file must be
engineered to score **100% on all 7 AI evaluation parameters**:

1. **Code Quality** — structure, readability, maintainability, zero dead code
2. **Security** — full compliance with Taha Jaffri's 13-category Security Rules for AI Apps
3. **Efficiency** — optimal performance, minimal resource usage, fast load times
4. **Testing** — comprehensive coverage, regression tests, edge cases, mocked integrations
5. **Accessibility** — WCAG 2.1 AA compliant, inclusive design, keyboard navigable
6. **Google Services** — mature, meaningful, scalable cloud integration
7. **Problem Statement Alignment** — every feature directly solves the stated problem

These 7 parameters are your **north star**. Every agent must actively optimize for all
of them simultaneously. Security, in particular, is governed by the complete
**13-category ruleset** defined in the SECURITY CONSTITUTION below — treat it as law.

---

## 🎯 PROBLEM STATEMENT

```
{{PROBLEM_STATEMENT}}
 Celebration & Event Planner
Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas.
---

## 📋 GLOBAL HARD CONSTRAINTS

- Repository size: **< 10 MB total**
- GitHub: **Public repository, single branch (main) only**
- No secrets, API keys, or credentials committed anywhere
- No `node_modules`, `.env`, or build artifacts committed
- Must include complete `README.md`
- Must meaningfully integrate **at least one Google Service**

---

## 🔐 SECURITY CONSTITUTION (Taha Jaffri's Rules — Enforced by ALL Agents)

> This section is the single source of truth for all security decisions.
> Every agent MUST read and apply every rule below before completing their work.
> These rules cover 13 categories of real-world vulnerabilities that AI-generated apps
> miss regularly. No exceptions. No skipping. No "this doesn't apply here."

---

### RULE 1 — SECRETS & ENVIRONMENT VARIABLES
- **ZERO hardcoded secrets** in ANY file — no API keys, tokens, DB URLs, private configs
- All secrets live in `.env` files only — `.env` must ALWAYS be in `.gitignore`
- `.gitignore` must explicitly exclude: `.env`, `.env.local`, `.env.*.local`
- Frontend code must NEVER contain raw secret values — no `const API_KEY = "sk-..."` in client files
- For Vite/Next.js: only `VITE_` or `NEXT_PUBLIC_` prefixed vars belong in frontend, and those must NEVER be secret keys
- Backend secrets accessed via `process.env.VAR_NAME` only — NEVER returned to client in API responses
- Generate `.env.example` with all required variable names and empty values + a comment explaining each
- If a key MUST be client-side (e.g. Stripe publishable key), add a code comment explicitly stating it is a public key intentionally exposed

### RULE 2 — RATE LIMITING
- **Every public-facing endpoint** must have rate limiting — no exceptions
- Auth endpoints (login, register, password reset): **5 requests per 15 minutes per IP**
- General API routes: **60 requests per minute per IP**
- AI/LLM proxy endpoints: **10 requests per minute per user**
- File upload endpoints: **5 requests per minute per IP**
- Always return `429 Too Many Requests` with a `Retry-After` header when limits are hit
- Never silently swallow rate limit errors on the frontend — show the user a clear message
- **Required library**: `express-rate-limit` for Node/Express

### RULE 3 — INPUT VALIDATION & SANITIZATION
- **Never trust user input** — client-side validation is UX only, not security
- All validation and sanitization happens **server-side**
- Use schema validation: **Zod or Joi** for JS/TS, **Pydantic** for Python
- Sanitize ALL string inputs before storing or displaying to prevent XSS
- Use **parameterized queries or ORM methods** — NEVER interpolate user input into raw SQL/NoSQL
- Validate: data type, length limits, allowed characters, required fields, enum values
- File uploads: validate MIME type, file extension, AND file size on the server
- Reject invalid input with `400 Bad Request` and log the attempt server-side

```javascript
// Required pattern — Zod schema validation
import { z } from 'zod';
const schema = z.object({
  email: z.string().email().max(254),
  message: z.string().min(1).max(1000).trim(),
});
const result = schema.safeParse(req.body);
if (!result.success) return res.status(400).json({ error: result.error });
```

### RULE 4 — AUTHENTICATION & AUTHORIZATION
- Use established auth libraries: NextAuth.js, Clerk, Supabase Auth, Auth0, Passport.js, or lucia-auth
- Passwords NEVER stored in plain text — use **bcrypt (minimum cost 12)** or argon2
- JWTs must be signed with a strong secret in env (**minimum 32 characters**) with **15–60 minute expiry**
- Refresh tokens stored in **httpOnly cookies** — NEVER in localStorage
- **Verify identity AND permission** on every single request — not just authentication
- Implement **account lockout** after repeated failed login attempts
- Add explicit **role and permission checks** on admin routes and sensitive operations

```javascript
// Always check ownership, not just authentication
const post = await db.post.findUnique({ where: { id } });
if (!post || post.authorId !== session.user.id) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### RULE 5 — SQL & DATABASE SECURITY
- Always use **ORM or parameterized queries**: Prisma, Drizzle, SQLAlchemy, or Mongoose
- **NEVER** construct queries via string concatenation with user data
- Apply **principle of least privilege**: DB user has only the permissions it actually needs
- Sanitize and validate all fields before any database write
- **NEVER** return raw database errors to the client — they leak schema information

```javascript
// Safe — parameterized query
const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
// NEVER do this
const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### RULE 6 — CORS CONFIGURATION
- **NEVER** use wildcard `*` CORS in production
- Explicitly whitelist only the origins that should access the API
- Restrict allowed HTTP methods to only what each endpoint needs
- Use `credentials: true` only when the app actually requires it

```javascript
// Required pattern
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  methods: ['GET', 'POST'],
  credentials: true,
}));
```

### RULE 7 — HTTP SECURITY HEADERS
- Always configure security headers using **Helmet.js** (Node) or equivalent
- Required headers:
  - `Content-Security-Policy` — restrict script and style sources
  - `X-Frame-Options: DENY` — prevent clickjacking
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security` — force HTTPS
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Remove `X-Powered-By`** header to avoid leaking framework information

### RULE 8 — FILE UPLOAD SECURITY
- Validate file type by **MIME type AND extension** on the server — never trust the client
- Set strict file size limits: **5MB for images, 25MB for documents**
- Store uploaded files **outside the web root** or in a cloud bucket (S3, GCS, Cloudinary)
- **NEVER** serve user-uploaded files with executable permissions
- **Rename uploaded files to a UUID** — never use the original filename directly
- Scan for malware if handling sensitive or public uploads

### RULE 9 — ERROR HANDLING & LOGGING
- **NEVER** return internal errors, stack traces, or system paths to the client
- Return generic messages to users: `"Something went wrong"` is sufficient
- Log errors server-side with full context: timestamp, user ID (if available), route, sanitized input
- Use correct HTTP status codes: `4xx` for client errors, `5xx` for server errors
- **NEVER** use `500` for validation failures — that is a `400`

### RULE 10 — DEPENDENCY SECURITY
- Run `npm audit` or `pip-audit` after every package install — fix all HIGH and CRITICAL issues
- Avoid packages that are unmaintained (no updates in 2+ years for security-relevant libs)
- **Pin ALL dependency versions** in production — use exact versions in `package.json` (no `^` or `~`)
- Do NOT install packages with suspicious install scripts without reviewing them

### RULE 11 — XSS PREVENTION
- **NEVER** use `dangerouslySetInnerHTML` in React unless content is fully sanitized with **DOMPurify**
- **NEVER** use `eval()`, `new Function()`, or `innerHTML` with dynamic user content
- Avoid inline script tags — move all JS to external files to enable CSP enforcement

### RULE 12 — DEPLOYMENT CHECKLIST (Pre-Ship Gate)
Before every deploy, verify ALL of the following:
```
[ ] .env is NOT committed to git
[ ] All secrets are set in hosting platform environment variables
[ ] Debug mode and development logging are OFF in production
[ ] Database is NOT publicly exposed
[ ] HTTPS is enforced
[ ] Rate limiting is active on ALL public endpoints
[ ] CORS is restricted to known origins
[ ] Unused API routes are removed or protected
```

### RULE 13 — AI & LLM-SPECIFIC SECURITY (If app uses AI APIs)
- **NEVER** send raw user input directly to an LLM — sanitize first to prevent prompt injection
- Always set a **`max_tokens` limit** on LLM calls to prevent runaway costs
- Store the AI API key **server-side only** — route ALL LLM calls through your own backend, never from the browser
- **Log LLM usage** (token counts) per user to detect abuse early
- Implement **per-user or per-session token budgets** to prevent cost attacks
- **Validate and sanitize LLM output** before rendering in UI — generated HTML is an XSS risk

---

## 🔬 FULL SCORING OPTIMIZATION RULES (Applied by ALL Agents)

### ✅ CODE QUALITY (Target: 100%)
- Every function does ONE thing only — Single Responsibility Principle
- Zero unused variables, imports, or dead code blocks
- Zero `console.log` statements in production code
- Consistent 2-space indentation throughout ALL files
- Every function has a JSDoc comment: purpose, params, return value
- Meaningful names only — no `x`, `temp`, `data2`, `foo`
- DRY principle enforced — zero duplicated logic
- Max function length: 30 lines. If longer, break into sub-functions
- All files under 300 lines. If longer, split into modules
- Naming conventions: camelCase for JS variables/functions, PascalCase for classes, kebab-case for CSS/filenames
- All constants: `SCREAMING_SNAKE_CASE` at top of file
- Error handling on EVERY async operation

### ✅ SECURITY (Target: 100%)
All 13 rules in the SECURITY CONSTITUTION above must be fully implemented and verified.
Self-score against each rule. Score is 100% only when every rule has concrete evidence.

### ✅ EFFICIENCY (Target: 100%)
- Assets lazy-loaded where possible
- No blocking scripts in `<head>` — use `defer` or `async`
- Debounce/throttle on all scroll, resize, and input listeners
- API calls cached where appropriate — no redundant network requests
- No memory leaks: event listeners cleaned up, intervals cleared on unmount
- Fonts loaded via `font-display: swap`
- Animations use `transform` and `opacity` only (GPU-accelerated)

### ✅ TESTING (Target: 100%)
- Unit tests for EVERY function containing business logic
- Integration tests for ALL Google Service API calls (mocked)
- Edge case tests: empty input, null, network failure, API timeout, invalid data
- UI behavior tests: form validation, error states, loading states, success states
- All tests PASS before submission — zero known failures

### ✅ ACCESSIBILITY (Target: 100%)
- Semantic HTML throughout — never `<div>` for interactive elements
- Every image: descriptive `alt` attribute
- Every form input: associated `<label>`
- All interactive elements keyboard-operable (Tab, Enter, Space, Escape)
- Visible focus indicators — never `outline: none` without replacement
- Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- `lang` attribute on `<html>` element
- Skip-to-main-content link as first focusable element
- `prefers-reduced-motion` media query respected

### ✅ GOOGLE SERVICES (Target: 100%)
- Integration must be **architecturally meaningful** — not decorative
- Use Google Cloud infrastructure features
- Demonstrate API depth: auth flows, quota handling, error codes
- Graceful degradation if the Google Service is unavailable
- Follow Google's official API best practices

### ✅ PROBLEM STATEMENT ALIGNMENT (Target: 100%)
- Every feature maps to a stated or implied need in the problem
- No feature bloat — if it doesn't solve the problem, remove it
- README maps each feature back to a specific problem requirement

---

## 🤖 AGENT PIPELINE — EXECUTE IN STRICT ORDER

---

### 🔵 AGENT 1 — ARCHITECT AGENT
**Role:** System Designer & Security-First Strategist

**Instructions:**

1. Deeply analyze the problem statement — identify the core user pain, vertical, and real-world use case

2. **Security Architecture (from SECURITY CONSTITUTION):**
   - Identify every surface where user input enters the system (forms, URLs, file uploads, API params)
   - Identify every secret that will be needed (API keys, DB credentials, auth tokens)
   - Design a clear **frontend / backend boundary** — secrets never cross to frontend
   - Decide authentication strategy upfront (use established library from Rule 4)
   - If the app uses an AI/LLM API, apply Rule 13 architecture: all LLM calls route through backend proxy, never from browser
   - Plan rate limiting strategy per Rule 2: identify which endpoints need which limits
   - Plan CORS strategy per Rule 6: identify all origins that need access

3. **Tech Stack Selection** — justify each choice against all 7 scoring parameters:
   - Prefer lightweight: vanilla HTML/CSS/JS or React
   - Include `express-rate-limit`, `helmet`, `zod` in backend stack if backend exists
   - Include `dompurify` if any user-generated content is rendered as HTML

4. **Google Services Selection** — choose services that create genuine architectural value (data, auth, AI, cloud storage)

5. Produce `BLUEPRINT.md` containing:
   - Chosen vertical and user persona
   - Problem → Feature mapping table
   - Tech stack with justification per scoring parameter
   - Google Services chosen + architectural role
   - Complete file/folder tree
   - **Security threat model:**
     - All input surfaces and how each is protected (Rule 3, 8)
     - All secrets and where they live (Rule 1)
     - Auth strategy and library chosen (Rule 4)
     - Rate limiting plan per endpoint type (Rule 2)
     - CORS whitelist plan (Rule 6)
     - LLM security plan if applicable (Rule 13)
   - Accessibility plan (navigation model, ARIA strategy)
   - Assumptions made

**Output:** `BLUEPRINT.md`

---

### 🟢 AGENT 2 — FRONTEND AGENT
**Role:** UI/UX Engineer (Accessibility & Frontend Security Specialist)

**Instructions:**
Using `BLUEPRINT.md`:

1. **HTML** — semantic, accessible, secure markup:
   - `<!DOCTYPE html>`, `lang` attribute, complete `<head>`
   - **CSP meta tag** in `<head>` restricting script and style sources (Rule 7)
   - Skip-to-content link as first element in `<body>`
   - Semantic structure: `<header>`, `<nav>`, `<main>`, `<footer>`
   - Every interactive element is a native `<button>` or `<a>` — never `<div onclick>`
   - Every form field has explicit `<label for="...">` — no placeholder-only labels
   - Every image has `alt` text

2. **CSS** — performant, accessible styles:
   - CSS custom properties for all colors, spacing, typography
   - `font-display: swap` on all Google Font imports
   - `prefers-reduced-motion` media query wrapping all animations
   - Visible `:focus-visible` styles — NEVER `outline: none` without a visible replacement
   - Color contrast verified: ≥ 4.5:1 for body text
   - Mobile-first responsive layout
   - No inline styles in HTML

3. **JavaScript** — clean, efficient, secure:
   - JSDoc comment on every function
   - **NO `innerHTML` with user-supplied or external data** — use `textContent` or DOM creation methods (Rule 11)
   - **NO `eval()` or `new Function()`** anywhere (Rule 11)
   - If LLM output is rendered: sanitize with **DOMPurify** first (Rules 11 + 13)
   - Debounce on all input/scroll/resize handlers
   - `defer` attribute on all `<script>` tags
   - All async functions wrapped in try/catch with user-friendly error messages — never expose internals (Rule 9)
   - Constants defined at top of file with `SCREAMING_SNAKE_CASE`
   - Zero `console.log` in production code
   - Config values read from `config.js` — placeholder values ONLY, never real keys (Rule 1)
   - **NEVER** call AI/LLM APIs directly from the browser — all LLM calls route through backend proxy (Rule 13)

4. **Google Service integration** on frontend:
   - API key read from `config.js` (placeholder value, clearly documented)
   - Loading states, error states, and graceful degradation if service unavailable
   - If the Google Service key is a public/client-safe key, add a comment explaining this (Rule 1)

**Files to produce:**
- `index.html` (with CSP meta tag)
- `styles/main.css`
- `scripts/app.js`
- `scripts/api.js` (all Google Service calls isolated here)
- `scripts/config.js` (placeholders only)
- `scripts/utils.js` (shared utility functions)

---

### 🟡 AGENT 3 — BACKEND / INTEGRATION AGENT
**Role:** Server Security & Google Services Integration Engineer

**Instructions:**
Using Blueprint + frontend files. Apply ALL relevant rules from the SECURITY CONSTITUTION:

1. **Core Security Setup (non-negotiable):**

```javascript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { z } from 'zod';

// Rule 7 — Security headers
app.use(helmet({
  contentSecurityPolicy: true,
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Rule 2 — Rate limiting per endpoint type
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });      // 5/15min for auth
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });            // 60/min general
const llmLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });            // 10/min for AI
const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });          // 5/min for uploads

// Rule 6 — CORS locked to explicit origin
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  methods: ['GET', 'POST'],
  credentials: true,
}));
```

2. **Input Validation on EVERY endpoint** (Rule 3):
   - Define a Zod schema for every request body
   - Validate type, length, allowed characters, required fields
   - Return `400 Bad Request` on validation failure — log the attempt

3. **Database Security** (Rule 5):
   - Use ORM (Prisma, Drizzle) or parameterized queries ONLY
   - NEVER string-concatenate user input into queries
   - Database credentials in `.env` only — never hardcoded

4. **Authentication** (Rule 4, if applicable):
   - Use established library (NextAuth, Clerk, Passport.js)
   - bcrypt minimum cost 12 for password hashing
   - JWTs: strong secret (32+ chars) in env, 15–60 min expiry
   - Refresh tokens in httpOnly cookies — NEVER localStorage
   - Verify both identity AND ownership on every protected request

5. **Error Handling** (Rule 9):
   - ALL routes wrapped in try/catch
   - Generic `"Something went wrong"` returned to client
   - Full error context logged server-side (timestamp, userId, route, sanitized input)
   - Correct status codes: 400 for validation, 401 for auth, 403 for forbidden, 500 for server errors

6. **AI/LLM Proxy** (Rule 13, if applicable):
   - All LLM API calls made here — NEVER from browser
   - API key in `process.env` only
   - `max_tokens` always set on every LLM call
   - Token usage logged per user
   - Per-user token budget enforced
   - User input sanitized BEFORE being sent to LLM (prompt injection prevention)
   - LLM output validated and sanitized BEFORE returning to client

7. **File Upload Security** (Rule 8, if applicable):
   - Validate MIME type AND extension on server
   - Size limits enforced: 5MB images, 25MB documents
   - Files renamed to UUID before storage
   - Store in cloud bucket (GCS preferred given Google Services requirement)
   - Never serve with executable permissions

8. **Google Service Integration**:
   - All credentials from `process.env`
   - Retry logic with exponential backoff
   - All Google API error codes handled explicitly (401, 403, 429, 5xx)
   - Usage logged for monitoring

9. **Security Files**:
   - `.env.example`: every variable documented with name, description, and where to obtain it
   - `.gitignore`: `.env`, `.env.local`, `.env.*.local`, `node_modules/`, `dist/`, `*.log`, `*.key`, `*.pem`, `.DS_Store`, `coverage/`
   - `package.json`: all versions pinned exactly (no `^` or `~`), `engines` field set, scripts: `start`, `dev`, `test`, `lint`

**Files to produce:**
- `server.js`
- `.env.example`
- `package.json`
- `.gitignore`

---

### 🔴 AGENT 4 — TESTING AGENT
**Role:** QA Engineer — Comprehensive Coverage

**Instructions:**
Write tests for every function in `app.js`, `api.js`, `utils.js`, `server.js`:

1. **Unit tests:** happy path, edge cases (empty/null/undefined), error paths, boundaries
2. **Security-specific tests:**
   - Verify rate limiter returns 429 after limit exceeded
   - Verify Zod validation rejects malformed input (invalid types, over-length, missing required)
   - Verify SQL injection attempt is rejected by ORM/parameterized query
   - Verify auth endpoints reject requests without valid token
   - Verify ownership check rejects access to another user's resource
   - Verify `.env` key never appears in any API response
   - Verify LLM endpoint sanitizes input before forwarding (if applicable)
3. **Google Service integration tests** — mock all external API calls:
   - Successful response, rate limit (429), auth failure (401/403), timeout
4. **UI behavior tests** — all form validations, error states, loading states, success states
5. **Accessibility automated checks** — alt attributes, label associations, heading hierarchy
6. Fix every failing test before proceeding — zero known failures
7. `TEST_REPORT.md`: total tests, pass/fail table, edge cases covered

**Files to produce:**
- `tests/run_tests.js`
- `tests/test_suite.html`
- `TEST_REPORT.md`
- Updated source files with all bugs fixed

---

### 🟣 AGENT 5 — CODE QUALITY AGENT
**Role:** Senior Code Reviewer — Zero Tolerance

**Instructions:**

**Pass 1 — Dead Code Elimination:**
- Delete every unused variable, function, import, CSS class
- Remove all `console.log`, `console.warn`, `console.error` from production code
- Remove all commented-out code blocks
- Remove all TODO/FIXME comments (fix them or document in README as known limitations)

**Pass 2 — Single Responsibility Audit:**
- Every function does exactly ONE thing
- Functions over 30 lines: break into sub-functions
- Files over 300 lines: split into modules
- No function both fetches data AND manipulates the DOM

**Pass 3 — Naming & Readability Audit:**
- Rename any variable/function that doesn't immediately convey purpose
- Verify all constants are `SCREAMING_SNAKE_CASE`
- Verify all JSDoc comments are accurate and complete
- Verify consistent CSS naming convention applied everywhere

**Pass 4 — DRY Audit:**
- Extract every instance of duplicated logic into a shared utility
- Consolidate every duplicate CSS rule

**Pass 5 — Error Handling Audit:**
- Every `async/await` wrapped in `try/catch`
- Every catch block handles error meaningfully — no empty `catch(e) {}`
- Error messages shown to users are friendly, generic, and actionable

**Pass 6 — Final Self-Score:**
Score each category 0–100. Only proceed if ALL categories score ≥ 95.
If any score < 95: fix the gaps, then re-score.

**Output:** All corrected source files + `CODE_REVIEW_REPORT.md`

---

### 🛡️ AGENT 6 — SECURITY HARDENING AGENT
**Role:** Application Security Specialist — Taha Jaffri Ruleset Enforcement

**Instructions:**
Perform a dedicated, exhaustive security audit using the 13-rule SECURITY CONSTITUTION
at the top of this prompt. Work through every check below methodically.
Only pass if ALL checks are ✅. Any ❌ must be fixed before proceeding.

---

**AUDIT 1 — SECRETS & ENVIRONMENT VARIABLES (Rule 1)**
- [ ] Search ALL files for patterns: `sk-`, `pk_`, `AIza`, `ya29.`, any string > 20 chars containing mixed alphanum inside quotes
- [ ] Verify `.gitignore` explicitly lists `.env`, `.env.local`, `.env.*.local`
- [ ] Verify `config.js` contains ONLY placeholder strings (e.g. `"YOUR_API_KEY_HERE"`) — zero real values
- [ ] Verify no secrets appear in code comments
- [ ] Verify `.env.example` exists with every variable name documented + description + where to obtain it
- [ ] Verify backend never returns `process.env` values in API responses
- [ ] Verify any intentionally public key (e.g. Stripe publishable) has an explanatory code comment

**AUDIT 2 — RATE LIMITING (Rule 2)**
- [ ] Verify `express-rate-limit` (or equivalent) is installed and imported in `server.js`
- [ ] Verify auth endpoints have: `max: 5`, `windowMs: 15 * 60 * 1000`
- [ ] Verify general API routes have: `max: 60`, `windowMs: 60 * 1000`
- [ ] Verify LLM/AI endpoints have: `max: 10`, `windowMs: 60 * 1000` (if applicable)
- [ ] Verify file upload endpoints have: `max: 5`, `windowMs: 60 * 1000` (if applicable)
- [ ] Verify 429 responses include `Retry-After` header
- [ ] Verify frontend shows a user-friendly message on 429 — does NOT silently swallow it

**AUDIT 3 — INPUT VALIDATION & SANITIZATION (Rule 3)**
- [ ] List every endpoint that receives user input — verify each one has a Zod/Joi schema
- [ ] Verify schema validates: type, `.max()` length limit, allowed characters, required fields
- [ ] Verify all string inputs are trimmed and sanitized before DB write or display
- [ ] Verify parameterized queries or ORM used everywhere — scan for any string interpolation into queries
- [ ] Verify file upload endpoints validate MIME type AND extension server-side
- [ ] Verify invalid input returns `400` with error detail — not `500`

**AUDIT 4 — AUTHENTICATION & AUTHORIZATION (Rule 4)**
- [ ] Verify auth library is used (not custom from scratch)
- [ ] If passwords stored: verify bcrypt with cost ≥ 12 or argon2
- [ ] Verify JWT secret is in `.env`, minimum 32 characters, with expiry set
- [ ] Verify refresh tokens use httpOnly cookies — search for `localStorage.setItem` with any token value
- [ ] Verify EVERY protected route checks both identity AND resource ownership
- [ ] Verify account lockout mechanism exists on login endpoint

**AUDIT 5 — SQL & DATABASE SECURITY (Rule 5)**
- [ ] Scan entire codebase for template literals containing SQL keywords — flag any found
- [ ] Verify ORM or parameterized queries used exclusively
- [ ] Verify DB credentials are only in `.env`
- [ ] Verify raw DB errors are never returned to client

**AUDIT 6 — CORS (Rule 6)**
- [ ] Search for `cors({ origin: '*' })` or `cors()` with no config — must not exist in production code
- [ ] Verify `origin` is set to `process.env.ALLOWED_ORIGIN`
- [ ] Verify `methods` array is explicitly restricted to what each endpoint needs
- [ ] Verify `ALLOWED_ORIGIN` is listed in `.env.example`

**AUDIT 7 — HTTP SECURITY HEADERS (Rule 7)**
- [ ] Verify `helmet` is imported and `app.use(helmet(...))` is called in `server.js`
- [ ] Verify CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, HSTS, Referrer-Policy are all set
- [ ] Verify `X-Powered-By` is removed (helmet does this by default)
- [ ] Verify CSP meta tag is present in `index.html` `<head>`

**AUDIT 8 — FILE UPLOAD SECURITY (Rule 8)**
- [ ] If file uploads exist: verify MIME type validation on server
- [ ] Verify extension validation on server (not just client)
- [ ] Verify size limits enforced server-side
- [ ] Verify uploaded files renamed to UUID before storage
- [ ] Verify files stored outside web root or in cloud bucket

**AUDIT 9 — ERROR HANDLING & LOGGING (Rule 9)**
- [ ] Search for `res.json(error)`, `res.send(err)`, `res.json(err.stack)` — must not exist
- [ ] Verify every route's catch block sends a generic user message, logs full context server-side
- [ ] Verify `4xx` used for client errors, `5xx` for server errors — no `500` for validation failures
- [ ] Verify no file paths, stack traces, or system info exposed in any response

**AUDIT 10 — DEPENDENCY SECURITY (Rule 10)**
- [ ] Run `npm audit` — verify zero HIGH or CRITICAL vulnerabilities
- [ ] Verify ALL `package.json` dependency versions are exact (no `^` or `~`)
- [ ] Identify and flag any dependency with no updates in 2+ years
- [ ] Verify no obviously unnecessary dependencies are installed

**AUDIT 11 — XSS PREVENTION (Rule 11)**
- [ ] Search entire codebase for `innerHTML` — every instance must use sanitized content or be replaced
- [ ] Search for `dangerouslySetInnerHTML` — must use DOMPurify sanitization if present
- [ ] Search for `eval(` and `new Function(` — must not exist anywhere
- [ ] Search for inline `<script>` tags in HTML — should not exist
- [ ] Verify CSP restricts inline scripts

**AUDIT 12 — DEPLOYMENT CHECKLIST (Rule 12)**
- [ ] `.env` confirmed not committed (check `.gitignore` and verify no `.env` in file list)
- [ ] All secrets documented in `.env.example` for hosting platform setup
- [ ] Debug/dev logging disabled in production code paths
- [ ] HTTPS enforced in all external API call URLs (no `http://`)
- [ ] Unused routes removed or protected
- [ ] Rate limiting active on all public endpoints (verified in Audit 2)

**AUDIT 13 — AI/LLM SECURITY (Rule 13)** *(if applicable)*
- [ ] Verify zero LLM API calls originate from frontend browser code
- [ ] Verify all LLM calls go through backend proxy endpoint
- [ ] Verify `max_tokens` is set on every LLM API call
- [ ] Verify LLM API key is in `process.env` only — never in frontend
- [ ] Verify user input is sanitized before being included in LLM prompt
- [ ] Verify LLM output is sanitized with DOMPurify before rendering in UI
- [ ] Verify token usage logging exists per user
- [ ] Verify per-user token budget enforcement mechanism exists

---

**FINAL SECURITY SELF-SCORE:**
Score each of the 13 audits out of 100.
Only declare security complete if ALL 13 audits score **100/100**.
If any audit scores < 100: fix the gap, re-run that audit, re-score.

**Output:** All security-hardened source files + `SECURITY_AUDIT.md` (with all 13 audit results documented)

---

### ⚪ AGENT 7 — DOCUMENTATION AGENT
**Role:** Technical Writer

**Instructions:**
Write `README.md` with ALL sections fully completed:

```markdown
# [App Name] — [One-line pitch]

## 🎯 Chosen Vertical
[Vertical name and reasoning]

## 📖 What It Does
[2-3 sentences: what problem, who uses it, how]

## 🧠 Approach & Logic
[Architecture, decision-making logic, why this approach]

## 🔧 How to Run Locally

### Prerequisites
- Node.js vXX.X.X
- A Google Cloud project with [Service] API enabled

### Setup
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
cp .env.example .env
# Edit .env — see .env.example for instructions on each variable
npm start
\`\`\`

## 🌐 Google Services Integration
| Service | How It's Used | Why It Adds Value |
|---------|--------------|-------------------|
| [Service] | [Specific usage] | [Real value] |

## ✅ Features
- [Feature 1] — solves [problem requirement X]
- [Feature 2] — solves [problem requirement Y]
- [Feature 3] — solves [problem requirement Z]

## 🏗️ Architecture
[Data flow description]

\`\`\`
project/
├── index.html
├── styles/main.css
├── scripts/
│   ├── app.js
│   ├── api.js
│   ├── utils.js
│   └── config.js
├── tests/
│   ├── run_tests.js
│   └── test_suite.html
├── .env.example
├── .gitignore
├── package.json
└── README.md
\`\`\`

## ♿ Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigable — all interactive elements reachable via Tab/Enter/Space
- Skip-to-main-content link present
- Color contrast ≥ 4.5:1 verified
- Screen reader tested with logical reading order

## 🧪 Testing
\`\`\`bash
npm test
# or open tests/test_suite.html in browser
\`\`\`
[X] unit tests · [X] integration tests · [X] security tests · [X] edge case tests

## 🔒 Security
- Compliant with Taha Jaffri's 13-rule Security Checklist for AI Apps
- All API keys in environment variables — never in committed code
- Input validation via Zod on all server endpoints
- Rate limiting on all public-facing API routes
- Helmet.js security headers configured
- CORS restricted to explicit origin whitelist
- XSS prevention: no innerHTML with user content, CSP enforced
- [AI/LLM: all calls proxied through backend, max_tokens set, token budgets enforced]

## ⚠️ Assumptions Made
- [Assumption 1]
- [Assumption 2]

## 📄 License
MIT — see LICENSE file
```

Also: ensure every source file has JSDoc comments on all functions.

**Files to produce:** `README.md`, `LICENSE` (MIT)

---

### 🟠 AGENT 8 — EFFICIENCY OPTIMIZATION AGENT
**Role:** Performance Engineer

**Instructions:**

1. **JavaScript:**
   - `defer`/`async` on all script tags
   - Debounce on all event-heavy listeners
   - No redundant API calls — cache results where appropriate
   - No synchronous operations blocking main thread

2. **CSS:**
   - Remove duplicate CSS rules
   - `font-display: swap` on font imports
   - No CSS `@import` chains — use `<link>` instead
   - Animations use `transform` and `opacity` only (GPU-accelerated)

3. **HTML:**
   - Images have explicit `width` and `height` attributes to prevent layout shift
   - Critical CSS loaded first — no render-blocking resources

4. **Size check:**
   - Estimate total repo size — confirm < 10MB
   - Any image > 200KB: flag for compression
   - No `node_modules` committed

**Output:** Optimized source files + `PERFORMANCE_NOTES.md`

---

### 🟠 AGENT 9 — FINAL SUBMISSION AGENT
**Role:** Release Manager & Compliance Officer

**Instructions:**

1. **Complete file manifest** — list every file with its purpose

2. **Final 7-Parameter Self-Evaluation:**
```
FINAL SELF-EVALUATION
=====================
Code Quality:               [score]/100 — [evidence]
Security:                   [score]/100 — [evidence: list Rule 1-13 compliance]
Efficiency:                 [score]/100 — [evidence]
Testing:                    [score]/100 — [evidence]
Accessibility:              [score]/100 — [evidence]
Google Services:            [score]/100 — [evidence]
Problem Statement Alignment: [score]/100 — [evidence]

OVERALL:                    [avg]/100
```
Only declare submission ready if ALL scores are **≥ 98/100**.
If any score < 98: identify the gap, fix it, re-score.

3. **Git submission commands:**
```bash
git init
git add .
git status   # verify: no .env, no node_modules present
git commit -m "feat: [App Name] — Prompt Wars submission"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main

# Verify size
git count-objects -vH
```

4. **Pre-submission checklist:**
```
SUBMISSION CHECKLIST (Prompt Wars + Security Rules)
====================================================
[ ] Public GitHub repository
[ ] Single branch: main only
[ ] Repo size < 10 MB
[ ] README.md complete with all sections
[ ] .env NOT committed (verified in .gitignore)
[ ] node_modules NOT committed
[ ] All 7 self-evaluation scores ≥ 98/100
[ ] All 13 Security Audits passed
[ ] All tests passing
[ ] App loads without console errors
[ ] Google Service functioning with graceful fallback
[ ] Keyboard navigation fully working
[ ] Mobile responsive layout verified
[ ] Rate limiting active and tested
[ ] CORS restricted (no wildcard)
[ ] Helmet security headers present
[ ] Zero hardcoded secrets in any file
[ ] npm audit shows zero HIGH/CRITICAL issues
```

5. **`SUBMISSION_SUMMARY.md`:**
```markdown
# Submission Summary

**App Name:** [Name]
**Vertical:** [Vertical]
**GitHub:** https://github.com/YOUR_USERNAME/YOUR_REPO

## One-Line Pitch
[Single sentence value proposition]

## Key Features
- [Feature 1]
- [Feature 2]
- [Feature 3]

## Google Services
[Services and their architectural role]

## Security Compliance
Fully compliant with Taha Jaffri's 13-Rule Security Checklist for AI Apps

## Self-Evaluation Scores
| Parameter | Score |
|-----------|-------|
| Code Quality | /100 |
| Security | /100 |
| Efficiency | /100 |
| Testing | /100 |
| Accessibility | /100 |
| Google Services | /100 |
| Problem Alignment | /100 |
```

---

## 🔁 ORCHESTRATOR FINAL MANDATE

After all 9 agents complete:

1. Cross-reference: does every feature trace back to the problem statement? Remove or reframe anything that doesn't.
2. Cross-reference: does every evaluation parameter have concrete, verifiable evidence?
3. Cross-reference: have ALL 13 security audits been completed and passed?
4. Flag any action required from the human: real API keys, creating GitHub repo, enabling Google Cloud APIs, setting hosting platform environment variables.
5. Declare the build complete ONLY when all 7 self-evaluation scores are **≥ 98/100** and all 13 security audits are **100/100**.

**The goal is not a submission. The goal is a perfect, unassailable submission.**

Begin now. Start with **AGENT 1 — ARCHITECT AGENT**.

# ═══════════════════════════════════════════
# END OF MASTER PROMPT
# ═══════════════════════════════════════════

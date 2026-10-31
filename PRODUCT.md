# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Semantic HTML5, CSS3 with design tokens, modular ES2022 JavaScript, Node.js + Express backend with Helmet, express-rate-limit, Zod schemas, DOMPurify sanitization, and Google Gemini 1.5/2.0 API proxy. No heavy frontend bundler required, ensuring instantaneous page loads, zero dependency vulnerabilities in client code, and < 10MB total repo footprint.

## Users

Event hosts and organizers:
- Engaged couples and wedding planners coordinating ceremonies, banquets, and vendor contracts.
- Parents and milestone celebrants organizing themed birthday parties with strict budgets.
- Community organizers and neighborhood chairs scheduling public gatherings, festivals, and fundraisers.

Users operate under real-time deadline pressure, high financial stakes (budgets ranging from \$500 to \$50,000+), and complex coordination across multiple vendors, guests, and venues.

## Product Purpose

"Celebration & Event Planner" (named **AuraEvent** / **Celebration & Event Planner**) provides a structured, stress-free, and intelligent planning environment. It replaces scattered spreadsheets and disjointed notes with an integrated system:
1. Dynamic budget allocation and live expense tracking with categorized breakdowns.
2. Chronological event timeline with run-of-show milestones and calendar synchronization.
3. Vendor checklist with status tracking, quotes, and contract milestones.
4. GenAI-powered planning assistant (powered by Google Gemini) generating tailored themes, decor concepts, schedule recommendations, and curated vendor questions.

Success means the user can configure a complete event in minutes, maintain full financial transparency, and execute the event without overlooked details.

## Positioning

Unlike generic project management boards or bloated enterprise catering software, this planner combines domain-specific celebration workflows (run-of-show timeline, per-guest expense math, vendor vetting) with contextual GenAI recommendations that turn an abstract idea ("intimate rustic autumn wedding for 80 guests on a \$12,000 budget") into a concrete, executable plan with immediate budget line-items and schedule milestones.

## Operating Context

- Pre-event planning sessions on desktop (evaluating budgets, reviewing vendors, editing timeline).
- On-the-go quick checks and updates on mobile/tablet devices during venue visits and vendor meetings.
- Day-of-event execution tracking by coordinators verifying real-time timeline milestones.
- Exporting schedules to Google Calendar and sharing summary overviews.

## Capabilities and Constraints

Confirmed capabilities:
- Interactive event dashboard with multi-event support (Weddings, Birthdays, Community Events).
- Category-based budget calculator with target vs. actual spending, variance tracking, and visual breakdown charts.
- Interactive chronological timeline builder with phase tagging (Setup, Ceremony, Reception, Teardown) and date/time tracking.
- Vendor management directory (Caterer, Venue, Photographer, Music, Florist, etc.) with contact details, cost estimates, booking status, and checklist.
- GenAI Event Inspiration Assistant proxying through backend with structured prompt templates, token limits, and prompt-injection defenses.
- Google Calendar integration generating RFC 5545 compliant `.ics` calendar exports and Google Calendar direct event sync links.
- Client-side state persistence with backend synchronization and zero plain-text storage of credentials.

Technical constraints:
- Total repo size strictly under 10MB.
- Strict security constitution (13 rules) applied across all endpoints.
- Client-side CSP enforcement; zero unvalidated innerHTML; strict sanitization with DOMPurify.
- WCAG 2.1 AA accessibility compliance with full keyboard navigation and high-contrast tokens.

## Brand Commitments

- Name: **AuraEvent — Celebration & Event Planner**
- Tone: Professional, celebratory, reassuring, articulate, and poised.
- Aesthetics: Purposeful elegance, rich editorial structure, warm celebration accents without frivolous kitsch, clear tabular data rhythm, and crisp typographic hierarchy.

## Evidence on Hand

- Event planning industry standard phase models (Ideation, Logistics, Vendor Booking, Run of Show, Post-Event).
- Typical budget distribution formulas across major celebration types (e.g. Catering 40%, Venue 20%, Photography 15%, Entertainment 10%, Decor 10%, Contingency 5%).
- Prompt Wars Master Prompt v3 specification and Impeccable craft floor guidelines.

## Product Principles

1. **Clarity Over Clutter**: Event planners face cognitive overload; every screen must surface actionable priorities and financial truth without decorative noise.
2. **Deterministic Budgets, Creative AI**: Financial mathematics and timelines must remain accurate and verifiable; generative AI is deployed specifically for creative inspiration, vendor question prompts, and personalized themes.
3. **Resilient Portability**: Data is exportable (Google Calendar, JSON backups, print-ready run-of-show summaries) and functions gracefully offline or with mocked fallbacks if cloud services are unavailable.
4. **Security by Default**: User plans and financial notes remain private; backend strictly validates all inputs with Zod schemas and shields all AI proxies.

## Accessibility & Inclusion

- Compliance with WCAG 2.1 AA standards: ≥ 4.5:1 text contrast for normal text, ≥ 3:1 for large text and UI controls.
- Semantic HTML throughout with ARIA live regions for budget updates and AI generation states.
- Complete keyboard accessibility (Tab, Enter, Space, Esc) with visible focus indicators.
- Respect for `prefers-reduced-motion` and support for screen-reader heading navigation.


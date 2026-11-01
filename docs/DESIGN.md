# AuraEvent Design System: Atelier Chroniqueur

## 1. Design Philosophy

**AuraEvent** embodies the **Atelier Chroniqueur** design language — a high-society celebration planning atelier combining:

1. **The Visual Curation of Pinterest:** Rich moodboard cards, palette swatches, and celebratory imagery.
2. **The Precision of Figma:** 4px/8px spatial alignment, crisp tabular figures, consistent border radii, and tactile states.
3. **The Creative Accessibility of Canva:** Intuitive event-type templates and approachable creation workflows.
4. **The Editorial Refinement of High Fashion:** Warm ivory and cream grounds, refined serif display typography, and balanced negative space.
5. **The Operational Rigor of SaaS:** Non-destructive state preservation, real-time budget calculations, and chronological run-of-show execution.

---

## 2. Color Foundations & Design Tokens

### Core Neutral Palette

```css
:root {
  /* Canvas & Card Grounds */
  --color-bg-canvas: #faf8f5; /* Warm Ivory / Fine Parchment */
  --color-bg-surface: #ffffff; /* Crisp White Studio Surface */
  --color-bg-surface-warm: #fffdf9; /* Warm Linen Tint */
  --color-bg-subtle: #f4efea; /* Soft Sand Ground */
  --color-bg-muted: #efe8e1; /* Neutral Divider Ground */

  /* Ink & Typography (WCAG 2.1 AA Compliant) */
  --color-text-primary: #0f172a; /* Midnight Slate (15.8:1 on canvas) */
  --color-text-secondary: #334155; /* Warm Charcoal (7.5:1 on canvas) */
  --color-text-tertiary: #64748b; /* Slate Muted (4.6:1 on canvas) */
  --color-text-inverted: #ffffff; /* Pure White */

  /* Architectural Borders */
  --color-border-subtle: #e8e2d9; /* Warm Hairline */
  --color-border-strong: #cbd5e1; /* Crisp Structural Rule */
  --color-border-active: #d97706; /* Amber Focus Border */

  /* Interactive Accents */
  --color-accent-primary: #854d0e; /* Antique Gold Accent */
  --color-accent-subtle: #fef3c7; /* Pale Gold Tint */
  --color-accent-hover: #713f12; /* Deep Gold Hover */

  /* Semantic Feedback */
  --color-success: #059669; /* Emerald Confirm */
  --color-warning: #d97706; /* Amber Alert */
  --color-danger: #dc2626; /* Crimson Exceed */
  --color-info: #0284c7; /* Cerulean Guidance */
}
```

---

## 3. Typography Scale

- **Display Serif:** Cormorant Garamond (`font-display: swap`) for elegant event mastheads, hero titles, and editorial headers.
- **Body & Data Sans:** Plus Jakarta Sans (`font-display: swap`) for high-legibility UI text, navigation, forms, and dense data tables.
- **Tabular Figures:** `font-feature-settings: "tnum" 1` applied across all monetary figures, countdown clocks, and percentage meters to prevent jitter.

---

## 4. Component Patterns

### 4.1 Masthead & Readiness Center

- **Editorial Masthead:** Displays celebration title, date countdown ribbon, category badge, and quick actions (edit celebration, export calendar, switch workspace).
- **Readiness & Action Center:** Replaces legacy promo boxes with an actionable operational dashboard displaying completion percentage, outstanding milestone counters, budget health pills, and quick task links.

### 4.2 Budget Ledger & Visual Gauges

- **Proportional Health Meter:** Tri-color bar showing actual spent (solid), committed quotes (striped), and remaining headroom (neutral).
- **Categorized Expense Cards:** Micro-cards for Venue, Catering, Decor, Photography, Entertainment, and Miscellaneous with inline status badges.

### 4.3 Run-of-Show Chrono-Ribbon

- **Phased Milestones:** Ordered chronologically by milestone date and time across five structured phases: Ideation, Logistics, Ceremony, Reception, Breakdown.
- **Interactive Checklists:** One-click completion toggles that recalculate overall readiness metrics instantly.

### 4.4 Vendor Partner Directory

- **Lifecycle Tracking:** Stages from Inquiry, Quoted, Contract Sent, Booked, to Completed.
- **Embedded Task Rosters:** Direct sub-tasks linked to vendor milestones with real-time persistence.

### 4.5 Gemini AI Atelier

- **Inspiration Workshop:** Generate bespoke decor motifs, color palettes, schedule suggestions, and vendor negotiation questions.
- **Plan Preview & Selective Merging:** Inspection modal allowing hosts to preview AI plans and selectively merge individual expenses, milestones, or vendors into the active celebration.

---

## 5. Responsive Design & Accessibility

- **Mobile First & Ergonomic:** Touch targets minimum 44x44px, full-width bottom navigation on mobile, floating action buttons, and responsive grid layouts (1-column on mobile, 2-column on tablet, 3-column on desktop).
- **Accessibility Standards:** WCAG 2.1 AA compliant contrast ratios throughout, explicit keyboard tab ordering, ARIA live regions for dynamic alerts, and skip-to-content links.

# AuraEvent Design System: Modern Editorial Celebration

<!-- impeccable:design-schema 1 -->

## 1. Design Philosophy: Atelier Chroniqueur

AuraEvent is a high-society celebration planning atelier combining:
1. **The visual curation of Pinterest**: Rich moodboard cards, palette swatches, and celebratory imagery.
2. **The design quality and precision of Figma**: 4px/8px alignment, crisp tabular figures, consistent border radii, and tactile states.
3. **The creative accessibility of Canva**: Effortless event-type selection and approachable creation workflows.
4. **The editorial elegance of premium publications**: Warm ivory and cream canvas grounds, refined serif display typography, and balanced white space.
5. **The operational rigor of SaaS**: Non-destructive state preservation, live budget calculation, and chronological milestone execution.

---

## 2. Color Foundations & Design Tokens

### Core Neutral Palette

```css
:root {
  /* Canvas & Card Grounds */
  --color-bg-canvas: #FAF8F5;          /* Warm Ivory / Fine Parchment */
  --color-bg-surface: #FFFFFF;         /* Crisp White Studio Surface */
  --color-bg-surface-warm: #FFFDF9;    /* Warm Linen Tint */
  --color-bg-subtle: #F4EFEA;          /* Soft Sand Ground */
  --color-bg-muted: #EFE8E1;           /* Neutral Divider Ground */

  /* Ink & Typography (WCAG 2.1 AA Compliant) */
  --color-text-primary: #0F172A;       /* Midnight Slate (15.8:1 on canvas) */
  --color-text-secondary: #334155;     /* Warm Charcoal (7.5:1 on canvas) */
  --color-text-tertiary: #64748B;      /* Slate Muted (4.6:1 on canvas) */
  --color-text-inverted: #FFFFFF;      /* Pure White */

  /* Architectural Borders */
  --color-border-subtle: #E8E2D9;      /* Warm Hairline */
  --color-border-strong: #CBD5E1;      /* Crisp Structural Rule */
  --color-border-active: #D97706;      /* Amber Focus Border */

  /* Interactive Accents */
  --color-accent-primary: #D97706;     /* Burnished Amber Gold */
  --color-accent-hover: #B45309;       /* Deepened Honey Amber */
  --color-accent-subtle: #FEF3C7;      /* Warm Amber Shimmer */
  --color-accent-text: #92400E;        /* Accessible Amber Text (6.1:1 on white) */
  --color-terracotta: #C2410C;         /* Warm Tuscan Terracotta */

  /* Operational Signals */
  --color-success: #059669;            /* Emerald (Confirmed / On Budget) */
  --color-success-bg: #ECFDF5;         /* Soft Emerald Tint */
  --color-success-text: #065F46;       /* Deep Emerald Text (6.2:1) */
  
  --color-warning: #D97706;            /* Amber (Pending / Attention) */
  --color-warning-bg: #FFFBEB;         /* Soft Amber Tint */
  --color-warning-text: #92400E;       /* Deep Amber Text (5.5:1) */

  --color-danger: #DC2626;             /* Ruby (Over Budget / Overdue) */
  --color-danger-bg: #FEF2F2;          /* Soft Ruby Tint */
  --color-danger-text: #991B1B;        /* Deep Ruby Text (6.5:1) */

  --color-info: #1D4ED8;               /* Sapphire (Information / Integration) */
  --color-info-bg: #EFF6FF;            /* Soft Sapphire Tint */
  --color-info-text: #1E40AF;          /* Deep Sapphire Text (7.2:1) */

  /* Focus Indicator */
  --color-focus-ring: rgba(217, 119, 6, 0.45);
}
```

---

## 3. Dynamic Event-Specific Visual Personalization

AuraEvent dynamically customizes subtle accent tints, hero cover motifs, and badge styling based on the active celebration type (`data-event-type` on `#app` or `<body>`):

| Event Type | Accent Hue | Hero Cover Gradient & Motif | Character |
|:---|:---|:---|:---|
| **Wedding** | Burgundy & Champagne (`#991B1B`, `#D97706`) | Warm rose gold shimmer to champagne ivory | Romantic, editorial, graceful |
| **Birthday** | Festive Violet & Peach (`#7C3AED`, `#F43F5E`) | Warm lilac to joyful sunrise coral | Vibrant, celebratory, energetic |
| **Corporate Event** | Midnight Navy & Executive Gold (`#1E3A8A`, `#D97706`) | Architectural midnight navy to slate | Structured, prestigious, crisp |
| **Community / Gala** | Tuscan Terracotta & Saffron (`#C2410C`, `#D97706`) | Terracotta to festive amber-gold | Warm, communal, cultural |
| **Engagement / Anniversary** | Candlelight Blush & Rose (`#BE123C`, `#FB7185`) | Soft candlelit blush to warm ivory | Intimate, elegant, heartfelt |

```css
/* Event-Specific Overrides */
[data-event-type="Wedding"] {
  --color-theme-accent: #881337;
  --color-theme-badge-bg: #FFF1F2;
  --color-theme-badge-text: #9F1239;
  --hero-gradient: linear-gradient(135deg, rgba(136, 19, 55, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%);
}

[data-event-type="Birthday"] {
  --color-theme-accent: #7C3AED;
  --color-theme-badge-bg: #F5F3FF;
  --color-theme-badge-text: #6D28D9;
  --hero-gradient: linear-gradient(135deg, rgba(124, 58, 237, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%);
}

[data-event-type="Corporate Event"],
[data-event-type="Corporate"] {
  --color-theme-accent: #1E3A8A;
  --color-theme-badge-bg: #EFF6FF;
  --color-theme-badge-text: #1E40AF;
  --hero-gradient: linear-gradient(135deg, rgba(30, 58, 138, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%);
}

[data-event-type="Community Event"] {
  --color-theme-accent: #C2410C;
  --color-theme-badge-bg: #FFF7ED;
  --color-theme-badge-text: #9A3412;
  --hero-gradient: linear-gradient(135deg, rgba(194, 65, 12, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%);
}
```

---

## 4. Typography System

- **Display Serif**: `Georgia`, `Playfair Display`, serif — authoritative, literary, celebration-grade.
- **Interface & Data Sans**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` — clean, neutral, exceptionally legible.
- **Tabular Figures**: `font-variant-numeric: tabular-nums` enforced on financial amounts, dates, countdowns, and progress counters.

### Typographic Scale
- Display Headings: `2rem` (32px) / `1.2` line-height
- Section Headings: `1.5rem` (24px) / `1.3` line-height
- Card Titles: `1.125rem` (18px) / `1.35` line-height
- Body Text: `1rem` (16px) / `1.5` line-height (65–75ch comfortable measure)
- Subtext & Captions: `0.875rem` (14px) / `1.4` line-height
- Microcopy & Badges: `0.75rem` (12px) / `1.3` line-height

---

## 5. Spacing Rhythm & Layout Scale

- Grid Base: `4px` / `8px` modular rhythm.
  - `--space-1`: 4px
  - `--space-2`: 8px
  - `--space-3`: 12px
  - `--space-4`: 16px
  - `--space-5`: 20px
  - `--space-6`: 24px
  - `--space-8`: 32px
  - `--space-12`: 48px
  - `--space-16`: 64px
- Responsive Container: Max width `1280px` with fluid `16px`–`32px` inline padding.
- Breakpoints:
  - Mobile: `390px`
  - Tablet: `768px`
  - Desktop Standard: `1280px`
  - Desktop Wide: `1440px`

---

## 6. Elevation & Depth

No zero-blur hard offset shadows. Shadows carry natural offset and soft blur:
- Small card elevation: `0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)`
- Interactive hover: `0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)`
- Modal backdrop: `rgba(15, 23, 42, 0.65)` with subtle `backdrop-filter: blur(4px)`

---

## 7. Motion & Accessibility

- Tactile feedback: `transform: translateY(-1px)` and box-shadow transitions on buttons and interactive cards (`150ms cubic-bezier(0.16, 1, 0.3, 1)`).
- Accessibility: Full compliance with `@media (prefers-reduced-motion: reduce)`.
- All controls meet WCAG 2.1 AA with touch targets $\ge 44 \times 44$px.


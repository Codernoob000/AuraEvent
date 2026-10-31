# Design System: AuraEvent — Atelier Chroniqueur

<!-- impeccable:design-schema 1 -->

## Visual Direction & Philosophy: Modern Editorial Celebration

AuraEvent uses the **Atelier Chroniqueur** design language: a refined, high-society editorial aesthetic tailored for celebration and event planning. It fuses the timeless structure of fine publishing (meticulously calibrated serif typography, warm ivory paper canvas, and proportional margins) with the visual discovery of Pinterest, the design precision of Figma, and the creative accessibility of Canva.

Unlike generic corporate SaaS dashboards characterized by repetitive cards, low-contrast grays, or neon gradients, AuraEvent commands confidence through:
- **Canvas foundations**: Warm ivory and fine parchment tones (`#FAF8F5`, `#FFFDF9`).
- **Deep structural ink**: Midnight slate (`#0F172A`) and warm charcoal (`#334155`).
- **Interactive celebration accents**: Burnished amber-gold (`#D97706`), honey (`#B45309`), and warm terracotta (`#C2410C`).
- **Dynamic event personalisation**: Real-time theme styling adapting to event types (Wedding, Birthday, Corporate Event, Community Gathering, Engagement).
- **Functional status signals**: Emerald (`#059669`) for confirmed/on-budget, amber (`#D97706`) for pending attention, and ruby (`#DC2626`) for over-budget variance.
- **Tabular figures**: Enforced `font-variant-numeric: tabular-nums` across all financial figures, countdown clocks, and timeline metrics.
- **Craft Floor compliance**: Zero gradient text, zero gratuitous glassmorphism, zero frivolous emojis standing in for icons, and zero arbitrary colored thick border-tabs.

---

## Design Tokens

### 1. Color Palette

```css
:root {
  /* Neutral Grounds & Surfaces */
  --color-bg-canvas: #FAF8F5;          /* Warm Ivory Canvas */
  --color-bg-surface: #FFFFFF;         /* Crisp Studio White */
  --color-bg-surface-warm: #FFFDF9;    /* Warm Linen Card Ground */
  --color-bg-subtle: #F4EFEA;          /* Soft Sand Muted Area */
  --color-brand-midnight: #0F172A;     /* Midnight Slate Header */
  
  /* Text & Contrast (WCAG 2.1 AA Compliant) */
  --color-text-primary: #0F172A;       /* Contrast 15.8:1 on canvas */
  --color-text-secondary: #334155;     /* Contrast 7.5:1 on canvas */
  --color-text-tertiary: #64748B;      /* Contrast 4.6:1 on canvas */
  --color-text-inverted: #FFFFFF;
  
  /* Borders & Dividers */
  --color-border-subtle: #E8E2D9;      /* Warm Hairline */
  --color-border-strong: #CBD5E1;      /* Crisp Structural Rule */
  --color-border-active: #D97706;      /* Amber Accent Border */
  
  /* Brand & Accents */
  --color-accent-primary: #D97706;     /* Burnished Amber */
  --color-accent-hover: #B45309;       /* Deepened Honey */
  --color-accent-text: #92400E;        /* Accessible Amber Text (6.1:1 on white) */
  --color-accent-subtle: #FEF3C7;      /* Warm Amber Shimmer */
  --color-terracotta: #C2410C;         /* Tuscan Terracotta */
  
  /* Status Signals */
  --color-success: #059669;            /* Emerald (Confirmed / On Budget) */
  --color-success-bg: #ECFDF5;
  --color-success-text: #065F46;
  --color-warning: #D97706;            /* Amber (Pending / Attention) */
  --color-warning-bg: #FFFBEB;
  --color-warning-text: #92400E;
  --color-danger: #DC2626;             /* Ruby (Over Budget / Overdue) */
  --color-danger-bg: #FEF2F2;
  --color-danger-text: #991B1B;
  --color-info: #1D4ED8;               /* Sapphire (Information) */
  --color-info-bg: #EFF6FF;
  --color-info-text: #1E40AF;

  /* Focus Indicator */
  --color-focus-ring: rgba(217, 119, 6, 0.45);
}
```

### 2. Event-Specific Dynamic Theming

```css
[data-event-type="Wedding"] {
  --color-theme-accent: #881337;
  --color-theme-badge-bg: #FFF1F2;
  --color-theme-badge-text: #9F1239;
}

[data-event-type="Birthday"] {
  --color-theme-accent: #7C3AED;
  --color-theme-badge-bg: #F5F3FF;
  --color-theme-badge-text: #6D28D9;
}

[data-event-type="Corporate Event"],
[data-event-type="Corporate"] {
  --color-theme-accent: #1E3A8A;
  --color-theme-badge-bg: #EFF6FF;
  --color-theme-badge-text: #1E40AF;
}

[data-event-type="Community Event"] {
  --color-theme-accent: #C2410C;
  --color-theme-badge-bg: #FFF7ED;
  --color-theme-badge-text: #9A3412;
}
```

### 3. Typography

```css
:root {
  --font-family-display: 'Georgia', 'Playfair Display', serif;
  --font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-family-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Type Scale */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */

  /* Line Heights */
  --leading-tight: 1.2;
  --leading-snug: 1.35;
  --leading-normal: 1.5;
  --leading-relaxed: 1.65;
}
```

### 4. Elevation & Browser Surfaces

- **Shadows**: Natural offset blur (e.g. `0 1px 3px rgba(15, 23, 42, 0.05)`).
- **Scrollbars**: Styled with `--color-bg-subtle` track and `--color-border-strong` thumb.
- **Focus Rings**: `2px solid var(--color-accent-primary)` with `4px var(--color-focus-ring)` offset.
- **Selection**: `background: var(--color-accent-subtle); color: var(--color-brand-midnight);`

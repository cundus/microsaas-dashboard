---
name: Kinetic Obsidian
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dce6'
  primary: '#e0fdff'
  on-primary: '#00373a'
  primary-container: '#00f2fe'
  on-primary-container: '#006a70'
  inverse-primary: '#00696f'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#e1ffec'
  on-tertiary: '#003824'
  tertiary-container: '#67f4b7'
  on-tertiary-container: '#006e4b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ff6ff'
  primary-fixed-dim: '#00dce6'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-numeric:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: -0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  metric-stat:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.025em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system channels an advanced, mission-critical SaaS identity engineered specifically for high-velocity mobile monitoring. The design combines controlled dark-mode minimalism with refined glassmorphism and surgical cybernetic detailing. The interface evokes hyper-focus, architectural precision, and real-time operational command.

Key design principles:
- **Atmospheric Depth:** Deep abyssal backdrops set the stage for illuminated data streams, prioritizing low visual fatigue under continuous mobile monitoring.
- **Luminous Hierarchy:** Color is never purely decorative; intense electric cyan and emerald are deployed strictly as focal accelerators and health telemetry.
- **Surgical Craft:** Ultra-fine 1px light-refracting borders, controlled backdrop blurs, and tight micro-typographic scales mimic cockpit instrumentation engineered for high-density touch interfaces.

## Colors

The palette establishes high contrast against deep, ink-tinted charcoal canvases without causing visual vibration.

- **Base Canvas (`#090D16`):** The ground level for all mobile viewport backgrounds, providing complete black-level stabilization.
- **Surface Elevation (`#0F172A` / `#1E293B`):** Structural container tiers, tinted with cool slate to hold depth.
- **Electric Cyan (`#00F2FE`):** The primary signal color. Used for active navigation anchors, primary action hits, high-priority state lines, and real-time chart strokes.
- **Electric Indigo (`#6366F1`):** The secondary chromatic anchor. Manages secondary actions, complex graph series, contextual links, and volumetric gradient underlays.
- **Neon Emerald (`#10B981`):** The operational signal. Used for positive metrics, system health pulses, upward trend deltas, and live indicators.
- **Borders & Fringes (`rgba(255, 255, 255, 0.08)` to `rgba(0, 242, 254, 0.25)`): Subtle gradient-lit strokes define edges without harsh solid lines.

## Typography

Typography balances geometric forwardness with data legibility.

- **Plus Jakarta Sans** leads all display headlines, key metric outputs, and card titles. Its contemporary geometry brings modern energy to high-level summaries.
- **Inter** provides neutral, high-legibility execution across paragraph text, form elements, descriptions, and list items.
- **JetBrains Mono** anchors telemetry readings, timestamps, API status codes, and financial/performance figures to prevent horizontal jitter during real-time data updates.
- All uppercase labels enforce a wide tracking (`+0.06em`) to ensure instant legibility at microscopic sizes on mobile screens.

## Layout & Spacing

The layout is built for fluid touch navigation on modern handheld viewports, operating on a modular 4px/8px micro-grid.

- **Grid Model:** Fluid single-column layout on compact devices with nested horizontal scroll lanes for analytics segments and metric carousels. On wider viewports (phablets and folded screens), cards expand into a 2-column asymmetric grid with a `0.75rem` gap.
- **Screen Safe Zones:** Outer canvas horizontal margins sit at `1rem` (16px) to maximize screen real estate while protecting touch zones from edge-swipe gestures. Top and bottom anchors adhere strictly to device status bars and bottom navigation docks.
- **Density:** High-density arrangement allows 3 to 4 key operational modules to stay above the fold without overwhelming the user, achieved by collapsing secondary padding using `space-sm` and `space-md`.

## Elevation & Depth

Visual hierarchy does not rely on opaque cast shadows; instead, it utilizes translucent layering, localized backdrop filters, and luminescent contour borders.

- **Surface Level 0 (Base):** Solid `#090D16` canvas.
- **Surface Level 1 (Panels & Feed Cards):** Background `rgba(15, 23, 42, 0.65)` layered with `backdrop-filter: blur(16px)` and a directional top-edge border of `1px solid rgba(255, 255, 255, 0.08)`.
- **Surface Level 2 (Floating Modals, Drawers & Navigation Bar):** Background `rgba(30, 41, 59, 0.8)` with `backdrop-filter: blur(24px)`. Rim lighting is created using a perimeter border of `1px solid rgba(0, 242, 254, 0.2)`.
- **Glow Accents:** High-priority cards project a diffuse, non-structural color bloom: `box-shadow: 0 8px 32px -8px rgba(0, 242, 254, 0.15)`. Critical alerts or positive metric spikes use equivalent emerald glows (`rgba(16, 185, 129, 0.15)`).

## Shapes

The interface balances sharp technical precision with ergonomic tactile feel.

- **Standard Containers:** Dashboard cards, metric blocks, and bottom sheets use `rounded-lg` (1rem / 16px) to maintain a refined, modern profile.
- **Inputs & Action Items:** Buttons, text fields, and segmented tabs use a base curve of `0.5rem` (8px).
- **Status Indicators & Micro-Badges:** Pill radius (`9999px`) is reserved exclusively for tags, live telemetry pills, metric deltas, and avatar halos to cleanly separate content hierarchy from functional containers.

## Components

### Buttons
- **Primary Action:** Solid electric cyan `#00F2FE` gradient fill into teal, paired with `#090D16` bold text for maximum contrast. Glow radius of `0 0 16px rgba(0, 242, 254, 0.35)` on press.
- **Secondary Action:** Translucent dark slate `rgba(255, 255, 255, 0.04)` with a hairline border of `rgba(255, 255, 255, 0.12)` and high-white text.
- **Touch Target:** Minimum height of 48px with internal vertical padding of `0.75rem` to guarantee one-handed thumb accessibility.

### Cards & Metric Containers
- Glassmorphic panels with top-down linear gradient borders (`rgba(255, 255, 255, 0.15)` fading to `rgba(255, 255, 255, 0.02)`).
- Metric cards feature an anchored top row: micro-badge on the left, action icon on the right, primary stat headline (`metric-stat`) front and center, with sparklines or percentage deltas along the bottom floor.

### Micro-Badges & Chips
- Compact dimensions (20px to 24px height), pill-shaped.
- Translucent colored backgrounds (e.g., `rgba(16, 185, 129, 0.12)`) paired with solid contrasting text (`#10B981`) and an optional 6px glowing pulse dot for real-time states.

### Charts & Data Visualizations
- Ultra-sleek vector paths (`2px` line weight) with smooth Bézier curves in primary cyan or emerald.
- Area charts feature an ultra-soft vertical gradient fill beneath the curve, fading from `rgba(0, 242, 254, 0.2)` to completely transparent (`rgba(0, 242, 254, 0)`). Grid lines are dashed hairline borders in `rgba(255, 255, 255, 0.04)`.

### Form Inputs & Selectors
- Background `rgba(15, 23, 42, 0.8)` with inset hairline border.
- Active state transitions the border instantly to `#00F2FE` with a soft `0 0 8px rgba(0, 242, 254, 0.2)` ring.
- Placeholder text in muted cool slate (`#64748B`), switching to pure white on input.

### Navigation Dock
- Floating bottom tab bar suspended 16px above the home indicator.
- Glassmorphic styling with `backdrop-filter: blur(24px)` and `rgba(9, 13, 22, 0.85)` fill.
- Active icons light up in `#00F2FE` with an ambient glow, while inactive icons sit at `#64748B`.
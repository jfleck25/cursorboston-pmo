---
name: Momentum
colors:
  surface: '#0e131e'
  surface-dim: '#0e131e'
  surface-bright: '#343945'
  surface-container-lowest: '#090e18'
  surface-container-low: '#161c26'
  surface-container: '#1b202b'
  surface-container-high: '#252a35'
  surface-container-highest: '#303540'
  on-surface: '#dee2f1'
  on-surface-variant: '#b9ccb5'
  inverse-surface: '#dee2f1'
  inverse-on-surface: '#2b303c'
  outline: '#849581'
  outline-variant: '#3b4b3a'
  surface-tint: '#00e55b'
  primary: '#edffe8'
  on-primary: '#003911'
  primary-container: '#00ff66'
  on-primary-container: '#007128'
  inverse-primary: '#006e27'
  secondary: '#d3fbff'
  on-secondary: '#00363a'
  secondary-container: '#00eefc'
  on-secondary-container: '#00686f'
  tertiary: '#fff8f4'
  on-tertiary: '#432c00'
  tertiary-container: '#ffd79e'
  on-tertiary-container: '#835900'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6bff83'
  primary-fixed-dim: '#00e55b'
  on-primary-fixed: '#002107'
  on-primary-fixed-variant: '#00531b'
  secondary-fixed: '#7df4ff'
  secondary-fixed-dim: '#00dbe9'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#ffddaf'
  tertiary-fixed-dim: '#ffba43'
  on-tertiary-fixed: '#281800'
  on-tertiary-fixed-variant: '#614000'
  background: '#0e131e'
  on-background: '#dee2f1'
  surface-variant: '#303540'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.4'
  data-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style

The design system is built for a high-performance environment where developer productivity meets the adrenaline of competitive gaming. It targets tech-savvy developer cohorts who thrive on visual feedback, streaks, and technical precision. 

The aesthetic is a hybrid of a **Modern IDE** and **Retro-Futuristic Arcade**. It leverages a "Cyber-IDE" style: high-density layouts, 1px technical borders, and glowing accents that signify "live" data or active progress. The emotional response should be one of "Flow State"—focused, intense, and rewarding. 

Key visual principles include:
- **Technical Rigor:** Every element feels calculated and aligned to a strict grid.
- **Luminance as Information:** Color is used sparingly but intensely to denote status, shipping velocity, and achievements.
- **Glassmorphism Lite:** Subtle transparency to maintain context without sacrificing legibility or performance.

## Colors

The palette is rooted in a deep, non-pure black **Deep Obsidian** to minimize eye strain during long coding sessions and provide a high-contrast foundation for neon accents.

- **Neon Cyber-Green (Primary):** Reserved for "success" states, active streaks, and "Shipping" actions. It should feel radioactive and energetic.
- **Electric Blue (Secondary):** Used for structural UI elements, navigation highlights, and interactive borders. It provides a technical, cool-toned balance to the green.
- **Faded Amber (Warning):** Used for pending reviews, blockers, or warnings. It is desaturated compared to the neons to avoid visual clutter.
- **Muted Gray (Neutral):** The workhorse for secondary text, disabled states, and subtle grid lines.

## Typography

This design system employs a dual-font strategy to distinguish between UI narrative and technical data.

- **Inter (Sans-serif):** Used for the primary interface, headlines, and descriptions. It provides a modern, legible, and neutral foundation that balances the more aggressive "arcade" elements.
- **JetBrains Mono (Monospace):** Used for labels, counts, IDs, code snippets, and any gamified metrics. This reinforces the "developer-first" nature of the tool and ensures numbers remain legible in dense dashboards.

On mobile, `headline-xl` should scale down to 32px, while `headline-lg` scales to 24px to maintain density without causing horizontal overflow.

## Layout & Spacing

The layout philosophy is a **Fixed Technical Grid**. It mimics the high-density efficiency of an IDE like VS Code or IntelliJ. 

- **Grid:** Use a 12-column grid for desktop with 16px gutters. Panels should feel snapped to this grid.
- **Density:** Spacing is tight to maximize "above the fold" information. A 4px baseline shift is used for all internal component padding.
- **Reflow:** On mobile, the grid collapses to a single column. Horizontal scrolling is permitted for "Data Boards" (Kanban style) to maintain the Monospace data integrity.
- **Structure:** Use "Panels" as the primary organizational unit, separated by 1px borders rather than wide gaps.

## Elevation & Depth

Depth is conveyed through **Luminescence and Layering** rather than traditional soft shadows.

- **Tonal Layers:** The background is `#0F1115`. Elevated surfaces (cards/modals) use a slightly lighter `#1A1D23` or a semi-transparent version of it with a 12px backdrop blur.
- **1px Technical Borders:** All interactive panels use a 1px border. Default borders use the Muted Gray (`#3A3F4B`), while "active" or "focused" panels use Electric Blue (`#00F0FF`).
- **The Glow (Bloom):** High-priority items (like a "Shipping" button or an active streak) utilize a small, saturated outer glow (drop-shadow with 8px-12px blur) using the Primary Cyber-Green.
- **Interaction:** On hover, borders should transition from Muted Gray to Electric Blue or Cyber-Green to simulate a "system boot" or "power-on" effect.

## Shapes

The shape language is **Technical and Precise**. 

We use a "Soft" roundedness (`0.25rem` or 4px) for most components. This prevents the UI from feeling too "organic" or "bubbly" while avoiding the harshness of 0px sharp corners.

- **Standard Elements:** 4px radius (Buttons, Input fields, Cards).
- **Gamified Elements:** Progress bars and "Level" badges may use a radius of 0px to emphasize the arcade/retro feel.
- **Avatars:** Strictly square with a 4px radius, never circular, to fit the IDE aesthetic.

## Components

### Buttons
- **Primary:** Background `#00FF66`, Text `#0F1115` (Deep Obsidian). High contrast. No border.
- **Secondary/Outline:** Background transparent, 1px border `#00F0FF`, Text `#00F0FF`.
- **Ghost:** Monospace text, no background, underline on hover.

### Cards & Panels
- **Container:** Background `#1A1D23` at 80% opacity, 12px backdrop-blur.
- **Border:** 1px solid `#3A3F4B`.
- **Header:** A subtle top-bar in the card with a `label-caps` font to denote the section name.

### Input Fields
- **Style:** "Terminal" style. Darker background than the card, 1px bottom border only (or full border on focus).
- **Caret:** A block-style cursor for the focus state, potentially blinking.

### Progress & Streaks
- **Streak Tracker:** Uses the `data-lg` Monospace font. Active days are represented by filled Cyber-Green squares; inactive days are empty `#3A3F4B` squares.
- **Glow:** When a user is "On Fire" (streak > 5), the entire component gains a subtle Cyber-Green outer glow.

### Chips
- **Status Chips:** Small, rectangular, with 2px radius. Uses `#3A3F4B` background with Monospace labels. 

### AI Interaction
- Elements generated or assisted by AI should feature a subtle gradient border transitioning from Electric Blue to Cyber-Green to distinguish them from manual developer input.
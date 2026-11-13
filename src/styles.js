/**
 * Shadow DOM styles for ha-leaderboard-card and ha-leaderboard-card-editor.
 */

export const CARD_STYLES = `
  :host {
    display: block;
    color-scheme: light dark;
    --lb-radius: var(--ha-card-border-radius, 14px);
    --lb-text: var(--primary-text-color, #1e293b);
    --lb-text-muted: var(--secondary-text-color, #64748b);
    --lb-surface: var(--ha-card-background, var(--card-background-color, #ffffff));
    --lb-surface-subtle: var(--secondary-background-color, rgba(148, 163, 184, 0.12));
    --lb-border: var(--divider-color, rgba(148, 163, 184, 0.24));
    --lb-accent: var(--primary-color, #0284c7);

    --rank-1-color: #d97706;
    --rank-1-badge-bg: #f59e0b;
    --rank-1-badge-fg: #111827;
    --rank-2-color: #64748b;
    --rank-2-badge-bg: #94a3b8;
    --rank-2-badge-fg: #0f172a;
    --rank-3-color: #b45309;
    --rank-3-badge-bg: #d97706;
    --rank-3-badge-fg: #ffffff;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  ha-card {
    overflow: clip;
    border-radius: var(--lb-radius);
    background: var(--lb-surface);
    color: var(--lb-text);
  }

  .leaderboard-container {
    container: leaderboard / inline-size;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Header */
  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    min-inline-size: 0;
  }

  .header-icon-wrap {
    display: grid;
    place-items: center;
    inline-size: 36px;
    block-size: 36px;
    flex: 0 0 auto;
    border-radius: 10px;
    background: color-mix(in oklab, var(--lb-accent), transparent 85%);
    color: var(--lb-accent);
  }

  .header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-inline-size: 0;
    flex: 1 1 auto;
  }

  .card-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.01em;
    color: var(--lb-text);
    overflow-wrap: anywhere;
  }

  .card-subtitle {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.3;
    color: var(--lb-text-muted);
  }

  .header-total-pill {
    margin-inline-start: auto;
    flex: 0 0 auto;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--lb-text-muted);
    background: var(--lb-surface-subtle);
    border: 1px solid var(--lb-border);
    white-space: nowrap;
  }

  /* Inline period switcher */
  .period-switcher-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .period-switcher {
    display: inline-flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
    padding: 3px;
    border-radius: 10px;
    background: var(--lb-surface-subtle);
    border: 1px solid var(--lb-border);
  }

  .period-tab {
    appearance: none;
    padding: 4px 10px;
    border-radius: 7px;
    font: inherit;
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1.3;
    border: 1px solid transparent;
    background: transparent;
    color: var(--lb-text-muted);
    cursor: pointer;
    transition: background-color 140ms ease-out, color 140ms ease-out, border-color 140ms ease-out;
  }

  .period-tab:hover {
    color: var(--lb-text);
  }

  .period-tab:focus-visible {
    outline: 2px solid CanvasText;
    outline-offset: 2px;
  }

  .period-tab[aria-pressed="true"] {
    background: var(--lb-surface);
    color: var(--lb-text);
    border-color: var(--lb-border);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
  }

  .period-loading {
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--lb-text-muted);
  }

  /* Icons */
  ha-icon {
    --mdc-icon-size: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .fallback-icon {
    display: block;
    inline-size: 22px;
    block-size: 22px;
  }

  .header-icon-wrap .fallback-icon,
  .header-icon-wrap ha-icon {
    inline-size: 20px;
    block-size: 20px;
    --mdc-icon-size: 20px;
  }

  /* Shared interactive item reset */
  .leaderboard-item {
    appearance: none;
    border: 1px solid transparent;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: inherit;
    padding: 0;
    margin: 0;
    cursor: pointer;
    position: relative;
    transition: transform 150ms ease-out, box-shadow 150ms ease-out, background-color 150ms ease-out, border-color 150ms ease-out;
  }

  .leaderboard-item:active {
    scale: 0.98;
  }

  .leaderboard-item:focus-visible {
    outline: 2px solid CanvasText;
    outline-offset: 2px;
  }

  /* ======================================================================
     PODIUM LAYOUT
     ====================================================================== */
  .podium-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    align-items: end;
  }

  /* Media query fallback for older browsers without container query support */
  @media (min-width: 480px) {
    .podium-grid {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.14fr) minmax(0, 1fr);
      grid-template-areas: "second first third";
      gap: 10px;
    }

    .podium-grid[data-order="1-2-3"] {
      grid-template-areas: "first second third";
    }

    .podium-item.rank-1 { grid-area: first; }
    .podium-item.rank-2 { grid-area: second; }
    .podium-item.rank-3 { grid-area: third; }
  }

  /* Container query enhancement */
  @supports (container-type: inline-size) {
    @media (min-width: 480px) {
      .podium-grid {
        grid-template-columns: 1fr;
        grid-template-areas: none;
      }

      .podium-item.rank-1,
      .podium-item.rank-2,
      .podium-item.rank-3 {
        grid-area: auto;
      }
    }

    @container leaderboard (min-width: 280px) {
      .podium-grid {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.14fr) minmax(0, 1fr);
        grid-template-areas: "second first third";
        gap: 10px;
      }

      .podium-grid[data-order="1-2-3"] {
        grid-template-areas: "first second third";
      }

      .podium-grid[data-count="1"] {
        grid-template-columns: minmax(0, 220px);
        grid-template-areas: "first";
        justify-content: center;
      }

      .podium-grid[data-count="2"] {
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
        grid-template-areas: "first second";
      }

      .podium-item.rank-1 { grid-area: first; }
      .podium-item.rank-2 { grid-area: second; }
      .podium-item.rank-3 { grid-area: third; }
    }
  }

  .podium-item {
    --item-accent: var(--lb-accent);
    --rank-badge-bg: var(--item-accent);
    --rank-badge-fg: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 8px 0;
    border-radius: 14px;
    min-inline-size: 0;
    inline-size: 100%;
    background: var(--lb-surface-subtle);
    border: 1px solid var(--lb-border);
  }

  .podium-item:hover {
    border-color: color-mix(in oklab, var(--item-accent), transparent 35%);
    background: color-mix(in oklab, var(--item-accent), transparent 90%);
    box-shadow: 0 4px 14px rgb(0 0 0 / 0.08);
  }

  .podium-item.rank-1 {
    --item-accent: var(--custom-accent, var(--rank-1-color));
    --rank-badge-bg: var(--rank-1-badge-bg);
    --rank-badge-fg: var(--rank-1-badge-fg);
    background: color-mix(in oklab, var(--item-accent), transparent 90%);
    border-color: color-mix(in oklab, var(--item-accent), transparent 55%);
    padding-block-start: 14px;
  }

  .podium-item.rank-2 {
    --item-accent: var(--custom-accent, var(--rank-2-color));
    --rank-badge-bg: var(--rank-2-badge-bg);
    --rank-badge-fg: var(--rank-2-badge-fg);
  }

  .podium-item.rank-3 {
    --item-accent: var(--custom-accent, var(--rank-3-color));
    --rank-badge-bg: var(--rank-3-badge-bg);
    --rank-badge-fg: var(--rank-3-badge-fg);
  }

  .podium-crown {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--rank-1-color);
    margin-block-end: -4px;
  }

  .podium-crown .fallback-icon,
  .podium-crown ha-icon {
    inline-size: 18px;
    block-size: 18px;
    --mdc-icon-size: 18px;
  }

  .podium-avatar {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: 46px;
    block-size: 46px;
    border-radius: 50%;
    background: color-mix(in oklab, var(--item-accent), transparent 82%);
    color: var(--item-accent);
    border: 2px solid color-mix(in oklab, var(--item-accent), transparent 45%);
    flex: 0 0 auto;
  }

  .podium-item.rank-1 .podium-avatar {
    inline-size: 54px;
    block-size: 54px;
  }

  .podium-item.rank-1 .podium-avatar .fallback-icon,
  .podium-item.rank-1 .podium-avatar ha-icon {
    inline-size: 26px;
    block-size: 26px;
    --mdc-icon-size: 26px;
  }

  .rank-chip {
    position: absolute;
    inset-block-end: -5px;
    inset-inline-end: -6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 22px;
    block-size: 20px;
    padding-inline: 5px;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 800;
    line-height: 1;
    background: var(--rank-badge-bg);
    color: var(--rank-badge-fg);
    border: 2px solid var(--lb-surface);
    font-variant-numeric: tabular-nums;
  }

  .podium-meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    inline-size: 100%;
    min-inline-size: 0;
    text-align: center;
    padding-inline: 2px;
  }

  .podium-name {
    font-size: clamp(0.74rem, 2.8cqi, 0.86rem);
    font-weight: 700;
    line-height: 1.25;
    color: var(--lb-text);
    inline-size: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .podium-item.rank-1 .podium-name {
    font-size: clamp(0.8rem, 3.1cqi, 0.94rem);
  }

  .podium-value {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 3px;
    font-size: 1.05rem;
    font-weight: 800;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    color: var(--lb-text);
  }

  .podium-item.rank-1 .podium-value {
    font-size: 1.2rem;
  }

  .podium-unit {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--lb-text-muted);
  }

  .podium-share {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--lb-text-muted);
    background: var(--lb-surface);
    border: 1px solid var(--lb-border);
    border-radius: 999px;
    padding: 1px 7px;
    font-variant-numeric: tabular-nums;
  }

  .podium-pedestal {
    inline-size: calc(100% + 16px);
    margin-inline: -8px;
    block-size: var(--pedestal-height, 44px);
    min-block-size: 26px;
    border-start-start-radius: 8px;
    border-start-end-radius: 8px;
    border-end-start-radius: 13px;
    border-end-end-radius: 13px;
    background: linear-gradient(
      180deg,
      color-mix(in oklab, var(--item-accent), transparent 68%) 0%,
      color-mix(in oklab, var(--item-accent), transparent 84%) 100%
    );
    border-block-start: 2px solid color-mix(in oklab, var(--item-accent), transparent 30%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: var(--lb-text);
  }

  /* Compact stacked podium when container < 280px */
  @container leaderboard (max-width: 279px) {
    .podium-item {
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      padding: 10px 12px;
      gap: 10px;
    }

    .podium-crown,
    .podium-pedestal {
      display: none;
    }

    .podium-meta {
      align-items: flex-start;
      text-align: start;
      flex: 1 1 auto;
    }

    .podium-value {
      justify-content: flex-start;
    }
  }

  /* ======================================================================
     RANKED BAR LIST LAYOUT
     ====================================================================== */
  .ranked-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .list-item {
    --item-accent: var(--lb-accent);
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    inline-size: 100%;
    background: var(--lb-surface-subtle);
    border: 1px solid var(--lb-border);
  }

  .list-item:hover {
    border-color: color-mix(in oklab, var(--item-accent), transparent 35%);
    background: color-mix(in oklab, var(--item-accent), transparent 90%);
  }

  .list-item.rank-1 { --item-accent: var(--custom-accent, var(--rank-1-color)); }
  .list-item.rank-2 { --item-accent: var(--custom-accent, var(--rank-2-color)); }
  .list-item.rank-3 { --item-accent: var(--custom-accent, var(--rank-3-color)); }

  .list-rank {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 26px;
    block-size: 26px;
    padding-inline: 6px;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    background: color-mix(in oklab, var(--item-accent), transparent 82%);
    color: var(--lb-text);
    border: 1px solid color-mix(in oklab, var(--item-accent), transparent 55%);
  }

  .list-item.rank-1 .list-rank {
    background: var(--rank-1-badge-bg);
    color: var(--rank-1-badge-fg);
    border-color: transparent;
  }

  .list-item.rank-2 .list-rank {
    background: var(--rank-2-badge-bg);
    color: var(--rank-2-badge-fg);
    border-color: transparent;
  }

  .list-item.rank-3 .list-rank {
    background: var(--rank-3-badge-bg);
    color: var(--rank-3-badge-fg);
    border-color: transparent;
  }

  .list-icon {
    display: grid;
    place-items: center;
    inline-size: 36px;
    block-size: 36px;
    border-radius: 10px;
    background: color-mix(in oklab, var(--item-accent), transparent 84%);
    color: var(--item-accent);
    flex: 0 0 auto;
  }

  .list-icon .fallback-icon,
  .list-icon ha-icon {
    inline-size: 20px;
    block-size: 20px;
    --mdc-icon-size: 20px;
  }

  .list-main {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-inline-size: 0;
  }

  .list-name {
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.25;
    color: var(--lb-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .progress-track {
    display: block;
    inline-size: 100%;
    block-size: 7px;
    border-radius: 999px;
    background: color-mix(in oklab, var(--lb-text), transparent 90%);
    overflow: clip;
  }

  .progress-fill {
    display: block;
    block-size: 100%;
    inline-size: var(--bar-width, 0%);
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      color-mix(in oklab, var(--item-accent), transparent 20%),
      var(--item-accent)
    );
  }

  .list-stats {
    margin-inline-start: auto;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex: 0 0 auto;
  }

  .list-value-row {
    display: flex;
    align-items: baseline;
    gap: 3px;
    font-size: 0.96rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--lb-text);
  }

  .list-unit {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--lb-text-muted);
  }

  .list-share {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--lb-text-muted);
    font-variant-numeric: tabular-nums;
  }

  .section-divider {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--lb-text-muted);
    margin-block: 2px -4px;
  }

  .section-divider::after {
    content: "";
    flex: 1 1 auto;
    block-size: 1px;
    background: var(--lb-border);
  }

  /* Empty / unconfigured state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 8px;
    padding: 24px 16px;
    border-radius: 12px;
    background: var(--lb-surface-subtle);
    border: 1px dashed var(--lb-border);
    color: var(--lb-text-muted);
  }

  .empty-state-title {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--lb-text);
  }

  .empty-state-desc {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.4;
    max-inline-size: 38ch;
  }

  .empty-state code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.76rem;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--lb-surface);
    border: 1px solid var(--lb-border);
  }

  /* Reduced motion animations */
  @media (prefers-reduced-motion: no-preference) {
    .podium-pedestal {
      animation: podium-rise 360ms ease-out both;
      transform-origin: bottom;
    }

    .progress-fill {
      animation: bar-grow 420ms ease-out both;
      transform-origin: left;
    }
  }

  @keyframes podium-rise {
    from {
      opacity: 0.55;
      transform: scaleY(0.35);
    }
    to {
      opacity: 1;
      transform: scaleY(1);
    }
  }

  @keyframes bar-grow {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }

  /* Forced Colors Mode (Windows High Contrast) */
  @media (forced-colors: active) {
    .podium-item,
    .list-item,
    .header-total-pill,
    .period-switcher,
    .podium-share,
    .empty-state {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    .period-tab[aria-pressed="true"] {
      border: 1px solid Highlight;
      background: Highlight;
      color: HighlightText;
    }

    .podium-item.rank-1 {
      border-width: 2px;
      border-color: Highlight;
    }

    .podium-pedestal {
      border: 1px solid CanvasText;
      border-block-start: 2px solid Highlight;
      background: Canvas;
      color: CanvasText;
    }

    .progress-track {
      border: 1px solid CanvasText;
      background: Canvas;
    }

    .progress-fill {
      background: Highlight;
    }

    .rank-chip,
    .list-rank {
      border: 1px solid CanvasText;
      background: Highlight;
      color: HighlightText;
    }
  }
`;

export const EDITOR_STYLES = `
  :host {
    display: block;
    color-scheme: light dark;
    --ed-text: var(--primary-text-color, #1e293b);
    --ed-muted: var(--secondary-text-color, #64748b);
    --ed-bg: var(--card-background-color, #ffffff);
    --ed-subtle: var(--secondary-background-color, rgba(148, 163, 184, 0.1));
    --ed-border: var(--divider-color, rgba(148, 163, 184, 0.3));
    --ed-accent: var(--primary-color, #0284c7);
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  .editor-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: var(--ed-text);
    font-family: inherit;
  }

  .editor-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid var(--ed-border);
    background: var(--ed-subtle);
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .section-title {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ed-muted);
  }

  .match-badge {
    font-size: 0.74rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(in oklab, var(--ed-accent), transparent 82%);
    color: var(--ed-accent);
  }

  .field-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-inline-size: 0;
  }

  .field label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--ed-muted);
  }

  .field input[type="text"],
  .field input[type="number"],
  .field select {
    inline-size: 100%;
    padding: 7px 9px;
    border-radius: 7px;
    border: 1px solid var(--ed-border);
    background: var(--ed-bg);
    color: var(--ed-text);
    font: inherit;
    font-size: 0.86rem;
  }

  .field input:focus-visible,
  .field select:focus-visible,
  button:focus-visible {
    outline: 2px solid CanvasText;
    outline-offset: 2px;
  }

  .hint {
    font-size: 0.72rem;
    color: var(--ed-muted);
    line-height: 1.3;
  }

  .toggle-row {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    padding-block-start: 4px;
  }

  .toggle-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.84rem;
    font-weight: 500;
    cursor: pointer;
  }

  .entities-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .entity-row {
    display: grid;
    grid-template-columns: minmax(140px, 1.4fr) minmax(100px, 1fr) minmax(100px, 1fr) 44px auto;
    gap: 6px;
    align-items: center;
    padding: 8px;
    border-radius: 8px;
    background: var(--ed-bg);
    border: 1px solid var(--ed-border);
  }

  @media (max-width: 600px) {
    .entity-row {
      grid-template-columns: 1fr 1fr;
    }
  }

  .entity-row input[type="text"] {
    inline-size: 100%;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--ed-border);
    background: var(--ed-bg);
    color: var(--ed-text);
    font: inherit;
    font-size: 0.82rem;
    min-inline-size: 0;
  }

  .color-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .entity-row input[type="color"] {
    inline-size: 36px;
    block-size: 30px;
    padding: 1px;
    border: 1px solid var(--ed-border);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 8px;
    border: 1px solid var(--ed-border);
    background: var(--ed-bg);
    color: var(--ed-text);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  .btn:hover {
    border-color: var(--ed-accent);
    color: var(--ed-accent);
  }

  .btn-icon {
    padding: 6px;
    min-inline-size: 30px;
    block-size: 30px;
    color: #dc2626;
  }

  .btn-icon .fallback-icon {
    inline-size: 16px;
    block-size: 16px;
  }
`;

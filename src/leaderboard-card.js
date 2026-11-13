import { collectCandidateEntityIds, normalizeConfig, resolveEntities } from './filter.js';
import { escapeAttr, escapeHtml, renderIcon } from './icons.js';
import { getLanguage, localize } from './localize.js';
import { fetchPeriodValues } from './period.js';
import { CARD_STYLES } from './styles.js';

const BaseCardElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};
const PERIOD_CACHE_TTL_MS = 60_000;

export class HaLeaderboardCard extends BaseCardElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._rawConfig = {};
    this._config = normalizeConfig({});
    this._hass = null;
    this._lastSignature = null;
    this._activePeriod = this._config.period;
    this._periodCache = new Map();
    this._loadingPeriod = false;
    this._periodRequestSeq = 0;
    this._boundClickHandler = this._onContainerClick.bind(this);
  }

  static getConfigElement() {
    return document.createElement('ha-leaderboard-card-editor');
  }

  static getStubConfig() {
    return {
      type: 'custom:ha-leaderboard-card',
      layout: 'podium',
      limit: 3,
      entities: [],
    };
  }

  setConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid configuration for ha-leaderboard-card.');
    }
    this._rawConfig = { ...config };
    this._config = normalizeConfig(config);
    this._activePeriod = this._config.period;
    this._periodCache.clear();
    this._lastSignature = null;
    this._render();
    if (this._hass && this._activePeriod !== 'all') {
      this._ensurePeriodData(true);
    }
  }

  set hass(hass) {
    this._hass = hass;
    const signature = this._computeSignature(hass);
    if (signature !== this._lastSignature) {
      this._lastSignature = signature;
      this._render();
    }
    if (this._activePeriod !== 'all') {
      this._ensurePeriodData();
    }
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    if (this._config.layout === 'list') {
      return Math.max(2, Math.min(8, this._config.limit + 1));
    }
    if (this._config.layout === 'both') {
      return Math.max(4, Math.min(10, this._config.limit + 3));
    }
    return 4;
  }

  getGridOptions() {
    return {
      columns: 6,
      min_columns: 3,
      rows: this._config.layout === 'both' ? 5 : 4,
      min_rows: 2,
    };
  }

  _getCachedPeriodValues(period) {
    if (period === 'all' || !this._hass) return null;
    const entityIds = collectCandidateEntityIds(this._config, this._hass);
    const cacheKey = `${period}:${entityIds.join(',')}`;
    const cached = this._periodCache.get(cacheKey);
    return cached ? cached.values : null;
  }

  async _ensurePeriodData(force = false) {
    const period = this._activePeriod || this._config.period;
    if (period === 'all' || !this._hass?.states) return;

    const entityIds = collectCandidateEntityIds(this._config, this._hass);
    if (entityIds.length === 0) return;

    const cacheKey = `${period}:${entityIds.join(',')}`;
    const cached = this._periodCache.get(cacheKey);
    const isFresh = cached && Date.now() - cached.timestamp < PERIOD_CACHE_TTL_MS;
    if (!force && isFresh) return;

    const requestSeq = ++this._periodRequestSeq;
    if (!cached) {
      this._loadingPeriod = true;
      this._render();
    }

    try {
      const values = await fetchPeriodValues(this._hass, entityIds, period);
      if (requestSeq !== this._periodRequestSeq) return;
      this._periodCache.set(cacheKey, { timestamp: Date.now(), values });
    } finally {
      if (requestSeq === this._periodRequestSeq) {
        this._loadingPeriod = false;
        this._lastSignature = this._computeSignature(this._hass);
        this._render();
      }
    }
  }

  _computeSignature(hass) {
    if (!hass?.states) return 'no-hass';
    const lang = getLanguage(hass, this._config);
    const activePeriod = this._activePeriod || this._config.period;
    const periodValues = this._getCachedPeriodValues(activePeriod);
    const resolved = resolveEntities(this._config, hass, periodValues);
    const itemSig = resolved.items
      .map((item) => `${item.entityId}:${item.value}:${item.name}:${item.icon}:${item.color}:${item.unit}`)
      .join('|');
    return `${lang}#${activePeriod}#${this._loadingPeriod}#${resolved.totalMatched}#${resolved.totalValue}#${itemSig}`;
  }

  _onContainerClick(event) {
    const periodBtn = event.target.closest('button.period-tab[data-period]');
    if (periodBtn) {
      const nextPeriod = periodBtn.dataset.period;
      if (nextPeriod && nextPeriod !== this._activePeriod) {
        this._activePeriod = nextPeriod;
        this._lastSignature = null;
        this._render();
        if (nextPeriod !== 'all') {
          this._ensurePeriodData();
        }
      }
      return;
    }

    const btn = event.target.closest('button[data-entity-id]');
    if (!btn) return;
    const entityId = btn.dataset.entityId;
    if (!entityId) return;

    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        detail: { entityId },
        bubbles: true,
        composed: true,
      })
    );
  }

  _getPedestalHeight(item) {
    const pct = item.percentageOfMax || 0;
    if (item.rank === 1) {
      return Math.max(66, Math.round(32 + (pct / 100) * 50));
    }
    if (item.rank === 2) {
      return Math.max(46, Math.min(68, Math.round(26 + (pct / 100) * 44)));
    }
    return Math.max(30, Math.min(54, Math.round(22 + (pct / 100) * 34)));
  }

  _renderPodiumItem(item, config) {
    const customAccentStyle = item.color ? `--custom-accent: ${escapeAttr(item.color)};` : '';
    const pedestalHeight = this._getPedestalHeight(item);
    const rankLabel = `#${item.rank}`;
    const ariaLabel = `${rankLabel} ${item.name}: ${item.formattedValue}${item.unit ? ` ${item.unit}` : ''}`;

    return `
      <button
        type="button"
        class="leaderboard-item podium-item rank-${item.rank}"
        data-entity-id="${escapeAttr(item.entityId)}"
        aria-label="${escapeAttr(ariaLabel)}"
        style="${customAccentStyle}"
      >
        ${item.rank === 1 ? `<span class="podium-crown" aria-hidden="true">${renderIcon('mdi:crown')}</span>` : ''}
        <div class="podium-avatar">
          ${renderIcon(item.icon)}
          <span class="rank-chip" aria-hidden="true">${rankLabel}</span>
        </div>
        <div class="podium-meta">
          <span class="podium-name" title="${escapeAttr(item.name)}">${escapeHtml(item.name)}</span>
          <span class="podium-value">
            <span>${escapeHtml(item.formattedValue)}</span>
            ${item.unit ? `<span class="podium-unit">${escapeHtml(item.unit)}</span>` : ''}
          </span>
          ${config.show_percentage ? `<span class="podium-share">${item.percentageOfTotal}%</span>` : ''}
        </div>
        <div class="podium-pedestal" style="--pedestal-height: ${pedestalHeight}px;" aria-hidden="true">
          ${rankLabel}
        </div>
      </button>
    `;
  }

  _renderListItem(item, config) {
    const customAccentStyle = item.color ? `--custom-accent: ${escapeAttr(item.color)};` : '';
    const ariaLabel = `#${item.rank} ${item.name}: ${item.formattedValue}${item.unit ? ` ${item.unit}` : ''}`;

    return `
      <button
        type="button"
        class="leaderboard-item list-item rank-${item.rank}"
        data-entity-id="${escapeAttr(item.entityId)}"
        aria-label="${escapeAttr(ariaLabel)}"
        style="${customAccentStyle}"
      >
        <span class="list-rank" aria-hidden="true">#${item.rank}</span>
        <span class="list-icon">${renderIcon(item.icon)}</span>
        <span class="list-main">
          <span class="list-name" title="${escapeAttr(item.name)}">${escapeHtml(item.name)}</span>
          <span class="progress-track" aria-hidden="true">
            <span class="progress-fill" style="--bar-width: ${item.percentageOfMax}%;"></span>
          </span>
        </span>
        <span class="list-stats">
          <span class="list-value-row">
            <span>${escapeHtml(item.formattedValue)}</span>
            ${item.unit ? `<span class="list-unit">${escapeHtml(item.unit)}</span>` : ''}
          </span>
          ${config.show_percentage ? `<span class="list-share">${item.percentageOfTotal}%</span>` : ''}
        </span>
      </button>
    `;
  }

  _renderEmptyState(lang) {
    return `
      <div class="empty-state" role="status">
        ${renderIcon(this._config.header_icon || 'mdi:trophy-outline')}
        <p class="empty-state-title">${escapeHtml(localize('card.empty_title', lang))}</p>
        <p class="empty-state-desc">${escapeHtml(localize('card.empty_desc', lang))}</p>
      </div>
    `;
  }

  _renderPeriodSwitcher(config, activePeriod, lang) {
    if (!config.show_period_selector) return '';
    const periods = ['today', 'week', 'month', 'year', 'all'];
    if (
      ['this_week', 'this_month', 'this_year'].includes(config.period) &&
      !periods.includes(config.period)
    ) {
      periods.splice(periods.length - 1, 0, config.period);
    }

    return `
      <div class="period-switcher-row">
        <div class="period-switcher" role="group" aria-label="${escapeAttr(localize('card.period_group_label', lang))}">
          ${periods
            .map((p) => {
              const pressed = p === activePeriod ? 'true' : 'false';
              return `
                <button
                  type="button"
                  class="period-tab"
                  data-period="${escapeAttr(p)}"
                  aria-pressed="${pressed}"
                >${escapeHtml(localize(`card.period_${p}`, lang))}</button>
              `;
            })
            .join('')}
        </div>
        ${this._loadingPeriod ? `<span class="period-loading">${escapeHtml(localize('card.loading_period', lang))}</span>` : ''}
      </div>
    `;
  }

  _render() {
    if (!this.shadowRoot) return;

    const activeEntityId =
      this.shadowRoot.activeElement?.dataset?.entityId || null;
    const activePeriodTab =
      this.shadowRoot.activeElement?.dataset?.period || null;

    const config = this._config;
    const lang = getLanguage(this._hass, config);
    const activePeriod = this._activePeriod || config.period;
    const periodValues = this._getCachedPeriodValues(activePeriod);
    const { items, totalMatched, totalValue } = resolveEntities(config, this._hass, periodValues);

    const hasHeader = Boolean(config.title || config.subtitle || config.header_icon);
    const displayUnit = config.hide_unit
      ? ''
      : config.unit || (items.length > 0 && items.every((i) => i.unit === items[0].unit) ? items[0].unit : '');
    const formattedTotal = Number.isInteger(totalValue)
      ? totalValue.toLocaleString()
      : totalValue.toLocaleString(undefined, { maximumFractionDigits: 1 });

    let bodyHtml = '';
    if (items.length === 0) {
      bodyHtml = this._renderEmptyState(lang);
    } else if (config.layout === 'podium') {
      const podiumItems = items.slice(0, 3);
      const overflowItems = items.slice(3);
      bodyHtml = `
        <div class="podium-grid" data-order="${escapeAttr(config.podium_order)}" data-count="${podiumItems.length}">
          ${podiumItems.map((item) => this._renderPodiumItem(item, config)).join('')}
        </div>
        ${
          overflowItems.length > 0
            ? `
          <div class="section-divider">${escapeHtml(localize('card.runners_up', lang))}</div>
          <div class="ranked-list">
            ${overflowItems.map((item) => this._renderListItem(item, config)).join('')}
          </div>
        `
            : ''
        }
      `;
    } else if (config.layout === 'list') {
      bodyHtml = `
        <div class="ranked-list">
          ${items.map((item) => this._renderListItem(item, config)).join('')}
        </div>
      `;
    } else {
      // layout === 'both'
      const podiumItems = items.slice(0, 3);
      const listItems = items.length > 3 ? items.slice(3) : items;
      const dividerLabel =
        items.length > 3
          ? localize('card.runners_up', lang)
          : localize('card.ranking_breakdown', lang);
      bodyHtml = `
        <div class="podium-grid" data-order="${escapeAttr(config.podium_order)}" data-count="${podiumItems.length}">
          ${podiumItems.map((item) => this._renderPodiumItem(item, config)).join('')}
        </div>
        <div class="section-divider">${escapeHtml(dividerLabel)}</div>
        <div class="ranked-list">
          ${listItems.map((item) => this._renderListItem(item, config)).join('')}
        </div>
      `;
    }

    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLES}</style>
      <ha-card>
        <div class="leaderboard-container">
          ${
            hasHeader
              ? `
            <header class="card-header">
              ${
                config.header_icon
                  ? `<div class="header-icon-wrap">${renderIcon(config.header_icon)}</div>`
                  : ''
              }
              <div class="header-text">
                ${config.title ? `<h2 class="card-title">${escapeHtml(config.title)}</h2>` : ''}
                ${config.subtitle ? `<p class="card-subtitle">${escapeHtml(config.subtitle)}</p>` : ''}
              </div>
              ${
                items.length > 0 && totalMatched > 0
                  ? `<span class="header-total-pill" title="${escapeAttr(localize('card.total_tooltip', lang, { count: totalMatched }))}">${escapeHtml(formattedTotal)}${displayUnit ? ` ${escapeHtml(displayUnit)}` : ''} ${escapeHtml(localize('card.total', lang))}</span>`
                  : ''
              }
            </header>
          `
              : ''
          }
          ${this._renderPeriodSwitcher(config, activePeriod, lang)}
          ${bodyHtml}
        </div>
      </ha-card>
    `;

    const container = this.shadowRoot.querySelector('.leaderboard-container');
    if (container) {
      container.addEventListener('click', this._boundClickHandler);
    }

    if (activeEntityId) {
      const target = this.shadowRoot.querySelector(
        `button[data-entity-id="${CSS.escape(activeEntityId)}"]`
      );
      if (target) target.focus({ preventScroll: true });
    } else if (activePeriodTab) {
      const tabTarget = this.shadowRoot.querySelector(
        `button.period-tab[data-period="${CSS.escape(activePeriodTab)}"]`
      );
      if (tabTarget) tabTarget.focus({ preventScroll: true });
    }
  }
}

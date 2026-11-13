import { normalizeConfig, resolveEntities } from './filter.js';
import { escapeAttr, escapeHtml, renderIcon } from './icons.js';
import { getLanguage, localize } from './localize.js';
import { EDITOR_STYLES } from './styles.js';

const BaseEditorElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export class HaLeaderboardCardEditor extends BaseEditorElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {
      type: 'custom:ha-leaderboard-card',
      layout: 'podium',
      podium_order: '2-1-3',
      limit: 3,
      sort_order: 'desc',
      show_percentage: true,
      hide_unit: false,
      hide_zero: false,
      hide_unavailable: true,
      entities: [],
    };
    this._hass = null;
    this._lang = getLanguage(null, this._config);
    this._rendered = false;
  }

  setConfig(config) {
    this._config = {
      type: 'custom:ha-leaderboard-card',
      ...config,
    };
    const nextLang = getLanguage(this._hass, this._config);
    const langChanged = nextLang !== this._lang;
    this._lang = nextLang;

    if (!this._rendered || langChanged) {
      this._render();
    } else {
      this._syncValues();
    }
  }

  set hass(hass) {
    this._hass = hass;
    const nextLang = getLanguage(this._hass, this._config);
    const langChanged = nextLang !== this._lang;
    this._lang = nextLang;

    if (!this._rendered || langChanged) {
      this._render();
    } else {
      this._updateDatalist();
      this._updateMatchBadge();
    }
  }

  _emitConfigChanged(nextConfig) {
    this._config = nextConfig;
    this._updateMatchBadge();
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: nextConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  _updateField(key, value) {
    const next = { ...this._config };
    if (value === '' || value === undefined || value === null) {
      delete next[key];
    } else {
      next[key] = value;
    }
    this._emitConfigChanged(next);
  }

  _getEntityEntries() {
    const raw = Array.isArray(this._config.entities) ? this._config.entities : [];
    return raw.map((item) =>
      typeof item === 'string'
        ? { entity: item, name: '', icon: '', color: '' }
        : {
            entity: item?.entity || '',
            name: item?.name || '',
            icon: item?.icon || '',
            color: item?.color || '',
          }
    );
  }

  _saveEntityEntries(entries) {
    const cleaned = entries
      .filter((e) => e.entity || e.name || e.icon || e.color)
      .map((e) => {
        const hasOverrides = Boolean(e.name || e.icon || e.color);
        if (!hasOverrides && e.entity) return e.entity;
        const obj = { entity: e.entity };
        if (e.name) obj.name = e.name;
        if (e.icon) obj.icon = e.icon;
        if (e.color) obj.color = e.color;
        return obj;
      });
    this._emitConfigChanged({ ...this._config, entities: cleaned });
  }

  _updateMatchBadge() {
    const badge = this.shadowRoot?.querySelector('#match-badge');
    if (!badge) return;
    const lang = this._lang;
    if (!this._hass?.states) {
      badge.textContent = localize('editor.waiting_hass', lang);
      return;
    }
    const { totalMatched } = resolveEntities(this._config, this._hass);
    badge.textContent =
      totalMatched === 1
        ? localize('editor.matched_one', lang)
        : localize('editor.matched_many', lang, { count: totalMatched });
  }

  _updateDatalist() {
    const datalist = this.shadowRoot?.querySelector('#ha-entity-list');
    if (!datalist || !this._hass?.states) return;
    const ids = Object.keys(this._hass.states).sort();
    datalist.innerHTML = ids
      .map((id) => {
        const name = this._hass.states[id]?.attributes?.friendly_name || '';
        return `<option value="${escapeAttr(id)}">${escapeHtml(name)}</option>`;
      })
      .join('');
  }

  _syncValues() {
    if (!this.shadowRoot) return;
    const norm = normalizeConfig(this._config);
    const setVal = (selector, val) => {
      const el = this.shadowRoot.querySelector(selector);
      if (el && document.activeElement !== el && this.shadowRoot.activeElement !== el) {
        el.value = val ?? '';
      }
    };
    const setChecked = (selector, val) => {
      const el = this.shadowRoot.querySelector(selector);
      if (el) el.checked = Boolean(val);
    };

    setVal('#ed-title', norm.title);
    setVal('#ed-subtitle', norm.subtitle);
    setVal('#ed-header-icon', norm.header_icon);
    setVal('#ed-layout', norm.layout);
    setVal('#ed-podium-order', norm.podium_order);
    setVal('#ed-limit', String(norm.limit));
    setVal('#ed-sort-order', norm.sort_order);
    setVal('#ed-period', norm.period);
    setVal('#ed-unit', norm.unit);
    setVal('#ed-decimals', norm.decimals === null ? '' : String(norm.decimals));
    setVal('#ed-include-pattern', norm.include_pattern);
    setVal('#ed-exclude-pattern', norm.exclude_pattern);
    setVal('#ed-strip-prefix', norm.name_strip_prefix);
    setVal('#ed-strip-suffix', norm.name_strip_suffix);
    setChecked('#ed-show-percentage', norm.show_percentage);
    setChecked('#ed-show-period-selector', norm.show_period_selector);
    setChecked('#ed-hide-unit', norm.hide_unit);
    setChecked('#ed-hide-zero', norm.hide_zero);
    setChecked('#ed-hide-unavailable', norm.hide_unavailable);

    const unitInput = this.shadowRoot.querySelector('#ed-unit');
    if (unitInput) unitInput.disabled = norm.hide_unit;

    this._renderEntityRows();
    this._updateMatchBadge();
  }

  _renderEntityRows() {
    const listEl = this.shadowRoot?.querySelector('#entities-list');
    if (!listEl) return;
    const lang = this._lang;

    const entries = this._getEntityEntries();
    listEl.innerHTML = entries
      .map(
        (entry, idx) => `
      <div class="entity-row" data-index="${idx}">
        <input
          type="text"
          list="ha-entity-list"
          data-field="entity"
          placeholder="${escapeAttr(localize('editor.entity_id_placeholder', lang))}"
          aria-label="Entity ID ${idx + 1}"
          value="${escapeAttr(entry.entity)}"
        />
        <input
          type="text"
          data-field="name"
          placeholder="${escapeAttr(localize('editor.custom_name_placeholder', lang))}"
          aria-label="Custom name ${idx + 1}"
          value="${escapeAttr(entry.name)}"
        />
        <input
          type="text"
          data-field="icon"
          placeholder="${escapeAttr(localize('editor.custom_icon_placeholder', lang))}"
          aria-label="Icon ${idx + 1}"
          value="${escapeAttr(entry.icon)}"
        />
        <div class="color-wrap">
          <input
            type="color"
            data-field="color"
            aria-label="Accent color ${idx + 1}"
            value="${escapeAttr(entry.color || '#f59e0b')}"
          />
        </div>
        <button
          type="button"
          class="btn btn-icon"
          data-remove-index="${idx}"
          aria-label="${escapeAttr(localize('editor.remove', lang))} ${idx + 1}"
          title="${escapeAttr(localize('editor.remove', lang))}"
        >
          ${renderIcon('mdi:delete-outline')}
        </button>
      </div>
    `
      )
      .join('');
  }

  _render() {
    if (!this.shadowRoot) return;
    this._rendered = true;
    const norm = normalizeConfig(this._config);
    const lang = this._lang;
    const t = (key, vars) => localize(key, lang, vars);

    this.shadowRoot.innerHTML = `
      <style>${EDITOR_STYLES}</style>
      <datalist id="ha-entity-list"></datalist>
      <div class="editor-root">
        <section class="editor-section">
          <div class="section-head">
            <h3 class="section-title">${escapeHtml(t('editor.section_header_layout'))}</h3>
          </div>
          <div class="field-grid">
            <div class="field">
              <label for="ed-title">${escapeHtml(t('editor.title'))}</label>
              <input id="ed-title" type="text" value="${escapeAttr(norm.title)}" placeholder="${escapeAttr(t('editor.title_placeholder'))}" />
            </div>
            <div class="field">
              <label for="ed-subtitle">${escapeHtml(t('editor.subtitle'))}</label>
              <input id="ed-subtitle" type="text" value="${escapeAttr(norm.subtitle)}" placeholder="${escapeAttr(t('editor.subtitle_placeholder'))}" />
            </div>
            <div class="field">
              <label for="ed-header-icon">${escapeHtml(t('editor.header_icon'))}</label>
              <input id="ed-header-icon" type="text" value="${escapeAttr(norm.header_icon)}" placeholder="${escapeAttr(t('editor.header_icon_placeholder'))}" />
            </div>
            <div class="field">
              <label for="ed-layout">${escapeHtml(t('editor.layout'))}</label>
              <select id="ed-layout">
                <option value="podium" ${norm.layout === 'podium' ? 'selected' : ''}>${escapeHtml(t('editor.layout_podium'))}</option>
                <option value="list" ${norm.layout === 'list' ? 'selected' : ''}>${escapeHtml(t('editor.layout_list'))}</option>
                <option value="both" ${norm.layout === 'both' ? 'selected' : ''}>${escapeHtml(t('editor.layout_both'))}</option>
              </select>
            </div>
            <div class="field">
              <label for="ed-podium-order">${escapeHtml(t('editor.podium_order'))}</label>
              <select id="ed-podium-order">
                <option value="2-1-3" ${norm.podium_order === '2-1-3' ? 'selected' : ''}>${escapeHtml(t('editor.podium_order_213'))}</option>
                <option value="1-2-3" ${norm.podium_order === '1-2-3' ? 'selected' : ''}>${escapeHtml(t('editor.podium_order_123'))}</option>
              </select>
            </div>
            <div class="field">
              <label for="ed-limit">${escapeHtml(t('editor.limit'))}</label>
              <input id="ed-limit" type="number" min="1" max="50" value="${norm.limit}" />
            </div>
            <div class="field">
              <label for="ed-sort-order">${escapeHtml(t('editor.sort_order'))}</label>
              <select id="ed-sort-order">
                <option value="desc" ${norm.sort_order === 'desc' ? 'selected' : ''}>${escapeHtml(t('editor.sort_desc'))}</option>
                <option value="asc" ${norm.sort_order === 'asc' ? 'selected' : ''}>${escapeHtml(t('editor.sort_asc'))}</option>
              </select>
            </div>
            <div class="field">
              <label for="ed-period">${escapeHtml(t('editor.period'))}</label>
              <select id="ed-period">
                <option value="all" ${norm.period === 'all' ? 'selected' : ''}>${escapeHtml(t('editor.period_all'))}</option>
                <option value="today" ${norm.period === 'today' ? 'selected' : ''}>${escapeHtml(t('editor.period_today'))}</option>
                <option value="week" ${norm.period === 'week' ? 'selected' : ''}>${escapeHtml(t('editor.period_week'))}</option>
                <option value="month" ${norm.period === 'month' ? 'selected' : ''}>${escapeHtml(t('editor.period_month'))}</option>
                <option value="year" ${norm.period === 'year' ? 'selected' : ''}>${escapeHtml(t('editor.period_year'))}</option>
                <option value="this_week" ${norm.period === 'this_week' ? 'selected' : ''}>${escapeHtml(t('editor.period_this_week'))}</option>
                <option value="this_month" ${norm.period === 'this_month' ? 'selected' : ''}>${escapeHtml(t('editor.period_this_month'))}</option>
                <option value="this_year" ${norm.period === 'this_year' ? 'selected' : ''}>${escapeHtml(t('editor.period_this_year'))}</option>
              </select>
            </div>
            <div class="field">
              <label for="ed-unit">${escapeHtml(t('editor.unit'))}</label>
              <input id="ed-unit" type="text" value="${escapeAttr(norm.unit)}" placeholder="${escapeAttr(t('editor.unit_placeholder'))}" ${norm.hide_unit ? 'disabled' : ''} />
            </div>
            <div class="field">
              <label for="ed-decimals">${escapeHtml(t('editor.decimals'))}</label>
              <input id="ed-decimals" type="number" min="0" max="6" value="${norm.decimals === null ? '' : norm.decimals}" placeholder="${escapeAttr(t('editor.decimals_placeholder'))}" />
            </div>
          </div>
          <div class="toggle-row">
            <label class="toggle-label">
              <input id="ed-show-percentage" type="checkbox" ${norm.show_percentage ? 'checked' : ''} />
              ${escapeHtml(t('editor.show_percentage'))}
            </label>
            <label class="toggle-label">
              <input id="ed-show-period-selector" type="checkbox" ${norm.show_period_selector ? 'checked' : ''} />
              ${escapeHtml(t('editor.show_period_selector'))}
            </label>
            <label class="toggle-label">
              <input id="ed-hide-unit" type="checkbox" ${norm.hide_unit ? 'checked' : ''} />
              ${escapeHtml(t('editor.hide_unit'))}
            </label>
            <label class="toggle-label">
              <input id="ed-hide-zero" type="checkbox" ${norm.hide_zero ? 'checked' : ''} />
              ${escapeHtml(t('editor.hide_zero'))}
            </label>
            <label class="toggle-label">
              <input id="ed-hide-unavailable" type="checkbox" ${norm.hide_unavailable ? 'checked' : ''} />
              ${escapeHtml(t('editor.hide_unavailable'))}
            </label>
          </div>
        </section>

        <section class="editor-section">
          <div class="section-head">
            <h3 class="section-title">${escapeHtml(t('editor.section_filter'))}</h3>
            <span id="match-badge" class="match-badge"></span>
          </div>
          <div class="field-grid">
            <div class="field">
              <label for="ed-include-pattern">${escapeHtml(t('editor.include_pattern'))}</label>
              <input id="ed-include-pattern" type="text" value="${escapeAttr(norm.include_pattern)}" placeholder="${escapeAttr(t('editor.include_placeholder'))}" />
              <span class="hint">${escapeHtml(t('editor.include_hint'))}</span>
            </div>
            <div class="field">
              <label for="ed-exclude-pattern">${escapeHtml(t('editor.exclude_pattern'))}</label>
              <input id="ed-exclude-pattern" type="text" value="${escapeAttr(norm.exclude_pattern)}" placeholder="${escapeAttr(t('editor.exclude_placeholder'))}" />
              <span class="hint">${escapeHtml(t('editor.exclude_hint'))}</span>
            </div>
            <div class="field">
              <label for="ed-strip-prefix">${escapeHtml(t('editor.strip_prefix'))}</label>
              <input id="ed-strip-prefix" type="text" value="${escapeAttr(norm.name_strip_prefix)}" placeholder="${escapeAttr(t('editor.strip_prefix_placeholder'))}" />
            </div>
            <div class="field">
              <label for="ed-strip-suffix">${escapeHtml(t('editor.strip_suffix'))}</label>
              <input id="ed-strip-suffix" type="text" value="${escapeAttr(norm.name_strip_suffix)}" placeholder="${escapeAttr(t('editor.strip_suffix_placeholder'))}" />
            </div>
          </div>
        </section>

        <section class="editor-section">
          <div class="section-head">
            <h3 class="section-title">${escapeHtml(t('editor.section_entities'))}</h3>
            <button type="button" class="btn" id="add-entity-btn">
              ${renderIcon('mdi:plus')}
              ${escapeHtml(t('editor.add_entity'))}
            </button>
          </div>
          <span class="hint">${escapeHtml(t('editor.entities_hint'))}</span>
          <div id="entities-list" class="entities-list"></div>
        </section>
      </div>
    `;

    this._renderEntityRows();
    this._updateDatalist();
    this._updateMatchBadge();
    this._bindEvents();
  }

  _bindEvents() {
    const root = this.shadowRoot;
    if (!root) return;

    const bindInput = (selector, key, transform = (v) => v) => {
      const el = root.querySelector(selector);
      if (!el) return;
      el.addEventListener('input', (e) => {
        this._updateField(key, transform(e.target.value));
      });
    };

    const bindSelect = (selector, key, transform = (v) => v) => {
      const el = root.querySelector(selector);
      if (!el) return;
      el.addEventListener('change', (e) => {
        this._updateField(key, transform(e.target.value));
      });
    };

    const bindCheck = (selector, key, onToggle) => {
      const el = root.querySelector(selector);
      if (!el) return;
      el.addEventListener('change', (e) => {
        if (onToggle) onToggle(e.target.checked);
        this._updateField(key, e.target.checked);
      });
    };

    bindInput('#ed-title', 'title');
    bindInput('#ed-subtitle', 'subtitle');
    bindInput('#ed-header-icon', 'header_icon');
    bindSelect('#ed-layout', 'layout');
    bindSelect('#ed-podium-order', 'podium_order');
    bindInput('#ed-limit', 'limit', (v) => (v === '' ? undefined : Number(v)));
    bindSelect('#ed-sort-order', 'sort_order');
    bindSelect('#ed-period', 'period');
    bindInput('#ed-unit', 'unit');
    bindInput('#ed-decimals', 'decimals', (v) => (v === '' ? undefined : Number(v)));
    bindInput('#ed-include-pattern', 'include_pattern');
    bindInput('#ed-exclude-pattern', 'exclude_pattern');
    bindInput('#ed-strip-prefix', 'name_strip_prefix');
    bindInput('#ed-strip-suffix', 'name_strip_suffix');

    bindCheck('#ed-show-percentage', 'show_percentage');
    bindCheck('#ed-show-period-selector', 'show_period_selector');
    bindCheck('#ed-hide-unit', 'hide_unit', (checked) => {
      const unitInput = root.querySelector('#ed-unit');
      if (unitInput) unitInput.disabled = checked;
    });
    bindCheck('#ed-hide-zero', 'hide_zero');
    bindCheck('#ed-hide-unavailable', 'hide_unavailable');

    root.querySelector('#add-entity-btn')?.addEventListener('click', () => {
      const entries = this._getEntityEntries();
      entries.push({ entity: '', name: '', icon: '', color: '' });
      const nextRaw = entries.map((e) =>
        e.name || e.icon || e.color ? e : e.entity
      );
      this._config = { ...this._config, entities: nextRaw };
      this._renderEntityRows();
    });

    const listEl = root.querySelector('#entities-list');
    listEl?.addEventListener('input', (e) => {
      const row = e.target.closest('.entity-row');
      if (!row) return;
      const idx = Number(row.dataset.index);
      const field = e.target.dataset.field;
      if (!Number.isInteger(idx) || !field) return;

      const entries = this._getEntityEntries();
      if (!entries[idx]) return;
      entries[idx] = { ...entries[idx], [field]: e.target.value };
      this._saveEntityEntries(entries);
    });

    listEl?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-remove-index]');
      if (!btn) return;
      const idx = Number(btn.dataset.removeIndex);
      if (!Number.isInteger(idx)) return;
      const entries = this._getEntityEntries();
      entries.splice(idx, 1);
      this._saveEntityEntries(entries);
      this._renderEntityRows();
    });
  }
}

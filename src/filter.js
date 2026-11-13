/**
 * Entity resolution, wildcard filtering, and ranking engine for Leaderboard Card.
 */

import { normalizePeriod } from './period.js';

const VALID_LAYOUTS = new Set(['podium', 'list', 'both']);
const VALID_PODIUM_ORDERS = new Set(['2-1-3', '1-2-3']);
const VALID_SORT_ORDERS = new Set(['desc', 'asc']);

/**
 * Convert a glob wildcard pattern (supporting `*`, `?`, and comma-separated patterns)
 * into a case-insensitive RegExp.
 *
 * @param {string} pattern
 * @returns {RegExp|null}
 */
export function globToRegExp(pattern) {
  if (typeof pattern !== 'string') return null;
  const parts = pattern
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const regexParts = parts.map((part) => {
    // Support /regex/flags syntax if explicitly provided
    if (part.length > 2 && part.startsWith('/') && part.lastIndexOf('/') > 0) {
      const lastSlash = part.lastIndexOf('/');
      const body = part.slice(1, lastSlash);
      return `(?:${body})`;
    }
    const escaped = part.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const converted = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
    return `(?:${converted})`;
  });

  return new RegExp(`^(?:${regexParts.join('|')})$`, 'i');
}

function hasWildcard(pattern) {
  if (typeof pattern !== 'string') return false;
  return pattern.includes('*') || pattern.includes('?') || pattern.includes(',');
}

/**
 * Normalize and apply defaults to raw card configuration.
 *
 * @param {object} rawConfig
 * @returns {object}
 */
export function normalizeConfig(rawConfig = {}) {
  const layout = VALID_LAYOUTS.has(rawConfig.layout) ? rawConfig.layout : 'podium';
  const podiumOrder = VALID_PODIUM_ORDERS.has(rawConfig.podium_order)
    ? rawConfig.podium_order
    : '2-1-3';
  const sortOrder = VALID_SORT_ORDERS.has(rawConfig.sort_order)
    ? rawConfig.sort_order
    : 'desc';

  const rawLimit = Number(rawConfig.limit);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(50, Math.max(1, Math.round(rawLimit)))
    : 3;

  let decimals = null;
  if (rawConfig.decimals !== undefined && rawConfig.decimals !== null && rawConfig.decimals !== '') {
    const parsedDecimals = Number(rawConfig.decimals);
    if (Number.isFinite(parsedDecimals)) {
      decimals = Math.min(6, Math.max(0, Math.round(parsedDecimals)));
    }
  }

  return {
    ...rawConfig,
    title: rawConfig.title !== undefined ? String(rawConfig.title) : '',
    subtitle: rawConfig.subtitle !== undefined ? String(rawConfig.subtitle) : '',
    header_icon: rawConfig.header_icon !== undefined ? String(rawConfig.header_icon) : '',
    layout,
    podium_order: podiumOrder,
    limit,
    sort_order: sortOrder,
    unit: rawConfig.unit !== undefined && rawConfig.unit !== null ? String(rawConfig.unit) : '',
    decimals,
    show_percentage: rawConfig.show_percentage !== false,
    show_period_selector: Boolean(rawConfig.show_period_selector),
    period: normalizePeriod(rawConfig.period),
    hide_unit: rawConfig.hide_unit === true || rawConfig.show_unit === false,
    hide_zero: Boolean(rawConfig.hide_zero),
    hide_unavailable: rawConfig.hide_unavailable !== false,
    name_strip_prefix: rawConfig.name_strip_prefix ? String(rawConfig.name_strip_prefix) : '',
    name_strip_suffix: rawConfig.name_strip_suffix ? String(rawConfig.name_strip_suffix) : '',
    include_pattern: rawConfig.include_pattern ? String(rawConfig.include_pattern).trim() : '',
    exclude_pattern: rawConfig.exclude_pattern ? String(rawConfig.exclude_pattern).trim() : '',
    entities: Array.isArray(rawConfig.entities) ? rawConfig.entities : [],
    filter: rawConfig.filter && typeof rawConfig.filter === 'object' ? rawConfig.filter : null,
  };
}

/**
 * Strip configured prefix/suffix from display names (case-insensitive).
 *
 * @param {string} name
 * @param {string} prefix
 * @param {string} suffix
 * @returns {string}
 */
export function cleanEntityName(name, prefix = '', suffix = '') {
  let result = String(name || '').trim();
  if (prefix) {
    const lower = result.toLowerCase();
    const lowerPrefix = prefix.toLowerCase();
    if (lower.startsWith(lowerPrefix)) {
      result = result.slice(prefix.length).trim();
    }
  }
  if (suffix) {
    const lower = result.toLowerCase();
    const lowerSuffix = suffix.toLowerCase();
    if (lower.endsWith(lowerSuffix)) {
      result = result.slice(0, result.length - suffix.length).trim();
    }
  }
  return result || String(name || '').trim();
}

/**
 * Select a sensible fallback mdi icon based on entity metadata or name keywords.
 *
 * @param {object} stateObj
 * @param {string} displayName
 * @returns {string}
 */
export function inferIcon(stateObj, displayName = '') {
  const explicitIcon = stateObj?.attributes?.icon;
  if (typeof explicitIcon === 'string' && explicitIcon.trim()) {
    return explicitIcon.trim();
  }

  const deviceClass = String(stateObj?.attributes?.device_class || '').toLowerCase();
  if (deviceClass === 'energy' || deviceClass === 'power') return 'mdi:flash';
  if (deviceClass === 'temperature') return 'mdi:thermometer';
  if (deviceClass === 'humidity' || deviceClass === 'water') return 'mdi:water';
  if (deviceClass === 'monetary') return 'mdi:currency-usd';
  if (deviceClass === 'duration') return 'mdi:timer-outline';

  const text = `${displayName} ${stateObj?.entity_id || ''}`.toLowerCase();
  if (/(espresso|ristretto|macchiato|coffee.?maker|kaffeemaschine|kaffeevollautomat)/.test(text)) {
    return 'mdi:coffee-maker';
  }
  if (/(cappuccino|latte|coffee|americano|mocha|flat.?white|lungo|brew|kaffee|milchkaffee|cafe)/.test(text)) {
    return 'mdi:coffee';
  }
  if (/(tea|matcha|chai|infusion|tee)/.test(text)) return 'mdi:tea';
  if (/(water|milk|hot.?water|aqua|hydration|liter|litre|wasser|heißwasser|heisswasser|milch|milchschaum)/.test(text)) {
    return 'mdi:water';
  }
  if (/(juice|drink|beverage|soda|cup|getränk|getraenk|becher|tasse)/.test(text)) return 'mdi:cup';
  if (/(watt|kwh|energy|power|solar|battery|consumption|strom|energie|leistung|verbrauch)/.test(text)) {
    return 'mdi:flash';
  }
  if (/(temp|celsius|fahrenheit|thermostat|heat|temperatur|heizung|klima)/.test(text)) {
    return 'mdi:thermometer';
  }

  return 'mdi:trophy-outline';
}

function getEntityRegistryMeta(entityId, hass) {
  const entityReg = hass?.entities?.[entityId];
  const deviceId = entityReg?.device_id;
  const deviceReg = deviceId ? hass?.devices?.[deviceId] : null;
  const areaId = entityReg?.area_id || deviceReg?.area_id;
  const areaReg = areaId ? hass?.areas?.[areaId] : null;

  return {
    areaName: areaReg?.name || areaId || '',
    deviceName: deviceReg?.name_by_user || deviceReg?.name || deviceId || '',
  };
}

function matchesAttributeFilter(stateObj, attrFilter) {
  if (!attrFilter || typeof attrFilter !== 'object') return true;
  const attrs = stateObj?.attributes || {};
  for (const [key, expected] of Object.entries(attrFilter)) {
    const actual = attrs[key];
    if (actual === undefined || actual === null) return false;
    if (typeof expected === 'string') {
      const rx = globToRegExp(expected);
      if (rx && !rx.test(String(actual))) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

function matchesFilterRule(entityId, stateObj, rule, hass) {
  if (!rule) return false;
  if (typeof rule === 'string') {
    const rx = globToRegExp(rule);
    return rx ? rx.test(entityId) : false;
  }
  if (typeof rule !== 'object') return false;

  if (rule.entity_id) {
    const rx = globToRegExp(String(rule.entity_id));
    if (!rx || !rx.test(entityId)) return false;
  }

  if (rule.domain) {
    const domain = entityId.split('.')[0] || '';
    const allowed = Array.isArray(rule.domain) ? rule.domain : [rule.domain];
    const matchesDomain = allowed.some((d) => {
      const rx = globToRegExp(String(d));
      return rx ? rx.test(domain) : String(d).toLowerCase() === domain.toLowerCase();
    });
    if (!matchesDomain) return false;
  }

  if (rule.name) {
    const friendly = String(stateObj?.attributes?.friendly_name || entityId);
    const rx = globToRegExp(String(rule.name));
    if (!rx || !rx.test(friendly)) return false;
  }

  if (rule.area || rule.device) {
    const meta = getEntityRegistryMeta(entityId, hass);
    if (rule.area) {
      const rx = globToRegExp(String(rule.area));
      if (!rx || !rx.test(meta.areaName)) return false;
    }
    if (rule.device) {
      const rx = globToRegExp(String(rule.device));
      if (!rx || !rx.test(meta.deviceName)) return false;
    }
  }

  if (rule.attributes && !matchesAttributeFilter(stateObj, rule.attributes)) {
    return false;
  }

  if (rule.state_min !== undefined || rule.state_max !== undefined) {
    const numeric = Number(
      rule.attribute ? stateObj?.attributes?.[rule.attribute] : stateObj?.state
    );
    if (!Number.isFinite(numeric)) return false;
    if (rule.state_min !== undefined && numeric < Number(rule.state_min)) return false;
    if (rule.state_max !== undefined && numeric > Number(rule.state_max)) return false;
  }

  return true;
}

function formatNumericValue(value, decimals) {
  if (!Number.isFinite(value)) return '—';
  if (decimals !== null && decimals !== undefined) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function collectCandidates(config, hass) {
  const states = hass?.states || {};
  const allEntityIds = Object.keys(states);
  const candidates = new Map();

  const registerCandidate = (entityId, overrides = {}) => {
    if (!entityId || !states[entityId]) return;
    const existing = candidates.get(entityId) || {};
    candidates.set(entityId, {
      ...existing,
      ...Object.fromEntries(
        Object.entries(overrides).filter(([, v]) => v !== undefined && v !== null && v !== '')
      ),
      entity: entityId,
    });
  };

  // 1. Collect explicit entries & wildcards from config.entities
  for (const rawEntry of config.entities) {
    if (typeof rawEntry === 'string') {
      const pattern = rawEntry.trim();
      if (!pattern) continue;
      if (hasWildcard(pattern)) {
        const rx = globToRegExp(pattern);
        if (rx) {
          for (const id of allEntityIds) {
            if (rx.test(id)) registerCandidate(id);
          }
        }
      } else {
        registerCandidate(pattern);
      }
    } else if (rawEntry && typeof rawEntry === 'object' && rawEntry.entity) {
      const pattern = String(rawEntry.entity).trim();
      if (!pattern) continue;
      if (hasWildcard(pattern)) {
        const rx = globToRegExp(pattern);
        if (rx) {
          for (const id of allEntityIds) {
            if (rx.test(id)) {
              registerCandidate(id, {
                icon: rawEntry.icon,
                color: rawEntry.color,
                unit: rawEntry.unit,
                attribute: rawEntry.attribute,
              });
            }
          }
        }
      } else {
        registerCandidate(pattern, {
          name: rawEntry.name,
          icon: rawEntry.icon,
          color: rawEntry.color,
          unit: rawEntry.unit,
          attribute: rawEntry.attribute,
        });
      }
    }
  }

  // 2. Collect matches from shorthand include_pattern
  if (config.include_pattern) {
    const includeRx = globToRegExp(config.include_pattern);
    if (includeRx) {
      for (const id of allEntityIds) {
        if (includeRx.test(id)) registerCandidate(id);
      }
    }
  }

  // 3. Collect matches from filter.include
  if (Array.isArray(config.filter?.include)) {
    for (const rule of config.filter.include) {
      for (const id of allEntityIds) {
        if (matchesFilterRule(id, states[id], rule, hass)) {
          const overrides =
            rule && typeof rule === 'object'
              ? {
                  icon: rule.icon,
                  color: rule.color,
                  unit: rule.unit,
                  attribute: rule.attribute,
                }
              : {};
          registerCandidate(id, overrides);
        }
      }
    }
  }

  // 4. Apply exclusions (exclude_pattern and filter.exclude)
  const excludeRx = config.exclude_pattern ? globToRegExp(config.exclude_pattern) : null;
  const excludeRules = Array.isArray(config.filter?.exclude) ? config.filter.exclude : [];

  for (const entityId of [...candidates.keys()]) {
    const stateObj = states[entityId];
    if (!stateObj) {
      candidates.delete(entityId);
      continue;
    }
    if (excludeRx && excludeRx.test(entityId)) {
      candidates.delete(entityId);
      continue;
    }
    if (excludeRules.some((rule) => matchesFilterRule(entityId, stateObj, rule, hass))) {
      candidates.delete(entityId);
    }
  }

  return candidates;
}

/**
 * Collect candidate entity IDs matching include/exclude configuration before ranking.
 *
 * @param {object} rawConfig
 * @param {object} hass
 * @returns {string[]}
 */
export function collectCandidateEntityIds(rawConfig, hass) {
  const config = normalizeConfig(rawConfig);
  const candidates = collectCandidates(config, hass);
  const states = hass?.states || {};
  const ids = [];
  for (const [entityId, entry] of candidates.entries()) {
    const stateObj = states[entityId];
    if (!stateObj) continue;
    const rawVal = entry.attribute ? stateObj.attributes?.[entry.attribute] : stateObj.state;
    const rawStr = rawVal === undefined || rawVal === null ? '' : String(rawVal).trim().toLowerCase();
    const isUnavailable =
      rawStr === '' || rawStr === 'unavailable' || rawStr === 'unknown' || rawStr === 'none';
    if (!isUnavailable && !Number.isFinite(Number(rawVal))) continue;
    ids.push(entityId);
  }
  return ids;
}

/**
 * Resolve, filter, sort, and rank entities from Home Assistant state.
 *
 * @param {object} rawConfig
 * @param {object} hass
 * @param {Record<string, number>|null} [periodValues]
 * @returns {{ items: Array<object>, totalMatched: number, totalValue: number, maxValue: number }}
 */
export function resolveEntities(rawConfig, hass, periodValues = null) {
  const config = normalizeConfig(rawConfig);
  const states = hass?.states || {};
  const candidates = collectCandidates(config, hass);
  const hasPeriodMap = Boolean(periodValues && typeof periodValues === 'object');

  const validItems = [];
  for (const [entityId, entry] of candidates.entries()) {
    const stateObj = states[entityId];
    if (!stateObj) continue;

    const rawVal = entry.attribute
      ? stateObj.attributes?.[entry.attribute]
      : stateObj.state;

    const rawStr = rawVal === undefined || rawVal === null ? '' : String(rawVal).trim();
    const isUnavailableState =
      rawStr === '' ||
      rawStr.toLowerCase() === 'unavailable' ||
      rawStr.toLowerCase() === 'unknown' ||
      rawStr.toLowerCase() === 'none';

    let numericValue;
    let isUnavailable = false;
    if (hasPeriodMap) {
      if (!isUnavailableState && !Number.isFinite(Number(rawVal))) continue;
      if (entityId in periodValues) {
        numericValue = Number(periodValues[entityId]);
        if (!Number.isFinite(numericValue)) continue;
      } else {
        if (isUnavailableState && config.hide_unavailable) continue;
        numericValue = 0;
        isUnavailable = isUnavailableState;
      }
    } else if (isUnavailableState) {
      if (config.hide_unavailable) continue;
      numericValue = 0;
      isUnavailable = true;
    } else {
      numericValue = Number(rawVal);
      if (!Number.isFinite(numericValue)) continue;
    }

    if (config.hide_zero && numericValue <= 0) continue;

    const baseName = stateObj.attributes?.friendly_name || entityId;
    const displayName = entry.name
      ? String(entry.name)
      : cleanEntityName(baseName, config.name_strip_prefix, config.name_strip_suffix);

    const unit = config.hide_unit
      ? ''
      : entry.unit !== undefined && entry.unit !== ''
        ? String(entry.unit)
        : config.unit !== ''
          ? config.unit
          : String(stateObj.attributes?.unit_of_measurement || '');

    const icon = entry.icon ? String(entry.icon) : inferIcon(stateObj, displayName);

    validItems.push({
      entityId,
      name: displayName,
      icon,
      color: entry.color ? String(entry.color) : '',
      value: numericValue,
      formattedValue: isUnavailable ? '—' : formatNumericValue(numericValue, config.decimals),
      unit,
      unavailable: isUnavailable,
    });
  }

  // 5. Sort items according to sort_order
  validItems.sort((a, b) => {
    if (a.value !== b.value) {
      return config.sort_order === 'asc' ? a.value - b.value : b.value - a.value;
    }
    return a.name.localeCompare(b.name);
  });

  // 6. Compute totals across all matched valid entities
  const totalMatched = validItems.length;
  const totalValue = validItems.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  const maxValue = validItems.reduce((max, item) => Math.max(max, item.value), 0);

  // 7. Slice to limit and assign rank & percentages
  const sliced = validItems.slice(0, config.limit).map((item, idx) => {
    const percentageOfMax =
      maxValue > 0 ? Math.min(100, Math.max(0, Math.round((item.value / maxValue) * 1000) / 10)) : 0;
    const percentageOfTotal =
      totalValue > 0
        ? Math.min(100, Math.max(0, Math.round((Math.max(0, item.value) / totalValue) * 1000) / 10))
        : 0;

    return {
      ...item,
      rank: idx + 1,
      percentageOfMax,
      percentageOfTotal,
    };
  });

  return {
    items: sliced,
    totalMatched,
    totalValue,
    maxValue,
  };
}

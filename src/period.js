/**
 * Time-period computation and Home Assistant Recorder / History WebSocket queries.
 */

export const VALID_PERIODS = new Set([
  'all',
  'today',
  'week',
  'month',
  'year',
  '7d',
  '30d',
  '365d',
  'this_week',
  'this_month',
  'this_year',
]);

const PERIOD_ALIASES = {
  '7d': 'week',
  '30d': 'month',
  '365d': 'year',
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Normalize a configured time period string.
 *
 * @param {string} period
 * @returns {string}
 */
export function normalizePeriod(period) {
  if (typeof period !== 'string') return 'all';
  const cleaned = period.trim().toLowerCase();
  if (!VALID_PERIODS.has(cleaned)) return 'all';
  return PERIOD_ALIASES[cleaned] || cleaned;
}

/**
 * Compute start/end timestamps and statistic bucket granularity for a period.
 *
 * @param {string} period
 * @param {Date} [now]
 * @returns {{ startTime: Date, endTime: Date, bucketPeriod: 'hour' | 'day' }}
 */
export function computePeriodBounds(period, now = new Date()) {
  const norm = normalizePeriod(period);
  const endTime = new Date(now.getTime());

  if (norm === 'today') {
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { startTime, endTime, bucketPeriod: 'hour' };
  }

  if (norm === 'this_week') {
    const day = now.getDay(); // 0 = Sun, 1 = Mon, ...
    const diffToMonday = day === 0 ? 6 : day - 1;
    const startTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - diffToMonday,
      0,
      0,
      0,
      0
    );
    return { startTime, endTime, bucketPeriod: 'day' };
  }

  if (norm === 'this_month') {
    const startTime = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { startTime, endTime, bucketPeriod: 'day' };
  }

  if (norm === 'this_year') {
    const startTime = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    return { startTime, endTime, bucketPeriod: 'day' };
  }

  if (norm === 'week') {
    return {
      startTime: new Date(endTime.getTime() - 7 * DAY_MS),
      endTime,
      bucketPeriod: 'day',
    };
  }

  if (norm === 'month') {
    return {
      startTime: new Date(endTime.getTime() - 30 * DAY_MS),
      endTime,
      bucketPeriod: 'day',
    };
  }

  if (norm === 'year') {
    return {
      startTime: new Date(endTime.getTime() - 365 * DAY_MS),
      endTime,
      bucketPeriod: 'day',
    };
  }

  return {
    startTime: new Date(0),
    endTime,
    bucketPeriod: 'day',
  };
}

function roundFloat(num) {
  return Math.round(num * 1e6) / 1e6;
}

/**
 * Derive a period value from Home Assistant long-term statistics buckets.
 *
 * @param {Array<object>} buckets
 * @param {object} [stateObj]
 * @returns {number|null}
 */
export function calculateDeltaFromStatBuckets(buckets, stateObj) {
  if (!Array.isArray(buckets) || buckets.length === 0) return null;

  const changes = buckets
    .map((b) => b?.change)
    .filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (changes.length > 0) {
    const sum = changes.reduce((acc, v) => acc + v, 0);
    const stateClass = stateObj?.attributes?.state_class;
    return roundFloat(stateClass === 'total_increasing' ? Math.max(0, sum) : Math.max(0, sum));
  }

  const states = buckets
    .map((b) => b?.state)
    .filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (states.length >= 2) {
    return roundFloat(Math.max(0, states[states.length - 1] - states[0]));
  }
  if (states.length === 1) {
    return roundFloat(Math.max(0, states[0]));
  }

  const means = buckets
    .map((b) => b?.mean)
    .filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (means.length > 0) {
    const avg = means.reduce((acc, v) => acc + v, 0) / means.length;
    return roundFloat(avg);
  }

  return null;
}

/**
 * Derive a positive cumulative delta from raw Home Assistant history entries.
 *
 * @param {Array<object>} historyEntries
 * @returns {number}
 */
export function calculateDeltaFromHistory(historyEntries) {
  if (!Array.isArray(historyEntries) || historyEntries.length < 2) return 0;

  const nums = [];
  for (const entry of historyEntries) {
    const raw = entry?.s !== undefined ? entry.s : entry?.state;
    const val = Number(raw);
    if (Number.isFinite(val)) {
      nums.push(val);
    }
  }

  if (nums.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < nums.length; i++) {
    const diff = nums[i] - nums[i - 1];
    if (diff > 0) {
      total += diff;
    }
  }

  return roundFloat(total);
}

/**
 * Fetch period values for the given entity IDs from Home Assistant's
 * Long-Term Statistics API, falling back to state history when needed.
 *
 * @param {object} hass
 * @param {string[]} entityIds
 * @param {string} period
 * @param {Date} [now]
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchPeriodValues(hass, entityIds, period, now = new Date()) {
  const norm = normalizePeriod(period);
  if (norm === 'all' || !Array.isArray(entityIds) || entityIds.length === 0) {
    return {};
  }

  if (hass?.periodMockData?.[norm] && typeof hass.periodMockData[norm] === 'object') {
    const mockResult = {};
    for (const id of entityIds) {
      if (id in hass.periodMockData[norm]) {
        mockResult[id] = Number(hass.periodMockData[norm][id]) || 0;
      }
    }
    return mockResult;
  }

  if (typeof hass?.callWS !== 'function') {
    return {};
  }

  const { startTime, endTime, bucketPeriod } = computePeriodBounds(norm, now);
  const startIso = startTime.toISOString();
  const endIso = endTime.toISOString();

  const result = {};
  let missingIds = [...entityIds];

  try {
    const statsResp = await hass.callWS({
      type: 'recorder/statistics_during_period',
      start_time: startIso,
      end_time: endIso,
      statistic_ids: entityIds,
      period: bucketPeriod,
      types: ['change', 'state', 'mean'],
    });

    if (statsResp && typeof statsResp === 'object') {
      missingIds = [];
      for (const id of entityIds) {
        const delta = calculateDeltaFromStatBuckets(statsResp[id], hass.states?.[id]);
        if (delta !== null) {
          result[id] = delta;
        } else {
          missingIds.push(id);
        }
      }
    }
  } catch {
    // Fall back to raw history below for all entities
  }

  if (missingIds.length > 0) {
    try {
      const historyResp = await hass.callWS({
        type: 'history/history_during_period',
        start_time: startIso,
        end_time: endIso,
        entity_ids: missingIds,
        include_start_time_state: true,
        minimal_response: true,
        no_attributes: true,
        significant_changes_only: false,
      });

      if (historyResp && typeof historyResp === 'object') {
        for (const id of missingIds) {
          const entries = historyResp[id];
          result[id] = Array.isArray(entries) ? calculateDeltaFromHistory(entries) : 0;
        }
      }
    } catch {
      for (const id of missingIds) {
        if (!(id in result)) result[id] = 0;
      }
    }
  }

  return result;
}

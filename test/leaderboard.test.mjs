import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectCandidateEntityIds,
  globToRegExp,
  inferIcon,
  normalizeConfig,
  resolveEntities,
} from '../src/filter.js';
import {
  calculateDeltaFromHistory,
  calculateDeltaFromStatBuckets,
  computePeriodBounds,
  fetchPeriodValues,
  normalizePeriod,
} from '../src/period.js';
import { getLanguage, localize } from '../src/localize.js';
import { HaLeaderboardCard } from '../src/leaderboard-card.js';

function createCoffeeHass() {
  return {
    areas: {
      kitchen: { name: 'Kitchen' },
      living_room: { name: 'Living Room' },
    },
    devices: {
      dev_coffee: { name: 'Siemens EQ.9', area_id: 'kitchen' },
      dev_plug: { name: 'Desk Plug', area_id: 'living_room' },
    },
    entities: {
      'sensor.coffee_machine_cappuccino': { device_id: 'dev_coffee' },
      'sensor.coffee_machine_espresso': { device_id: 'dev_coffee' },
      'sensor.coffee_machine_latte': { device_id: 'dev_coffee' },
      'sensor.coffee_machine_americano': { device_id: 'dev_coffee' },
      'sensor.coffee_machine_hot_water': { device_id: 'dev_coffee' },
      'sensor.coffee_machine_flat_white': { device_id: 'dev_coffee' },
      'sensor.coffee_machine_total_drinks': { device_id: 'dev_coffee' },
      'sensor.coffee_machine_cleaning_cycles': { device_id: 'dev_coffee' },
      'sensor.coffee_machine_state': { device_id: 'dev_coffee' },
      'sensor.coffee_machine_decaf': { device_id: 'dev_coffee' },
      'sensor.coffee_machine_ristretto': { device_id: 'dev_coffee' },
      'sensor.desk_power': { device_id: 'dev_plug' },
    },
    states: {
      'sensor.coffee_machine_cappuccino': {
        entity_id: 'sensor.coffee_machine_cappuccino',
        state: '48',
        attributes: { friendly_name: 'Coffee Machine Cappuccino', unit_of_measurement: 'cups' },
      },
      'sensor.coffee_machine_espresso': {
        entity_id: 'sensor.coffee_machine_espresso',
        state: '34',
        attributes: { friendly_name: 'Coffee Machine Espresso', unit_of_measurement: 'cups' },
      },
      'sensor.coffee_machine_latte': {
        entity_id: 'sensor.coffee_machine_latte',
        state: '29',
        attributes: { friendly_name: 'Coffee Machine Caffè Latte', unit_of_measurement: 'cups' },
      },
      'sensor.coffee_machine_americano': {
        entity_id: 'sensor.coffee_machine_americano',
        state: '19',
        attributes: { friendly_name: 'Coffee Machine Americano', unit_of_measurement: 'cups' },
      },
      'sensor.coffee_machine_hot_water': {
        entity_id: 'sensor.coffee_machine_hot_water',
        state: '15',
        attributes: { friendly_name: 'Coffee Machine Hot Water', unit_of_measurement: 'cups' },
      },
      'sensor.coffee_machine_flat_white': {
        entity_id: 'sensor.coffee_machine_flat_white',
        state: '11',
        attributes: { friendly_name: 'Coffee Machine Flat White', unit_of_measurement: 'cups' },
      },
      'sensor.coffee_machine_total_drinks': {
        entity_id: 'sensor.coffee_machine_total_drinks',
        state: '156',
        attributes: { friendly_name: 'Coffee Machine Total Drinks', unit_of_measurement: 'cups' },
      },
      'sensor.coffee_machine_cleaning_cycles': {
        entity_id: 'sensor.coffee_machine_cleaning_cycles',
        state: '6',
        attributes: { friendly_name: 'Coffee Machine Cleaning Cycles', unit_of_measurement: 'cycles' },
      },
      'sensor.coffee_machine_state': {
        entity_id: 'sensor.coffee_machine_state',
        state: 'ready',
        attributes: { friendly_name: 'Coffee Machine State' },
      },
      'sensor.coffee_machine_decaf': {
        entity_id: 'sensor.coffee_machine_decaf',
        state: '0',
        attributes: { friendly_name: 'Coffee Machine Decaf', unit_of_measurement: 'cups' },
      },
      'sensor.coffee_machine_ristretto': {
        entity_id: 'sensor.coffee_machine_ristretto',
        state: 'unavailable',
        attributes: { friendly_name: 'Coffee Machine Ristretto', unit_of_measurement: 'cups' },
      },
      'sensor.desk_power': {
        entity_id: 'sensor.desk_power',
        state: '142.5',
        attributes: { friendly_name: 'Desk Power', unit_of_measurement: 'W', device_class: 'power' },
      },
    },
  };
}

describe('globToRegExp', () => {
  it('matches single wildcard and comma-separated patterns case-insensitively', () => {
    const rx = globToRegExp('sensor.coffee_machine_*, sensor.desk_*');
    assert.ok(rx);
    assert.equal(rx.test('sensor.coffee_machine_cappuccino'), true);
    assert.equal(rx.test('SENSOR.DESK_POWER'), true);
    assert.equal(rx.test('sensor.kitchen_temp'), false);
  });

  it('supports single-character ? wildcards', () => {
    const rx = globToRegExp('sensor.room_?_temp');
    assert.ok(rx);
    assert.equal(rx.test('sensor.room_1_temp'), true);
    assert.equal(rx.test('sensor.room_12_temp'), false);
  });
});

describe('normalizeConfig', () => {
  it('applies sensible defaults without autofilling title and clamps limit', () => {
    const norm = normalizeConfig({ limit: 120, layout: 'invalid' });
    assert.equal(norm.title, '');
    assert.equal(norm.layout, 'podium');
    assert.equal(norm.podium_order, '2-1-3');
    assert.equal(norm.limit, 50);
    assert.equal(norm.sort_order, 'desc');
    assert.equal(norm.show_percentage, true);
    assert.equal(norm.hide_unit, false);
    assert.equal(norm.hide_unavailable, true);
  });
});

describe('resolveEntities', () => {
  it('ranks top 3 coffee machine drinks with wildcard auto-filter and prefix stripping', () => {
    const hass = createCoffeeHass();
    const res = resolveEntities(
      {
        include_pattern: 'sensor.coffee_machine_*',
        exclude_pattern: '*_total*, *_cleaning*',
        name_strip_prefix: 'Coffee Machine ',
        limit: 3,
      },
      hass
    );

    // 6 positive drinks + 1 zero (decaf); total/cleaning excluded, state/ristretto filtered
    assert.equal(res.totalMatched, 7);
    assert.equal(res.totalValue, 156);
    assert.equal(res.maxValue, 48);
    assert.equal(res.items.length, 3);

    assert.deepEqual(
      res.items.map((i) => ({ rank: i.rank, name: i.name, value: i.value })),
      [
        { rank: 1, name: 'Cappuccino', value: 48 },
        { rank: 2, name: 'Espresso', value: 34 },
        { rank: 3, name: 'Caffè Latte', value: 29 },
      ]
    );

    assert.equal(res.items[0].percentageOfMax, 100);
    assert.equal(res.items[0].percentageOfTotal, 30.8);
    assert.equal(res.items[0].icon, 'mdi:coffee');
    assert.equal(res.items[1].icon, 'mdi:coffee-maker');
  });

  it('merges manual entity overrides with wildcard-matched entities without duplicating', () => {
    const hass = createCoffeeHass();
    const res = resolveEntities(
      {
        include_pattern: 'sensor.coffee_machine_*',
        exclude_pattern: '*_total*, *_cleaning*',
        name_strip_prefix: 'Coffee Machine ',
        limit: 3,
        entities: [
          {
            entity: 'sensor.coffee_machine_cappuccino',
            name: 'Morning Cappuccino',
            icon: 'mdi:cup',
            color: '#c084fc',
          },
        ],
      },
      hass
    );

    assert.equal(res.totalMatched, 7);
    assert.equal(res.items[0].entityId, 'sensor.coffee_machine_cappuccino');
    assert.equal(res.items[0].name, 'Morning Cappuccino');
    assert.equal(res.items[0].icon, 'mdi:cup');
    assert.equal(res.items[0].color, '#c084fc');
  });

  it('supports ascending sort order and tie-breaking by name', () => {
    const hass = createCoffeeHass();
    hass.states['sensor.coffee_machine_americano'].state = '15';
    const res = resolveEntities(
      {
        entities: [
          'sensor.coffee_machine_americano',
          'sensor.coffee_machine_hot_water',
          'sensor.coffee_machine_flat_white',
        ],
        name_strip_prefix: 'Coffee Machine ',
        sort_order: 'asc',
        limit: 3,
      },
      hass
    );

    assert.deepEqual(
      res.items.map((i) => ({ rank: i.rank, name: i.name, value: i.value })),
      [
        { rank: 1, name: 'Flat White', value: 11 },
        { rank: 2, name: 'Americano', value: 15 },
        { rank: 3, name: 'Hot Water', value: 15 },
      ]
    );
  });

  it('handles hide_zero and hide_unavailable options', () => {
    const hass = createCoffeeHass();

    const hideZeroRes = resolveEntities(
      {
        include_pattern: 'sensor.coffee_machine_*',
        exclude_pattern: '*_total*, *_cleaning*',
        hide_zero: true,
        limit: 10,
      },
      hass
    );
    assert.equal(
      hideZeroRes.items.some((i) => i.entityId === 'sensor.coffee_machine_decaf'),
      false
    );
    assert.equal(hideZeroRes.totalMatched, 6);

    const showUnavailableRes = resolveEntities(
      {
        entities: ['sensor.coffee_machine_ristretto', 'sensor.coffee_machine_cappuccino'],
        hide_unavailable: false,
        limit: 5,
      },
      hass
    );
    assert.equal(showUnavailableRes.items.length, 2);
    assert.equal(showUnavailableRes.items[1].entityId, 'sensor.coffee_machine_ristretto');
    assert.equal(showUnavailableRes.items[1].formattedValue, '—');
  });

  it('supports advanced filter.include and filter.exclude rules (area, domain, state_min)', () => {
    const hass = createCoffeeHass();
    const res = resolveEntities(
      {
        filter: {
          include: [{ domain: 'sensor', area: 'Kitchen', state_min: 12 }],
          exclude: [{ entity_id: '*_total*' }],
        },
        name_strip_prefix: 'Coffee Machine ',
        limit: 5,
      },
      hass
    );

    assert.deepEqual(
      res.items.map((i) => i.name),
      ['Cappuccino', 'Espresso', 'Caffè Latte', 'Americano', 'Hot Water']
    );
  });

  it('hides units when hide_unit is true or show_unit is false', () => {
    const hass = createCoffeeHass();
    const resHide = resolveEntities(
      {
        entities: ['sensor.coffee_machine_cappuccino', 'sensor.coffee_machine_espresso'],
        hide_unit: true,
        unit: 'ignored',
      },
      hass
    );
    assert.equal(resHide.items[0].unit, '');
    assert.equal(resHide.items[1].unit, '');

    const resShowFalse = resolveEntities(
      {
        entities: ['sensor.coffee_machine_cappuccino'],
        show_unit: false,
      },
      hass
    );
    assert.equal(resShowFalse.items[0].unit, '');
  });
});

describe('localization and general defaults', () => {
  it('detects German and English from hass locale and config', () => {
    assert.equal(getLanguage({ locale: { language: 'de-DE' } }), 'de');
    assert.equal(getLanguage({ language: 'de' }), 'de');
    assert.equal(getLanguage({ locale: { language: 'en-US' } }), 'en');
    assert.equal(getLanguage({ locale: { language: 'en' } }, { language: 'de' }), 'de');
  });

  it('localizes card and editor strings in English and German', () => {
    assert.equal(localize('card.total', 'en'), 'total');
    assert.equal(localize('card.total', 'de'), 'gesamt');
    assert.equal(localize('editor.hide_unit', 'de'), 'Einheit ausblenden');
    assert.equal(localize('editor.matched_many', 'de', { count: 4 }), '4 Entitäten gefunden');
  });

  it('infers icons for German entity names', () => {
    assert.equal(inferIcon({ entity_id: 'sensor.heisswasser' }, 'Heißwasser'), 'mdi:water');
    assert.equal(inferIcon({ entity_id: 'sensor.kaffee' }, 'Kaffee'), 'mdi:coffee');
    assert.equal(inferIcon({ entity_id: 'sensor.stromverbrauch' }, 'Stromverbrauch'), 'mdi:flash');
  });

  it('returns a clean general stub config without autofilling title, subtitle, or entities', () => {
    const hass = createCoffeeHass();
    const stub = HaLeaderboardCard.getStubConfig(hass);
    assert.equal(stub.type, 'custom:ha-leaderboard-card');
    assert.equal(stub.title, undefined);
    assert.equal(stub.subtitle, undefined);
    assert.deepEqual(stub.entities, []);
  });
});

describe('time period ranking', () => {
  it('normalizes period aliases and computes calendar/rolling bounds', () => {
    assert.equal(normalizePeriod('7d'), 'week');
    assert.equal(normalizePeriod('30d'), 'month');
    assert.equal(normalizePeriod('365d'), 'year');
    assert.equal(normalizePeriod('invalid'), 'all');

    const now = new Date('2026-11-13T17:00:00');
    const today = computePeriodBounds('today', now);
    assert.equal(today.bucketPeriod, 'hour');
    assert.equal(today.startTime.getHours(), 0);
    assert.equal(today.startTime.getDate(), 13);

    const week = computePeriodBounds('week', now);
    assert.equal(week.bucketPeriod, 'day');
    assert.equal(Math.round((now - week.startTime) / 86400000), 7);

    const thisMonth = computePeriodBounds('this_month', now);
    assert.equal(thisMonth.startTime.getDate(), 1);
  });

  it('computes deltas from statistics buckets and raw history', () => {
    assert.equal(
      calculateDeltaFromStatBuckets([{ change: 4 }, { change: 7 }, { change: 2 }]),
      13
    );
    assert.equal(
      calculateDeltaFromStatBuckets([{ state: 10 }, { state: 15 }, { state: 22 }]),
      12
    );
    assert.equal(
      calculateDeltaFromHistory([{ s: '10' }, { s: '14' }, { s: '0' }, { s: '3' }]),
      7
    );
  });

  it('fetches long-term statistics and falls back to history for missing entities', async () => {
    const calls = [];
    const hass = {
      states: {
        'sensor.a': { state: '50', attributes: { state_class: 'total_increasing' } },
        'sensor.b': { state: '20' },
      },
      async callWS(msg) {
        calls.push(msg.type);
        if (msg.type === 'recorder/statistics_during_period') {
          return {
            'sensor.a': [{ change: 5 }, { change: 8 }],
          };
        }
        if (msg.type === 'history/history_during_period') {
          return {
            'sensor.b': [{ s: '14' }, { s: '20' }],
          };
        }
        return {};
      },
    };

    const values = await fetchPeriodValues(hass, ['sensor.a', 'sensor.b'], 'week');
    assert.deepEqual(calls, ['recorder/statistics_during_period', 'history/history_during_period']);
    assert.deepEqual(values, { 'sensor.a': 13, 'sensor.b': 6 });
  });

  it('ranks entities using periodValues when provided', () => {
    const hass = createCoffeeHass();
    const config = {
      include_pattern: 'sensor.coffee_machine_*',
      exclude_pattern: '*_total*, *_cleaning*',
      name_strip_prefix: 'Coffee Machine ',
      period: 'week',
      limit: 3,
    };

    const candidates = collectCandidateEntityIds(config, hass);
    assert.equal(candidates.includes('sensor.coffee_machine_state'), false);

    const periodValues = {
      'sensor.coffee_machine_cappuccino': 5,
      'sensor.coffee_machine_espresso': 12,
      'sensor.coffee_machine_latte': 9,
      'sensor.coffee_machine_hot_water': 3,
    };

    const res = resolveEntities(config, hass, periodValues);
    assert.deepEqual(
      res.items.map((i) => ({ name: i.name, value: i.value })),
      [
        { name: 'Espresso', value: 12 },
        { name: 'Caffè Latte', value: 9 },
        { name: 'Cappuccino', value: 5 },
      ]
    );
  });
});

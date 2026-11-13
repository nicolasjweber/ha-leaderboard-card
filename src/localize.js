/**
 * Localization helper for English (en) and German (de).
 */

const TRANSLATIONS = {
  en: {
    'card.total': 'total',
    'card.total_tooltip': 'Total across {count} matched entities',
    'card.runners_up': 'Runners-up',
    'card.ranking_breakdown': 'Ranking Breakdown',
    'card.empty_title': 'No matching entities found',
    'card.empty_desc':
      'Select entities in the visual editor or configure an include_pattern (e.g. sensor.*) in the card settings.',
    'card.period_group_label': 'Time period',
    'card.period_today': 'Today',
    'card.period_week': 'Week',
    'card.period_month': 'Month',
    'card.period_year': 'Year',
    'card.period_all': 'All',
    'card.period_this_week': 'This Week',
    'card.period_this_month': 'This Month',
    'card.period_this_year': 'This Year',
    'card.loading_period': 'Loading…',

    'editor.section_header_layout': 'Header & Layout',
    'editor.section_filter': 'Auto-Filter & Name Cleanup',
    'editor.section_entities': 'Entities & Custom Overrides',
    'editor.title': 'Title',
    'editor.title_placeholder': 'Leaderboard',
    'editor.subtitle': 'Subtitle',
    'editor.subtitle_placeholder': 'Optional',
    'editor.header_icon': 'Header Icon',
    'editor.header_icon_placeholder': 'mdi:trophy-outline',
    'editor.layout': 'Visual Style',
    'editor.layout_podium': 'Podium (Top 3)',
    'editor.layout_list': 'Ranked Bar List',
    'editor.layout_both': 'Both (Podium + List)',
    'editor.podium_order': 'Podium Order',
    'editor.podium_order_213': '2nd · 1st · 3rd (Classic)',
    'editor.podium_order_123': '1st · 2nd · 3rd (Left to Right)',
    'editor.limit': 'Top N Limit',
    'editor.sort_order': 'Sort Order',
    'editor.sort_desc': 'Highest first',
    'editor.sort_asc': 'Lowest first',
    'editor.unit': 'Unit Override',
    'editor.unit_placeholder': 'Auto (from entity)',
    'editor.decimals': 'Decimals',
    'editor.decimals_placeholder': 'Auto',
    'editor.show_percentage': 'Show % share',
    'editor.show_period_selector': 'Show period switcher',
    'editor.period': 'Time Period',
    'editor.period_all': 'All-Time (Current Value)',
    'editor.period_today': 'Today',
    'editor.period_week': 'Last 7 Days',
    'editor.period_month': 'Last 30 Days',
    'editor.period_year': 'Last 365 Days',
    'editor.period_this_week': 'This Week (Mon–Sun)',
    'editor.period_this_month': 'This Month',
    'editor.period_this_year': 'This Year',
    'editor.hide_unit': 'Hide unit',
    'editor.hide_zero': 'Hide zero values',
    'editor.hide_unavailable': 'Hide unavailable',
    'editor.waiting_hass': 'Waiting for Home Assistant',
    'editor.matched_one': '1 entity matched',
    'editor.matched_many': '{count} entities matched',
    'editor.include_pattern': 'Include Pattern (Wildcard)',
    'editor.include_placeholder': 'sensor.*',
    'editor.include_hint': 'Supports *, ? and comma-separated patterns.',
    'editor.exclude_pattern': 'Exclude Pattern (Wildcard)',
    'editor.exclude_placeholder': '*_total*, *_status*',
    'editor.exclude_hint': 'Skip totals, diagnostics, or status sensors.',
    'editor.strip_prefix': 'Strip Name Prefix',
    'editor.strip_prefix_placeholder': 'e.g. Device Name ',
    'editor.strip_suffix': 'Strip Name Suffix',
    'editor.strip_suffix_placeholder': 'e.g.  Counter',
    'editor.add_entity': 'Add Entity',
    'editor.entities_hint':
      'Add specific entities (or wildcards), or override the display name, icon, and accent color of matched entities.',
    'editor.entity_id_placeholder': 'sensor.entity_id',
    'editor.custom_name_placeholder': 'Custom name',
    'editor.custom_icon_placeholder': 'mdi:trophy-outline',
    'editor.remove': 'Remove',
  },
  de: {
    'card.total': 'gesamt',
    'card.total_tooltip': 'Gesamt über {count} gefundene Entitäten',
    'card.runners_up': 'Weitere Plätze',
    'card.ranking_breakdown': 'Detailübersicht',
    'card.empty_title': 'Keine passenden Entitäten gefunden',
    'card.empty_desc':
      'Wähle Entitäten im visuellen Editor aus oder konfiguriere ein include_pattern (z. B. sensor.*) in den Karteneinstellungen.',
    'card.period_group_label': 'Zeitraum',
    'card.period_today': 'Heute',
    'card.period_week': 'Woche',
    'card.period_month': 'Monat',
    'card.period_year': 'Jahr',
    'card.period_all': 'Gesamt',
    'card.period_this_week': 'Diese Woche',
    'card.period_this_month': 'Dieser Monat',
    'card.period_this_year': 'Dieses Jahr',
    'card.loading_period': 'Lädt…',

    'editor.section_header_layout': 'Kopfzeile & Layout',
    'editor.section_filter': 'Auto-Filter & Namensbereinigung',
    'editor.section_entities': 'Entitäten & Anpassungen',
    'editor.title': 'Titel',
    'editor.title_placeholder': 'Rangliste',
    'editor.subtitle': 'Untertitel',
    'editor.subtitle_placeholder': 'Optional',
    'editor.header_icon': 'Kopfzeilen-Icon',
    'editor.header_icon_placeholder': 'mdi:trophy-outline',
    'editor.layout': 'Darstellung',
    'editor.layout_podium': 'Podium (Top 3)',
    'editor.layout_list': 'Rangliste mit Balken',
    'editor.layout_both': 'Beides (Podium + Liste)',
    'editor.podium_order': 'Podium-Reihenfolge',
    'editor.podium_order_213': '2. · 1. · 3. (Klassisch)',
    'editor.podium_order_123': '1. · 2. · 3. (Links nach rechts)',
    'editor.limit': 'Anzahl (Top N)',
    'editor.sort_order': 'Sortierung',
    'editor.sort_desc': 'Höchste zuerst',
    'editor.sort_asc': 'Niedrigste zuerst',
    'editor.unit': 'Einheit überschreiben',
    'editor.unit_placeholder': 'Automatisch (von Entität)',
    'editor.decimals': 'Dezimalstellen',
    'editor.decimals_placeholder': 'Automatisch',
    'editor.show_percentage': 'Prozentanteil anzeigen',
    'editor.show_period_selector': 'Zeitraum-Umschalter anzeigen',
    'editor.period': 'Zeitraum',
    'editor.period_all': 'Gesamt (Aktueller Wert)',
    'editor.period_today': 'Heute',
    'editor.period_week': 'Letzte 7 Tage',
    'editor.period_month': 'Letzte 30 Tage',
    'editor.period_year': 'Letzte 365 Tage',
    'editor.period_this_week': 'Diese Woche (Mo–So)',
    'editor.period_this_month': 'Dieser Monat',
    'editor.period_this_year': 'Dieses Jahr',
    'editor.hide_unit': 'Einheit ausblenden',
    'editor.hide_zero': 'Nullwerte ausblenden',
    'editor.hide_unavailable': 'Nicht verfügbare ausblenden',
    'editor.waiting_hass': 'Warte auf Home Assistant',
    'editor.matched_one': '1 Entität gefunden',
    'editor.matched_many': '{count} Entitäten gefunden',
    'editor.include_pattern': 'Einschlussmuster (Wildcard)',
    'editor.include_placeholder': 'sensor.*',
    'editor.include_hint': 'Unterstützt *, ? und kommagetrennte Muster.',
    'editor.exclude_pattern': 'Ausschlussmuster (Wildcard)',
    'editor.exclude_placeholder': '*_total*, *_status*',
    'editor.exclude_hint': 'Summen-, Diagnose- oder Statussensoren ausschließen.',
    'editor.strip_prefix': 'Namenspräfix entfernen',
    'editor.strip_prefix_placeholder': 'z. B. Gerätename ',
    'editor.strip_suffix': 'Namenssuffix entfernen',
    'editor.strip_suffix_placeholder': 'z. B.  Zähler',
    'editor.add_entity': 'Entität hinzufügen',
    'editor.entities_hint':
      'Füge einzelne Entitäten (oder Wildcards) hinzu oder überschreibe Name, Icon und Akzentfarbe.',
    'editor.entity_id_placeholder': 'sensor.entitaet',
    'editor.custom_name_placeholder': 'Eigener Name',
    'editor.custom_icon_placeholder': 'mdi:trophy-outline',
    'editor.remove': 'Entfernen',
  },
};

/**
 * Determine active language ('de' or 'en') from config override, Home Assistant locale, or browser.
 *
 * @param {object} [hass]
 * @param {object} [config]
 * @returns {'de'|'en'}
 */
export function getLanguage(hass, config) {
  const raw =
    config?.language ||
    hass?.locale?.language ||
    hass?.language ||
    (typeof navigator !== 'undefined' ? navigator.language : '') ||
    'en';

  return String(raw).trim().toLowerCase().startsWith('de') ? 'de' : 'en';
}

/**
 * Look up a localized string and interpolate `{var}` placeholders.
 *
 * @param {string} key
 * @param {'de'|'en'} [lang]
 * @param {Record<string, string|number>} [vars]
 * @returns {string}
 */
export function localize(key, lang = 'en', vars = {}) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let template = dict[key] ?? TRANSLATIONS.en[key] ?? key;
  for (const [varKey, varVal] of Object.entries(vars)) {
    template = template.replaceAll(`{${varKey}}`, String(varVal));
  }
  return template;
}

import { HaLeaderboardCard } from './leaderboard-card.js';
import { HaLeaderboardCardEditor } from './leaderboard-card-editor.js';
import { collectCandidateEntityIds, globToRegExp, normalizeConfig, resolveEntities } from './filter.js';
import {
  calculateDeltaFromHistory,
  calculateDeltaFromStatBuckets,
  computePeriodBounds,
  fetchPeriodValues,
  normalizePeriod,
} from './period.js';
import { getLanguage, localize } from './localize.js';

if (typeof customElements !== 'undefined') {
  if (!customElements.get('ha-leaderboard-card')) {
    customElements.define('ha-leaderboard-card', HaLeaderboardCard);
  }
  if (!customElements.get('ha-leaderboard-card-editor')) {
    customElements.define('ha-leaderboard-card-editor', HaLeaderboardCardEditor);
  }
}

if (typeof window !== 'undefined') {
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === 'ha-leaderboard-card')) {
    window.customCards.push({
      type: 'ha-leaderboard-card',
      name: 'Leaderboard Card',
      description:
        'Rank and showcase your top entities in a podium or ranked progress bar view.',
      preview: false,
      documentationURL: 'https://github.com/nicolasjweber/ha-leaderboard-card',
    });
  }
}

export {
  HaLeaderboardCard,
  HaLeaderboardCardEditor,
  calculateDeltaFromHistory,
  calculateDeltaFromStatBuckets,
  collectCandidateEntityIds,
  computePeriodBounds,
  fetchPeriodValues,
  globToRegExp,
  normalizeConfig,
  normalizePeriod,
  resolveEntities,
  getLanguage,
  localize,
};

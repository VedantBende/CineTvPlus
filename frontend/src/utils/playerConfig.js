/**
 * Player Configuration & URL Builders
 *
 * Centralized config for all supported video players.
 * Uses ENV-based URLs and proxy naming for abstraction.
 * No default player — user must choose on first visit.
 */

const STORAGE_KEY = 'cinetv_selected_player';

// ─── ENV-based Base URLs ──────────────────────────────────────────────

const ALPHA_MOVIE = import.meta.env.VITE_PLAYER_ALPHA_MOVIE;
const ALPHA_TV    = import.meta.env.VITE_PLAYER_ALPHA_TV;
const BETA_MOVIE  = import.meta.env.VITE_PLAYER_BETA_MOVIE;
const BETA_TV     = import.meta.env.VITE_PLAYER_BETA_TV;
const GAMMA_MOVIE   = import.meta.env.VITE_PLAYER_GAMMA_MOVIE;
const GAMMA_TV      = import.meta.env.VITE_PLAYER_GAMMA_TV;
const DELTA_MOVIE   = import.meta.env.VITE_PLAYER_DELTA_MOVIE;
const DELTA_TV      = import.meta.env.VITE_PLAYER_DELTA_TV;
const EPSILON_MOVIE = import.meta.env.VITE_PLAYER_EPSILON_MOVIE;
const EPSILON_TV    = import.meta.env.VITE_PLAYER_EPSILON_TV;

// ─── Player Definitions ───────────────────────────────────────────────

export const PLAYERS = {
  alpha: {
    id: 'alpha',
    label: 'Server Alpha',
    description: 'Fast & Reliable',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `${ALPHA_TV}/${tmdbId}/${season}/${episode}?color=FF0000&overlay=true&autoplayNextEpisode=true`;
      }
      return `${ALPHA_MOVIE}/${tmdbId}?color=FF0000&overlay=true`;
    },
  },

  beta: {
    id: 'beta',
    label: 'Server Beta',
    description: 'Premium Quality',
    getUrl: (tmdbId, mediaType, season, episode, options = {}) => {
      let url;
      if (mediaType === 'tv') {
        if (!season || !episode) return null;
        url = `${BETA_TV}/${tmdbId}/${season}/${episode}`;
      } else {
        url = `${BETA_MOVIE}/${tmdbId}`;
      }

      let queryString = 'server=MbPly-[Multi-Lang]&sub=en&lang=hi';
      
      if (options.one_server) {
        queryString += '&one_server=true';
      }

      return `${url}?${queryString}`;
    },
  },

  gamma: {
    id: 'gamma',
    label: 'Server Gamma',
    description: 'FHD · Fast',
    getUrl: (tmdbId, mediaType, season, episode, { autoplay = true, resumeTime = 0 } = {}) => {
      if (!tmdbId) return null;
      let url;
      if (mediaType === 'tv' && season && episode) {
        url = `${GAMMA_TV}/${tmdbId}/${season}/${episode}`;
      } else {
        url = `${GAMMA_MOVIE}/${tmdbId}`;
      }
      const params = ['theme=e50914'];
      if (autoplay) params.push('autoPlay=true');
      if (resumeTime && resumeTime > 10) {
        params.push(`startTime=${Math.floor(resumeTime)}`);
      }
      return `${url}?${params.join('&')}`;
    },
  },

  delta: {
    id: 'delta',
    label: 'Server Delta',
    description: 'Standard · Fast',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv') {
        if (!season || !episode) {
          console.warn('[Delta] TV requires season and episode');
          return null;
        }
        return `${DELTA_TV}/${tmdbId}/${season}/${episode}`;
      }
      return `${DELTA_MOVIE}/${tmdbId}`;
    },
  },

  epsilon: {
    id: 'epsilon',
    label: 'Server Epsilon',
    description: 'Alternative Source',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `${EPSILON_TV}/${tmdbId}/${season}/${episode}`;
      }
      return `${EPSILON_MOVIE}/${tmdbId}`;
    },
  },  

  otaku1: {
    id: 'otaku1',
    label: 'Otaku Server 1',
    description: 'Stable Anime Source (Sub/Dub)',
    getUrl: () => null,
  },

  otaku2: {
    id: 'otaku2',
    label: 'Otaku Server 2',
    description: 'Premium Anime Source (Sub/Dub)',
    getUrl: () => null,
  },

  otaku3: {
    id: 'otaku3',
    label: 'Otaku Server 3',
    description: 'Fast Anime Source (Sub/Dub)',
    getUrl: () => null,
  },
};

// ─── Constants ────────────────────────────────────────────────────────

export const PLAYER_LIST = Object.values(PLAYERS);

// ─── Persistence ──────────────────────────────────────────────────────

/**
 * Get the selected player for this media from localStorage.
 * Defaults to 'alpha' (Server Alpha) if no specific player is saved.
 */
export function getSavedPlayer(tmdbId, mediaType) {
  if (mediaType === 'anime') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (tmdbId) {
          const key = `anime_${tmdbId}`;
          if (parsed[key] && ['otaku1', 'otaku2', 'otaku3'].includes(parsed[key])) {
            return parsed[key];
          }
        }
      }
    } catch {
      // ignore
    }
    return 'otaku1';
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (tmdbId && mediaType) {
          const key = `${mediaType}_${tmdbId}`;
          if (parsed[key] && PLAYERS[parsed[key]]) {
            return parsed[key];
          }
        }
        
        // They have used the site before, but no specific server for this media.
        // Use the global fallback (Alpha).
        if (Object.keys(parsed).length > 0) {
          return 'alpha';
        }
      } catch (e) {
        // They have old string format data, meaning they are an existing user.
        return 'alpha';
      }
    }
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
  }
  
  // Brand new user (or empty storage). Show the modal!
  return null;
}

/**
 * Save the selected player for this specific media to localStorage.
 */
export function savePlayer(playerId, tmdbId, mediaType) {
  try {
    if (PLAYERS[playerId]) {
      let data = {};
      const saved = localStorage.getItem(STORAGE_KEY);
      
      if (saved) {
        try {
          data = JSON.parse(saved);
        } catch (e) {
          // Old format was just a string, overwrite it.
        }
      }
      
      if (tmdbId && mediaType) {
        const key = `${mediaType}_${tmdbId}`;
        data[key] = playerId;
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // Silently fail if localStorage unavailable
  }
}

/**
 * Remove the saved player for this specific media from localStorage.
 */
export function removeSavedPlayer(tmdbId, mediaType) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      let data = JSON.parse(saved);
      if (tmdbId && mediaType) {
        const key = `${mediaType}_${tmdbId}`;
        if (data[key]) {
          delete data[key];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      }
    }
  } catch {
    // Silently fail if localStorage unavailable
  }
}

/**
 * Build embed URL for the given player and content.
 * Falls back to alpha if invalid player ID.
 */
export function getEmbedUrl(playerId, tmdbId, mediaType, season, episode, options = {}) {
  const player = PLAYERS[playerId] || PLAYERS.alpha;
  return player.getUrl(tmdbId, mediaType, season, episode, options);
}

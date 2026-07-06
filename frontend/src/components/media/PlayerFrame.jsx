import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateProgress } from '../../utils/progressTracker';
import { getEmbedUrl, getSavedPlayer, savePlayer } from '../../utils/playerConfig';
import PlayerSelector from './PlayerSelector';
import ServerPickerModal from './ServerPickerModal';
import EpisodeSelector from './EpisodeSelector';

function PlayerFrame({ 
  tmdbId,
  mediaType, 
  season = null, 
  episode = null,
  seasons = null,
  autoplay = true,
  resumeTime = 0 
}) {
  const { getToken } = useAuth();
  const iframeRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Player selection — null means no player chosen yet (show modal)
  const [selectedPlayer, setSelectedPlayer] = useState(() => getSavedPlayer(tmdbId, mediaType));
  const [animateButtons, setAnimateButtons] = useState(false);
  
  // Anime Server states
  const [animeLang, setAnimeLang] = useState(() => localStorage.getItem('cinetv_anime_lang') || 'sub');
  const [animeOrigin, setAnimeOrigin] = useState('');
  const [animeEmbedUrl, setAnimeEmbedUrl] = useState(null);
  const [isResolvingAnime, setIsResolvingAnime] = useState(false);
  const [animeResolveError, setAnimeResolveError] = useState(null);

  // Loading & Timeout states
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);
  const [playerTimeout, setPlayerTimeout] = useState(false);
  const loadingTimeoutRef = useRef(null);

  // Derive season/episode from URL props directly instead of syncing via useEffect
  const isTVOrAnime = mediaType === 'tv' || mediaType === 'anime';
  const activeSeason = isTVOrAnime ? (season || 1) : null;
  const activeEpisode = isTVOrAnime ? (episode || 1) : null;

  // Sync selected player when tmdbId or mediaType changes
  useEffect(() => {
    setSelectedPlayer(getSavedPlayer(tmdbId, mediaType));
  }, [tmdbId, mediaType]);

  const isAnimeServer = ['otaku1', 'otaku2', 'otaku3'].includes(selectedPlayer);


  // Build embed URL (only when a player is selected and not anime)
  const defaultEmbedUrl = selectedPlayer && !isAnimeServer
    ? getEmbedUrl(selectedPlayer, tmdbId, mediaType, activeSeason, activeEpisode, {
        autoplay,
        resumeTime,
      })
    : null;

  const embedUrl = isAnimeServer ? animeEmbedUrl : defaultEmbedUrl;

  // Handle iframe load timeout
  useEffect(() => {
    if (selectedPlayer && embedUrl) {
      setIsPlayerLoading(true);
      setPlayerTimeout(false);
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      loadingTimeoutRef.current = setTimeout(() => {
        setPlayerTimeout(true);
        setIsPlayerLoading(false);
      }, 15000); // 15 seconds timeout
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [embedUrl, selectedPlayer]);

  const handleIframeLoad = () => {
    setIsPlayerLoading(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };

  // Resolve Anime Server URL
  useEffect(() => {
    if (isAnimeServer) {
      const controller = new AbortController();
      const resolveUrl = async () => {
        setIsResolvingAnime(true);
        setAnimeResolveError(null);
        try {
          const API_URL = import.meta.env.VITE_API_URL || '/api';
          const res = await axios.get(`${API_URL}/anime/embed`, {
            params: {
              otakuId: tmdbId, // In anime mode, tmdbId actually holds the Otaku ID
              type: mediaType,
              season: activeSeason,
              episode: activeEpisode,
              lang: animeLang,
              server: selectedPlayer
            },
            signal: controller.signal
          });
          
          if (res.data && res.data.success) {
            setAnimeEmbedUrl(res.data.url);
            if (res.data.origin) setAnimeOrigin(res.data.origin);
          } else {
            setAnimeResolveError(res.data.error || 'Failed to resolve episode');
          }
        } catch (error) {
          if (!axios.isCancel(error)) {
            console.error('Failed to resolve anime embed:', error);
            setAnimeResolveError('Failed to load anime server. Please try another server.');
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsResolvingAnime(false);
          }
        }
      };
      resolveUrl();
      
      return () => controller.abort();
    }
  }, [selectedPlayer, tmdbId, mediaType, activeSeason, activeEpisode, animeLang]);

  const handleLanguageToggle = useCallback((lang) => {
    if (animeLang === lang) return;
    setIsResolvingAnime(true); // Force loading state immediately
    setAnimeLang(lang);
    localStorage.setItem('cinetv_anime_lang', lang);
  }, [animeLang]);


  // Handle player selection (from modal or buttons)
  const handlePlayerSelect = useCallback((playerId) => {
    const isFirstSelection = selectedPlayer === null;
    setSelectedPlayer(playerId);
    savePlayer(playerId, tmdbId, mediaType);

    // Trigger button animation on first selection
    if (isFirstSelection) {
      setTimeout(() => setAnimateButtons(true), 100);
    }
  }, [selectedPlayer, tmdbId, mediaType]);


  // Handle season/episode change from EpisodeSelector
  const handleEpisodeChange = useCallback((newSeason, newEpisode) => {
    // Sync URL without a page reload so UI S1 E1 indicators naturally update!
    const params = new URLSearchParams(location.search);
    params.set('season', newSeason);
    params.set('episode', newEpisode);
    navigate(`?${params.toString()}`, { replace: true });
  }, [location.search, navigate]);


  // Listen for progress events from player
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        // (Otaku 2 & 3) MEDIA_DATA event
        if (animeOrigin && event.origin === animeOrigin && event.data?.type === 'MEDIA_DATA') {
          const mediaData = event.data.data;
          localStorage.setItem('otakuProgress', JSON.stringify(mediaData));
          return;
        }

        if (event.data && typeof event.data === 'object') {
          // If the message is wrapped in a "PLAYER_EVENT", extract the inner payload
          const payload = event.data.type === 'PLAYER_EVENT' && event.data.data 
            ? event.data.data 
            : event.data;

          if (payload.event === 'timeupdate' && payload.currentTime && payload.duration) {
            const currentProgress = (payload.currentTime / payload.duration) * 100;
            
            const progressData = {
              tmdbId,
              mediaType,
              season: activeSeason,
              episode: activeEpisode,
              currentTime: payload.currentTime,
              duration: payload.duration,
              progress: currentProgress,
              lastWatched: new Date().toISOString()
            };

            // Calculate seconds to throttle
            const currentSeconds = Math.floor(payload.currentTime);

            // Store in backend every 10 seconds
            if (!isAnimeServer && currentSeconds % 10 === 0 && currentSeconds > 0) {
              updateProgress(getToken, progressData).catch(err => console.error('Failed to save progress:', err));
            }
          }
        }
      } catch {
        // Silently handle errors
      }
    };


    window.addEventListener('message', handleMessage);


    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [tmdbId, mediaType, activeSeason, activeEpisode, getToken, animeOrigin, isAnimeServer]);


  // ─── Shared Event Handler (Delta + Epsilon) ─────────────────────
  useEffect(() => {
    // Only attach if active server is Delta or Epsilon
    if (selectedPlayer !== 'delta' && selectedPlayer !== 'epsilon') return;

    const TRUSTED_ORIGIN = import.meta.env.VITE_PLAYER_DELTA_EPSILON_ORIGIN;

    const handleDeltaEpsilonMessage = (event) => {
      // Strict origin validation — NEVER process other origins
      if (event.origin !== TRUSTED_ORIGIN) return;

      try {
        const message = event.data;
        if (!message || typeof message !== 'object') return;

        // ── MEDIA_DATA: Store stream metadata in localStorage ──
        if (message.type === 'MEDIA_DATA') {
          try {
            const existing = JSON.parse(localStorage.getItem('deltaEpsilonProgress') || '{}');
            const key = mediaType === 'tv' || mediaType === 'anime'
              ? `${mediaType}_${tmdbId}_s${activeSeason}_e${activeEpisode}`
              : `movie_${tmdbId}`;

            localStorage.setItem('deltaEpsilonProgress', JSON.stringify({
              ...existing,
              [key]: {
                ...message.data,
                tmdbId,
                mediaType,
                season: activeSeason,
                episode: activeEpisode,
                server: selectedPlayer,
                last_updated: new Date().toISOString(),
              }
            }));
          } catch {
            // localStorage may be unavailable
          }
          return;
        }

        // ── PLAYER_EVENT: Handle playback lifecycle events ──
        if (message.type === 'PLAYER_EVENT') {
          const payload = message.data || {};
          const eventType = payload.event;

          if (!eventType) return;

          switch (eventType) {
            case 'timeupdate': {
              const { currentTime, duration } = payload;
              if (!currentTime || !duration) break;

              const currentSeconds = Math.floor(currentTime);

              // Throttle: sync to backend every 10s
              if (currentSeconds % 10 === 0 && currentSeconds > 0) {
                const progressData = {
                  tmdbId,
                  mediaType,
                  season: activeSeason,
                  episode: activeEpisode,
                  currentTime,
                  duration,
                  progress: (currentTime / duration) * 100,
                  lastWatched: new Date().toISOString(),
                };
                updateProgress(getToken, progressData).catch(
                  err => console.error('[Delta/Epsilon] Failed to save progress:', err)
                );
              }
              break;
            }

            case 'play':
            case 'pause':
            case 'seeked':
            case 'ended':
              console.debug(`[${selectedPlayer}] Player event: ${eventType}`);
              break;

            default:
              // Silently ignore unknown events
              break;
          }
        }
      } catch {
        // Malformed event data — silently discard
      }
    };

    window.addEventListener('message', handleDeltaEpsilonMessage);
    return () => window.removeEventListener('message', handleDeltaEpsilonMessage);

  }, [selectedPlayer, tmdbId, mediaType, activeSeason, activeEpisode, getToken]);


  // ─── Gamma Event Bridge ────────────────────────────────────────
  useEffect(() => {
    if (selectedPlayer !== 'gamma') return;

    const TRUSTED_ORIGIN = import.meta.env.VITE_PLAYER_GAMMA_ORIGIN;

    const handleGammaMessage = (event) => {
      if (event.origin !== TRUSTED_ORIGIN) return;

      try {
        const message = event.data;
        if (!message || typeof message !== 'object') return;

        // ── MEDIA_DATA: Store stream metadata in localStorage ──
        if (message.type === 'MEDIA_DATA') {
          try {
            const existing = JSON.parse(localStorage.getItem('gammaProgress') || '{}');
            const key = mediaType === 'tv' || mediaType === 'anime'
              ? `${mediaType}_${tmdbId}_s${activeSeason}_e${activeEpisode}`
              : `movie_${tmdbId}`;

            localStorage.setItem('gammaProgress', JSON.stringify({
              ...existing,
              [key]: {
                ...message.data,
                tmdbId,
                mediaType,
                season: activeSeason,
                episode: activeEpisode,
                server: 'gamma',
                last_updated: new Date().toISOString(),
              }
            }));
          } catch {
            // localStorage may be unavailable
          }
          return;
        }

        // ── PLAYER_EVENT: Handle playback lifecycle events ──
        if (message.type === 'PLAYER_EVENT') {
          const payload = message.data || {};
          const eventType = payload.event;

          if (!eventType) return;

          switch (eventType) {
            case 'timeupdate': {
              const { currentTime, duration } = payload;
              if (!currentTime || !duration) break;

              const currentSeconds = Math.floor(currentTime);

              // Throttle: sync to backend every 10s
              if (currentSeconds % 10 === 0 && currentSeconds > 0) {
                const progressData = {
                  tmdbId,
                  mediaType,
                  season: activeSeason,
                  episode: activeEpisode,
                  currentTime,
                  duration,
                  progress: (currentTime / duration) * 100,
                  lastWatched: new Date().toISOString(),
                };
                updateProgress(getToken, progressData).catch(
                  err => console.error('[Gamma] Failed to save progress:', err)
                );
              }
              break;
            }

            case 'play':
            case 'pause':
            case 'seeked':
            case 'ended':
              console.debug(`[gamma] Player event: ${eventType}`);
              break;

            default:
              break;
          }
        }
      } catch {
        // Malformed event data — silently discard
      }
    };

    window.addEventListener('message', handleGammaMessage);
    return () => window.removeEventListener('message', handleGammaMessage);

  }, [selectedPlayer, tmdbId, mediaType, activeSeason, activeEpisode, getToken]);


  // No player selected — show server picker modal
  if (!selectedPlayer) {
    return (
      <div>
        {/* Empty player placeholder */}
        <div className="relative w-full overflow-hidden rounded-none sm:rounded-md md:rounded-lg bg-zinc-900/50" style={{ paddingBottom: '56.25%' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
              </svg>
              <p className="text-zinc-600 text-xs sm:text-sm">Select a server to start watching</p>
            </div>
          </div>
        </div>

        {/* Server Picker Modal */}
        <ServerPickerModal onSelect={handlePlayerSelect} />
      </div>
    );
  }


  // Restore fallback logic: strictly no sandbox parameters to prevent Server Zeta issues.
  const iframeReferrer = selectedPlayer === 'zeta'
    ? 'no-referrer'
    : isAnimeServer
      ? undefined
      : 'origin';


  const iframeSandbox = selectedPlayer === 'beta'
    ? "allow-scripts allow-same-origin allow-forms allow-presentation"
    : undefined;

  return (
    <div>
      {/* Player Container */}
      <div className="relative w-full overflow-hidden rounded-none sm:rounded-md md:rounded-lg bg-zinc-900/50" style={{ paddingBottom: '56.25%' }}>
        {isAnimeServer && isResolvingAnime ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-3"></div>
              <p className="text-zinc-400 text-xs sm:text-sm">Resolving Anime Server...</p>
            </div>
          </div>
        ) : isAnimeServer && animeResolveError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <svg className="w-10 h-10 text-red-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-zinc-300 text-sm font-medium">{animeResolveError}</p>
            </div>
          </div>
        ) : playerTimeout ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4 max-w-sm">
              <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-zinc-200 font-semibold mb-2">Server Timeout</h3>
              <p className="text-zinc-400 text-sm mb-4">The server took too long to respond. It may be blocked on your network or experiencing high traffic.</p>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
              >
                Change Server
              </button>
            </div>
          </div>
        ) : (
          <>
            {isPlayerLoading && !playerTimeout && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-3"></div>
                  <p className="text-zinc-400 text-xs sm:text-sm">Loading Server...</p>
                </div>
              </div>
            )}
            <iframe
              key={`${selectedPlayer}-${tmdbId}-${activeSeason}-${activeEpisode}-${animeLang}`}
              ref={iframeRef}
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full border-0"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen *"
              title="Video Player"
              referrerPolicy={iframeReferrer}
              sandbox={iframeSandbox}
              loading="eager"
              onLoad={handleIframeLoad}
            />
          </>
        )}
      </div>

      {/* Controls Container */}
      <div className="flex flex-col sm:flex-row items-center mt-3 sm:mt-4 gap-3 sm:gap-4 px-1 relative w-full">
        {/* Sub/Dub Toggle for Anime Server */}
        {isAnimeServer && (
          <div className="flex sm:absolute sm:left-1 bg-zinc-800/80 rounded-lg p-1 border border-zinc-700/50 shadow-inner z-10">
            <button
              onClick={() => handleLanguageToggle('sub')}
              className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all duration-300 ${
                animeLang === 'sub'
                  ? 'bg-red-600 text-white shadow-md scale-[1.02]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
              }`}
            >
              SUB
            </button>
            <button
              onClick={() => handleLanguageToggle('dub')}
              className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all duration-300 ${
                animeLang === 'dub'
                  ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
              }`}
            >
              DUB
            </button>
          </div>
        )}

        {/* Player Selector (server buttons) */}
        <div className="flex-1 w-full flex justify-center">
          <PlayerSelector
            selectedPlayer={selectedPlayer}
            onSelect={handlePlayerSelect}
            animate={animateButtons}
          />
        </div>
      </div>

      {/* Episode Selector (TV shows only) */}
      {(mediaType === 'tv' || mediaType === 'anime') && seasons && seasons.length > 0 && (
        <EpisodeSelector
          seasons={seasons}
          currentSeason={activeSeason}
          currentEpisode={activeEpisode}
          onEpisodeChange={handleEpisodeChange}
        />
      )}
    </div>
  );
}


export default PlayerFrame;

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getProgress } from '../utils/progressTracker';
import { addOrUpdateItem } from '../utils/continueWatchingStore';
import { fetchAnimeDetails } from '../utils/otakuApi';
import PlayerFrame from '../components/media/PlayerFrame';
import DevToolsErrorScreen from '../components/ui/DevToolsErrorScreen';
import { useDevToolsDetector } from '../utils/devtoolsDetector';

import { useAuth, useUser } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const POSTER_BASE = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = import.meta.env.VITE_TMDB_BACKDROP_BASE_URL || 'https://image.tmdb.org/t/p/w1280';

function WatchPage() {
  const isDevToolsOpen = useDevToolsDetector();
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const { isAnimeMode } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const tmdbId = searchParams.get('id');
  const mediaType = searchParams.get('type');
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');
  const resume = searchParams.get('resume');


  const [resumeTime, setResumeTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTips, setShowTips] = useState(() => !localStorage.getItem('helpfulTipsAccepted'));
  const [tvSeasons, setTvSeasons] = useState(null);
  const [isUnreleased, setIsUnreleased] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (!tmdbId || !mediaType) {
      navigate('/');
      return;
    }

    // Track in continue watching (DB-backed, fire-and-forget)
    // Uses a lightweight fetch to our cached TMDB proxy — NOT the heavy
    // fetchMovieDetails/fetchTVShowDetails (which append credits,videos and
    // can compete with the detail page's own TMDB call, causing intermittent failures).
    if (isSignedIn) {
      (async () => {
        try {
          if (mediaType === 'anime') {
            const data = await fetchAnimeDetails(tmdbId);
            if (data) {
              if (data.status === 'NOT_YET_RELEASED') {
                setIsUnreleased(true);
              }

              addOrUpdateItem(getToken, {
                tmdbId: tmdbId.toString(),
                type: mediaType,
                title: data.title || data.title?.english || data.title?.romaji || 'Unknown Anime',
                posterPath: data.coverImage?.extraLarge || data.coverImage?.large || data.url,
                backdropPath: data.bannerImage || data.coverImage?.extraLarge || data.backdrop,
                season,
                episode,
                isAnime: isAnimeMode,
                timestamp: Date.now()
              });
            }
          } else {
            const res = await fetch(`${API_URL}/tmdb/${mediaType}/${tmdbId}?language=en-US`);
            if (res.ok) {
              const data = await res.json();
              const title = data.title || data.name || 'Unknown Title';
              const posterPath = data.poster_path
                ? `${POSTER_BASE}${data.poster_path}`
                : null;
              const backdropPath = data.backdrop_path
                ? `${BACKDROP_BASE}${data.backdrop_path}`
                : null;

              addOrUpdateItem(getToken, {
                tmdbId,
                type: mediaType,
                title,
                posterPath,
                backdropPath,
                season,
                episode,
                isAnime: isAnimeMode
              });
            }
          }
        } catch (err) {
          console.error('Continue watching tracking failed:', err);
        }
      })();
    }

    if (isSignedIn) {
      loadProgress();
    } else {
      setLoading(false);
    }

    // Fetch TV show seasons data for episode selector
    if (isAnimeMode) {
      fetchAnimeDetails(tmdbId).then(data => {
        // Do not show seasons/episodes for Anime Movies
        if (data && data.episodes && data.format !== 'MOVIE') {
          setTvSeasons([{ season_number: data.currentSeason || 1, episode_count: data.episodes, name: `Season ${data.currentSeason || 1}` }]);
        }
      }).catch(err => console.error("Failed to fetch anime episodes:", err));
    } else if (mediaType === 'tv' && tmdbId) {
      fetchTVSeasons();
    }
  }, [tmdbId, mediaType, season, episode, isSignedIn, isAnimeMode]);


  // Fetch TV seasons metadata from TMDB
  const fetchTVSeasons = async () => {
    try {
      const res = await fetch(`${API_URL}/tmdb/tv/${tmdbId}?language=en-US`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.seasons && Array.isArray(data.seasons)) {
        setTvSeasons(data.seasons);
      }
    } catch (err) {
      console.error('Failed to fetch TV seasons:', err);
    }
  };


  // Detect fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isNowFullscreen);
    };


    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);


    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);


  const handleAcceptTips = () => {
    localStorage.setItem('helpfulTipsAccepted', 'true');
    setShowTips(false);
  };

  const loadProgress = async () => {
    try {
      setLoading(true);


      let timeToResume = 0;


      if (resume) {
        const resumeValue = parseFloat(resume);
        if (!isNaN(resumeValue) && resumeValue > 0) {
          timeToResume = resumeValue;
        }
      } else {
        const progress = await getProgress(getToken, tmdbId, season, episode);
        
        if (progress) {
          const currentTime = parseFloat(progress.currentTime) || 0;
          const duration = parseFloat(progress.duration) || 0;

          if (currentTime > 0 && duration > 0) {
            const percentWatched = (currentTime / duration) * 100;

            if (currentTime > 10 && percentWatched < 95) {
              timeToResume = currentTime;
            }
          }
        }
      }


      setResumeTime(timeToResume);
    } catch (error) {
      console.error('❌ Failed to load progress:', error);
      setResumeTime(0);
    } finally {
      setLoading(false);
    }
  };


  const handleBack = () => {
    navigate(-1);
  };

  if (isDevToolsOpen) {
    return <DevToolsErrorScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-black overflow-hidden safe-area-top safe-area-bottom sm:pt-16 md:pt-20">
      {/* Back Button - Responsive */}
      {!isFullscreen && (
        <button
          onClick={handleBack}
          className="fixed top-14 left-2 sm:top-20 sm:left-3 md:top-24 md:left-10 z-40 bg-black bg-opacity-80 hover:bg-opacity-100 text-white p-2 sm:p-2.5 md:p-3 rounded-md sm:rounded-lg transition shadow-lg touch-target"
          title="Exit player"
          aria-label="Go back"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      )}


      {/* Info Banner - Responsive */}
      {!isFullscreen && (
        <div className={`fixed top-14 right-2 sm:top-20 sm:right-3 md:top-24 z-40 bg-black bg-opacity-80 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-md sm:rounded-lg shadow-lg ${
          (mediaType === 'tv' || mediaType === 'anime') && season && episode ? 'md:right-7' : 'md:right-0'
        }`}>
          <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
            {(mediaType === 'tv' || mediaType === 'anime') && season && episode ? (
              <span>S{season} E{episode}</span>
            ) : (
              <span>Now Playing</span>
            )}
          </p>
        </div>
      )}


      {/* Player Container - Fully Responsive */}
      <div className="flex items-center justify-center min-h-screen sm:min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] w-full p-0 sm:p-2 md:p-3 lg:p-4">
        <div className="w-full max-w-7xl">
          {mediaType === 'anime' && !isAnimeMode ? (
            <div className="relative w-full overflow-hidden rounded-none sm:rounded-md md:rounded-lg bg-zinc-900/50 flex flex-col items-center justify-center border border-zinc-800" style={{ paddingBottom: '56.25%' }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
                  AniTv+ Mode Required
                </h3>
                <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto">
                  This anime is an exclusive AniTv+ title. Please enable AniTv+ mode using the toggle in the header to watch this content.
                </p>
              </div>
            </div>
          ) : isUnreleased ? (
            <div className="relative w-full overflow-hidden rounded-none sm:rounded-md md:rounded-lg bg-zinc-900/50 flex flex-col items-center justify-center border border-zinc-800" style={{ paddingBottom: '56.25%' }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <svg className="w-16 h-16 text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Not Yet Released</h2>
                <p className="text-zinc-400 max-w-md">
                  This media has not been released yet. Please check back later once it officially airs!
                </p>
                <button
                  onClick={handleBack}
                  className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          ) : (
            <PlayerFrame
              tmdbId={tmdbId}
              mediaType={mediaType}
              season={season ? parseInt(season) : null}
              episode={episode ? parseInt(episode) : null}
              seasons={tvSeasons}
              resumeTime={resumeTime}
              autoplay={true}
              quality="auto"
            />
          )}
        </div>
      </div>


      {/* Mandatory Onboarding Popup */}
      {showTips && !isFullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-900 rounded-xl shadow-2xl border border-red-900/50 max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Before You Start
              </h3>
              
              <div className="space-y-3 mb-6">
                <p className="text-gray-300 text-sm flex items-start leading-snug">
                  <span className="text-red-500 mr-2 mt-0.5">•</span> 
                  For best ad-free experience, use Brave Browser
                </p>
                <p className="text-gray-300 text-sm flex items-start leading-snug">
                  <span className="text-red-500 mr-2 mt-0.5">•</span> 
                  Avoid clicking ads — they may redirect you
                </p>
                <p className="text-gray-300 text-sm flex items-start leading-snug">
                  <span className="text-red-500 mr-2 mt-0.5">•</span> 
                  If video doesn't load, try another server
                </p>
                <p className="text-gray-300 text-sm flex items-start leading-snug">
                  <span className="text-red-500 mr-2 mt-0.5">•</span> 
                  Use fullscreen for best experience
                </p>
                <p className="text-gray-300 text-sm flex items-start leading-snug">
                  <span className="text-red-500 mr-2 mt-0.5">•</span> 
                  Your progress is saved automatically
                </p>
              </div>

              <button 
                onClick={handleAcceptTips}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default WatchPage;

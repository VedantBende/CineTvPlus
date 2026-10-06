import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const LIVETV_API_URL = import.meta.env.VITE_LIVETV_API_URL;

function LiveTVWatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAnimeMode } = useTheme();
  
  // Try to use channel from state, otherwise just use ID
  const [channel] = useState(location.state?.channel || { id });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Redirect if in AniTv+ Mode
    if (isAnimeMode) {
      navigate('/', { replace: true });
    }
  }, [isAnimeMode, navigate]);

  // Detect fullscreen changes to hide UI
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden safe-area-top sm:pt-16 md:pt-20">
      {/* Back Button */}
      {!isFullscreen && (
        <button
          onClick={handleBack}
          className="fixed top-14 left-2 sm:top-20 sm:left-3 md:top-24 md:left-10 z-40 bg-black bg-opacity-80 hover:bg-opacity-100 text-white p-2 sm:p-2.5 md:p-3 rounded-md sm:rounded-lg transition shadow-lg touch-target"
          title="Exit player"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      )}

      {/* Player Container */}
      <div className="flex items-center justify-center min-h-screen sm:min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] w-full p-0 sm:p-2 md:p-3 lg:p-4">
        <div className="w-full max-w-7xl">
          <div className="relative w-full overflow-hidden rounded-none sm:rounded-md md:rounded-lg bg-zinc-900 flex flex-col items-center justify-center border border-zinc-800 aspect-video shadow-2xl group">
            
            <iframe
              src={`${LIVETV_API_URL}/embed/${channel.id || id}`}
              className="w-full h-full border-0 absolute top-0 left-0"
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              referrerPolicy="no-referrer"
              title={`Live TV - ${channel.name || id}`}
            />
            
            {/* Custom Overlay to match theme (fades out on hover/play) */}
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none drop-shadow-md max-w-[70%] sm:max-w-sm">
               {channel.name && (
                 <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 max-w-full">
                   <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse flex-shrink-0"></span>
                   <span className="text-white font-semibold text-sm truncate">{channel.name}</span>
                 </div>
               )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveTVWatchPage;

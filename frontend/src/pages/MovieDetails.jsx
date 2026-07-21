import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMovieDetails } from '../utils/tmdbApi';
import { formatRating } from '../utils/formatters';
import MovieCard from '../components/media/MovieCard';
import PageSkeleton from '../components/ui/PageSkeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth, useUser } from '@clerk/clerk-react';

const API_URL = import.meta.env.VITE_API_URL;
const TMDB_IMAGE_BASE = import.meta.env.VITE_TMDB_CAST_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w185';

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  
  const { isAnimeMode } = useTheme();
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const loaderTimerRef = useRef(null);



  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };



  useEffect(() => {
    window.scrollTo(0, 0);
    loadMovieDetails();
  }, [id]);



  useEffect(() => {
    if (isSignedIn && id) {
      checkWatchlist();
    }
  }, [isSignedIn, id]);



  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const movieData = await fetchMovieDetails(id);
      if (!movieData) {
        throw new Error('Movie not found');
      }
      setMovie(movieData);
    } catch (err) {
      setError(err.message);
    } finally {
      clearTimeout(loaderTimerRef.current);
      setLoading(false);
    }
  };



  const checkWatchlist = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/favorites/check/${id}?anime=${isAnimeMode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setIsInWatchlist(response.data.isFavorite);
    } catch (error) {
      console.error('Failed to check watchlist:', error);
    }
  };



  const toggleWatchlist = async () => {
    if (!isSignedIn) {
      navigate('/login');
      return;
    }



    setWatchlistLoading(true);
    
    try {
      const token = await getToken();
      
      if (!token) {
        showToast('Authentication failed. Please sign in again.');
        navigate('/login');
        return;
      }



      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };



      if (isInWatchlist) {
        await axios.delete(`${API_URL}/favorites/remove/${id}?anime=${isAnimeMode}`, config);
        setIsInWatchlist(false);
      } else {
        await axios.post(`${API_URL}/favorites/add`, {
          mediaId: id,
          title: movie.title,
          posterPath: movie.url,
          rating: movie.rating,
          year: movie.year,
          mediaType: 'movie',
          isAnime: isAnimeMode
        }, config);
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error('Watchlist error:', error);
      const errorMsg = error.response?.data?.error || 'Under Development. Coming Soon !!!';
      showToast(errorMsg);
    } finally {
      setWatchlistLoading(false);
    }
  };



  const handleWatch = () => {
    navigate(`/watch?id=${id}&type=movie`);
  };



  if (loading) {
    return <PageSkeleton type="details" />;
  }



  if (error || !movie) {
    return (
      <div className="min-h-screen pt-14 sm:pt-16 md:pt-20 bg-white dark:bg-netflix-black transition-colors duration-300">
        <ErrorMessage message={error || 'Movie not found'} onRetry={loadMovieDetails} />
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-white dark:bg-netflix-black transition-colors duration-300">
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md shadow-lg text-base sm:text-lg md:text-xl ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        } text-white`}>
          {toast.message}
        </div>
      )}



      <div className="relative h-[95vh] sm:h-[60vh] md:h-[65vh] lg:h-[110vh] -mt-14 sm:-mt-16 md:-mt-16 pt-14 sm:pt-16 md:pt-16 bg-gradient-to-b from-gray-100 to-white dark:from-black dark:to-netflix-black transition-colors duration-500">
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/60 to-transparent z-10" />
        <div className="absolute left-0 right-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent z-10" />
        
        {movie.backdrop && (
          <img
            src={movie.backdrop}
            alt={movie.title}
            className="w-full h-full object-cover opacity-80 transition-opacity duration-500"
          />
        )}



        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12 container-custom z-20">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4 leading-tight drop-shadow-lg">
            {movie.title} {movie.year && <span className="text-white/70 block sm:inline mt-1 sm:mt-0">({movie.year})</span>}
          </h1>



          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
            {movie.rating && (
              <div className="flex items-center space-x-1 sm:space-x-1.5 bg-[#EAB308] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm shadow-md">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-white font-bold">{formatRating(movie.rating)}</span>
              </div>
            )}
            {movie.runtime && (
              <span className="text-white bg-[#333333]/90 border border-white/10 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold shadow-md">{movie.runtime} min</span>
            )}
            <span className="text-white bg-[#333333]/90 border border-white/10 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold shadow-md">Movie</span>
            {movie.genres && movie.genres.length > 0 && (
              <span className="text-white bg-[#333333]/90 border border-white/10 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold line-clamp-1 shadow-md">
                {movie.genres.slice(0, 2).map(g => g.name).join(', ')}
              </span>
            )}
          </div>



          <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-5">
            <button
              onClick={handleWatch}
              className="bg-white text-black px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl hover:-translate-y-1 touch-target"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Play</span>
            </button>

            {isSignedIn && (
              <button
                onClick={toggleWatchlist}
                disabled={watchlistLoading}
                className="bg-black/40 hover:bg-black/60 border border-white/20 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 flex items-center justify-center space-x-2 backdrop-blur-md shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 touch-target"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill={isInWatchlist ? '#E50914' : 'none'} stroke={isInWatchlist ? '#E50914' : 'currentColor'} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="hidden xs:inline">{isInWatchlist ? 'Remove from List' : 'Add to My List'}</span>
                <span className="xs:hidden">{isInWatchlist ? 'Remove' : 'Add'}</span>
              </button>
            )}

            {movie.trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${movie.trailer}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/40 hover:bg-black/60 border border-white/20 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 flex items-center justify-center space-x-2 backdrop-blur-md shadow-lg hover:-translate-y-1 touch-target"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
                </svg>
                <span>Trailer</span>
              </a>
            )}
          </div>
        </div>
      </div>



      <div className="container-custom py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-12">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <h2 className="text-gray-900 dark:text-white text-xl sm:text-2xl font-bold mb-3 sm:mb-4 transition-colors">Overview</h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8 transition-colors">
              {movie.overview}
            </p>



            {movie.cast && movie.cast.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-gray-900 dark:text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4 transition-colors">Cast</h3>
                <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-4">
                  {movie.cast.map((member, index) => (
                    <div key={index} className="flex flex-col items-center text-center group">
                      <div className="w-full aspect-square rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-2 ring-2 ring-transparent group-hover:ring-netflix-red transition-all">
                        {member.profile_path ? (
                          <img
                            src={member.profile_path.startsWith('http') ? member.profile_path : `${TMDB_IMAGE_BASE}${member.profile_path}`}
                            alt={member.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium line-clamp-2 transition-colors">
                        {member.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {movie.director && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-gray-900 dark:text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4 transition-colors">Director</h3>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 ring-2 ring-gray-200 dark:ring-gray-600 transition-colors">
                    {movie.director.profile_path ? (
                      <img
                        src={movie.director.profile_path.startsWith('http') ? movie.director.profile_path : `${TMDB_IMAGE_BASE}${movie.director.profile_path}`}
                        alt={movie.director.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium transition-colors">{movie.director.name}</p>
                </div>
              </div>
            )}
          </div>



          <div className="order-1 lg:order-2">
            {movie.url && (
              <div className="mb-4 sm:mb-6">
                <img
                  src={movie.url}
                  alt={movie.title}
                  className="w-full max-w-xs mx-auto lg:max-w-full lg:mx-0 rounded-lg shadow-lg"
                />
              </div>
            )}



            <div className="bg-white dark:bg-[#141414] rounded-xl p-5 sm:p-6 border border-gray-100 dark:border-[#262626] shadow-sm transition-colors">
              <h3 className="text-gray-900 dark:text-white text-base sm:text-lg font-bold mb-4 transition-colors flex items-center gap-2">
                <svg className="w-5 h-5 text-[#E50914]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Details
              </h3>
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-[#262626]">
                {movie.year && (
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">Release Year</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">{movie.year}</span>
                  </div>
                )}
                {movie.runtime && (
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">Runtime</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">{movie.runtime} minutes</span>
                  </div>
                )}
                {movie.rating && (
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium">Rating</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">{movie.rating}/10</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



export default MovieDetails;

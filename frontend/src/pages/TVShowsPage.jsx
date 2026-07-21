import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchPopularTVShows, 
  fetchTrendingTVShows, 
  fetchTopRatedTVShows 
} from '../utils/tmdbApi';
import {
  fetchPopularAnime,
  fetchTopRatedAnime,
  fetchTrendingAnime
} from '../utils/otakuApi';
import MovieCard from '../components/media/MovieCard';
import ContentRow, { ContentRowItem } from '../components/media/ContentRow';
import Top10Row from '../components/media/Top10Row';
import ContinueWatching from '../components/media/ContinueWatching';

import PageSkeleton from '../components/ui/PageSkeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import useMediaStore, { CACHE_TTL } from '../store/mediaStore';
import { useTheme } from '../context/ThemeContext';

function TVShowsPage() {
  const navigate = useNavigate();
  const { isAnimeMode } = useTheme();

  // Read from / write to global cache
  const { 
    tvData, tvFetchedAt, 
    tvDataAnime, tvFetchedAtAnime,
    setTvData 
  } = useMediaStore();

  const activeData = isAnimeMode ? tvDataAnime : tvData;
  const activeFetchedAt = isAnimeMode ? tvFetchedAtAnime : tvFetchedAt;

  const [popularShows, setPopularShows] = useState(activeData?.popularShows || []);
  const [trendingShows, setTrendingShows] = useState(activeData?.trendingShows || []);
  const [topRatedShows, setTopRatedShows] = useState(activeData?.topRatedShows || []);
  const [heroShows, setHeroShows] = useState(activeData?.heroShows || []);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [loading, setLoading] = useState(!activeData);
  const [error, setError] = useState(null);

  // Pagination state for vertical infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dynamicRows, setDynamicRows] = useState([]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Infinite Scroll Observer setup
  const observer = useRef();
  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // Sync local state when active cache changes
  useEffect(() => {
    if (activeData) {
      setPopularShows(activeData.popularShows || []);
      setTrendingShows(activeData.trendingShows || []);
      setTopRatedShows(activeData.topRatedShows || []);
      setHeroShows(activeData.heroShows || []);
      setLoading(false);
    }
  }, [activeData]);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Reset infinite scroll state on mode toggle
    setDynamicRows([]);
    setPage(1);
    setHasMore(true);

    // Skip fetch if cache is fresh (within TTL) for current mode
    const isCacheFresh = activeData && activeFetchedAt && (Date.now() - activeFetchedAt < CACHE_TTL) && activeData.heroShows?.length > 0;
    if (isCacheFresh) {
      setLoading(false);
      return;
    }

    loadInitialTVShows();
  }, [isAnimeMode]);

  // Fetch more data when page changes
  useEffect(() => {
    if (page > 1) {
      loadMoreTVShows(page);
    }
  }, [page]);

  // Auto-rotate hero carousel
  useEffect(() => {
    if (heroShows.length === 0) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => prev === heroShows.length - 1 ? 0 : prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroShows.length]);

  const loadInitialTVShows = async () => {
    try {
      setLoading(true);
      setError(null);

      let popular, trending, topRated;

      if (isAnimeMode) {
        [popular, trending, topRated] = await Promise.all([
          fetchPopularAnime(1, 'TV, TV_SHORT, ONA, OVA'),
          fetchTrendingAnime(1, 'TV, TV_SHORT, ONA, OVA'),
          fetchTopRatedAnime(1, 'TV, TV_SHORT, ONA, OVA')
        ]);
      } else {
        [popular, trending, topRated] = await Promise.all([
          fetchPopularTVShows(1),
          fetchTrendingTVShows('week', 1),
          fetchTopRatedTVShows(1)
        ]);
      }

      const heroes = trending.filter(s => s.backdrop).slice(0, 5);

      // Persist to global cache so data survives route changes
      setTvData({
        popularShows: popular,
        trendingShows: trending,
        topRatedShows: topRated,
        heroShows: heroes,
      }, isAnimeMode);
      
      // We don't call setLoading(false) here, the useEffect([activeData]) will do it.
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentModeRef = useRef(isAnimeMode);
  useEffect(() => {
    currentModeRef.current = isAnimeMode;
  }, [isAnimeMode]);

  const loadMoreTVShows = async (pageNum) => {
    try {
      setLoadingMore(true);
      const activeMode = currentModeRef.current;
      
      let popular, topRated;
      if (activeMode) {
        [popular, topRated] = await Promise.all([
          fetchPopularAnime(pageNum, 'TV, TV_SHORT, ONA, OVA'),
          fetchTopRatedAnime(pageNum, 'TV, TV_SHORT, ONA, OVA')
        ]);
      } else {
        [popular, topRated] = await Promise.all([
          fetchPopularTVShows(pageNum),
          fetchTopRatedTVShows(pageNum)
        ]);
      }

      if (activeMode !== currentModeRef.current) return;

      if (popular.length === 0 && topRated.length === 0) {
        setHasMore(false);
        return;
      }

      const newRows = [];
      
      if (popular.length > 0) {
        newRows.push({ title: `More Popular Series`, icon: 'whatshot', data: popular });
      }
      if (topRated.length > 0) {
        newRows.push({ title: `More Top Rated Series`, icon: 'star', data: topRated });
      }

      if (newRows.length === 0) {
        setHasMore(false);
        return;
      }

      setDynamicRows(prev => [...prev, ...newRows]);
      setHasMore(popular.length >= 20 || topRated.length >= 20);
    } catch (err) {
      console.error('Error loading more TV shows:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const goToSlide = useCallback((index) => setCurrentHeroIndex(index), []);
  const nextSlide = useCallback(() => {
    setCurrentHeroIndex((prev) => prev === heroShows.length - 1 ? 0 : prev + 1);
  }, [heroShows.length]);
  const prevSlide = useCallback(() => {
    setCurrentHeroIndex((prev) => prev === 0 ? heroShows.length - 1 : prev - 1);
  }, [heroShows.length]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 75) nextSlide();
    if (touchStartX.current - touchEndX.current < -75) prevSlide();
  };

  if (loading) {
    return <PageSkeleton type="home" />;
  }

  if (error) {
    return (
      <div className="min-h-screen pt-14 sm:pt-16 md:pt-20 bg-white dark:bg-netflix-black transition-colors duration-300">
        <ErrorMessage message={error} onRetry={loadInitialTVShows} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-netflix-black transition-colors duration-300">
      {/* Hero Carousel - Same size as HomePage */}
      <div
        className="relative h-[75vh] xs:h-[60vh] sm:h-[65vh] md:h-[70vh] lg:h-[80vh] xl:h-[110vh] bg-gradient-to-b from-gray-100 to-white dark:from-black dark:to-netflix-black overflow-hidden -mt-14 sm:-mt-16 md:-mt-16 pt-14 sm:pt-16 md:pt-16 transition-colors duration-500"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Carousel Slides */}
        <div className="relative w-full h-full">
          {heroShows.map((show, index) => (
            <div
              key={`bg-${show.tmdbId}`}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-[opacity] ${
                index === currentHeroIndex
                  ? 'opacity-100 z-10 ease-in'
                  : 'opacity-0 z-0 ease-out'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-24 xs:h-28 sm:h-32 md:h-40 lg:h-48 bg-gradient-to-t from-netflix-black dark:from-netflix-black via-netflix-black/80 to-transparent z-10" />
              {isAnimeMode ? (
                <>
                  {show.backdrop && (
                    <img
                      src={show.backdrop}
                      alt={show.title}
                      className="w-full h-full object-cover blur-md opacity-50 scale-110"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      style={{ objectPosition: 'center center' }}
                    />
                  )}
                  {show.url && (
                    <div className="absolute inset-0 md:inset-y-0 md:inset-x-auto md:right-0 md:w-1/2 flex items-center justify-center md:justify-end md:pr-8 lg:pr-16 xl:pr-24 z-0 pointer-events-none">
                      <div className="relative w-[85%] xs:w-[80%] sm:w-[70%] md:w-auto md:h-[75%] lg:h-[85%] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl transform rotate-3 transition-transform duration-500 ring-4 ring-white/10">
                        <img
                          src={show.url}
                          alt={show.title}
                          className="w-full h-full object-cover"
                          loading={index === 0 ? 'eager' : 'lazy'}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                show.backdrop && (
                  <img
                    src={show.backdrop}
                    alt={show.title}
                    className="w-full h-full object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    style={{ objectPosition: 'center center' }}
                  />
                )
              )}
            </div>
          ))}
        </div>

        {/* Navigation Arrows - Desktop Only */}
        <div className="hidden lg:flex absolute left-0 top-0 bottom-0 w-12 sm:w-16 md:w-20 lg:w-28 z-30 items-center justify-start opacity-0 hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={prevSlide}
            className="ml-1.5 sm:ml-2 md:ml-3 lg:ml-4 bg-gray-200/70 hover:bg-gray-300/90 dark:bg-black/50 dark:hover:bg-black/80 text-gray-900 dark:text-white p-2 sm:p-2.5 md:p-3 lg:p-4 rounded-full transition-all backdrop-blur-sm group/btn touch-target"
            aria-label="Previous slide"
          >
            <svg className="w-7 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <div className="hidden lg:flex absolute right-0 top-0 bottom-0 w-12 sm:w-16 md:w-20 lg:w-28 z-30 items-center justify-end opacity-0 hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={nextSlide}
            className="mr-1.5 sm:mr-2 md:mr-3 lg:mr-4 bg-gray-200/70 hover:bg-gray-300/90 dark:bg-black/50 dark:hover:bg-black/80 text-gray-900 dark:text-white p-2 sm:p-2.5 md:p-3 lg:p-4 rounded-full transition-all backdrop-blur-sm group/btn touch-target"
            aria-label="Next slide"
          >
            <svg className="w-7 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 pb-12 xs:pb-14 sm:pb-16 md:pb-20 lg:pb-24 p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10 xl:p-16 container-custom z-20">
          <div className="relative max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
            {heroShows.map((show, index) => (
              <div
                key={`content-${show.tmdbId}`}
                className={`transition-opacity duration-1000 ease-in-out will-change-[opacity] ${
                  index === currentHeroIndex
                    ? 'opacity-100 relative z-10 ease-in'
                    : 'opacity-0 absolute inset-0 z-0 pointer-events-none ease-out'
                }`}
              >
                <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white mb-1.5 xs:mb-2 sm:mb-3 md:mb-4 lg:mb-6 leading-tight uppercase tracking-wide drop-shadow-2xl text-shadow-lg">
                  {show.title}
                </h1>

                <div className="flex items-center flex-wrap gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 mb-2 xs:mb-3 sm:mb-4 md:mb-5 lg:mb-6">
                  {show.rating && (
                    <div className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 bg-accent-red px-2 py-0.5 xs:px-2.5 xs:py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg">
                      <svg className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-white font-bold text-xs sm:text-sm md:text-base">{show.rating}</span>
                    </div>
                  )}
                  {show.year && (
                    <span className="text-white text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-semibold bg-white/20 px-2 py-0.5 xs:px-2.5 xs:py-1 sm:px-3 rounded-lg backdrop-blur-sm transition-colors">
                      {show.year}
                    </span>
                  )}
                </div>

                {show.overview && (
                  <p className="text-white/90 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl mb-3 xs:mb-4 sm:mb-5 md:mb-6 lg:mb-8 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-xl md:max-w-2xl drop-shadow-lg text-shadow">
                    {show.overview}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-5">
                  <button
                    onClick={() => {
                      const isEpisodic = show.media_type === 'tv' || show.type === 'tv' || show.media_type === 'anime' || show.type === 'anime' || isAnimeMode;
                      navigate(`/watch?id=${show.tmdbId}&type=${isAnimeMode ? 'anime' : (show.media_type || 'tv')}${isEpisodic ? '&season=1&episode=1' : ''}`);
                    }}
                    className="bg-white text-black px-6 py-2.5 sm:px-8 sm:py-3 md:px-10 md:py-4 rounded-xl text-sm sm:text-base md:text-lg font-bold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl hover:-translate-y-1 touch-target"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Play</span>
                  </button>
                  <button
                    onClick={() => navigate(`/tv/${show.tmdbId}`)}
                    className="bg-black/40 hover:bg-black/60 border border-white/20 text-white px-5 py-2.5 sm:px-8 sm:py-3 md:px-10 md:py-4 rounded-xl text-sm sm:text-base md:text-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 backdrop-blur-md shadow-lg hover:-translate-y-1 touch-target"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>See More</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 md:bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-1.5">
          {heroShows.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentHeroIndex
                  ? 'bg-accent-red w-6 h-1.5'
                  : 'bg-gray-500/70 hover:bg-gray-400/90 w-1.5 h-1.5'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Content Rows (Deduplicated) */}
      <div className="container-custom py-4 xs:py-5 sm:py-6 md:py-8 lg:py-10 xl:py-12 space-y-6 xs:space-y-7 sm:space-y-8 md:space-y-10 lg:space-y-12">
        <ContinueWatching filterType="tv" />

        {trendingShows.length > 0 && (
          <Top10Row items={trendingShows} type={isAnimeMode ? "anime" : "tv"} />
        )}

        {(() => {
          const shownIds = new Set(heroShows.map(s => s.tmdbId));
          const dedupe = (items) => {
            const filtered = items.filter(item => !shownIds.has(item.tmdbId));
            filtered.forEach(item => shownIds.add(item.tmdbId));
            return filtered;
          };

          const uniqueTrending = dedupe(trendingShows);
          const uniqueTopRated = dedupe(topRatedShows);
          const uniquePopular = dedupe(popularShows);

          return (
            <>
              {uniqueTrending.length > 0 && (
                <ContentRow title="Trending TV Shows" icon="trending_up">
                  {uniqueTrending.map((show) => (
                    <ContentRowItem key={show.tmdbId}>
                      <MovieCard title={show.title} poster={show.url} rating={show.rating} year={show.year} mediaId={show.mediaId} tmdbId={show.tmdbId} type={isAnimeMode ? "anime" : "tv"} format={show.format} />
                    </ContentRowItem>
                  ))}
                </ContentRow>
              )}

              {uniqueTopRated.length > 0 && (
                <ContentRow title="Top Rated Series" icon="star">
                  {uniqueTopRated.map((show) => (
                    <ContentRowItem key={show.tmdbId}>
                      <MovieCard title={show.title} poster={show.url} rating={show.rating} year={show.year} mediaId={show.mediaId} tmdbId={show.tmdbId} type={isAnimeMode ? "anime" : "tv"} format={show.format} />
                    </ContentRowItem>
                  ))}
                </ContentRow>
              )}

              {uniquePopular.length > 0 && (
                <ContentRow title="Popular TV Shows" icon="whatshot">
                  {uniquePopular.map((show) => (
                    <ContentRowItem key={show.tmdbId}>
                      <MovieCard title={show.title} poster={show.url} rating={show.rating} year={show.year} mediaId={show.mediaId} tmdbId={show.tmdbId} type={isAnimeMode ? "anime" : "tv"} format={show.format} />
                    </ContentRowItem>
                  ))}
                </ContentRow>
              )}
            </>
          );
        })()}

        {/* Dynamically Loaded Rows via Infinite Scroll */}
        {dynamicRows.map((row, index) => (
          <ContentRow key={`dynamic-row-${index}`} title={row.title} icon={row.icon}>
            {row.data.map((item) => (
              <ContentRowItem key={`dynamic-${item.tmdbId}-${index}`}>
                <MovieCard 
                  title={item.title} 
                  poster={item.url} 
                  rating={item.rating} 
                  year={item.year} 
                  mediaId={item.mediaId} 
                  tmdbId={item.tmdbId} 
                  type={isAnimeMode ? "anime" : "tv"} 
                  format={item.format}
                />
              </ContentRowItem>
            ))}
          </ContentRow>
        ))}

        {/* Infinite Scroll Target */}
        {hasMore && (
          <div ref={lastElementRef} className="w-full flex justify-center py-6 mt-4">
            {loadingMore && <PageSkeleton type="cards" />}
          </div>
        )}
      </div>
    </div>
  );
}

export default TVShowsPage;

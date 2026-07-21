import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchTVShowDetails } from "../utils/tmdbApi";
import { fetchAnimeDetails } from "../utils/otakuApi";
import { formatRating } from "../utils/formatters";

import PageSkeleton from "../components/ui/PageSkeleton";
import ErrorMessage from "../components/ui/ErrorMessage";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useTheme } from "../context/ThemeContext";
import MovieCard from "../components/media/MovieCard";
import ContentRow, { ContentRowItem } from "../components/media/ContentRow";

const API_URL = import.meta.env.VITE_API_URL;
const TMDB_IMAGE_BASE =
  import.meta.env.VITE_TMDB_CAST_IMAGE_BASE_URL ||
  "https://image.tmdb.org/t/p/w185";

function TVDetails() {
  const { id } = useParams(); // This is TMDB ID
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const { isAnimeMode } = useTheme();

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [error, setError] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [isOverviewAnimating, setIsOverviewAnimating] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodeLimit, setEpisodeLimit] = useState(33);
  const loaderTimerRef = useRef(null);

  useEffect(() => {
    if (show) {
      if (isAnimeMode && show.currentSeason) {
        setSelectedSeason(show.currentSeason);
      } else {
        setSelectedSeason(1);
      }
    }
  }, [show, isAnimeMode]);

  useEffect(() => {
    setEpisodeLimit(33);
  }, [selectedSeason]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadShowDetails();
    if (isSignedIn) {
      checkWatchlist();
    }
  }, [id, isSignedIn]);

  const loadShowDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only show the loader if the fetch takes longer than 300ms
      loaderTimerRef.current = setTimeout(() => setShowLoader(true), 300);

      let showData;
      if (isAnimeMode) {
        showData = await fetchAnimeDetails(id);
      } else {
        showData = await fetchTVShowDetails(id);
      }

      if (!showData) {
        throw new Error(isAnimeMode ? "Anime not found" : "TV show not found");
      }

      setShow(showData);
    } catch (err) {
      setError(err.message);
    } finally {
      clearTimeout(loaderTimerRef.current);
      setShowLoader(false);
      setLoading(false);
    }
  };

  const checkWatchlist = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `${API_URL}/favorites/check/${id}?anime=${isAnimeMode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setIsInWatchlist(response.data.isFavorite);
    } catch (error) {
      console.error("Failed to check watchlist:", error);
    }
  };

  const toggleWatchlist = async () => {
    if (!isSignedIn) {
      navigate("/login");
      return;
    }

    setWatchlistLoading(true);

    try {
      const token = await getToken();

      if (!token) {
        alert("Authentication failed. Please sign in again.");
        navigate("/login");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      if (isInWatchlist) {
        await axios.delete(
          `${API_URL}/favorites/remove/${id}?anime=${isAnimeMode}`,
          config,
        );
        setIsInWatchlist(false);
      } else {
        await axios.post(
          `${API_URL}/favorites/add`,
          {
            mediaId: id,
            title: show.title,
            posterPath: show.url,
            rating: show.rating,
            year: show.year,
            mediaType: isAnimeMode && show.format === "MOVIE" ? "movie" : "tv",
            isAnime: isAnimeMode,
          },
          config,
        );
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error("Watchlist error:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to update My List";
      alert(errorMsg);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const toggleOverview = () => {
    setIsOverviewExpanded(!isOverviewExpanded);
    setIsOverviewAnimating(true);
    setTimeout(() => setIsOverviewAnimating(false), 500);
  };

  const handleWatchFirstEpisode = () => {
    if (show.format === "MOVIE") {
      navigate(
        `/watch?id=${show.tmdbId}&type=${isAnimeMode ? "anime" : "movie"}`,
      );
    } else {
      navigate(
        `/watch?id=${show.tmdbId}&type=${isAnimeMode ? "anime" : "tv"}&season=${selectedSeason}&episode=1`,
      );
    }
  };

  if (loading) {
    return <PageSkeleton type="details" />;
  }

  if (error || !show) {
    return (
      <div className="min-h-screen pt-14 sm:pt-16 md:pt-20 bg-white dark:bg-netflix-black transition-colors duration-300">
        <ErrorMessage
          message={error || "Show not found"}
          onRetry={loadShowDetails}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-netflix-black transition-colors duration-300">
      {/* Hero Section - Responsive */}
      <div className="relative h-[95vh] sm:h-[60vh] md:h-[65vh] lg:h-[110vh] -mt-14 sm:-mt-16 md:-mt-16 pt-14 sm:pt-16 md:pt-16 bg-gradient-to-b from-gray-100 to-white dark:from-black dark:to-netflix-black transition-colors duration-500">
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/60 to-transparent z-10" />
        <div className="absolute left-0 right-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent z-10" />

        {show.backdrop && (
          <img
            src={show.backdrop}
            alt={show.title}
            className="w-full h-full object-cover opacity-80 transition-opacity duration-500"
          />
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12 container-custom z-20">
          {/* Title - Responsive */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4 leading-tight drop-shadow-lg">
            {show.title}{" "}
            {show.year && (
              <span className="text-white/70 block sm:inline mt-1 sm:mt-0">
                ({show.year})
              </span>
            )}
          </h1>

          {/* Metadata - Responsive */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-4 md:mb-6">
            {show.rating && (
              <div className="flex items-center space-x-1 sm:space-x-1.5 bg-[#EAB308] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm shadow-md">
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-white font-bold">
                  {formatRating(show.rating)}
                </span>
              </div>
            )}
            {show.format === "MOVIE" ? (
              <span className="text-white bg-[#333333]/90 border border-white/10 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold shadow-md">
                Movie
              </span>
            ) : show.seasons ? (
              <span className="text-white bg-[#333333]/90 border border-white/10 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold shadow-md">
                {show.seasons} Season{show.seasons > 1 ? "s" : ""}
              </span>
            ) : null}
            {show.format !== "MOVIE" && show.episodes && (
              <span className="text-white bg-[#333333]/90 border border-white/10 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold shadow-md">
                {show.episodes} Episodes
              </span>
            )}
            {show.genres && show.genres.length > 0 && (
              <span className="text-white bg-[#333333]/90 border border-white/10 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold line-clamp-1 shadow-md">
                {show.genres
                  .slice(0, 2)
                  .map((g) => g.name)
                  .join(", ")}
              </span>
            )}
          </div>

          {/* Overview - Responsive */}
          <div className="hidden sm:block max-w-3xl mb-3 sm:mb-4 md:mb-6">
            <div
              className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${
                isOverviewExpanded
                  ? "max-h-[1000px]"
                  : "max-h-[4.5rem] md:max-h-[5.5rem] lg:max-h-[7rem]"
              }`}
            >
              <p
                className={`text-white/80 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed drop-shadow-md ${!isOverviewExpanded && !isOverviewAnimating ? "line-clamp-4" : ""}`}
              >
                {show.overview}
              </p>
            </div>
            {show.overview && show.overview.length > 200 && (
              <button
                onClick={toggleOverview}
                className="text-white/60 hover:text-white text-sm font-bold mt-2 transition-colors"
              >
                {isOverviewExpanded ? "Less" : "More..."}
              </button>
            )}
          </div>

          {/* Action Buttons - Responsive */}
          <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-5">
            <button
              onClick={handleWatchFirstEpisode}
              className="bg-white text-black px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl hover:-translate-y-1 touch-target"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="hidden xs:inline">
                {show.format === "MOVIE" ? "Play" : `Play S${selectedSeason} E1`}
              </span>
              <span className="xs:hidden">Play</span>
            </button>

            {isSignedIn && (
              <button
                onClick={toggleWatchlist}
                disabled={watchlistLoading}
                className="bg-black/40 hover:bg-black/60 border border-white/20 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 flex items-center justify-center space-x-2 backdrop-blur-md shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 touch-target"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill={isInWatchlist ? "#E50914" : "none"}
                  stroke={isInWatchlist ? "#E50914" : "currentColor"}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {isInWatchlist ? "Remove from List" : "Add to My List"}
                </span>
                <span className="sm:hidden">
                  {isInWatchlist ? "Remove" : "Add"}
                </span>
              </button>
            )}

            {show.trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${show.trailer}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/40 hover:bg-black/60 border border-white/20 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 flex items-center justify-center space-x-2 backdrop-blur-md shadow-lg hover:-translate-y-1 touch-target"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                </svg>
                <span>Trailer</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Content Section - Responsive */}
      <div className="container-custom py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {/* Overview for Mobile */}
            <div className="sm:hidden mb-6">
              <h2 className="text-gray-900 dark:text-white text-lg font-bold mb-2 transition-colors">
                Overview
              </h2>
              <div
                className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${
                  isOverviewExpanded ? "max-h-[1000px]" : "max-h-[4.5rem]"
                }`}
              >
                <p
                  className={`text-gray-700 dark:text-gray-300 text-sm leading-relaxed transition-colors ${!isOverviewExpanded && !isOverviewAnimating ? "line-clamp-4" : ""}`}
                >
                  {show.overview}
                </p>
              </div>
              {show.overview && show.overview.length > 150 && (
                <button
                  onClick={toggleOverview}
                  className="text-[#E50914] hover:text-red-700 text-sm font-bold mt-2 transition-colors"
                >
                  {isOverviewExpanded ? "Less" : "More..."}
                </button>
              )}
            </div>

            {/* Episodes Section - Responsive */}
            {show.format !== "MOVIE" && (
              <div className="mb-8 p-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-gray-900 dark:text-white text-xl md:text-2xl font-bold tracking-tight">
                    Episodes
                  </h2>
                </div>

                {/* Season Selection Pills */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 sm:gap-3 mb-6 pb-2 border-b border-gray-200 dark:border-gray-800">
                  {show.seasonsData?.filter(s => s.season_number > 0).map((seasonData, i) => {
                    const seasonNum = seasonData.season_number;
                    const isActive = (selectedSeason || show?.currentSeason || 1) === seasonNum;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedSeason(seasonNum)}
                        className={`whitespace-nowrap pb-3 px-1 text-sm sm:text-base font-semibold transition-all relative ${
                          isActive
                            ? "text-[#E50914] dark:text-[#E50914]"
                            : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                      >
                        {seasonData.name || `Season ${seasonNum}`}
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-t-lg" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Episodes Minimalist Grid */}
                {(() => {
                  const targetSeason = show.seasonsData?.find(
                    (s) => s.season_number === selectedSeason,
                  );
                  const totalEpCount = isAnimeMode
                    ? show.episodes || 1
                    : targetSeason?.episode_count || 1;
                  const epCount = Math.min(totalEpCount, episodeLimit);

                  return (
                    <div className="w-full">
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                        {[...Array(epCount)].map((_, i) => {
                          const epNum = i + 1;
                          return (
                            <button
                              key={i}
                              onClick={() =>
                                navigate(
                                  `/watch?id=${show.tmdbId}&type=${isAnimeMode ? "anime" : "tv"}&season=${selectedSeason}&episode=${epNum}`,
                                )
                              }
                              className="relative flex items-center justify-center bg-white dark:bg-[#141414] hover:bg-gray-50 dark:hover:bg-[#1f1f1f] text-gray-900 dark:text-white p-3 sm:p-4 rounded-xl transition-all duration-300 group border border-gray-100 dark:border-[#262626] hover:border-gray-300 dark:hover:border-gray-500 shadow-sm hover:shadow-md overflow-hidden min-h-[60px]"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E50914] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              
                              <span className="absolute left-3 sm:left-4 text-2xl font-black text-gray-200 dark:text-[#2a2a2a] group-hover:text-gray-300 dark:group-hover:text-[#3a3a3a] transition-colors w-6 sm:w-8 text-center z-10">
                                {epNum}
                              </span>

                              <div className="flex flex-col items-center justify-center z-10 w-full px-8 sm:px-12">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-[#E50914] transition-colors leading-tight whitespace-nowrap text-center">
                                  Episode {epNum}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 text-center">
                                  Season {selectedSeason}
                                </span>
                              </div>

                              <div className="absolute right-2 sm:right-4 hidden xs:flex w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-[#2a2a2a] items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform scale-90 sm:scale-75 group-hover:scale-100 z-10 text-gray-400 group-hover:text-[#E50914] shadow-sm">
                                <svg
                                  className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5 fill-current"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {episodeLimit < totalEpCount && (
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={() => setEpisodeLimit((prev) => prev + 33)}
                            className="bg-gray-100 hover:bg-gray-200 dark:bg-[#1a1a1a] dark:hover:bg-[#262626] text-gray-800 dark:text-gray-300 font-semibold py-2.5 px-6 rounded-full transition-all duration-300 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm"
                          >
                            Load More Episodes
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Cast / Characters - Responsive */}
            {show.cast && show.cast.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                  {isAnimeMode ? "Characters" : "Cast"}
                </h3>
                <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-4">
                  {show.cast.map((member, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center text-center group"
                    >
                      <div className="w-full aspect-square rounded-full overflow-hidden bg-gray-700 mb-2 ring-2 ring-transparent group-hover:ring-netflix-red transition-all">
                        {member.profile_path ? (
                          <img
                            src={
                              member.profile_path.startsWith("http")
                                ? member.profile_path
                                : `${TMDB_IMAGE_BASE}${member.profile_path}`
                            }
                            alt={member.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
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

            {/* Related Content / Seasons (Otaku only) - Full Width with ContentRow UI but original sizes */}
            {show.related && show.related.length > 0 && isAnimeMode && (
              <div className="lg:w-[calc(150%+1.5rem)] xl:w-[calc(150%+2.5rem)] relative z-10">
                <ContentRow title="Related Content / Seasons">
                  {show.related.map((item, index) => (
                    <div
                      key={`related-${item.tmdbId}-${index}`}
                      className="flex-shrink-0 snap-start w-[38vw] xs:w-[28vw] sm:w-[24vw] md:w-[20vw] lg:w-[15vw] xl:w-[12vw] transition-transform duration-300 ease-out"
                    >
                      <MovieCard
                        title={item.title}
                        poster={item.url}
                        rating={item.rating}
                        year={item.year}
                        mediaId={item.tmdbId}
                        tmdbId={item.tmdbId}
                        type="anime"
                        format={item.format}
                      />
                      <p className="text-center text-xs mt-1.5 text-[#E50914] font-bold uppercase tracking-wider">
                        {item.relationType}
                      </p>
                    </div>
                  ))}
                </ContentRow>
              </div>
            )}

            {/* Creator - Responsive */}
            {show.creator && (
              <div className="mb-6 sm:mb-8 mt-6">
                <h3 className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                  Creator
                </h3>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 ring-2 ring-gray-600">
                    {show.creator.profile_path ? (
                      <img
                        src={
                          show.creator.profile_path.startsWith("http")
                            ? show.creator.profile_path
                            : `${TMDB_IMAGE_BASE}${show.creator.profile_path}`
                        }
                        alt={show.creator.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm sm:text-base font-medium">
                    {show.creator.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Responsive */}
          <div className="order-1 lg:order-2">
            {show.url && (
              <div className="mb-4 sm:mb-6">
                <img
                  src={show.url}
                  alt={show.title}
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
                {show.year && (
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">First Aired</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">{show.year}</span>
                  </div>
                )}
                {show.seasons && (
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-sm font-medium">Seasons</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">{show.seasons}</span>
                  </div>
                )}
                {show.episodes && (
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                      <span className="text-sm font-medium">Total Episodes</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">{show.episodes}</span>
                  </div>
                )}
                {show.rating && (
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium">Rating</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">{show.rating}/10</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations - Full Width, Anime Only */}
        {isAnimeMode &&
          show.recommendations &&
          show.recommendations.length > 0 && (
            <ContentRow title="Recommended For You">
              {show.recommendations.map((rec) => (
                <ContentRowItem key={rec.tmdbId}>
                  <MovieCard
                    title={rec.title}
                    poster={rec.url}
                    rating={rec.rating}
                    year={rec.year}
                    tmdbId={rec.tmdbId}
                    type="anime"
                    format={rec.format}
                  />
                </ContentRowItem>
              ))}
            </ContentRow>
          )}
      </div>
    </div>
  );
}

export default TVDetails;

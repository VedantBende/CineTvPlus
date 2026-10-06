import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Cache TTL: 15 minutes (in ms). Data older than this will be re-fetched.
export const CACHE_TTL = 15 * 60 * 1000;

const useMediaStore = create(
  persist(
    (set) => ({
      // Current media data (runtime only)
      currentMedia: null,
      isLoading: false,
      error: null,

      // Search results (temporary)
      searchResults: [],
      
      // Trending content (session only)
      trendingMovies: [],
      trendingTVShows: [],

      // ──────────────────────────────────────────
      // STANDARD MODE CACHE
      // ──────────────────────────────────────────
      homeData: null,
      homeFetchedAt: null,
      moviesData: null,
      moviesFetchedAt: null,
      tvData: null,
      tvFetchedAt: null,

      // ──────────────────────────────────────────
      // ANIME MODE CACHE
      // ──────────────────────────────────────────
      homeDataAnime: null,
      homeFetchedAtAnime: null,
      moviesDataAnime: null,
      moviesFetchedAtAnime: null,
      tvDataAnime: null,
      tvFetchedAtAnime: null,

      // ──────────────────────────────────────────
      // PROVIDER PAGE cache (keyed by "providerId_mediaType")
      // ──────────────────────────────────────────
      providerCache: {},       // { [key]: { heroMovies, gridContent } }
      providerCacheFetchedAt: {}, // { [key]: timestamp }

      // ──────────────────────────────────────────
      // LIVETV CACHE
      // ──────────────────────────────────────────
      liveTvData: null,
      liveTvFetchedAt: null,

      // Actions
      setCurrentMedia: (media) => set({ currentMedia: media, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      setSearchResults: (results) => set({ searchResults: results }),
      setTrendingMovies: (movies) => set({ trendingMovies: movies }),
      setTrendingTVShows: (shows) => set({ trendingTVShows: shows }),
      clearCurrentMedia: () => set({ currentMedia: null, error: null }),
      clearSearch: () => set({ searchResults: [] }),

      // Cache setters
      setHomeData: (data, isAnime = false) => set(isAnime 
        ? { homeDataAnime: data, homeFetchedAtAnime: Date.now() }
        : { homeData: data, homeFetchedAt: Date.now() }
      ),
      setMoviesData: (data, isAnime = false) => set(isAnime
        ? { moviesDataAnime: data, moviesFetchedAtAnime: Date.now() }
        : { moviesData: data, moviesFetchedAt: Date.now() }
      ),
      setTvData: (data, isAnime = false) => set(isAnime
        ? { tvDataAnime: data, tvFetchedAtAnime: Date.now() }
        : { tvData: data, tvFetchedAt: Date.now() }
      ),
      setProviderData: (key, data) => set((state) => ({
        providerCache: { ...state.providerCache, [key]: data },
        providerCacheFetchedAt: { ...state.providerCacheFetchedAt, [key]: Date.now() },
      })),
      setLiveTvData: (data) => set({ liveTvData: data, liveTvFetchedAt: Date.now() }),
      
      clearAll: () => set({
        currentMedia: null,
        isLoading: false,
        error: null,
        searchResults: [],
        trendingMovies: [],
        trendingTVShows: [],
        homeData: null,
        homeFetchedAt: null,
        moviesData: null,
        moviesFetchedAt: null,
        tvData: null,
        tvFetchedAt: null,
        homeDataAnime: null,
        homeFetchedAtAnime: null,
        moviesDataAnime: null,
        moviesFetchedAtAnime: null,
        tvDataAnime: null,
        tvFetchedAtAnime: null,
        providerCache: {},
        providerCacheFetchedAt: {},
        liveTvData: null,
        liveTvFetchedAt: null,
      })
    }),
    {
      name: 'cinetv-media-cache-v5', // unique name
      storage: createJSONStorage(() => localStorage),
      // Only persist the cache fields, not the runtime/session state (like currentMedia or searchResults)
      partialize: (state) => ({
        homeData: state.homeData,
        homeFetchedAt: state.homeFetchedAt,
        moviesData: state.moviesData,
        moviesFetchedAt: state.moviesFetchedAt,
        tvData: state.tvData,
        tvFetchedAt: state.tvFetchedAt,
        homeDataAnime: state.homeDataAnime,
        homeFetchedAtAnime: state.homeFetchedAtAnime,
        moviesDataAnime: state.moviesDataAnime,
        moviesFetchedAtAnime: state.moviesFetchedAtAnime,
        tvDataAnime: state.tvDataAnime,
        tvFetchedAtAnime: state.tvFetchedAtAnime,
        providerCache: state.providerCache,
        providerCacheFetchedAt: state.providerCacheFetchedAt,
        liveTvData: state.liveTvData,
        liveTvFetchedAt: state.liveTvFetchedAt
      }),
    }
  )
);

export default useMediaStore;

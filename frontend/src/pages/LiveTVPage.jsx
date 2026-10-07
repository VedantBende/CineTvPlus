import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { liveTvApi } from '../utils/liveTvApi';
import { useTheme } from '../context/ThemeContext';
import { Navigate, useNavigate } from 'react-router-dom';
import PageSkeleton from '../components/ui/PageSkeleton';
import useMediaStore, { CACHE_TTL } from '../store/mediaStore';

const generateFakeMetadata = (channelId) => {
  const str = String(channelId || 'default');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; 
  }
  const absHash = Math.abs(hash);
  const shows = ['Live News Broadcast', 'Action Movie: The Reckoning', 'Sports Live: Finals', 'Morning Show', 'Evening Debate', 'Wildlife Documentary', 'Sitcom Marathon', 'Late Night Talk Show'];
  return {
    currentShow: shows[absHash % shows.length],
    isHD: absHash % 3 !== 0
  };
};

const prioritizeShuffle = (channelsList) => {
  return [...channelsList].map(channel => {
    const text = `${channel.name} ${channel.category}`.toLowerCase();
    const isPriority = text.includes('english') || text.includes('hindi');
    
    // Base score between 0-100
    let score = Math.random() * 100;
    
    // Priority items score 100-200
    if (isPriority) {
      score += 100; 
    } else if (Math.random() < 0.10) { 
      // Non-priority items have a 10% chance to mix into the top tier
      score += 100;
    }
    
    return { channel, score };
  })
  .sort((a, b) => b.score - a.score)
  .map(item => item.channel);
};

function LiveTVPage() {
  const { isAnimeMode } = useTheme();
  const navigate = useNavigate();
  
  const { liveTvData, liveTvFetchedAt, setLiveTvData } = useMediaStore();

  const [channels, setChannels] = useState(() => {
    // Only use cached data if it exists AND has not expired
    if (liveTvData && liveTvData.length > 0 && liveTvFetchedAt && (Date.now() - liveTvFetchedAt < CACHE_TTL)) {
      // Weighted shuffle cached data on page visit
      return prioritizeShuffle(liveTvData);
    }
    return [];
  });
  
  const [loading, setLoading] = useState(() => {
    // If we have valid unexpired cache, we don't need to load. Otherwise we do.
    return !(liveTvData && liveTvData.length > 0 && liveTvFetchedAt && (Date.now() - liveTvFetchedAt < CACHE_TTL));
  });
  const [error, setError] = useState(null);
  
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return sessionStorage.getItem('livetv_category') || 'All';
  });

  useEffect(() => {
    sessionStorage.setItem('livetv_category', selectedCategory);
  }, [selectedCategory]);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(50);
  const observer = useRef();
  const selectedCategoryRef = useRef(null);

  const [categories, setCategories] = useState(() => {
    if (liveTvData) {
      return ['All', ...new Set(liveTvData.map(c => c.category).filter(Boolean))].sort();
    }
    return ['All'];
  });

  useEffect(() => {
    if (selectedCategoryRef.current) {
      // Small timeout ensures the DOM has fully painted the pills before calculating scroll
      setTimeout(() => {
        selectedCategoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }, 50);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const isCacheFresh = liveTvData && liveTvFetchedAt && (Date.now() - liveTvFetchedAt < CACHE_TTL) && liveTvData.length > 0;
    
    if (isCacheFresh) {
      setLoading(false);
      return;
    }

    const fetchChannels = async () => {
      try {
        setLoading(true);
        const data = await liveTvApi.getChannels();
        const channelList = Array.isArray(data) ? data : (data.channels || data.data || []);
        
        // Weighted Randomize the fetched list
        const shuffledList = prioritizeShuffle(channelList);
        
        setChannels(shuffledList);
        setLiveTvData(shuffledList);
        
        const uniqueCategories = ['All', ...new Set(channelList.map(c => c.category).filter(Boolean))].sort();
        setCategories(uniqueCategories);
        
      } catch (err) {
        console.error("LiveTV Fetch Error:", err);
        setError('Failed to load Live TV channels. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [liveTvData, liveTvFetchedAt, setLiveTvData]);

  useEffect(() => {
    setDisplayCount(50);
  }, [selectedCategory, searchQuery]);

  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      const matchesCategory = selectedCategory === 'All' || channel.category === selectedCategory;
      const matchesSearch = !searchQuery || channel.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [channels, selectedCategory, searchQuery]);

  const displayedChannels = filteredChannels.slice(0, displayCount);

  const lastElementRef = useCallback(node => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && displayCount < filteredChannels.length) {
        setDisplayCount(prev => prev + 50);
      }
    });
    if (node) observer.current.observe(node);
  }, [displayCount, filteredChannels.length]);

  if (isAnimeMode) {
    return <Navigate to="/" replace />;
  }

  if (loading && channels.length === 0) {
    return <PageSkeleton type="livetv" />;
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 max-w-md w-full backdrop-blur-sm">
          <svg className="w-16 h-16 text-zinc-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-3">Maintenance Mode</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Live TV is currently undergoing scheduled maintenance. Please check back later.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white text-black rounded-lg font-bold hover:bg-zinc-200 transition-colors shadow-lg hover:shadow-white/20"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-white mb-4">No Channels Available</h2>
        <p className="text-zinc-400">Please check back later.</p>
      </div>
    );
  }

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Live TV</h1>
      </div>
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-zinc-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border-0 rounded-lg leading-5 bg-zinc-900/60 text-white placeholder-zinc-500 ring-1 ring-inset ring-zinc-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-netflix-red sm:text-sm transition-shadow shadow-sm"
          />
        </div>
      </div>
    </div>
  );

  const renderCategoryPills = () => (
    <div 
      className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2 -mx-4 pb-4 mb-2 [&::-webkit-scrollbar]:hidden" 
      style={{ 
        scrollbarWidth: 'none', 
        msOverflowStyle: 'none', 
        WebkitOverflowScrolling: 'touch',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
        maskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)'
      }}
    >
      {categories.map(cat => (
        <button
          key={cat}
          ref={selectedCategory === cat ? selectedCategoryRef : null}
          onClick={() => setSelectedCategory(cat)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
            selectedCategory === cat 
              ? 'bg-white text-black border-white shadow-md' 
              : 'bg-zinc-900/50 text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  return (
    <div className="container-custom pt-24 pb-12 min-h-screen">
      {renderHeader()}
      {renderCategoryPills()}
      
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 xs:gap-3 sm:gap-4 md:gap-5 auto-rows-[120px] xs:auto-rows-[140px] sm:auto-rows-[160px] md:auto-rows-[200px]">
        {displayedChannels.map((channel, index) => {
          const isFeatured = index === 0 && selectedCategory === 'All' && !searchQuery; // First item is featured 2x2
          const meta = generateFakeMetadata(channel.id);
          
          return (
            <div 
              key={channel.id}
              ref={index === displayedChannels.length - 1 ? lastElementRef : null}
              onClick={() => {
                navigate(`/live-tv/watch/${channel.id}`, { state: { channel } });
              }}
              className={`relative cursor-pointer group rounded-xl overflow-hidden transition-all duration-300 transform border border-zinc-800/80 hover:border-zinc-500 hover:scale-[1.02] hover:z-10 bg-[#101319] shadow-md flex flex-col justify-end ${
                isFeatured ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'
              }`}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#2a1617] via-[#160c0d] to-[#0a0505] shadow-[inset_0_0_50px_rgba(0,0,0,0.6)] p-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.15)_0%,transparent_70%)]"></div>
                {channel.logo || channel.image ? (
                  <img 
                    src={channel.logo || channel.image} 
                    alt={channel.name} 
                    className="relative max-w-[85%] max-h-[85%] object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] opacity-100 group-hover:scale-110 transition-all duration-500 transform-gpu will-change-transform [image-rendering:-webkit-optimize-contrast]"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span className="relative text-zinc-600 font-bold text-2xl group-hover:text-zinc-400 transition-colors duration-500">{channel.name?.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              
              {/* Gradient Overlay for Text */}
              <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none"></div>
              
              {/* Content */}
              <div className="relative p-1.5 xs:p-2 sm:p-3 md:p-4 z-10 w-full group-hover:opacity-0 transition-opacity duration-500">
                <div className="flex items-center justify-between mb-1 xs:mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-black/50 backdrop-blur-md px-1.5 py-0.5 xs:px-2 xs:py-1 rounded-md border border-white/10">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                    <span className="text-[8px] xs:text-[9px] sm:text-[10px] uppercase font-bold text-white tracking-wider">Live</span>
                  </div>
                  {meta.isHD && (
                    <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-zinc-400 border border-zinc-700 px-0.5 xs:px-1 rounded">HD</span>
                  )}
                </div>
                
                <h3 className={`font-bold text-white truncate drop-shadow-md ${isFeatured ? 'text-sm xs:text-base sm:text-xl md:text-2xl mb-0.5' : 'text-[10px] xs:text-xs sm:text-sm md:text-base mb-0'}`}>
                  {channel.name}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LiveTVPage;

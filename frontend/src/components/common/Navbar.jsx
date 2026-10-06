import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';
import ThemeToggle from './ThemeToggle';
import AnimeToggle from './AnimeToggle';
import InstallPWA from '../pwa/InstallPWA';
import { useTheme } from '../../context/ThemeContext';

function Navbar() {
  const { isAnimeMode } = useTheme();
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if a path is the active route
  const isActive = (path) => {
    if (location.state?.hideNavHighlight && path !== '/') return false;
    
    // If it's an anime movie that was forced to the /tv route, keep "Movies" highlighted
    if (location.state?.isAnimeMovie) {
      if (path === '/movies') return true;
      if (path === '/tv') return false;
    }

    if (path === '/') return location.pathname === '/';
    if (path === '/movies') return location.pathname.startsWith('/movie');
    return location.pathname.startsWith(path);
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-white dark:from-netflix-black to-transparent transition">
      <div className="container-custom relative">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 relative">
          {/* Logo - Left */}
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0 lg:w-1/4" onClick={closeMobileMenu}>
            <img
              src="/CineLogo.svg"
              alt="CineTv+ Logo"
              className="h-6 w-auto sm:h-7 md:h-8"
            />
            <span className="text-gray-900 dark:text-white text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              {isAnimeMode ? 'AniTv+' : 'CineTv+'}
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center justify-center space-x-4 lg:space-x-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link to="/" className={`transition flex items-center space-x-1.5 text-sm lg:text-base font-medium ${isActive('/') ? 'text-netflix-red' : 'text-gray-500 dark:text-gray-400 hover:text-netflix-red dark:hover:text-white'}`}>
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span>Home</span>
            </Link>
            <Link to="/movies" className={`transition flex items-center space-x-1.5 text-sm lg:text-base font-medium ${isActive('/movies') ? 'text-netflix-red' : 'text-gray-500 dark:text-gray-400 hover:text-netflix-red dark:hover:text-white'}`}>
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
              <span>Movies</span>
            </Link>
            <Link to="/tv" className={`transition flex items-center space-x-1.5 text-sm lg:text-base font-medium ${isActive('/tv') ? 'text-netflix-red' : 'text-gray-500 dark:text-gray-400 hover:text-netflix-red dark:hover:text-white'}`}>
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span>TV Shows</span>
            </Link>
            {!isAnimeMode && (
              <Link to="/live-tv" className={`transition flex items-center space-x-1.5 text-sm lg:text-base font-medium ${isActive('/live-tv') ? 'text-netflix-red' : 'text-gray-500 dark:text-gray-400 hover:text-netflix-red dark:hover:text-white'}`}>
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M12 15a3 3 0 100-6 3 3 0 000 6z" /></svg>
                <span>Live TV</span>
              </Link>
            )}
            {isSignedIn && (
              <Link to="/favorites" className={`transition flex items-center space-x-1.5 text-sm lg:text-base font-medium ${isActive('/favorites') ? 'text-netflix-red' : 'text-gray-500 dark:text-gray-400 hover:text-netflix-red dark:hover:text-white'}`}>
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                <span>My List</span>
              </Link>
            )}
          </div>

          {/* Right Side - Responsive */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 md:gap-3 flex-1">
            <div className={`transition-all duration-300 shrink-0 ${isSearchOpen ? 'w-0 opacity-0 hidden sm:block sm:w-0 m-0 p-0 overflow-hidden' : 'w-auto opacity-100'}`}>
              <InstallPWA />
            </div>
            {/* Anime Toggle - Visible on mobile */}
            <div className={`transition-all duration-300 shrink-0 ${isSearchOpen ? 'w-0 opacity-0 hidden sm:block sm:w-0 m-0 p-0 overflow-hidden' : 'w-auto opacity-100'}`}>
              <AnimeToggle />
            </div>
            {/* Theme Toggle - Hidden on small mobile and when search is open */}
            <div className={`transition-all duration-300 shrink-0 ${isSearchOpen ? 'w-0 opacity-0 hidden m-0 p-0 overflow-hidden' : 'hidden xs:flex items-center w-auto opacity-100'}`}>
              <ThemeToggle />
            </div>

            {/* Search - Responsive */}
            <div className={`relative flex items-center justify-end h-10 transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-[200px] xs:w-[240px] sm:w-[280px] md:w-[300px] mr-2' : 'w-10'}`}>
              <form 
                onSubmit={handleSearch} 
                className={`flex items-center overflow-hidden transition-all duration-300 ${
                  isSearchOpen ? 'w-full opacity-100' : 'w-0 opacity-0'
                }`}
              >
                <input
                  id="global-search-input"
                  name="searchQuery"
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-gray-100 dark:bg-gray-800 bg-opacity-90 text-gray-900 dark:text-white px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-l border border-gray-300 dark:border-0 focus:outline-none focus:ring-5 focus:ring-netflix-red w-32 min-w-40 sm:w-48 md:w-64 flex-1 text-sm backdrop-blur-sm"
                  tabIndex={isSearchOpen ? 0 : -1}
                />
                <button
                  type="submit"
                  className="bg-netflix-red text-white px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-3 md:py-2 rounded-r hover:bg-red-700 transition flex items-center justify-center touch-target shrink-0"
                  tabIndex={isSearchOpen ? 0 : -1}
                  aria-label="Submit search"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="hidden md:flex ml-1 sm:ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white items-center justify-center touch-target p-1 shrink-0"
                  tabIndex={isSearchOpen ? 0 : -1}
                  aria-label="Close search"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </form>

              <button
                onClick={() => {
                  setIsSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 150);
                }}
                className={`absolute right-0 text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition w-10 h-10 flex items-center justify-center touch-target ${
                  isSearchOpen ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'
                }`}
                aria-label="Search"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* User Section - Responsive */}
            {isSignedIn ? (
              <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
                <button 
                  onClick={() => {
                    const isSettingsOpen = location.pathname.includes('/settings');
                    if (isSettingsOpen) {
                      window.dispatchEvent(new Event('trigger-settings-close'));
                    } else {
                      navigate('/settings' + location.search);
                    }
                  }}
                  className={`transition p-2 flex items-center justify-center touch-target rounded-full ${
                    location.pathname.includes('/settings')
                      ? 'text-[#E50914] bg-red-100 dark:bg-red-900/20 shadow-inner'
                      : 'text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  aria-label="Settings"
                >
                  <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <div className="flex items-center">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="hidden md:block bg-netflix-red hover:bg-red-700 text-white px-3 py-1.5 lg:px-4 lg:py-2 rounded transition font-medium text-sm lg:text-base shrink-0 whitespace-nowrap"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu / Search Close Toggle */}
            <button
              onClick={() => {
                if (isSearchOpen) {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                } else {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }
              }}
              className="md:hidden text-gray-900 dark:text-white p-1.5 sm:p-2 flex items-center justify-center touch-target relative w-10 h-10 overflow-hidden"
              aria-label={isSearchOpen ? "Close search" : (isMobileMenuOpen ? "Close menu" : "Toggle menu")}
            >
              <div className="relative w-6 h-6">
                {/* Burger Icon (☰) - Visible when nothing is open */}
                <div className={`absolute inset-0 transition-all duration-300 transform ${ (isMobileMenuOpen || isSearchOpen) ? 'opacity-0 scale-90 rotate-90' : 'opacity-100 scale-100 rotate-0' }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                
                {/* Close Icon (✕) - Visible when mobile menu OR search is open */}
                <div className={`absolute inset-0 transition-all duration-300 transform ${ (isMobileMenuOpen || isSearchOpen) ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-90 -rotate-90' }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu - Enhanced */}
        <div 
          className={`md:hidden bg-white dark:bg-black bg-opacity-98 backdrop-blur-md overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen 
              ? 'max-h-screen opacity-100 border-t border-gray-200 dark:border-gray-800 pointer-events-auto visible' 
              : 'max-h-0 opacity-0 border-t-0 pointer-events-none invisible'
          }`}
        >
          <div className="py-2 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
              <Link 
                to="/" 
                className={`block py-3 px-4 transition text-base font-medium touch-target border-l-2 ${isActive('/') ? 'text-netflix-red bg-netflix-red/10 border-netflix-red' : 'text-gray-900 dark:text-white hover:text-netflix-red dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'}`} 
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link 
                to="/movies" 
                className={`block py-3 px-4 transition text-base font-medium touch-target border-l-2 ${isActive('/movies') ? 'text-netflix-red bg-netflix-red/10 border-netflix-red' : 'text-gray-900 dark:text-white hover:text-netflix-red dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'}`} 
                onClick={closeMobileMenu}
              >
                Movies
              </Link>
              <Link 
                to="/tv" 
                className={`block py-3 px-4 transition text-base font-medium touch-target border-l-2 ${isActive('/tv') ? 'text-netflix-red bg-netflix-red/10 border-netflix-red' : 'text-gray-900 dark:text-white hover:text-netflix-red dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'}`} 
                onClick={closeMobileMenu}
              >
                TV Shows
              </Link>
              {!isAnimeMode && (
                <Link 
                  to="/live-tv" 
                  className={`block py-3 px-4 transition text-base font-medium touch-target border-l-2 ${isActive('/live-tv') ? 'text-netflix-red bg-netflix-red/10 border-netflix-red' : 'text-gray-900 dark:text-white hover:text-netflix-red dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'}`} 
                  onClick={closeMobileMenu}
                >
                  Live TV
                </Link>
              )}
              {isSignedIn ? (
                <>
                  <Link 
                    to="/favorites" 
                    className={`block py-3 px-4 transition text-base font-medium touch-target border-l-2 ${isActive('/favorites') ? 'text-netflix-red bg-netflix-red/10 border-netflix-red' : 'text-gray-900 dark:text-white hover:text-netflix-red dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'}`} 
                    onClick={closeMobileMenu}
                  >
                    My List
                  </Link>
                  <button 
                    onClick={() => {
                      const isSettingsOpen = location.pathname.includes('/settings');
                      if (isSettingsOpen) {
                        window.dispatchEvent(new Event('trigger-settings-close'));
                      } else {
                        navigate('/settings' + location.search);
                      }
                      closeMobileMenu();
                    }}
                    className={`w-full text-left block py-3 px-4 transition text-base font-medium touch-target border-l-2 ${isActive('/settings') ? 'text-[#E50914] bg-red-100 dark:bg-red-900/10 border-[#E50914]' : 'text-gray-900 dark:text-white hover:text-netflix-red dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'}`} 
                  >
                    Settings
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-800 my-2"></div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Account</span>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-800 my-2"></div>
                  <button
                    onClick={() => {
                      navigate('/login');
                      closeMobileMenu();
                    }}
                    className="w-full bg-netflix-red hover:bg-red-700 text-white px-4 py-3 mx-4 my-2 rounded transition font-medium text-base"
                    style={{ width: 'calc(100% - 2rem)' }}
                  >
                    Sign In
                  </button>
                </>
              )}
              
              {/* Theme Toggle in Mobile Menu */}
              <div className="xs:hidden border-t border-gray-200 dark:border-gray-800 mt-2 pt-2 px-4 pb-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Theme</span>
                  <ThemeToggle />
                </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
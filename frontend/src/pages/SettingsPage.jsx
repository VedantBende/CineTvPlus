import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState, useRef } from 'react';
import { clearHistory } from '../utils/continueWatchingStore';
import { deleteUserDB } from '../utils/api';
import useMediaStore from '../store/mediaStore';

function SettingsPage() {
  const { user, isSignedIn } = useUser();
  const { getToken, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { clearAll } = useMediaStore();

  const [isExiting, setIsExiting] = useState(false);

  // Modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const handleSettingsClose = () => {
      setIsExiting(true);
      setTimeout(() => {
        navigate(-1);
      }, 250);
    };

    window.addEventListener('trigger-settings-close', handleSettingsClose);
    return () => window.removeEventListener('trigger-settings-close', handleSettingsClose);
  }, [navigate]);

  const handleBackToHomeClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate('/');
    }, 250);
  };

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/login');
    }
  }, [isSignedIn, navigate]);



  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      await clearHistory(getToken);
      setShowHistoryModal(false);
      // Optional: you could trigger a re-fetch of the continue watching row here
      // But since it's on the home page, it will just re-fetch when they navigate back
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('Failed to clear history. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    setIsDeleting(true);
    try {
      // Deletes from MongoDB AND Clerk on the backend via clerkClient
      await deleteUserDB(getToken); 
      
      // Sign the user out locally since their account no longer exists
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert(`Failed to delete account: ${error.message || 'Unknown error'}`);
      setIsDeleting(false);
    }
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className={`min-h-screen pt-14 sm:pt-16 md:pt-20 bg-white dark:bg-netflix-black transition-colors duration-300 relative`}>
      <div className={`container-custom py-6 sm:py-8 md:py-10 lg:py-12 max-w-4xl ${isExiting ? 'opacity-0 translate-y-8 transition-all duration-300 ease-in' : 'animate-slide-up'}`}>
        
        {/* Page Title */}
        <h1 className="text-gray-900 dark:text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 transition-colors">
          Settings
        </h1>

        {/* Account Info */}
        <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-[#262626] rounded-xl p-5 sm:p-6 mb-5 sm:mb-6 shadow-sm transition-colors">
          <h2 className="text-gray-900 dark:text-white text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#E50914]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Account
          </h2>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-[#262626]">
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Email</span>
              </div>
              <span className="text-gray-900 dark:text-white font-semibold text-sm break-all">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Member since</span>
              </div>
              <span className="text-gray-900 dark:text-white font-semibold text-sm">{new Date(user?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-[#262626] rounded-xl p-5 sm:p-6 mb-5 sm:mb-6 shadow-sm transition-colors">
          <h2 className="text-gray-900 dark:text-white text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#E50914]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            Appearance
          </h2>
          
          <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Theme</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
                Choose your preferred theme
              </p>
            </div>
            <div className="flex p-1 bg-gray-100 dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
              <button
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                  theme === 'light'
                    ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => theme === 'light' && toggleTheme()}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-[#E50914] text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Data Management */}
        <div className="bg-white dark:bg-[#141414] border border-red-500/20 rounded-xl p-5 sm:p-6 shadow-sm transition-colors">
          <h2 className="text-red-500 dark:text-[#E50914] text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Privacy & Data
          </h2>
          
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-[#262626]">
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Clear Watch History</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
                  Reset your "Continue Watching" progress permanently.
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-[#1f1f1f] dark:hover:bg-[#2a2a2a] text-gray-900 dark:text-white border border-gray-200 dark:border-[#2a2a2a] px-5 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
              >
                Clear History
              </button>
            </div>

            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-[#E50914] font-semibold text-sm">Delete Account</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-50 hover:bg-red-100 dark:bg-[#E50914]/10 dark:hover:bg-[#E50914]/20 text-[#E50914] border border-red-200 dark:border-[#E50914]/30 px-5 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleBackToHomeClick}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>

      {/* MODALS */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-netflix-gray rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Clear Watch History?</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Are you sure you want to clear all your watch history? This action cannot be undone and your "Continue Watching" list will be emptied.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition"
                disabled={isClearing}
              >
                Cancel
              </button>
              <button 
                onClick={handleClearHistory}
                className="px-4 py-2 rounded bg-netflix-red text-white hover:bg-red-700 font-medium transition flex items-center justify-center min-w-[80px]"
                disabled={isClearing}
              >
                {isClearing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Clear'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-netflix-gray rounded-xl p-6 max-w-sm w-full shadow-2xl border border-red-500/30">
            <h3 className="text-xl font-bold text-red-500 mb-2">Delete Account</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              This action is permanent and cannot be reversed. All your data, favorites, and history will be wiped.
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
              Please type <strong className="text-gray-900 dark:text-white">DELETE</strong> to confirm.
            </p>
            <input 
              type="text" 
              value={deleteConfirmation}
              onChange={(e) => {
                const val = e.target.value;
                if (/[a-z]/.test(val)) return; // Completely reject lowercase characters
                setDeleteConfirmation(val);
              }}
              placeholder="DELETE"
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 mb-6"
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                className="px-4 py-2 rounded bg-red-600 text-white font-medium transition flex items-center justify-center min-w-[80px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SettingsPage;

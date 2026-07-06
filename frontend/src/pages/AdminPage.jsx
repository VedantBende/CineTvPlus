import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import PageSkeleton from '../components/ui/PageSkeleton';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

// Relative time helper
const timeAgo = (date) => {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Access timer helper
const getAccessRemaining = (expiresAt, isPermanent) => {
  if (isPermanent) return { text: 'Permanent', type: 'permanent' };
  if (!expiresAt) return { text: '-', type: 'none' };
  
  const now = new Date();
  const expiry = new Date(expiresAt);
  
  if (expiry < now) return { text: 'Expired', type: 'expired' };
  
  const diffTime = expiry.getTime() - now.getTime();
  const totalMinutes = Math.floor(diffTime / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  
  if (totalDays > 0) {
    const remainingHours = totalHours % 24;
    return { text: `${totalDays}d ${remainingHours}h Left`, type: 'normal' };
  } else {
    const remainingMinutes = totalMinutes % 60;
    return { text: `${totalHours}h ${remainingMinutes}m Left`, type: 'warning' };
  }
};

const DURATION_OPTIONS = [
  { label: '12 Hours', value: '12h' },
  { label: '24 Hours', value: '24h' },
  { label: '3 Days', value: '3d' },
  { label: '7 Days', value: '7d' },
  { label: '15 Days', value: '15d' },
  { label: '30 Days', value: '30d' },
  { label: '3 Months', value: '3m' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
  { label: 'Permanent', value: 'permanent' }
];

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, className = "", buttonClassName = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={buttonClassName || "w-full bg-gray-50 dark:bg-zinc-800/80 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-[11px] font-medium rounded focus:ring-accent-red focus:border-accent-red flex items-center justify-between py-1 px-2 outline-none cursor-pointer transition-colors"}
      >
        <span>{selectedOption.label}</span>
        <svg className={`w-3 h-3 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[120px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${value === opt.value ? 'bg-red-50 dark:bg-red-500/10 text-accent-red font-semibold' : 'text-gray-700 dark:text-zinc-300'}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Icons
const SearchIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const CheckIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const XIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const AlertIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const UsersIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const UserCheckIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const ClockIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ShieldExclamationIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const CloseIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

export default function AdminPage() {
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const mongoUser = useAuthStore(state => state.user);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState('permanent');
  const [rowDurations, setRowDurations] = useState({});
  const [toast, setToast] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/login');
      return;
    }
    if (mongoUser) {
      if (mongoUser.role !== 'admin') {
        navigate('/');
        return;
      }
      fetchUsers();
    }
  }, [isSignedIn, mongoUser, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = useCallback(async (userId) => {
    try {
      setActivityLoading(true);
      setUserActivity(null);
      const token = await getToken();
      const res = await axios.get(`${API_URL}/admin/users/${userId}/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserActivity(res.data);
    } catch (err) {
      console.error('Failed to fetch user activity:', err);
      setUserActivity({ error: true });
    } finally {
      setActivityLoading(false);
    }
  }, [getToken]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const executeStatusChange = async () => {
    if (!confirmModal) return;
    const { userId, action } = confirmModal;
    
    try {
      setConfirmModal(null);
      const token = await getToken();
      await axios.patch(`${API_URL}/admin/users/${userId}/${action}`, {
        accessDuration: action === 'approve' || action === 'extend' ? selectedDuration : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchUsers();
      
      const successMessages = {
        approve: 'User approved successfully',
        extend: 'User access modified',
        reject: 'User request rejected',
        revoke: 'User access revoked'
      };
      const toastTypes = {
        approve: 'success',
        extend: 'success',
        reject: 'error',
        revoke: 'warning'
      };
      
      showToast(successMessages[action], toastTypes[action]);
      
      // Update selected drawer user if it's open
      if (selectedUser && selectedUser._id === userId) {
        if (action === 'extend') {
           fetchActivity(userId); // Refresh entirely
        } else {
           setSelectedUser(prev => ({ ...prev, status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revoked' }));
        }
      }
    } catch (err) {
      console.error(err);
      showToast(`Failed to ${action} user`, 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/admin/users/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('User deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedUser(null);
      setDeleteConfirmationText('');
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  };

  // Derived State
  const stats = useMemo(() => {
    return {
      total: users.length,
      approved: users.filter(u => u.status === 'approved').length,
      pending: users.filter(u => u.status === 'pending').length,
      revokedRejected: users.filter(u => ['revoked', 'rejected'].includes(u.status)).length
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             u.email.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [users, searchQuery, statusFilter]);

  if (loading && users.length === 0) return <PageSkeleton type="admin" />;
  if (error) return <div className="min-h-screen pt-20 bg-gray-50 dark:bg-netflix-black text-gray-900 dark:text-white text-center">{error}</div>;

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-netflix-black px-4 sm:px-6 lg:px-8 pb-10 font-sans selection:bg-accent-red/30 transition-colors duration-300">
      
      {/* --- TOAST NOTIFICATION --- */}
      {toast && (
        <div className={`fixed top-24 right-4 z-50 flex items-center p-4 rounded-lg shadow-2xl transition-all duration-300 animate-fade-up ${
          toast.type === 'success' ? 'bg-green-100 dark:bg-green-900/90 text-green-900 dark:text-green-100 border border-green-300 dark:border-green-500/50' :
          toast.type === 'warning' ? 'bg-orange-100 dark:bg-orange-900/90 text-orange-900 dark:text-orange-100 border border-orange-300 dark:border-orange-500/50' :
          'bg-red-100 dark:bg-red-900/90 text-red-900 dark:text-red-100 border border-red-300 dark:border-red-500/50'
        }`}>
          {toast.type === 'success' && <CheckIcon />}
          {toast.type === 'warning' && <AlertIcon />}
          {toast.type === 'error' && <XIcon />}
          <span className="ml-3 font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold border-l-4 border-accent-red pl-3 text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">Monitor network activity and manage platform access.</p>
          </div>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="relative bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-black border border-gray-200 dark:border-zinc-800 rounded-xl p-4 md:p-5 shadow-sm dark:shadow-lg flex flex-col md:flex-row justify-between md:items-center group hover:border-gray-300 dark:hover:border-zinc-700 transition-colors min-h-[100px] md:min-h-0">
            <div className="pr-10 md:pr-0 flex flex-col h-full justify-between md:justify-center flex-1">
              <p className="text-gray-500 dark:text-zinc-400 text-xs md:text-sm font-medium leading-tight md:mb-1">Total Users</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform origin-left mt-1 md:mt-0">{stats.total}</p>
            </div>
            <div className="absolute top-4 right-4 md:static p-2 md:p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg text-gray-600 dark:text-zinc-300 shrink-0"><UsersIcon /></div>
          </div>
          <div className="relative bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-green-900/20 dark:to-black border border-gray-200 dark:border-green-900/30 rounded-xl p-4 md:p-5 shadow-sm dark:shadow-lg flex flex-col md:flex-row justify-between md:items-center group hover:border-green-300 dark:hover:border-green-800/50 transition-colors min-h-[100px] md:min-h-0">
            <div className="pr-10 md:pr-0 flex flex-col h-full justify-between md:justify-center flex-1">
              <p className="text-gray-500 dark:text-green-400 text-xs md:text-sm font-medium leading-tight md:mb-1">Approved</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform origin-left mt-1 md:mt-0">{stats.approved}</p>
            </div>
            <div className="absolute top-4 right-4 md:static p-2 md:p-3 bg-gray-100 dark:bg-green-900/30 rounded-lg text-gray-600 dark:text-green-400 shrink-0"><UserCheckIcon /></div>
          </div>
          <div className="relative bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-yellow-900/20 dark:to-black border border-gray-200 dark:border-yellow-900/30 rounded-xl p-4 md:p-5 shadow-sm dark:shadow-lg flex flex-col md:flex-row justify-between md:items-center group hover:border-yellow-300 dark:hover:border-yellow-800/50 transition-colors min-h-[100px] md:min-h-0">
            <div className="pr-10 md:pr-0 flex flex-col h-full justify-between md:justify-center flex-1">
              <p className="text-gray-500 dark:text-yellow-400 text-xs md:text-sm font-medium leading-tight md:mb-1">Pending Requests</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform origin-left mt-1 md:mt-0">{stats.pending}</p>
            </div>
            <div className="absolute top-4 right-4 md:static p-2 md:p-3 bg-gray-100 dark:bg-yellow-900/30 rounded-lg text-gray-600 dark:text-yellow-400 shrink-0"><ClockIcon /></div>
          </div>
          <div className="relative bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-red-900/20 dark:to-black border border-gray-200 dark:border-red-900/30 rounded-xl p-4 md:p-5 shadow-sm dark:shadow-lg flex flex-col md:flex-row justify-between md:items-center group hover:border-red-300 dark:hover:border-red-800/50 transition-colors min-h-[100px] md:min-h-0">
            <div className="pr-10 md:pr-0 flex flex-col h-full justify-between md:justify-center flex-1">
              <p className="text-gray-500 dark:text-red-400 text-xs md:text-sm font-medium leading-tight md:mb-1">Revoked / Rejected</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform origin-left mt-1 md:mt-0">{stats.revokedRejected}</p>
            </div>
            <div className="absolute top-4 right-4 md:static p-2 md:p-3 bg-gray-100 dark:bg-red-900/30 rounded-lg text-gray-600 dark:text-red-400 shrink-0"><ShieldExclamationIcon /></div>
          </div>
        </div>

        {/* --- SEARCH & FILTERS --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-white transition-colors">
              <SearchIcon />
            </div>
            <input
              type="text"
              className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-accent-red focus:border-accent-red block pl-10 p-2.5 transition-shadow dark:shadow-inner"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-stretch gap-2 w-full md:w-auto">
            <button
              onClick={fetchUsers}
              className={`flex items-center justify-center px-3 rounded-lg bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 shadow-sm transition-all flex-shrink-0 ${loading ? 'text-accent-red' : ''}`}
              title="Refresh users list"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <div className="flex bg-gray-100 dark:bg-black/50 p-1 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-x-auto w-full md:w-auto hide-scrollbar">
              {['all', 'pending', 'approved', 'revoked', 'rejected'].map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all whitespace-nowrap ${
                  statusFilter === filter 
                    ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                {filter}
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* --- USERS TABLE --- */}
        <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-md dark:shadow-2xl dark:backdrop-blur-sm overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-gray-700 dark:text-zinc-300">
              <thead className="bg-gray-50 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-5 font-semibold">User Details</th>
                  <th className="px-6 py-5 font-semibold text-center">Role</th>
                  <th className="px-6 py-5 font-semibold text-center">Status</th>
                  <th className="px-6 py-5 font-semibold text-center">Access Duration</th>
                  <th className="px-6 py-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 text-sm">
                {filteredUsers.map((u, idx) => (
                  <tr 
                    key={u._id} 
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors animate-fade-up group cursor-pointer" 
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => { setSelectedUser(u); fetchActivity(u._id); }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-900 border border-gray-300 dark:border-zinc-700 flex items-center justify-center text-gray-700 dark:text-white font-bold shadow-inner">
                          {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="font-bold text-gray-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">{u.name || 'Anonymous User'}</div>
                          <div className="text-gray-500 dark:text-zinc-500 text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded inline-flex text-[10px] font-bold tracking-wide uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full inline-flex items-center gap-1.5 text-xs font-bold shadow-sm transition-all ${
                        u.status === 'approved' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 dark:ring-1 dark:ring-green-500/30 dark:shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 
                        u.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20 dark:ring-1 dark:ring-yellow-500/30 dark:shadow-[0_0_10px_rgba(234,179,8,0.1)] animate-pulse' : 
                        u.status === 'revoked' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 dark:ring-1 dark:ring-orange-500/30' :
                        'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 dark:ring-1 dark:ring-red-500/30'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          u.status === 'approved' ? 'bg-green-500 dark:bg-green-400' : u.status === 'pending' ? 'bg-yellow-500 dark:bg-yellow-400' : u.status === 'revoked' ? 'bg-orange-500 dark:bg-orange-400' : 'bg-red-500 dark:bg-red-400'
                        }`} />
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(() => {
                        if (u.status === 'pending') {
                          return <span className="text-gray-400 dark:text-zinc-600">-</span>;
                        }
                        if (u.status !== 'approved' && u.status !== 'revoked') return <span className="text-gray-400 dark:text-zinc-600">-</span>;
                        const access = getAccessRemaining(u.expiresAt, u.isPermanent);
                        return (
                          <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            access.type === 'permanent' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20' :
                            access.type === 'expired' ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20' :
                            access.type === 'warning' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20' :
                            'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                          }`}>
                            {access.text}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap lg:opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedDuration(rowDurations[u._id] || u.accessDuration || 'permanent'); setConfirmModal({ userId: u._id, action: 'approve', name: u.email }); }}
                        disabled={(u.status === 'approved' && u.role !== 'admin') || u.role === 'admin'}
                        className="bg-green-50 hover:bg-green-100 dark:bg-green-600/20 dark:hover:bg-green-500 disabled:bg-gray-100 dark:disabled:bg-zinc-800 disabled:text-gray-400 dark:disabled:text-zinc-600 border border-green-200 dark:border-green-500/30 hover:border-green-300 dark:hover:border-green-400 disabled:border-gray-200 dark:disabled:border-zinc-800 text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-white px-3 py-1.5 rounded transition shadow-sm flex inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        <CheckIcon /> <span className="hidden xl:inline">{u.status === 'revoked' ? 'Re-Approve' : 'Approve'}</span>
                      </button>
                      
                      {u.status === 'approved' ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmModal({ userId: u._id, action: 'revoke', name: u.email }); }}
                          disabled={u.role === 'admin'}
                          className="bg-orange-50 hover:bg-orange-100 dark:bg-orange-600/20 dark:hover:bg-orange-500 disabled:bg-gray-100 dark:disabled:bg-zinc-800 border border-orange-200 dark:border-orange-500/30 hover:border-orange-300 dark:hover:border-orange-400 disabled:border-gray-200 dark:disabled:border-zinc-800 text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-white px-3 py-1.5 rounded transition shadow-sm flex inline-flex items-center gap-1 text-xs font-semibold"
                        >
                          <AlertIcon /> <span className="hidden xl:inline">Revoke</span>
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmModal({ userId: u._id, action: 'reject', name: u.email }); }}
                          disabled={u.status === 'rejected' || u.role === 'admin' || u.status === 'revoked'}
                          className="bg-red-50 hover:bg-red-100 dark:bg-red-600/20 dark:hover:bg-red-500 disabled:bg-gray-100 dark:disabled:bg-zinc-800 disabled:text-gray-400 dark:disabled:text-zinc-600 border border-red-200 dark:border-red-500/30 hover:border-red-300 dark:hover:border-red-400 disabled:border-gray-200 dark:disabled:border-zinc-800 text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-white px-3 py-1.5 rounded transition shadow-sm flex inline-flex items-center gap-1 text-xs font-semibold"
                        >
                           <XIcon /> <span className="hidden xl:inline">Reject</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Empty States */}
            {users.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-zinc-500">
                <UsersIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No users found in the database.</p>
              </div>
            )}
            {users.length > 0 && filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-zinc-500">
                <SearchIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No users match your filters.</p>
                <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="mt-4 text-accent-red hover:underline text-sm font-medium">Clear filters</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-gray-900/50 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 capitalize">{confirmModal.action === 'extend' ? 'Modify Access?' : `${confirmModal.action} User?`}</h3>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6">
              Are you sure you want to {confirmModal.action === 'extend' ? 'modify access' : confirmModal.action} for <span className="text-gray-900 dark:text-zinc-200 font-semibold">{confirmModal.name}</span>?
            </p>
            
            {(confirmModal.action === 'approve' || confirmModal.action === 'extend') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Access Duration</label>
                <CustomDropdown
                  value={selectedDuration}
                  onChange={(val) => setSelectedDuration(val)}
                  options={DURATION_OPTIONS}
                  className="w-full"
                  buttonClassName="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-accent-red focus:border-accent-red flex items-center justify-between p-2.5 outline-none cursor-pointer"
                />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button 
                onClick={executeStatusChange}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition shadow-lg ${
                  confirmModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500' :
                  confirmModal.action === 'revoke' ? 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500' :
                  'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500'
                }`}
              >
                Yes, {confirmModal.action}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE USER MODAL --- */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-gray-900/50 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-up">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-500 mb-2">Delete User?</h3>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-4">
              This action is <span className="font-bold text-red-500">irreversible</span>. It will permanently delete <span className="text-gray-900 dark:text-zinc-200 font-semibold">{selectedUser.email}</span>'s account, including it's all data.
            </p>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-2">
              Type <strong className="text-gray-900 dark:text-white">DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 mb-6"
              placeholder="DELETE"
              value={deleteConfirmationText}
              onChange={(e) => {
                const val = e.target.value;
                if (/^[A-Z]*$/.test(val)) {
                  setDeleteConfirmationText(val);
                }
              }}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText('');
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteUser}
                disabled={deleteConfirmationText !== 'DELETE'}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition shadow-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed dark:disabled:bg-red-800/50"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- USER DETAILS DRAWER --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => { setSelectedUser(null); setUserActivity(null); }} />
          
          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 border-l border-gray-200 dark:border-zinc-800 shadow-2xl h-full flex flex-col transform transition-transform duration-300 translate-x-0">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Details</h2>
              <button onClick={() => { setSelectedUser(null); setUserActivity(null); }} className="p-2 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 transition">
                <CloseIcon />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-accent-red/20 to-accent-red border border-accent-red/50 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : selectedUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.name || 'Anonymous User'}</h3>
                  <p className="text-gray-500 dark:text-zinc-400">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Platform Access</p>
                  <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-500 dark:text-zinc-400 text-sm">Role</span>
                      <span className="text-gray-900 dark:text-zinc-200 font-medium capitalize">{selectedUser.role}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-500 dark:text-zinc-400 text-sm">Status</span>
                      <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        selectedUser.status === 'approved' ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-500/10' : 
                        selectedUser.status === 'pending' ? 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-500/10' : 
                        selectedUser.status === 'revoked' ? 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/10' :
                        'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-500/10'
                      }`}>
                        {selectedUser.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-500 dark:text-zinc-400 text-sm">Access Duration</span>
                      {(() => {
                        if (selectedUser.status !== 'approved' && selectedUser.status !== 'revoked') return <span className="text-gray-400 dark:text-zinc-600">-</span>;
                        const access = getAccessRemaining(selectedUser.expiresAt, selectedUser.isPermanent);
                        return (
                          <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            access.type === 'permanent' ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-500/10' :
                            access.type === 'expired' ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-500/10' :
                            access.type === 'warning' ? 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/10' :
                            'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10'
                          }`}>
                            {access.text}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-zinc-400 text-sm">Join Date</span>
                      <span className="text-gray-900 dark:text-zinc-200 text-sm font-medium">{new Date(selectedUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* --- DYNAMIC ACTIVITY PANEL --- */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Activity</p>

                  {/* Loading skeleton */}
                  {activityLoading && (
                    <div className="space-y-3 animate-pulse">
                      <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
                        <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700 rounded mb-2" />
                        <div className="h-4 w-48 bg-gray-200 dark:bg-zinc-700 rounded" />
                      </div>
                      <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
                        <div className="h-3 w-32 bg-gray-200 dark:bg-zinc-700 rounded mb-3" />
                        <div className="flex gap-3">
                          <div className="w-16 h-24 bg-gray-200 dark:bg-zinc-700 rounded" />
                          <div className="w-16 h-24 bg-gray-200 dark:bg-zinc-700 rounded" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error state */}
                  {!activityLoading && userActivity?.error && (
                    <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 text-center">
                      <p className="text-gray-500 dark:text-zinc-400 text-sm">Failed to load activity.</p>
                      <button
                        onClick={() => fetchActivity(selectedUser._id)}
                        className="mt-2 text-accent-red hover:underline text-xs font-medium"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Loaded state */}
                  {!activityLoading && userActivity && !userActivity.error && (
                    <div className="space-y-4">

                      {/* Last Login */}
                      <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-zinc-400 text-sm">Last Login</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                            {timeAgo(userActivity.lastLogin)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <svg className="w-4 h-4 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="text-gray-900 dark:text-zinc-200 text-sm font-medium">
                            {userActivity.lastLogin
                              ? new Date(userActivity.lastLogin).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : 'Never logged in'}
                          </span>
                        </div>
                      </div>

                      {/* Currently Watching */}
                      <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-500 dark:text-zinc-400 text-sm">Currently Watching</span>
                          {userActivity.currentlyWatching?.length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                              {userActivity.currentlyWatching.length} active
                            </span>
                          )}
                        </div>
                        {userActivity.currentlyWatching?.length > 0 ? (
                          <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                            {userActivity.currentlyWatching.map((item) => (
                              <div key={item._id} className="flex-shrink-0 w-[90px] group/card">
                                <div className="relative w-[90px] h-[135px] rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-sm mb-1.5">
                                  {item.posterPath ? (
                                    <img
                                      src={item.posterPath.startsWith('http') ? item.posterPath : `${TMDB_IMG}/w185${item.posterPath}`}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center">
                                      <svg className="w-6 h-6 text-gray-400 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
                                    </div>
                                  )}
                                  {/* Media type badge */}
                                  <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm text-[8px] font-bold uppercase text-white px-1.5 py-0.5 rounded">
                                    {item.mediaType === 'anime' || item.isAnime ? 'ANIME' : item.mediaType === 'tv' ? 'TV' : 'MOV'}
                                  </div>
                                </div>
                                <p className="text-[11px] font-medium text-gray-800 dark:text-zinc-300 truncate leading-tight" title={item.title}>{item.title || 'Unknown'}</p>
                                {item.mediaType === 'tv' && item.season && (
                                  <p className="text-[10px] text-gray-400 dark:text-zinc-500">S{item.season} E{item.episode || '?'}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-zinc-600 italic">Not watching anything right now.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No data loaded yet and not loading */}
                  {!activityLoading && !userActivity && (
                    <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
                      <p className="text-xs text-gray-400 dark:text-zinc-600 italic">Select a user to view their activity.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions in Drawer */}
            <div className="p-6 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/30">
              <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setSelectedDuration(selectedUser.accessDuration || 'permanent'); setConfirmModal({ userId: selectedUser._id, action: 'approve', name: selectedUser.email }); }}
                  disabled={(selectedUser.status === 'approved' && selectedUser.role !== 'admin') || selectedUser.role === 'admin'}
                  className="bg-green-50 dark:bg-green-600/10 hover:bg-green-100 dark:hover:bg-green-600/20 disabled:opacity-30 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  <CheckIcon /> {selectedUser.status === 'revoked' ? 'Re-Approve' : 'Approve'}
                </button>
                {selectedUser.status === 'approved' ? (
                  <>
                    <button 
                      onClick={() => { setSelectedDuration(selectedUser.accessDuration || 'permanent'); setConfirmModal({ userId: selectedUser._id, action: 'extend', name: selectedUser.email }); }}
                      disabled={selectedUser.role === 'admin'}
                      className="bg-blue-50 dark:bg-blue-600/10 hover:bg-blue-100 dark:hover:bg-blue-600/20 disabled:opacity-30 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                    >
                      <ClockIcon /> Modify Access
                    </button>
                    <button 
                      onClick={() => setConfirmModal({ userId: selectedUser._id, action: 'revoke', name: selectedUser.email })}
                      disabled={selectedUser.role === 'admin'}
                      className="bg-orange-50 dark:bg-orange-600/10 hover:bg-orange-100 dark:hover:bg-orange-600/20 disabled:opacity-30 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 col-span-2"
                    >
                      <AlertIcon /> Revoke Immediately
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setConfirmModal({ userId: selectedUser._id, action: 'reject', name: selectedUser.email })}
                    disabled={selectedUser.status === 'rejected' || selectedUser.role === 'admin' || selectedUser.status === 'revoked'}
                    className="bg-red-50 dark:bg-red-600/10 hover:bg-red-100 dark:hover:bg-red-600/20 disabled:opacity-30 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                  >
                    <XIcon /> Reject
                  </button>
                )}
                <button 
                  onClick={() => {
                    setDeleteConfirmationText('');
                    setShowDeleteModal(true);
                  }}
                  disabled={selectedUser.role === 'admin'}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-30 text-white py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 col-span-2"
                >
                  <ShieldExclamationIcon /> Delete User Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

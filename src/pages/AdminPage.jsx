import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Users, Trophy, Download, Trash2, Edit3, Check, X, 
  RefreshCw, Search, Activity, Zap, AlertCircle, Swords, Radio,
  Megaphone, ShieldAlert, RotateCcw, ArrowLeft, ChevronLeft, ChevronRight,
  Filter, Ban, CheckCircle2, AlertTriangle, Eye, Award, ExternalLink
} from 'lucide-react';
import { adminService } from '../services/adminService.js';
import { soundSynth } from '../utils/soundSynth.js';
import { useCustomAlert } from '../components/CustomAlertProvider.jsx';
import { TicTacToeIcon, ConnectFourIcon, GomokuIcon, MemoryMatchIcon, LudoIcon } from '../components/GameIcons.jsx';

export default function AdminPage({
  profile,
  onBackToHome
}) {
  const alert = useCustomAlert();
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'USERS' | 'ROOMS' | 'MATCHES' | 'ANTICHEAT' | 'BROADCAST' | 'EXPORT'
  
  // Data States
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('last_seen');
  const [sortOrder, setSortOrder] = useState('desc');

  const [liveRooms, setLiveRooms] = useState([]);
  const [roomFilter, setRoomFilter] = useState('ACTIVE_ONLY');
  const [matchLogs, setMatchLogs] = useState([]);

  const [matchGameFilter, setMatchGameFilter] = useState('ALL');
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [broadcastConfig, setBroadcastConfig] = useState(() => adminService.getBroadcastConfig());

  // Edit User Drawer State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userGameBreakdown, setUserGameBreakdown] = useState(null);
  const [editRatingInput, setEditRatingInput] = useState('');
  const [editLevelInput, setEditLevelInput] = useState('');
  const [editXpInput, setEditXpInput] = useState('');
  const [editWinsInput, setEditWinsInput] = useState('');
  const [editLossesInput, setEditLossesInput] = useState('');
  const [editDrawsInput, setEditDrawsInput] = useState('');
  const [banReasonInput, setBanReasonInput] = useState('');

  // Broadcast Composer State
  const [broadcastMessage, setBroadcastMessage] = useState(broadcastConfig.message || '');
  const [broadcastType, setBroadcastType] = useState(broadcastConfig.type || 'info');
  const [broadcastActive, setBroadcastActive] = useState(broadcastConfig.active || false);

  const isAuthorized = adminService.isAdmin(profile);

  // Load Metrics & Active Tab Data
  const loadActiveData = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      if (activeTab === 'OVERVIEW') {
        const m = await adminService.fetchAggregatedPlatformMetrics();
        setMetrics(m);
      } else if (activeTab === 'USERS') {
        const res = await adminService.fetchUsersPaginated({
          search: searchQuery,
          status: statusFilter,
          sortBy,
          sortOrder,
          page: currentPage,
          pageSize: 15
        });
        if (res.success) {
          setUsers(res.users);
          setTotalUsersCount(res.total);
          setTotalPages(res.totalPages);
        }
      } else if (activeTab === 'ROOMS') {
        const rooms = await adminService.fetchActiveGameRooms({ statusFilter: roomFilter });
        setLiveRooms(rooms);
      } else if (activeTab === 'MATCHES') {
        const matches = await adminService.fetchGlobalMatches({ limit: 40, gameFilter: matchGameFilter });
        setMatchLogs(matches);
      } else if (activeTab === 'ANTICHEAT') {
        const flags = await adminService.scanAntiCheatAnomalies();
        setFlaggedUsers(flags);
      } else if (activeTab === 'BROADCAST') {
        const b = await adminService.fetchBroadcastFromCloud();
        if (b) {
          setBroadcastConfig(b);
          setBroadcastMessage(b.message || '');
          setBroadcastType(b.type || 'info');
          setBroadcastActive(b.active || false);
        }
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }

  }, [isAuthorized, activeTab, searchQuery, statusFilter, sortBy, sortOrder, currentPage, matchGameFilter, roomFilter]);


  useEffect(() => {
    loadActiveData();
  }, [loadActiveData]);

  // Open Edit User Drawer
  const handleOpenUserDrawer = async (user) => {
    setSelectedUser(user);
    setEditRatingInput(String(user.rating || 1200));
    setEditLevelInput(String(user.level || 1));
    setEditXpInput(String(user.xp || 0));
    setEditWinsInput(String(user.wins || 0));
    setEditLossesInput(String(user.losses || 0));
    setEditDrawsInput(String(user.draws || 0));
    setBanReasonInput(user.ban_reason || '');

    const breakdown = await adminService.fetchUserGameBreakdown(user.id);
    setUserGameBreakdown(breakdown);
  };

  // Save Player Changes
  const handleSaveUserCareer = async () => {
    if (!selectedUser) return;
    setLoading(true);
    const res = await adminService.updateUserCareer(selectedUser.id, {
      rating: parseInt(editRatingInput) || selectedUser.rating,
      level: parseInt(editLevelInput) || selectedUser.level,
      xp: parseInt(editXpInput) || selectedUser.xp,
      wins: parseInt(editWinsInput) || selectedUser.wins,
      losses: parseInt(editLossesInput) || selectedUser.losses,
      draws: parseInt(editDrawsInput) || selectedUser.draws
    });

    setLoading(false);
    if (res.success) {
      soundSynth.playVictory();
      alert.show({
        type: 'success',
        title: 'Player Updated',
        message: `Successfully updated player @${selectedUser.username}.`
      });
      setSelectedUser(null);
      loadActiveData();
    } else {
      alert.show({
        type: 'error',
        title: 'Update Failed',
        message: res.error || 'Could not update player record.'
      });
    }
  };

  // Ban / Unban Player Toggle
  const handleToggleBan = async (user, banAction) => {
    const isBanning = banAction !== undefined ? banAction : !user.is_banned;
    const reason = isBanning ? (banReasonInput || 'Terms of Service Violation') : '';

    const confirmed = await alert.show({
      type: 'confirm',
      isDestructive: isBanning,
      title: isBanning ? 'Ban Player Account?' : 'Unban Player Account?',
      message: isBanning 
        ? `Are you sure you want to suspend @${user.username} (${user.id})? Reason: ${reason}`
        : `Are you sure you want to restore full access for @${user.username}?`
    });

    if (!confirmed) return;

    setLoading(true);
    const res = await adminService.setPlayerBanStatus(user.id, {
      isBanned: isBanning,
      reason
    });
    setLoading(false);

    if (res.success) {
      soundSynth.playVictory();
      alert.show({
        type: 'success',
        title: isBanning ? 'Player Banned' : 'Player Unbanned',
        message: isBanning ? `@${user.username} has been suspended.` : `@${user.username} access restored.`
      });
      if (selectedUser?.id === user.id) setSelectedUser(null);
      loadActiveData();
    } else {
      alert.show({
        type: 'error',
        title: 'Action Failed',
        message: res.error || 'Failed to update ban status.'
      });
    }
  };

  // Reset Career Stats back to default
  const handleResetCareer = async (user) => {
    const confirmed = await alert.show({
      type: 'confirm',
      isDestructive: true,
      title: 'Reset Player Career?',
      message: `Are you sure you want to reset @${user.username}'s rating to 1200 ELO and clear all match records?`
    });

    if (!confirmed) return;

    setLoading(true);
    const res = await adminService.resetPlayerCareer(user.id);
    setLoading(false);

    if (res.success) {
      soundSynth.playVictory();
      alert.show({
        type: 'success',
        title: 'Career Reset',
        message: `@${user.username}'s career stats have been reset to default.`
      });
      if (selectedUser?.id === user.id) setSelectedUser(null);
      loadActiveData();
    } else {
      alert.show({
        type: 'error',
        title: 'Reset Failed',
        message: res.error || 'Failed to reset player career.'
      });
    }
  };

  // Delete Player Record
  const handleDeletePlayer = async (user) => {
    const confirmed = await alert.show({
      type: 'confirm',
      isDestructive: true,
      title: 'Permanently Delete Player?',
      message: `Are you sure you want to permanently delete player @${user.username} (${user.id})? This action cannot be undone.`
    });

    if (!confirmed) return;

    setLoading(true);
    const res = await adminService.deletePlayerRecord(user.id);
    setLoading(false);

    if (res.success) {
      soundSynth.playRotate();
      alert.show({
        type: 'success',
        title: 'Player Deleted',
        message: `Player @${user.username} has been permanently deleted.`
      });
      if (selectedUser?.id === user.id) setSelectedUser(null);
      loadActiveData();
    } else {
      alert.show({
        type: 'error',
        title: 'Delete Failed',
        message: res.error || 'Failed to delete player.'
      });
    }
  };

  // Purge all legacy guest entries
  const handlePurgeGuestRows = async () => {
    const confirmed = await alert.show({
      type: 'confirm',
      isDestructive: true,
      title: 'Purge All Legacy Guest Rows?',
      message: 'This will remove all unauthenticated guest entries (player_*, user_*, test_*) from the Supabase database. Only real registered accounts will remain.'
    });

    if (!confirmed) return;

    setLoading(true);
    const res = await adminService.purgeLegacyGuestRows();
    setLoading(false);

    if (res.success) {
      soundSynth.playRotate();
      alert.show({
        type: 'success',
        title: 'Guest Entries Purged',
        message: 'All unauthenticated guest rows have been cleaned from the database.'
      });
      loadActiveData();
    } else {
      alert.show({
        type: 'error',
        title: 'Purge Failed',
        message: res.error || 'Could not purge guest rows.'
      });
    }
  };

  // Purge Inactive / Cancelled / Expired Rooms
  const handlePurgeInactiveRooms = async () => {
    const confirmed = await alert.show({
      type: 'confirm',
      isDestructive: true,
      title: 'Clean Inactive Rooms?',
      message: 'This will purge all expired, cancelled, and finished multiplayer room entries from the database.'
    });

    if (!confirmed) return;

    setLoading(true);
    const res = await adminService.purgeInactiveRooms();
    setLoading(false);

    if (res.success) {
      soundSynth.playRotate();
      alert.show({
        type: 'success',
        title: 'Rooms Cleaned',
        message: 'All inactive and expired room sessions have been deleted.'
      });
      loadActiveData();
    } else {
      alert.show({
        type: 'error',
        title: 'Clean Failed',
        message: res.error || 'Could not clean inactive rooms.'
      });
    }
  };

  // Force Terminate Live Room
  const handleTerminateRoom = async (roomCode) => {

    const confirmed = await alert.show({
      type: 'confirm',
      isDestructive: true,
      title: 'Terminate Live Room?',
      message: `Are you sure you want to force-close room [${roomCode}]? Connected players will return to the lobby.`
    });


    if (!confirmed) return;

    setLoading(true);
    const res = await adminService.forceTerminateRoom(roomCode);
    setLoading(false);

    if (res.success) {
      soundSynth.playRotate();
      alert.show({
        type: 'success',
        title: 'Room Terminated',
        message: `Room [${roomCode}] has been closed.`
      });
      loadActiveData();
    }
  };

  // Publish / Update Broadcast Banner
  const handleSaveBroadcast = async (forceActive = null) => {
    const shouldBeActive = forceActive !== null ? forceActive : broadcastActive;
    if (shouldBeActive && !broadcastMessage.trim()) {
      alert.show({
        type: 'warning',
        title: 'Empty Message',
        message: 'Please type an announcement message before publishing.'
      });
      return;
    }

    setLoading(true);
    const res = await adminService.setBroadcastConfig({
      active: shouldBeActive,
      message: shouldBeActive ? broadcastMessage.trim() : '',
      type: broadcastType
    });
    setLoading(false);

    if (res.success) {
      soundSynth.playVictory();
      setBroadcastConfig(res.broadcast);
      setBroadcastActive(shouldBeActive);
      if (!shouldBeActive) {
        setBroadcastMessage('');
      }
      alert.show({
        type: 'success',
        title: shouldBeActive ? 'Announcement Published' : 'Announcement Deactivated',
        message: shouldBeActive 
          ? 'System announcement broadcasted to all online players in real time.'
          : 'Announcement deactivated and removed from all player screens.'
      });
    } else {
      alert.show({
        type: 'error',
        title: 'Broadcast Failed',
        message: res.error || 'Failed to update broadcast announcement.'
      });
    }
  };


  // Guard: Unauthorized Access
  if (!isAuthorized) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-xl font-extrabold text-zinc-900 font-heading mb-2">
          Administrator Authorization Required
        </h1>
        <p className="text-sm text-zinc-600 mb-6">
          This backoffice portal is restricted strictly to verified platform administrators. Signed in as <strong>{profile?.email || 'Guest'}</strong>.
        </p>
        <button
          onClick={onBackToHome}
          className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold"
        >
          <ArrowLeft size={16} />
          <span>Return to Game Arenas</span>
        </button>
      </div>
    );
  }

  const TABS = [
    { id: 'OVERVIEW', label: 'Overview', icon: Activity },
    { id: 'USERS', label: 'Players', icon: Users, badge: totalUsersCount || null },
    { id: 'ROOMS', label: 'Live Arenas', icon: Radio, badge: liveRooms.length || null },
    { id: 'MATCHES', label: 'Match History', icon: Swords },
    { id: 'ANTICHEAT', label: 'Anti-Cheat', icon: ShieldAlert, badge: flaggedUsers.length > 0 ? flaggedUsers.length : null, badgeColor: 'bg-red-100 text-red-700' },
    { id: 'BROADCAST', label: 'Broadcast', icon: Megaphone, badge: broadcastConfig.active ? 'ACTIVE' : null, badgeColor: 'bg-green-100 text-green-700' },
    { id: 'EXPORT', label: 'Data Export', icon: Download }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto pb-16 flex flex-col gap-6 font-body text-zinc-900">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-zinc-900 font-heading tracking-tight m-0">
                Platform Operations Backoffice
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200">
                SUPERADMIN
              </span>
            </div>
            <p className="text-xs text-zinc-500 m-0 mt-0.5">
              Logged in as <strong className="text-zinc-800">{profile?.email}</strong> • Direct Supabase Database Connection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadActiveData}
            disabled={loading}
            className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-700 border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer disabled:opacity-50"
            title="Refresh active view"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            onClick={onBackToHome}
            className="btn-secondary flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-zinc-800 border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Exit Hub</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                soundSynth.playRotate();
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'bg-zinc-900 text-white shadow-sm' 
                  : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              <IconComp size={15} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                  tab.badgeColor || (isActive ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-100 text-zinc-600')
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main Workspace Views */}
      {/* TAB A: OVERVIEW */}
      {activeTab === 'OVERVIEW' && metrics && (
        <div className="flex flex-col gap-6 animate-pop-in">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className="text-xs font-bold font-heading uppercase tracking-wider">Total Registered Players</span>
                <Users size={16} className="text-blue-600" />
              </div>
              <div className="text-2xl font-black font-mono text-zinc-900">{metrics.totalUsers}</div>
              <div className="text-[11px] text-green-600 font-semibold mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Active Database Accounts
              </div>
            </div>

            <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className="text-xs font-bold font-heading uppercase tracking-wider">24h Active Players</span>
                <Activity size={16} className="text-green-600" />
              </div>
              <div className="text-2xl font-black font-mono text-zinc-900">{metrics.activeToday}</div>
              <div className="text-[11px] text-zinc-500 font-mono mt-1">Unique sessions today</div>
            </div>

            <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className="text-xs font-bold font-heading uppercase tracking-wider">Total Matches Played</span>
                <Swords size={16} className="text-amber-600" />
              </div>
              <div className="text-2xl font-black font-mono text-zinc-900">{metrics.totalMatches}</div>
              <div className="text-[11px] text-zinc-500 font-mono mt-1">Across all 5 game arenas</div>
            </div>

            <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className="text-xs font-bold font-heading uppercase tracking-wider">Grandmaster Players</span>
                <Trophy size={16} className="text-purple-600" />
              </div>
              <div className="text-2xl font-black font-mono text-zinc-900">{metrics.grandmasterCount}</div>
              <div className="text-[11px] text-purple-600 font-mono mt-1">Rating ≥ 1800 ELO</div>
            </div>
          </div>

          {/* Skill Tier Breakdown */}
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <h2 className="text-sm font-extrabold text-zinc-900 font-heading mb-4 flex items-center gap-2">
              <Award size={16} className="text-blue-600" />
              <span>Competitive Skill Tier Distribution</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(metrics.tierDistribution || {}).map(([tierName, count]) => (
                <div key={tierName} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-center">
                  <div className="text-xs font-bold text-zinc-600 font-heading">{tierName}</div>
                  <div className="text-lg font-black font-mono text-zinc-900 mt-1">{count}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {metrics.totalUsers > 0 ? Math.round((count / metrics.totalUsers) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Game Arenas Directory Grid */}
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <h2 className="text-sm font-extrabold text-zinc-900 font-heading mb-4 flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              <span>Active Game Arenas Overview</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { id: 'connect4', name: 'Connect 4', spec: '7×6 Gravity Grid', icon: ConnectFourIcon },
                { id: 'tictactoe', name: 'Tic Tac Toe', spec: '3×3 Fast Arena', icon: TicTacToeIcon },
                { id: 'gomoku', name: 'Gomoku', spec: '15×15 Pro Board', icon: GomokuIcon },
                { id: 'memory', name: 'Memory Match', spec: '5 Campaign Levels', icon: MemoryMatchIcon },
                { id: 'ludo', name: 'Ludo Arena', spec: '2-4 Player Battle', icon: LudoIcon }
              ].map(g => {
                const IconComp = g.icon;
                return (
                  <div key={g.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center flex-shrink-0">
                      <IconComp size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-zinc-900 font-heading truncate">{g.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{g.spec}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB B: PLAYERS DIRECTORY */}
      {activeTab === 'USERS' && (
        <div className="flex flex-col gap-4 animate-pop-in">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search player name, email, or user ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Players</option>
                <option value="ACTIVE">Active Players</option>
                <option value="BANNED">Suspended / Banned</option>
                <option value="GRANDMASTER">Grandmasters (≥1800)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="last_seen">Sort by Activity</option>
                <option value="rating">Sort by ELO Rating</option>
                <option value="level">Sort by Level</option>
                <option value="wins">Sort by Total Wins</option>
              </select>

              <button
                onClick={handlePurgeGuestRows}
                title="Purge unauthenticated guest rows from database"
                className="px-3 py-2 text-xs font-bold rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Clean Guests</span>
              </button>
            </div>
          </div>


          {/* Players Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4">Rating & Tier</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Win / Loss / Draw</th>
                    <th className="py-3 px-4">Win Rate</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        No players matching the search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-900 font-heading">{u.username}</div>
                          <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[180px]">{u.id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold font-mono text-zinc-900">{u.rating} ELO</div>
                          <div className="text-[10px] text-zinc-500">{u.tierName}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-zinc-700">
                          Lvl {u.level}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-600">
                          <span className="text-green-600 font-bold">{u.wins}W</span> • <span className="text-red-600 font-bold">{u.losses}L</span> • {u.draws}D
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                          {u.winRate}%
                        </td>
                        <td className="py-3 px-4">
                          {u.is_banned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 font-mono">
                              <Ban size={10} /> BANNED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-100 text-green-700 font-mono">
                              <CheckCircle2 size={10} /> ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenUserDrawer(u)}
                            className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer"
                          >
                            <Edit3 size={12} className="inline mr-1" />
                            <span>Manage</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Toolbar */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 border-t border-zinc-200 text-xs">
                <div className="text-zinc-500 font-mono">
                  Showing Page {currentPage} of {totalPages} ({totalUsersCount} total players)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB C: LIVE ARENA ROOMS */}
      {activeTab === 'ROOMS' && (
        <div className="flex flex-col gap-4 animate-pop-in">
          <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 font-heading m-0">Live Active Multiplayer Rooms</h2>
              <p className="text-xs text-zinc-500 m-0 mt-0.5">Real-time WebRTC/Supabase arena sessions</p>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="ACTIVE_ONLY">Active / Waiting Only</option>
                <option value="ALL">All Rooms (History)</option>
              </select>

              <button
                onClick={handlePurgeInactiveRooms}
                title="Purge expired and cancelled rooms from database"
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Clean Expired Rooms</span>
              </button>

              <div className="text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl bg-zinc-100 text-zinc-700">
                {liveRooms.length} Sessions
              </div>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveRooms.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white border border-zinc-200 rounded-2xl">
                <Radio size={28} className="mx-auto text-zinc-400 mb-2" />
                <p className="text-xs text-zinc-500 font-bold">No active live game rooms currently open.</p>
              </div>
            ) : (
              liveRooms.map((room) => (
                <div key={room.roomCode} className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                      {room.gameKey}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Code: <strong className="text-zinc-800">{room.roomCode}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs my-1">
                    <div className="font-bold text-zinc-900">{room.player1}</div>
                    <span className="text-[10px] font-mono text-zinc-400">VS</span>
                    <div className="font-bold text-zinc-700">{room.player2}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                    <span className="text-[10px] font-mono text-green-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      {room.status}
                    </span>
                    <button
                      onClick={() => handleTerminateRoom(room.roomCode)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 cursor-pointer"
                    >
                      Terminate
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB D: GLOBAL MATCH HISTORY */}
      {activeTab === 'MATCHES' && (
        <div className="flex flex-col gap-4 animate-pop-in">
          <div className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 font-heading m-0">Global Match Records Feed</h2>
              <p className="text-xs text-zinc-500 m-0 mt-0.5">Recorded outcomes across all game modes</p>
            </div>
            <select
              value={matchGameFilter}
              onChange={(e) => setMatchGameFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold cursor-pointer"
            >
              <option value="ALL">All Games</option>
              <option value="connect4">Connect 4</option>
              <option value="tictactoe">Tic Tac Toe</option>
              <option value="gomoku">Gomoku</option>
              <option value="memory">Memory Match</option>
              <option value="ludo">Ludo</option>
            </select>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">Game</th>
                    <th className="py-3 px-4">Matchup</th>
                    <th className="py-3 px-4">Result / Winner</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {matchLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-500">
                        No match logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    matchLogs.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold uppercase text-blue-600">
                          {m.gameSlug}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-zinc-900">{m.player1Name}</span>
                          <span className="text-zinc-400 mx-2">vs</span>
                          <span className="font-bold text-zinc-700">{m.player2Name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            m.result === 'WIN' ? 'bg-green-100 text-green-700' : m.result === 'LOSS' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {m.winnerName ? `Winner: ${m.winnerName}` : m.result}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[10px] text-zinc-400">
                          {new Date(m.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB E: ANTI-CHEAT SCANNER */}
      {activeTab === 'ANTICHEAT' && (
        <div className="flex flex-col gap-4 animate-pop-in">
          <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 font-heading m-0 flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-600" />
                <span>Heuristic Anti-Cheat & Anomaly Watchlist</span>
              </h2>
              <p className="text-xs text-zinc-500 m-0 mt-0.5">Automated detection of win-rate inflation and rating velocity spikes</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
              {flaggedUsers.length} Flagged Accounts
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {flaggedUsers.length === 0 ? (
              <div className="py-12 text-center bg-white border border-zinc-200 rounded-2xl">
                <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
                <p className="text-xs text-zinc-700 font-bold">All player accounts passed heuristic anti-cheat checks with clean records.</p>
              </div>
            ) : (
              flaggedUsers.map((user) => (
                <div key={user.id} className="p-4 bg-white border border-red-200 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-heading text-zinc-900">{user.username}</span>
                      <span className="text-[10px] font-mono text-zinc-400 font-semibold">{user.id}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${
                        user.riskLevel === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {user.riskLevel} RISK
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      {user.flags.map((flag, idx) => (
                        <div key={idx} className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                          <AlertTriangle size={12} className="flex-shrink-0" />
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenUserDrawer(user)}
                      className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-700 border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => handleToggleBan(user, true)}
                      className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 border-red-200 bg-red-50 hover:bg-red-100 cursor-pointer"
                    >
                      Ban Account
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB F: BROADCAST MANAGER */}
      {activeTab === 'BROADCAST' && (
        <div className="flex flex-col gap-6 animate-pop-in">
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-extrabold text-zinc-900 font-heading m-0 flex items-center gap-2">
                  <Megaphone size={16} className="text-blue-600" />
                  <span>Platform-Wide Announcement Banner</span>
                </h2>
                <p className="text-xs text-zinc-500 m-0 mt-0.5">
                  Publish global alert notifications or tournament announcements to all connected players in real-time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-500">Live Status:</span>
                {broadcastConfig.active && broadcastConfig.message ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300 font-mono">
                    <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                    LIVE ON PLAYER SCREENS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 font-mono">
                    <span className="w-2 h-2 rounded-full bg-zinc-400" />
                    OFFLINE / INACTIVE
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 max-w-2xl">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">Announcement Message</label>
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter global announcement message (e.g. Weekend 2x XP Tournament is Live!)..."
                  className="w-full p-3 text-xs rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">Alert Style / Color Theme</label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="info">🔵 Information (Solid Blue)</option>
                  <option value="event">🎉 Special Event / Tournament (Solid Purple)</option>
                  <option value="warning">⚠️ Warning / Maintenance Notice (Solid Amber)</option>
                  <option value="critical">🔴 Critical Alert (Solid Red)</option>
                </select>
              </div>

              {/* Exact Live Banner Preview */}
              {broadcastMessage && (
                <div className="mt-2 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col gap-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase font-mono tracking-wider">
                    Player Screen Preview:
                  </div>
                  <div className={`w-full rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-sm ${
                    broadcastType === 'event' ? 'bg-purple-700 text-white border-purple-800' :
                    broadcastType === 'warning' ? 'bg-amber-600 text-white border-amber-700' :
                    broadcastType === 'critical' ? 'bg-red-600 text-white border-red-700' :
                    'bg-blue-600 text-white border-blue-700'
                  }`}>
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/25 text-white border border-white/30 font-mono">
                        NOTICE
                      </span>
                      <span className="truncate font-bold text-white">{broadcastMessage}</span>
                    </div>
                    <span className="p-1 rounded-md bg-black/25 text-white border border-white/30 text-[10px] font-mono ml-2">X</span>
                  </div>
                </div>
              )}

              {/* Explicit Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <button
                  onClick={() => handleSaveBroadcast(true)}
                  disabled={loading || !broadcastMessage.trim()}
                  className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Megaphone size={14} />
                  <span>Publish to All Players</span>
                </button>

                {broadcastConfig.active && (
                  <button
                    onClick={() => handleSaveBroadcast(false)}
                    disabled={loading}
                    className="btn-secondary py-2.5 px-5 rounded-xl text-xs font-bold text-red-600 border-red-200 bg-red-50 hover:bg-red-100 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <X size={14} />
                    <span>Deactivate & Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TAB G: DATA EXPORT */}
      {activeTab === 'EXPORT' && (
        <div className="flex flex-col gap-6 animate-pop-in">
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <h2 className="text-sm font-extrabold text-zinc-900 font-heading mb-1 flex items-center gap-2">
              <Download size={16} className="text-blue-600" />
              <span>Platform Data Export Center</span>
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              Download clean CSV and JSON reports for analytics, offline player audits, and backup records.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 font-heading m-0">Player Directory CSV</h3>
                  <p className="text-[11px] text-zinc-500 mt-1 m-0">All registered users, career ELO ratings, levels, wins, losses, and ban records.</p>
                </div>
                <button
                  onClick={async () => {
                    const res = await adminService.fetchUsersPaginated({ pageSize: 1000 });
                    if (res.success && res.users) {
                      adminService.exportUsersAsCsv(res.users);
                    }
                  }}
                  className="btn-primary py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Users (.csv)</span>
                </button>
              </div>

              <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 font-heading m-0">Global Match Logs CSV</h3>
                  <p className="text-[11px] text-zinc-500 mt-1 m-0">Historical match outcomes, player vs player records, and timestamps.</p>
                </div>
                <button
                  onClick={async () => {
                    const matches = await adminService.fetchGlobalMatches({ limit: 1000 });
                    adminService.exportMatchesAsCsv(matches);
                  }}
                  className="btn-secondary py-2 px-3 rounded-xl text-xs font-bold text-zinc-800 border-zinc-300 bg-white hover:bg-zinc-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Matches (.csv)</span>
                </button>
              </div>

              <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 font-heading m-0">Full Platform Audit JSON</h3>
                  <p className="text-[11px] text-zinc-500 mt-1 m-0">Complete system snapshot including metrics, flagged accounts, and broadcast settings.</p>
                </div>
                <button
                  onClick={async () => {
                    const [m, flags] = await Promise.all([
                      adminService.fetchAggregatedPlatformMetrics(),
                      adminService.scanAntiCheatAnomalies()
                    ]);
                    adminService.exportSystemReportJson({
                      metrics: m,
                      flaggedAccounts: flags,
                      broadcast: broadcastConfig,
                      exportedAt: new Date().toISOString()
                    });
                  }}
                  className="btn-secondary py-2 px-3 rounded-xl text-xs font-bold text-zinc-800 border-zinc-300 bg-white hover:bg-zinc-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Snapshot (.json)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit User Drawer / Modal */}
      {selectedUser && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div 
            className="w-full max-w-xl max-h-[90vh] bg-white border border-zinc-200 rounded-2xl shadow-xl p-6 overflow-y-auto flex flex-col gap-5 animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-zinc-900 font-heading m-0">
                  Manage Player: @{selectedUser.username}
                </h2>
                <span className="text-[11px] text-zinc-400 font-mono">ID: {selectedUser.id}</span>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-500 hover:bg-zinc-200 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Adjust Career Values */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Career Rating (ELO)</label>
                <input
                  type="number"
                  value={editRatingInput}
                  onChange={(e) => setEditRatingInput(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg bg-zinc-50 border border-zinc-200 font-mono font-bold text-zinc-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Level</label>
                <input
                  type="number"
                  value={editLevelInput}
                  onChange={(e) => setEditLevelInput(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg bg-zinc-50 border border-zinc-200 font-mono font-bold text-zinc-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">XP</label>
                <input
                  type="number"
                  value={editXpInput}
                  onChange={(e) => setEditXpInput(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg bg-zinc-50 border border-zinc-200 font-mono font-bold text-zinc-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Wins</label>
                <input
                  type="number"
                  value={editWinsInput}
                  onChange={(e) => setEditWinsInput(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg bg-zinc-50 border border-zinc-200 font-mono font-bold text-green-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Losses</label>
                <input
                  type="number"
                  value={editLossesInput}
                  onChange={(e) => setEditLossesInput(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg bg-zinc-50 border border-zinc-200 font-mono font-bold text-red-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Draws</label>
                <input
                  type="number"
                  value={editDrawsInput}
                  onChange={(e) => setEditDrawsInput(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg bg-zinc-50 border border-zinc-200 font-mono font-bold text-zinc-600"
                />
              </div>
            </div>

            {/* Per-Game Breakdown */}
            {userGameBreakdown && (
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <div className="text-[11px] font-bold text-zinc-500 uppercase font-mono mb-2">Individual Game Breakdown</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  {Object.entries(userGameBreakdown).map(([gKey, stats]) => (
                    <div key={gKey} className="p-2 bg-white rounded-lg border border-zinc-200">
                      <div className="text-[10px] font-bold uppercase font-mono text-zinc-700">{gKey}</div>
                      <div className="text-xs font-black font-mono text-zinc-900 mt-0.5">{stats.rating}</div>
                      <div className="text-[9px] text-zinc-400 font-mono">{stats.wins}W / {stats.losses}L</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ban Reason Input */}
            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Suspension / Ban Reason</label>
              <input
                type="text"
                placeholder="Reason for suspension (optional)"
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                className="w-full p-2 text-xs rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleBan(selectedUser)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    selectedUser.is_banned 
                      ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                  }`}
                >
                  {selectedUser.is_banned ? 'Unban Account' : 'Suspend / Ban'}
                </button>

                <button
                  onClick={() => handleResetCareer(selectedUser)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                >
                  Reset Stats
                </button>

                <button
                  onClick={() => handleDeletePlayer(selectedUser)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 size={13} className="inline mr-1" />
                  Delete
                </button>
              </div>

              <button
                onClick={handleSaveUserCareer}
                className="btn-primary px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

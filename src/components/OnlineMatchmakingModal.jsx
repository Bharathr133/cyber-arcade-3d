import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Zap, Users, Copy, Check, ShieldCheck, 
  ArrowRight, Radio, RefreshCw, Trophy, Crown, Play, Edit3, User, Bot, Clock, AlertTriangle, Globe,
  QrCode, Key, CheckCircle, Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ArcadeRollingLoader from './ArcadeRollingLoader.jsx';

import { matchmakingService } from '../services/matchmakingService.js';
import { realtimeManager } from '../services/realtimeManager.js';
import { presenceService } from '../services/presenceService.js';
import { AVATARS, saveUserProfile } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';
import { getSupabase } from '../utils/supabaseClient.js';
import { formatErrorMessage } from '../utils/errorHandler.js';

const GAME_TITLES = {
  connect4: 'Connect 4',
  tictactoe: 'Tic-Tac-Toe',
  gomoku: 'Gomoku',
  memory: 'Memory Match',
  ludo: 'Ludo Championship'
};

export default function OnlineMatchmakingModal({
  isOpen,
  mode = 'QUICK_MATCH', // 'QUICK_MATCH', 'CREATE_PRIVATE', 'JOIN_PRIVATE'
  gameId = 'tictactoe',
  gameTitle = 'Tic-Tac-Toe',
  currentUserProfile,
  onClose,
  onLaunchOnlineGame,
  onLaunchAiGame,
  onProfileUpdated
}) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [privateTab, setPrivateTab] = useState(() => mode === 'JOIN_PRIVATE' ? 'JOIN' : 'CREATE'); // 'CREATE' | 'JOIN'
  const [shareFormat, setShareFormat] = useState('CODE'); // 'CODE' | 'QR'

  const [isEditingName, setIsEditingName] = useState(false);
  const initialName = currentUserProfile?.display_name || currentUserProfile?.name || currentUserProfile?.username || (currentUserProfile?.email ? currentUserProfile.email.split('@')[0] : 'Player');
  const [playerName, setPlayerName] = useState(initialName);
  const [avatarId, setAvatarId] = useState(currentUserProfile?.avatarId || '1');
  const [availablePlayersCount, setAvailablePlayersCount] = useState(() => presenceService.getOnlineCount());

  const [status, setStatus] = useState('INITIALIZING'); // 'SEARCHING', 'WAITING_PRIVATE', 'JOINING', 'READY_TO_START', 'NO_PLAYERS_FOUND', 'ERROR'
  const [searchSecondsLeft, setSearchSecondsLeft] = useState(25);
  const [roomData, setRoomData] = useState(null);
  const [joinTokenInput, setJoinTokenInput] = useState('');
  const [detectedRoom, setDetectedRoom] = useState(null);
  const [isDetectingRoom, setIsDetectingRoom] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [matchLobbyData, setMatchLobbyData] = useState(null);
  const [countdown, setCountdown] = useState(12);

  // Synchronize profile changes to player name state
  useEffect(() => {
    const realName = currentUserProfile?.display_name || currentUserProfile?.name || currentUserProfile?.username || (currentUserProfile?.email ? currentUserProfile.email.split('@')[0] : null);
    if (realName) {
      setPlayerName(realName);
    }
    if (currentUserProfile?.avatarId) {
      setAvatarId(currentUserProfile.avatarId);
    }
  }, [currentUserProfile]);

  // Subscribe to live online presence
  useEffect(() => {
    const unsub = presenceService.subscribe((count) => setAvailablePlayersCount(count));
    return () => unsub();
  }, []);

  const matchLobbyDataRef = useRef(matchLobbyData);
  matchLobbyDataRef.current = matchLobbyData;
  const isCancelledRef = useRef(false);

  const triggerLaunchGame = (lobbyInfo) => {
    if (!lobbyInfo) return;
    soundSynth.playVictory();
    const resolvedGameId = lobbyInfo.gameId || lobbyInfo.game_slug || gameId;
    onLaunchOnlineGame({
      matchId: lobbyInfo.matchId,
      roomId: lobbyInfo.roomId,
      myRole: lobbyInfo.myRole,
      opponent: lobbyInfo.opponent,
      gameId: resolvedGameId,
      game_slug: resolvedGameId
    });
  };

  const handleCloseAndCancel = () => {
    if (roomData?.id) {
      matchmakingService.cancelMatchmaking(roomData.id, currentUserProfile?.id);
      realtimeManager.leaveRoom(roomData.id);
    }
    setStatus('INITIALIZING');
    onClose();
  };

  // Lock body scroll when open
  useEffect(() => {
    const original = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Handle Matchmaking Search Countdown (25s limit)
  useEffect(() => {
    if (status !== 'SEARCHING') return;

    const timer = setInterval(() => {
      setSearchSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('NO_PLAYERS_FOUND');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Real-time room inspector when user enters 4-6 chars in joinTokenInput
  useEffect(() => {
    const token = joinTokenInput.trim().toUpperCase();
    if (token.length >= 4) {
      setIsDetectingRoom(true);
      const timer = setTimeout(async () => {
        const details = await matchmakingService.getRoomDetails(token);
        setDetectedRoom(details);
        setIsDetectingRoom(false);
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setDetectedRoom(null);
      setIsDetectingRoom(false);
    }
  }, [joinTokenInput]);

  // Reset and auto-start matchmaking on open
  useEffect(() => {
    if (!isOpen) {
      isCancelledRef.current = true;
      setStatus('INITIALIZING');
      setRoomData(null);
      setMatchLobbyData(null);
      setSearchSecondsLeft(25);
      setDetectedRoom(null);
      return;
    }

    isCancelledRef.current = false;
    setCurrentMode(mode);
    setPrivateTab(mode === 'JOIN_PRIVATE' ? 'JOIN' : 'CREATE');
    setSearchSecondsLeft(25);
    setCountdown(12);

    const activeName = currentUserProfile?.display_name || currentUserProfile?.name || currentUserProfile?.username || (currentUserProfile?.email ? currentUserProfile.email.split('@')[0] : '');
    setPlayerName(activeName);
    setAvatarId(currentUserProfile?.avatarId || '1');

    if (mode === 'JOIN_PRIVATE') {
      setStatus('JOINING');
    } else {
      startMatchmakingFlow(mode, activeName, currentUserProfile?.avatarId || '1');
    }

    return () => {
      isCancelledRef.current = true;
    };
  }, [isOpen, mode, gameId]);

  const startMatchmakingFlow = async (targetMode, currentName, currentAv) => {
    try {
      setErrorMessage('');
      
      if (targetMode === 'QUICK_MATCH') {
        setStatus('SEARCHING');
        soundSynth.playRotate();

        const result = await matchmakingService.findOrCreatePublicMatch(
          gameId,
          currentUserProfile?.id,
          currentName,
          currentAv
        );

        if (isCancelledRef.current) return;

        if (result?.status === 'MATCH_READY') {
          const matchId = result.match_id || result.matchId;
          const roomId = result.room_id || result.roomId;
          let realOpponent = result.opponent || { name: '', avatarId: '1', rating: 1200 };

          const lobby = {
            matchId,
            roomId,
            myRole: result.role || 'O',
            opponent: realOpponent,
            gameId: result.game_slug || result.gameId || gameId
          };

          realtimeManager.broadcastToRoom(roomId, 'player_joined', {
            match_id: matchId,
            room_id: roomId,
            opponent: {
              name: currentName,
              avatarId: currentAv,
              rating: currentUserProfile?.rating || 1200
            }
          });

          triggerLaunchGame(lobby);

        } else if (result?.status === 'WAITING' || result?.room) {
          const currentRoom = result.room || { id: result.room_id, roomCode: result.room_code };
          setRoomData(currentRoom);
          setStatus('SEARCHING');

          realtimeManager.subscribeToRoom(currentRoom.id, currentUserProfile?.id, {
            onPlayerJoined: async (payload) => {
              const opp = payload?.opponent || {};
              const oppName = opp.name || opp.display_name || (opp.username ? `@${opp.username}` : '');

              const lobby = {
                matchId: payload.match_id,
                roomId: currentRoom.id,
                myRole: 'X',
                opponent: {
                  name: oppName,
                  avatarId: opp.avatarId || '2',
                  rating: opp.rating || 1200
                },
                gameId
              };

              triggerLaunchGame(lobby);
            }
          });
        } else if (result?.error) {
          setStatus('ERROR');
          const formatted = formatErrorMessage(result.error, 'Matchmaking');
          setErrorMessage(formatted.message);
        } else {
          setStatus('ERROR');
          const formatted = formatErrorMessage('NO_DATABASE_CLIENT', 'Matchmaking');
          setErrorMessage(formatted.message);
        }

      } else if (targetMode === 'CREATE_PRIVATE') {
        setStatus('WAITING_PRIVATE');
        soundSynth.playRotate();

        const result = await matchmakingService.createRoom(
          gameId,
          true,
          currentUserProfile?.id,
          currentName,
          currentAv
        );

        if (isCancelledRef.current) return;

        if (result?.room_id || result?.room?.id) {
          const currentRoom = {
            id: result.room_id || result.room?.id,
            roomCode: result.room_code || result.roomCode
          };
          setRoomData(currentRoom);

          realtimeManager.subscribeToRoom(currentRoom.id, currentUserProfile?.id, {
            onPlayerJoined: (payload) => {
              const opp = payload?.opponent || {};
              const oppName = opp.name || opp.display_name || (opp.username ? `@${opp.username}` : '');
              const lobby = {
                matchId: payload.match_id,
                roomId: currentRoom.id,
                myRole: 'X',
                opponent: {
                  name: oppName,
                  avatarId: opp.avatarId || '2',
                  rating: opp.rating || 1200
                },
                gameId
              };
              triggerLaunchGame(lobby);
            }
          });

        } else {
          setStatus('ERROR');
          setErrorMessage('Unable to generate private room code.');
        }
      } else if (targetMode === 'JOIN_PRIVATE') {
        setStatus('JOINING');
      }
    } catch (err) {
      if (!isCancelledRef.current) {
        setStatus('ERROR');
        setErrorMessage(err.message || 'Connection failed.');
      }
    }
  };

  const handleSwitchToCreatePrivate = () => {
    soundSynth.playClick();
    setPrivateTab('CREATE');
    setCurrentMode('CREATE_PRIVATE');
    startMatchmakingFlow('CREATE_PRIVATE', playerName, avatarId);
  };

  const handleSwitchToJoinPrivate = () => {
    soundSynth.playClick();
    setPrivateTab('JOIN');
    setCurrentMode('JOIN_PRIVATE');
    setStatus('JOINING');
  };

  const handleSaveNameChange = (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const updated = saveUserProfile({
      ...currentUserProfile,
      name: playerName.trim(),
      avatarId: avatarId
    });

    if (onProfileUpdated && updated) {
      onProfileUpdated(updated);
    }
    setIsEditingName(false);
    soundSynth.playVictory();
  };

  const handleJoinSubmit = async (e) => {
    e?.preventDefault();
    const token = joinTokenInput.trim().toUpperCase();
    if (token.length < 4) return;

    setStatus('SEARCHING');
    try {
      const result = await matchmakingService.joinRoom(
        token,
        currentUserProfile?.id,
        playerName,
        avatarId
      );

      if (result?.match_id || result?.matchId) {
        const matchId = result.match_id || result.matchId;
        const roomId = result.room_id || result.roomId;
        const targetGameId = result.game_slug || result.gameId || detectedRoom?.gameSlug || gameId;
        const realOpponent = result.opponent || { name: '', avatarId: '1', rating: 1200 };

        const lobby = {
          matchId,
          roomId,
          myRole: 'O',
          gameId: targetGameId,
          opponent: realOpponent
        };

        realtimeManager.broadcastToRoom(roomId, 'player_joined', {
          match_id: matchId,
          room_id: roomId,
          opponent: {
            name: playerName,
            avatarId: avatarId,
            rating: currentUserProfile?.rating || 1200
          }
        });

        triggerLaunchGame(lobby);
      } else {
        setStatus('ERROR');
        const formatted = formatErrorMessage(result?.error || 'ROOM_NOT_FOUND', 'Join Room');
        setErrorMessage(formatted.message);
      }
    } catch (err) {
      setStatus('ERROR');
      const formatted = formatErrorMessage(err, 'Join Room');
      setErrorMessage(formatted.message);
    }
  };

  const handleCopyCode = () => {
    if (!roomData?.roomCode) return;
    navigator.clipboard.writeText(roomData.roomCode);
    setCopiedCode(true);
    soundSynth.playRotate();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!roomData?.roomCode) return;
    const inviteUrl = `${window.location.origin}/?join=${roomData.roomCode}&game=${gameId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    soundSynth.playRotate();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  const currentAvatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  const isPrivateMode = currentMode === 'CREATE_PRIVATE' || currentMode === 'JOIN_PRIVATE';
  const inviteUrl = roomData?.roomCode ? `${window.location.origin}/?join=${roomData.roomCode}&game=${gameId}` : '';

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        className="card-enterprise animate-pop-in"
        style={{
          width: 'min(95vw, 440px)',
          maxHeight: '90dvh',
          padding: 'clamp(14px, 4vw, 22px)',
          background: '#ffffff',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          borderRadius: '24px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          border: '1.5px solid rgba(226, 232, 240, 0.9)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleCloseAndCancel}
          className="modal-close-btn"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
          }}>
            {currentMode === 'QUICK_MATCH' ? <Zap size={20} /> : <Users size={20} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>
              {currentMode === 'QUICK_MATCH' ? 'Online Quick Match' : 'Private Friend Match'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                {gameTitle} • Live Matchmaking
              </span>
            </div>
          </div>
        </div>

        {/* Private Room Mode Selector Tabs (Create Room vs Join with Code) */}
        {isPrivateMode && status !== 'SEARCHING' && status !== 'READY_TO_START' && status !== 'ERROR' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '14px',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={handleSwitchToCreatePrivate}
              style={{
                padding: '8px',
                borderRadius: '9px',
                border: 'none',
                background: privateTab === 'CREATE' ? '#FFFFFF' : 'transparent',
                color: privateTab === 'CREATE' ? '#2563EB' : '#64748B',
                fontWeight: '900',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: privateTab === 'CREATE' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Users size={14} />
              <span>Create Room</span>
            </button>

            <button
              type="button"
              onClick={handleSwitchToJoinPrivate}
              style={{
                padding: '8px',
                borderRadius: '9px',
                border: 'none',
                background: privateTab === 'JOIN' ? '#FFFFFF' : 'transparent',
                color: privateTab === 'JOIN' ? '#2563EB' : '#64748B',
                fontWeight: '900',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: privateTab === 'JOIN' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Key size={14} />
              <span>Join with Code</span>
            </button>
          </div>
        )}

        {/* Player Profile Identity Banner */}
        <div style={{
          background: '#f8fafc', padding: '9px 12px', borderRadius: '12px',
          border: '1.5px solid #e2e8f0', marginBottom: '14px'
        }}>
          {isEditingName ? (
            <form onSubmit={handleSaveNameChange} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>
                  YOUR DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={18}
                  placeholder="Enter name"
                  autoFocus
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: '8px',
                    border: '1.5px solid #2563eb', fontSize: '13px', fontWeight: '800',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>
                  CHOOSE AVATAR
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatarId(av.id)}
                      style={{
                        height: '28px', borderRadius: '6px',
                        background: av.color, color: '#ffffff',
                        border: avatarId === av.id ? '2px solid #0f172a' : 'none',
                        fontSize: '11px', fontWeight: '900', cursor: 'pointer'
                      }}
                    >
                      {playerName?.[0]?.toUpperCase() || 'P'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}
                >
                  Save Name
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="btn-secondary"
                  style={{ padding: '7px 10px', borderRadius: '8px', fontSize: '11px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: currentAvatar.color, color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '900', boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}>
                  {playerName?.[0]?.toUpperCase() || 'P'}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>
                    {playerName}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
                    Match Profile
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                style={{
                  background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb',
                  padding: '4px 8px', borderRadius: '6px', fontSize: '10px',
                  fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px'
                }}
              >
                <Edit3 size={10} />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>

        {/* 1. Searching Public Queue with Rolling Reel */}
        {status === 'SEARCHING' && (
          <div style={{ textAlign: 'center', padding: '16px 12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              background: '#0F172A',
              borderRadius: '20px',
              padding: '20px 16px',
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: '16px',
              border: '1px solid #1E293B',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)'
            }}>
              <ArcadeRollingLoader
                size="compact"
                message="Searching Match Pool..."
                submessage={`Scanning real-time queue for ${gameTitle}`}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '20px', background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857', fontSize: '11px', fontWeight: '800'
              }}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981] animate-pulse" />
                <span>{availablePlayersCount} {availablePlayersCount === 1 ? 'Player' : 'Players'} Online</span>
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '20px', background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#2563eb', fontSize: '11px', fontWeight: '800'
              }}>
                <Clock size={12} />
                <span>Time: {searchSecondsLeft}s</span>
              </div>
            </div>

            <div>
              <button
                onClick={handleCloseAndCancel}
                className="btn-secondary"
                style={{ padding: '8px 20px', fontSize: '12px', borderRadius: '10px', fontWeight: '800' }}
              >
                Cancel Search
              </button>
            </div>
          </div>
        )}

        {/* 2. No Players Found Timeout Screen */}
        {status === 'NO_PLAYERS_FOUND' && (
          <div style={{ textAlign: 'center', padding: '12px 8px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: '#fffbeb', color: '#d97706',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px', border: '1.5px solid #fde68a'
            }}>
              <Clock size={22} />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
              No Active Players in Queue
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
              No opponents matched within 25s. How would you like to play?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => startMatchmakingFlow('QUICK_MATCH', playerName, avatarId)}
                className="btn-primary"
                style={{
                  padding: '11px', borderRadius: '12px', fontSize: '13px', fontWeight: '800',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <RefreshCw size={14} />
                <span>Search Again (25s)</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onLaunchAiGame) onLaunchAiGame();
                }}
                className="btn-secondary"
                style={{
                  padding: '11px', borderRadius: '12px', fontSize: '13px', fontWeight: '800',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1'
                }}
              >
                <Bot size={15} />
                <span>Play Against AI Bot</span>
              </button>

              <button
                onClick={handleSwitchToCreatePrivate}
                className="btn-secondary"
                style={{
                  padding: '11px', borderRadius: '12px', fontSize: '13px', fontWeight: '800',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  borderColor: '#cbd5e1'
                }}
              >
                <Users size={15} />
                <span>Create Room for a Friend</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Host: Waiting in Private Room (Room Code + Real QR Code Pills) */}
        {status === 'WAITING_PRIVATE' && privateTab === 'CREATE' && (
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            {/* Format Sub-Pill Selector (Code vs QR Code) */}
            <div style={{
              display: 'inline-flex',
              background: '#F1F5F9',
              padding: '3px',
              borderRadius: '10px',
              marginBottom: '12px',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => setShareFormat('CODE')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: shareFormat === 'CODE' ? '#FFFFFF' : 'transparent',
                  color: shareFormat === 'CODE' ? '#2563EB' : '#64748B',
                  fontWeight: '800',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: shareFormat === 'CODE' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <Key size={12} />
                <span>Room Code</span>
              </button>

              <button
                type="button"
                onClick={() => setShareFormat('QR')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: shareFormat === 'QR' ? '#FFFFFF' : 'transparent',
                  color: shareFormat === 'QR' ? '#2563EB' : '#64748B',
                  fontWeight: '800',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: shareFormat === 'QR' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <QrCode size={12} />
                <span>QR Code</span>
              </button>
            </div>

            {/* View A: Room Code Display */}
            {shareFormat === 'CODE' && (
              <div style={{
                background: '#f8fafc', borderRadius: '16px', padding: '16px 12px',
                border: '1.5px dashed #cbd5e1', marginBottom: '14px'
              }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  SHARE 6-LETTER ROOM CODE
                </span>
                <div style={{
                  fontSize: '32px', fontWeight: '900', color: '#0f172a',
                  fontFamily: 'var(--font-mono)', letterSpacing: '6px', margin: '6px 0'
                }}>
                  {roomData?.roomCode || '...'}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    style={{
                      padding: '8px 14px', fontSize: '11px', borderRadius: '8px',
                      background: copiedCode ? '#10b981' : '#FFFFFF', color: copiedCode ? '#FFFFFF' : '#1E293B',
                      display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #CBD5E1',
                      fontWeight: '800', cursor: 'pointer'
                    }}
                  >
                    {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      padding: '8px 14px', fontSize: '11px', borderRadius: '8px',
                      background: copiedLink ? '#10b981' : '#2563eb', color: '#ffffff',
                      display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none',
                      fontWeight: '800', cursor: 'pointer'
                    }}
                  >
                    {copiedLink ? <Check size={13} /> : <Sparkles size={13} />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* View B: Real Dynamic QR Code Display */}
            {shareFormat === 'QR' && (
              <div style={{
                background: '#f8fafc', borderRadius: '16px', padding: '16px 12px',
                border: '1.5px solid #cbd5e1', marginBottom: '14px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
              }}>
                <div style={{
                  padding: '10px', background: '#FFFFFF', borderRadius: '12px',
                  border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                  {inviteUrl ? (
                    <QRCodeSVG
                      value={inviteUrl}
                      size={150}
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                      Generating QR...
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: '#475569', fontWeight: '700' }}>
                  Scan with smartphone camera to join instantly!
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
              <RefreshCw size={13} className="animate-spin" />
              <span>Waiting for friend to enter code or scan QR...</span>
            </div>
          </div>
        )}

        {/* 4. Guest: Join by Code Form with Real-time Game Verification */}
        {((status === 'JOINING' || privateTab === 'JOIN') && status !== 'SEARCHING') && (
          <form onSubmit={handleJoinSubmit} style={{ padding: '4px 0' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                ENTER 6-LETTER ROOM CODE
              </label>
              <input
                type="text"
                maxLength={6}
                value={joinTokenInput}
                onChange={(e) => setJoinTokenInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. A8X9K2"
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  border: detectedRoom?.exists ? '2px solid #10B981' : '2px solid #cbd5e1',
                  fontSize: '22px', fontWeight: '900', textAlign: 'center', letterSpacing: '5px',
                  fontFamily: 'var(--font-mono)', outline: 'none', background: '#f8fafc',
                  color: '#0F172A', boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            {/* Real-time Room Verification & Mismatch Guard */}
            {isDetectingRoom && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748B', fontSize: '11px', fontWeight: '700', marginBottom: '12px' }}>
                <RefreshCw size={12} className="animate-spin" />
                <span>Checking room code on server...</span>
              </div>
            )}

            {detectedRoom && detectedRoom.exists && (
              <div style={{
                background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: '12px',
                padding: '10px 12px', marginBottom: '14px', textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065F46', fontSize: '12px', fontWeight: '800' }}>
                  <CheckCircle size={14} color="#10B981" />
                  <span>Found Room: {GAME_TITLES[detectedRoom.gameSlug] || detectedRoom.gameSlug}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#047857', fontWeight: '600', marginTop: '2px' }}>
                  Hosted by <strong>{detectedRoom.hostName}</strong> • {detectedRoom.status === 'WAITING' ? 'Waiting for opponent' : 'In progress'}
                </div>
                {detectedRoom.gameSlug !== gameId && (
                  <div style={{ fontSize: '10px', color: '#B45309', fontWeight: '800', marginTop: '4px', background: '#FEF3C7', padding: '3px 6px', borderRadius: '6px' }}>
                    ℹ️ You will be automatically routed to {GAME_TITLES[detectedRoom.gameSlug] || detectedRoom.gameSlug}!
                  </div>
                )}
              </div>
            )}

            {detectedRoom && !detectedRoom.exists && joinTokenInput.trim().length >= 4 && !isDetectingRoom && (
              <div style={{ color: '#DC2626', fontSize: '11px', fontWeight: '700', marginBottom: '12px', textAlign: 'center' }}>
                ⚠️ Room not found or code expired. Please double-check the code.
              </div>
            )}

            <button
              type="submit"
              disabled={joinTokenInput.trim().length < 4}
              className="btn-enterprise"
              style={{
                width: '100%', padding: '13px', borderRadius: '12px',
                background: joinTokenInput.trim().length >= 4 ? '#2563eb' : '#94a3b8',
                color: '#ffffff', fontSize: '14px', fontWeight: '800', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                cursor: joinTokenInput.trim().length >= 4 ? 'pointer' : 'not-allowed'
              }}
            >
              <span>Connect to Match</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* 5. Error State */}
        {status === 'ERROR' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: '700', marginBottom: '14px', wordBreak: 'break-word' }}>
              {errorMessage || 'An error occurred during matchmaking.'}
            </div>
            <button
              onClick={() => {
                setStatus('INITIALIZING');
                setErrorMessage('');
                onClose();
              }}
              className="btn-enterprise"
              style={{
                padding: '10px 24px', borderRadius: '10px',
                background: '#0f172a', color: '#ffffff', fontSize: '13px', border: 'none'
              }}
            >
              Close & Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

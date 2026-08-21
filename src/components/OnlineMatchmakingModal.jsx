import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Zap, Users, Copy, Check, ShieldCheck, 
  ArrowRight, Radio, RefreshCw, Trophy, Crown, Play, Edit3, User, Bot, Clock, AlertTriangle, Globe
} from 'lucide-react';
import ArcadeRollingLoader from './ArcadeRollingLoader.jsx';


import { matchmakingService } from '../services/matchmakingService.js';
import { realtimeManager } from '../services/realtimeManager.js';
import { presenceService } from '../services/presenceService.js';
import { AVATARS, saveUserProfile } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';
import { getSupabase } from '../utils/supabaseClient.js';
import { formatErrorMessage } from '../utils/errorHandler.js';

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
  const [isEditingName, setIsEditingName] = useState(false);
  const initialName = currentUserProfile?.display_name || currentUserProfile?.name || currentUserProfile?.username || (currentUserProfile?.email ? currentUserProfile.email.split('@')[0] : 'Player');
  const [playerName, setPlayerName] = useState(initialName);
  const [avatarId, setAvatarId] = useState(currentUserProfile?.avatarId || '1');
  const [availablePlayersCount, setAvailablePlayersCount] = useState(() => presenceService.getOnlineCount());

  const [status, setStatus] = useState('INITIALIZING'); // 'SEARCHING', 'WAITING_PRIVATE', 'JOINING', 'READY_TO_START', 'NO_PLAYERS_FOUND', 'ERROR'
  const [searchSecondsLeft, setSearchSecondsLeft] = useState(25);
  const [roomData, setRoomData] = useState(null);
  const [joinTokenInput, setJoinTokenInput] = useState('');
  const [copied, setCopied] = useState(false);
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
    onLaunchOnlineGame({
      matchId: lobbyInfo.matchId,
      roomId: lobbyInfo.roomId,
      myRole: lobbyInfo.myRole,
      opponent: lobbyInfo.opponent
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

  // Reset and auto-start matchmaking on open
  useEffect(() => {
    if (!isOpen) {
      isCancelledRef.current = true;
      setStatus('INITIALIZING');
      setRoomData(null);
      setMatchLobbyData(null);
      setSearchSecondsLeft(25);
      return;
    }

    isCancelledRef.current = false;
    setCurrentMode(mode);
    setSearchSecondsLeft(25);
    setCountdown(12);

    const activeName = currentUserProfile?.display_name || currentUserProfile?.name || currentUserProfile?.username || (currentUserProfile?.email ? currentUserProfile.email.split('@')[0] : 'Player');
    setPlayerName(activeName);
    setAvatarId(currentUserProfile?.avatarId || '1');

    startMatchmakingFlow(mode, activeName, currentUserProfile?.avatarId || '1');

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
          const realOpponent = result.opponent || { name: 'Challenger', avatarId: '1', rating: 1200 };

          const lobby = {
            matchId,
            roomId,
            myRole: result.role || 'O',
            opponent: realOpponent
          };

          setMatchLobbyData(lobby);
          setStatus('READY_TO_START');
          soundSynth.playVictory();

          // Broadcast instant player_joined event to Host
          realtimeManager.broadcastToRoom(roomId, 'player_joined', {
            match_id: matchId,
            room_id: roomId,
            opponent: {
              name: currentName,
              avatarId: currentAv,
              rating: currentUserProfile?.rating || 1200
            }
          });

          realtimeManager.subscribeToRoom(roomId, currentUserProfile?.id, {
            onGameStartRequested: () => {
              triggerLaunchGame(lobby);
            }
          });

        } else if (result?.status === 'WAITING' || result?.room) {
          const currentRoom = result.room || { id: result.room_id, roomCode: result.room_code };
          setRoomData(currentRoom);
          setStatus('SEARCHING');

          realtimeManager.subscribeToRoom(currentRoom.id, currentUserProfile?.id, {
            onPlayerJoined: (payload) => {
              const opp = payload?.opponent || {};
              const oppName = opp.name || opp.display_name || (opp.username ? `@${opp.username}` : 'Challenger');
              const lobby = {
                matchId: payload.match_id,
                roomId: currentRoom.id,
                myRole: 'X',
                opponent: {
                  name: oppName,
                  avatarId: opp.avatarId || '2',
                  rating: opp.rating || 1200
                }
              };
              setMatchLobbyData(lobby);
              setStatus('READY_TO_START');
              soundSynth.playVictory();
            },
            onGameStartRequested: () => {
              triggerLaunchGame(matchLobbyDataRef.current);
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
              const oppName = opp.name || opp.display_name || (opp.username ? `@${opp.username}` : 'Challenger');
              const lobby = {
                matchId: payload.match_id,
                roomId: currentRoom.id,
                myRole: 'X',
                opponent: {
                  name: oppName,
                  avatarId: opp.avatarId || '2',
                  rating: opp.rating || 1200
                }
              };
              setMatchLobbyData(lobby);
              setStatus('READY_TO_START');
              soundSynth.playVictory();
            },
            onGameStartRequested: () => {
              triggerLaunchGame(matchLobbyDataRef.current);
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

  useEffect(() => {
    if (status !== 'READY_TO_START') return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerLaunchGame(matchLobbyDataRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const handleJoinSubmit = async (e) => {
    e?.preventDefault();
    if (!joinTokenInput.trim()) return;

    setStatus('SEARCHING');
    try {
      const result = await matchmakingService.joinRoom(
        joinTokenInput.trim().toUpperCase(),
        currentUserProfile?.id,
        playerName,
        avatarId
      );

      if (result?.match_id || result?.matchId) {
        const matchId = result.match_id || result.matchId;
        const roomId = result.room_id || result.roomId;
        const realOpponent = result.opponent || { name: 'Host Player', avatarId: '1', rating: 1200 };

        const lobby = {
          matchId,
          roomId,
          myRole: 'O',
          opponent: realOpponent
        };

        setMatchLobbyData(lobby);
        setStatus('READY_TO_START');
        soundSynth.playVictory();

        realtimeManager.broadcastToRoom(roomId, 'player_joined', {
          match_id: matchId,
          room_id: roomId,
          opponent: {
            name: playerName,
            avatarId: avatarId,
            rating: 1200
          }
        });

        realtimeManager.subscribeToRoom(roomId, currentUserProfile?.id, {
          onGameStartRequested: () => {
            triggerLaunchGame(lobby);
          }
        });
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

  const handleManualStartClick = async () => {
    if (!matchLobbyData?.roomId) return;
    soundSynth.playVictory();
    await realtimeManager.broadcastToRoom(matchLobbyData.roomId, 'start_game', {});
    triggerLaunchGame(matchLobbyData);
  };

  const handleCopyLink = () => {
    if (!roomData?.roomCode) return;
    const inviteUrl = `${window.location.origin}/?join=${roomData.roomCode}&game=${gameId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    soundSynth.playRotate();
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const currentAvatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  const opponentAvatar = AVATARS.find(a => a.id === matchLobbyData?.opponent?.avatarId) || AVATARS[1];

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
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
          padding: 'clamp(14px, 4vw, 24px)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
          }}>
            <Zap size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>
              {currentMode === 'QUICK_MATCH' && 'Online Quick Match'}
              {currentMode === 'CREATE_PRIVATE' && 'Create Private Room'}
              {currentMode === 'JOIN_PRIVATE' && 'Join Private Match'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                {gameTitle} • Live Matchmaking
              </span>
            </div>
          </div>
        </div>

        {/* Player Profile Identity Banner */}
        <div style={{
          background: '#f8fafc', padding: '10px 14px', borderRadius: '14px',
          border: '1.5px solid #e2e8f0', marginBottom: '18px'
        }}>
          {isEditingName ? (
            <form onSubmit={handleSaveNameChange} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>
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
                    width: '100%', padding: '8px 12px', borderRadius: '8px',
                    border: '1.5px solid #2563eb', fontSize: '14px', fontWeight: '800',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>
                  CHOOSE AVATAR
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatarId(av.id)}
                      style={{
                        height: '32px', borderRadius: '6px',
                        background: av.color, color: '#ffffff',
                        border: avatarId === av.id ? '2px solid #0f172a' : 'none',
                        fontSize: '12px', fontWeight: '900', cursor: 'pointer'
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
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}
                >
                  Save Name
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: currentAvatar.color, color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '900', boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}>
                  {playerName?.[0]?.toUpperCase() || 'P'}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>
                    {playerName || 'Player'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                    Match Profile
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                style={{
                  background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb',
                  padding: '5px 10px', borderRadius: '8px', fontSize: '11px',
                  fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Edit3 size={11} />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>

        {/* 1. Searching Public Queue with Smooth Arcade Game Icons Rolling Reel */}
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
                message="Searching Ranked Queue..."
                submessage={`Scanning 1v1 match pool for ${gameTitle}`}
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
              width: '52px', height: '52px', borderRadius: '50%',
              background: '#fffbeb', color: '#d97706',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', border: '1.5px solid #fde68a'
            }}>
              <Clock size={24} />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>
              No Active Players in Queue
            </h4>
            <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
              No opponents connected within 25 seconds. Choose how you'd like to play:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => startMatchmakingFlow('QUICK_MATCH', playerName, avatarId)}
                className="btn-primary"
                style={{
                  padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '800',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <RefreshCw size={15} />
                <span>Search Again (25s)</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onLaunchAiGame) onLaunchAiGame();
                }}
                className="btn-secondary"
                style={{
                  padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '800',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1'
                }}
              >
                <Bot size={16} />
                <span>Play Against Master AI</span>
              </button>

              <button
                onClick={() => {
                  setCurrentMode('CREATE_PRIVATE');
                  startMatchmakingFlow('CREATE_PRIVATE', playerName, avatarId);
                }}
                className="btn-secondary"
                style={{
                  padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '800',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  borderColor: '#cbd5e1'
                }}
              >
                <Users size={16} />
                <span>Create Room for a Friend</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Waiting in Private Room */}
        {status === 'WAITING_PRIVATE' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              background: '#f8fafc', borderRadius: '16px', padding: '18px',
              border: '1.5px dashed #cbd5e1', marginBottom: '16px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.1em' }}>
                SHARE 6-LETTER ROOM CODE
              </span>
              <div style={{
                fontSize: '34px', fontWeight: '900', color: '#0f172a',
                fontFamily: 'var(--font-mono)', letterSpacing: '6px', margin: '8px 0'
              }}>
                {roomData?.roomCode || '...'}
              </div>
              <button
                onClick={handleCopyLink}
                className="btn-enterprise"
                style={{
                  padding: '10px 18px', fontSize: '13px', borderRadius: '10px',
                  background: copied ? '#10b981' : '#2563eb', color: '#ffffff',
                  display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none'
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Link Copied to Clipboard!' : 'Copy Direct Invite Link'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}>
              <RefreshCw size={14} className="animate-spin" />
              <span>Waiting for friend to enter code...</span>
            </div>
          </div>
        )}

        {/* 4. Join by Code Form */}
        {status === 'JOINING' && (
          <form onSubmit={handleJoinSubmit} style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                ENTER 6-LETTER ROOM CODE
              </label>
              <input
                type="text"
                maxLength={6}
                value={joinTokenInput}
                onChange={(e) => setJoinTokenInput(e.target.value.toUpperCase())}
                placeholder="e.g. A8X9K2"
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px',
                  border: '2px solid #cbd5e1', fontSize: '20px',
                  fontWeight: '900', textAlign: 'center', letterSpacing: '4px',
                  fontFamily: 'var(--font-mono)', outline: 'none', background: '#f8fafc',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={joinTokenInput.trim().length < 4}
              className="btn-enterprise"
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: joinTokenInput.trim().length >= 4 ? '#2563eb' : '#94a3b8',
                color: '#ffffff', fontSize: '14px', fontWeight: '800', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <span>Connect to Match</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* 5. Match Ready VS Battle Lobby */}
        {status === 'READY_TO_START' && matchLobbyData && (
          <div style={{ padding: '6px 0', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '20px',
              background: '#ecfdf5', color: '#059669', fontSize: '12px', fontWeight: '800',
              marginBottom: '16px'
            }}>
              <ShieldCheck size={16} />
              <span>MATCH CONNECTED & SYNCED</span>
            </div>

            {/* VS Battle Cards */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px',
              alignItems: 'center', margin: '6px 0 20px'
            }}>
              {/* Player 1 (You) */}
              <div style={{
                background: '#f8fafc', padding: '16px 12px', borderRadius: '16px',
                border: '1.5px solid #cbd5e1', textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: currentAvatar.color, color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: '900', margin: '0 auto 8px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                  {playerName?.[0]?.toUpperCase() || 'P1'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>
                  {playerName || 'Player 1'}
                </div>
                <div style={{
                  display: 'inline-block', fontSize: '11px', color: '#2563eb',
                  fontWeight: '800', marginTop: '4px', background: '#eff6ff',
                  padding: '2px 8px', borderRadius: '6px'
                }}>
                  {matchLobbyData.myRole === 'X' ? 'Turn 1 (Moves First)' : 'Turn 2 (Moves Second)'}
                </div>
              </div>

              {/* VS Emblem */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: '#0f172a', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '900',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                VS
              </div>

              {/* Player 2 (Opponent) */}
              <div style={{
                background: '#f8fafc', padding: '16px 12px', borderRadius: '16px',
                border: '1.5px solid #cbd5e1', textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: opponentAvatar.color, color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: '900', margin: '0 auto 8px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                  {matchLobbyData.opponent?.name?.[0]?.toUpperCase() || 'P2'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>
                  {matchLobbyData.opponent?.name || 'Player 2'}
                </div>
                <div style={{
                  display: 'inline-block', fontSize: '11px', color: '#64748b',
                  fontWeight: '800', marginTop: '4px', background: '#f1f5f9',
                  padding: '2px 8px', borderRadius: '6px'
                }}>
                  {matchLobbyData.myRole === 'X' ? 'Turn 2 (Moves Second)' : 'Turn 1 (Moves First)'}
                </div>
              </div>
            </div>


            <button
              onClick={handleManualStartClick}
              className="btn-enterprise animate-pulse"
              style={{
                width: '100%', padding: '14px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff', fontSize: '15px', fontWeight: '900', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Play size={17} fill="#ffffff" />
              <span>START MATCH NOW ({countdown}s)</span>
            </button>
          </div>
        )}

        {/* 6. Error State */}
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

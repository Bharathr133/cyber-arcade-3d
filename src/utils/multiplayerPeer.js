import { Peer } from 'peerjs';
import { securityEngine } from './securityEngine.js';

const PEER_OPTIONS = {
  debug: 0,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' }
    ]
  }
};

class StandardMultiplayer {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.role = 'P1'; // 'P1' (Host) or 'P2' (Guest)
    this.roomId = null;
    this.isConnected = false;
    this.handlers = {
      onMove: null,
      onReset: null,
      onConnect: null,
      onDisconnect: null,
      onStartMatch: null,
      onPeerProfile: null,
      onSettingsChange: null
    };
    this.heartbeatInterval = null;
  }

  setHandlers(handlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  // Host creates room & returns QR Code URL
  createRoom(gameType, handlers = {}) {
    this.cleanup();
    this.role = 'P1';
    this.setHandlers(handlers);

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    this.roomId = `room-${gameType}-${randomCode}`;

    try {
      this.peer = new Peer(this.roomId, PEER_OPTIONS);

      this.peer.on('connection', (connection) => {
        this.conn = connection;
        this.setupConnection();
      });

      this.peer.on('error', (err) => {
        console.warn('Host peer notice:', err);
      });
    } catch (e) {
      console.error('Failed to create host peer:', e);
    }

    const origin = window.location.origin;
    const shareUrl = `${origin}/?join=${this.roomId}&game=${gameType}`;

    return { roomId: this.roomId, shareUrl, code: randomCode.toString() };
  }

  // Guest joins by scanning QR Code / Opening Link
  joinRoom(roomId, handlers = {}) {
    this.cleanup();

    if (!securityEngine.validateRoomId(roomId)) {
      console.error('🛑 Security Alert: Malformed Room ID rejected.');
      return;
    }

    this.role = 'P2';
    this.roomId = roomId;
    this.setHandlers(handlers);

    try {
      this.peer = new Peer(PEER_OPTIONS);

      this.peer.on('open', () => {
        this.conn = this.peer.connect(roomId, {
          reliable: true
        });
        this.setupConnection();
      });

      this.peer.on('error', (err) => {
        console.warn('Guest peer notice:', err);
      });
    } catch (e) {
      console.error('Failed to connect to host:', e);
    }
  }

  setupConnection() {
    if (!this.conn) return;

    this.conn.on('open', () => {
      this.isConnected = true;
      if (this.handlers.onConnect) this.handlers.onConnect(this.role);

      // Start ping heartbeat
      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = setInterval(() => {
        if (this.conn && this.conn.open) {
          try { this.conn.send({ type: 'PING' }); } catch (e) {}
        }
      }, 5000);
    });

    this.conn.on('data', (data) => {
      if (!data || typeof data !== 'object') return;

      // Ignore internal keep-alive ping
      if (data.type === 'PING') return;

      // Rate limit check
      if (!securityEngine.checkRateLimit()) return;

      if (data.type === 'MOVE' && this.handlers.onMove) {
        this.handlers.onMove(data.payload);
      } else if (data.type === 'RESET' && this.handlers.onReset) {
        this.handlers.onReset();
      } else if (data.type === 'START_MATCH' && this.handlers.onStartMatch) {
        this.handlers.onStartMatch(data.payload);
      } else if (data.type === 'PEER_PROFILE' && this.handlers.onPeerProfile) {
        this.handlers.onPeerProfile(data.payload);
      } else if (data.type === 'SETTINGS_CHANGE' && this.handlers.onSettingsChange) {
        this.handlers.onSettingsChange(data.payload);
      }
    });

    this.conn.on('close', () => {
      this.isConnected = false;
      if (this.handlers.onDisconnect) this.handlers.onDisconnect();
    });

    this.conn.on('error', () => {
      this.isConnected = false;
      if (this.handlers.onDisconnect) this.handlers.onDisconnect();
    });
  }

  sendMove(payload) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send({ type: 'MOVE', payload });
      } catch (e) {
        console.error('Failed to send move over WebRTC:', e);
      }
    }
  }

  sendReset() {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send({ type: 'RESET' });
      } catch (e) {
        console.error('Failed to send reset over WebRTC:', e);
      }
    }
  }

  sendStartMatch(payload) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send({ type: 'START_MATCH', payload });
      } catch (e) {
        console.error('Failed to send start match over WebRTC:', e);
      }
    }
  }

  sendPeerProfile(payload) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send({ type: 'PEER_PROFILE', payload });
      } catch (e) {
        console.error('Failed to send peer profile over WebRTC:', e);
      }
    }
  }

  sendSettingsChange(payload) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send({ type: 'SETTINGS_CHANGE', payload });
      } catch (e) {
        console.error('Failed to send settings change over WebRTC:', e);
      }
    }
  }

  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.conn) {
      try { this.conn.close(); } catch (e) {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    this.roomId = null;
    this.isConnected = false;
  }
}

export const standardMultiplayer = new StandardMultiplayer();

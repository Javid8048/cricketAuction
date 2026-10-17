import { io, Socket } from 'socket.io-client';
import { getBackendUrl } from './api';

class SocketService {
  public socket: Socket | null = null;
  private keepaliveTimer: any = null;

  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket && !this.socket.connected) {
      this.socket.connect();
      return this.socket;
    }

    const token = typeof window !== 'undefined' ? sessionStorage.getItem('caa_token') : null;

    this.socket = io(getBackendUrl(), {
      transports: ['websocket', 'polling'],
      auth: { token: token || '' },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Connected to Cricket Auction Arena Real-time Server (Socket ID:', this.socket?.id, ')');
      this.startKeepalive();
      const currentToken = typeof window !== 'undefined' ? sessionStorage.getItem('caa_token') : null;
      if (currentToken) {
        this.socket?.emit('auth:sync', { token: currentToken });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Disconnected from Arena Server:', reason);
      this.stopKeepalive();
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
    });

    return this.socket;
  }

  // Called immediately after login to ensure long-lasting authenticated connection
  public authenticate(token: string) {
    if (!this.socket) {
      this.connect();
    } else {
      (this.socket as any).auth = { token };
      if (!this.socket.connected) {
        this.socket.connect();
      } else {
        this.socket.emit('auth:sync', { token });
      }
    }
    this.startKeepalive();
  }

  // Long-lasting heartbeat ping every 20 seconds prevents proxy/Render timeouts
  private startKeepalive() {
    this.stopKeepalive();
    this.keepaliveTimer = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping:keepalive');
      }
    }, 20000);
  }

  private stopKeepalive() {
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }

  public disconnect() {
    this.stopKeepalive();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public emitBid(amount?: number) {
    const token = sessionStorage.getItem('caa_token');
    if (this.socket) {
      this.socket.emit('bid:place', { token, amount });
    }
  }
}

export const socketService = new SocketService();

import { INITIAL_PLAYERS, INITIAL_TEAMS } from '../data/initial-data';

export function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    // 1. User manual override from UI settings modal
    const stale = localStorage.getItem('caa_backend_url'); if (stale && stale.indexOf('onrender.com') !== -1) { localStorage.removeItem('caa_backend_url'); }
    const saved = sessionStorage.getItem('caa_backend_url') || localStorage.getItem('caa_backend_url');
    if (saved) return saved.trim().replace(/\/+$/, '');

    // 2. Auto-detect local network IP or localhost vs remote (GitHub Pages)
    const hostname = window.location.hostname;
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

    if (isLocal) {
      return `http://${hostname}:5000`;
    }
  }

  // 3. Vite environment variable override
  const env = (import.meta as any).env;
  if (env && env.VITE_API_URL) {
    return (env.VITE_API_URL as string).trim().replace(/\/+$/, '');
  }

  // 4. Production remote default (Render)
  return 'https://enclosed-walks-flight-hong.trycloudflare.com';
}

export function getApiBaseUrl(): string {
  return `${getBackendUrl()}/api`;
}

class ApiService {
  private getHeaders(): HeadersInit {
    const token = sessionStorage.getItem('caa_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMsg = 'API request failed';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (e) {
        errorMsg = response.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }
    return response.json();
  }

  // Health check for Render / backend server
  async checkHealth(timeoutMs = 10000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${getBackendUrl()}/health`, {
        signal: controller.signal,
      });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        return data.status === 'ok';
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse<{ token: string; user: any }>(res);
  }

  async getCurrentUser() {
    const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<{ user: any }>(res);
  }

  // Players
  async getPlayers(params?: Record<string, string>) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${getApiBaseUrl()}/players${query ? `?${query}` : ''}`, {
        headers: this.getHeaders(),
      });
      return await this.handleResponse<any[]>(res);
    } catch (err) {
      console.warn('Backend /players unreachable. Serving fallback registry pool.');
      return INITIAL_PLAYERS;
    }
  }

  async getPlayerById(id: string) {
    try {
      const res = await fetch(`${getApiBaseUrl()}/players/${id}`, {
        headers: this.getHeaders(),
      });
      return await this.handleResponse<any>(res);
    } catch (err) {
      const fallback = INITIAL_PLAYERS.find((p) => p.id === id);
      if (fallback) return fallback;
      throw err;
    }
  }

  async createPlayer(data: any) {
    const res = await fetch(`${getApiBaseUrl()}/players`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(res);
  }

  async updatePlayer(id: string, data: any) {
    const res = await fetch(`${getApiBaseUrl()}/players/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(res);
  }

  async deletePlayer(id: string) {
    const res = await fetch(`${getApiBaseUrl()}/players/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  // Teams
  async getTeams() {
    try {
      const res = await fetch(`${getApiBaseUrl()}/teams`, {
        headers: this.getHeaders(),
      });
      return await this.handleResponse<any[]>(res);
    } catch (err) {
      console.warn('Backend /teams unreachable. Serving fallback team pool.');
      return INITIAL_TEAMS;
    }
  }

  async getTeamById(id: string) {
    const res = await fetch(`${getApiBaseUrl()}/teams/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async updateTeam(id: string, data: any) {
    const res = await fetch(`${getApiBaseUrl()}/teams/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(res);
  }

  // Auction
  async getCurrentAuction() {
    const res = await fetch(`${getApiBaseUrl()}/auction/current`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async placeBid(amount?: number, teamId?: string) {
    const res = await fetch(`${getApiBaseUrl()}/auction/bid`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amount, teamId }),
    });
    return this.handleResponse<any>(res);
  }

  async startAuction() {
    const res = await fetch(`${getApiBaseUrl()}/auction/start`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async pauseAuction() {
    const res = await fetch(`${getApiBaseUrl()}/auction/pause`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async resumeAuction() {
    const res = await fetch(`${getApiBaseUrl()}/auction/resume`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async selectPlayer(playerId: string) {
    const res = await fetch(`${getApiBaseUrl()}/auction/select`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ playerId }),
    });
    return this.handleResponse<any>(res);
  }

  async startBidding() {
    const res = await fetch(`${getApiBaseUrl()}/auction/start-bidding`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async nextPlayer() {
    const res = await fetch(`${getApiBaseUrl()}/auction/next`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async sellPlayer(teamId?: string, price?: number) {
    const res = await fetch(`${getApiBaseUrl()}/auction/sell`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ teamId, price }),
    });
    return this.handleResponse<any>(res);
  }

  async manuallyAssignPlayer(playerId: string, teamId: string, amount: number) {
    const res = await fetch(`${getApiBaseUrl()}/auction/assign-player`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ playerId, teamId, amount }),
    });
    return this.handleResponse<any>(res);
  }

  async markUnsold() {
    const res = await fetch(`${getApiBaseUrl()}/auction/unsold`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async skipPlayer() {
    const res = await fetch(`${getApiBaseUrl()}/auction/skip`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async reauctionUnsold() {
    const res = await fetch(`${getApiBaseUrl()}/auction/reauction`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async resetAuction() {
    const res = await fetch(`${getApiBaseUrl()}/auction/reset`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async shuffleAuctionPool() {
    const res = await fetch(`${getApiBaseUrl()}/auction/shuffle`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async getAuctionHistory(teamId?: string, playerId?: string) {
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId);
    if (playerId) params.append('playerId', playerId);
    const query = params.toString();

    const res = await fetch(`${getApiBaseUrl()}/auction/history${query ? `?${query}` : ''}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async getAuctionResults() {
    const res = await fetch(`${getApiBaseUrl()}/auction/results`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async getDashboardStats() {
    const res = await fetch(`${getApiBaseUrl()}/auction/stats`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  // Public Player Registration
  async registerPlayerPublic(data: any) {
    const res = await fetch(`${getApiBaseUrl()}/players/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(res);
  }

  // Admin Reset Password
  async resetPassword(newPassword: string, currentPassword?: string) {
    const res = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ newPassword, currentPassword }),
    });
    return this.handleResponse<any>(res);
  }

  // Admin Auction Settings
  async updateAuctionSettings(settings: any) {
    const res = await fetch(`${getApiBaseUrl()}/auction/settings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    return this.handleResponse<any>(res);
  }

  // Team Management
  async createTeam(data: any) {
    const res = await fetch(`${getApiBaseUrl()}/teams`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(res);
  }

  async deleteTeam(id: string) {
    const res = await fetch(`${getApiBaseUrl()}/teams/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  async deleteAllTeams() {
    const res = await fetch(`${getApiBaseUrl()}/teams/all`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }

  // Icon Player Assignment
  async assignIconPlayer(teamId: string, playerId: string, iconPrice?: number) {
    const res = await fetch(`${getApiBaseUrl()}/teams/${teamId}/assign-icon`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ playerId, iconPrice }),
    });
    return this.handleResponse<any>(res);
  }

  async removeIconPlayer(teamId: string, playerId: string) {
    const res = await fetch(`${getApiBaseUrl()}/teams/${teamId}/remove-icon`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ playerId }),
    });
    return this.handleResponse<any>(res);
  }

  // Team Credentials (Admin only)
  async getTeamCredentials() {
    const res = await fetch(`${getApiBaseUrl()}/teams/admin/credentials`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<any[]>(res);
  }

  async getFranchiseCredentials() {
    return this.getTeamCredentials();
  }

  async updateTeamCredentials(teamId: string, data: { loginUsername?: string; loginPassword?: string }) {
    const res = await fetch(`${getApiBaseUrl()}/teams/${teamId}/credentials`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(res);
  }

  async updateFranchiseCredentials(teamId: string, data: { loginUsername?: string; loginPassword?: string }) {
    return this.updateTeamCredentials(teamId, data);
  }

  // Reset / Clear All Tournament Data
  async clearAllTournamentData() {
    const res = await fetch(`${getApiBaseUrl()}/auction/clear-all`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(res);
  }
}

export const api = new ApiService();

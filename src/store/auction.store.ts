import { create } from 'zustand';
import confetti from 'canvas-confetti';
import { AuctionState, Player, Team, Bid } from '../types';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import { sound } from '../utils/sound';
import { INITIAL_TEAMS, INITIAL_PLAYERS } from '../data/initial-data';
import { getMinBidIncrement, formatRupees } from '../utils/currency';
import { useAuthStore } from './auth.store';

interface SoldOverlay {
  player: Player;
  winningTeam: Team;
  finalPrice: number;
  formattedPrice: string;
}

interface UnsoldOverlay {
  player: Player;
  basePrice: number;
  formattedBasePrice: string;
}

interface AuctionStore {
  state: AuctionState | null;
  secondsLeft: number;
  isTimerWarning: boolean;
  isTimerUrgent: boolean;
  isConnected: boolean;
  isStandaloneMode: boolean;
  isBidding: boolean;
  lastBidFlash: boolean;
  soldOverlay: SoldOverlay | null;
  unsoldOverlay: UnsoldOverlay | null;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  soundMuted: boolean;

  // Actions
  initState: () => Promise<void>;
  setPlayers: (players: Player[]) => void;
  refreshPlayers: () => Promise<void>;
  initSocketListeners: () => void;
  placeBid: (amount?: number, teamId?: string) => Promise<void>;
  dismissOverlay: () => void;
  toggleSound: () => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  startStandaloneTimer: () => void;
  stopStandaloneTimer: () => void;
  adminActionStandalone: (action: string, payload?: any) => Promise<void>;
  manuallyAssignPlayer: (playerId: string, teamId: string, amount: number) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  deleteAllTeams: () => Promise<void>;
}

const mergeIncomingState = (incoming: AuctionState, curState: AuctionState | null): AuctionState => {
  if (!incoming) return curState as any;
  const players = incoming.players && incoming.players.length > 0
    ? incoming.players
    : (curState?.players && curState.players.length > 0 ? curState.players : []);
  const teams = incoming.teams && incoming.teams.length > 0
    ? incoming.teams
    : (curState?.teams && curState.teams.length > 0 ? curState.teams : []);
  return {
    ...incoming,
    players,
    teams,
  };
};

let standaloneInterval: any = null;

export const useAuctionStore = create<AuctionStore>((set, get) => ({
  state: null,
  secondsLeft: 10,
  isTimerWarning: false,
  isTimerUrgent: false,
  isConnected: false,
  isStandaloneMode: false,
  isBidding: false,
  lastBidFlash: false,
  soldOverlay: null,
  unsoldOverlay: null,
  toastMessage: null,
  soundMuted: false,

  showToast: (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    set({ toastMessage: { text, type } });
    setTimeout(() => {
      if (get().toastMessage?.text === text) {
        set({ toastMessage: null });
      }
    }, 4000);
  },

  dismissOverlay: () => {
    set({ soldOverlay: null, unsoldOverlay: null });
  },

  toggleSound: () => {
    const next = !get().soundMuted;
    sound.enabled = !next;
    set({ soundMuted: next });
  },

  startStandaloneTimer: () => {
    if (standaloneInterval) clearInterval(standaloneInterval);
    const { state } = get();
    if (!state || state.auction.status !== 'ACTIVE' || state.auction.timerEnabled === false) {
      return;
    }

    standaloneInterval = setInterval(() => {
      const { secondsLeft, state: curState } = get();
      if (!curState || curState.auction.status !== 'ACTIVE' || curState.auction.timerEnabled === false) {
        clearInterval(standaloneInterval);
        standaloneInterval = null;
        return;
      }

      const nextSec = secondsLeft - 1;
      set({
        secondsLeft: nextSec,
        isTimerWarning: nextSec <= 5 && nextSec > 0,
        isTimerUrgent: nextSec <= 3 && nextSec > 0,
      });

      if (nextSec === 5 || nextSec === 4) sound.playTimerTick();
      if (nextSec <= 3 && nextSec > 0) sound.playTimerUrgent();

      if (nextSec <= 0) {
        clearInterval(standaloneInterval);
        standaloneInterval = null;
        const autoSellEnabled = curState.auction.autoSell !== false;
        if (autoSellEnabled) {
          if (curState.highestBidTeam) {
            get().adminActionStandalone('sell');
          } else {
            get().adminActionStandalone('unsold');
          }
        } else {
          sound.playTimerTick();
          get().showToast('Timer ended! Waiting for Admin confirmation to Sell or Mark Unsold.', 'info');
        }
      }
    }, 1000);
  },

  stopStandaloneTimer: () => {
    if (standaloneInterval) {
      clearInterval(standaloneInterval);
      standaloneInterval = null;
    }
  },

  initState: async () => {
    try {
      const [data, playersList] = await Promise.all([
        api.getCurrentAuction(),
        api.getPlayers().catch(() => []),
      ]);
      const mergedPlayers =
        data.players && data.players.length > 0 ? data.players : playersList || [];
      set({
        state: {
          ...data,
          players: mergedPlayers,
        },
        secondsLeft: data.auction?.secondsLeft ?? 10,
        isConnected: true,
        isStandaloneMode: false,
      });
    } catch (err: any) {
      console.warn('Backend server offline. Enabling Standalone Live Simulation Engine on GitHub Pages!');
      // Initialize standalone client-side engine with rich teams and players
      const activeP = (INITIAL_PLAYERS && INITIAL_PLAYERS.length > 0) ? INITIAL_PLAYERS[0] : null;
      const defaultState: AuctionState = {
        auction: {
          id: 'auction-mega-2026',
          name: 'Premier Cricket Mega Auction 2026',
          status: 'ACTIVE',
          currentRound: 1,
          defaultTimerSec: 10,
          activePlayerId: activeP?.id || null,
          activePlayerPrice: activeP?.basePrice || 100,
          highestBidTeamId: null,
          secondsLeft: 10,
        },
        activePlayer: activeP,
        highestBidTeam: null,
        currentBid: activeP?.basePrice || 0,
        secondsLeft: 10,
        teams: INITIAL_TEAMS || [],
        players: INITIAL_PLAYERS || [],
        recentBids: [],
        minIncrement: activeP ? getMinBidIncrement(activeP.basePrice) : 100,
      };

      set({
        state: defaultState,
        secondsLeft: 10,
        isConnected: true, // Connected to internal simulation engine
        isStandaloneMode: true,
      });

      get().startStandaloneTimer();
    }
  },

  setPlayers: (players: Player[]) => {
    set((s) => ({
      state: s.state
        ? { ...s.state, players }
        : ({
            auction: { id: '', name: '', status: 'IDLE', currentRound: 1, defaultTimerSec: 10 },
            activePlayer: null,
            highestBidTeam: null,
            currentBid: 0,
            recentBids: [],
            teams: [],
            players,
          } as AuctionState),
    }));
  },

  refreshPlayers: async () => {
    try {
      const players = await api.getPlayers();
      if (Array.isArray(players)) {
        get().setPlayers(players);
      }
    } catch (e) {
      console.error('Failed to refresh players', e);
    }
  },

  initSocketListeners: () => {
    const socket = socketService.connect();

    const mergeState = (incoming: any): AuctionState => {
      const currentState = get().state;
      const currentPlayers = currentState?.players || [];
      const currentTeams = currentState?.teams || [];

      if (!incoming || typeof incoming !== 'object') {
        return currentState || ({
          auction: { id: '', name: '', status: 'IDLE', currentRound: 1, defaultTimerSec: 10 },
          activePlayer: null,
          highestBidTeam: null,
          currentBid: 0,
          recentBids: [],
          teams: currentTeams,
          players: currentPlayers,
        } as AuctionState);
      }

      return {
        ...currentState,
        ...incoming,
        auction: incoming.auction || currentState?.auction || { id: '', name: '', status: 'IDLE', currentRound: 1, defaultTimerSec: 10 },
        teams: Array.isArray(incoming.teams) ? incoming.teams : currentTeams,
        players:
          Array.isArray(incoming.players) && incoming.players.length > 0
            ? incoming.players
            : currentPlayers,
      };
    };

    socket.on('connect', () => {
      set({ isConnected: true, isStandaloneMode: false });
    });

    socket.on('disconnect', () => {
      if (!get().isStandaloneMode) {
        set({ isConnected: false });
      }
    });

    socket.on('auction:init', (data: AuctionState) => {
      set({
        state: mergeState(data),
        secondsLeft: data.auction?.secondsLeft ?? 10,
        isConnected: true,
        isStandaloneMode: false,
      });
    });

    socket.on('auction:players_updated', (data: { players?: Player[] } | Player[]) => {
      const playersList = Array.isArray(data) ? data : data?.players;
      if (Array.isArray(playersList) && playersList.length > 0) {
        set((s) => ({
          state: s.state ? { ...s.state, players: playersList } : null,
        }));
      }
    });

    socket.on('auction:started', (data: AuctionState) => {
      set({ state: mergeState(data) });
      get().showToast('Auction started!', 'success');
    });

    socket.on('auction:paused', (data: AuctionState) => {
      set({ state: mergeState(data) });
      get().showToast('Auction paused by admin', 'info');
    });

    socket.on('auction:resumed', (data: AuctionState) => {
      set({ state: mergeState(data) });
      get().showToast('Auction resumed', 'info');
    });

    socket.on('auction:player', (data: AuctionState) => {
      set({
        state: mergeState(data),
        secondsLeft: data.auction?.secondsLeft ?? 10,
        soldOverlay: null,
        unsoldOverlay: null,
      });
      get().showToast(`Up next: ${data.activePlayer?.name}`, 'info');
    });

    socket.on('auction:timer', (data: { secondsLeft: number | null; warning?: boolean; urgent?: boolean; timerEnabled?: boolean }) => {
      if (data.timerEnabled === false) {
        set({
          secondsLeft: 0,
          isTimerWarning: false,
          isTimerUrgent: false,
        });
        return;
      }

      set({
        secondsLeft: data.secondsLeft ?? 0,
        isTimerWarning: Boolean(data.warning),
        isTimerUrgent: Boolean(data.urgent),
      });

      if (data.urgent) {
        sound.playTimerUrgent();
      } else if (data.warning) {
        sound.playTimerTick();
      }
    });

    socket.on('auction:settings_updated', (data: any) => {
      if (data && Array.isArray(data.teams)) {
        set({
          state: mergeState(data),
          secondsLeft: data.auction?.timerEnabled === false ? 0 : (data.auction?.secondsLeft ?? get().secondsLeft),
          isTimerWarning: false,
          isTimerUrgent: false,
        });
        if (data.auction) {
          get().showToast(
            `Auction settings updated: Timer is ${data.auction?.timerEnabled === false ? 'OFF (Manual Mode)' : 'ON'}`,
            'info'
          );
        }
      } else {
        // Refetch clean state from API
        get().initState();
      }
    });

    socket.on('auction:bid', (data: { bid: Bid; amount: number; teamName: string; playerName: string; state: AuctionState }) => {
      set({
        state: mergeState(data.state),
        secondsLeft: data.state.auction?.secondsLeft ?? 10,
        isTimerWarning: false,
        isTimerUrgent: false,
        lastBidFlash: true,
      });

      sound.playBidChime();

      setTimeout(() => {
        set({ lastBidFlash: false });
      }, 700);

      get().showToast(`${data.teamName} bids ${formatRupees(data.amount)}!`, 'info');
    });

    socket.on('auction:timer_ended_manual', (data: { message: string }) => {
      sound.playTimerTick();
      get().showToast(data.message || 'Timer ended! Waiting for Admin confirmation to Sell or Mark Unsold.', 'info');
    });

    socket.on('auction:sold', (data: any) => {
      set({
        state: mergeState(data.state),
        soldOverlay: {
          player: data.player,
          winningTeam: data.winningTeam,
          finalPrice: data.finalPrice,
          formattedPrice: data.formattedPrice,
        },
      });

      sound.playGavelSound();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ffffff'],
        });
      } catch (e) {}

      get().showToast(`SOLD! ${data.player.name} to ${data.winningTeam.name}`, 'success');

      setTimeout(() => {
        set({ soldOverlay: null });
      }, 4200);
    });

    socket.on('auction:unsold', (data: any) => {
      set({
        state: mergeState(data.state),
        unsoldOverlay: {
          player: data.player,
          basePrice: data.basePrice,
          formattedBasePrice: data.formattedBasePrice,
        },
      });

      sound.playUnsoldBuzzer();
      get().showToast(`UNSOLD: ${data.player.name}`, 'info');

      setTimeout(() => {
        set({ unsoldOverlay: null });
      }, 3500);
    });

    socket.on('auction:reset', (data: AuctionState) => {
      set({
        state: mergeState(data),
        secondsLeft: 10,
        soldOverlay: null,
        unsoldOverlay: null,
      });
      get().showToast('Auction has been reset to starting state', 'info');
    });

    socket.on('auction:ended', (data: { message: string; state: AuctionState }) => {
      set({ state: mergeState(data.state) });
      get().showToast(data.message, 'info');
    });
  },

  placeBid: async (amount?: number, teamId?: string) => {
    const { isStandaloneMode, state } = get();

    if (!isStandaloneMode) {
      set({ isBidding: true });
      try {
        await api.placeBid(amount, teamId);
      } catch (err: any) {
        get().showToast(err.message, 'error');
        throw err;
      } finally {
        set({ isBidding: false });
      }
      return;
    }

    // Standalone Simulation Bid Handler
    if (!state || !state.activePlayer) return;
    set({ isBidding: true });

    try {
      const activeP = state.activePlayer;
      const authTeamId = useAuthStore.getState().user?.teamId;
      const targetTeamId = teamId || authTeamId;
      const effectiveTeam = (targetTeamId ? state.teams.find((t) => t.id === targetTeamId) : null) || state.teams[0];
      const targetAmount = amount || (state.currentBid + getMinBidIncrement(state.currentBid));

      if (activeP.isOverseas && (effectiveTeam.overseasCount || 0) >= effectiveTeam.maxOverseas) {
        throw new Error(`Overseas limit reached (${effectiveTeam.maxOverseas} max). Cannot bid on overseas player.`);
      }

      if (effectiveTeam.remainingPurse < targetAmount) {
        throw new Error(`Insufficient purse. Team has ${formatRupees(effectiveTeam.remainingPurse)} remaining.`);
      }

      const newBid: Bid = {
        id: `bid-${Date.now()}`,
        auctionId: state.auction.id,
        playerId: activeP.id,
        player: activeP,
        teamId: effectiveTeam.id,
        team: effectiveTeam,
        amount: targetAmount,
        bidNumber: state.recentBids.length + 1,
        createdAt: new Date().toISOString(),
      };

      const nextState: AuctionState = {
        ...state,
        currentBid: targetAmount,
        highestBidTeam: effectiveTeam,
        auction: {
          ...state.auction,
          activePlayerPrice: targetAmount,
          highestBidTeamId: effectiveTeam.id,
        },
        recentBids: [newBid, ...state.recentBids],
        minIncrement: getMinBidIncrement(targetAmount),
      };

      set({
        state: nextState,
        secondsLeft: 10,
        isTimerWarning: false,
        isTimerUrgent: false,
        lastBidFlash: true,
      });

      sound.playBidChime();
      get().showToast(`${effectiveTeam.name} bids ${formatRupees(targetAmount)}!`, 'info');

      setTimeout(() => set({ lastBidFlash: false }), 600);
      get().startStandaloneTimer();

      // Trigger automatic AI rival team bid after 3 seconds if under budget
      setTimeout(() => {
        const cur = get().state;
        if (!cur || cur.auction.status !== 'ACTIVE' || !cur.highestBidTeam) return;
        if (cur.highestBidTeam.id === effectiveTeam.id && targetAmount < 14000) {
          // Rival team (pick another team)
          const rivalTeam = cur.teams.find((t) => t.id !== effectiveTeam.id && t.remainingPurse > targetAmount + 200);
          if (rivalTeam) {
            const rivalBidAmount = targetAmount + getMinBidIncrement(targetAmount);
            const rivalBid: Bid = {
              id: `bid-${Date.now()}`,
              auctionId: cur.auction.id,
              playerId: activeP.id,
              player: activeP,
              teamId: rivalTeam.id,
              team: rivalTeam,
              amount: rivalBidAmount,
              bidNumber: cur.recentBids.length + 1,
              createdAt: new Date().toISOString(),
            };

            set({
              state: {
                ...cur,
                currentBid: rivalBidAmount,
                highestBidTeam: rivalTeam,
                auction: {
                  ...cur.auction,
                  activePlayerPrice: rivalBidAmount,
                  highestBidTeamId: rivalTeam.id,
                },
                recentBids: [rivalBid, ...cur.recentBids],
                minIncrement: getMinBidIncrement(rivalBidAmount),
              },
              secondsLeft: 10,
              lastBidFlash: true,
            });

            sound.playBidChime();
            get().showToast(`Counter-bid! ${rivalTeam.name} bids ${formatRupees(rivalBidAmount)}!`, 'info');
            setTimeout(() => set({ lastBidFlash: false }), 600);
            get().startStandaloneTimer();
          }
        }
      }, 3200);
    } catch (err: any) {
      get().showToast(err.message, 'error');
      throw err;
    } finally {
      set({ isBidding: false });
    }
  },

  adminActionStandalone: async (action: string, payload?: any) => {
    const { state } = get();
    if (!state) return;

    if (action === 'pause') {
      get().stopStandaloneTimer();
      set({ state: { ...state, auction: { ...state.auction, status: 'PAUSED' } } });
      get().showToast('Auction paused', 'info');
    } else if (action === 'resume' || action === 'start') {
      set({ state: { ...state, auction: { ...state.auction, status: 'ACTIVE' } } });
      get().startStandaloneTimer();
      get().showToast('Auction started/resumed', 'success');
    } else if (action === 'sell') {
      get().stopStandaloneTimer();
      if (!state.activePlayer) return;

      const manualTeamId = payload?.teamId;
      const manualPrice = payload?.price;
      const winningTeam = manualTeamId
        ? state.teams.find((t) => t.id === manualTeamId) || state.highestBidTeam
        : state.highestBidTeam;

      if (!winningTeam) {
        get().adminActionStandalone('unsold');
        return;
      }

      const player = state.activePlayer;
      const finalPrice = manualPrice !== undefined ? Number(manualPrice) : (state.currentBid || player.basePrice);

      if (winningTeam.remainingPurse < finalPrice) {
        get().showToast(`${winningTeam.name} has insufficient purse (${formatRupees(winningTeam.remainingPurse)})!`, 'error');
        return;
      }

      // Deduct purse and add player to squad
      const updatedTeams = state.teams.map((t) => {
        if (t.id === winningTeam.id) {
          const newPurse = t.remainingPurse - finalPrice;
          return {
            ...t,
            remainingPurse: newPurse,
            squadSize: (t.squadSize || 0) + 1,
            overseasCount: player.isOverseas ? (t.overseasCount || 0) + 1 : t.overseasCount,
            squad: [
              ...(t.squad || []),
              { id: `sp-${Date.now()}`, price: finalPrice, player: { ...player, status: 'SOLD' as any } },
            ],
          };
        }
        return t;
      });

      set({
        state: {
          ...state,
          teams: updatedTeams,
          highestBidTeam: winningTeam,
          currentBid: finalPrice,
          auction: {
            ...state.auction,
            highestBidTeamId: winningTeam.id,
            activePlayerPrice: finalPrice,
          },
        },
        soldOverlay: {
          player,
          winningTeam,
          finalPrice,
          formattedPrice: formatRupees(finalPrice),
        },
      });

      sound.playGavelSound();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ffffff'],
        });
      } catch (e) {}

      setTimeout(() => {
        get().adminActionStandalone('next');
      }, 4000);
    } else if (action === 'unsold') {
      get().stopStandaloneTimer();
      if (!state.activePlayer) return;
      const player = state.activePlayer;

      set({
        unsoldOverlay: {
          player,
          basePrice: player.basePrice,
          formattedBasePrice: formatRupees(player.basePrice),
        },
      });

      sound.playUnsoldBuzzer();

      setTimeout(() => {
        get().adminActionStandalone('next');
      }, 3500);
    } else if (action === 'next') {
      get().stopStandaloneTimer();
      set({ soldOverlay: null, unsoldOverlay: null });

      // Find next player
      const currentIndex = INITIAL_PLAYERS.findIndex((p) => p.id === state.activePlayer?.id);
      const nextP = INITIAL_PLAYERS[currentIndex + 1] || INITIAL_PLAYERS[0];

      set({
        state: {
          ...state,
          activePlayer: nextP,
          currentBid: nextP.basePrice,
          highestBidTeam: null,
          recentBids: [],
          minIncrement: getMinBidIncrement(nextP.basePrice),
          auction: {
            ...state.auction,
            activePlayerId: nextP.id,
            activePlayerPrice: nextP.basePrice,
            highestBidTeamId: null,
            status: 'ACTIVE',
          },
        },
        secondsLeft: 10,
        isTimerWarning: false,
        isTimerUrgent: false,
      });

      get().showToast(`Up Next: ${nextP.name}`, 'info');
      get().startStandaloneTimer();
    } else if (action === 'reset') {
      get().stopStandaloneTimer();
      const firstP = INITIAL_PLAYERS[0];
      set({
        state: {
          ...state,
          teams: INITIAL_TEAMS,
          activePlayer: firstP,
          currentBid: firstP.basePrice,
          highestBidTeam: null,
          recentBids: [],
          minIncrement: getMinBidIncrement(firstP.basePrice),
          auction: {
            ...state.auction,
            activePlayerId: firstP.id,
            activePlayerPrice: firstP.basePrice,
            highestBidTeamId: null,
            status: 'ACTIVE',
          },
        },
        secondsLeft: 10,
        soldOverlay: null,
        unsoldOverlay: null,
      });
      get().showToast('Auction reset to pristine state', 'info');
      get().startStandaloneTimer();
    } else if (action === 'select_player' && payload) {
      get().stopStandaloneTimer();
      set({ soldOverlay: null, unsoldOverlay: null });
      const targetP = INITIAL_PLAYERS.find((p) => p.id === payload) || state.activePlayer;
      if (targetP) {
        set({
          state: {
            ...state,
            activePlayer: targetP,
            currentBid: targetP.basePrice,
            highestBidTeam: null,
            recentBids: [],
            minIncrement: getMinBidIncrement(targetP.basePrice),
            auction: {
              ...state.auction,
              activePlayerId: targetP.id,
              activePlayerPrice: targetP.basePrice,
              highestBidTeamId: null,
              status: 'ACTIVE',
            },
          },
          secondsLeft: 10,
          isTimerWarning: false,
          isTimerUrgent: false,
        });
        get().showToast(`Player on block: ${targetP.name}`, 'info');
        get().startStandaloneTimer();
      }
    } else if (action === 'toggle_timer') {
      const currentEnabled = state.auction.timerEnabled !== false;
      const nextEnabled = !currentEnabled;
      set({
        state: {
          ...state,
          auction: {
            ...state.auction,
            timerEnabled: nextEnabled,
          },
        },
        secondsLeft: nextEnabled ? (state.auction.defaultTimerSec || 10) : 0,
        isTimerWarning: false,
        isTimerUrgent: false,
      });
      if (nextEnabled) {
        get().startStandaloneTimer();
      } else {
        get().stopStandaloneTimer();
      }
      get().showToast(`Timer is now ${nextEnabled ? 'ON' : 'OFF (Manual Mode)'}`, 'info');
    }
  },

  manuallyAssignPlayer: async (playerId: string, teamId: string, amount: number) => {
    if (isNaN(amount) || amount <= 100 || amount >= 2500) {
      const err = new Error('Price must be greater than ₹100 and less than ₹2,500.');
      get().showToast(err.message, 'error');
      throw err;
    }
    const { isStandaloneMode, state } = get();
    if (!isStandaloneMode) {
      try {
        const res = await api.manuallyAssignPlayer(playerId, teamId, amount);
        sound.playGavelSound();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#10b981', '#3b82f6', '#ffffff'],
          });
        } catch (e) {}
        get().showToast(res.message || `Player assigned successfully for ${formatRupees(amount)}!`, 'success');
        await get().initState();
      } catch (err: any) {
        get().showToast(err.message || 'Failed to assign player', 'error');
        throw err;
      }
      return;
    }

    if (!state) return;
    const team = state.teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Franchise not found');
    if (team.remainingPurse < amount) {
      throw new Error(`Insufficient purse! ${team.name} has only ${formatRupees(team.remainingPurse)} remaining.`);
    }

    const targetPlayer = INITIAL_PLAYERS.find((p) => p.id === playerId) || state.activePlayer || ({
      id: playerId,
      name: 'Assigned Player',
      status: 'SOLD',
    } as any as Player);

    const updatedTeams: Team[] = state.teams.map((t) => {
      if (t.id === teamId) {
        const newPurse = t.remainingPurse - amount;
        return {
          ...t,
          remainingPurse: newPurse,
          squadSize: (t.squadSize || 0) + 1,
          squad: [
            ...(t.squad || []),
            {
              id: `sp-${Date.now()}`,
              price: amount,
              player: { ...targetPlayer, status: 'SOLD' as any },
            },
          ],
        };
      }
      return t;
    });

    const activeP = state.activePlayer;
    if (activeP && activeP.id === playerId) {
      set({
        state: { ...state, teams: updatedTeams },
        soldOverlay: {
          player: activeP,
          winningTeam: team,
          finalPrice: amount,
          formattedPrice: formatRupees(amount),
        },
      });
      sound.playGavelSound();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ffffff'],
        });
      } catch (e) {}
      setTimeout(() => {
        get().adminActionStandalone('next');
      }, 4000);
    } else {
      set({ state: { ...state, teams: updatedTeams } });
      sound.playGavelSound();
      get().showToast(`Player assigned to ${team.name} for ${formatRupees(amount)}!`, 'success');
    }
  },

  deleteTeam: async (teamId: string) => {
    const { isStandaloneMode, state } = get();
    if (!isStandaloneMode) {
      try {
        const res = await api.deleteTeam(teamId);
        get().showToast(res.message || 'Team deleted successfully.', 'success');
        await get().initState();
      } catch (err: any) {
        get().showToast(err.message || 'Failed to delete team.', 'error');
        throw err;
      }
      return;
    }

    if (!state) return;
    const remainingTeams = state.teams.filter((t) => t.id !== teamId);
    set({
      state: {
        ...state,
        teams: remainingTeams,
        highestBidTeam: state.highestBidTeam?.id === teamId ? null : state.highestBidTeam,
        auction: {
          ...state.auction,
          highestBidTeamId: state.auction?.highestBidTeamId === teamId ? null : state.auction?.highestBidTeamId,
        },
      },
    });
    get().showToast('Team deleted successfully.', 'success');
  },

  deleteAllTeams: async () => {
    const { isStandaloneMode, state } = get();
    if (!isStandaloneMode) {
      try {
        const res = await api.deleteAllTeams();
        get().showToast(res.message || 'All teams deleted successfully.', 'success');
        await get().initState();
      } catch (err: any) {
        get().showToast(err.message || 'Failed to delete all teams.', 'error');
        throw err;
      }
      return;
    }

    if (!state) return;
    set({
      state: {
        ...state,
        teams: [],
        highestBidTeam: null,
        auction: {
          ...state.auction,
          highestBidTeamId: null,
        },
      },
    });
    get().showToast('All teams deleted successfully.', 'success');
  },
}));

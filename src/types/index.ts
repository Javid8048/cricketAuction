export interface User {
  id: string;
  email: string;
  username?: string | null;
  name: string;
  role: 'ADMIN' | 'TEAM' | 'SPECTATOR';
  teamId?: string | null;
  team?: Team | null;
}

export interface Player {
  id: string;
  sNo: number;
  name: string;
  profileImage: string;
  country: string;
  isOverseas: boolean;
  age: number;
  dob?: string | null;
  place?: string | null;
  phone?: string | null;
  role: 'Batter' | 'Bowler' | 'All-Rounder' | 'Wicketkeeper' | string;
  battingStyle: string;
  bowlingStyle: string;
  basePrice: number;
  category: string;
  isIcon?: boolean;
  iconPrice?: number | null;
  matches: number;
  runs: number;
  battingAvg: number;
  strikeRate: number;
  highestScore: number;
  wickets: number;
  economy: number;
  bowlingAvg: number;
  bestBowling: string;
  status: 'UPCOMING' | 'IN_AUCTION' | 'SOLD' | 'UNSOLD';
  currentPrice?: number | null;
  belongingTeamId?: string | null;
  belongingTeam?: Team | null;
  teamPlayer?: {
    team: Team;
    price: number;
    isIcon?: boolean;
  } | null;
  bids?: Bid[];
  auctionPlayers?: AuctionPlayer[];
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  ownerName?: string | null;
  phone?: string | null;
  address?: string | null;
  loginUsername?: string | null;
  loginPassword?: string | null;
  primaryColor: string;
  secondaryColor: string;
  logoText: string;
  totalPurse: number;
  remainingPurse: number;
  maxSquadSize: number;
  maxOverseas: number;
  squadSize?: number;
  iconPlayersCount?: number;
  overseasCount?: number;
  batters?: number;
  bowlers?: number;
  allRounders?: number;
  wicketkeepers?: number;
  totalSpent?: number;
  avgPlayerPrice?: number;
  highestPurchase?: number;
  squad?: Array<{
    id: string;
    price: number;
    isIcon?: boolean;
    player: Player;
  }>;
}

export interface Auction {
  id: string;
  name: string;
  status: 'IDLE' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  currentRound: number;
  defaultTimerSec: number;
  autoSell?: boolean;
  timerEnabled?: boolean;
  defaultPurse?: number;
  defaultSquadLimit?: number;
  iconPlayerPrice?: number;
  defaultBasePrice?: number;
  activePlayerId?: string | null;
  activePlayerPrice?: number | null;
  highestBidTeamId?: string | null;
  secondsLeft?: number;
  startedAt?: string | null;
  endedAt?: string | null;
}

export interface AuctionPlayer {
  id: string;
  auctionId: string;
  playerId: string;
  player: Player;
  status: 'PENDING' | 'CURRENT' | 'SOLD' | 'UNSOLD' | 'SKIPPED';
  round: number;
  orderIndex: number;
  basePrice: number;
  finalPrice?: number | null;
  winningTeamId?: string | null;
  winningTeam?: Team | null;
  soldAt?: string | null;
}

export interface Bid {
  id: string;
  auctionId: string;
  playerId: string;
  player?: Player;
  teamId: string;
  team?: Team;
  amount: number;
  bidNumber: number;
  createdAt: string;
}

export interface AuctionEvent {
  id: string;
  auctionId: string;
  type: string;
  message: string;
  metadata?: string | null;
  createdAt: string;
}

export interface AuctionState {
  auction: Auction;
  activePlayer: Player | null;
  highestBidTeam: Team | null;
  currentBid: number;
  secondsLeft?: number;
  recentBids: Bid[];
  teams: Team[];
  players?: Player[];
  minIncrement?: number;
}

export interface DashboardStats {
  summary: {
    totalPlayers: number;
    soldCount: number;
    unsoldCount: number;
    remainingCount: number;
    totalSpent: number;
    avgPrice: number;
    highestPurchase?: {
      finalPrice: number;
      player: Player;
      winningTeam: Team;
    } | null;
  };
  spendingByTeam: any[];
  soldByRole: any[];
  soldByCountry: any[];
  priceDistribution: any[];
  recentPurchases: any[];
}


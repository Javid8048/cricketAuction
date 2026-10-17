import React, { useState } from 'react';
import { LiveBroadcastHeader } from '../components/auction/LiveBroadcastHeader';
import { PlayerCard } from '../components/auction/PlayerCard';
import { LiveBiddingArea } from '../components/auction/LiveBiddingArea';
import { TeamStatusPanel } from '../components/auction/TeamStatusPanel';
import { AuctionTimeline } from '../components/auction/AuctionTimeline';
import { AdminControlPanel } from '../components/admin/AdminControlPanel';
import { PlayerProfileModal } from '../components/player/PlayerProfileModal';
import { SpectatorHoldingsHub } from '../components/auction/SpectatorHoldingsHub';
import { useAuctionStore } from '../store/auction.store';
import { useAuthStore } from '../store/auth.store';

export const LiveAuctionPage: React.FC = () => {
  const { state } = useAuctionStore();
  const { user } = useAuthStore();
  const [profileModalPlayerId, setProfileModalPlayerId] = useState<string | null>(null);

  const activePlayer = state?.activePlayer || null;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-4">
      {/* Top Broadcast Bar */}
      <LiveBroadcastHeader />

      {/* Main 3-Column Arena Broadcast Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Player Card (4 Cols on desktop) */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col">
          <PlayerCard
            player={activePlayer}
            onViewProfile={(id) => setProfileModalPlayerId(id)}
          />
        </div>

        {/* Center: Live Bidding Stage (5 Cols on desktop) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col">
          <LiveBiddingArea />
        </div>

        {/* Right: Teams Status Standings (3 Cols on desktop) */}
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col">
          <TeamStatusPanel />
        </div>
      </div>

      {/* Bottom Ticker: Real-time Timeline */}
      <AuctionTimeline />

      {/* Real-time Spectator Holdings Hub (Teams & Squad Holdings + Player Draft Pool) */}
      <SpectatorHoldingsHub
        onViewPlayerProfile={(id) => setProfileModalPlayerId(id)}
      />

      {/* Admin Command Desk (always accessible to admin below arena) */}
      {isAdmin && (
        <div className="mt-6">
          <AdminControlPanel />
        </div>
      )}

      {/* Player Profile Detail Modal */}
      <PlayerProfileModal
        playerId={profileModalPlayerId}
        onClose={() => setProfileModalPlayerId(null)}
      />
    </div>
  );
};

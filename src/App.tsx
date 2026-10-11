import React, { useEffect, useState } from 'react';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Toast } from './components/common/Toast';
import { SoldUnsoldBanner } from './components/auction/SoldUnsoldBanner';
import { LiveAuctionPage } from './pages/LiveAuctionPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { TeamDashboardPage } from './pages/TeamDashboardPage';
import { PlayersDatabasePage } from './pages/PlayersDatabasePage';
import { TeamsDatabasePage } from './pages/TeamsDatabasePage';
import { AuctionHistoryPage } from './pages/AuctionHistoryPage';
import { LoginPage } from './pages/LoginPage';
import { PlayerRegisterPage } from './components/player/PlayerRegisterPage';
import { WatchListPage } from './pages/WatchListPage';
import { AdminSettingsModal } from './components/admin/AdminSettingsModal';
import { IconPlayerModal } from './components/admin/IconPlayerModal';
import { TeamFormModal } from './components/admin/TeamFormModal';
import { FranchiseCredentialsModal } from './components/admin/FranchiseCredentialsModal';
import { RenderWakeupModal } from './components/common/RenderWakeupModal';
import { useAuctionStore } from './store/auction.store';
import { useAuthStore } from './store/auth.store';

export function App() {
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#register') return 'register';
      if (hash === '#watchlist') return 'watchlist';
    }
    return 'arena';
  };

  const getInitialLayoutMode = (): 'topbar' | 'sidebar' => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('caa_layout_mode');
      if (saved === 'sidebar' || saved === 'topbar') return saved;
    }
    return 'topbar';
  };

  const [currentTab, setCurrentTab] = useState<string>(getInitialTab());
  const [layoutMode, setLayoutMode] = useState<'topbar' | 'sidebar'>(getInitialLayoutMode());
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modals state
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isRenderWakeupOpen, setIsRenderWakeupOpen] = useState(false);

  const { initState, initSocketListeners } = useAuctionStore();
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
    initState();
    initSocketListeners();

    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#register') {
        setCurrentTab('register');
      } else if (hash === '#watchlist') {
        setCurrentTab('watchlist');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [checkAuth, initState, initSocketListeners]);

  const toggleLayoutMode = () => {
    const nextMode = layoutMode === 'topbar' ? 'sidebar' : 'topbar';
    setLayoutMode(nextMode);
    try {
      localStorage.setItem('caa_layout_mode', nextMode);
    } catch (e) {}
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (tab === 'register') {
      window.location.hash = 'register';
    } else if (tab === 'watchlist') {
      window.location.hash = 'WatchList';
    } else if (window.location.hash === '#register' || window.location.hash.toLowerCase() === '#watchlist') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  // Determine what screen to display:
  // When unauthenticated, users can see registration form, #WatchList live spectator feed, or login screen.
  const renderMainContent = () => {
    if (!isAuthenticated) {
      if (currentTab === 'register') {
        return (
          <PlayerRegisterPage
            onBackToArena={() => handleTabChange('login')}
            onOpenLogin={() => handleTabChange('login')}
          />
        );
      }
      if (currentTab === 'watchlist') {
        return <WatchListPage onOpenLogin={() => handleTabChange('login')} />;
      }
      return (
        <LoginPage
          onSuccess={() => handleTabChange('arena')}
          onOpenRegister={() => handleTabChange('register')}
          onOpenWatchList={() => handleTabChange('watchlist')}
        />
      );
    }

    switch (currentTab) {
      case 'arena':
        return <LiveAuctionPage />;
      case 'watchlist':
        return <WatchListPage onOpenLogin={() => handleTabChange('login')} />;
      case 'players':
        return <PlayersDatabasePage />;
      case 'teams':
        return <TeamsDatabasePage />;
      case 'register':
        return (
          <PlayerRegisterPage
            onBackToArena={() => handleTabChange('arena')}
            onOpenLogin={() => handleTabChange('login')}
          />
        );
      case 'admin-dashboard':
        return <AdminDashboardPage />;
      case 'team-dashboard':
        return <TeamDashboardPage />;
      case 'history':
        return <AuctionHistoryPage />;
      case 'login':
        return (
          <LoginPage
            onSuccess={() => handleTabChange('arena')}
            onOpenRegister={() => handleTabChange('register')}
            onOpenWatchList={() => handleTabChange('watchlist')}
          />
        );
      default:
        return <LiveAuctionPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleTabChange}
        layoutMode={layoutMode}
        onToggleLayoutMode={toggleLayoutMode}
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        onOpenAdminSettings={() => setIsAdminSettingsOpen(true)}
        onOpenIconModal={() => setIsIconModalOpen(true)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenCredentialsModal={() => setIsCredentialsModalOpen(true)}
        onOpenRenderWakeup={() => setIsRenderWakeupOpen(true)}
      />

      {/* Main Container: Flex row for sidebar or stacked for topbar */}
      <div className="flex-1 flex">
        {/* Sidebar (Desktop docked or Mobile drawer) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleTabChange}
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          layoutMode={layoutMode}
          onToggleLayoutMode={toggleLayoutMode}
          onOpenAdminSettings={() => setIsAdminSettingsOpen(true)}
          onOpenIconModal={() => setIsIconModalOpen(true)}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
          onOpenCredentialsModal={() => setIsCredentialsModalOpen(true)}
          onOpenRenderWakeup={() => setIsRenderWakeupOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-12">
          {renderMainContent()}
        </main>
      </div>

      {/* Global Modals */}
      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
      />

      <IconPlayerModal
        isOpen={isIconModalOpen}
        onClose={() => setIsIconModalOpen(false)}
      />

      <TeamFormModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />

      <FranchiseCredentialsModal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        onOpenCreateTeam={() => {
          setIsCredentialsModalOpen(false);
          setIsTeamModalOpen(true);
        }}
      />

      <RenderWakeupModal
        isOpen={isRenderWakeupOpen}
        onClose={() => setIsRenderWakeupOpen(false)}
        onSuccess={() => initState()}
      />

      {/* Live Overlays & Toasts */}
      <SoldUnsoldBanner />
      <Toast />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#07090e] py-4 text-center text-xs text-slate-500 font-mono">
        CRICKET AUCTION ARENA • Local Tournament Edition • Purse: ₹15,000 • 12 Squad Limit • Real-time WebSocket Engine
      </footer>
    </div>
  );
}

export default App;

import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Menu, Flame, LayoutTemplate } from 'lucide-react';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Toast } from './components/common/Toast';
import { SoldUnsoldBanner } from './components/auction/SoldUnsoldBanner';
import { LiveAuctionPage } from './pages/LiveAuctionPage';
import { LandingPage } from './pages/LandingPage';
import { AdminSettingsModal } from './components/admin/AdminSettingsModal';
import { IconPlayerModal } from './components/admin/IconPlayerModal';
import { TeamFormModal } from './components/admin/TeamFormModal';
import { FranchiseCredentialsModal } from './components/admin/FranchiseCredentialsModal';
import { RenderWakeupModal } from './components/common/RenderWakeupModal';
import { DbConnectionGatekeeper } from './components/common/DbConnectionGatekeeper';
import { useAuctionStore } from './store/auction.store';
import { useAuthStore } from './store/auth.store';

// Code splitting secondary pages with React.lazy
const AdminDashboardPage = lazy(() =>
  import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const TeamDashboardPage = lazy(() =>
  import('./pages/TeamDashboardPage').then((m) => ({ default: m.TeamDashboardPage }))
);
const PlayersDatabasePage = lazy(() =>
  import('./pages/PlayersDatabasePage').then((m) => ({ default: m.PlayersDatabasePage }))
);
const TeamsDatabasePage = lazy(() =>
  import('./pages/TeamsDatabasePage').then((m) => ({ default: m.TeamsDatabasePage }))
);
const AuctionHistoryPage = lazy(() =>
  import('./pages/AuctionHistoryPage').then((m) => ({ default: m.AuctionHistoryPage }))
);
const PlayerRegisterPage = lazy(() =>
  import('./components/player/PlayerRegisterPage').then((m) => ({ default: m.PlayerRegisterPage }))
);
const WatchListPage = lazy(() =>
  import('./pages/WatchListPage').then((m) => ({ default: m.WatchListPage }))
);
const AdminSettingsPage = lazy(() =>
  import('./pages/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage }))
);

export function App() {
  const getInitialSpectatorMode = (): boolean => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      return hash === '#watchlive';
    }
    return false;
  };

  const getInitialTab = (): string => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#register') return 'register';
      if (hash === '#watchlive') return 'arena';
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

  const getInitialTheme = (): 'dark' | 'light' => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('caa_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  };

  const [currentTab, setCurrentTab] = useState<string>(getInitialTab());
  const [layoutMode, setLayoutMode] = useState<'topbar' | 'sidebar'>(getInitialLayoutMode());
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(getInitialTheme());
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSpectatorMode, setIsSpectatorMode] = useState<boolean>(getInitialSpectatorMode());
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  useEffect(() => {
    if (themeMode === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [themeMode]);

  // Modals state
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isRenderWakeupOpen, setIsRenderWakeupOpen] = useState(false);

  const { initState, initSocketListeners } = useAuctionStore();
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  const handleDbConnected = () => {
    setIsDbConnected(true);
    checkAuth();
    initState();
    initSocketListeners();
  };

  useEffect(() => {
    if (isDbConnected) {
      checkAuth();
      initState();
      initSocketListeners();
    }

    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#register') {
        setCurrentTab('register');
      } else if (hash === '#watchlive') {
        setIsSpectatorMode(true);
        setCurrentTab('arena');
      } else if (hash === '#watchlist') {
        setCurrentTab('watchlist');
      } else {
        setCurrentTab(useAuthStore.getState().isAuthenticated ? 'arena' : 'login');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isDbConnected, checkAuth, initState, initSocketListeners]);

  const toggleLayoutMode = () => {
    const nextMode = layoutMode === 'topbar' ? 'sidebar' : 'topbar';
    setLayoutMode(nextMode);
    try {
      localStorage.setItem('caa_layout_mode', nextMode);
    } catch (e) {}
  };

  const handleEnterSpectator = () => {
    setIsSpectatorMode(true);
    window.location.hash = 'WatchLive';
    setCurrentTab('arena');
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (tab === 'register') {
      window.location.hash = 'register';
    } else if (tab === 'login') {
      setIsSpectatorMode(false);
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } else if (tab === 'arena' && isSpectatorMode && !isAuthenticated) {
      window.location.hash = 'WatchLive';
    } else if (tab === 'watchlist') {
      window.location.hash = 'WatchList';
    } else if (
      window.location.hash === '#register' ||
      window.location.hash.toLowerCase() === '#watchlive' ||
      window.location.hash.toLowerCase() === '#watchlist'
    ) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  // Determine what screen to display:
  // When unauthenticated, user sees the LandingPage (with dedicated Franchise Login & Admin Login)
  // or Player Registration / WatchList, unless they chose Spectator Mode (#WatchLive).
  const renderMainContent = () => {
    if (!isAuthenticated && !isSpectatorMode) {
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
        <LandingPage
          onSuccess={() => {
            setIsSpectatorMode(false);
            initState();
            handleTabChange('arena');
          }}
          onOpenRegister={() => handleTabChange('register')}
          onEnterSpectator={handleEnterSpectator}
        />
      );
    }

    switch (currentTab) {
      case 'arena':
        return <LiveAuctionPage />;
      case 'watchlist':
        return <WatchListPage onOpenLogin={() => handleTabChange('login')} />;
      case 'players':
        return (
          <PlayersDatabasePage
            onNavigateToRegister={() => handleTabChange('register')}
            onSelectTab={handleTabChange}
          />
        );
      case 'teams':
        return <TeamsDatabasePage />;
      case 'register':
        return (
          <PlayerRegisterPage
            onBackToArena={() => handleTabChange('arena')}
            onOpenLogin={() => {
              setIsSpectatorMode(false);
              handleTabChange('login');
            }}
          />
        );
      case 'settings':
        return (
          <AdminSettingsPage
            onBackToArena={() => handleTabChange('arena')}
            layoutMode={layoutMode}
            onLayoutModeChange={(mode) => {
              setLayoutMode(mode);
              try {
                localStorage.setItem('caa_layout_mode', mode);
              } catch (e) {}
            }}
            themeMode={themeMode}
            onThemeModeChange={(mode) => {
              setThemeMode(mode);
              try {
                localStorage.setItem('caa_theme', mode);
              } catch (e) {}
            }}
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
          <LandingPage
            onSuccess={() => {
              setIsSpectatorMode(false);
              handleTabChange('arena');
            }}
            onOpenRegister={() => handleTabChange('register')}
            onEnterSpectator={handleEnterSpectator}
          />
        );
      default:
        return <LiveAuctionPage />;
    }
  };

  // Check DB connection on refresh and allow access only once connected
  if (!isDbConnected) {
    return (
      <DbConnectionGatekeeper
        onConnected={handleDbConnected}
        onBypass={() => {
          setIsDbConnected(true);
          checkAuth();
          initState();
          initSocketListeners();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navbar: Rendered ONLY in topbar mode */}
      {layoutMode === 'topbar' && (
        <Navbar
          currentTab={currentTab}
          onSelectTab={handleTabChange}
          layoutMode={layoutMode}
          onToggleLayoutMode={toggleLayoutMode}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          isSpectatorMode={isSpectatorMode}
          onOpenAdminSettings={() => handleTabChange('settings')}
          onOpenIconModal={() => setIsIconModalOpen(true)}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
          onOpenCredentialsModal={() => setIsCredentialsModalOpen(true)}
          onOpenRenderWakeup={() => setIsRenderWakeupOpen(true)}
        />
      )}

      {/* When in Sidebar mode on mobile screens only: show a compact mobile header with hamburger menu */}
      {layoutMode === 'sidebar' && (
        <div className="lg:hidden sticky top-0 z-40 bg-[#0c101a]/95 backdrop-blur-md border-b border-slate-800/80 px-3 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-amber-400" />
            </button>
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => handleTabChange(isAuthenticated ? 'arena' : 'login')}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm">
                <Flame className="w-4 h-4 text-slate-950 fill-slate-950" />
              </div>
              <span className="font-display font-black text-sm tracking-wide text-white">
                AUCTION <span className="text-amber-400">ARENA</span>
              </span>
            </div>
          </div>

          <button
            onClick={toggleLayoutMode}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-amber-300 flex items-center gap-1.5 transition-colors"
            title="Switch to Topbar mode"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
            <span>Topbar</span>
          </button>
        </div>
      )}

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
          isSpectatorMode={isSpectatorMode}
          onOpenAdminSettings={() => handleTabChange('settings')}
          onOpenIconModal={() => setIsIconModalOpen(true)}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
          onOpenCredentialsModal={() => setIsCredentialsModalOpen(true)}
          onOpenRenderWakeup={() => setIsRenderWakeupOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-12">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-slate-400 font-medium">Loading view...</p>
              </div>
            }
          >
            {renderMainContent()}
          </Suspense>
        </main>
      </div>

      {/* Global Modals */}
      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
        layoutMode={layoutMode}
        onLayoutModeChange={(mode) => setLayoutMode(mode)}
        themeMode={themeMode}
        onThemeModeChange={(mode) => setThemeMode(mode)}
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
    </div>
  );
}

export default App;

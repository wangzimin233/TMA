import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { fetchTradeUser } from './api/auth';
import { getErrorMessage } from './api/client';
import { BottomNav } from './components/BottomNav';
import { LeverageModal } from './components/LeverageModal';
import { Toaster } from './components/ui/sonner';
import { AuthPage } from './pages/auth/AuthPage';
import { DepositPage } from './pages/deposit/DepositPage';
import { HomePage } from './pages/home/HomePage';
import { MarketPage } from './pages/market/MarketPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { TradePage } from './pages/trade/TradePage';
import { useAuthStore } from './store/auth.store';
import { useTradeStore } from './store/trade.store';
import type { Tab } from './types/app';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeView, setActiveView] = useState<'main' | 'deposit'>('main');
  const [showAuth, setShowAuth] = useState(false);
  const [showLeverage, setShowLeverage] = useState(false);
  const pendingAuthAction = useRef<(() => void) | null>(null);
  const token = useAuthStore((state) => state.token);
  const isLogin = useAuthStore((state) => state.isLogin);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const setUserInfo = useAuthStore((state) => state.setUserInfo);
  const setHydrating = useAuthStore((state) => state.setHydrating);
  const clearSession = useAuthStore((state) => state.clearSession);
  const tradeMode = useTradeStore((state) => state.tradeMode);
  const setTradeMode = useTradeStore((state) => state.setTradeMode);
  const showChart = useTradeStore((state) => state.showChart);
  const setShowChart = useTradeStore((state) => state.setShowChart);

  useEffect(() => {
    if (!token) {
      setHydrating(false);
      return;
    }

    let ignore = false;

    async function hydrateUser() {
      try {
        setHydrating(true);
        const user = await fetchTradeUser();
        if (!ignore) setUserInfo(user);
      } catch (error) {
        if (!ignore) {
          clearSession();
          toast.error('登录已失效', {
            description: getErrorMessage(error),
          });
        }
      } finally {
        if (!ignore) setHydrating(false);
      }
    }

    hydrateUser();

    return () => {
      ignore = true;
    };
  }, [clearSession, setHydrating, setUserInfo, token]);

  const requireAuth = (action: () => void) => {
    if (isLogin) {
      action();
      return;
    }

    pendingAuthAction.current = action;
    setShowAuth(true);
  };

  const openDeposit = () => {
    requireAuth(() => setActiveView('deposit'));
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    const action = pendingAuthAction.current;
    pendingAuthAction.current = null;
    action?.();
  };

  const closeAuth = () => {
    pendingAuthAction.current = null;
    setShowAuth(false);
  };

  const goHomeAfterLogout = () => {
    setActiveView('main');
    setActiveTab('home');
  };

  const screen = useMemo(() => {
    if (showAuth) return <AuthPage onBack={closeAuth} onSuccess={handleAuthSuccess} />;
    if (activeView === 'deposit') return <DepositPage onBack={() => setActiveView('main')} />;
    if (activeTab === 'home') {
      return (
        <HomePage
          isLogin={isLogin}
          openAuth={() => requireAuth(() => undefined)}
          openDeposit={openDeposit}
          openTrade={() => setActiveTab('trade')}
        />
      );
    }
    if (activeTab === 'market') return <MarketPage openTrade={() => setActiveTab('trade')} />;
    if (activeTab === 'profile') return <ProfilePage onLoggedOut={goHomeAfterLogout} openDeposit={openDeposit} />;

    return (
      <TradePage
        mode={tradeMode}
        setMode={setTradeMode}
        showChart={showChart}
        setShowChart={setShowChart}
        openLeverage={() => setShowLeverage(true)}
      />
    );
  }, [activeTab, activeView, isLogin, showAuth, showChart, tradeMode]);

  const changeTab = (tab: Tab) => {
    const action = () => {
      setActiveView('main');
      setActiveTab(tab);
    };

    if (tab === 'profile') {
      requireAuth(action);
      return;
    }

    action();
  };

  return (
    <div className="min-h-screen bg-app text-ink">
      <main className="mx-auto min-h-screen w-full min-w-0 max-w-[430px] overflow-hidden bg-base pb-[calc(70px+env(safe-area-inset-bottom))] shadow-2xl shadow-black/35 max-[480px]:shadow-none">
        {screen}
        {activeView === 'main' && !showAuth && <BottomNav active={activeTab} onChange={changeTab} />}
      </main>
      {showLeverage && <LeverageModal onClose={() => setShowLeverage(false)} />}
      {isHydrating && (
        <div className="pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full border border-line bg-panel px-3 py-1.5 text-[0.72rem] text-muted-foreground shadow-lg shadow-black/20">
          恢复登录中
        </div>
      )}
      <Toaster
        position="top-center"
        offset={12}
        toastOptions={{
          classNames: {
            toast: 'border-line bg-panel text-ink shadow-lg shadow-black/30',
            title: 'text-[0.82rem] font-semibold',
            description: 'text-[0.72rem] text-muted-foreground',
            icon: 'text-brand',
          },
        }}
      />
    </div>
  );
}

export default App;

import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchTradeUser } from './api/auth';
import { getErrorMessage } from './api/client';
import type { DepositCoin, DepositNetwork } from './api/deposit';
import type { WithdrawCoin, WithdrawNetwork } from './api/withdraw';
import { BottomNav } from './components/BottomNav';
import { DepositSelectionDrawers } from './components/DepositSelectionDrawers';
import { LeverageModal } from './components/LeverageModal';
import { WithdrawSelectionDrawers } from './components/WithdrawSelectionDrawers';
import { Toaster } from './components/ui/sonner';
import { useDepositCoins } from './hooks/useDepositQueries';
import { useWithdrawCoins } from './hooks/useWithdrawQueries';
import { AuthPage } from './pages/auth/AuthPage';
import { DepositPage } from './pages/deposit/DepositPage';
import { HomePage } from './pages/home/HomePage';
import { MarketPage } from './pages/market/MarketPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { ProfileRecordsPage } from './pages/profile/ProfileRecordsPage';
import { ProfileSettingsPage } from './pages/profile/ProfileSettingsPage';
import { TradePage } from './pages/trade/TradePage';
import { TransferPage } from './pages/transfer/TransferPage';
import { WithdrawPage } from './pages/withdraw/WithdrawPage';
import { useAuthStore } from './store/auth.store';
import { useTradeStore } from './store/trade.store';

const protectedPaths = new Set(['/profile', '/profile/records', '/profile/settings', '/deposit', '/withdraw', '/transfer']);
const tabPaths = new Set(['/', '/market', '/trade', '/profile']);

function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [showLeverage, setShowLeverage] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
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
  const isProtectedRoute = protectedPaths.has(location.pathname);
  const showBottomNav = tabPaths.has(location.pathname) && !showAuth && !(isProtectedRoute && !isLogin);

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

  useEffect(() => {
    setShowAuth(false);
  }, [location.pathname]);

  const openAuth = () => setShowAuth(true);
  const closeAuth = () => setShowAuth(false);
  const handleAuthSuccess = () => setShowAuth(false);

  const goHomeAfterLogout = () => {
    navigate('/', { replace: true });
  };

  const goBackToProfile = () => {
    if (location.key !== 'default') {
      navigate(-1);
      return;
    }

    navigate('/profile', { replace: true });
  };

  const openDeposit = () => navigate('/deposit');
  const openWithdraw = () => navigate('/withdraw');
  const openTransfer = () => navigate('/transfer');
  const openTrade = () => navigate('/trade');
  const openRecords = () => navigate('/profile/records');
  const openSettings = () => navigate('/profile/settings');

  const routes = showAuth ? (
    <AuthPage onBack={closeAuth} onSuccess={handleAuthSuccess} />
  ) : (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            isLogin={isLogin}
            openAuth={openAuth}
            openDeposit={openDeposit}
            openWithdraw={openWithdraw}
            openTrade={openTrade}
          />
        }
      />
      <Route path="/market" element={<MarketPage openTrade={openTrade} />} />
      <Route
        path="/trade"
        element={
          <TradePage
            mode={tradeMode}
            setMode={setTradeMode}
            showChart={showChart}
            setShowChart={setShowChart}
            openLeverage={() => setShowLeverage(true)}
          />
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage
              openRecords={openRecords}
              openSettings={openSettings}
              openDeposit={openDeposit}
              openWithdraw={openWithdraw}
              openTransfer={openTransfer}
            />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/records"
        element={
          <RequireAuth>
            <ProfileRecordsPage onBack={goBackToProfile} />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/settings"
        element={
          <RequireAuth>
            <ProfileSettingsPage onBack={goBackToProfile} onLoggedOut={goHomeAfterLogout} />
          </RequireAuth>
        }
      />
      <Route
        path="/deposit"
        element={
          <RequireAuth>
            <DepositRoute onBack={goBackToProfile} />
          </RequireAuth>
        }
      />
      <Route
        path="/withdraw"
        element={
          <RequireAuth>
            <WithdrawRoute onBack={goBackToProfile} />
          </RequireAuth>
        }
      />
      <Route
        path="/transfer"
        element={
          <RequireAuth>
            <TransferPage onBack={goBackToProfile} />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <div className="min-h-screen bg-app text-ink">
      <main className="mx-auto min-h-screen w-full min-w-0 max-w-[430px] overflow-hidden bg-base pb-[calc(70px+env(safe-area-inset-bottom))] shadow-2xl shadow-black/35 max-[480px]:shadow-none">
        {routes}
        {showBottomNav && <BottomNav />}
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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const isLogin = useAuthStore((state) => state.isLogin);

  if (!isLogin) {
    return <AuthPage onBack={() => navigate('/', { replace: true })} onSuccess={() => undefined} />;
  }

  return children;
}

function DepositRoute({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: coins = [], isLoading, isError, refetch } = useDepositCoins();
  const coinParam = normalizeParam(searchParams.get('coin'));
  const networkParam = normalizeParam(searchParams.get('network'));
  const selectedCoin = useMemo(
    () => coins.find((coin) => normalizeParam(coin.coinCode) === coinParam) ?? null,
    [coinParam, coins],
  );
  const selectedNetwork = useMemo(
    () => selectedCoin?.networks.find((network) => normalizeParam(network.networkCode) === networkParam) ?? null,
    [networkParam, selectedCoin],
  );

  useEffect(() => {
    if (isLoading || isError) return;

    if ((coinParam && !selectedCoin) || (selectedCoin && networkParam && !selectedNetwork)) {
      navigate('/deposit', { replace: true });
    }
  }, [coinParam, isError, isLoading, navigate, networkParam, selectedCoin, selectedNetwork]);

  const selectCoin = (coin: DepositCoin) => {
    if (!coin.networks.length) {
      toast.error('当前资产暂无可用充值网络');
      return;
    }

    navigate(`/deposit?coin=${encodeURIComponent(coin.coinCode)}`, { replace: true });
  };

  const selectNetwork = (network: DepositNetwork) => {
    if (!selectedCoin) return;

    navigate(
      `/deposit?coin=${encodeURIComponent(selectedCoin.coinCode)}&network=${encodeURIComponent(network.networkCode)}`,
      { replace: true },
    );
  };

  if (isLoading) return <RouteLoading label="充值资产加载中" />;
  if (isError) return <RouteError title="充值资产加载失败" onRetry={() => refetch()} onBack={onBack} />;

  return (
    <>
      {selectedCoin && selectedNetwork ? (
        <DepositPage coin={selectedCoin} network={selectedNetwork} onBack={onBack} />
      ) : (
        <RouteLoading label={selectedCoin ? '请选择充值网络' : '请选择充值资产'} />
      )}
      <DepositSelectionDrawers
        coinOpen={!selectedCoin}
        networkOpen={Boolean(selectedCoin && !selectedNetwork)}
        selectedCoin={selectedCoin}
        onCoinOpenChange={(open) => {
          if (!open && !selectedCoin) onBack();
        }}
        onNetworkOpenChange={(open) => {
          if (!open && selectedCoin && !selectedNetwork) onBack();
        }}
        onSelectCoin={selectCoin}
        onSelectNetwork={selectNetwork}
      />
    </>
  );
}

function WithdrawRoute({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: coins = [], isLoading, isError, refetch } = useWithdrawCoins();
  const coinParam = normalizeParam(searchParams.get('coin'));
  const networkParam = normalizeParam(searchParams.get('network'));
  const selectedCoin = useMemo(
    () => coins.find((coin) => normalizeParam(coin.coinCode) === coinParam) ?? null,
    [coinParam, coins],
  );
  const selectedNetwork = useMemo(
    () => selectedCoin?.networks.find((network) => normalizeParam(network.networkCode) === networkParam) ?? null,
    [networkParam, selectedCoin],
  );

  useEffect(() => {
    if (isLoading || isError) return;

    if ((coinParam && !selectedCoin) || (selectedCoin && networkParam && !selectedNetwork)) {
      navigate('/withdraw', { replace: true });
    }
  }, [coinParam, isError, isLoading, navigate, networkParam, selectedCoin, selectedNetwork]);

  const selectCoin = (coin: WithdrawCoin) => {
    if (!coin.networks.length) {
      toast.error('当前资产暂无可用提现网络');
      return;
    }

    navigate(`/withdraw?coin=${encodeURIComponent(coin.coinCode)}`, { replace: true });
  };

  const selectNetwork = (network: WithdrawNetwork) => {
    if (!selectedCoin) return;

    navigate(
      `/withdraw?coin=${encodeURIComponent(selectedCoin.coinCode)}&network=${encodeURIComponent(network.networkCode)}`,
      { replace: true },
    );
  };

  if (isLoading) return <RouteLoading label="提现资产加载中" />;
  if (isError) return <RouteError title="提现资产加载失败" onRetry={() => refetch()} onBack={onBack} />;

  return (
    <>
      {selectedCoin && selectedNetwork ? (
        <WithdrawPage coin={selectedCoin} network={selectedNetwork} onBack={onBack} />
      ) : (
        <RouteLoading label={selectedCoin ? '请选择提现网络' : '请选择提现资产'} />
      )}
      <WithdrawSelectionDrawers
        coinOpen={!selectedCoin}
        networkOpen={Boolean(selectedCoin && !selectedNetwork)}
        selectedCoin={selectedCoin}
        onCoinOpenChange={(open) => {
          if (!open && !selectedCoin) onBack();
        }}
        onNetworkOpenChange={(open) => {
          if (!open && selectedCoin && !selectedNetwork) onBack();
        }}
        onSelectCoin={selectCoin}
        onSelectNetwork={selectNetwork}
      />
    </>
  );
}

function RouteLoading({ label }: { label: string }) {
  return (
    <section className="grid min-h-screen place-items-center bg-base px-4 text-center text-[0.82rem] text-muted-foreground">
      {label}
    </section>
  );
}

function RouteError({ title, onRetry, onBack }: { title: string; onRetry: () => void; onBack: () => void }) {
  return (
    <section className="grid min-h-screen place-items-center bg-base px-4">
      <div className="w-full rounded-md border border-line bg-panel px-3 py-4 text-center">
        <p className="text-[0.86rem] font-semibold text-ink">{title}</p>
        <p className="mt-1 text-[0.74rem] text-muted-foreground">请检查网络后重试</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="h-9 rounded-md border border-line bg-base2 text-[0.82rem] font-semibold" onClick={onBack}>
            返回
          </button>
          <button className="h-9 rounded-md bg-brand text-[0.82rem] font-semibold text-[#06130e]" onClick={onRetry}>
            重新加载
          </button>
        </div>
      </div>
    </section>
  );
}

function normalizeParam(value?: string | null) {
  return value?.trim().toUpperCase() || '';
}

export default App;

import { useMemo, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { LeverageModal } from './components/LeverageModal';
import { Toaster } from './components/ui/sonner';
import { DepositPage } from './pages/deposit/DepositPage';
import { HomePage } from './pages/home/HomePage';
import { MarketPage } from './pages/market/MarketPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { TradePage } from './pages/trade/TradePage';
import { useTradeStore } from './store/trade.store';
import type { Tab } from './types/app';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeView, setActiveView] = useState<'main' | 'deposit'>('main');
  const [showLeverage, setShowLeverage] = useState(false);
  const tradeMode = useTradeStore((state) => state.tradeMode);
  const setTradeMode = useTradeStore((state) => state.setTradeMode);
  const showChart = useTradeStore((state) => state.showChart);
  const setShowChart = useTradeStore((state) => state.setShowChart);

  const screen = useMemo(() => {
    if (activeView === 'deposit') return <DepositPage onBack={() => setActiveView('main')} />;
    if (activeTab === 'home') return <HomePage openDeposit={() => setActiveView('deposit')} openTrade={() => setActiveTab('trade')} />;
    if (activeTab === 'market') return <MarketPage openTrade={() => setActiveTab('trade')} />;
    if (activeTab === 'profile') return <ProfilePage openDeposit={() => setActiveView('deposit')} />;

    return (
      <TradePage
        mode={tradeMode}
        setMode={setTradeMode}
        showChart={showChart}
        setShowChart={setShowChart}
        openLeverage={() => setShowLeverage(true)}
      />
    );
  }, [activeTab, activeView, showChart, tradeMode]);

  const changeTab = (tab: Tab) => {
    setActiveView('main');
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-app text-ink">
      <main className="mx-auto min-h-screen w-full min-w-0 max-w-[430px] overflow-hidden bg-base pb-[calc(70px+env(safe-area-inset-bottom))] shadow-2xl shadow-black/35 max-[480px]:shadow-none">
        {screen}
        {activeView === 'main' && <BottomNav active={activeTab} onChange={changeTab} />}
      </main>
      {showLeverage && <LeverageModal onClose={() => setShowLeverage(false)} />}
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

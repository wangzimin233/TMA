import { useMemo, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { LeverageModal } from './components/LeverageModal';
import { HomePage } from './pages/home/HomePage';
import { MarketPage } from './pages/market/MarketPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { TradePage } from './pages/trade/TradePage';
import { useTradeStore } from './store/trade.store';
import type { Tab } from './types/app';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showLeverage, setShowLeverage] = useState(false);
  const tradeMode = useTradeStore((state) => state.tradeMode);
  const setTradeMode = useTradeStore((state) => state.setTradeMode);
  const showChart = useTradeStore((state) => state.showChart);
  const setShowChart = useTradeStore((state) => state.setShowChart);

  const screen = useMemo(() => {
    if (activeTab === 'home') return <HomePage openTrade={() => setActiveTab('trade')} />;
    if (activeTab === 'market') return <MarketPage openTrade={() => setActiveTab('trade')} />;
    if (activeTab === 'profile') return <ProfilePage />;

    return (
      <TradePage
        mode={tradeMode}
        setMode={setTradeMode}
        showChart={showChart}
        setShowChart={setShowChart}
        openLeverage={() => setShowLeverage(true)}
      />
    );
  }, [activeTab, showChart, tradeMode]);

  return (
    <div className="min-h-screen bg-app text-ink">
      <main className="mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-base pb-24 shadow-2xl shadow-black/40">
        {screen}
        <BottomNav active={activeTab} onChange={setActiveTab} />
      </main>
      {showLeverage && <LeverageModal onClose={() => setShowLeverage(false)} />}
    </div>
  );
}

export default App;

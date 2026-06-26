import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { WithdrawCoin, WithdrawNetwork } from '../api/withdraw';
import { useWithdrawCoins } from '../hooks/useWithdrawQueries';
import { Button } from './ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer';
import { Input } from './ui/input';

type WithdrawSelectionDrawersProps = {
  coinOpen: boolean;
  networkOpen: boolean;
  selectedCoin: WithdrawCoin | null;
  onCoinOpenChange: (open: boolean) => void;
  onNetworkOpenChange: (open: boolean) => void;
  onSelectCoin: (coin: WithdrawCoin) => void;
  onSelectNetwork: (network: WithdrawNetwork) => void;
};

export function WithdrawSelectionDrawers({
  coinOpen,
  networkOpen,
  selectedCoin,
  onCoinOpenChange,
  onNetworkOpenChange,
  onSelectCoin,
  onSelectNetwork,
}: WithdrawSelectionDrawersProps) {
  const [keyword, setKeyword] = useState('');
  const { data: coins = [], isError, isLoading, refetch } = useWithdrawCoins(coinOpen);
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredCoins = useMemo(() => {
    if (!normalizedKeyword) return coins;

    return coins.filter((coin) => {
      const code = coin.coinCode.toLowerCase();
      const name = coin.coinName.toLowerCase();
      return code.includes(normalizedKeyword) || name.includes(normalizedKeyword);
    });
  }, [coins, normalizedKeyword]);

  return (
    <>
      <Drawer open={coinOpen} onOpenChange={onCoinOpenChange} direction="bottom">
        <DrawerContent className="mx-auto max-h-[86vh] w-full max-w-[430px] border-line bg-base pb-[env(safe-area-inset-bottom)] text-ink">
          <DrawerHeader className="px-4 pb-2 pt-4 text-left">
            <DrawerTitle className="text-[1.05rem] font-semibold text-ink">选择提现资产</DrawerTitle>
            <DrawerDescription className="sr-only">搜索并选择要提现的资产</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="请输入关键字搜索"
                className="h-10 rounded-md border-line bg-base2 pl-9 text-[0.86rem] text-ink placeholder:text-muted-foreground focus-visible:ring-brand/25"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            {isLoading && <CoinListSkeleton />}
            {isError && (
              <div className="mx-2 rounded-md border border-line bg-panel px-3 py-4 text-center">
                <p className="text-[0.82rem] font-medium text-ink">资产列表加载失败</p>
                <p className="mt-1 text-[0.72rem] text-muted-foreground">请检查网络后重试</p>
                <Button className="mt-3 h-8 bg-brand text-primary-foreground" onClick={() => refetch()}>
                  重新加载
                </Button>
              </div>
            )}
            {!isLoading && !isError && filteredCoins.length === 0 && (
              <div className="px-2 py-8 text-center text-[0.78rem] text-muted-foreground">没有匹配的资产</div>
            )}
            {!isLoading &&
              !isError &&
              filteredCoins.map((coin) => (
                <button
                  key={coin.coinCode}
                  className="flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-3 text-left active:bg-soft"
                  onClick={() => onSelectCoin(coin)}
                >
                  <CoinAvatar coin={coin} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.94rem] font-semibold leading-tight text-ink">{coin.coinCode}</span>
                    <span className="mt-1 block truncate text-[0.76rem] leading-tight text-muted-foreground">{coin.coinName}</span>
                  </span>
                  <span className="shrink-0 text-[0.68rem] text-muted-foreground">{coin.networks.length} 网络</span>
                </button>
              ))}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={networkOpen} onOpenChange={onNetworkOpenChange} direction="bottom">
        <DrawerContent className="mx-auto max-h-[86vh] w-full max-w-[430px] border-line bg-base pb-[env(safe-area-inset-bottom)] text-ink">
          <DrawerHeader className="px-4 pb-2 pt-4 text-left">
            <DrawerTitle className="text-[1.05rem] font-semibold text-ink">选择提现网络</DrawerTitle>
            <DrawerDescription className="text-left text-[0.74rem] text-muted-foreground">
              {selectedCoin ? `提现 ${selectedCoin.coinCode} 前请确认链网络` : '请选择资产后再选择网络'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
            {selectedCoin?.networks.length ? (
              selectedCoin.networks.map((network) => (
                <button
                  key={`${selectedCoin.coinCode}-${network.networkCode}`}
                  className="w-full rounded-md border border-line bg-panel px-3 py-3 text-left active:bg-soft"
                  onClick={() => onSelectNetwork(network)}
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 text-[0.96rem] font-semibold text-ink">{network.chainCode || network.networkCode}</span>
                    <span className="min-w-0 truncate text-[0.78rem] text-muted-foreground">
                      {network.networkName} ({network.networkCode})
                    </span>
                  </span>
                  <span className="my-2 block h-px bg-line" />
                  <span className="block text-[0.76rem] leading-6 text-muted-foreground">
                    最低提现 &gt; {formatNumber(network.minWithdrawAmount)} {selectedCoin.coinCode}
                  </span>
                  <span className="block text-[0.76rem] leading-6 text-muted-foreground">
                    手续费 {formatNumber(network.withdrawFee)} {selectedCoin.coinCode}
                  </span>
                  <span className="block text-[0.76rem] leading-6 text-muted-foreground">
                    {network.confirmCount || 1} 次区块确认
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-md border border-line bg-panel px-3 py-6 text-center text-[0.78rem] text-muted-foreground">
                当前资产暂无可用提现网络
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function CoinAvatar({ coin }: { coin: WithdrawCoin }) {
  if (coin.iconUrl) {
    return (
      <img
        src={coin.iconUrl}
        alt=""
        className="size-8 shrink-0 rounded-full bg-soft object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-danger/15 text-[0.72rem] font-semibold text-danger">
      {coin.coinCode.slice(0, 2)}
    </span>
  );
}

function CoinListSkeleton() {
  return (
    <div className="space-y-2 px-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-md px-3 py-3">
          <span className="size-8 shrink-0 animate-pulse rounded-full bg-soft" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-20 animate-pulse rounded bg-soft" />
            <span className="block h-2.5 w-32 animate-pulse rounded bg-soft" />
          </span>
        </div>
      ))}
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8,
  }).format(value || 0);
}

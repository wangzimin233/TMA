import { useMemo } from 'react';
import {
  Copy,
  FileText,
  Repeat2,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AccountAsset, AccountSummary, AccountType } from '../../api/account';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAccountAssets, useAccountOverview, useAccountSummary } from '../../hooks/useAccountQueries';
import { useAuthStore } from '../../store/auth.store';
import { useProfileUiStore, type ProfileAssetTab } from '../../store/profile-ui.store';

export function ProfilePage({
  openRecords,
  openSettings,
  openDeposit,
  openWithdraw,
  openTransfer,
}: {
  openRecords: () => void;
  openSettings: () => void;
  openDeposit: () => void;
  openWithdraw: () => void;
  openTransfer: (fromAccountType?: AccountType, toAccountType?: AccountType, coinCode?: string) => void;
}) {
  const userInfo = useAuthStore((state) => state.userInfo);
  const displayName = userInfo?.nickname || userInfo?.email || '交易用户';
  const uid = userInfo?.uid || String(userInfo?.userId ?? '--');
  const displayUid = maskUid(uid);
  const userLevel = userInfo && 'userLevel' in userInfo ? userInfo.userLevel : 1;

  const copyUid = async () => {
    if (!uid || uid === '--') {
      toast.error('暂无 UID 可复制');
      return;
    }

    try {
      await copyText(uid);
      toast.success('UID 已复制');
    } catch {
      toast.error('复制失败', {
        description: '当前浏览器不允许写入剪贴板，请稍后重试',
      });
    }
  };

  return (
    <section className="px-4 pt-3.5">
      <div className="border-b border-line pb-3.5">
        <div className="flex items-center gap-2">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-soft text-[1.05rem] text-brand">👤</div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[1.02rem] font-semibold leading-tight">{displayName}</h1>
            <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[0.72rem] text-muted-foreground">
              <span className="inline-flex h-5 shrink-0 items-center rounded bg-brand px-1.5 text-[0.66rem] font-semibold leading-none text-white whitespace-nowrap">
                LV {userLevel}
              </span>
              <span className="inline-flex min-w-0 flex-1 items-center gap-1">
                <span className="truncate">UID: {displayUid}</span>
                <Button
                  aria-label="复制 UID"
                  className="size-5 shrink-0 rounded-sm bg-transparent p-0 text-brand hover:bg-brand/10 hover:text-brand"
                  size="icon-xs"
                  variant="ghost"
                  onClick={copyUid}
                >
                  <Copy className="size-3.5" />
                </Button>
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              aria-label="记录"
              className="size-8 rounded-md border-line bg-soft p-0 text-muted-foreground hover:bg-soft2 hover:text-ink"
              size="icon"
              variant="outline"
              onClick={openRecords}
            >
              <FileText className="size-4" />
            </Button>
            <Button
              aria-label="偏好设置"
              className="size-8 rounded-md border-line bg-soft p-0 text-muted-foreground hover:bg-soft2 hover:text-ink"
              size="icon"
              variant="outline"
              onClick={openSettings}
            >
              <Settings className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="border-b border-line py-4">
        <AccountAssetModule openDeposit={openDeposit} openWithdraw={openWithdraw} openTransfer={openTransfer} />
      </div>
    </section>
  );
}

const ASSET_TABS: Array<{ value: ProfileAssetTab; label: string; accountType?: AccountType }> = [
  { value: 'overview', label: '总览' },
  { value: 'fund', label: '资金', accountType: 'FUND' },
  { value: 'spot', label: '现货', accountType: 'SPOT' },
  { value: 'futures', label: '合约', accountType: 'FUTURES' },
];

function AccountAssetModule({
  openDeposit,
  openWithdraw,
  openTransfer,
}: {
  openDeposit: () => void;
  openWithdraw: () => void;
  openTransfer: (fromAccountType?: AccountType, toAccountType?: AccountType, coinCode?: string) => void;
}) {
  const activeTab = useProfileUiStore((state) => state.profileAssetTab);
  const setActiveTab = useProfileUiStore((state) => state.setProfileAssetTab);
  const { data: overview, isLoading: overviewLoading } = useAccountOverview();
  const { data: allAssets = [], isLoading: assetsLoading, isError, refetch } = useAccountAssets();
  const { data: summaries = [] } = useAccountSummary();
  const currentTab = ASSET_TABS.find((tab) => tab.value === activeTab) ?? ASSET_TABS[0];
  const visibleAssets = useMemo(() => {
    if (!currentTab.accountType) return aggregateAssetsByCoin(allAssets);
    return allAssets.filter((asset) => asset.accountType === currentTab.accountType);
  }, [allAssets, currentTab.accountType]);
  const activeSummary = useMemo(
    () => summaries.find((summary) => summary.accountType === currentTab.accountType),
    [currentTab.accountType, summaries],
  );
  const showFundActions = activeTab === 'overview' || activeTab === 'fund';
  const isLoading = assetsLoading || (activeTab === 'overview' && overviewLoading);

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProfileAssetTab)} className="gap-0">
      <div className="no-scrollbar -mx-1 overflow-x-auto pb-1">
        <TabsList variant="line" className="h-9 min-w-max gap-4 px-1">
          {ASSET_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="h-8 shrink-0 px-0 text-[0.95rem] font-semibold text-muted-foreground data-[state=active]:text-ink group-data-[variant=line]/tabs-list:data-[state=active]:after:bg-brand"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className={activeTab === 'overview' ? 'pt-3' : 'pt-1.5'}>
        {activeTab === 'overview' && (
          <>
            <p className="text-[0.72rem] text-muted-foreground">预估总资产</p>
            <div className="mt-2 flex min-w-0 items-end gap-2">
              {overviewLoading ? (
                <span className="h-8 w-36 animate-pulse rounded bg-soft" />
              ) : (
                <>
                  <span className="font-mono text-[1.48rem] font-bold leading-none tabular-nums">
                    {formatMoney(overview?.estimatedTotalValue)}
                  </span>
                  <span className="pb-0.5 font-mono text-[0.78rem] font-semibold text-ink tabular-nums">
                    {overview?.valuationCoinCode ?? 'USDT'}
                  </span>
                </>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] text-muted-foreground">
              <span>
                今日盈亏{' '}
                <span className={getSignedClass(overview?.todayPnlValue)}>
                  {formatSigned(overview?.todayPnlValue)} {overview?.valuationCoinCode ?? 'USDT'}
                </span>
              </span>
              {overview?.hasOtherCoinAssets && <span>含未折算币种</span>}
            </div>
          </>
          )}

        {activeSummary && <AccountSummaryStrip summary={activeSummary} />}

        <div className={showFundActions ? 'mt-4 grid grid-cols-3 gap-2' : 'mt-4'}>
          {showFundActions && (
            <>
              <Button className="h-10 rounded-md bg-brand text-[0.86rem] font-semibold text-primary-foreground hover:bg-brand/90" onClick={openDeposit}>
                充值
              </Button>
              <Button className="h-10 rounded-md bg-soft text-[0.86rem] font-semibold text-ink hover:bg-soft2" onClick={openWithdraw}>
                提现
              </Button>
            </>
          )}
          <Button
            className={`${showFundActions ? '' : 'w-full'} h-10 rounded-md bg-soft text-[0.86rem] font-semibold text-ink hover:bg-soft2`}
            onClick={() => openTransfer(currentTab.accountType)}
          >
            <Repeat2 className="size-4" />
            划转
          </Button>
        </div>
      </div>

      {ASSET_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[0.88rem] font-semibold">币种</h2>
            <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">{visibleAssets.length} 项</span>
          </div>
          {isError && (
            <div className="rounded-md border border-line bg-panel px-3 py-4 text-center">
              <p className="text-[0.82rem] font-medium">资产列表加载失败</p>
              <Button className="mt-3 h-8 bg-brand text-primary-foreground" onClick={() => refetch()}>
                重新加载
              </Button>
            </div>
          )}
          {isLoading && <AssetListSkeleton />}
          {!isLoading && !isError && visibleAssets.length === 0 && (
            <div className="rounded-md border border-line bg-panel px-3 py-6 text-center text-[0.78rem] text-muted-foreground">
              暂无资产
            </div>
          )}
          {!isLoading && !isError && (
            <div className="divide-y divide-line/70">
              {visibleAssets.map((asset) => (
                <AssetRow key={`${tab.value}-${asset.accountType}-${asset.coinCode}`} asset={asset} showFuturesFields={tab.value === 'futures'} />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function AccountSummaryStrip({ summary }: { summary: AccountSummary }) {
  return (
    <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-2 rounded-md bg-base2 px-3 py-2.5">
      <SummaryMetric label="可用" value={summary.availableValue} />
      <SummaryMetric label="冻结" value={summary.frozenValue} />
      {summary.accountType === 'FUTURES' && (
        <>
          <SummaryMetric label="保证金" value={summary.marginValue} />
          <SummaryMetric label="未实现盈亏" value={summary.unrealizedPnlValue} signed />
        </>
      )}
    </div>
  );
}

function SummaryMetric({ label, value, signed = false }: { label: string; value: number; signed?: boolean }) {
  return (
    <span className="min-w-0">
      <span className="block text-[0.68rem] text-muted-foreground">{label}</span>
      <span className={`mt-0.5 block truncate font-mono text-[0.78rem] tabular-nums ${signed ? getSignedClass(value) : ''}`}>
        {signed ? formatSigned(value) : formatMoney(value)}
      </span>
    </span>
  );
}

function AssetRow({ asset, showFuturesFields }: { asset: AccountAsset; showFuturesFields: boolean }) {
  return (
    <div className="min-w-0 py-3.5">
      <div className="flex min-w-0 items-start gap-3">
        <CoinAvatar coinCode={asset.coinCode} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="truncate text-[0.96rem] font-semibold">{asset.coinCode}</span>
            <span className="truncate text-[0.72rem] text-muted-foreground">{asset.coinName}</span>
          </div>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">{asset.accountName}</p>
        </div>
        <div className="min-w-0 shrink-0 text-right">
          <p className="font-mono text-[0.98rem] font-semibold leading-tight tabular-nums">{formatMoney(asset.totalBalance)}</p>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">总额</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 pl-11">
        <AssetMetric label="可用" value={asset.availableBalance} />
        <AssetMetric label="冻结" value={asset.frozenBalance} />
        <AssetMetric label="待入账" value={asset.pendingDeposit} />
        <AssetMetric label="待提现" value={asset.pendingWithdraw} />
        {showFuturesFields && (
          <>
            <AssetMetric label="保证金" value={asset.marginBalance} />
            <AssetMetric label="未实现盈亏" value={asset.unrealizedPnlBalance} signed />
          </>
        )}
      </div>
    </div>
  );
}

function AssetMetric({ label, value, signed = false }: { label: string; value: number; signed?: boolean }) {
  return (
    <span className="min-w-0">
      <span className="block text-[0.68rem] text-muted-foreground">{label}</span>
      <span className={`mt-0.5 block truncate font-mono text-[0.76rem] tabular-nums ${signed ? getSignedClass(value) : 'text-ink'}`}>
        {signed ? formatSigned(value) : formatMoney(value)}
      </span>
    </span>
  );
}

function CoinAvatar({ coinCode }: { coinCode: string }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-[0.68rem] font-bold text-primary-foreground">
      {coinCode.slice(0, 2)}
    </span>
  );
}

function AssetListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 py-2">
          <span className="size-8 shrink-0 animate-pulse rounded-full bg-soft" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-4 w-24 animate-pulse rounded bg-soft" />
            <span className="block h-3 w-40 animate-pulse rounded bg-soft" />
            <span className="block h-3 w-48 animate-pulse rounded bg-soft" />
          </span>
        </div>
      ))}
    </div>
  );
}

function aggregateAssetsByCoin(assets: AccountAsset[]): AccountAsset[] {
  const assetMap = new Map<string, AccountAsset>();

  assets.forEach((asset) => {
    const current = assetMap.get(asset.coinCode);
    if (!current) {
      assetMap.set(asset.coinCode, {
        ...asset,
        accountId: 0,
        accountType: 'ALL',
        accountName: '全部账户',
      });
      return;
    }

    current.totalBalance += Number(asset.totalBalance) || 0;
    current.availableBalance += Number(asset.availableBalance) || 0;
    current.frozenBalance += Number(asset.frozenBalance) || 0;
    current.marginBalance += Number(asset.marginBalance) || 0;
    current.unrealizedPnlBalance += Number(asset.unrealizedPnlBalance) || 0;
    current.pendingDeposit += Number(asset.pendingDeposit) || 0;
    current.pendingWithdraw += Number(asset.pendingWithdraw) || 0;
  });

  return Array.from(assetMap.values()).sort((a, b) => Number(b.totalBalance) - Number(a.totalBalance));
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8,
  }).format(Number(value) || 0);
}

function formatSigned(value?: number) {
  const normalizedValue = Number(value) || 0;
  const prefix = normalizedValue > 0 ? '+' : '';
  return `${prefix}${formatMoney(normalizedValue)}`;
}

function getSignedClass(value?: number) {
  const normalizedValue = Number(value) || 0;
  if (normalizedValue > 0) return 'text-buy';
  if (normalizedValue < 0) return 'text-sell';
  return 'text-muted-foreground';
}

function maskUid(uid: string) {
  if (uid.length <= 9) return uid;
  return `${uid.slice(0, 5)}...${uid.slice(-4)}`;
}

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some in-app WebViews expose Clipboard API but reject writes.
    }
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const copied = document.execCommand('copy');
    if (!copied) throw new Error('Copy rejected');
  } finally {
    document.body.removeChild(textArea);
  }
}

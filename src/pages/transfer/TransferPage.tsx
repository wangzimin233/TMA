import { ArrowLeft, ChevronDown, Repeat2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { AccountAsset, AccountType } from '../../api/account';
import { getErrorMessage } from '../../api/client';
import { Button } from '../../components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '../../components/ui/drawer';
import { Input } from '../../components/ui/input';
import { useAccountAssets, useTransferAccount } from '../../hooks/useAccountQueries';

const ACCOUNT_OPTIONS: Array<{ type: AccountType; label: string }> = [
  { type: 'FUND', label: '资金账户' },
  { type: 'SPOT', label: '现货账户' },
  { type: 'FUTURES', label: '合约账户' },
];

export function TransferPage({ onBack }: { onBack: () => void }) {
  const [fromAccountType, setFromAccountType] = useState<AccountType>('SPOT');
  const [toAccountType, setToAccountType] = useState<AccountType>('FUND');
  const [selectedCoinCode, setSelectedCoinCode] = useState('');
  const [amount, setAmount] = useState('');
  const [accountPicker, setAccountPicker] = useState<'from' | 'to' | null>(null);
  const [coinPickerOpen, setCoinPickerOpen] = useState(false);
  const { data: fromAssets = [], isLoading, isError, refetch } = useAccountAssets(fromAccountType);
  const transferMutation = useTransferAccount();

  const availableAssets = useMemo(
    () => fromAssets.filter((asset) => Number(asset.availableBalance) > 0),
    [fromAssets],
  );
  const selectedAsset = useMemo(
    () => availableAssets.find((asset) => asset.coinCode === selectedCoinCode) ?? availableAssets[0],
    [availableAssets, selectedCoinCode],
  );
  const normalizedCoinCode = selectedAsset?.coinCode ?? '';
  const isUnsupportedPair =
    (fromAccountType === 'SPOT' && toAccountType === 'FUTURES') ||
    (fromAccountType === 'FUTURES' && toAccountType === 'SPOT');
  const parsedAmount = Number(amount);
  const availableBalance = Number(selectedAsset?.availableBalance ?? 0);
  const amountInvalid = !Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > availableBalance;
  const sameAccount = fromAccountType === toAccountType;
  const submitDisabled =
    sameAccount ||
    isUnsupportedPair ||
    !normalizedCoinCode ||
    amountInvalid ||
    transferMutation.isPending;

  const selectAccount = (type: AccountType) => {
    if (accountPicker === 'from') {
      setFromAccountType(type);
      setSelectedCoinCode('');
      setAmount('');
    } else if (accountPicker === 'to') {
      setToAccountType(type);
    }
    setAccountPicker(null);
  };

  const swapAccounts = () => {
    setFromAccountType(toAccountType);
    setToAccountType(fromAccountType);
    setSelectedCoinCode('');
    setAmount('');
  };

  const selectCoin = (asset: AccountAsset) => {
    setSelectedCoinCode(asset.coinCode);
    setAmount('');
    setCoinPickerOpen(false);
  };

  const submitTransfer = async () => {
    if (submitDisabled) return;

    try {
      await transferMutation.mutateAsync({
        fromAccountType,
        toAccountType,
        coinCode: normalizedCoinCode,
        amount: parsedAmount,
        remark: `${getAccountLabel(fromAccountType)}划转到${getAccountLabel(toAccountType)}`,
      });
      toast.success('划转成功');
      onBack();
    } catch (error) {
      toast.error('划转失败', {
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <section className="flex min-h-screen flex-col bg-base px-4 pb-[calc(18px+env(safe-area-inset-bottom))] pt-3.5">
      <header className="relative flex h-10 items-center justify-center">
        <button className="absolute left-0 grid size-9 place-items-center rounded-md active:bg-soft" onClick={onBack}>
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-[1.08rem] font-semibold">划转</h1>
      </header>

      <div className="relative mt-5 rounded-lg bg-card px-3.5 py-2.5">
        <AccountRow label="从" value={getAccountLabel(fromAccountType)} onClick={() => setAccountPicker('from')} />
        <div className="mx-1 h-px bg-line/70" />
        <AccountRow label="到" value={getAccountLabel(toAccountType)} onClick={() => setAccountPicker('to')} />
        <button
          className="absolute right-9 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink active:bg-soft"
          onClick={swapAccounts}
          aria-label="交换账户"
        >
          <Repeat2 className="size-5 rotate-90" />
        </button>
      </div>

      {(sameAccount || isUnsupportedPair) && (
        <div className="mt-2.5 rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-[0.74rem] leading-5 text-warning">
          {sameAccount ? '转出与转入账户不能相同' : '当前接口暂不支持现货与合约直转，请选择资金账户中转。'}
        </div>
      )}

      <FieldLabel>币种</FieldLabel>
      <button
        className="flex h-[3.35rem] w-full items-center gap-2 rounded-lg bg-card px-3.5 text-left active:bg-soft"
        onClick={() => setCoinPickerOpen(true)}
      >
        <CoinAvatar coinCode={normalizedCoinCode || '--'} />
        <span className="min-w-0 flex-1">
          <span className="block text-[0.92rem] font-semibold">{normalizedCoinCode || '选择币种'}</span>
          {selectedAsset?.coinName && (
            <span className="mt-0.5 block truncate text-[0.72rem] text-muted-foreground">{selectedAsset.coinName}</span>
          )}
        </span>
        <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />
      </button>

      <FieldLabel>数量</FieldLabel>
      <div className="rounded-lg bg-card px-3.5 py-3">
        <div className="flex items-center gap-2">
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="最少 0.00000001"
            className="h-9 flex-1 border-0 bg-transparent px-0 font-mono text-[1rem] text-ink shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
          />
          <span className="shrink-0 font-mono text-[0.9rem] font-semibold">{normalizedCoinCode || '--'}</span>
          <button
            className="shrink-0 text-[0.84rem] font-semibold text-brand disabled:text-muted-foreground"
            disabled={!selectedAsset}
            onClick={() => setAmount(formatPlain(availableBalance))}
          >
            最大
          </button>
        </div>
      </div>
      <p className="mt-2 text-[0.74rem] text-muted-foreground">
        可用 {formatNumber(availableBalance)} {normalizedCoinCode || '--'}
      </p>

      {isError && (
        <div className="mt-4 rounded-md border border-line bg-panel px-3 py-4 text-center">
          <p className="text-[0.82rem] font-medium">资产加载失败</p>
          <Button className="mt-3 h-8 bg-brand text-primary-foreground" onClick={() => refetch()}>
            重新加载
          </Button>
        </div>
      )}

      <div className="mt-auto pt-6">
        <Button
          className="h-12 w-full rounded-lg bg-brand text-[0.95rem] font-semibold text-primary-foreground hover:bg-brand/90 disabled:bg-brand/35 disabled:text-primary-foreground/55"
          disabled={submitDisabled}
          onClick={submitTransfer}
        >
          {transferMutation.isPending ? '划转中' : '确认划转'}
        </Button>
      </div>

      <Drawer open={Boolean(accountPicker)} onOpenChange={(open) => !open && setAccountPicker(null)} direction="bottom">
        <DrawerContent className="mx-auto max-h-[70vh] w-full max-w-[430px] border-line bg-base pb-[env(safe-area-inset-bottom)] text-ink">
          <DrawerHeader className="px-4 pb-2 pt-4 text-left">
            <DrawerTitle className="text-[1.05rem] font-semibold">选择账户</DrawerTitle>
            <DrawerDescription className="sr-only">选择划转账户</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-1 px-2 pb-4">
            {ACCOUNT_OPTIONS.map((account) => (
              <button
                key={account.type}
                className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left active:bg-soft"
                onClick={() => selectAccount(account.type)}
              >
                <span className="text-[0.92rem] font-semibold">{account.label}</span>
                <span className="font-mono text-[0.72rem] text-muted-foreground">{account.type}</span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={coinPickerOpen} onOpenChange={setCoinPickerOpen} direction="bottom">
        <DrawerContent className="mx-auto max-h-[78vh] w-full max-w-[430px] border-line bg-base pb-[env(safe-area-inset-bottom)] text-ink">
          <DrawerHeader className="px-4 pb-2 pt-4 text-left">
            <DrawerTitle className="text-[1.05rem] font-semibold">选择币种</DrawerTitle>
            <DrawerDescription className="text-left text-[0.74rem] text-muted-foreground">
              来自{getAccountLabel(fromAccountType)}可用资产
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            {isLoading && <CoinListSkeleton />}
            {!isLoading && availableAssets.length === 0 && (
              <div className="px-3 py-8 text-center text-[0.78rem] text-muted-foreground">暂无可划转资产</div>
            )}
            {!isLoading &&
              availableAssets.map((asset) => (
                <button
                  key={`${asset.accountType}-${asset.coinCode}`}
                  className="flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-3 text-left active:bg-soft"
                  onClick={() => selectCoin(asset)}
                >
                  <CoinAvatar coinCode={asset.coinCode} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.94rem] font-semibold leading-tight">{asset.coinCode}</span>
                    <span className="mt-1 block truncate text-[0.74rem] leading-tight text-muted-foreground">
                      {asset.coinName}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-mono text-[0.82rem] tabular-nums">{formatNumber(asset.availableBalance)}</span>
                    <span className="mt-1 block text-[0.68rem] text-muted-foreground">可用</span>
                  </span>
                </button>
              ))}
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}

function AccountRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button className="flex h-12 w-full items-center gap-4 text-left active:bg-soft" onClick={onClick}>
      <span className="w-9 shrink-0 text-[0.82rem] font-semibold text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate text-[1rem] font-semibold">{value}</span>
      <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />
    </button>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <h2 className="mb-2 mt-5 text-[0.82rem] font-semibold text-muted-foreground">{children}</h2>;
}

function CoinAvatar({ coinCode }: { coinCode: string }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/90 text-[0.68rem] font-bold text-primary-foreground">
      {coinCode.slice(0, 2)}
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

function getAccountLabel(type: AccountType) {
  return ACCOUNT_OPTIONS.find((account) => account.type === type)?.label ?? type;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8,
  }).format(Number(value) || 0);
}

function formatPlain(value: number) {
  return String(Number(value) || 0);
}

import dayjs from 'dayjs';
import { QRCodeSVG } from 'qrcode.react';
import { Check, ChevronLeft, Copy, RefreshCw, Share2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { DepositCoin, DepositNetwork, DepositOrder } from '../../api/deposit';
import { Button } from '../../components/ui/button';
import { useDepositAddress, useDepositOrders } from '../../hooks/useDepositQueries';

type DepositPageProps = {
  coin: DepositCoin;
  network: DepositNetwork;
  onBack: () => void;
};

export function DepositPage({ coin, network, onBack }: DepositPageProps) {
  const addressQuery = useDepositAddress(coin.coinCode, network.networkCode);
  const ordersQuery = useDepositOrders(coin.coinCode);
  const [copied, setCopied] = useState(false);
  const addressRef = useRef<HTMLParagraphElement>(null);
  const address = addressQuery.data;
  const displayNetwork = address?.chainCode || network.chainCode || network.networkCode;
  const displayNetworkName = address?.networkName || network.networkName;
  const contractAddress = address?.contractAddress ?? network.contractAddress;
  const minDepositAmount = address?.minDepositAmount ?? network.minDepositAmount;
  const confirmCount = address?.confirmCount ?? network.confirmCount;
  const memoTag = address?.memoTag;
  const records = ordersQuery.data?.list ?? [];
  const shareText = useMemo(() => {
    if (!address?.address) return '';
    return `${coin.coinCode} ${network.networkCode} 充值地址：${address.address}${memoTag ? `\nMemo/Tag：${memoTag}` : ''}`;
  }, [address?.address, coin.coinCode, memoTag, network.networkCode]);

  const copyAddress = async () => {
    if (!address?.address) return;

    try {
      await copyToClipboard(address.address, addressRef.current);
      setCopied(true);
      toast.success('地址已复制', {
        description: `${coin.coinCode} ${network.networkCode} 充值地址已复制到剪贴板`,
      });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      selectElementText(addressRef.current);
      toast.error('复制失败', {
        description: '当前浏览器不允许写入剪贴板，已为你选中地址，可长按手动复制',
      });
    }
  };

  const shareAddress = async () => {
    if (!address?.address) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `充值 ${coin.coinCode}`,
          text: shareText,
        });
        return;
      } catch {
        // User cancellation or unsupported WebView behavior falls back to copy.
      }
    }

    await copyAddress();
  };

  return (
    <section className="min-h-screen bg-base pb-5">
      <header className="sticky top-0 z-10 flex h-11 items-center border-b border-line bg-base px-3">
        <button className="grid size-8 place-items-center text-muted-foreground active:scale-95" onClick={onBack} aria-label="返回">
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-[0.98rem] font-semibold">充值 {coin.coinCode}</h1>
        <span className="size-8" />
      </header>

      <div className="space-y-4 px-4 py-4">
        <section className="rounded-md border border-line bg-panel px-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <CoinAvatar coin={coin} />
            <div className="min-w-0 flex-1">
              <p className="text-[0.9rem] font-semibold leading-tight text-ink">{coin.coinCode}</p>
              <p className="mt-1 truncate text-[0.72rem] text-muted-foreground">{coin.coinName}</p>
            </div>
            <div className="shrink-0 rounded bg-base2 px-2 py-1 font-mono text-[0.68rem] text-muted-foreground">
              {network.networkCode}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-center py-1">
            <div className="grid size-[178px] place-items-center rounded-lg bg-ink p-2 shadow-lg shadow-black/20">
              {addressQuery.isLoading && <div className="size-[148px] animate-pulse rounded bg-[#c8d0dc]" />}
              {address?.address && (
                <QRCodeSVG value={address.address} size={148} bgColor="#e6edf5" fgColor="#080c13" level="M" />
              )}
              {addressQuery.isError && (
                <button
                  className="grid size-[148px] place-items-center rounded bg-[#e6edf5] text-[#17202c]"
                  onClick={() => addressQuery.refetch()}
                  aria-label="重新加载充值地址"
                >
                  <RefreshCw className="size-7" />
                </button>
              )}
            </div>
          </div>

          {addressQuery.isError && (
            <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[0.74rem] leading-relaxed text-danger">
              充值地址加载失败，请稍后重试。
            </div>
          )}

          <InfoBlock label="网络">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.94rem] font-semibold">{displayNetwork}</p>
                <p className="mt-1 truncate text-[0.78rem] text-muted-foreground">
                  {displayNetworkName} ({network.networkCode})
                </p>
                {contractAddress && (
                  <p className="mt-2 break-all font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
                    合约信息 {maskMiddle(contractAddress)}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-md bg-base2 px-2 py-1 text-[0.68rem] text-muted-foreground">
                {confirmCount || 1} 确认
              </span>
            </div>
          </InfoBlock>

          <InfoBlock label="充值地址">
            <div className="flex min-w-0 items-start gap-2">
              <p ref={addressRef} className="min-w-0 flex-1 break-all font-mono text-[0.9rem] font-semibold leading-relaxed text-warning">
                {addressQuery.isLoading ? '地址加载中...' : address?.address || '暂无地址'}
              </p>
              <Button
                aria-label="复制充值地址"
                className="size-9 rounded-md border-line bg-base2 p-0 text-ink hover:bg-soft"
                variant="outline"
                disabled={!address?.address}
                onClick={copyAddress}
              >
                {copied ? <Check className="size-4 text-buy" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </InfoBlock>

          {memoTag && (
            <InfoBlock label="Memo/Tag">
              <p className="break-all font-mono text-[0.86rem] font-semibold text-warning">{memoTag}</p>
            </InfoBlock>
          )}

          <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-[0.7rem] leading-relaxed text-muted-foreground">
            最低充值 &gt; {formatNumber(minDepositAmount)} {coin.coinCode}。仅向该地址充值 {coin.coinCode}-{network.networkCode}。
          </div>

          <Button
            className="h-11 w-full rounded-md bg-warning text-[0.92rem] font-semibold text-[#171106] hover:bg-warning/90 disabled:opacity-60"
            disabled={!address?.address}
            onClick={shareAddress}
          >
            <Share2 className="size-4" />
            保存并分享地址
          </Button>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[0.86rem] font-semibold">充值记录</h2>
            <span className="text-[0.7rem] text-muted-foreground">最近记录</span>
          </div>

          <div className="rounded-md border border-line bg-panel">
            {ordersQuery.isLoading && <RecordSkeleton />}
            {ordersQuery.isError && (
              <div className="px-3 py-5 text-center">
                <p className="text-[0.78rem] text-muted-foreground">充值记录加载失败</p>
                <Button className="mt-3 h-8 bg-brand text-primary-foreground" onClick={() => ordersQuery.refetch()}>
                  重新加载
                </Button>
              </div>
            )}
            {!ordersQuery.isLoading && !ordersQuery.isError && records.length === 0 && (
              <div className="px-3 py-6 text-center text-[0.78rem] text-muted-foreground">暂无充值记录</div>
            )}
            {!ordersQuery.isLoading &&
              !ordersQuery.isError &&
              records.map((record, index) => (
                <DepositRecordRow key={record.depositNo || `${record.txid}-${index}`} record={record} index={index} />
              ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-line pb-3 last:border-b-0">
      <p className="mb-2 text-[0.74rem] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function DepositRecordRow({ record, index }: { record: DepositOrder; index: number }) {
  const status = getOrderStatus(record.orderStatus);

  return (
    <div className={`px-3 py-3 ${index > 0 ? 'border-t border-line' : ''}`}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[0.84rem] font-semibold">{record.networkCode}</span>
            <span className={`rounded px-1.5 py-0.5 text-[0.62rem] font-medium ${status.className}`}>{status.label}</span>
          </div>
          <p className="mt-1 truncate font-mono text-[0.68rem] text-muted-foreground">{record.txid || record.depositNo}</p>
          {record.confirmCount < record.requiredConfirmCount && (
            <p className="mt-1 text-[0.64rem] text-muted-foreground">
              确认 {record.confirmCount}/{record.requiredConfirmCount}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[0.82rem] font-semibold tabular-nums">
            {formatNumber(record.amount)} {record.coinCode}
          </p>
          <p className="mt-1 font-mono text-[0.64rem] text-muted-foreground">{formatTime(record.createTime)}</p>
        </div>
      </div>
    </div>
  );
}

function CoinAvatar({ coin }: { coin: DepositCoin }) {
  if (coin.iconUrl) {
    return <img src={coin.iconUrl} alt="" className="size-9 shrink-0 rounded-full bg-soft object-cover" referrerPolicy="no-referrer" />;
  }

  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/15 text-[0.76rem] font-semibold text-brand">
      {coin.coinCode.slice(0, 2)}
    </span>
  );
}

function RecordSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className={`px-3 py-3 ${index > 0 ? 'border-t border-line' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <span className="block h-3 w-24 animate-pulse rounded bg-soft" />
              <span className="block h-2.5 w-36 animate-pulse rounded bg-soft" />
            </div>
            <div className="w-24 space-y-2">
              <span className="block h-3 animate-pulse rounded bg-soft" />
              <span className="ml-auto block h-2.5 w-16 animate-pulse rounded bg-soft" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function copyToClipboard(text: string, visibleTextElement: HTMLElement | null) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some WebViews expose Clipboard API but reject writes. Fall back below.
    }
  }

  if (copySelectedElementText(visibleTextElement)) return;
  if (copyWithTextArea(text)) return;

  throw new Error('Copy rejected');
}

function copySelectedElementText(element: HTMLElement | null) {
  if (!element) return false;

  selectElementText(element);

  try {
    const copied = document.execCommand('copy');
    if (copied) window.getSelection()?.removeAllRanges();
    return copied;
  } catch {
    return false;
  }
}

function copyWithTextArea(text: string) {
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
    return copied;
  } finally {
    document.body.removeChild(textArea);
  }
}

function selectElementText(element: HTMLElement | null) {
  if (!element) return;

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function getOrderStatus(status: number) {
  if (status === 1) return { label: '已到账', className: 'bg-buy/10 text-buy' };
  if (status === 2) return { label: '已完成', className: 'bg-buy/10 text-buy' };
  if (status === 3) return { label: '失败', className: 'bg-sell/10 text-sell' };
  if (status === 4) return { label: '已忽略', className: 'bg-soft text-muted-foreground' };
  return { label: '确认中', className: 'bg-warning/10 text-warning' };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8,
  }).format(value || 0);
}

function formatTime(value?: string | null) {
  if (!value) return '--';
  return dayjs(value).isValid() ? dayjs(value).format('MM-DD HH:mm') : value;
}

function maskMiddle(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-5)}`;
}

import { useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, ChevronLeft, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import type { DepositNetwork } from '../../data/mock';
import { useDepositNetworks, useDepositRecords } from '../../hooks/useMockQueries';

export function DepositPage({ onBack }: { onBack: () => void }) {
  const { data: networks = [] } = useDepositNetworks();
  const { data: records = [] } = useDepositRecords();
  const [selectedKey, setSelectedKey] = useState<DepositNetwork['key']>('ETH');
  const [copied, setCopied] = useState(false);
  const addressRef = useRef<HTMLParagraphElement>(null);
  const selectedNetwork = useMemo(
    () => networks.find((network) => network.key === selectedKey) ?? networks[0],
    [networks, selectedKey],
  );

  const copyAddress = async () => {
    if (!selectedNetwork) return;

    try {
      await copyToClipboard(selectedNetwork.address, addressRef.current);
      setCopied(true);
      toast.success('地址已复制', {
        description: `${selectedNetwork.key} ${selectedNetwork.standard} 充值地址已复制到剪贴板`,
      });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      selectElementText(addressRef.current);
      toast.error('复制失败', {
        description: '当前浏览器不允许写入剪贴板，已为你选中地址，可长按手动复制',
      });
    }
  };

  return (
    <section className="min-h-screen bg-base">
      <header className="sticky top-0 z-10 flex h-11 items-center border-b border-line bg-base px-3">
        <button className="grid size-8 place-items-center text-muted-foreground active:scale-95" onClick={onBack} aria-label="返回">
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="flex-1 text-center text-[0.95rem] font-semibold">充值 USDT</h1>
        <span className="size-8" />
      </header>

      <div className="space-y-4 px-4 py-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.76rem] font-medium text-muted-foreground">选择充值网络</span>
            {selectedNetwork && <span className="font-mono text-[0.7rem] text-muted-foreground">{selectedNetwork.standard}</span>}
          </div>
          <Tabs
            value={selectedKey}
            onValueChange={(value) => {
              setSelectedKey(value as DepositNetwork['key']);
              setCopied(false);
            }}
          >
            <TabsList className="grid h-auto w-full grid-cols-3 gap-2 rounded-md bg-base2 p-1">
              {networks.map((network) => (
                <TabsTrigger
                  key={network.key}
                  value={network.key}
                  className="h-8 rounded border-0 py-0 text-[0.78rem] font-semibold text-muted-foreground shadow-none transition active:scale-95 data-active:bg-brand data-active:text-[#06130e] dark:data-active:bg-brand dark:data-active:text-[#06130e]"
                >
                  {network.key}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {selectedNetwork && (
          <div className="rounded-md border border-line bg-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.74rem] text-muted-foreground">充值网络</p>
                <p className="mt-1 text-[0.96rem] font-semibold">{selectedNetwork.name}</p>
              </div>
              <div className="shrink-0 rounded border border-line px-2 py-1 text-[0.68rem] text-muted-foreground">
                {selectedNetwork.confirmations} confirmations
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <div className="rounded-md bg-ink p-2">
                <QRCodeSVG value={selectedNetwork.address} size={148} bgColor="#e6edf5" fgColor="#080c13" level="M" />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[0.72rem] text-muted-foreground">充值地址</span>
                <span className="font-mono text-[0.68rem] text-muted-foreground">Min {selectedNetwork.minAmount}</span>
              </div>
              <div className="flex min-w-0 items-stretch gap-2">
                <div className="min-w-0 flex-1 rounded border border-line bg-base2 px-2.5 py-2">
                  <p ref={addressRef} className="break-all font-mono text-[0.72rem] leading-relaxed text-ink">
                    {selectedNetwork.address}
                  </p>
                </div>
                <Button
                  aria-label="复制充值地址"
                  className="h-auto rounded border-line bg-base2 px-2.5 text-ink hover:bg-soft"
                  variant="outline"
                  onClick={copyAddress}
                >
                  {copied ? <Check className="size-4 text-brand" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="mt-3 rounded border border-warning/30 bg-warning/10 px-2.5 py-2 text-[0.68rem] leading-relaxed text-muted-foreground">
              仅向该地址充值 USDT-{selectedNetwork.standard}。使用其他资产或网络充值可能无法到账。
            </div>
          </div>
        )}

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[0.86rem] font-semibold">充值记录</h2>
            <span className="text-[0.7rem] text-muted-foreground">最近 30 天</span>
          </div>
          <div className="rounded-md border border-line bg-panel">
            {records.map((record, index) => (
              <div key={record.id} className={`px-3 py-3 ${index > 0 ? 'border-t border-line' : ''}`}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.84rem] font-semibold">{record.network}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[0.62rem] font-medium ${
                          record.status === 'confirmed' ? 'bg-brand/10 text-brand' : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {record.status === 'confirmed' ? '已到账' : '确认中'}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-mono text-[0.68rem] text-muted-foreground">{record.txid}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-[0.82rem] font-semibold tabular-nums">{record.amount}</p>
                    <p className="mt-1 font-mono text-[0.64rem] text-muted-foreground">{record.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
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

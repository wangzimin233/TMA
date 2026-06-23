import dayjs from 'dayjs';
import { QRCodeSVG } from 'qrcode.react';
import { Check, ChevronLeft, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { WithdrawCoin, WithdrawNetwork, WithdrawOrder } from '../../api/withdraw';
import { getErrorMessage } from '../../api/client';
import { Button } from '../../components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '../../components/ui/drawer';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  useApplyWithdraw,
  useConfirmWithdrawGoogleAuthBind,
  useFundAssets,
  useSecurityInfo,
  useWithdrawGoogleAuthBindInit,
  useWithdrawOrders,
} from '../../hooks/useWithdrawQueries';

type WithdrawPageProps = {
  coin: WithdrawCoin;
  network: WithdrawNetwork;
  onBack: () => void;
};

export function WithdrawPage({ coin, network, onBack }: WithdrawPageProps) {
  const [toAddress, setToAddress] = useState('');
  const [memoTag, setMemoTag] = useState('');
  const [amount, setAmount] = useState('');
  const [googleCode, setGoogleCode] = useState('');
  const [bindGoogleCode, setBindGoogleCode] = useState('');
  const [remark, setRemark] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const secretRef = useRef<HTMLParagraphElement>(null);
  const securityQuery = useSecurityInfo();
  const googleBindEnabled = securityQuery.data?.withdrawGoogleAuthGlobalEnabled === true;
  const googleUnbound = googleBindEnabled && securityQuery.data?.googleAuthBound === false;
  const withdrawReady = !securityQuery.isLoading && !securityQuery.isError && !googleUnbound;
  const bindInitQuery = useWithdrawGoogleAuthBindInit(googleUnbound);
  const bindConfirmMutation = useConfirmWithdrawGoogleAuthBind();
  const assetsQuery = useFundAssets(withdrawReady);
  const ordersQuery = useWithdrawOrders(withdrawReady ? coin.coinCode : undefined);
  const applyMutation = useApplyWithdraw();
  const asset = useMemo(
    () => assetsQuery.data?.find((item) => item.coinCode === coin.coinCode && item.accountType === 'FUND') ?? null,
    [assetsQuery.data, coin.coinCode],
  );
  const availableBalance = asset?.availableBalance ?? 0;
  const amountValue = Number(amount);
  const normalizedAmount = Number.isFinite(amountValue) ? amountValue : 0;
  const actualAmount = normalizedAmount - network.withdrawFee;
  const googleRequired = securityQuery.data?.withdraw2faEnabled === 1;
  const records = ordersQuery.data?.list ?? [];
  const validation = validateForm({
    toAddress,
    amount: normalizedAmount,
    availableBalance,
    minWithdrawAmount: network.minWithdrawAmount,
    withdrawFee: network.withdrawFee,
    addressRegex: network.addressRegex,
    googleCode,
    googleRequired,
    securityError: securityQuery.isError,
  });
  const canSubmit = withdrawReady && !validation && !assetsQuery.isLoading && !applyMutation.isPending;

  const fillAll = () => {
    if (availableBalance <= 0) return;
    setAmount(trimNumber(availableBalance));
  };

  const openConfirm = () => {
    if (validation) {
      toast.error(validation);
      return;
    }

    setConfirmOpen(true);
  };

  const copySecret = async () => {
    const secret = bindInitQuery.data?.secret;
    if (!secret) return;

    try {
      await copyToClipboard(secret, secretRef.current);
      setSecretCopied(true);
      toast.success('密钥已复制');
      window.setTimeout(() => setSecretCopied(false), 1600);
    } catch {
      selectElementText(secretRef.current);
      toast.error('复制失败', {
        description: '已为你选中密钥，可长按手动复制',
      });
    }
  };

  const confirmGoogleBind = async () => {
    const code = bindGoogleCode.trim();
    if (code.length !== 6) {
      toast.error('请输入 6 位 Google 验证码');
      return;
    }

    try {
      await bindConfirmMutation.mutateAsync({ googleCode: code });
      toast.success('Google 验证器绑定成功');
      setBindGoogleCode('');
      await securityQuery.refetch();
    } catch (error) {
      toast.error('绑定失败', {
        description: getErrorMessage(error),
      });
    }
  };

  const submitWithdraw = async () => {
    if (validation) {
      toast.error(validation);
      return;
    }

    try {
      const result = await applyMutation.mutateAsync({
        coinCode: coin.coinCode,
        networkCode: network.networkCode,
        toAddress: toAddress.trim(),
        memoTag: network.memoSupport === 1 ? memoTag.trim() || undefined : undefined,
        amount: normalizedAmount,
        googleCode: googleRequired ? googleCode.trim() : undefined,
        remark: remark.trim() || undefined,
      });

      toast.success('提现申请已提交', {
        description: result.withdrawNo,
      });
      setToAddress('');
      setMemoTag('');
      setAmount('');
      setGoogleCode('');
      setRemark('');
      setConfirmOpen(false);
    } catch (error) {
      toast.error('提现申请失败', {
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <section className="min-h-screen bg-base pb-5">
      <header className="sticky top-0 z-10 flex h-11 items-center border-b border-line bg-base px-3">
        <button className="grid size-8 place-items-center text-muted-foreground active:scale-95" onClick={onBack} aria-label="返回">
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-[0.98rem] font-semibold">提现 {coin.coinCode}</h1>
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

        {securityQuery.isLoading && <SecurityStateCard title="安全设置检查中" description="正在确认 Google 验证绑定状态..." />}
        {securityQuery.isError && (
          <SecurityStateCard
            title="安全设置加载失败"
            description="请重新加载安全设置后再发起提现。"
            actionLabel="重新加载"
            onAction={() => securityQuery.refetch()}
          />
        )}
        {!securityQuery.isLoading && !securityQuery.isError && googleUnbound && (
          <GoogleAuthBindPanel
            initQuery={bindInitQuery}
            googleCode={bindGoogleCode}
            onGoogleCodeChange={setBindGoogleCode}
            onConfirm={confirmGoogleBind}
            confirmPending={bindConfirmMutation.isPending}
            onCopySecret={copySecret}
            secretCopied={secretCopied}
            secretRef={secretRef}
            onRetrySecurity={() => securityQuery.refetch()}
          />
        )}

        {withdrawReady && (
          <>
        <section className="space-y-3">
          <InfoBlock label="网络">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.94rem] font-semibold">{network.chainCode || network.networkCode}</p>
                <p className="mt-1 truncate text-[0.78rem] text-muted-foreground">
                  {network.networkName} ({network.networkCode})
                </p>
                {network.contractAddress && (
                  <p className="mt-2 break-all font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
                    合约信息 {maskMiddle(network.contractAddress)}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-md bg-base2 px-2 py-1 text-[0.68rem] text-muted-foreground">
                {network.confirmCount || 1} 确认
              </span>
            </div>
          </InfoBlock>

          <div className="rounded-md border border-line bg-panel p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[0.74rem] text-muted-foreground">资金账户可用</span>
              <span className="font-mono text-[0.78rem] text-ink">
                {assetsQuery.isLoading ? '加载中' : `${formatNumber(availableBalance)} ${coin.coinCode}`}
              </span>
            </div>

            <Field label="提现地址">
              <Input
                value={toAddress}
                onChange={(event) => setToAddress(event.target.value)}
                placeholder="请输入或粘贴提现地址"
                className="h-10 rounded-md border-line bg-base2 text-[0.86rem] text-ink placeholder:text-muted-foreground focus-visible:ring-brand/25"
              />
            </Field>

            {network.memoSupport === 1 && (
              <Field label="Memo/Tag">
                <Input
                  value={memoTag}
                  onChange={(event) => setMemoTag(event.target.value)}
                  placeholder="请输入 Memo/Tag"
                  className="h-10 rounded-md border-line bg-base2 text-[0.86rem] text-ink placeholder:text-muted-foreground focus-visible:ring-brand/25"
                />
              </Field>
            )}

            <Field label="提现金额">
              <div className="flex items-center gap-2">
                <Input
                  value={amount}
                  onChange={(event) => setAmount(normalizeAmountInput(event.target.value))}
                  placeholder="0.00"
                  inputMode="decimal"
                  className="h-10 rounded-md border-line bg-base2 font-mono text-[0.9rem] text-ink placeholder:text-muted-foreground focus-visible:ring-brand/25"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 rounded-md border-line bg-base2 px-3 text-[0.78rem] text-ink"
                  onClick={fillAll}
                  disabled={availableBalance <= 0}
                >
                  全部
                </Button>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-2 border-b border-line pb-3">
              <Metric label="手续费" value={`${formatNumber(network.withdrawFee)} ${coin.coinCode}`} />
              <Metric label="预计到账" value={`${formatNumber(Math.max(actualAmount, 0))} ${coin.coinCode}`} />
            </div>

            <div className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-[0.7rem] leading-relaxed text-muted-foreground">
              最低提现 &gt; {formatNumber(network.minWithdrawAmount)} {coin.coinCode}。请确认网络与收款地址一致，提交后将进入审核。
            </div>
          </div>

          <div className="rounded-md border border-line bg-panel p-3">
            {googleRequired && (
              <>
                <div className="mb-3 flex items-center gap-2 text-[0.78rem] text-muted-foreground">
                  <ShieldCheck className="size-4 text-brand" />
                  提现二次验证已开启
                </div>
                <Field label="Google 验证码">
                  <Input
                    value={googleCode}
                    onChange={(event) => setGoogleCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="请输入 6 位验证码"
                    inputMode="numeric"
                    className="h-10 rounded-md border-line bg-base2 font-mono text-[0.9rem] text-ink placeholder:text-muted-foreground focus-visible:ring-brand/25"
                  />
                </Field>
              </>
            )}
            {!googleRequired && <p className="text-[0.76rem] text-muted-foreground">当前提现不需要 Google 验证码。</p>}
          </div>

          <div className="rounded-md border border-line bg-panel p-3">
            <Field label="备注">
              <Input
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="选填，便于记录用途"
                className="h-10 rounded-md border-line bg-base2 text-[0.86rem] text-ink placeholder:text-muted-foreground focus-visible:ring-brand/25"
              />
            </Field>
          </div>

          {validation && <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[0.74rem] text-danger">{validation}</div>}

          <Button
            className="h-11 w-full rounded-md bg-danger text-[0.92rem] font-semibold text-white hover:bg-danger/90 disabled:opacity-60"
            disabled={!canSubmit}
            onClick={openConfirm}
          >
            提交提现申请
          </Button>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[0.86rem] font-semibold">提现记录</h2>
            <span className="text-[0.7rem] text-muted-foreground">最近记录</span>
          </div>
          <div className="rounded-md border border-line bg-panel">
            {ordersQuery.isLoading && <RecordSkeleton />}
            {ordersQuery.isError && (
              <div className="px-3 py-5 text-center">
                <p className="text-[0.78rem] text-muted-foreground">提现记录加载失败</p>
                <Button className="mt-3 h-8 bg-brand text-[#06130e]" onClick={() => ordersQuery.refetch()}>
                  重新加载
                </Button>
              </div>
            )}
            {!ordersQuery.isLoading && !ordersQuery.isError && records.length === 0 && (
              <div className="px-3 py-6 text-center text-[0.78rem] text-muted-foreground">暂无提现记录</div>
            )}
            {!ordersQuery.isLoading &&
              !ordersQuery.isError &&
              records.map((record, index) => (
                <WithdrawRecordRow key={record.withdrawNo || `${record.txid}-${index}`} record={record} index={index} />
              ))}
          </div>
        </section>
          </>
        )}
      </div>

      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen} direction="bottom">
        <DrawerContent className="mx-auto max-h-[86vh] w-full max-w-[430px] border-line bg-base pb-[env(safe-area-inset-bottom)] text-ink">
          <DrawerHeader className="px-4 pb-2 pt-4 text-left">
            <DrawerTitle className="text-[1.05rem] font-semibold text-ink">确认提现</DrawerTitle>
            <DrawerDescription className="text-left text-[0.74rem] text-muted-foreground">
              请再次核对地址和网络，提交后将进入审核。
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 px-4 pb-3">
            <ConfirmRow label="资产" value={`${coin.coinCode} · ${network.networkCode}`} />
            <ConfirmRow label="提现地址" value={toAddress.trim()} mono />
            {network.memoSupport === 1 && memoTag.trim() && <ConfirmRow label="Memo/Tag" value={memoTag.trim()} mono />}
            <ConfirmRow label="申请数量" value={`${formatNumber(normalizedAmount)} ${coin.coinCode}`} />
            <ConfirmRow label="手续费" value={`${formatNumber(network.withdrawFee)} ${coin.coinCode}`} />
            <ConfirmRow label="预计到账" value={`${formatNumber(Math.max(actualAmount, 0))} ${coin.coinCode}`} />
          </div>
          <DrawerFooter className="px-4 pt-1">
            <Button
              className="h-11 rounded-md bg-danger text-[0.92rem] font-semibold text-white hover:bg-danger/90"
              disabled={applyMutation.isPending}
              onClick={submitWithdraw}
            >
              {applyMutation.isPending ? '提交中...' : '确认提交'}
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-md border-line bg-base2 text-ink"
              disabled={applyMutation.isPending}
              onClick={() => setConfirmOpen(false)}
            >
              返回修改
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </section>
  );
}

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-panel p-3">
      <p className="mb-2 text-[0.74rem] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function SecurityStateCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="rounded-md border border-line bg-panel p-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-base2 text-brand">
          <ShieldCheck className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.86rem] font-semibold text-ink">{title}</p>
          <p className="mt-1 text-[0.74rem] leading-relaxed text-muted-foreground">{description}</p>
          {actionLabel && onAction && (
            <Button className="mt-3 h-8 rounded-md bg-brand px-3 text-[0.74rem] font-semibold text-[#06130e]" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function GoogleAuthBindPanel({
  initQuery,
  googleCode,
  onGoogleCodeChange,
  onConfirm,
  confirmPending,
  onCopySecret,
  secretCopied,
  secretRef,
  onRetrySecurity,
}: {
  initQuery: ReturnType<typeof useWithdrawGoogleAuthBindInit>;
  googleCode: string;
  onGoogleCodeChange: (value: string) => void;
  onConfirm: () => void;
  confirmPending: boolean;
  onCopySecret: () => void;
  secretCopied: boolean;
  secretRef: RefObject<HTMLParagraphElement | null>;
  onRetrySecurity: () => void;
}) {
  const bindInfo = initQuery.data;
  const disabled = initQuery.isLoading || initQuery.isError || !bindInfo || confirmPending;

  return (
    <section className="space-y-3 rounded-md border border-line bg-panel p-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-danger/10 text-danger">
          <ShieldCheck className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.88rem] font-semibold text-ink">绑定 Google 验证器</p>
          <p className="mt-1 text-[0.72rem] leading-relaxed text-muted-foreground">
            当前账户未绑定 Google 验证器，完成绑定后可继续提现。
          </p>
        </div>
      </div>

      <div className="flex justify-center py-1">
        <div className="grid size-[178px] place-items-center rounded-lg bg-ink p-2 shadow-lg shadow-black/20">
          {initQuery.isLoading && <div className="size-[148px] animate-pulse rounded bg-[#c8d0dc]" />}
          {bindInfo?.otpauthUri && (
            <QRCodeSVG value={bindInfo.otpauthUri} size={148} bgColor="#e6edf5" fgColor="#080c13" level="M" />
          )}
          {initQuery.isError && (
            <button
              className="grid size-[148px] place-items-center rounded bg-[#e6edf5] text-[#17202c]"
              onClick={() => initQuery.refetch()}
              aria-label="重新加载绑定二维码"
            >
              <RefreshCw className="size-7" />
            </button>
          )}
        </div>
      </div>

      {initQuery.isError && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[0.74rem] leading-relaxed text-danger">
          Google 绑定初始化失败，请重试；如果后台提示已绑定，可刷新安全状态。
          <div className="mt-2 flex gap-2">
            <Button className="h-8 rounded-md bg-danger px-3 text-[0.72rem] text-white" onClick={() => initQuery.refetch()}>
              重试
            </Button>
            <Button
              variant="outline"
              className="h-8 rounded-md border-line bg-base2 px-3 text-[0.72rem] text-ink"
              onClick={onRetrySecurity}
            >
              刷新状态
            </Button>
          </div>
        </div>
      )}

      {bindInfo && (
        <div className="space-y-2">
          <BindInfoRow label="账户名" value={bindInfo.accountName || '--'} />
          <BindInfoRow label="发行方" value={bindInfo.issuer || '--'} />
          <div className="rounded-md bg-base2 px-3 py-2">
            <p className="mb-1 text-[0.68rem] text-muted-foreground">手动密钥</p>
            <div className="flex min-w-0 items-start gap-2">
              <p ref={secretRef} className="min-w-0 flex-1 break-all font-mono text-[0.78rem] leading-relaxed text-warning">
                {bindInfo.secret || '--'}
              </p>
              <Button
                aria-label="复制 Google 密钥"
                className="size-8 shrink-0 rounded-md border-line bg-base p-0 text-ink hover:bg-soft"
                variant="outline"
                disabled={!bindInfo.secret}
                onClick={onCopySecret}
              >
                {secretCopied ? <Check className="size-4 text-brand" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
          <BindInfoRow label="二维码有效期" value={`${bindInfo.expireSeconds || 0} 秒`} />
        </div>
      )}

      <Field label="Google 验证码">
        <Input
          value={googleCode}
          onChange={(event) => onGoogleCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="请输入 6 位验证码"
          inputMode="numeric"
          className="h-10 rounded-md border-line bg-base2 font-mono text-[0.9rem] text-ink placeholder:text-muted-foreground focus-visible:ring-brand/25"
          disabled={initQuery.isLoading || initQuery.isError}
        />
      </Field>

      <Button
        className="h-11 w-full rounded-md bg-danger text-[0.92rem] font-semibold text-white hover:bg-danger/90 disabled:opacity-60"
        disabled={disabled}
        onClick={onConfirm}
      >
        {confirmPending ? '绑定中...' : '确认绑定'}
      </Button>
    </section>
  );
}

function BindInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-base2 px-3 py-2">
      <span className="shrink-0 text-[0.68rem] text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-mono text-[0.76rem] text-ink">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <Label className="mb-1.5 block text-[0.74rem] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-base2 px-2.5 py-2">
      <p className="text-[0.68rem] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-[0.76rem] font-semibold text-ink">{value}</p>
    </div>
  );
}

function WithdrawRecordRow({ record, index }: { record: WithdrawOrder; index: number }) {
  const status = getOrderStatus(record.orderStatus);

  return (
    <div className={`px-3 py-3 ${index > 0 ? 'border-t border-line' : ''}`}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[0.84rem] font-semibold">{record.networkCode}</span>
            <span className={`rounded px-1.5 py-0.5 text-[0.62rem] font-medium ${status.className}`}>{status.label}</span>
          </div>
          <p className="mt-1 truncate font-mono text-[0.68rem] text-muted-foreground">{record.txid || record.withdrawNo}</p>
          {record.rejectReason && <p className="mt-1 truncate text-[0.64rem] text-danger">{record.rejectReason}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[0.82rem] font-semibold tabular-nums">
            {formatNumber(record.applyAmount)} {record.coinCode}
          </p>
          <p className="mt-1 font-mono text-[0.64rem] text-muted-foreground">{formatTime(record.createTime)}</p>
        </div>
      </div>
    </div>
  );
}

function ConfirmRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 border-b border-line pb-2 last:border-b-0">
      <span className="shrink-0 text-[0.74rem] text-muted-foreground">{label}</span>
      <span className={`min-w-0 break-all text-right text-[0.78rem] text-ink ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function CoinAvatar({ coin }: { coin: WithdrawCoin }) {
  if (coin.iconUrl) {
    return <img src={coin.iconUrl} alt="" className="size-9 shrink-0 rounded-full bg-soft object-cover" referrerPolicy="no-referrer" />;
  }

  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-danger/15 text-[0.76rem] font-semibold text-danger">
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

function validateForm({
  toAddress,
  amount,
  availableBalance,
  minWithdrawAmount,
  withdrawFee,
  addressRegex,
  googleCode,
  googleRequired,
  securityError,
}: {
  toAddress: string;
  amount: number;
  availableBalance: number;
  minWithdrawAmount: number;
  withdrawFee: number;
  addressRegex?: string | null;
  googleCode: string;
  googleRequired: boolean;
  securityError: boolean;
}) {
  const address = toAddress.trim();
  if (!address) return '请输入提现地址';
  if (addressRegex && !isAddressValid(addressRegex, address)) return '提现地址格式不正确';
  if (!amount || amount <= 0) return '提现金额必须大于 0';
  if (amount < minWithdrawAmount) return `提现金额不能低于 ${formatNumber(minWithdrawAmount)}`;
  if (amount > availableBalance) return '提现金额不能超过资金账户可用余额';
  if (amount - withdrawFee <= 0) return '扣除手续费后到账金额必须大于 0';
  if (securityError) return '安全设置加载失败，请重试';
  if (googleRequired && googleCode.trim().length !== 6) return '请输入 6 位 Google 验证码';
  return '';
}

function isAddressValid(pattern: string, address: string) {
  try {
    return new RegExp(pattern).test(address);
  } catch {
    return Boolean(address);
  }
}

function normalizeAmountInput(value: string) {
  const normalized = value.replace(/[^\d.]/g, '');
  const [integer, ...rest] = normalized.split('.');
  if (!rest.length) return integer;
  return `${integer}.${rest.join('').slice(0, 8)}`;
}

function getOrderStatus(status: number) {
  if (status === 1) return { label: '待广播', className: 'bg-warning/10 text-warning' };
  if (status === 2) return { label: '处理中', className: 'bg-warning/10 text-warning' };
  if (status === 3) return { label: '成功', className: 'bg-brand/10 text-brand' };
  if (status === 4) return { label: '失败', className: 'bg-danger/10 text-danger' };
  if (status === 5) return { label: '已取消', className: 'bg-soft text-muted-foreground' };
  return { label: '待审核', className: 'bg-warning/10 text-warning' };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8,
  }).format(value || 0);
}

function trimNumber(value: number) {
  return String(Number(value.toFixed(8)));
}

async function copyToClipboard(text: string, visibleTextElement: HTMLElement | null) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some embedded WebViews expose Clipboard API but reject writes. Fall back below.
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
    return document.execCommand('copy');
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

function formatTime(value?: string | null) {
  if (!value) return '--';
  return dayjs(value).isValid() ? dayjs(value).format('MM-DD HH:mm') : value;
}

function maskMiddle(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-5)}`;
}

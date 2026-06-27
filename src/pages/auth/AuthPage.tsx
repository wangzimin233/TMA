import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  loginByEmail,
  registerByEmail,
  sendEmailCode,
  type EmailCodeScene,
  type EmailLoginMode,
} from '../../api/auth';
import { getErrorMessage } from '../../api/client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuthStore } from '../../store/auth.store';

type AuthTab = 'login' | 'register';
type AuthFormValues = {
  email: string;
  password: string;
  code: string;
  inviteCode: string;
  nickname: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPage({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [loginMode, setLoginMode] = useState<EmailLoginMode>('PASSWORD');
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    setError,
    clearErrors,
  } = useForm<AuthFormValues>({
    defaultValues: {
      email: '',
      password: '',
      code: '',
      inviteCode: '',
      nickname: '',
    },
  });

  const isRegister = authTab === 'register';
  const needsCode = isRegister || loginMode === 'CODE';
  const title = isRegister ? '创建交易账户' : '登录交易账户';
  const subtitle = isRegister ? '使用邮箱验证码注册，成功后自动登录' : '登录后可查看资产、充值和账户资料';

  useEffect(() => {
    if (codeCountdown <= 0) return;

    const timer = window.setTimeout(() => setCodeCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [codeCountdown]);

  const codeButtonText = useMemo(() => {
    if (isSendingCode) return '发送中';
    if (codeCountdown > 0) return `${codeCountdown}s`;
    return '获取验证码';
  }, [codeCountdown, isSendingCode]);

  const requestEmailCode = async () => {
    const email = getValues('email').trim();

    if (!emailPattern.test(email)) {
      setError('email', { message: '请输入有效邮箱地址' });
      return;
    }

    const scene: EmailCodeScene = isRegister ? 'REGISTER' : 'LOGIN';
    setIsSendingCode(true);

    try {
      await sendEmailCode({ email, scene });
      setCodeCountdown(60);
      toast.success('验证码已发送', {
        description: `请查看 ${email} 的邮箱验证码`,
      });
    } catch (error) {
      toast.error('验证码发送失败', {
        description: getErrorMessage(error),
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const submitAuth = async (values: AuthFormValues) => {
    const email = values.email.trim();
    const password = values.password.trim();
    const code = values.code.trim();

    clearErrors();

    if (!emailPattern.test(email)) {
      setError('email', { message: '请输入有效邮箱地址' });
      return;
    }

    if (needsCode && !/^\d{6}$/.test(code)) {
      setError('code', { message: '请输入 6 位邮箱验证码' });
      return;
    }

    if ((isRegister || loginMode === 'PASSWORD') && password.length < 8) {
      setError('password', { message: '密码至少 8 位' });
      return;
    }

    setIsSubmitting(true);

    try {
      const session = isRegister
        ? await registerByEmail({
            email,
            code,
            password,
            inviteCode: values.inviteCode.trim() || undefined,
            nickname: values.nickname.trim() || undefined,
          })
        : await loginByEmail({
            email,
            mode: loginMode,
            password: loginMode === 'PASSWORD' ? password : undefined,
            code: loginMode === 'CODE' ? code : undefined,
          });

      setSession(session);
      toast.success(isRegister ? '注册成功' : '登录成功');
      onSuccess();
    } catch (error) {
      toast.error(isRegister ? '注册失败' : '登录失败', {
        description: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen bg-base">
      <header className="sticky top-0 z-10 flex h-11 items-center border-b border-line bg-base px-3">
        <button className="grid size-8 place-items-center text-muted-foreground active:scale-95" onClick={onBack} aria-label="返回">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="flex-1 text-center text-[0.95rem] font-semibold">账户认证</h1>
        <span className="size-8" />
      </header>

      <form className="px-4 pb-6 pt-3.5" onSubmit={handleSubmit(submitAuth)}>
        <div className="flex min-w-0 items-center gap-3 border-b border-line pb-3.5">
          <div className="grid size-10 shrink-0 place-items-center rounded-md border border-line bg-panel text-brand">
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[1.05rem] font-semibold leading-tight">{title}</h2>
            <p className="mt-1 truncate text-[0.72rem] text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="mt-3 rounded-md border border-line bg-panel p-3">
          <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as AuthTab)}>
            <TabsList className="grid h-11 w-full grid-cols-2 items-stretch gap-0 overflow-hidden rounded-md border border-line bg-base2 p-[2px]">
              <TabsTrigger
                value="login"
                className="h-full min-h-0 rounded-[4px] border-0 py-0 text-[0.78rem] font-semibold text-muted-foreground shadow-none transition after:hidden active:scale-95 data-[state=active]:bg-brand data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-brand dark:data-[state=active]:text-primary-foreground"
              >
                登录
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="h-full min-h-0 rounded-[4px] border-0 py-0 text-[0.78rem] font-semibold text-muted-foreground shadow-none transition after:hidden active:scale-95 data-[state=active]:bg-brand data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-brand dark:data-[state=active]:text-primary-foreground"
              >
                注册
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {!isRegister && (
            <div className="mt-3 flex min-w-0 items-center justify-between gap-3 border-b border-line pb-3">
              <span className="shrink-0 text-[0.74rem] text-muted-foreground">登录方式</span>
              <div className="flex min-w-0 items-center gap-3 text-[0.78rem] font-semibold">
                {(['PASSWORD', 'CODE'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`relative shrink-0 py-1 transition active:scale-[0.98] ${
                      loginMode === mode ? 'text-brand' : 'text-muted-foreground'
                    }`}
                    onClick={() => setLoginMode(mode)}
                  >
                    {mode === 'PASSWORD' ? '密码登录' : '验证码登录'}
                    <span
                      className={`absolute inset-x-0 -bottom-0.5 mx-auto h-px rounded-full bg-brand transition-all ${
                        loginMode === mode ? 'w-full opacity-100' : 'w-0 opacity-0'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`${isRegister ? 'mt-4' : 'mt-3.5'} space-y-3.5`}>
            <Field label="邮箱" error={errors.email?.message}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 rounded-md border-line bg-base2 pl-9 text-[0.88rem] text-ink placeholder:text-muted-foreground focus-visible:ring-brand/20"
                  inputMode="email"
                  placeholder="name@example.com"
                  type="email"
                  {...register('email')}
                />
              </div>
            </Field>

            {(isRegister || loginMode === 'PASSWORD') && (
              <Field label="密码" error={errors.password?.message}>
                <div className="relative">
                  <Input
                    className="h-10 rounded-md border-line bg-base2 pr-10 text-[0.88rem] text-ink placeholder:text-muted-foreground focus-visible:ring-brand/20"
                    placeholder="至少 8 位登录密码"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                  />
                  <button
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-muted-foreground active:scale-95"
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>
            )}

            {needsCode && (
              <Field label="邮箱验证码" error={errors.code?.message}>
                <div className="flex gap-2">
                  <Input
                    className="h-10 rounded-md border-line bg-base2 text-[0.88rem] text-ink placeholder:text-muted-foreground focus-visible:ring-brand/20"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6 位验证码"
                    {...register('code')}
                  />
                  <Button
                    className="h-10 w-[6.2rem] rounded-md border-line bg-soft px-2 text-[0.76rem] text-ink hover:bg-soft2"
                    disabled={isSendingCode || codeCountdown > 0}
                    type="button"
                    variant="outline"
                    onClick={requestEmailCode}
                  >
                    {isSendingCode && <Loader2 className="size-3.5 animate-spin" />}
                    {codeButtonText}
                  </Button>
                </div>
              </Field>
            )}

            {isRegister && (
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="昵称" optional>
                  <Input
                    className="h-10 rounded-md border-line bg-base2 text-[0.88rem] text-ink placeholder:text-muted-foreground focus-visible:ring-brand/20"
                    placeholder="可选"
                    {...register('nickname')}
                  />
                </Field>
                <Field label="邀请码" optional>
                  <Input
                    className="h-10 rounded-md border-line bg-base2 text-[0.88rem] text-ink placeholder:text-muted-foreground focus-visible:ring-brand/20"
                    placeholder="可选"
                    {...register('inviteCode')}
                  />
                </Field>
              </div>
            )}
          </div>

          <Button
            className="mt-5 h-10 w-full rounded-md bg-brand text-[0.9rem] font-semibold text-primary-foreground hover:bg-brand/90"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isRegister ? '注册并登录' : '登录'}
          </Button>
        </div>

        <p className="mt-3 px-2 text-center text-[0.68rem] leading-relaxed text-muted-foreground">
          登录即表示你同意平台账户安全规则。请勿向任何人泄露邮箱验证码。
        </p>
      </form>
    </section>
  );
}

function Field({
  children,
  error,
  label,
  optional,
}: {
  children: ReactNode;
  error?: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label className="text-[0.76rem] font-medium text-muted-foreground">{label}</Label>
        {optional && <span className="text-[0.66rem] text-muted-foreground">选填</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-[0.68rem] leading-relaxed text-danger">{error}</p>}
    </div>
  );
}

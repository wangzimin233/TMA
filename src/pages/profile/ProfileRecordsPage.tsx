import { ChevronLeft, FileText, WalletCards } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

type ProfileRecordsPageProps = {
  onBack: () => void;
};

export function ProfileRecordsPage({ onBack }: ProfileRecordsPageProps) {
  return (
    <section className="min-h-screen bg-base pb-[calc(18px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-10 flex h-11 items-center border-b border-line bg-base px-3">
        <Button
          aria-label="返回"
          className="size-8 rounded-md bg-transparent p-0 text-muted-foreground hover:bg-soft hover:text-ink"
          size="icon"
          variant="ghost"
          onClick={onBack}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-center text-[0.98rem] font-semibold">记录</h1>
        <span className="size-8" />
      </header>

      <Tabs defaultValue="fund" className="gap-0 px-4 pt-4">
        <TabsList variant="line" className="h-9 gap-5 px-0">
          <TabsTrigger
            value="fund"
            className="h-8 shrink-0 px-0 text-[0.95rem] font-semibold text-muted-foreground data-[state=active]:text-ink group-data-[variant=line]/tabs-list:data-[state=active]:after:bg-brand"
          >
            资金记录
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="h-8 shrink-0 px-0 text-[0.95rem] font-semibold text-muted-foreground data-[state=active]:text-ink group-data-[variant=line]/tabs-list:data-[state=active]:after:bg-brand"
          >
            订单记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fund" className="mt-4">
          <FundRecords />
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <EmptyRecordState icon={FileText} title="暂无订单" description="当前没有可展示的订单记录。" />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function FundRecords() {
  return <EmptyRecordState icon={WalletCards} title="暂无资金记录" description="资金流水接口接入后会展示充值、提现和划转记录。" />;
}

function EmptyRecordState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="grid min-h-[150px] place-items-center rounded-md border border-line bg-panel px-4 py-6 text-center">
      <div className="min-w-0">
        <Icon className="mx-auto mb-2 size-7 text-muted-foreground" />
        <p className="text-[0.84rem] font-semibold text-ink">{title}</p>
        <p className="mt-1 text-[0.72rem] leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

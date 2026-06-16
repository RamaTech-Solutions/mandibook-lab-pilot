import { Sidebar, BottomNav } from "@/components/layout/app-shell";
import { requireFirm } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireFirm();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col pb-20 md:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

"use client";

import { getKisanByName } from "@/actions/parties";
import { settleDuePayment, settleTraderDuePayment, type DuePaymentItem, type TraderDuePaymentItem } from "@/actions/due-payments";
import { AppHeader } from "@/components/layout/app-shell";
import { useLanguage } from "@/components/i18n/language-provider";
import { BalanceBadge } from "@/components/ledger/balance-badge";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR, formatDate } from "@/lib/format";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type KisanOption = { id: string; name: string };

type KisanHistory = Awaited<ReturnType<typeof getKisanByName>>;

function DueApproveModal({
  item,
  onClose,
  onSuccess,
}: {
  item: DuePaymentItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState("CASH");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const result = await settleDuePayment(
      item.transactionId,
      mode as "CASH" | "UPI" | "BANK"
    );
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success(t("payments.approved"));
    onSuccess();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <h3 className="text-base font-semibold">{t("payments.modalTitle")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {item.farmerName} — {item.commodityName}
        </p>
        <p className="mt-2 text-lg font-bold text-mandi-dark">{formatINR(item.amount)}</p>
        <p className="text-xs text-muted-foreground">
          {t("payments.dueDate", { date: formatDate(item.dueDate) })} ·{" "}
          {t("payments.saleDate", { date: formatDate(item.saleDate) })}
        </p>

        <div className="mt-4 space-y-2">
          <Label>{t("payments.paymentMode")}</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">{t("payments.modeCash")}</SelectItem>
              <SelectItem value="UPI">{t("payments.modeUpi")}</SelectItem>
              <SelectItem value="BANK">{t("payments.modeBank")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-5 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button type="button" className="flex-1" onClick={handleConfirm} disabled={loading}>
            {loading ? t("common.saving") : t("payments.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TraderDueApproveModal({
  item,
  onClose,
  onSuccess,
}: {
  item: TraderDuePaymentItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState("CASH");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const result = await settleTraderDuePayment(
      item.transactionId,
      mode as "CASH" | "UPI" | "BANK"
    );
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success(t("payments.traderApproved"));
    onSuccess();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <h3 className="text-base font-semibold">{t("payments.traderModalTitle")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {item.traderName} — {item.commodityName}
        </p>
        <p className="mt-2 text-lg font-bold text-mandi-dark">{formatINR(item.amount)}</p>
        <p className="text-xs text-muted-foreground">
          {t("payments.dueDate", { date: formatDate(item.dueDate) })} ·{" "}
          {t("payments.purchaseDate", { date: formatDate(item.saleDate) })}
        </p>

        <div className="mt-4 space-y-2">
          <Label>{t("payments.paymentMode")}</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">{t("payments.modeCash")}</SelectItem>
              <SelectItem value="UPI">{t("payments.modeUpi")}</SelectItem>
              <SelectItem value="BANK">{t("payments.modeBank")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-5 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button type="button" className="flex-1" onClick={handleConfirm} disabled={loading}>
            {loading ? t("common.saving") : t("payments.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function computeTotalPaid(entries: NonNullable<KisanHistory>["ledgerEntries"]) {
  return entries
    .filter((e) => e.entryType === "PAYMENT" && e.direction === "DEBIT")
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
}

export function PaymentsPageClient({
  kisans,
  duePayments,
  traderDuePayments,
}: {
  kisans: KisanOption[];
  duePayments: DuePaymentItem[];
  traderDuePayments: TraderDuePaymentItem[];
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [kisanName, setKisanName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedKisan, setSelectedKisan] = useState<KisanHistory>(null);
  const [approvingItem, setApprovingItem] = useState<DuePaymentItem | null>(null);
  const [approvingTraderItem, setApprovingTraderItem] = useState<TraderDuePaymentItem | null>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const filteredKisans = useMemo(() => {
    const trimmed = kisanName.trim().toLowerCase();
    if (!trimmed) return kisans;
    return kisans.filter((k) => k.name.toLowerCase().includes(trimmed));
  }, [kisans, kisanName]);

  const totalPaid = selectedKisan ? computeTotalPaid(selectedKisan.ledgerEntries) : 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadKisanHistory(name: string) {
    setLoadingHistory(true);
    try {
      const data = await getKisanByName(name);
      if (!data) {
        setSelectedKisan(null);
        toast.error(t("payments.noKisan"));
      } else {
        setSelectedKisan(data);
      }
    } finally {
      setLoadingHistory(false);
    }
  }

  async function selectKisan(k: KisanOption) {
    setKisanName(k.name);
    setDropdownOpen(false);
    await loadKisanHistory(k.name);
  }

  async function handleNameChange(value: string) {
    setKisanName(value);
    setDropdownOpen(true);
    const exact = kisans.find((k) => k.name.toLowerCase() === value.trim().toLowerCase());
    if (exact) {
      await loadKisanHistory(exact.name);
    } else {
      setSelectedKisan(null);
    }
  }

  const dueSummary = useMemo(() => {
    const totalAmount = duePayments.reduce((sum, d) => sum + d.amount, 0);
    const todayCount = duePayments.filter((d) => d.status === "TODAY").length;
    const overdueCount = duePayments.filter((d) => d.status === "OVERDUE").length;
    return { totalAmount, todayCount, overdueCount };
  }, [duePayments]);

  const traderDueSummary = useMemo(() => {
    const totalAmount = traderDuePayments.reduce((sum, d) => sum + d.amount, 0);
    const todayCount = traderDuePayments.filter((d) => d.status === "TODAY").length;
    const overdueCount = traderDuePayments.filter((d) => d.status === "OVERDUE").length;
    return { totalAmount, todayCount, overdueCount };
  }, [traderDuePayments]);

  return (
    <>
      <AppHeader title={t("payments.title")} />
      <main className="space-y-4 p-4">
        <Card className="border-mandi-primary bg-mandi-light/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("payments.todayDue")}</CardTitle>
          </CardHeader>
          <CardContent>
            {duePayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("payments.noDueToday")}</p>
            ) : (
              <p className="text-2xl font-bold text-mandi-dark">
                {t("payments.totalDue", {
                  amount: formatINR(dueSummary.totalAmount),
                  today: String(dueSummary.todayCount),
                  overdue: String(dueSummary.overdueCount),
                })}
              </p>
            )}
          </CardContent>
        </Card>

        {duePayments.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("payments.kisanList")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {duePayments.map((item) => (
                <div
                  key={item.transactionId}
                  className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.farmerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.commodityName} ·{" "}
                      {t("payments.saleDate", { date: formatDate(item.saleDate) })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("payments.dueDate", { date: formatDate(item.dueDate) })}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        item.status === "TODAY"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.status === "TODAY" ? t("payments.badgeToday") : t("payments.badgeOverdue")}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-semibold">{formatINR(item.amount)}</span>
                    <Button type="button" size="sm" onClick={() => setApprovingItem(item)}>
                      {t("payments.approvePay")}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("payments.traderDueToday")}</CardTitle>
          </CardHeader>
          <CardContent>
            {traderDuePayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("payments.noTraderDueToday")}</p>
            ) : (
              <p className="text-2xl font-bold text-mandi-dark">
                {t("payments.totalDue", {
                  amount: formatINR(traderDueSummary.totalAmount),
                  today: String(traderDueSummary.todayCount),
                  overdue: String(traderDueSummary.overdueCount),
                })}
              </p>
            )}
          </CardContent>
        </Card>

        {traderDuePayments.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("payments.traderList")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {traderDuePayments.map((item) => (
                <div
                  key={item.transactionId}
                  className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.traderName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.commodityName} ·{" "}
                      {t("payments.purchaseDate", { date: formatDate(item.saleDate) })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("payments.dueDate", { date: formatDate(item.dueDate) })}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        item.status === "TODAY"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.status === "TODAY" ? t("payments.badgeToday") : t("payments.badgeOverdue")}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-semibold">{formatINR(item.amount)}</span>
                    <Button type="button" size="sm" onClick={() => setApprovingTraderItem(item)}>
                      {t("payments.collectPay")}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("payments.kisanSearch")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div ref={comboboxRef} className="relative space-y-2">
              <Label htmlFor="kisan-filter">{t("payments.kisanSearch")}</Label>
              <div className="flex">
                <Input
                  id="kisan-filter"
                  placeholder={t("payments.kisanPlaceholder")}
                  className="rounded-r-none border-r-0"
                  value={kisanName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => setDropdownOpen(true)}
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-l-none border-l-0 px-3"
                  aria-label={t("payments.openKisanList")}
                  onClick={() => setDropdownOpen((open) => !open)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              {dropdownOpen && (
                <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-card shadow-md">
                  {filteredKisans.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">{t("payments.noKisan")}</li>
                  ) : (
                    filteredKisans.map((k) => (
                      <li key={k.id}>
                        <button
                          type="button"
                          className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted/60"
                          onClick={() => selectKisan(k)}
                        >
                          {k.name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            {loadingHistory && (
              <p className="text-sm text-muted-foreground">{t("payments.loadingHistory")}</p>
            )}

            {!loadingHistory && !selectedKisan && kisanName.trim() === "" && (
              <p className="text-sm text-muted-foreground">{t("payments.selectKisan")}</p>
            )}

            {selectedKisan && !loadingHistory && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-lg font-semibold">{selectedKisan.name}</p>
                  <BalanceBadge partyType="KISAN" balance={selectedKisan.balance} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{t("payments.balanceDue")}</p>
                    <p className="font-semibold text-mandi-dark">{formatINR(selectedKisan.balance)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{t("payments.totalPaid")}</p>
                    <p className="font-semibold text-mandi-dark">{formatINR(totalPaid)}</p>
                  </div>
                </div>
                <LedgerTable
                  partyType="KISAN"
                  entries={selectedKisan.ledgerEntries}
                  openingBalance={selectedKisan.openingBalance}
                  balanceType={selectedKisan.balanceType}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {approvingItem && (
        <DueApproveModal
          item={approvingItem}
          onClose={() => setApprovingItem(null)}
          onSuccess={() => {
            setApprovingItem(null);
            router.refresh();
            if (selectedKisan) loadKisanHistory(selectedKisan.name);
          }}
        />
      )}

      {approvingTraderItem && (
        <TraderDueApproveModal
          item={approvingTraderItem}
          onClose={() => setApprovingTraderItem(null)}
          onSuccess={() => {
            setApprovingTraderItem(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

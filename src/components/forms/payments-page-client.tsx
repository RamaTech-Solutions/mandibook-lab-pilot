"use client";

import { createPayment } from "@/actions/payments";
import { settleDuePayment, type DuePaymentItem } from "@/actions/due-payments";
import { AppHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR, formatDate, todayIST } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Party = { id: string; name: string; type: string };
type Payment = {
  id: string;
  amount: { toString(): string };
  paymentDate: Date;
  paymentMode: string;
  direction: string;
  party: { name: string; type: string };
};

function DueApproveModal({
  item,
  onClose,
  onSuccess,
}: {
  item: DuePaymentItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
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
    toast.success("Payment approve ho gaya — due settled");
    onSuccess();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <h3 className="text-base font-semibold">Payment Approve</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {item.farmerName} — {item.commodityName}
        </p>
        <p className="mt-2 text-lg font-bold text-mandi-dark">{formatINR(item.amount)}</p>
        <p className="text-xs text-muted-foreground">
          Due: {formatDate(item.dueDate)} · Sale: {formatDate(item.saleDate)}
        </p>

        <div className="mt-4 space-y-2">
          <Label>Payment Mode</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="BANK">Bank</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-5 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" onClick={handleConfirm} disabled={loading}>
            {loading ? "Saving..." : "Payment Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PaymentsPageClient({
  parties,
  payments,
  duePayments,
}: {
  parties: Party[];
  payments: Payment[];
  duePayments: DuePaymentItem[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [partyId, setPartyId] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [approvingItem, setApprovingItem] = useState<DuePaymentItem | null>(null);
  const today = todayIST().toISOString().split("T")[0];

  const dueSummary = useMemo(() => {
    const totalAmount = duePayments.reduce((sum, d) => sum + d.amount, 0);
    const todayCount = duePayments.filter((d) => d.status === "TODAY").length;
    const overdueCount = duePayments.filter((d) => d.status === "OVERDUE").length;
    return { totalAmount, todayCount, overdueCount };
  }, [duePayments]);

  const selectedParty = parties.find((p) => p.id === partyId);

  async function handleSubmit(formData: FormData) {
    formData.set("partyId", partyId);
    formData.set("paymentMode", paymentMode);
    if (!partyId) {
      toast.error("Party select karein");
      return;
    }
    setLoading(true);
    const result = await createPayment(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Payment record ho gaya");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <>
      <AppHeader title="Payment" />
      <main className="space-y-4 p-4">
        <Card className="border-mandi-primary bg-mandi-light/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Aaj Payment Due</CardTitle>
          </CardHeader>
          <CardContent>
            {duePayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aaj koi baaki payment due nahi</p>
            ) : (
              <>
                <p className="text-2xl font-bold text-mandi-dark">
                  Total pay karna hai: {formatINR(dueSummary.totalAmount)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dueSummary.todayCount} aaj due · {dueSummary.overdueCount} overdue
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {duePayments.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Baaki Payment — Kisan List</CardTitle>
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
                      {item.commodityName} · Sale {formatDate(item.saleDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(item.dueDate)}</p>
                    <span
                      className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        item.status === "TODAY"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.status === "TODAY" ? "Aaj" : "Overdue"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-semibold">{formatINR(item.amount)}</span>
                    <Button type="button" size="sm" onClick={() => setApprovingItem(item)}>
                      Approve / Pay
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Naya Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Party *</Label>
                <Select value={partyId} onValueChange={setPartyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kisan ya Vyapari" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.type === "KISAN" ? "Kisan" : "Vyapari"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedParty && (
                  <p className="text-xs text-muted-foreground">
                    {selectedParty.type === "KISAN"
                      ? "Payment Kisan ko — Jama (DEBIT)"
                      : "Payment Vyapari se — Jama (CREDIT)"}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Date</Label>
                  <Input id="paymentDate" name="paymentDate" type="date" defaultValue={today} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Saving..." : "Payment Save Karein"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Abhi koi payment nahi</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="flex justify-between border-b border-border py-2 last:border-0 text-sm">
                  <div>
                    <p className="font-medium">{p.party.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.paymentDate)} · {p.paymentMode} · {p.direction === "PAID" ? "Paid" : "Received"}
                    </p>
                  </div>
                  <span className="font-semibold">{formatINR(p.amount.toString())}</span>
                </div>
              ))
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
          }}
        />
      )}
    </>
  );
}

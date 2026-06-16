"use client";

import { createPayment } from "@/actions/payments";
import { AppHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR, formatDate, todayIST } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export function PaymentsPageClient({
  parties,
  payments,
}: {
  parties: Party[];
  payments: Payment[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [partyId, setPartyId] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const today = todayIST().toISOString().split("T")[0];

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
    </>
  );
}

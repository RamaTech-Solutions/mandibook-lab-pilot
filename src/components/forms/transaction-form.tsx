"use client";

import { useMemo, useState } from "react";
import { createTransaction } from "@/actions/transactions";
import { AppHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateTransaction } from "@/lib/calculations";
import { formatINR, UNIT_LABELS, todayIST } from "@/lib/format";
import { toast } from "sonner";

type Party = { id: string; name: string };
type Commodity = { id: string; name: string; unit: string };

export function TransactionForm({
  kisans,
  vyaparis,
  commodities,
  defaultCommissionRate,
}: {
  kisans: Party[];
  vyaparis: Party[];
  commodities: Commodity[];
  defaultCommissionRate: number;
}) {
  const today = todayIST().toISOString().split("T")[0];
  const [loading, setLoading] = useState(false);
  const [weight, setWeight] = useState("");
  const [rate, setRate] = useState("");
  const [commissionRate, setCommissionRate] = useState(String(defaultCommissionRate));
  const [deductions, setDeductions] = useState("0");
  const [selectedCommodity, setSelectedCommodity] = useState(commodities[0]?.id ?? "");
  const [farmerId, setFarmerId] = useState("");
  const [traderId, setTraderId] = useState("");

  const unit = commodities.find((c) => c.id === selectedCommodity)?.unit ?? "KG";

  const preview = useMemo(() => {
    try {
      if (!weight || !rate) return null;
      const calc = calculateTransaction({
        weight,
        rate,
        commissionRate: commissionRate || 0,
        deductions: deductions || 0,
      });
      return calc;
    } catch {
      return null;
    }
  }, [weight, rate, commissionRate, deductions]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createTransaction(formData);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      <AppHeader title="Nayi Sale" />
      <main className="space-y-4 p-4 pb-28">
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="farmerId" value={farmerId} />
          <input type="hidden" name="traderId" value={traderId} />
          <input type="hidden" name="commodityId" value={selectedCommodity} />
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Kisan *</Label>
                <Select value={farmerId} onValueChange={setFarmerId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Kisan select karein" />
                  </SelectTrigger>
                  <SelectContent>
                    {kisans.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vyapari *</Label>
                <Select value={traderId} onValueChange={setTraderId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyapari select karein" />
                  </SelectTrigger>
                  <SelectContent>
                    {vyaparis.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Maal *</Label>
                <Select value={selectedCommodity} onValueChange={setSelectedCommodity} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Maal select karein" />
                  </SelectTrigger>
                  <SelectContent>
                    {commodities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({UNIT_LABELS[c.unit]})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="weight">Wajan ({UNIT_LABELS[unit]}) *</Label>
                  <Input id="weight" name="weight" type="number" step="0.001" min="0" required value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Bhav (₹) *</Label>
                  <Input id="rate" name="rate" type="number" step="0.01" min="0" required value={rate} onChange={(e) => setRate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="commissionRate">Commission (%)</Label>
                  <Input id="commissionRate" name="commissionRate" type="number" step="0.01" min="0" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deductions">Katauti (₹)</Label>
                  <Input id="deductions" name="deductions" type="number" step="0.01" min="0" value={deductions} onChange={(e) => setDeductions(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transactionDate">Date</Label>
                <Input id="transactionDate" name="transactionDate" type="date" defaultValue={today} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
            </CardContent>
          </Card>

          {preview && (
            <Card className="border-mandi-primary bg-mandi-light/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Calculation Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Kul Rakam</span><span className="font-semibold">{formatINR(preview.grossAmount.toString())}</span></div>
                <div className="flex justify-between"><span>Commission</span><span>{formatINR(preview.commissionAmount.toString())}</span></div>
                <div className="flex justify-between"><span>Kisan Net Payable</span><span className="font-semibold text-mandi-dark">{formatINR(preview.farmerPayable.toString())}</span></div>
                <div className="flex justify-between"><span>Vyapari Receivable</span><span className="font-semibold">{formatINR(preview.traderReceivable.toString())}</span></div>
              </CardContent>
            </Card>
          )}

          <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card p-4 md:bottom-0 md:left-56">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Saving..." : "Sale Save Karein"}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}

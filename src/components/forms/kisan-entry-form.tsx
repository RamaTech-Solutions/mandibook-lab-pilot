"use client";

import { useMemo, useState } from "react";
import { createMandiEntry } from "@/actions/mandi-entry";
import { AppHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateTransactionQuintalPerKg, QUINTAL_KG } from "@/lib/calculations";
import { formatINR, todayIST } from "@/lib/format";
import { validateMandiEntryPayments } from "@/lib/validations";
import { toast } from "sonner";

type Party = { id: string; name: string; village?: string | null };
type Commodity = { id: string; name: string; unit: string };

function matchPartyByName(parties: Party[], name: string) {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return null;
  return parties.find((p) => p.name.toLowerCase() === trimmed) ?? null;
}

function matchCommodityByName(commodities: Commodity[], name: string) {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return null;
  return commodities.find((c) => c.name.toLowerCase() === trimmed) ?? null;
}

export function KisanEntryForm({
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
  const [step, setStep] = useState<1 | 2>(1);

  const [farmerId, setFarmerId] = useState("");
  const [farmerName, setFarmerName] = useState("");
  const [farmerVillage, setFarmerVillage] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");

  const [traderId, setTraderId] = useState("");
  const [traderName, setTraderName] = useState("");

  const [commodityId, setCommodityId] = useState("");
  const [commodityName, setCommodityName] = useState("");

  const [weight, setWeight] = useState("");
  const [rate, setRate] = useState("");
  const [commissionRate, setCommissionRate] = useState(String(defaultCommissionRate));
  const [deductions, setDeductions] = useState("0");
  const [transactionDate, setTransactionDate] = useState(today);
  const [notes, setNotes] = useState("");

  const [cashPayment, setCashPayment] = useState("0");
  const [onlinePayment, setOnlinePayment] = useState("0");
  const [remainingDueDate, setRemainingDueDate] = useState("");

  const weightKg = useMemo(() => {
    const q = parseFloat(weight);
    if (!weight || Number.isNaN(q)) return null;
    return q * QUINTAL_KG;
  }, [weight]);

  const preview = useMemo(() => {
    try {
      if (!weight || !rate) return null;
      return calculateTransactionQuintalPerKg({
        weightQuintal: weight,
        ratePerKg: rate,
        commissionRate: commissionRate || 0,
        deductions: deductions || 0,
      });
    } catch {
      return null;
    }
  }, [weight, rate, commissionRate, deductions]);

  const farmerPayable = preview ? preview.farmerPayable.toNumber() : 0;

  const cashAmount = parseFloat(cashPayment) || 0;
  const onlineAmount = parseFloat(onlinePayment) || 0;
  const totalPaidToday = cashAmount + onlineAmount;
  const remainingAmount = Math.max(0, farmerPayable - totalPaidToday);

  function handleFarmerNameChange(value: string) {
    setFarmerName(value);
    const match = matchPartyByName(kisans, value);
    if (match) {
      setFarmerId(match.id);
      if (match.village && !farmerVillage) setFarmerVillage(match.village);
    } else {
      setFarmerId("");
    }
  }

  function handleTraderNameChange(value: string) {
    setTraderName(value);
    const match = matchPartyByName(vyaparis, value);
    setTraderId(match?.id ?? "");
  }

  function handleCommodityNameChange(value: string) {
    setCommodityName(value);
    const match = matchCommodityByName(commodities, value);
    setCommodityId(match?.id ?? "");
  }

  function handleNext() {
    if (!farmerName.trim()) {
      toast.error("Kisan ka naam required");
      return;
    }
    if (!traderName.trim()) {
      toast.error("Vyapari ka naam required");
      return;
    }
    if (!commodityName.trim()) {
      toast.error("Fasal required");
      return;
    }
    if (!weight || !rate || !preview) {
      toast.error("Wajan aur Bhav sahi daalein");
      return;
    }
    if (!transactionDate) {
      toast.error("Date required");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateStep2(): string | null {
    return validateMandiEntryPayments(
      {
        cashPayment: cashAmount,
        onlinePayment: onlineAmount,
        remainingDueDate: remainingAmount > 0.001 ? remainingDueDate : undefined,
        transactionDate,
      },
      farmerPayable
    );
  }

  async function handleSubmit(formData: FormData) {
    if (step !== 2) return;

    const paymentError = validateStep2();
    if (paymentError) {
      toast.error(paymentError);
      return;
    }

    formData.set("farmerId", farmerId);
    formData.set("farmerName", farmerName);
    formData.set("farmerVillage", farmerVillage);
    formData.set("farmerPhone", farmerPhone);
    formData.set("traderId", traderId);
    formData.set("traderName", traderName);
    formData.set("commodityId", commodityId);
    formData.set("commodityName", commodityName);
    formData.set("commodityUnit", "QUINTAL");
    formData.set("transactionDate", transactionDate);
    formData.set("notes", notes);
    formData.set("cashPayment", String(cashAmount));
    formData.set("onlinePayment", String(onlineAmount));
    if (remainingAmount > 0.001 && remainingDueDate) {
      formData.set("remainingDueDate", remainingDueDate);
    }

    setLoading(true);
    const result = await createMandiEntry(formData);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      <AppHeader title="Kisan Entry" />
      <main className="space-y-4 p-4 pb-28">
        <p className="text-xs text-muted-foreground">
          {step === 1 ? (
            <>
              Wajan <strong>Quintal</strong> mein, Bhav <strong>₹ per Kg</strong> mein daalein. Total auto
              calculate hoga (1 Quintal = 100 Kg). Purane naam list se select karein.
            </>
          ) : (
            <>
              Step 2: Vyapari ne kisan ko <strong>aaj kitna payment diya</strong> — cash aur online alag
              daalein. Baaki rakam ki date bhi likhein.
            </>
          )}
        </p>

        <form action={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Kisan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="farmerName">Kisan naam *</Label>
                    <Input
                      id="farmerName"
                      name="farmerName"
                      list="kisan-suggestions"
                      required
                      placeholder="Naam type karein ya list se chunein"
                      value={farmerName}
                      onChange={(e) => handleFarmerNameChange(e.target.value)}
                    />
                    <datalist id="kisan-suggestions">
                      {kisans.map((k) => (
                        <option key={k.id} value={k.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="farmerVillage">Gaon</Label>
                      <Input
                        id="farmerVillage"
                        name="farmerVillage"
                        value={farmerVillage}
                        onChange={(e) => setFarmerVillage(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farmerPhone">Phone</Label>
                      <Input
                        id="farmerPhone"
                        name="farmerPhone"
                        maxLength={10}
                        placeholder="9876543210"
                        value={farmerPhone}
                        onChange={(e) => setFarmerPhone(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Maal &amp; Sale</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="commodityName">Fasal *</Label>
                    <Input
                      id="commodityName"
                      name="commodityName"
                      list="maal-suggestions"
                      required
                      placeholder="Gehu, Pyaz..."
                      value={commodityName}
                      onChange={(e) => handleCommodityNameChange(e.target.value)}
                    />
                    <datalist id="maal-suggestions">
                      {commodities.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Wajan (Quintal) *</Label>
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        step="0.001"
                        min="0"
                        required
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                      {weightKg != null && (
                        <p className="text-xs text-muted-foreground">= {weightKg.toLocaleString("en-IN")} Kg</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate">Bhav (₹ per Kg) *</Label>
                      <Input
                        id="rate"
                        name="rate"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="25"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="commissionRate">Commission (%)</Label>
                      <Input
                        id="commissionRate"
                        name="commissionRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deductions">Katauti (₹)</Label>
                      <Input
                        id="deductions"
                        name="deductions"
                        type="number"
                        step="0.01"
                        min="0"
                        value={deductions}
                        onChange={(e) => setDeductions(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transactionDate">Date</Label>
                    <Input
                      id="transactionDate"
                      name="transactionDate"
                      type="date"
                      required
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input id="notes" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Vyapari</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="traderName">Vyapari naam *</Label>
                    <Input
                      id="traderName"
                      name="traderName"
                      list="vyapari-suggestions"
                      required
                      placeholder="Naam type karein ya list se chunein"
                      value={traderName}
                      onChange={(e) => handleTraderNameChange(e.target.value)}
                    />
                    <datalist id="vyapari-suggestions">
                      {vyaparis.map((v) => (
                        <option key={v.id} value={v.name} />
                      ))}
                    </datalist>
                  </div>
                </CardContent>
              </Card>

              {preview && weight && rate && (
                <Card className="border-mandi-primary bg-mandi-light/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Calculation Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Bhav</span>
                      <span>{formatINR(rate)}/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wajan</span>
                      <span>
                        {weight} Quintal ({weightKg?.toLocaleString("en-IN")} Kg)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kul Rakam</span>
                      <span className="font-semibold">{formatINR(preview.grossAmount.toString())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission</span>
                      <span>{formatINR(preview.commissionAmount.toString())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kisan Net Payable</span>
                      <span className="font-semibold text-mandi-dark">
                        {formatINR(preview.farmerPayable.toString())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vyapari Receivable</span>
                      <span className="font-semibold">{formatINR(preview.traderReceivable.toString())}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {step === 2 && preview && (
            <>
              <Card className="border-mandi-primary/50 bg-mandi-light/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Sale Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Kisan:</span> {farmerName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Vyapari:</span> {traderName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Fasal:</span> {commodityName} — {weight} Quintal @{" "}
                    {formatINR(rate)}/kg
                  </p>
                  <div className="flex justify-between pt-2 font-semibold text-mandi-dark">
                    <span>Kisan Net Payable</span>
                    <span>{formatINR(farmerPayable)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Kisan ko Payment (Aaj)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="cashPayment">Cash (₹)</Label>
                      <Input
                        id="cashPayment"
                        name="cashPayment"
                        type="number"
                        step="0.01"
                        min="0"
                        value={cashPayment}
                        onChange={(e) => setCashPayment(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="onlinePayment">Online (₹)</Label>
                      <Input
                        id="onlinePayment"
                        name="onlinePayment"
                        type="number"
                        step="0.01"
                        min="0"
                        value={onlinePayment}
                        onChange={(e) => setOnlinePayment(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Aaj diya (Cash + Online)</span>
                      <span className="font-medium">{formatINR(totalPaidToday)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-mandi-dark">
                      <span>Baaki rakam</span>
                      <span>{formatINR(remainingAmount)}</span>
                    </div>
                  </div>

                  {remainingAmount > 0.001 && (
                    <div className="space-y-2">
                      <Label htmlFor="remainingDueDate">Baaki payment ki date *</Label>
                      <Input
                        id="remainingDueDate"
                        name="remainingDueDate"
                        type="date"
                        required
                        min={transactionDate}
                        value={remainingDueDate}
                        onChange={(e) => setRemainingDueDate(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Baaki {formatINR(remainingAmount)} kab denge — date select karein
                      </p>
                    </div>
                  )}

                  {totalPaidToday > farmerPayable + 0.001 && (
                    <p className="text-sm text-destructive">Payment kisan net se zyada nahi ho sakta</p>
                  )}
                </CardContent>
              </Card>

              {/* Hidden fields for server action */}
              <input type="hidden" name="farmerName" value={farmerName} />
              <input type="hidden" name="traderName" value={traderName} />
              <input type="hidden" name="commodityName" value={commodityName} />
              <input type="hidden" name="weight" value={weight} />
              <input type="hidden" name="rate" value={rate} />
              <input type="hidden" name="commissionRate" value={commissionRate} />
              <input type="hidden" name="deductions" value={deductions} />
            </>
          )}

          <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card p-4 md:bottom-0 md:left-56">
            {step === 1 ? (
              <Button type="button" className="w-full" size="lg" onClick={handleNext}>
                Aage Badhein (Next)
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  disabled={loading}
                  onClick={() => setStep(1)}
                >
                  Wapas
                </Button>
                <Button
                  type="submit"
                  className="flex-[2]"
                  size="lg"
                  disabled={loading || totalPaidToday > farmerPayable + 0.001}
                >
                  {loading ? "Saving..." : "Entry Save Karein"}
                </Button>
              </div>
            )}
          </div>
        </form>
      </main>
    </>
  );
}

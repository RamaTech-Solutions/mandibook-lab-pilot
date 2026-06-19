"use client";

import { useMemo, useState } from "react";
import { createVyapariEntry } from "@/actions/vyapari-entry";
import { AppHeader } from "@/components/layout/app-shell";
import { useLanguage } from "@/components/i18n/language-provider";
import { translateError } from "@/lib/i18n/translate-error";
import { getMessages } from "@/lib/i18n/get-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateTransactionQuintalPerKg, QUINTAL_KG } from "@/lib/calculations";
import { formatINR, todayIST } from "@/lib/format";
import { validateVyapariEntryPayments } from "@/lib/validations";
import { toast } from "sonner";

type Trader = { id: string; name: string; phone?: string | null; address?: string | null };
type Commodity = { id: string; name: string; unit: string; totalWeight?: number };

function matchTraderByName(traders: Trader[], name: string) {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return null;
  return traders.find((p) => p.name.toLowerCase() === trimmed) ?? null;
}

function matchCommodityByName(commodities: Commodity[], name: string) {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return null;
  return commodities.find((c) => c.name.toLowerCase() === trimmed) ?? null;
}

export function VyapariEntryForm({
  traders,
  commodities,
  defaultCommissionRate,
}: {
  traders: Trader[];
  commodities: Commodity[];
  defaultCommissionRate: number;
}) {
  const today = todayIST().toISOString().split("T")[0];
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [traderId, setTraderId] = useState("");
  const [traderName, setTraderName] = useState("");
  const [traderPhone, setTraderPhone] = useState("");
  const [traderCity, setTraderCity] = useState("");

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

  const traderReceivable = preview ? preview.traderReceivable.toNumber() : 0;

  const cashAmount = parseFloat(cashPayment) || 0;
  const onlineAmount = parseFloat(onlinePayment) || 0;
  const totalReceivedToday = cashAmount + onlineAmount;
  const remainingAmount = Math.max(0, traderReceivable - totalReceivedToday);

  function handleTraderNameChange(value: string) {
    setTraderName(value);
    const match = matchTraderByName(traders, value);
    if (match) {
      setTraderId(match.id);
      if (match.phone && !traderPhone) setTraderPhone(match.phone.replace(/\D/g, "").slice(-10));
      if (match.address && !traderCity) setTraderCity(match.address);
    } else {
      setTraderId("");
    }
  }

  function handleCommodityNameChange(value: string) {
    setCommodityName(value);
    const match = matchCommodityByName(commodities, value);
    setCommodityId(match?.id ?? "");
  }

  function handleNext() {
    if (!traderName.trim()) {
      toast.error(t("errors.traderNameRequired"));
      return;
    }
    if (!/^[6-9]\d{9}$/.test(traderPhone.trim())) {
      toast.error(t("errors.phoneRequired"));
      return;
    }
    if (!commodityName.trim()) {
      toast.error(t("errors.commodityRequired"));
      return;
    }
    if (!weight || !rate || !preview) {
      toast.error(t("errors.weightRateRequired"));
      return;
    }
    if (!transactionDate) {
      toast.error(t("errors.dateRequired"));
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateStep2(): string | null {
    return validateVyapariEntryPayments(
      {
        cashPayment: cashAmount,
        onlinePayment: onlineAmount,
        remainingDueDate: remainingAmount > 0.001 ? remainingDueDate : undefined,
        transactionDate,
      },
      traderReceivable
    );
  }

  async function handleSubmit(formData: FormData) {
    if (step !== 2) return;

    const paymentError = validateStep2();
    if (paymentError) {
      toast.error(translateError(getMessages(locale), paymentError));
      return;
    }

    formData.set("traderId", traderId);
    formData.set("traderName", traderName);
    formData.set("traderPhone", traderPhone);
    formData.set("traderCity", traderCity);
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
    const result = await createVyapariEntry(formData);
    if (result?.error) {
      toast.error(translateError(getMessages(locale), result.error));
      setLoading(false);
    }
  }

  return (
    <>
      <AppHeader title={t("vyapariEntry.title")} />
      <main className="space-y-4 p-4 pb-28">
        <p className="text-xs text-muted-foreground">
          {step === 1 ? t("vyapariEntry.step1Hint") : t("vyapariEntry.step2Hint")}
        </p>

        <form action={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t("vyapariEntry.sectionTrader")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="traderName">{t("vyapariEntry.traderName")}</Label>
                    <Input
                      id="traderName"
                      name="traderName"
                      list="vyapari-suggestions"
                      required
                      placeholder={t("vyapariEntry.traderPlaceholder")}
                      value={traderName}
                      onChange={(e) => handleTraderNameChange(e.target.value)}
                    />
                    <datalist id="vyapari-suggestions">
                      {traders.map((v) => (
                        <option key={v.id} value={v.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="traderPhone">{t("entry.phone")}</Label>
                      <Input
                        id="traderPhone"
                        name="traderPhone"
                        maxLength={10}
                        required
                        placeholder="9876543210"
                        value={traderPhone}
                        onChange={(e) => setTraderPhone(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="traderCity">{t("vyapariEntry.city")}</Label>
                      <Input
                        id="traderCity"
                        name="traderCity"
                        value={traderCity}
                        onChange={(e) => setTraderCity(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t("vyapariEntry.sectionPurchase")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="commodityName">{t("entry.crop")}</Label>
                    <Input
                      id="commodityName"
                      name="commodityName"
                      list="maal-suggestions"
                      required
                      placeholder={t("entry.cropPlaceholder")}
                      value={commodityName}
                      onChange={(e) => handleCommodityNameChange(e.target.value)}
                    />
                    <datalist id="maal-suggestions">
                      {commodities.map((c) => (
                        <option
                          key={c.id}
                          value={c.name}
                          label={
                            c.totalWeight != null
                              ? `${c.name} — ${c.totalWeight.toLocaleString("en-IN", { maximumFractionDigits: 3 })} Quintal`
                              : c.name
                          }
                        />
                      ))}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="weight">{t("entry.weight")}</Label>
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
                        <p className="text-xs text-muted-foreground">
                          {t("entry.weightKg", { n: weightKg.toLocaleString("en-IN") })}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate">{t("entry.rate")}</Label>
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
                      <Label htmlFor="commissionRate">{t("entry.commission")}</Label>
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
                      <Label htmlFor="deductions">{t("entry.deductions")}</Label>
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
                    <Label htmlFor="transactionDate">{t("common.date")}</Label>
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
                    <Label htmlFor="notes">{t("common.notes")}</Label>
                    <Input id="notes" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {preview && weight && rate && (
                <Card className="border-mandi-primary bg-mandi-light/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t("entry.sectionPreview")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t("entry.previewRate")}</span>
                      <span>{formatINR(rate)}/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("entry.previewWeight")}</span>
                      <span>
                        {weight} Quintal ({weightKg?.toLocaleString("en-IN")} Kg)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("entry.previewGross")}</span>
                      <span className="font-semibold">{formatINR(preview.grossAmount.toString())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("entry.previewCommission")}</span>
                      <span>{formatINR(preview.commissionAmount.toString())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("vyapariEntry.previewTraderTotal")}</span>
                      <span className="font-semibold text-mandi-dark">
                        {formatINR(preview.traderReceivable.toString())}
                      </span>
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
                  <CardTitle className="text-base">{t("entry.sectionSummary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">{t("vyapariEntry.summaryTrader")}</span> {traderName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">{t("entry.summaryCrop")}</span> {commodityName} — {weight}{" "}
                    {t("common.quintal")} @ {formatINR(rate)}/kg
                  </p>
                  <div className="flex justify-between pt-2 font-semibold text-mandi-dark">
                    <span>{t("vyapariEntry.previewTraderTotal")}</span>
                    <span>{formatINR(traderReceivable)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t("vyapariEntry.paymentReceived")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="cashPayment">{t("entry.cash")}</Label>
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
                      <Label htmlFor="onlinePayment">{t("entry.online")}</Label>
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
                      <span>{t("vyapariEntry.receivedToday")}</span>
                      <span className="font-medium">{formatINR(totalReceivedToday)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-mandi-dark">
                      <span>{t("entry.remaining")}</span>
                      <span>{formatINR(remainingAmount)}</span>
                    </div>
                  </div>

                  {remainingAmount > 0.001 && (
                    <div className="space-y-2">
                      <Label htmlFor="remainingDueDate">{t("entry.dueDate")}</Label>
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
                        {t("vyapariEntry.dueDateHint", { amount: formatINR(remainingAmount) })}
                      </p>
                    </div>
                  )}

                  {totalReceivedToday > traderReceivable + 0.001 && (
                    <p className="text-sm text-destructive">{t("vyapariEntry.paymentExceeds")}</p>
                  )}
                </CardContent>
              </Card>

              <input type="hidden" name="traderName" value={traderName} />
              <input type="hidden" name="traderPhone" value={traderPhone} />
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
                {t("entry.next")}
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
                  {t("entry.back")}
                </Button>
                <Button
                  type="submit"
                  className="flex-[2]"
                  size="lg"
                  disabled={loading || totalReceivedToday > traderReceivable + 0.001}
                >
                  {loading ? t("common.saving") : t("vyapariEntry.save")}
                </Button>
              </div>
            )}
          </div>
        </form>
      </main>
    </>
  );
}

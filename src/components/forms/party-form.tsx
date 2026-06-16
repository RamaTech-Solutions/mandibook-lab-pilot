"use client";

import { createParty } from "@/actions/parties";
import { AppHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { PartyType } from "@prisma/client";

export function PartyForm({ type }: { type: PartyType }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [balanceType, setBalanceType] = useState("NONE");
  const label = type === "KISAN" ? "Kisan" : "Vyapari";

  async function handleSubmit(formData: FormData) {
    formData.set("balanceType", balanceType);
    setLoading(true);
    const result = await createParty(type, formData);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success(`${label} add ho gaya`);
    router.push(type === "KISAN" ? "/kisan" : "/vyapari");
  }

  return (
    <>
      <AppHeader title={`Naya ${label}`} />
      <main className="p-4">
        <Card>
          <CardContent className="pt-6">
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" maxLength={10} placeholder="9876543210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="village">Village</Label>
                <Input id="village" name="village" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openingBalance">Opening Balance</Label>
                <Input id="openingBalance" name="openingBalance" type="number" min="0" step="0.01" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label>Balance Type</Label>
                <Select value={balanceType} onValueChange={setBalanceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="RECEIVABLE">Receivable (Lena hai)</SelectItem>
                    <SelectItem value="PAYABLE">Payable (Dena hai)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Saving..." : "Save Karein"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

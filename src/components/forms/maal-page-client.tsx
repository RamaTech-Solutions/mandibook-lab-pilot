"use client";

import { createCommodity, toggleCommodity } from "@/actions/commodities";
import { AppHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { UNIT_LABELS } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Commodity = {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
};

export function MaalPageClient({ commodities }: { commodities: Commodity[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState("KG");

  async function handleAdd(formData: FormData) {
    formData.set("unit", unit);
    setLoading(true);
    const result = await createCommodity(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Maal add ho gaya");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleToggle(id: string) {
    await toggleCommodity(id);
    router.refresh();
  }

  return (
    <>
      <AppHeader title="Maal" />
      <main className="space-y-4 p-4">
        <Card>
          <CardContent className="pt-6">
            <form action={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">Maal Name</Label>
                <Input id="name" name="name" required placeholder="Aloo, Pyaz..." />
              </div>
              <div className="space-y-2 sm:w-36">
                <Label>Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">Kg</SelectItem>
                    <SelectItem value="QUINTAL">Quintal</SelectItem>
                    <SelectItem value="BAG">Bag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={loading}>Add</Button>
            </form>
          </CardContent>
        </Card>

        {commodities.length === 0 ? (
          <EmptyState title="Koi maal nahi" description="Pehla maal add karein" />
        ) : (
          <ul className="space-y-2">
            {commodities.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{UNIT_LABELS[c.unit] ?? c.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.isActive ? "default" : "outline"}>
                    {c.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(c.id)}>
                    Toggle
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

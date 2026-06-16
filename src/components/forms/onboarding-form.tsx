"use client";

import { createFirm } from "@/actions/firm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

export function OnboardingForm({ defaultPhone }: { defaultPhone?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createFirm(formData);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firm Setup</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Firm / Dukan Name *</Label>
            <Input id="name" name="name" required placeholder="Sharma Adat Agency" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mandiName">Mandi Name *</Label>
            <Input id="mandiName" name="mandiName" required placeholder="Azadpur Mandi" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name *</Label>
            <Input id="ownerName" name="ownerName" required placeholder="Ramesh Sharma" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" name="phone" required defaultValue={defaultPhone} placeholder="9876543210" maxLength={10} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" placeholder="Gate No. 3, Azadpur" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultCommissionRate">Default Commission (%)</Label>
            <Input id="defaultCommissionRate" name="defaultCommissionRate" type="number" step="0.01" defaultValue="2" />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Saving..." : "Shuru Karein"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

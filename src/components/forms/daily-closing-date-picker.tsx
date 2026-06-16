"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DailyClosingDatePicker({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      <Label htmlFor="reportDate">Date select karein</Label>
      <Input
        id="reportDate"
        type="date"
        defaultValue={defaultDate}
        onChange={(e) => router.push(`/reports/daily-closing?date=${e.target.value}`)}
      />
    </div>
  );
}

"use client";

import { joinAsMunim } from "@/actions/firm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

type Invite = {
  id: string;
  fullName: string;
  firm: { name: string; mandiName: string };
};

export function MunimJoinCard({ invite }: { invite: Invite }) {
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    const result = await joinAsMunim(invite.id);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="border-mandi-primary">
      <CardHeader>
        <CardTitle>Munim Invite</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          Aapko <strong>{invite.firm.name}</strong> ({invite.firm.mandiName}) mein Munim ke roop mein invite kiya gaya hai.
        </p>
        <Button onClick={handleJoin} className="w-full" size="lg" disabled={loading}>
          {loading ? "Joining..." : "Join Karein"}
        </Button>
      </CardContent>
    </Card>
  );
}

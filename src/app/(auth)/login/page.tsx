"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isPhoneAuthEnabled } from "@/lib/auth-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type AuthMethod = "email" | "phone";
type Step = "input" | "otp";

export default function LoginPage() {
  const [method, setMethod] = useState<AuthMethod>("email");
  const [step, setStep] = useState<Step>("input");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const fullPhone = `+91${phone.replace(/\D/g, "").slice(-10)}`;

  async function sendEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Valid email daalein");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("OTP email bhej diya gaya — inbox/spam check karein");
    setStep("otp");
  }

  async function verifyEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type: "email",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.location.href = "/dashboard";
  }

  async function sendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Valid 10-digit mobile number daalein");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("OTP bhej diya gaya");
    setStep("otp");
  }

  async function verifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.location.href = "/dashboard";
  }

  function switchMethod(next: AuthMethod) {
    setMethod(next);
    setStep("input");
    setOtp("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          {method === "email"
            ? "Email par OTP se login karein (Pilot)"
            : "Mobile number se OTP login karein"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => switchMethod("email")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              method === "email" ? "bg-card shadow-sm text-mandi-dark" : "text-muted-foreground"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => isPhoneAuthEnabled && switchMethod("phone")}
            disabled={!isPhoneAuthEnabled}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              method === "phone" ? "bg-card shadow-sm text-mandi-dark" : "text-muted-foreground"
            } ${!isPhoneAuthEnabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            Phone {isPhoneAuthEnabled ? "" : "(Twilio ke baad)"}
          </button>
        </div>

        {method === "email" && step === "input" && (
          <form onSubmit={sendEmailOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="aap@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Bhej rahe hain..." : "OTP Bhejein"}
            </Button>
          </form>
        )}

        {method === "email" && step === "otp" && (
          <form onSubmit={verifyEmailOtp} className="space-y-4">
            <p className="text-sm text-muted-foreground">OTP bheja gaya: {email}</p>
            <div className="space-y-2">
              <Label htmlFor="emailOtp">OTP</Label>
              <Input
                id="emailOtp"
                inputMode="numeric"
                placeholder="6-digit OTP"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Verify..." : "Login Karein"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("input")}>
              Email badlein
            </Button>
          </form>
        )}

        {method === "phone" && step === "input" && (
          <form onSubmit={sendPhoneOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <div className="flex gap-2">
                <span className="flex h-11 items-center rounded-lg border border-border bg-muted px-3 text-sm">
                  +91
                </span>
                <Input
                  id="phone"
                  inputMode="numeric"
                  placeholder="9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Bhej rahe hain..." : "OTP Bhejein"}
            </Button>
          </form>
        )}

        {method === "phone" && step === "otp" && (
          <form onSubmit={verifyPhoneOtp} className="space-y-4">
            <p className="text-sm text-muted-foreground">OTP bheja gaya: +91 {phone}</p>
            <div className="space-y-2">
              <Label htmlFor="phoneOtp">OTP</Label>
              <Input
                id="phoneOtp"
                inputMode="numeric"
                placeholder="6-digit OTP"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Verify..." : "Login Karein"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("input")}>
              Number badlein
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

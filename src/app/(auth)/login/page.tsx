"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isPhoneAuthEnabled } from "@/lib/auth-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type AuthMethod = "email" | "phone";
type Step = "input" | "otp";

const EMAIL_OTP_MIN = 6;
const EMAIL_OTP_MAX = 10;

function isValidEmailOtpLength(token: string) {
  return token.length >= EMAIL_OTP_MIN && token.length <= EMAIL_OTP_MAX;
}

function formatOtpError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("expired") || lower.includes("invalid")) {
    return "Code galat ya expire ho gaya — email ka poora code daalein ya naya OTP maangein";
  }
  return message;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<AuthMethod>("email");
  const [step, setStep] = useState<Step>("input");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const fullPhone = `+91${phone.replace(/\D/g, "").slice(-10)}`;

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      toast.error("Login link expire ho gaya ya invalid hai — dubara OTP maangein");
    }
  }, [searchParams]);

  async function requestEmailOtp(options?: { resend?: boolean }) {
    if (!email.includes("@")) {
      toast.error("Valid email daalein");
      return false;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    if (options?.resend) {
      setOtp("");
      toast.success("Naya code bhej diya — email check karein");
    } else {
      toast.success("Email bhej diya — poora code enter karein ya email link par click karein");
      setStep("otp");
    }
    return true;
  }

  async function sendEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    await requestEmailOtp();
  }

  async function resendEmailOtp() {
    await requestEmailOtp({ resend: true });
  }

  async function verifyEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmailOtpLength(otp)) {
      toast.error(`Email ka poora code daalein (${EMAIL_OTP_MIN}–${EMAIL_OTP_MAX} digits)`);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type: "email",
    });
    setLoading(false);
    if (error) {
      toast.error(formatOtpError(error.message));
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
            <p className="text-sm text-muted-foreground">
              Code bheja gaya: <strong>{email}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Email ka poora code enter karein (6–8 digits). Link par click bhi kar sakte hain.
            </p>
            <div className="space-y-2">
              <Label htmlFor="emailOtp">OTP</Label>
              <Input
                id="emailOtp"
                inputMode="numeric"
                placeholder="Email ka poora code"
                maxLength={EMAIL_OTP_MAX}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Verify..." : "Login Karein"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={loading}
              onClick={resendEmailOtp}
            >
              Dubara OTP bhejein
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isPhoneAuthEnabled } from "@/lib/auth-config";
import { useLanguage } from "@/components/i18n/language-provider";
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

function LoginForm() {
  const { t } = useLanguage();
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
      toast.error(t("login.authExpired"));
    }
  }, [searchParams, t]);

  async function requestEmailOtp(options?: { resend?: boolean }) {
    if (!email.includes("@")) {
      toast.error(t("login.validEmail"));
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
      toast.success(t("login.otpResent"));
    } else {
      toast.success(t("login.emailSent"));
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
      toast.error(t("login.fullOtpRequired"));
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
      const lower = error.message.toLowerCase();
      toast.error(
        lower.includes("expired") || lower.includes("invalid")
          ? t("login.otpInvalid")
          : error.message
      );
      return;
    }
    window.location.href = "/dashboard";
  }

  async function sendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error(t("login.validMobile"));
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
    toast.success(t("login.otpSent"));
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
        <CardTitle>{t("login.title")}</CardTitle>
        <CardDescription>
          {method === "email" ? t("login.emailDesc") : t("login.phoneDesc")}
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
            {t("common.email")}
          </button>
          <button
            type="button"
            onClick={() => isPhoneAuthEnabled && switchMethod("phone")}
            disabled={!isPhoneAuthEnabled}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              method === "phone" ? "bg-card shadow-sm text-mandi-dark" : "text-muted-foreground"
            } ${!isPhoneAuthEnabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {t("common.phone")} {isPhoneAuthEnabled ? "" : t("login.phoneLater")}
          </button>
        </div>

        {method === "email" && step === "input" && (
          <form onSubmit={sendEmailOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t("login.sending") : t("login.sendOtp")}
            </Button>
          </form>
        )}

        {method === "email" && step === "otp" && (
          <form onSubmit={verifyEmailOtp} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("login.codeSentTo")} <strong>{email}</strong>
            </p>
            <p className="text-xs text-muted-foreground">{t("login.emailOtpHint")}</p>
            <div className="space-y-2">
              <Label htmlFor="emailOtp">{t("common.otp")}</Label>
              <Input
                id="emailOtp"
                inputMode="numeric"
                placeholder={t("login.emailOtpPlaceholder")}
                maxLength={EMAIL_OTP_MAX}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t("common.verify") : t("login.loginBtn")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={loading}
              onClick={resendEmailOtp}
            >
              {t("login.resendOtp")}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("input")}>
              {t("login.changeEmail")}
            </Button>
          </form>
        )}

        {method === "phone" && step === "input" && (
          <form onSubmit={sendPhoneOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("login.mobileNumber")}</Label>
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
              {loading ? t("login.sending") : t("login.sendOtp")}
            </Button>
          </form>
        )}

        {method === "phone" && step === "otp" && (
          <form onSubmit={verifyPhoneOtp} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("login.phoneOtpSent")} {phone}
            </p>
            <div className="space-y-2">
              <Label htmlFor="phoneOtp">{t("common.otp")}</Label>
              <Input
                id="phoneOtp"
                inputMode="numeric"
                placeholder={t("login.phoneOtpPlaceholder")}
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t("common.verify") : t("login.loginBtn")}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("input")}>
              {t("login.changeNumber")}
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

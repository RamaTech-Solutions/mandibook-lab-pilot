"use client";

import { getCommoditiesWithStock, toggleCommodity } from "@/actions/commodities";
import { AppHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useLanguage } from "@/components/i18n/language-provider";
import { UNIT_LABELS, formatQuintal } from "@/lib/format";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Commodity = {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
  totalWeight: number;
};

function buildDetailHref(id: string, dateFrom: string, dateTo: string) {
  const params = new URLSearchParams();
  if (dateFrom) params.set("from", dateFrom);
  if (dateTo) params.set("to", dateTo);
  const qs = params.toString();
  return qs ? `/maal/${id}?${qs}` : `/maal/${id}`;
}

export function MaalPageClient({
  commodities: initialCommodities,
  initialDateFrom = "",
  initialDateTo = "",
}: {
  commodities: Commodity[];
  initialDateFrom?: string;
  initialDateTo?: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [commodities, setCommodities] = useState(initialCommodities);
  const [name, setName] = useState("");
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const hasDateFilter = Boolean(dateFrom || dateTo);

  const refreshStock = useCallback(async (from: string, to: string) => {
    setLoadingDates(true);
    try {
      const updated = await getCommoditiesWithStock(false, from || undefined, to || undefined);
      setCommodities(updated);
    } finally {
      setLoadingDates(false);
    }
  }, []);

  useEffect(() => {
    setCommodities(initialCommodities);
  }, [initialCommodities]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshStock(dateFrom, dateTo);
    }, 300);
    return () => clearTimeout(timer);
  }, [dateFrom, dateTo, refreshStock]);

  const filteredMaal = useMemo(() => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return commodities;
    return commodities.filter((c) => c.name.toLowerCase().includes(trimmed));
  }, [commodities, name]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectMaal(c: Commodity) {
    setName(c.name);
    setDropdownOpen(false);
  }

  function handleNameChange(value: string) {
    setName(value);
    setDropdownOpen(true);
  }

  async function handleToggle(id: string) {
    await toggleCommodity(id);
    router.refresh();
    await refreshStock(dateFrom, dateTo);
  }

  const weightLabel = hasDateFilter ? t("common.period") : t("common.total");

  return (
    <>
      <AppHeader title={t("maal.title")} />
      <main className="space-y-4 p-4">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="maal-filter">{t("maal.nameFilter")}</Label>
              <div ref={comboboxRef} className="relative">
                <div className="flex">
                  <Input
                    id="maal-filter"
                      placeholder={t("maal.namePlaceholder")}
                    className="rounded-r-none border-r-0"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => setDropdownOpen(true)}
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-none border-l-0 px-3"
                      aria-label={t("maal.openList")}
                    onClick={() => setDropdownOpen((open) => !open)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                {dropdownOpen && (
                  <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-card shadow-md">
                    {filteredMaal.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-muted-foreground">{t("maal.noMaal")}</li>
                    ) : (
                      filteredMaal.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
                            onClick={() => selectMaal(c)}
                          >
                            <span className="font-medium">
                              {c.name}
                              {!c.isActive && (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                    {t("common.inactive")}
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {formatQuintal(c.totalWeight)} {t("common.quintal")}
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("maal.nameFilterHint")}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">{t("maal.dateFrom")}</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">{t("maal.dateTo")}</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("maal.dateHint")}
              {loadingDates && ` · ${t("common.loading")}`}
            </p>
          </CardContent>
        </Card>

        {commodities.length === 0 ? (
          <EmptyState title={t("maal.emptyTitle")} description={t("maal.emptyDesc")} />
        ) : filteredMaal.length === 0 ? (
          <EmptyState title={t("maal.noMatchTitle")} description={t("maal.noMatchDesc")} />
        ) : (
          <ul className="space-y-2">
            {filteredMaal.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <Link
                    href={buildDetailHref(c.id, dateFrom, dateTo)}
                    className="font-medium text-mandi-primary hover:underline"
                  >
                    {c.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {UNIT_LABELS[c.unit] ?? c.unit} · {weightLabel}: {formatQuintal(c.totalWeight)} {t("common.quintal")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.isActive ? "default" : "outline"}>
                    {c.isActive ? t("common.active") : t("common.inactive")}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(c.id)}>
                    {t("common.toggle")}
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

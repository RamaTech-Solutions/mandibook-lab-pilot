import { formatINR, formatDate, UNIT_LABELS } from "./format";

export function buildWhatsAppUrl(phone: string | null | undefined, text: string): string {
  const encoded = encodeURIComponent(text);
  if (phone) {
    const digits = phone.replace(/\D/g, "").slice(-10);
    return `https://wa.me/91${digits}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

type FirmInfo = { name: string; mandiName?: string };

export function buildKisanStatement(params: {
  name: string;
  entries: Array<{
    entryDate: Date;
    description: string | null;
    direction: string;
    amount: string | number;
    runningBalance?: string | number;
  }>;
  balance: string | number;
  firm: FirmInfo;
}): string {
  const lines = [
    `Namaste ${params.name},`,
    ``,
    `Aapka mandi hisaab (${params.firm.name}):`,
    ``,
  ];

  for (const e of params.entries.slice(-10)) {
    const sign = e.direction === "CREDIT" ? "+" : "-";
    lines.push(`${formatDate(e.entryDate)} | ${e.description ?? "Entry"} | ${sign}${formatINR(e.amount)}`);
  }

  lines.push(``);
  lines.push(`Jama/Baki: ${formatINR(params.balance)}`);
  lines.push(`- ${params.firm.name}, ${params.firm.mandiName ?? ""}`);

  return lines.join("\n");
}

export function buildVyapariStatement(params: {
  name: string;
  entries: Array<{
    entryDate: Date;
    description: string | null;
    direction: string;
    amount: string | number;
  }>;
  balance: string | number;
  firm: FirmInfo;
}): string {
  const lines = [
    `Namaste ${params.name},`,
    ``,
    `Aapka vyapar hisaab (${params.firm.name}):`,
    ``,
  ];

  for (const e of params.entries.slice(-10)) {
    const sign = e.direction === "DEBIT" ? "+" : "-";
    lines.push(`${formatDate(e.entryDate)} | ${e.description ?? "Entry"} | ${sign}${formatINR(e.amount)}`);
  }

  lines.push(``);
  lines.push(`Jama/Baki: ${formatINR(params.balance)}`);
  lines.push(`- ${params.firm.name}`);

  return lines.join("\n");
}

export function buildTransactionReceipt(params: {
  farmerName: string;
  traderName: string;
  commodity: string;
  unit: string;
  weight: string | number;
  rate: string | number;
  grossAmount: string | number;
  commissionAmount: string | number;
  deductions: string | number;
  farmerPayable: string | number;
  traderReceivable: string | number;
  date: Date;
  firm: FirmInfo;
}): string {
  const katauti = new DecimalSafe(params.commissionAmount).plus(params.deductions).toString();

  return [
    `Mandi Sale Receipt`,
    `${params.firm.name} — ${params.firm.mandiName ?? ""}`,
    `Date: ${formatDate(params.date)}`,
    ``,
    `Kisan: ${params.farmerName}`,
    `Vyapari: ${params.traderName}`,
    `Maal: ${params.commodity}`,
    `Wajan: ${params.weight} ${UNIT_LABELS[params.unit] ?? params.unit}`,
    `Bhav: ${formatINR(params.rate)}`,
    `Kul Rakam: ${formatINR(params.grossAmount)}`,
    `Commission/Katauti: ${formatINR(katauti)}`,
    `Kisan Net: ${formatINR(params.farmerPayable)}`,
    `Vyapari Due: ${formatINR(params.traderReceivable)}`,
  ].join("\n");
}

export function buildDailyClosing(params: {
  date: Date;
  transactionCount: number;
  grossSale: string | number;
  commission: string | number;
  farmerPayable: string | number;
  traderReceivable: string | number;
  paymentsPaid: string | number;
  paymentsReceived: string | number;
  totalKisanBaki: string | number;
  totalVyapariBaki: string | number;
  firm: FirmInfo;
}): string {
  return [
    `Aaj ka Closing — ${formatDate(params.date)}`,
    `${params.firm.name}, ${params.firm.mandiName ?? ""}`,
    ``,
    `Transactions: ${params.transactionCount}`,
    `Gross Sale: ${formatINR(params.grossSale)}`,
    `Commission: ${formatINR(params.commission)}`,
    `Farmer Payable: ${formatINR(params.farmerPayable)}`,
    `Trader Receivable: ${formatINR(params.traderReceivable)}`,
    `Payments Paid: ${formatINR(params.paymentsPaid)}`,
    `Payments Received: ${formatINR(params.paymentsReceived)}`,
    ``,
    `Total Kisan Baki: ${formatINR(params.totalKisanBaki)}`,
    `Total Vyapari Baki: ${formatINR(params.totalVyapariBaki)}`,
  ].join("\n");
}

function DecimalSafe(n: string | number) {
  return {
    plus(other: string | number) {
      return {
        toString() {
          return (parseFloat(String(n)) + parseFloat(String(other))).toFixed(2);
        },
      };
    },
  };
}

const IST = "Asia/Kolkata";

export function formatINR(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: IST,
  }).format(d);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

export function normalizePhone10(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits.slice(-10);
}

export function todayIST(): Date {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: IST });
  const ist = new Date(istString);
  ist.setHours(0, 0, 0, 0);
  return ist;
}

export function startOfDayIST(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDayIST(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export const UNIT_LABELS: Record<string, string> = {
  KG: "Kg",
  QUINTAL: "Quintal",
  BAG: "Bag",
};

/** Stored in transaction notes to mark rate as ₹/kg (Kisan Entry) */
export const PER_KG_NOTE_TAG = "#per_kg";

export function isPerKgRateTransaction(notes: string | null | undefined): boolean {
  return notes?.includes(PER_KG_NOTE_TAG) ?? false;
}

export function appendPerKgTag(notes: string | undefined): string {
  const trimmed = notes?.trim();
  if (!trimmed) return PER_KG_NOTE_TAG;
  if (trimmed.includes(PER_KG_NOTE_TAG)) return trimmed;
  return `${trimmed} ${PER_KG_NOTE_TAG}`;
}

export function formatRateDisplay(rate: string | number, notes: string | null | undefined): string {
  const formatted = formatINR(rate);
  return isPerKgRateTransaction(notes) ? `${formatted}/kg` : formatted;
}

export function formatTransactionSummary(params: {
  commodity: string;
  weight: string | number;
  unit: string;
  rate: string | number;
  notes?: string | null;
}): string {
  const unitLabel = UNIT_LABELS[params.unit] ?? params.unit;
  if (isPerKgRateTransaction(params.notes)) {
    return `${params.commodity} — ${params.weight} ${unitLabel} @ ${formatRateDisplay(params.rate, params.notes)}`;
  }
  return `${params.commodity} — ${params.weight} ${unitLabel} @ ${formatINR(params.rate)}`;
}

/** Stored as #due:amount:YYYY-MM-DD when baaki payment is pending */
export const DUE_NOTE_PREFIX = "#due:";
export const DUE_PAID_PREFIX = "#due_paid:";

export type DueNoteInfo = { amount: number; dueDate: string };
export type DuePaidInfo = { amount: number; dueDate: string; paidDate: string };

export function appendDueTag(notes: string, amount: number, dueDate: string): string {
  const tag = `${DUE_NOTE_PREFIX}${amount}:${dueDate}`;
  const withoutDue = notes
    .split(/\s+/)
    .filter((part) => !part.startsWith(DUE_NOTE_PREFIX) && !part.startsWith(DUE_PAID_PREFIX))
    .join(" ")
    .trim();
  return withoutDue ? `${withoutDue} ${tag}` : tag;
}

export function parseDueFromNotes(notes: string | null | undefined): DueNoteInfo | null {
  if (!notes) return null;
  if (notes.includes(DUE_PAID_PREFIX)) return null;
  const match = notes.match(/#due:([\d.]+):(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  return { amount: parseFloat(match[1]), dueDate: match[2] };
}

export function parseDuePaidFromNotes(notes: string | null | undefined): DuePaidInfo | null {
  if (!notes) return null;
  const match = notes.match(/#due_paid:([\d.]+):(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  return {
    amount: parseFloat(match[1]),
    dueDate: match[2],
    paidDate: match[3],
  };
}

export function isDuePending(notes: string | null | undefined): boolean {
  return parseDueFromNotes(notes) !== null;
}

export function markDuePaid(
  notes: string,
  amount: number,
  dueDate: string,
  paidDate: string
): string {
  const paidTag = `${DUE_PAID_PREFIX}${amount}:${dueDate}:${paidDate}`;
  const withoutDue = notes
    .split(/\s+/)
    .filter((part) => !part.startsWith(DUE_NOTE_PREFIX) && !part.startsWith(DUE_PAID_PREFIX))
    .join(" ")
    .trim();
  return withoutDue ? `${withoutDue} ${paidTag}` : paidTag;
}

export function formatDueLine(notes: string | null | undefined): string | null {
  const paid = parseDuePaidFromNotes(notes);
  if (paid) {
    return `Baaki ${formatINR(paid.amount)} paid — ${formatDate(paid.paidDate)}`;
  }
  const due = parseDueFromNotes(notes);
  if (!due) return null;
  return `Baaki ${formatINR(due.amount)} — due ${formatDate(due.dueDate)}`;
}

export function formatDueStatusLine(notes: string | null | undefined): {
  text: string;
  variant: "pending" | "paid";
} | null {
  const paid = parseDuePaidFromNotes(notes);
  if (paid) {
    return { text: `Baaki paid — ${formatDate(paid.paidDate)}`, variant: "paid" };
  }
  const due = parseDueFromNotes(notes);
  if (!due) return null;
  return { text: `Baaki ${formatINR(due.amount)} — due ${formatDate(due.dueDate)}`, variant: "pending" };
}

export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

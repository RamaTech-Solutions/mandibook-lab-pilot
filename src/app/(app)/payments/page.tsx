import { getPayments, getAllPartiesForPayment } from "@/actions/payments";
import { getDuePayments } from "@/actions/due-payments";
import { PaymentsPageClient } from "@/components/forms/payments-page-client";

export default async function PaymentsPage() {
  const [parties, payments, duePayments] = await Promise.all([
    getAllPartiesForPayment(),
    getPayments(),
    getDuePayments(),
  ]);

  return (
    <PaymentsPageClient
      parties={parties}
      payments={payments}
      duePayments={duePayments}
    />
  );
}

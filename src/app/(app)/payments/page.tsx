import { getPayments, getAllPartiesForPayment } from "@/actions/payments";
import { PaymentsPageClient } from "@/components/forms/payments-page-client";

export default async function PaymentsPage() {
  const [parties, payments] = await Promise.all([
    getAllPartiesForPayment(),
    getPayments(),
  ]);

  return <PaymentsPageClient parties={parties} payments={payments} />;
}

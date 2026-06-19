import { getDuePayments, getTraderDuePayments } from "@/actions/due-payments";
import { getParties } from "@/actions/parties";
import { PaymentsPageClient } from "@/components/forms/payments-page-client";

export default async function PaymentsPage() {
  const [kisans, duePayments, traderDuePayments] = await Promise.all([
    getParties("KISAN"),
    getDuePayments(),
    getTraderDuePayments(),
  ]);

  return (
    <PaymentsPageClient
      kisans={kisans.map((k) => ({ id: k.id, name: k.name }))}
      duePayments={duePayments}
      traderDuePayments={traderDuePayments}
    />
  );
}

import { getTransactions } from "@/actions/transactions";
import { requireFirm } from "@/lib/auth";
import { TransactionsListView } from "@/components/transactions/transactions-list-view";

export default async function TransactionsPage() {
  const { firm } = await requireFirm();
  const transactions = await getTransactions();

  return (
    <TransactionsListView
      firm={{ name: firm.name, mandiName: firm.mandiName }}
      transactions={transactions}
    />
  );
}

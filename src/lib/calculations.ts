import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type TransactionCalcInput = {
  weight: number | string;
  rate: number | string;
  commissionRate: number | string;
  deductions?: number | string;
};

export type TransactionCalcResult = {
  grossAmount: Decimal;
  commissionAmount: Decimal;
  farmerPayable: Decimal;
  traderReceivable: Decimal;
};

export function calculateTransaction(input: TransactionCalcInput): TransactionCalcResult {
  const weight = new Decimal(input.weight);
  const rate = new Decimal(input.rate);
  const commissionRate = new Decimal(input.commissionRate);
  const deductions = new Decimal(input.deductions ?? 0);

  if (weight.lte(0)) throw new Error("Wajan must be greater than 0");
  if (rate.lte(0)) throw new Error("Bhav must be greater than 0");
  if (deductions.lt(0)) throw new Error("Katauti cannot be negative");
  if (commissionRate.lt(0)) throw new Error("Commission cannot be negative");

  const grossAmount = weight.mul(rate).toDecimalPlaces(2);
  const commissionAmount = grossAmount.mul(commissionRate).div(100).toDecimalPlaces(2);
  const farmerPayable = grossAmount.minus(commissionAmount).minus(deductions).toDecimalPlaces(2);
  const traderReceivable = grossAmount.toDecimalPlaces(2);

  if (farmerPayable.lt(0)) {
    throw new Error("Farmer payable cannot be negative — check commission and katauti");
  }

  return { grossAmount, commissionAmount, farmerPayable, traderReceivable };
}

export function toDecimal(value: number | string | Decimal): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

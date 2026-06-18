import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/** 1 Quintal = 100 Kg (mandi standard) */
export const QUINTAL_KG = 100;

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

/** Kisan Entry: wajan in Quintal, bhav per Kg */
export function calculateTransactionQuintalPerKg(
  input: Omit<TransactionCalcInput, "weight" | "rate"> & {
    weightQuintal: number | string;
    ratePerKg: number | string;
  }
): TransactionCalcResult {
  const weightQuintal = new Decimal(input.weightQuintal);
  const ratePerKg = new Decimal(input.ratePerKg);

  if (weightQuintal.lte(0)) throw new Error("Wajan must be greater than 0");
  if (ratePerKg.lte(0)) throw new Error("Bhav per kg must be greater than 0");

  const weightKg = weightQuintal.mul(QUINTAL_KG);

  return calculateTransaction({
    weight: weightKg.toString(),
    rate: ratePerKg.toString(),
    commissionRate: input.commissionRate,
    deductions: input.deductions,
  });
}

export function toDecimal(value: number | string | Decimal): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

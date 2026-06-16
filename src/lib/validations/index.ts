import { z } from "zod";

export const emailSchema = z.string().email("Valid email required");

export const phoneSchema = z
  .string()
  .min(10, "Phone number required")
  .regex(/^[6-9]\d{9}$/, "Valid 10-digit Indian mobile number required");

export const firmSchema = z.object({
  name: z.string().min(2, "Firm name required"),
  mandiName: z.string().min(2, "Mandi name required"),
  ownerName: z.string().min(2, "Owner name required"),
  phone: phoneSchema,
  address: z.string().optional(),
  defaultCommissionRate: z.coerce.number().min(0).max(100).default(2),
});

export const partySchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().optional().or(z.literal("")),
  village: z.string().optional(),
  address: z.string().optional(),
  openingBalance: z.coerce.number().min(0).default(0),
  balanceType: z.enum(["RECEIVABLE", "PAYABLE", "NONE"]).default("NONE"),
  notes: z.string().optional(),
});

export const commoditySchema = z.object({
  name: z.string().min(1, "Maal name required"),
  unit: z.enum(["KG", "QUINTAL", "BAG"]),
});

export const transactionSchema = z.object({
  farmerId: z.string().min(1, "Kisan select karein"),
  traderId: z.string().min(1, "Vyapari select karein"),
  commodityId: z.string().min(1, "Maal select karein"),
  transactionDate: z.string().min(1),
  weight: z.coerce.number().positive("Wajan > 0 hona chahiye"),
  rate: z.coerce.number().positive("Bhav > 0 hona chahiye"),
  commissionRate: z.coerce.number().min(0).max(100),
  deductions: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  partyId: z.string().min(1, "Party select karein"),
  paymentDate: z.string().min(1),
  amount: z.coerce.number().positive("Amount > 0 hona chahiye"),
  paymentMode: z.enum(["CASH", "UPI", "BANK"]),
  notes: z.string().optional(),
});

export const munimInviteSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  email: emailSchema,
});

export type FirmInput = z.infer<typeof firmSchema>;
export type PartyInput = z.infer<typeof partySchema>;
export type CommodityInput = z.infer<typeof commoditySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;

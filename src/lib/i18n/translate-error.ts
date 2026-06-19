import type { Messages } from "./types";

const ERROR_KEY_MAP: Record<string, string> = {
  "Kisan ka naam required": "errors.farmerNameRequired",
  "Vyapari ka naam required": "errors.traderNameRequired",
  "Valid 10-digit phone number required": "errors.phoneRequired",
  "Valid 10-digit Indian mobile number required": "errors.phoneRequired",
  "Phone number required": "errors.phoneRequired",
  "Fasal required": "errors.commodityRequired",
  "Wajan aur Bhav sahi daalein": "errors.weightRateRequired",
  "Date required": "errors.dateRequired",
  "Payment kisan net se zyada nahi ho sakta": "errors.paymentExceedsPayable",
  "Payment vyapari total se zyada nahi ho sakta": "errors.paymentExceedsReceivable",
  "Baaki payment ki date required hai": "errors.dueDateRequired",
  "Baaki payment ki date sale date se pehle nahi ho sakti": "errors.dueDateBeforeSale",
  "Maal already exists": "errors.commodityExists",
  "Invalid input": "errors.invalidInput",
  "Save failed": "errors.saveFailed",
  "Party select karein": "errors.partyRequired",
};

export function translateError(messages: Messages, error: string): string {
  const key = ERROR_KEY_MAP[error];
  if (key && messages[key]) return messages[key];
  return error;
}

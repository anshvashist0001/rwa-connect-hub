export interface FeeItem {
  label: string;
  amount: string; // empty string = user enters custom amount
  editable: boolean; // whether the amount is shown as a preset
}

export const DEFAULT_FEES: FeeItem[] = [

  { label: "Membership Fee", amount: "300", editable: true },
  { label: "New Registration", amount: "3800", editable: true },

];

const KEY = "rwa_fee_config";

export function getFees(): FeeItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as FeeItem[];
  } catch { }
  return DEFAULT_FEES;
}

export function saveFees(fees: FeeItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(fees));
}

export function resetFees(): void {
  localStorage.removeItem(KEY);
}

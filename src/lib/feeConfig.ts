export interface FeeItem {
  label: string;
  amount: string; // empty string = user enters custom amount
  editable: boolean; // whether the amount is shown as a preset
}

export const DEFAULT_FEES: FeeItem[] = [
  { label: "Maintenance Fee",    amount: "3000", editable: true },
  { label: "Membership Fee",     amount: "300",  editable: true },
  { label: "New Registration",   amount: "3800", editable: true },
  { label: "Parking Fee",        amount: "500",  editable: true },
  { label: "Water Charges",      amount: "200",  editable: true },
  { label: "Club House Fee",     amount: "1000", editable: true },
  { label: "Generator Charges",  amount: "400",  editable: true },
  { label: "Other",              amount: "",     editable: false },
];

const KEY = "rwa_fee_config";

export function getFees(): FeeItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as FeeItem[];
  } catch {}
  return DEFAULT_FEES;
}

export function saveFees(fees: FeeItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(fees));
}

export function resetFees(): void {
  localStorage.removeItem(KEY);
}

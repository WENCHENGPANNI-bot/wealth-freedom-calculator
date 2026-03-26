import type { FinancialParams } from '../types';

const STORAGE_KEY = 'wealth-freedom-calculator-params';

/** Required numeric fields for a valid FinancialParams object */
const REQUIRED_FIELDS: (keyof FinancialParams)[] = [
  'currentAsset',
  'monthlyIncome',
  'monthlyExpense',
  'annualReturnRate',
  'inflationRate',
  'currentAge',
];

/**
 * Save financial params to localStorage as JSON.
 * Silently fails if localStorage is unavailable.
 */
export function saveParams(params: FinancialParams): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch {
    // localStorage unavailable — silently degrade
  }
}

/**
 * Load financial params from localStorage.
 * Returns null if no data, data is corrupted, or localStorage is unavailable.
 */
export function loadParams(): FinancialParams | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;

    const parsed = JSON.parse(raw);

    // Validate shape: all required fields must be numbers
    if (typeof parsed !== 'object' || parsed === null) return null;
    for (const field of REQUIRED_FIELDS) {
      if (typeof parsed[field] !== 'number') return null;
    }

    return parsed as FinancialParams;
  } catch {
    // JSON parse error or localStorage unavailable
    return null;
  }
}

/**
 * Clear all saved calculator data from localStorage.
 * Silently fails if localStorage is unavailable.
 */
export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable — silently degrade
  }
}

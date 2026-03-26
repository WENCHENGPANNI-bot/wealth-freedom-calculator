import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveParams, loadParams, clearStorage } from './storageService';
import type { FinancialParams } from '../types';

const sampleParams: FinancialParams = {
  currentAsset: 500000,
  monthlyIncome: 30000,
  monthlyExpense: 15000,
  annualReturnRate: 0.07,
  inflationRate: 0.03,
  currentAge: 30,
};

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load params (round-trip)', () => {
    saveParams(sampleParams);
    const loaded = loadParams();
    expect(loaded).toEqual(sampleParams);
  });

  it('should return null when no data is saved', () => {
    expect(loadParams()).toBeNull();
  });

  it('should return null for corrupted JSON data', () => {
    localStorage.setItem('wealth-freedom-calculator-params', '{invalid json');
    expect(loadParams()).toBeNull();
  });

  it('should return null for data with missing fields', () => {
    localStorage.setItem(
      'wealth-freedom-calculator-params',
      JSON.stringify({ currentAsset: 100 }),
    );
    expect(loadParams()).toBeNull();
  });

  it('should return null for data with non-number fields', () => {
    localStorage.setItem(
      'wealth-freedom-calculator-params',
      JSON.stringify({ ...sampleParams, currentAsset: 'not a number' }),
    );
    expect(loadParams()).toBeNull();
  });

  it('should remove saved data on clearStorage', () => {
    saveParams(sampleParams);
    expect(loadParams()).toEqual(sampleParams);
    clearStorage();
    expect(loadParams()).toBeNull();
  });

  describe('localStorage unavailable', () => {
    it('saveParams should not throw when localStorage throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => saveParams(sampleParams)).not.toThrow();
      spy.mockRestore();
    });

    it('loadParams should return null when localStorage throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(loadParams()).toBeNull();
      spy.mockRestore();
    });

    it('clearStorage should not throw when localStorage throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(() => clearStorage()).not.toThrow();
      spy.mockRestore();
    });
  });
});

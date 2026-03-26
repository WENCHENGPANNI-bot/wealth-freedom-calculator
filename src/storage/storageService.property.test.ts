import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { saveParams, loadParams } from './storageService';
import type { FinancialParams } from '../types';

const validParamsArb = fc.record({
  currentAsset: fc.double({ min: 0, max: 100_000_000, noNaN: true, noDefaultInfinity: true }),
  monthlyIncome: fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
  monthlyExpense: fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
  annualReturnRate: fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
  inflationRate: fc.double({ min: 0, max: 0.2, noNaN: true, noDefaultInfinity: true }),
  currentAge: fc.integer({ min: 0, max: 120 }),
});

describe('storageService property tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Feature: wealth-freedom-calculator, Property 9: 参数持久化 round-trip
  // **Validates: Requirements 5.1, 5.2**
  it('should return deep-equal params after saveParams then loadParams for any valid FinancialParams', () => {
    fc.assert(
      fc.property(validParamsArb, (params: FinancialParams) => {
        localStorage.clear();
        saveParams(params);
        const loaded = loadParams();
        expect(loaded).toEqual(params);
      }),
      { numRuns: 100 },
    );
  });
});

describe('storageService corrupted data property tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const STORAGE_KEY = 'wealth-freedom-calculator-params';

  // 损坏数据生成器
  const corruptedDataArb = fc.oneof(
    fc.string(),                    // 随机字符串
    fc.constant(""),                // 空字符串
    fc.constant("{invalid json"),   // 无效 JSON
    fc.constant("null"),            // null 字符串
  );

  // Feature: wealth-freedom-calculator, Property 10: 损坏数据回退默认值
  // **Validates: Requirements 5.3**
  it('should return null and not throw for any corrupted data in localStorage', () => {
    fc.assert(
      fc.property(corruptedDataArb, (corrupted: string) => {
        localStorage.clear();
        localStorage.setItem(STORAGE_KEY, corrupted);
        let result: ReturnType<typeof loadParams>;
        expect(() => {
          result = loadParams();
        }).not.toThrow();
        expect(result!).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});

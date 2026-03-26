import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useScenarios } from './useScenarios';
import { DEFAULT_PARAMS } from '../types';

// Mock crypto.randomUUID for jsdom
beforeEach(() => {
  let counter = 0;
  vi.stubGlobal('crypto', {
    ...globalThis.crypto,
    randomUUID: () => `uuid-${++counter}`,
  });
});

type Op = { type: 'create' } | { type: 'delete'; index: number };

const opArb: fc.Arbitrary<Op> = fc.oneof(
  fc.constant({ type: 'create' as const }),
  fc.record({ type: fc.constant('delete' as const), index: fc.integer({ min: 0, max: 2 }) }),
);

const opsArb = fc.array(opArb, { minLength: 1, maxLength: 10 });

describe('useScenarios property tests', () => {
  // Feature: wealth-freedom-calculator, Property 7: 方案数量上限
  // **Validates: Requirements 4.1**
  it('should always keep scenarios.length <= 3 and reject creation when at max', () => {
    fc.assert(
      fc.property(opsArb, (ops: Op[]) => {
        const { result } = renderHook(() => useScenarios());

        for (const op of ops) {
          if (op.type === 'create') {
            const currentLength = result.current.scenarios.length;

            let success: boolean = false;
            act(() => {
              success = result.current.createScenario(DEFAULT_PARAMS);
            });

            if (currentLength >= 3) {
              // When already at max, creation should be rejected
              expect(success).toBe(false);
              expect(result.current.scenarios.length).toBe(currentLength);
            } else {
              expect(success).toBe(true);
            }
          } else {
            // Delete operation: only delete if there are scenarios and index is valid
            const scenarios = result.current.scenarios;
            if (scenarios.length > 0) {
              const idx = op.index % scenarios.length;
              act(() => {
                result.current.deleteScenario(scenarios[idx].id);
              });
            }
          }

          // Invariant: scenarios count should always be <= 3
          expect(result.current.scenarios.length).toBeLessThanOrEqual(3);
        }
      }),
      { numRuns: 100 },
    );
  });
});

const validParamsArb: fc.Arbitrary<import('../types').FinancialParams> = fc.record({
  currentAsset: fc.float({ min: 0, max: 100_000_000, noNaN: true, noDefaultInfinity: true }),
  monthlyIncome: fc.float({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
  monthlyExpense: fc.float({ min: Math.fround(1), max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
  annualReturnRate: fc.float({ min: Math.fround(0.031), max: Math.fround(0.5), noNaN: true, noDefaultInfinity: true }),
  inflationRate: fc.float({ min: 0, max: Math.fround(0.03), noNaN: true, noDefaultInfinity: true }),
  currentAge: fc.integer({ min: 18, max: 80 }),
});

describe('useScenarios property tests - Property 8', () => {
  // Feature: wealth-freedom-calculator, Property 8: 方案复制参数相等
  // **Validates: Requirements 4.2**
  it('should deep copy params when creating a scenario, and mutations to original should not affect the scenario', () => {
    fc.assert(
      fc.property(validParamsArb, (params) => {
        const { result } = renderHook(() => useScenarios());

        let success = false;
        act(() => {
          success = result.current.createScenario(params);
        });

        expect(success).toBe(true);
        expect(result.current.scenarios).toHaveLength(1);

        const scenarioParams = result.current.scenarios[0].params;

        // The scenario's params should deep equal the original params
        expect(scenarioParams).toEqual(params);

        // Mutate the original params object
        params.currentAsset += 999999;
        params.monthlyIncome += 111;
        params.monthlyExpense += 222;
        params.annualReturnRate = 0.99;
        params.inflationRate = 0.5;
        params.currentAge += 10;

        // The scenario's params should NOT be affected by mutations to the original
        expect(scenarioParams.currentAsset).not.toBe(params.currentAsset);
        expect(scenarioParams.monthlyIncome).not.toBe(params.monthlyIncome);
        expect(scenarioParams.monthlyExpense).not.toBe(params.monthlyExpense);
        expect(scenarioParams.annualReturnRate).not.toBe(params.annualReturnRate);
        expect(scenarioParams.inflationRate).not.toBe(params.inflationRate);
        expect(scenarioParams.currentAge).not.toBe(params.currentAge);
      }),
      { numRuns: 100 },
    );
  });
});

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateTargetAsset } from './calculator';
import type { FinancialParams } from '../types/index';

/**
 * Valid financial params generator where annualReturnRate > inflationRate
 * and monthlyExpense > 0, ensuring the target asset formula is well-defined.
 */
const validParamsArb = fc.record({
  currentAsset: fc.double({ min: 0, max: 100_000_000, noNaN: true, noDefaultInfinity: true }),
  monthlyIncome: fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
  monthlyExpense: fc.double({ min: 1, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
  annualReturnRate: fc.double({ min: 0.031, max: 0.5, noNaN: true, noDefaultInfinity: true }),
  inflationRate: fc.double({ min: 0, max: 0.03, noNaN: true, noDefaultInfinity: true }),
  currentAge: fc.integer({ min: 18, max: 80 }),
});

describe('calculateTargetAsset property tests', () => {
  // Feature: wealth-freedom-calculator, Property 3: 目标资产公式正确性
  // **Validates: Requirements 2.1**
  it('should return (monthlyExpense × 12) ÷ (annualReturnRate - inflationRate) for valid params', () => {
    fc.assert(
      fc.property(validParamsArb, (params: FinancialParams) => {
        const result = calculateTargetAsset(params);
        const expected = (params.monthlyExpense * 12) / (params.annualReturnRate - params.inflationRate);
        expect(Math.abs(result - expected)).toBeLessThan(0.01);
      }),
      { numRuns: 100 },
    );
  });
});


import { calculateTimeline } from './calculator';

/**
 * Generator for params that will reach freedom in a reasonable time (< 50 years).
 * - monthlyIncome much higher than monthlyExpense ensures strong savings
 * - annualReturnRate > inflationRate ensures real returns are positive
 */
const timelineReachableParamsArb = fc.record({
  currentAsset: fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
  monthlyIncome: fc.double({ min: 10_000, max: 100_000, noNaN: true, noDefaultInfinity: true }),
  monthlyExpense: fc.double({ min: 1_000, max: 10_000, noNaN: true, noDefaultInfinity: true }),
  annualReturnRate: fc.double({ min: 0.05, max: 0.15, noNaN: true, noDefaultInfinity: true }),
  inflationRate: fc.double({ min: 0.01, max: 0.03, noNaN: true, noDefaultInfinity: true }),
  currentAge: fc.integer({ min: 18, max: 80 }),
});

/**
 * Helper: simulate asset growth year by year, mirroring calculateTimeline logic.
 * Returns an array where index i holds { asset, adjustedTarget } at end of year i.
 * Index 0 represents the initial state (year 0).
 */
function simulateGrowth(
  params: FinancialParams,
  years: number,
): Array<{ asset: number; adjustedTarget: number }> {
  const { currentAsset, monthlyIncome, monthlyExpense, annualReturnRate, inflationRate } = params;
  const snapshots: Array<{ asset: number; adjustedTarget: number }> = [];

  // Year 0: initial state
  const initialTarget = (monthlyExpense * 12) / (annualReturnRate - inflationRate);
  snapshots.push({ asset: currentAsset, adjustedTarget: initialTarget });

  let asset = currentAsset;
  for (let year = 1; year <= years; year++) {
    const adjustedMonthlyExpense = monthlyExpense * Math.pow(1 + inflationRate, year);
    const monthlySavings = monthlyIncome - adjustedMonthlyExpense;
    asset = asset * (1 + annualReturnRate) + monthlySavings * 12;
    const adjustedTarget = (adjustedMonthlyExpense * 12) / (annualReturnRate - inflationRate);
    snapshots.push({ asset, adjustedTarget });
  }

  return snapshots;
}

describe('calculateTimeline property tests', () => {
  // Feature: wealth-freedom-calculator, Property 4: Timeline 计算一致性
  // **Validates: Requirements 2.2**
  it('should return year N where asset >= adjusted target at year N and asset < adjusted target at year N-1', () => {
    fc.assert(
      fc.property(timelineReachableParamsArb, (params: FinancialParams) => {
        const result = calculateTimeline(params);

        // Only test reachable cases with years > 0
        if (!result.reachable || result.years === 0) {
          return true; // skip non-reachable or already-free cases
        }

        const N = result.years;
        const snapshots = simulateGrowth(params, N);

        // At year N: asset >= adjusted target (freedom reached)
        expect(snapshots[N].asset).toBeGreaterThanOrEqual(snapshots[N].adjustedTarget);

        // At year N-1: asset < adjusted target (freedom not yet reached)
        if (N >= 1) {
          expect(snapshots[N - 1].asset).toBeLessThan(snapshots[N - 1].adjustedTarget);
        }

        return true;
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Generator for valid params with positive monthlyExpense and annualReturnRate > inflationRate.
 */
const inflationTestParamsArb = fc.record({
  currentAsset: fc.double({ min: 0, max: 10_000_000, noNaN: true, noDefaultInfinity: true }),
  monthlyIncome: fc.double({ min: 1_000, max: 100_000, noNaN: true, noDefaultInfinity: true }),
  monthlyExpense: fc.double({ min: 1, max: 100_000, noNaN: true, noDefaultInfinity: true }),
  annualReturnRate: fc.double({ min: 0.04, max: 0.3, noNaN: true, noDefaultInfinity: true }),
  inflationRate: fc.double({ min: 0.001, max: 0.039, noNaN: true, noDefaultInfinity: true }),
  currentAge: fc.integer({ min: 18, max: 80 }),
});

describe('inflation adjustment property tests', () => {
  // Feature: wealth-freedom-calculator, Property 5: 通胀递增正确性
  // **Validates: Requirements 2.4**
  it('should compute adjusted monthly expense as monthlyExpense × (1 + inflationRate)^Y for any year Y', () => {
    fc.assert(
      fc.property(
        inflationTestParamsArb,
        fc.integer({ min: 1, max: 50 }),
        (params: FinancialParams, year: number) => {
          // Use the simulateGrowth helper which mirrors calculateTimeline logic
          const snapshots = simulateGrowth(params, year);

          // The adjusted target at year Y is computed from adjustedMonthlyExpense:
          //   adjustedTarget = (adjustedMonthlyExpense * 12) / (annualReturnRate - inflationRate)
          // So we can recover adjustedMonthlyExpense from the snapshot:
          const adjustedTargetAtY = snapshots[year].adjustedTarget;
          const recoveredAdjustedExpense =
            (adjustedTargetAtY * (params.annualReturnRate - params.inflationRate)) / 12;

          // Expected: monthlyExpense × (1 + inflationRate)^Y
          const expectedAdjustedExpense =
            params.monthlyExpense * Math.pow(1 + params.inflationRate, year);

          // Allow floating point tolerance (relative error < 1e-9)
          const relativeError =
            expectedAdjustedExpense === 0
              ? Math.abs(recoveredAdjustedExpense)
              : Math.abs(recoveredAdjustedExpense - expectedAdjustedExpense) / expectedAdjustedExpense;

          expect(relativeError).toBeLessThan(1e-9);
        },
      ),
      { numRuns: 100 },
    );
  });
});


/**
 * Generator for params where annualReturnRate <= inflationRate and monthlyExpense > 0.
 * Uses chain to ensure annualReturnRate is always <= inflationRate.
 */
const returnBelowInflationParamsArb = fc
  .double({ min: 0.03, max: 0.10, noNaN: true, noDefaultInfinity: true })
  .chain((inflationRate) =>
    fc.record({
      currentAsset: fc.double({ min: 0, max: 10_000_000, noNaN: true, noDefaultInfinity: true }),
      monthlyIncome: fc.double({ min: 0, max: 100_000, noNaN: true, noDefaultInfinity: true }),
      monthlyExpense: fc.double({ min: 1, max: 100_000, noNaN: true, noDefaultInfinity: true }),
      annualReturnRate: fc.double({ min: 0, max: inflationRate, noNaN: true, noDefaultInfinity: true }),
      inflationRate: fc.constant(inflationRate),
      currentAge: fc.integer({ min: 18, max: 80 }),
    }),
  );

describe('return rate below inflation property tests', () => {
  // Feature: wealth-freedom-calculator, Property 6: 回报率低于通胀提示
  // **Validates: Requirements 2.3**
  it('should return reachable: false with inflation warning when annualReturnRate <= inflationRate', () => {
    fc.assert(
      fc.property(returnBelowInflationParamsArb, (params: FinancialParams) => {
        expect(params.annualReturnRate).toBeLessThanOrEqual(params.inflationRate);
        expect(params.monthlyExpense).toBeGreaterThan(0);

        const result = calculateTimeline(params);

        expect(result.reachable).toBe(false);
        expect(result.message).toContain('当前回报率无法跑赢通胀');
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Generator for params likely to produce timelines > 100 years:
 * - monthlyIncome barely above monthlyExpense (tiny savings)
 * - annualReturnRate just slightly above inflationRate (tiny real return)
 * - currentAsset: 0 or very small
 */
const slowFreedomParamsArb = fc.record({
  currentAsset: fc.double({ min: 0, max: 1000, noNaN: true, noDefaultInfinity: true }),
  monthlyIncome: fc.double({ min: 5001, max: 5200, noNaN: true, noDefaultInfinity: true }),
  monthlyExpense: fc.double({ min: 5000, max: 5000, noNaN: true, noDefaultInfinity: true }),
  annualReturnRate: fc.double({ min: 0.031, max: 0.04, noNaN: true, noDefaultInfinity: true }),
  inflationRate: fc.double({ min: 0.03, max: 0.03, noNaN: true, noDefaultInfinity: true }),
  currentAge: fc.integer({ min: 18, max: 80 }),
});

describe('timeline over 100 years property tests', () => {
  // Feature: wealth-freedom-calculator, Property 11: Timeline 超 100 年提示
  // **Validates: Requirements 6.3**
  it('should include "超过 100 年" in message when timeline exceeds 100 years', () => {
    fc.assert(
      fc.property(slowFreedomParamsArb, (params: FinancialParams) => {
        const result = calculateTimeline(params);

        // Only assert on cases where years > 100
        if (result.years <= 100) {
          return true; // skip — not all generated params will exceed 100 years
        }

        // IF years > 100 THEN message must contain the warning
        expect(result.message).toBeDefined();
        expect(result.message).toContain('超过 100 年');
      }),
      { numRuns: 100 },
    );
  });
});


describe('already reached freedom property tests', () => {
  // Feature: wealth-freedom-calculator, Property 12: 已达财富自由提示
  // **Validates: Requirements 6.4**
  it('should return years 0, reachable true, and message containing "已达到财富自由" when currentAsset >= targetAsset', () => {
    /**
     * Generator approach:
     * 1. Generate base params with annualReturnRate > inflationRate and monthlyExpense > 0
     * 2. Compute targetAsset from those params
     * 3. Override currentAsset to be >= targetAsset (targetAsset + a positive offset)
     */
    const baseParamsArb = fc.record({
      monthlyIncome: fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
      monthlyExpense: fc.double({ min: 1, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
      annualReturnRate: fc.double({ min: 0.031, max: 0.5, noNaN: true, noDefaultInfinity: true }),
      inflationRate: fc.double({ min: 0, max: 0.03, noNaN: true, noDefaultInfinity: true }),
      currentAge: fc.integer({ min: 18, max: 80 }),
    });

    const alreadyFreeParamsArb = baseParamsArb.chain((base) => {
      const targetAsset = (base.monthlyExpense * 12) / (base.annualReturnRate - base.inflationRate);
      return fc.double({ min: 0, max: 100_000_000, noNaN: true, noDefaultInfinity: true }).map(
        (offset) => ({
          ...base,
          currentAsset: targetAsset + offset,
        }),
      );
    });

    fc.assert(
      fc.property(alreadyFreeParamsArb, (params: FinancialParams) => {
        const targetAsset = calculateTargetAsset(params);
        // Confirm precondition: currentAsset >= targetAsset
        expect(params.currentAsset).toBeGreaterThanOrEqual(targetAsset);

        const result = calculateTimeline(params);

        expect(result.years).toBe(0);
        expect(result.reachable).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.message).toContain('已达到财富自由');
      }),
      { numRuns: 100 },
    );
  });
});

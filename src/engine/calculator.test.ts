import { describe, it, expect } from 'vitest';
import { calculateTargetAsset, calculateTimeline, generateProjection } from './calculator';
import type { FinancialParams } from '../types';

function makeParams(overrides: Partial<FinancialParams> = {}): FinancialParams {
  return {
    currentAsset: 100000,
    monthlyIncome: 20000,
    monthlyExpense: 10000,
    annualReturnRate: 0.07,
    inflationRate: 0.03,
    currentAge: 30,
    ...overrides,
  };
}

describe('calculateTargetAsset', () => {
  it('should calculate target asset correctly with known values', () => {
    // monthlyExpense=10000, annualReturnRate=0.07, inflationRate=0.03
    // expected = (10000 * 12) / (0.07 - 0.03) = 120000 / 0.04 = 3,000,000
    const params = makeParams();
    const result = calculateTargetAsset(params);
    expect(result).toBeCloseTo(3_000_000, 2);
  });

  it('should calculate correctly with different parameters', () => {
    // monthlyExpense=5000, annualReturnRate=0.10, inflationRate=0.02
    // expected = (5000 * 12) / (0.10 - 0.02) = 60000 / 0.08 = 750,000
    const params = makeParams({
      monthlyExpense: 5000,
      annualReturnRate: 0.10,
      inflationRate: 0.02,
    });
    const result = calculateTargetAsset(params);
    expect(result).toBeCloseTo(750_000, 2);
  });

  it('should return Infinity when annualReturnRate equals inflationRate', () => {
    const params = makeParams({
      annualReturnRate: 0.03,
      inflationRate: 0.03,
    });
    const result = calculateTargetAsset(params);
    expect(result).toBe(Infinity);
  });

  it('should return Infinity when annualReturnRate is less than inflationRate', () => {
    const params = makeParams({
      annualReturnRate: 0.02,
      inflationRate: 0.05,
    });
    const result = calculateTargetAsset(params);
    expect(result).toBe(Infinity);
  });

  it('should return 0 when monthlyExpense is 0', () => {
    const params = makeParams({ monthlyExpense: 0 });
    const result = calculateTargetAsset(params);
    expect(result).toBe(0);
  });

  it('should return 0 when monthlyExpense is 0 even if return rate <= inflation', () => {
    const params = makeParams({
      monthlyExpense: 0,
      annualReturnRate: 0.02,
      inflationRate: 0.05,
    });
    const result = calculateTargetAsset(params);
    expect(result).toBe(0);
  });
});

describe('calculateTimeline', () => {
  it('should calculate a basic timeline correctly', () => {
    const params = makeParams({
      currentAsset: 500_000,
      monthlyIncome: 30_000,
      monthlyExpense: 10_000,
      annualReturnRate: 0.08,
      inflationRate: 0.03,
    });
    const result = calculateTimeline(params);
    expect(result.reachable).toBe(true);
    expect(result.years).toBeGreaterThan(0);
    expect(result.years).toBeLessThan(100);
  });

  it('should return reachable: false when return rate <= inflation rate', () => {
    const params = makeParams({
      annualReturnRate: 0.03,
      inflationRate: 0.03,
    });
    const result = calculateTimeline(params);
    expect(result.reachable).toBe(false);
    expect(result.years).toBe(0);
    expect(result.message).toBe('当前回报率无法跑赢通胀，建议调整投资策略');
  });

  it('should return reachable: false when return rate < inflation rate', () => {
    const params = makeParams({
      annualReturnRate: 0.02,
      inflationRate: 0.05,
    });
    const result = calculateTimeline(params);
    expect(result.reachable).toBe(false);
    expect(result.message).toBe('当前回报率无法跑赢通胀，建议调整投资策略');
  });

  it('should return years: 0 with congratulation when current asset already exceeds target', () => {
    // target = (10000 * 12) / (0.07 - 0.03) = 3,000,000
    const params = makeParams({
      currentAsset: 5_000_000,
      monthlyExpense: 10_000,
      annualReturnRate: 0.07,
      inflationRate: 0.03,
    });
    const result = calculateTimeline(params);
    expect(result.reachable).toBe(true);
    expect(result.years).toBe(0);
    expect(result.message).toBe('恭喜，按当前参数您已达到财富自由');
  });

  it('should include message when timeline exceeds 100 years', () => {
    // Very small savings relative to target, low real return → very slow accumulation
    const params = makeParams({
      currentAsset: 0,
      monthlyIncome: 5_100,
      monthlyExpense: 5_000,
      annualReturnRate: 0.04,
      inflationRate: 0.03,
    });
    const result = calculateTimeline(params);
    expect(result.years).toBeGreaterThan(100);
    expect(result.message).toBe('按当前参数，达成财富自由需要超过 100 年，建议调整策略');
  });

  it('should return years: 0 with congratulation when monthlyExpense is 0', () => {
    const params = makeParams({
      monthlyExpense: 0,
    });
    const result = calculateTimeline(params);
    expect(result.reachable).toBe(true);
    expect(result.years).toBe(0);
    expect(result.message).toBe('恭喜，按当前参数您已达到财富自由');
  });

  it('should handle case where monthlyExpense is 0 even with zero assets', () => {
    const params = makeParams({
      currentAsset: 0,
      monthlyExpense: 0,
    });
    const result = calculateTimeline(params);
    expect(result.reachable).toBe(true);
    expect(result.years).toBe(0);
  });
});

describe('generateProjection', () => {
  it('should return an array of length years + 1', () => {
    const params = makeParams();
    const result = generateProjection(params, 10);
    expect(result).toHaveLength(11);
  });

  it('year 0 should have initial values', () => {
    const params = makeParams({
      currentAsset: 500_000,
      monthlyExpense: 10_000,
      annualReturnRate: 0.07,
      inflationRate: 0.03,
      currentAge: 30,
    });
    const result = generateProjection(params, 5);
    const year0 = result[0];

    expect(year0.year).toBe(0);
    expect(year0.age).toBe(30);
    expect(year0.totalAsset).toBe(500_000);
    expect(year0.monthlyExpense).toBe(10_000); // no inflation at year 0
    expect(year0.passiveIncome).toBeCloseTo(500_000 * 0.07 / 12, 2);
  });

  it('should apply inflation to monthly expense each year', () => {
    const params = makeParams({
      monthlyExpense: 10_000,
      inflationRate: 0.03,
    });
    const result = generateProjection(params, 3);

    expect(result[0].monthlyExpense).toBeCloseTo(10_000, 2);
    expect(result[1].monthlyExpense).toBeCloseTo(10_000 * 1.03, 2);
    expect(result[2].monthlyExpense).toBeCloseTo(10_000 * 1.03 ** 2, 2);
    expect(result[3].monthlyExpense).toBeCloseTo(10_000 * 1.03 ** 3, 2);
  });

  it('should calculate totalAsset correctly for year > 0', () => {
    const params = makeParams({
      currentAsset: 100_000,
      monthlyIncome: 20_000,
      monthlyExpense: 10_000,
      annualReturnRate: 0.07,
      inflationRate: 0.03,
    });
    const result = generateProjection(params, 1);

    // Year 0: totalAsset = 100_000
    // Year 1: adjustedExpense = 10_000 * 1.03 = 10_300
    //          totalAsset = 100_000 * 1.07 + (20_000 - 10_300) * 12
    //                     = 107_000 + 116_400 = 223_400
    const expectedYear1Asset = 100_000 * 1.07 + (20_000 - 10_300) * 12;
    expect(result[1].totalAsset).toBeCloseTo(expectedYear1Asset, 2);
  });

  it('should mark isFreedomReached true when passive income covers expenses', () => {
    // Large asset so passive income easily covers expenses
    const params = makeParams({
      currentAsset: 10_000_000,
      monthlyExpense: 10_000,
      annualReturnRate: 0.07,
      inflationRate: 0.03,
      currentAge: 30,
    });
    const result = generateProjection(params, 5);

    // passiveIncome at year 0 = 10_000_000 * 0.07 / 12 ≈ 58_333
    // monthlyExpense at year 0 = 10_000
    // 58_333 >= 10_000 → true
    expect(result[0].isFreedomReached).toBe(true);
  });

  it('should mark isFreedomReached false when passive income is insufficient', () => {
    const params = makeParams({
      currentAsset: 10_000,
      monthlyExpense: 10_000,
      annualReturnRate: 0.07,
      inflationRate: 0.03,
      currentAge: 25,
    });
    const result = generateProjection(params, 1);

    // passiveIncome at year 0 = 10_000 * 0.07 / 12 ≈ 58.33
    // monthlyExpense at year 0 = 10_000
    // 58.33 < 10_000 → false
    expect(result[0].isFreedomReached).toBe(false);
  });

  it('should track age correctly across years', () => {
    const params = makeParams({ currentAge: 25 });
    const result = generateProjection(params, 5);

    expect(result[0].age).toBe(25);
    expect(result[3].age).toBe(28);
    expect(result[5].age).toBe(30);
  });

  it('should handle 0 years (single entry)', () => {
    const params = makeParams({ currentAsset: 200_000 });
    const result = generateProjection(params, 0);
    expect(result).toHaveLength(1);
    expect(result[0].year).toBe(0);
    expect(result[0].totalAsset).toBe(200_000);
  });
});

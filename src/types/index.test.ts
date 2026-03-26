import { describe, it, expect } from 'vitest';
import { DEFAULT_PARAMS } from './index';
import type { FinancialParams, CalculationResult, Projection, TimelineResult, ValidationResult, Scenario } from './index';

describe('Data Models', () => {
  it('DEFAULT_PARAMS should have correct default values', () => {
    expect(DEFAULT_PARAMS.currentAsset).toBe(0);
    expect(DEFAULT_PARAMS.monthlyIncome).toBe(0);
    expect(DEFAULT_PARAMS.monthlyExpense).toBe(0);
    expect(DEFAULT_PARAMS.annualReturnRate).toBe(0.07);
    expect(DEFAULT_PARAMS.inflationRate).toBe(0.03);
    expect(DEFAULT_PARAMS.currentAge).toBe(30);
  });

  it('FinancialParams interface should be usable', () => {
    const params: FinancialParams = {
      currentAsset: 100000,
      monthlyIncome: 20000,
      monthlyExpense: 10000,
      annualReturnRate: 0.07,
      inflationRate: 0.03,
      currentAge: 30,
    };
    expect(params.currentAsset).toBe(100000);
  });

  it('CalculationResult interface should be usable', () => {
    const result: CalculationResult = {
      targetAsset: 3000000,
      yearsToFreedom: 15,
      monthlySavingsNeeded: 10000,
      passiveIncome: 10000,
      freedomAge: 45,
    };
    expect(result.targetAsset).toBe(3000000);
  });

  it('Projection interface should be usable', () => {
    const proj: Projection = {
      year: 1,
      age: 31,
      totalAsset: 120000,
      passiveIncome: 700,
      monthlyExpense: 10300,
      isFreedomReached: false,
    };
    expect(proj.isFreedomReached).toBe(false);
  });

  it('TimelineResult interface should be usable', () => {
    const timeline: TimelineResult = {
      years: 15,
      reachable: true,
      message: '可达成',
    };
    expect(timeline.reachable).toBe(true);
  });

  it('ValidationResult interface should be usable', () => {
    const validation: ValidationResult = {
      isValid: true,
      errors: {},
      warnings: {},
    };
    expect(validation.isValid).toBe(true);
  });

  it('Scenario interface should be usable', () => {
    const scenario: Scenario = {
      id: '1',
      name: '基础方案',
      params: DEFAULT_PARAMS,
    };
    expect(scenario.name).toBe('基础方案');
  });
});

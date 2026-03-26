import { describe, it, expect } from 'vitest';
import { validateParams } from './validator';
import { DEFAULT_PARAMS } from '../types/index';
import type { FinancialParams } from '../types/index';

const validParams: FinancialParams = {
  currentAsset: 100000,
  monthlyIncome: 20000,
  monthlyExpense: 10000,
  annualReturnRate: 0.07,
  inflationRate: 0.03,
  currentAge: 30,
};

describe('validateParams', () => {
  it('should return isValid true for valid params', () => {
    const result = validateParams(validParams);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('should return error for undefined required fields', () => {
    const result = validateParams({});
    expect(result.isValid).toBe(false);
    expect(result.errors.currentAsset).toBe('此字段为必填项');
    expect(result.errors.monthlyIncome).toBe('此字段为必填项');
    expect(result.errors.monthlyExpense).toBe('此字段为必填项');
    expect(result.errors.annualReturnRate).toBe('此字段为必填项');
    expect(result.errors.inflationRate).toBe('此字段为必填项');
    expect(result.errors.currentAge).toBe('此字段为必填项');
  });

  it('should return error for null fields', () => {
    const result = validateParams({
      currentAsset: null as unknown as number,
      monthlyIncome: 20000,
      monthlyExpense: 10000,
      annualReturnRate: 0.07,
      inflationRate: 0.03,
      currentAge: 30,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.currentAsset).toBe('此字段为必填项');
  });

  it('should return error for NaN values', () => {
    const result = validateParams({
      ...validParams,
      currentAsset: NaN,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.currentAsset).toBe('请输入有效数字');
  });

  it('should return error for non-number types', () => {
    const result = validateParams({
      ...validParams,
      monthlyIncome: 'abc' as unknown as number,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.monthlyIncome).toBe('请输入有效数字');
  });

  it('should warn when monthlyExpense > monthlyIncome', () => {
    const result = validateParams({
      ...validParams,
      monthlyExpense: 25000,
      monthlyIncome: 20000,
    });
    expect(result.isValid).toBe(true);
    expect(result.warnings.monthlyExpense).toBe('您的月度开支超过月度收入，储蓄率为负');
  });

  it('should warn when annualReturnRate > 0.5', () => {
    const result = validateParams({
      ...validParams,
      annualReturnRate: 0.6,
    });
    expect(result.isValid).toBe(true);
    expect(result.warnings.annualReturnRate).toBe('回报率设置偏高，请确认是否合理');
  });

  it('should warn when monthlyExpense is 0', () => {
    const result = validateParams({
      ...validParams,
      monthlyExpense: 0,
    });
    expect(result.isValid).toBe(true);
    expect(result.warnings.monthlyExpense).toBe('月度开支为 0 意味着您已实现财富自由');
  });

  it('should not produce warnings when there are errors', () => {
    const result = validateParams({
      monthlyExpense: 25000,
      monthlyIncome: 20000,
      // missing other required fields
    });
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.warnings)).toHaveLength(0);
  });

  it('should handle DEFAULT_PARAMS as valid', () => {
    const result = validateParams(DEFAULT_PARAMS);
    expect(result.isValid).toBe(true);
    // monthlyExpense is 0 in defaults → warning
    expect(result.warnings.monthlyExpense).toBe('月度开支为 0 意味着您已实现财富自由');
  });
});

import type { FinancialParams, ValidationResult } from '../types/index';

const REQUIRED_FIELDS: (keyof FinancialParams)[] = [
  'currentAsset',
  'monthlyIncome',
  'monthlyExpense',
  'annualReturnRate',
  'inflationRate',
  'currentAge',
];

/**
 * 验证用户输入的财务参数
 * - 必填字段为空 → 错误
 * - 非数字类型 → 错误
 * - monthlyExpense > monthlyIncome → 警告
 * - annualReturnRate > 0.5 → 警告
 * - monthlyExpense === 0 → 警告
 */
export function validateParams(params: Partial<FinancialParams>): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Check required fields: undefined/null → error
  for (const field of REQUIRED_FIELDS) {
    const value = params[field];
    if (value === undefined || value === null) {
      errors[field] = '此字段为必填项';
    } else if (typeof value !== 'number' || Number.isNaN(value)) {
      errors[field] = '请输入有效数字';
    }
  }

  // Warnings only apply when the relevant fields are valid numbers
  const hasNoErrors = Object.keys(errors).length === 0;

  if (hasNoErrors) {
    const { monthlyExpense, monthlyIncome, annualReturnRate } = params as FinancialParams;

    if (monthlyExpense > monthlyIncome) {
      warnings.monthlyExpense = '您的月度开支超过月度收入，储蓄率为负';
    }

    if (annualReturnRate > 0.5) {
      warnings.annualReturnRate = '回报率设置偏高，请确认是否合理';
    }

    if (monthlyExpense === 0) {
      warnings.monthlyExpense = '月度开支为 0 意味着您已实现财富自由';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

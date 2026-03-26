import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateParams } from './validator';
import type { FinancialParams } from '../types/index';

const REQUIRED_FIELDS: (keyof FinancialParams)[] = [
  'currentAsset',
  'monthlyIncome',
  'monthlyExpense',
  'annualReturnRate',
  'inflationRate',
  'currentAge',
];

/**
 * Arbitrary that produces a valid number for a financial param field.
 */
const validNumberArb = fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true });

/**
 * Arbitrary that produces an invalid value: undefined, null, NaN, or a non-number type.
 */
const invalidValueArb: fc.Arbitrary<unknown> = fc.oneof(
  fc.constant(undefined),
  fc.constant(null),
  fc.constant(NaN),
  fc.string({ minLength: 1 }),          // non-empty string (non-number)
  fc.boolean(),                          // boolean (non-number)
  fc.constant({}),                       // object (non-number)
);

describe('validateParams property tests', () => {
  // Feature: wealth-freedom-calculator, Property 1: 输入验证正确性
  // **Validates: Requirements 1.2, 1.3**
  it('should return errors for exactly the invalid fields and no errors for valid fields', () => {
    /**
     * Strategy:
     * 1. For each of the 6 required fields, randomly decide if it's valid or invalid.
     * 2. Build a params object accordingly.
     * 3. Call validateParams and assert:
     *    - Every field marked invalid has an error entry.
     *    - Every field marked valid does NOT have an error entry.
     */
    const fieldValidityArb = fc.tuple(
      ...REQUIRED_FIELDS.map(() => fc.boolean()) // true = valid, false = invalid
    ) as fc.Arbitrary<[boolean, boolean, boolean, boolean, boolean, boolean]>;

    const paramsWithValidityArb = fc.tuple(
      fieldValidityArb,
      // Generate valid values for each field
      fc.tuple(
        validNumberArb, validNumberArb, validNumberArb,
        validNumberArb, validNumberArb, validNumberArb,
      ),
      // Generate invalid values for each field
      fc.tuple(
        invalidValueArb, invalidValueArb, invalidValueArb,
        invalidValueArb, invalidValueArb, invalidValueArb,
      ),
    );

    fc.assert(
      fc.property(paramsWithValidityArb, ([validity, validValues, invalidValues]) => {
        // Build the params object
        const params: Record<string, unknown> = {};
        const expectedInvalidFields: string[] = [];
        const expectedValidFields: string[] = [];

        for (let i = 0; i < REQUIRED_FIELDS.length; i++) {
          const field = REQUIRED_FIELDS[i];
          if (validity[i]) {
            params[field] = validValues[i];
            expectedValidFields.push(field);
          } else {
            params[field] = invalidValues[i];
            expectedInvalidFields.push(field);
          }
        }

        const result = validateParams(params as Partial<FinancialParams>);

        // Every invalid field should have an error
        for (const field of expectedInvalidFields) {
          expect(result.errors[field]).toBeDefined();
          expect(
            result.errors[field] === '此字段为必填项' ||
            result.errors[field] === '请输入有效数字'
          ).toBe(true);
        }

        // No valid field should have an error
        for (const field of expectedValidFields) {
          expect(result.errors[field]).toBeUndefined();
        }

        // isValid should be false when there are any invalid fields
        if (expectedInvalidFields.length > 0) {
          expect(result.isValid).toBe(false);
        }

        // isValid should be true when all fields are valid
        if (expectedInvalidFields.length === 0) {
          expect(result.isValid).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe('validateParams warning property tests', () => {
  // Feature: wealth-freedom-calculator, Property 2: 验证警告正确性
  // **Validates: Requirements 1.5, 6.1**
  it('should produce savings-negative warning iff monthlyExpense > monthlyIncome, and high-return warning iff annualReturnRate > 0.5', () => {
    /**
     * Strategy:
     * Generate fully valid FinancialParams with monthlyExpense > 0 (to avoid the
     * "月度开支为 0" warning interfering). Vary monthlyExpense, monthlyIncome, and
     * annualReturnRate across their ranges. Then assert the biconditional:
     *   - warnings contain "储蓄率为负" ↔ monthlyExpense > monthlyIncome
     *   - warnings contain "回报率偏高" ↔ annualReturnRate > 0.5
     */
    const warningParamsArb = fc.record({
      currentAsset: fc.double({ min: 0, max: 100_000_000, noNaN: true, noDefaultInfinity: true }),
      monthlyIncome: fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
      // monthlyExpense > 0 to avoid the "月度开支为 0" warning
      monthlyExpense: fc.double({ min: 0.01, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
      annualReturnRate: fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
      inflationRate: fc.double({ min: 0, max: 0.2, noNaN: true, noDefaultInfinity: true }),
      currentAge: fc.integer({ min: 18, max: 80 }),
    });

    fc.assert(
      fc.property(warningParamsArb, (params) => {
        const result = validateParams(params);

        // All fields are valid numbers, so there should be no errors
        expect(result.isValid).toBe(true);
        expect(Object.keys(result.errors)).toHaveLength(0);

        const warningValues = Object.values(result.warnings);
        const hasSavingsNegativeWarning = warningValues.some((w) =>
          w.includes('储蓄率为负')
        );
        const hasHighReturnWarning = warningValues.some((w) =>
          w.includes('回报率设置偏高')
        );

        // Biconditional: monthlyExpense > monthlyIncome ↔ "储蓄率为负" warning
        expect(hasSavingsNegativeWarning).toBe(params.monthlyExpense > params.monthlyIncome);

        // Biconditional: annualReturnRate > 0.5 ↔ "回报率偏高" warning
        expect(hasHighReturnWarning).toBe(params.annualReturnRate > 0.5);
      }),
      { numRuns: 100 },
    );
  });
});

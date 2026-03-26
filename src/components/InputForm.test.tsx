import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InputForm } from './InputForm';
import type { FinancialParams, ValidationResult } from '../types';
import { DEFAULT_PARAMS } from '../types';

const emptyValidation: ValidationResult = { isValid: true, errors: {}, warnings: {} };

function setup(overrides?: {
  params?: Partial<FinancialParams>;
  validation?: Partial<ValidationResult>;
}) {
  const params = { ...DEFAULT_PARAMS, ...overrides?.params };
  const validationResult: ValidationResult = { ...emptyValidation, ...overrides?.validation };
  const onParamChange = vi.fn();
  const onReset = vi.fn();

  render(
    <InputForm
      params={params}
      validationResult={validationResult}
      onParamChange={onParamChange}
      onReset={onReset}
    />,
  );

  return { params, onParamChange, onReset };
}

describe('InputForm', () => {
  it('renders all 6 input fields with correct labels', () => {
    setup();
    expect(screen.getByLabelText('当前总资产')).toBeInTheDocument();
    expect(screen.getByLabelText('月度收入')).toBeInTheDocument();
    expect(screen.getByLabelText('月度开支')).toBeInTheDocument();
    expect(screen.getByLabelText('年化投资回报率')).toBeInTheDocument();
    expect(screen.getByLabelText('预期通胀率')).toBeInTheDocument();
    expect(screen.getByLabelText('当前年龄')).toBeInTheDocument();
  });

  it('displays default rate values as percentages (7% and 3%)', () => {
    setup();
    expect(screen.getByLabelText('年化投资回报率')).toHaveValue('7');
    expect(screen.getByLabelText('预期通胀率')).toHaveValue('3');
  });

  it('shows "%" suffix for rate fields', () => {
    setup();
    const percentSigns = screen.getAllByText('%');
    expect(percentSigns).toHaveLength(2);
  });

  it('calls onParamChange with decimal value for rate fields', () => {
    const { onParamChange } = setup();
    fireEvent.change(screen.getByLabelText('年化投资回报率'), { target: { value: '10' } });
    expect(onParamChange).toHaveBeenCalledWith('annualReturnRate', 0.1);
  });

  it('calls onParamChange with raw value for non-rate fields', () => {
    const { onParamChange } = setup();
    fireEvent.change(screen.getByLabelText('月度收入'), { target: { value: '20000' } });
    expect(onParamChange).toHaveBeenCalledWith('monthlyIncome', 20000);
  });

  it('blocks non-numeric input (does not call onParamChange)', () => {
    const { onParamChange } = setup();
    fireEvent.change(screen.getByLabelText('月度收入'), { target: { value: 'abc' } });
    expect(onParamChange).not.toHaveBeenCalled();
  });

  it('displays error messages from validationResult', () => {
    setup({
      validation: {
        isValid: false,
        errors: { currentAsset: '此字段为必填项' },
      },
    });
    expect(screen.getByText('此字段为必填项')).toBeInTheDocument();
  });

  it('displays warning messages from validationResult', () => {
    setup({
      params: { monthlyExpense: 10000, monthlyIncome: 5000 },
      validation: {
        warnings: { monthlyExpense: '您的月度开支超过月度收入，储蓄率为负' },
      },
    });
    expect(screen.getByText('您的月度开支超过月度收入，储蓄率为负')).toBeInTheDocument();
  });

  it('calls onReset when reset button is clicked', () => {
    const { onReset } = setup();
    fireEvent.click(screen.getByText('重置'));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('adds error class to input fields with errors', () => {
    setup({
      validation: {
        isValid: false,
        errors: { monthlyIncome: '此字段为必填项' },
      },
    });
    const input = screen.getByLabelText('月度收入');
    expect(input.className).toContain('inputError');
  });
});

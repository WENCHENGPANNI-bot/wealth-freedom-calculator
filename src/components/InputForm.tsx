import type { FinancialParams, ValidationResult } from '../types';
import styles from './InputForm.module.css';

export interface InputFormProps {
  params: FinancialParams;
  validationResult: ValidationResult;
  onParamChange: (key: keyof FinancialParams, value: number) => void;
  onReset: () => void;
}

interface FieldConfig {
  key: keyof FinancialParams;
  label: string;
  placeholder: string;
  isRate?: boolean;
}

const FIELDS: FieldConfig[] = [
  { key: 'currentAsset', label: '当前总资产', placeholder: '请输入当前总资产' },
  { key: 'monthlyIncome', label: '月度收入', placeholder: '请输入月度收入' },
  { key: 'monthlyExpense', label: '月度开支', placeholder: '请输入月度开支' },
  { key: 'annualReturnRate', label: '年化投资回报率', placeholder: '请输入年化投资回报率', isRate: true },
  { key: 'inflationRate', label: '预期通胀率', placeholder: '请输入预期通胀率', isRate: true },
  { key: 'currentAge', label: '当前年龄', placeholder: '请输入当前年龄' },
];

export function InputForm({ params, validationResult, onParamChange, onReset }: InputFormProps) {
  const { errors, warnings } = validationResult;

  const handleChange = (field: FieldConfig, rawValue: string) => {
    if (rawValue === '') {
      onParamChange(field.key, 0);
      return;
    }
    const num = Number(rawValue);
    if (Number.isNaN(num)) return; // block non-numeric input
    onParamChange(field.key, field.isRate ? num / 100 : num);
  };

  const displayValue = (field: FieldConfig): string => {
    const val = params[field.key];
    if (val === 0 && !field.isRate) return '';
    return field.isRate ? String(+(val * 100).toFixed(4)) : String(val);
  };

  return (
    <div className={styles.form}>
      {FIELDS.map((field) => {
        const hasError = !!errors[field.key];
        const warning = warnings[field.key];

        return (
          <div key={field.key} className={styles.fieldGroup}>
            <label className={styles.label} htmlFor={`input-${field.key}`}>
              {field.label}
            </label>
            <div className={styles.inputWrapper}>
              <input
                id={`input-${field.key}`}
                className={`${styles.input} ${hasError ? styles.inputError : ''}`}
                type="text"
                inputMode="decimal"
                placeholder={field.placeholder}
                value={displayValue(field)}
                onChange={(e) => handleChange(field, e.target.value)}
              />
              {field.isRate && <span className={styles.suffix}>%</span>}
            </div>
            {hasError && <p className={styles.errorMsg}>{errors[field.key]}</p>}
            {!hasError && warning && <p className={styles.warningMsg}>{warning}</p>}
          </div>
        );
      })}
      <button type="button" className={styles.resetBtn} onClick={onReset}>
        重置
      </button>
    </div>
  );
}

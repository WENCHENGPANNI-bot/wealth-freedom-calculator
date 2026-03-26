import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

// Mock Recharts to avoid SVG/ResizeObserver issues in jsdom
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

beforeEach(() => {
  localStorage.clear();
  let counter = 0;
  vi.stubGlobal('crypto', {
    ...globalThis.crypto,
    randomUUID: () => `uuid-${++counter}`,
  });
});

describe('App Integration Tests', () => {
  it('renders the app with title and all input fields', () => {
    render(<App />);

    expect(screen.getByText('财富自由计算器')).toBeInTheDocument();
    expect(screen.getByLabelText('当前总资产')).toBeInTheDocument();
    expect(screen.getByLabelText('月度收入')).toBeInTheDocument();
    expect(screen.getByLabelText('月度开支')).toBeInTheDocument();
    expect(screen.getByLabelText('年化投资回报率')).toBeInTheDocument();
    expect(screen.getByLabelText('预期通胀率')).toBeInTheDocument();
    expect(screen.getByLabelText('当前年龄')).toBeInTheDocument();
  });

  it('shows calculation results after entering valid params', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('当前总资产'), { target: { value: '500000' } });
    fireEvent.change(screen.getByLabelText('月度收入'), { target: { value: '30000' } });
    fireEvent.change(screen.getByLabelText('月度开支'), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText('当前年龄'), { target: { value: '30' } });

    expect(screen.getByText('计算结果')).toBeInTheDocument();
    expect(screen.getByText('目标资产金额')).toBeInTheDocument();
  });

  it('persists params to localStorage and restores on re-render', () => {
    const { unmount } = render(<App />);

    fireEvent.change(screen.getByLabelText('月度收入'), { target: { value: '50000' } });

    unmount();

    render(<App />);

    expect(screen.getByLabelText('月度收入')).toHaveValue('50000');
  });

  it('reset button clears params and localStorage', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('月度收入'), { target: { value: '50000' } });
    expect(screen.getByLabelText('月度收入')).toHaveValue('50000');

    fireEvent.click(screen.getByText('重置'));

    expect(screen.getByLabelText('月度收入')).toHaveValue('');
    // After reset, useCalculator restores DEFAULT_PARAMS and auto-saves them,
    // so localStorage contains the default params (monthlyIncome: 0), not null.
    const stored = JSON.parse(localStorage.getItem('wealth-freedom-calculator-params')!);
    expect(stored.monthlyIncome).toBe(0);
  });
});

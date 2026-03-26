import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Projection, Scenario } from '../types';
import styles from './ChartPanel.module.css';

export interface ChartPanelProps {
  projection: Projection[];
  scenarios?: Scenario[];
}

const SCENARIO_COLORS = ['#4a90d9', '#e74c3c', '#2ecc71'];

function formatYen(value: number): string {
  if (value >= 1_0000_0000) return `¥${(value / 1_0000_0000).toFixed(1)}亿`;
  if (value >= 1_0000) return `¥${(value / 1_0000).toFixed(0)}万`;
  return `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`;
}

function formatTooltipValue(value: number): string {
  return `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}

function AssetTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltipContainer}>
      <div className={styles.tooltipLabel}>第 {label} 年</div>
      {payload.map((entry, i) => (
        <div key={i} className={styles.tooltipItem} style={{ color: entry.color }}>
          {entry.name}: {formatTooltipValue(entry.value)}
        </div>
      ))}
    </div>
  );
}

function IncomeExpenseTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltipContainer}>
      <div className={styles.tooltipLabel}>第 {label} 年</div>
      {payload.map((entry, i) => (
        <div key={i} className={styles.tooltipItem} style={{ color: entry.color }}>
          {entry.name}: {formatTooltipValue(entry.value)}/月
        </div>
      ))}
    </div>
  );
}

export function ChartPanel({ projection, scenarios }: ChartPanelProps) {
  if (!projection.length) {
    return (
      <div className={styles.panel}>
        <p className={styles.placeholder}>请输入有效参数以查看图表</p>
      </div>
    );
  }

  const hasScenarios = scenarios && scenarios.length > 0;

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>图表分析</h2>

      {/* Asset Growth Chart */}
      <div className={styles.chartSection}>
        <h3 className={styles.chartTitle}>资产增长趋势</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={projection}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" label={{ value: '年', position: 'insideBottomRight', offset: -5 }} />
            <YAxis tickFormatter={formatYen} width={80} />
            <Tooltip content={<AssetTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalAsset"
              name="当前方案"
              stroke={SCENARIO_COLORS[0]}
              dot={false}
              strokeWidth={2}
            />
            {hasScenarios && scenarios.map((scenario, idx) => {
              if (!scenario.projection?.length) return null;
              const color = SCENARIO_COLORS[(idx + 1) % SCENARIO_COLORS.length];
              return (
                <Line
                  key={scenario.id}
                  data={scenario.projection}
                  type="monotone"
                  dataKey="totalAsset"
                  name={scenario.name}
                  stroke={color}
                  dot={false}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Expense Chart */}
      <div className={styles.chartSection}>
        <h3 className={styles.chartTitle}>被动收入 vs 月度开支</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={projection}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" label={{ value: '年', position: 'insideBottomRight', offset: -5 }} />
            <YAxis tickFormatter={formatYen} width={80} />
            <Tooltip content={<IncomeExpenseTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="passiveIncome"
              name="被动收入"
              stroke="#2ecc71"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="monthlyExpense"
              name="月度开支"
              stroke="#e74c3c"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

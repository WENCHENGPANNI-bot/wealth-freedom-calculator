import type { CalculationResult, TimelineResult, Scenario } from '../types';
import styles from './ResultPanel.module.css';

export interface ResultPanelProps {
  calculationResult: CalculationResult | null;
  timelineResult?: TimelineResult;
  scenarios?: Scenario[];
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '∞';
  return `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`;
}

export function ResultPanel({ calculationResult, timelineResult, scenarios }: ResultPanelProps) {
  if (!calculationResult) {
    return (
      <div className={styles.panel}>
        <p className={styles.placeholder}>请输入有效参数以查看计算结果</p>
      </div>
    );
  }

  const { targetAsset, yearsToFreedom, freedomAge, monthlySavingsNeeded, passiveIncome } = calculationResult;

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>计算结果</h2>

      {timelineResult?.message && (
        <div className={styles.messageBanner}>
          {timelineResult.message}
        </div>
      )}

      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>目标资产金额</span>
          <span className={styles.metricValue}>{formatCurrency(targetAsset)}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>预计达成年数</span>
          <span className={styles.metricValue}>{yearsToFreedom} 年</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>达成时年龄</span>
          <span className={styles.metricValue}>{freedomAge} 岁</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>每月需储蓄金额</span>
          <span className={styles.metricValue}>{formatCurrency(monthlySavingsNeeded)}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>被动收入预期值</span>
          <span className={styles.metricValue}>{formatCurrency(passiveIncome)}/月</span>
        </div>
      </div>

      {scenarios && scenarios.length > 0 && (
        <div className={styles.comparisonSection}>
          <h3 className={styles.comparisonTitle}>方案对比</h3>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>指标</th>
                <th>当前方案</th>
                {scenarios.map((s) => (
                  <th key={s.id}>{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>目标资产</td>
                <td>{formatCurrency(targetAsset)}</td>
                {scenarios.map((s) => (
                  <td key={s.id}>{s.result ? formatCurrency(s.result.targetAsset) : '-'}</td>
                ))}
              </tr>
              <tr>
                <td>达成年数</td>
                <td>{yearsToFreedom} 年</td>
                {scenarios.map((s) => (
                  <td key={s.id}>{s.result ? `${s.result.yearsToFreedom} 年` : '-'}</td>
                ))}
              </tr>
              <tr>
                <td>达成时年龄</td>
                <td>{freedomAge} 岁</td>
                {scenarios.map((s) => (
                  <td key={s.id}>{s.result ? `${s.result.freedomAge} 岁` : '-'}</td>
                ))}
              </tr>
              <tr>
                <td>月储蓄额</td>
                <td>{formatCurrency(monthlySavingsNeeded)}</td>
                {scenarios.map((s) => (
                  <td key={s.id}>{s.result ? formatCurrency(s.result.monthlySavingsNeeded) : '-'}</td>
                ))}
              </tr>
              <tr>
                <td>被动收入</td>
                <td>{formatCurrency(passiveIncome)}/月</td>
                {scenarios.map((s) => (
                  <td key={s.id}>{s.result ? `${formatCurrency(s.result.passiveIncome)}/月` : '-'}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

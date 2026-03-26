import type { FinancialParams, Projection, TimelineResult } from '../types';

/**
 * 计算达到财富自由所需的目标资产
 * 公式：Target_Asset = (monthlyExpense × 12) ÷ (annualReturnRate - inflationRate)
 *
 * 当 annualReturnRate <= inflationRate 时，回报无法跑赢通胀，返回 Infinity
 * 当 monthlyExpense 为 0 时，无需任何资产即可"财富自由"，返回 0
 */
export function calculateTargetAsset(params: FinancialParams): number {
  const { monthlyExpense, annualReturnRate, inflationRate } = params;

  if (monthlyExpense === 0) {
    return 0;
  }

  const realReturnRate = annualReturnRate - inflationRate;

  if (realReturnRate <= 0) {
    return Infinity;
  }

  return (monthlyExpense * 12) / realReturnRate;
}

/**
 * 计算达到财富自由所需的时间线
 *
 * 逐年模拟资产增长，考虑通胀对开支的递增影响。
 * - 当 monthlyExpense 为 0 时，目标资产为 0，直接达成
 * - 当 currentAsset >= targetAsset 且 monthlyExpense > 0 时，已达成财富自由
 * - 当 annualReturnRate <= inflationRate 时，无法跑赢通胀
 * - 逐年模拟：资产按回报率增长 + 年度储蓄（收入 - 通胀调整后开支）
 * - 上限 200 年防止无限循环，超过 100 年附加提示
 */
export function calculateTimeline(params: FinancialParams): TimelineResult {
  const { currentAsset, monthlyIncome, monthlyExpense, annualReturnRate, inflationRate } = params;

  const targetAsset = calculateTargetAsset(params);

  // monthlyExpense 为 0 时目标资产为 0，已达成
  // currentAsset >= targetAsset 且 monthlyExpense > 0 时，已达成
  if (currentAsset >= targetAsset && monthlyExpense > 0) {
    return {
      years: 0,
      reachable: true,
      message: '恭喜，按当前参数您已达到财富自由',
    };
  }

  if (monthlyExpense === 0) {
    return {
      years: 0,
      reachable: true,
      message: '恭喜，按当前参数您已达到财富自由',
    };
  }

  // 回报率 <= 通胀率，无法跑赢通胀
  if (annualReturnRate <= inflationRate) {
    return {
      years: 0,
      reachable: false,
      message: '当前回报率无法跑赢通胀，建议调整投资策略',
    };
  }

  const MAX_YEARS = 200;
  let asset = currentAsset;

  for (let year = 1; year <= MAX_YEARS; year++) {
    // 该年的月度开支（通胀调整后）
    const adjustedMonthlyExpense = monthlyExpense * Math.pow(1 + inflationRate, year);
    // 该年的月度储蓄
    const monthlySavings = monthlyIncome - adjustedMonthlyExpense;
    // 资产按回报率增长 + 全年储蓄
    asset = asset * (1 + annualReturnRate) + monthlySavings * 12;

    // 目标资产也随通胀调整：用通胀调整后的开支重新计算
    const adjustedTargetAsset = (adjustedMonthlyExpense * 12) / (annualReturnRate - inflationRate);

    if (asset >= adjustedTargetAsset) {
      const result: TimelineResult = {
        years: year,
        reachable: true,
      };
      if (year > 100) {
        result.message = '按当前参数，达成财富自由需要超过 100 年，建议调整策略';
      }
      return result;
    }
  }

  // 200 年内未达成
  return {
    years: MAX_YEARS,
    reachable: false,
    message: '按当前参数，达成财富自由需要超过 100 年，建议调整策略',
  };
}

/**
 * 生成逐年资产投影数据（用于图表）
 *
 * 从第 0 年（当前状态）到第 N 年，逐年计算：
 * - 通胀调整后的月度开支
 * - 累计资产（含投资回报和储蓄）
 * - 月被动收入
 * - 是否已达成财富自由
 */
export function generateProjection(params: FinancialParams, years: number): Projection[] {
  const { currentAsset, monthlyIncome, monthlyExpense, annualReturnRate, inflationRate, currentAge } = params;

  const projections: Projection[] = [];

  for (let year = 0; year <= years; year++) {
    const adjustedMonthlyExpense = monthlyExpense * Math.pow(1 + inflationRate, year);

    let totalAsset: number;
    if (year === 0) {
      totalAsset = currentAsset;
    } else {
      const prevAsset = projections[year - 1].totalAsset;
      totalAsset = prevAsset * (1 + annualReturnRate) + (monthlyIncome - adjustedMonthlyExpense) * 12;
    }

    const passiveIncome = totalAsset * annualReturnRate / 12;
    const isFreedomReached = passiveIncome >= adjustedMonthlyExpense;

    projections.push({
      year,
      age: currentAge + year,
      totalAsset,
      passiveIncome,
      monthlyExpense: adjustedMonthlyExpense,
      isFreedomReached,
    });
  }

  return projections;
}

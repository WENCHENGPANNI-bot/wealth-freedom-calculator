/** 用户财务参数 */
export interface FinancialParams {
  currentAsset: number;       // 当前总资产（元）
  monthlyIncome: number;      // 月度收入（元）
  monthlyExpense: number;     // 月度开支（元）
  annualReturnRate: number;   // 年化投资回报率（小数，如 0.07 表示 7%）
  inflationRate: number;      // 预期通胀率（小数，如 0.03 表示 3%）
  currentAge: number;         // 当前年龄
}

/** 计算结果 */
export interface CalculationResult {
  targetAsset: number;        // 目标资产金额
  yearsToFreedom: number;     // 达成所需年数
  monthlySavingsNeeded: number; // 每月需储蓄金额
  passiveIncome: number;      // 达成时的月被动收入
  freedomAge: number;         // 达成财富自由时的年龄
}

/** 逐年投影数据点 */
export interface Projection {
  year: number;               // 第 N 年
  age: number;                // 对应年龄
  totalAsset: number;         // 累计资产
  passiveIncome: number;      // 该年月被动收入
  monthlyExpense: number;     // 该年月度开支（含通胀）
  isFreedomReached: boolean;  // 是否已达成财富自由
}

/** 时间线计算结果 */
export interface TimelineResult {
  years: number;              // 所需年数
  reachable: boolean;         // 是否可达成
  message?: string;           // 提示信息（如回报率低于通胀率）
}

/** 输入验证结果 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;   // 字段名 -> 错误信息
  warnings: Record<string, string>; // 字段名 -> 警告信息
}

/** 方案 */
export interface Scenario {
  id: string;
  name: string;
  params: FinancialParams;
  result?: CalculationResult;
  projection?: Projection[];
}

/** 默认参数值 */
export const DEFAULT_PARAMS: FinancialParams = {
  currentAsset: 0,
  monthlyIncome: 0,
  monthlyExpense: 0,
  annualReturnRate: 0.07,
  inflationRate: 0.03,
  currentAge: 30,
};

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { FinancialParams, ValidationResult, CalculationResult, Projection } from '../types';
import { DEFAULT_PARAMS } from '../types';
import { validateParams } from '../engine/validator';
import { calculateTargetAsset, calculateTimeline, generateProjection } from '../engine/calculator';
import { saveParams, loadParams, clearStorage } from '../storage/storageService';

export interface UseCalculatorReturn {
  params: FinancialParams;
  setParams: (params: FinancialParams) => void;
  updateParam: (key: keyof FinancialParams, value: number) => void;
  validationResult: ValidationResult;
  calculationResult: CalculationResult | null;
  projection: Projection[];
  reset: () => void;
}

export function useCalculator(): UseCalculatorReturn {
  const [params, setParamsState] = useState<FinancialParams>(() => {
    return loadParams() ?? { ...DEFAULT_PARAMS };
  });

  // Auto-save params to localStorage when they change
  useEffect(() => {
    saveParams(params);
  }, [params]);

  const setParams = useCallback((newParams: FinancialParams) => {
    setParamsState(newParams);
  }, []);

  const updateParam = useCallback((key: keyof FinancialParams, value: number) => {
    setParamsState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const validationResult = useMemo(() => validateParams(params), [params]);

  const calculationResult = useMemo<CalculationResult | null>(() => {
    if (!validationResult.isValid) return null;

    const targetAsset = calculateTargetAsset(params);
    const timeline = calculateTimeline(params);
    const monthlySavingsNeeded = params.monthlyIncome - params.monthlyExpense;
    const passiveIncome = targetAsset * params.annualReturnRate / 12;
    const freedomAge = params.currentAge + timeline.years;

    return {
      targetAsset,
      yearsToFreedom: timeline.years,
      monthlySavingsNeeded,
      passiveIncome,
      freedomAge,
    };
  }, [params, validationResult.isValid]);

  const projection = useMemo<Projection[]>(() => {
    if (!validationResult.isValid) return [];

    const timeline = calculateTimeline(params);
    // Generate projection for the timeline years, with a minimum of 10 years for visualization
    const years = Math.max(timeline.reachable ? timeline.years : 30, 10);
    return generateProjection(params, years);
  }, [params, validationResult.isValid]);

  const reset = useCallback(() => {
    clearStorage();
    setParamsState({ ...DEFAULT_PARAMS });
  }, []);

  return {
    params,
    setParams,
    updateParam,
    validationResult,
    calculationResult,
    projection,
    reset,
  };
}

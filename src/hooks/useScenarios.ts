import { useState, useCallback } from 'react';
import type { FinancialParams, Scenario, CalculationResult, Projection } from '../types';
import { calculateTargetAsset, calculateTimeline, generateProjection } from '../engine/calculator';

const MAX_SCENARIOS = 3;

export interface UseScenariosReturn {
  scenarios: Scenario[];
  activeScenarioId: string | null;
  createScenario: (currentParams: FinancialParams) => boolean;
  deleteScenario: (id: string) => void;
  switchScenario: (id: string) => void;
  updateScenarioParams: (id: string, params: FinancialParams) => void;
}

function computeResult(params: FinancialParams): CalculationResult {
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
}

function computeProjection(params: FinancialParams): Projection[] {
  const timeline = calculateTimeline(params);
  const years = Math.max(timeline.reachable ? timeline.years : 30, 10);
  return generateProjection(params, years);
}

export function useScenarios(): UseScenariosReturn {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const createScenario = useCallback((currentParams: FinancialParams): boolean => {
    if (scenarios.length >= MAX_SCENARIOS) {
      return false;
    }

    const clonedParams = structuredClone(currentParams);
    const newScenario: Scenario = {
      id: crypto.randomUUID(),
      name: `方案 ${scenarios.length + 1}`,
      params: clonedParams,
      result: computeResult(clonedParams),
      projection: computeProjection(clonedParams),
    };

    setScenarios((prev) => [...prev, newScenario]);
    setActiveScenarioId(newScenario.id);
    return true;
  }, [scenarios.length]);

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => {
      const next = prev.filter((s) => s.id !== id);
      // Update active scenario if the deleted one was active
      setActiveScenarioId((prevActiveId) => {
        if (prevActiveId === id) {
          return next.length > 0 ? next[0].id : null;
        }
        return prevActiveId;
      });
      return next;
    });
  }, []);

  const switchScenario = useCallback((id: string) => {
    setActiveScenarioId(id);
  }, []);

  const updateScenarioParams = useCallback((id: string, params: FinancialParams) => {
    const clonedParams = structuredClone(params);
    setScenarios((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          params: clonedParams,
          result: computeResult(clonedParams),
          projection: computeProjection(clonedParams),
        };
      }),
    );
  }, []);

  return {
    scenarios,
    activeScenarioId,
    createScenario,
    deleteScenario,
    switchScenario,
    updateScenarioParams,
  };
}

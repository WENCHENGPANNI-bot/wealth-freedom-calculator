import type { Scenario } from '../types';
import styles from './ScenarioManager.module.css';

export interface ScenarioManagerProps {
  scenarios: Scenario[];
  activeScenarioId: string | null;
  onCreateScenario: () => void;
  onDeleteScenario: (id: string) => void;
  onSwitchScenario: (id: string) => void;
  canCreate: boolean;
}

const MAX_SCENARIOS = 3;

export function ScenarioManager({
  scenarios,
  activeScenarioId,
  onCreateScenario,
  onDeleteScenario,
  onSwitchScenario,
  canCreate,
}: ScenarioManagerProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>方案 ({scenarios.length}/{MAX_SCENARIOS})</span>
        <button
          className={styles.createBtn}
          onClick={onCreateScenario}
          disabled={!canCreate}
        >
          新建方案
        </button>
      </div>

      <div className={styles.tabs}>
        {scenarios.map((scenario) => {
          const isActive = scenario.id === activeScenarioId;
          return (
            <div
              key={scenario.id}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => onSwitchScenario(scenario.id)}
            >
              <span className={styles.tabName}>{scenario.name}</span>
              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteScenario(scenario.id);
                }}
                aria-label={`删除${scenario.name}`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

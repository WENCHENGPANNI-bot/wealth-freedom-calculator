import { useMemo } from 'react';
import { useCalculator } from './hooks/useCalculator';
import { useScenarios } from './hooks/useScenarios';
import { calculateTimeline } from './engine/calculator';
import { InputForm } from './components/InputForm';
import { ResultPanel } from './components/ResultPanel';
import { ChartPanel } from './components/ChartPanel';
import { ScenarioManager } from './components/ScenarioManager';
import styles from './App.module.css';

function App() {
  const {
    params,
    updateParam,
    validationResult,
    calculationResult,
    projection,
    reset,
  } = useCalculator();

  const {
    scenarios,
    activeScenarioId,
    createScenario,
    deleteScenario,
    switchScenario,
  } = useScenarios();

  const timelineResult = useMemo(() => {
    if (!validationResult.isValid) return undefined;
    return calculateTimeline(params);
  }, [params, validationResult.isValid]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>财富自由计算器</h1>
        <p className={styles.subtitle}>计算你的被动收入何时能覆盖日常开支，实现财务自由</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.leftColumn}>
          <InputForm
            params={params}
            validationResult={validationResult}
            onParamChange={updateParam}
            onReset={reset}
          />
          <ScenarioManager
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onCreateScenario={() => createScenario(params)}
            onDeleteScenario={deleteScenario}
            onSwitchScenario={switchScenario}
            canCreate={scenarios.length < 3}
          />
        </div>

        <div className={styles.rightColumn}>
          <ResultPanel
            calculationResult={calculationResult}
            timelineResult={timelineResult}
            scenarios={scenarios}
          />
          <ChartPanel
            projection={projection}
            scenarios={scenarios}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

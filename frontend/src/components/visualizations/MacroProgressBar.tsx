import React from 'react';
import './MacroProgressBar.css';

interface MacroData {
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
}

interface MacroProgressBarProps {
  data: MacroData;
  height?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showValues?: boolean;
  animated?: boolean;
}

const MacroProgressBar: React.FC<MacroProgressBarProps> = ({
  data,
  height = 'md',
  showLabels = true,
  showValues = true,
  animated = true
}) => {
  const { protein, carbs, fat } = data;
  
  // Calculate percentages
  const proteinPercent = Math.min((protein.current / protein.goal) * 100, 100);
  const carbsPercent = Math.min((carbs.current / carbs.goal) * 100, 100);
  const fatPercent = Math.min((fat.current / fat.goal) * 100, 100);
  
  // Calculate total calories for proportional display
  const totalGoalCalories = (protein.goal * 4) + (carbs.goal * 4) + (fat.goal * 9);
  const proteinCalories = protein.goal * 4;
  const carbsCalories = carbs.goal * 4;
  const fatCalories = fat.goal * 9;
  
  // Calculate proportional widths
  const proteinWidth = (proteinCalories / totalGoalCalories) * 100;
  const carbsWidth = (carbsCalories / totalGoalCalories) * 100;
  const fatWidth = (fatCalories / totalGoalCalories) * 100;

  const macros = [
    {
      name: 'Protein',
      color: 'var(--color-primary-green)',
      lightColor: 'var(--color-primary-green-light)',
      current: protein.current,
      goal: protein.goal,
      percent: proteinPercent,
      width: proteinWidth,
      unit: 'g'
    },
    {
      name: 'Carbs',
      color: 'var(--color-primary-blue)',
      lightColor: 'var(--color-primary-blue-light)',
      current: carbs.current,
      goal: carbs.goal,
      percent: carbsPercent,
      width: carbsWidth,
      unit: 'g'
    },
    {
      name: 'Fat',
      color: 'var(--color-accent-yellow)',
      lightColor: 'var(--color-accent-yellow-light)',
      current: fat.current,
      goal: fat.goal,
      percent: fatPercent,
      width: fatWidth,
      unit: 'g'
    }
  ];

  return (
    <div className={`macro-progress-bar macro-progress-bar--${height}`}>
      {/* Stacked Progress Bar */}
      <div className="macro-bar-container">
        <div className="macro-bar-track">
          {macros.map((macro, index) => (
            <div
              key={macro.name}
              className="macro-segment"
              style={{
                width: `${macro.width}%`,
                '--macro-color': macro.color
              } as React.CSSProperties}
            >
              <div
                className={`macro-fill ${animated ? 'macro-fill--animated' : ''}`}
                style={{
                  width: `${macro.percent}%`,
                  backgroundColor: macro.color,
                  animationDelay: `${index * 0.2}s`
                }}
              />
              <div className="macro-background" style={{ backgroundColor: macro.lightColor }} />
            </div>
          ))}
        </div>
        
        {/* Segment dividers */}
        <div className="macro-dividers">
          <div 
            className="macro-divider" 
            style={{ left: `${proteinWidth}%` }}
          />
          <div 
            className="macro-divider" 
            style={{ left: `${proteinWidth + carbsWidth}%` }}
          />
        </div>
      </div>

      {/* Labels and Values */}
      {(showLabels || showValues) && (
        <div className="macro-details">
          {macros.map((macro) => (
            <div
              key={macro.name}
              className="macro-item"
              style={{ flex: `0 0 ${macro.width}%` }}
            >
              <div className="macro-header">
                <div
                  className="macro-indicator"
                  style={{ backgroundColor: macro.color }}
                />
                {showLabels && (
                  <span className="macro-label">{macro.name}</span>
                )}
              </div>
              
              {showValues && (
                <div className="macro-values">
                  <span className="macro-current">
                    {macro.current}{macro.unit}
                  </span>
                  <span className="macro-goal">
                    /{macro.goal}{macro.unit}
                  </span>
                </div>
              )}
              
              <div className="macro-percentage">
                {macro.percent.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MacroProgressBar; 
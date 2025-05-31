import React from 'react';
import './CalorieGauge.css';

interface CalorieGaugeProps {
  current: number;
  goal: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  animated?: boolean;
}

const CalorieGauge: React.FC<CalorieGaugeProps> = ({
  current,
  goal,
  size = 'md',
  showLabels = true,
  animated = true
}) => {
  const percentage = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(goal - current, 0);
  
  // Calculate the angle for the gauge (180 degrees semicircle)
  const angle = (percentage / 100) * 180;
  
  // Size configurations
  const sizeConfig = {
    sm: { radius: 60, strokeWidth: 8, fontSize: '14px' },
    md: { radius: 80, strokeWidth: 10, fontSize: '16px' },
    lg: { radius: 100, strokeWidth: 12, fontSize: '18px' }
  };
  
  const config = sizeConfig[size];
  const circumference = Math.PI * config.radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;
  
  // Color based on progress
  const getGaugeColor = () => {
    if (percentage >= 100) return 'var(--color-success)';
    if (percentage >= 75) return 'var(--color-primary-green)';
    if (percentage >= 50) return 'var(--color-accent-yellow)';
    return 'var(--color-primary-blue)';
  };

  return (
    <div className={`calorie-gauge calorie-gauge--${size}`}>
      <div className="gauge-container">
        <svg
          width={config.radius * 2 + 20}
          height={config.radius + 30}
          className="gauge-svg"
        >
          {/* Background semicircle */}
          <path
            d={`M 10 ${config.radius + 10} A ${config.radius} ${config.radius} 0 0 1 ${config.radius * 2 + 10} ${config.radius + 10}`}
            fill="none"
            stroke="var(--color-border-light)"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Progress semicircle */}
          <path
            d={`M 10 ${config.radius + 10} A ${config.radius} ${config.radius} 0 0 1 ${config.radius * 2 + 10} ${config.radius + 10}`}
            fill="none"
            stroke={getGaugeColor()}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={animated ? 'gauge-progress--animated' : ''}
            style={{
              '--animation-delay': '0.5s'
            } as React.CSSProperties}
          />
          
          {/* Gauge indicator marks */}
          {[0, 25, 50, 75, 100].map((mark) => {
            const markAngle = (mark / 100) * 180 - 90;
            const markRadius = config.radius - config.strokeWidth / 2 - 5;
            const x1 = config.radius + 10 + markRadius * Math.cos(markAngle * Math.PI / 180);
            const y1 = config.radius + 10 + markRadius * Math.sin(markAngle * Math.PI / 180);
            const x2 = config.radius + 10 + (markRadius + 8) * Math.cos(markAngle * Math.PI / 180);
            const y2 = config.radius + 10 + (markRadius + 8) * Math.sin(markAngle * Math.PI / 180);
            
            return (
              <line
                key={mark}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-text-tertiary)"
                strokeWidth="2"
                opacity={mark % 50 === 0 ? 1 : 0.5}
              />
            );
          })}
          
          {/* Center text */}
          <text
            x={config.radius + 10}
            y={config.radius + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            className="gauge-center-text"
            style={{ fontSize: config.fontSize }}
          >
            <tspan x={config.radius + 10} dy="-8" className="gauge-current">
              {Math.round(current).toLocaleString()}
            </tspan>
            <tspan x={config.radius + 10} dy="16" className="gauge-unit">
              calories
            </tspan>
          </text>
        </svg>
        
        {/* Pointer/needle */}
        <div
          className="gauge-pointer"
          style={{
            transform: `rotate(${angle - 90}deg)`,
            transformOrigin: `${config.radius + 10}px ${config.radius + 10}px`
          }}
        >
          <div className="pointer-line" />
          <div className="pointer-circle" />
        </div>
      </div>
      
      {showLabels && (
        <div className="gauge-labels">
          <div className="gauge-stat">
            <span className="stat-value">{percentage.toFixed(0)}%</span>
            <span className="stat-label">of goal</span>
          </div>
          <div className="gauge-stat">
            <span className="stat-value">{Math.round(remaining).toLocaleString()}</span>
            <span className="stat-label">remaining</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalorieGauge; 
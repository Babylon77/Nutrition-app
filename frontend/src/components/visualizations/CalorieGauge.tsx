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
  
  // Calculate the angle for the gauge (270 degrees for 3/4 circle)
  const maxAngle = 270;
  const angle = (percentage / 100) * maxAngle;
  
  // Size configurations
  const sizeConfig = {
    sm: { radius: 70, strokeWidth: 12, fontSize: '14px', centerSize: 16 },
    md: { radius: 90, strokeWidth: 16, fontSize: '18px', centerSize: 20 },
    lg: { radius: 165, strokeWidth: 30, fontSize: '30px', centerSize: 36 }
  };
  
  const config = sizeConfig[size];
  
  // Define viewBox dimensions based on radius and padding
  const padding = 20; // General padding around the gauge elements
  const viewBoxWidth = config.radius * 2 + padding * 2;
  const viewBoxHeight = config.radius * 1.5 + padding * 2 + (config.strokeWidth); // Adjusted for 3/4 circle height
                                                                               // and ensure bottom stroke is visible.
  
  // Color based on progress - using neon colors to match the rest of the app
  const getGaugeColor = () => {
    if (percentage >= 100) return '#00c853'; // Neon green
    if (percentage >= 75) return '#00ff6b'; // Electric green
    if (percentage >= 50) return '#ffff00'; // Neon yellow
    if (percentage >= 25) return '#ff8c00'; // Orange
    return '#ff0040'; // Neon red
  };

  const getGradientId = () => `calorie-gradient-${size}`;

  // Calculate start angle for 270-degree arc (starting from bottom left)
  const startAngle = 135; // Start at bottom left
  const endAngle = startAngle + maxAngle; // End at bottom right

  // Create SVG path for the arc
  const createArcPath = (radius: number, startAngle: number, endAngle: number) => {
    const centerX = config.radius + 20;
    const centerY = config.radius + 20;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Create progress arc
  const progressEndAngle = startAngle + (percentage / 100) * maxAngle;
  const backgroundPath = createArcPath(config.radius, startAngle, endAngle);
  const progressPath = createArcPath(config.radius, startAngle, progressEndAngle);

  return (
    <div className={`calorie-gauge calorie-gauge--${size}`} style={{ width: '100%' }}>
      <div className="gauge-container">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="gauge-svg"
          style={{ width: '100%', height: 'auto' }}
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id={getGradientId()} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={getGaugeColor()} stopOpacity="0.8" />
              <stop offset="50%" stopColor={getGaugeColor()} stopOpacity="1" />
              <stop offset="100%" stopColor={getGaugeColor()} stopOpacity="0.9" />
            </linearGradient>
            
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Shadow filter */}
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)"/>
            </filter>
          </defs>

          {/* Outer ring background */}
          <circle
            cx={config.radius + 20}
            cy={config.radius + 20}
            r={config.radius + 8}
            fill="none"
            stroke="var(--color-border-light)"
            strokeWidth="2"
            opacity="0.3"
          />
          
          {/* Background arc */}
          <path
            d={backgroundPath}
            fill="none"
            stroke="var(--color-border-light)"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            opacity="0.2"
          />
          
          {/* Progress arc with gradient and glow */}
          <path
            d={progressPath}
            fill="none"
            stroke={`url(#${getGradientId()})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            filter="url(#glow)"
            className={animated ? 'gauge-progress--animated' : ''}
          />

          {/* Gauge tick marks */}
          {[0, 25, 50, 75, 100].map((mark) => {
            const tickAngle = startAngle + (mark / 100) * maxAngle;
            const tickAngleRad = (tickAngle * Math.PI) / 180;
            const innerRadius = config.radius - config.strokeWidth / 2 - 8;
            const outerRadius = config.radius - config.strokeWidth / 2 + 2;
            
            const x1 = config.radius + 20 + innerRadius * Math.cos(tickAngleRad);
            const y1 = config.radius + 20 + innerRadius * Math.sin(tickAngleRad);
            const x2 = config.radius + 20 + outerRadius * Math.cos(tickAngleRad);
            const y2 = config.radius + 20 + outerRadius * Math.sin(tickAngleRad);
            
            return (
              <line
                key={mark}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-text-tertiary)"
                strokeWidth={mark % 50 === 0 ? "3" : "1.5"}
                opacity={mark % 25 === 0 ? 0.8 : 0.4}
              />
            );
          })}

          {/* Center circle with shadow */}
          <circle
            cx={config.radius + 20}
            cy={config.radius + 20}
            r={config.centerSize}
            fill="var(--color-bg-card)"
            stroke="var(--color-border-light)"
            strokeWidth="1"
            filter="url(#shadow)"
          />
          
          {/* Center text */}
          <text
            x={config.radius + 20}
            y={config.radius + 20}
            textAnchor="middle"
            dominantBaseline="middle"
            className="gauge-center-text"
            style={{ fontSize: config.fontSize }}
          >
            <tspan x={config.radius + 20} dy="-8" className="gauge-current">
              {Math.round(current).toLocaleString()}
            </tspan>
            <tspan x={config.radius + 20} dy="20" className="gauge-unit">
              calories
            </tspan>
          </text>
        </svg>
      </div>
      
      {showLabels && (
        <div className="gauge-labels">
          <div className="gauge-stat">
            <span className="stat-value" style={{ color: getGaugeColor() }}>
              {percentage.toFixed(0)}%
            </span>
            <span className="stat-label">progress</span>
          </div>
          <div className="gauge-stat">
            <span className="stat-value">
              {Math.round(remaining).toLocaleString()}
            </span>
            <span className="stat-label">remaining</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalorieGauge; 
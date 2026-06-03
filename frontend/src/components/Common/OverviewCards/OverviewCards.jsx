import React from 'react';
import './OverviewCards.css';

const OverviewCards = ({ stats, loading = false, className = '' }) => {
  if (loading) {
    return (
      <div className={`overview-cards ${className}`}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card common-loading-shimmer" style={{height: '100px'}}></div>
        ))}
      </div>
    );
  }

  return (
    <div className={`overview-cards ${className}`}>
      {stats.map((stat, index) => (
        <div 
          key={stat.id || index} 
          className={`stat-card ${stat.variant || 'primary'}`}
          onClick={stat.onClick}
          style={stat.style}
        >
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
          {stat.description && (
            <div className="stat-description">{stat.description}</div>
          )}
          {stat.trend && (
            <div className={`stat-trend ${stat.trend.direction}`}>
              {stat.trend.value} {stat.trend.direction === 'up' ? '↗' : '↘'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OverviewCards;
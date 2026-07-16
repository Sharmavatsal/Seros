import React from 'react';

const MetricCard = ({ title, value, icon: Icon, trend, trendLabel, trendUpIsGood = true }) => {
  const isUp = trend > 0;
  const trendColor = trendUpIsGood
    ? (isUp ? 'text-healthy' : 'text-alert')
    : (isUp ? 'text-alert' : 'text-healthy');

  return (
    <div className="bg-surface border border-border rounded-lg p-6 flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 font-medium text-sm">{title}</h3>
        {Icon && <div className="p-2 bg-gray-800 rounded-md text-primary"><Icon size={20} /></div>}
      </div>
      
      <div>
        <div className="text-3xl font-bold text-white mb-2">{value}</div>
        {trend !== undefined && (
          <div className="flex items-center text-sm">
            <span className={`font-semibold ${trendColor}`}>
              {isUp ? '+' : ''}{trend}%
            </span>
            <span className="text-gray-500 ml-2">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;

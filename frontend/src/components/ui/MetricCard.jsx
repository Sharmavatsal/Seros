const MetricCard = ({ title, value, icon: Icon, trend, trendLabel, trendUpIsGood = true }) => {
  const isUp = trend > 0;
  const trendColor = trendUpIsGood
    ? (isUp ? 'text-healthy' : 'text-alert')
    : (isUp ? 'text-alert' : 'text-healthy');

  return (
    <div className="bg-surface border border-border rounded-lg p-4 md:p-6 flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-start gap-2 mb-3 md:mb-4">
        <h3 className="text-gray-400 font-medium text-xs md:text-sm truncate">{title}</h3>
        {Icon && <div className="p-1.5 md:p-2 bg-gray-800 rounded-md text-primary shrink-0"><Icon size={16} className="md:size-5" /></div>}
      </div>
      
      <div className="min-w-0">
        <div className="text-xl md:text-3xl font-bold text-white truncate">{value}</div>
        {trend !== undefined && (
          <div className="flex items-center text-xs md:text-sm mt-1 md:mt-0">
            <span className={`font-semibold ${trendColor} whitespace-nowrap`}>
              {isUp ? '+' : ''}{trend}%
            </span>
            <span className="text-gray-500 ml-1.5 truncate">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;

import React from 'react';
import { ResponsiveContainer } from 'recharts';

const ChartContainer = ({ title, children, height = 300 }) => {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm h-full flex flex-col">
      {title && <h3 className="text-lg font-medium text-white mb-6">{title}</h3>}
      <div className="flex-1 w-full" style={{ minHeight: height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartContainer;

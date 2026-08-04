import { ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';

const ChartContainer = ({ title, children, height = 300 }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const displayHeight = isMobile ? Math.min(height, 240) : height;

  return (
    <div className="bg-surface border border-border rounded-lg p-4 md:p-6 shadow-sm">
      {title && <h3 className="text-sm md:text-lg font-medium text-white mb-4 md:mb-6">{title}</h3>}
      <div style={{ height: displayHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartContainer;

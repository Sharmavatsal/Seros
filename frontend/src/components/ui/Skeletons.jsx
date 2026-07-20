import React from 'react';

// Skeleton for a single metric card
export const SkeletonCard = () => (
  <div className="bg-surface border border-border rounded-lg p-6 flex flex-col justify-between shadow-sm animate-fade-in">
    <div className="flex justify-between items-start mb-4">
      <div className="skeleton h-4 w-32 rounded" />
      <div className="skeleton h-8 w-8 rounded-md" />
    </div>
    <div>
      <div className="skeleton h-8 w-24 rounded mb-2" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  </div>
);

// Skeleton for a chart container
export const SkeletonChart = ({ height = 300, title }) => (
  <div className="bg-surface border border-border rounded-lg p-6 shadow-sm flex flex-col">
    {title && <div className="skeleton h-5 w-40 rounded mb-6" />}
    <div
      className="skeleton rounded-md w-full flex-1"
      style={{ minHeight: height }}
    />
  </div>
);

// Skeleton for a table
export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-border">
      <div className="skeleton h-5 w-48 rounded" />
    </div>
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4">
          {Array.from({ length: cols }).map((_, ci) => (
            <div
              key={ci}
              className="skeleton h-4 rounded flex-1"
              style={{ opacity: 1 - ri * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Skeleton for 4 KPI cards in a row
export const SkeletonKPIRow = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[0, 1, 2, 3].map((i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

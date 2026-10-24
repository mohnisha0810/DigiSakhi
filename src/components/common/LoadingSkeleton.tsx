import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 h-36 skeleton-shimmer shadow-card" />

      {/* Action Cards Skeleton */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4 shadow-card">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 rounded-xl bg-slate-100" />
          <div className="h-32 rounded-xl bg-slate-100" />
          <div className="h-32 rounded-xl bg-slate-100" />
          <div className="h-32 rounded-xl bg-slate-100" />
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-48 rounded-2xl bg-white border border-brand-border skeleton-shimmer shadow-card" />
        <div className="h-48 rounded-2xl bg-white border border-brand-border skeleton-shimmer shadow-card" />
      </div>
    </div>
  );
};

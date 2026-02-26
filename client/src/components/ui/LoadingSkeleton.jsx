import React from 'react';

// Base Skeleton Component
const Skeleton = ({ 
  className = '', 
  variant = 'text', // 'text', 'circular', 'rectangular', 'rounded'
  animation = 'pulse', // 'pulse', 'wave', 'none'
  width,
  height,
  style = {}
}) => {
  const baseClasses = `
    bg-gray-200 
    ${animation === 'pulse' ? 'animate-pulse' : ''}
    ${animation === 'wave' ? 'animate-pulse' : ''}
  `;
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  };
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '100px'),
        ...style
      }}
    />
  );
};

// KPI Card Skeleton
export const KPICardSkeleton = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <Skeleton width="40%" height="14px" className="mb-3" />
        <Skeleton width="60%" height="32px" className="mb-2" />
        <Skeleton width="80%" height="12px" />
      </div>
      <Skeleton variant="rounded" width="48px" height="48px" />
    </div>
  </div>
);

// Equipment Card Skeleton
export const EquipmentCardSkeleton = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${className}`}>
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="rounded" width="40px" height="40px" />
        <div>
          <Skeleton width="120px" height="20px" className="mb-1" />
          <Skeleton width="80px" height="12px" />
        </div>
      </div>
      <Skeleton variant="rounded" width="60px" height="24px" />
    </div>
    
    {/* Body */}
    <div className="space-y-3">
      <div className="flex justify-between">
        <Skeleton width="30%" height="14px" />
        <Skeleton width="40%" height="14px" />
      </div>
      <div className="flex justify-between">
        <Skeleton width="20%" height="14px" />
        <Skeleton width="35%" height="14px" />
      </div>
      <div className="flex justify-between">
        <Skeleton width="25%" height="14px" />
        <Skeleton width="45%" height="14px" />
      </div>
    </div>
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 5, className = '' }) => (
  <tr className={`border-b border-gray-100 ${className}`}>
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="p-4">
        <Skeleton height="16px" />
      </td>
    ))}
  </tr>
);

// Chart Skeleton
export const ChartSkeleton = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
    <Skeleton width="40%" height="20px" className="mb-4" />
    <Skeleton width="100%" height="250px" variant="rounded" />
  </div>
);

// Dashboard Grid Skeleton
export const DashboardSkeleton = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Header */}
    <div className="flex justify-between items-center">
      <div>
        <Skeleton width="200px" height="32px" className="mb-2" />
        <Skeleton width="300px" height="16px" />
      </div>
    </div>
    
    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <KPICardSkeleton key={index} />
      ))}
    </div>
    
    {/* Charts Row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
    
    {/* Table */}
    <div className="bg-white rounded-xl shadow-md p-6">
      <Skeleton width="30%" height="20px" className="mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRowSkeleton key={index} />
        ))}
      </div>
    </div>
  </div>
);

// Equipment List Grid Skeleton
export const EquipmentListSkeleton = ({ count = 6, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <EquipmentCardSkeleton key={index} />
    ))}
  </div>
);

// Filter Skeleton
export const FilterSkeleton = ({ className = '' }) => (
  <div className={className}>
    <Skeleton width="100px" height="14px" className="mb-2" />
    <div className="flex gap-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} variant="rounded" width="70px" height="32px" />
      ))}
    </div>
  </div>
);

export default Skeleton;

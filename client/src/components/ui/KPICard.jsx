import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Color presets for different KPI types
const COLOR_PRESETS = {
  primary: {
    bg: '#EFF6FF',
    text: '#1E40AF',
    icon: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)'
  },
  success: {
    bg: '#ECFDF5',
    text: '#047857',
    icon: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
  },
  warning: {
    bg: '#FFFBEB',
    text: '#B45309',
    icon: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
  },
  danger: {
    bg: '#FEF2F2',
    text: '#B91C1C',
    icon: '#EF4444',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
  },
  neutral: {
    bg: '#F3F4F6',
    text: '#374151',
    icon: '#6B7280',
    gradient: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)'
  }
};

const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  trend = null, // 'up', 'down', 'neutral' or null
  trendValue = null,
  loading = false,
  className = ''
}) => {
  const colors = COLOR_PRESETS[color] || COLOR_PRESETS.primary;
  
  // Trend icon and color
  const getTrendInfo = () => {
    if (!trend) return null;
    
    const trendConfig = {
      up: { icon: TrendingUp, color: '#10B981', text: 'text-green-600' },
      down: { icon: TrendingDown, color: '#EF4444', text: 'text-red-600' },
      neutral: { icon: Minus, color: '#6B7280', text: 'text-gray-600' }
    };
    
    return trendConfig[trend] || trendConfig.neutral;
  };
  
  const trendInfo = getTrendInfo();
  
  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`
        bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300
        border-l-4 overflow-hidden ${className}
      `}
      style={{ borderLeftColor: colors.icon }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p 
              className="text-sm font-medium mb-1"
              style={{ color: colors.text }}
            >
              {title}
            </p>
            
            <div className="flex items-baseline gap-2">
              <p 
                className="text-3xl font-bold"
                style={{ color: colors.text }}
              >
                {value}
              </p>
              
              {trendInfo && (
                <div className={`flex items-center gap-1 ${trendInfo.text}`}>
                  <trendInfo.icon className="w-4 h-4" />
                  {trendValue && (
                    <span className="text-sm font-medium">{trendValue}</span>
                  )}
                </div>
              )}
            </div>
            
            {subtitle && (
              <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                {subtitle}
              </p>
            )}
          </div>
          
          {Icon && (
            <div 
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.bg }}
            >
              <Icon 
                className="w-6 h-6"
                style={{ color: colors.icon }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Subtle gradient overlay at bottom */}
      <div 
        className="h-1"
        style={{ background: colors.gradient }}
      />
    </div>
  );
};

// Compact version for smaller spaces
export const KPICardCompact = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  className = ''
}) => {
  const colors = COLOR_PRESETS[color] || COLOR_PRESETS.primary;
  
  return (
    <div 
      className={`
        bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300
        p-4 flex items-center gap-4 ${className}
      `}
    >
      {Icon && (
        <div 
          className="p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: colors.bg }}
        >
          <Icon 
            className="w-5 h-5"
            style={{ color: colors.icon }}
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: '#6B7280' }}>
          {title}
        </p>
        <p 
          className="text-xl font-bold truncate"
          style={{ color: colors.text }}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default KPICard;

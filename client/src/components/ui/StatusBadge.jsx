import React from 'react';

// Status color mapping following the design system
const STATUS_COLORS = {
  activo: {
    bg: '#ECFDF5',
    text: '#059669',
    border: '#A7F3D0',
    dot: '#10B981'
  },
  inactivo: {
    bg: '#F3F4F6',
    text: '#6B7280',
    border: '#E5E7EB',
    dot: '#9CA3AF'
  },
  mantenimiento: {
    bg: '#FFFBEB',
    text: '#D97706',
    border: '#FDE68A',
    dot: '#F59E0B'
  },
  baja: {
    bg: '#FEF2F2',
    text: '#DC2626',
    border: '#FECACA',
    dot: '#EF4444'
  },
  // Equipment types
  Equipo: {
    bg: '#EFF6FF',
    text: '#1E40AF',
    border: '#BFDBFE',
    dot: '#3B82F6'
  },
  Batería: {
    bg: '#ECFDF5',
    text: '#047857',
    border: '#A7F3D0',
    dot: '#10B981'
  },
  'Base Cargadora': {
    bg: '#FFFBEB',
    text: '#B45309',
    border: '#FDE68A',
    dot: '#F59E0B'
  }
};

const StatusBadge = ({ 
  status = 'activo', 
  type = 'status', // 'status' or 'equipment'
  size = 'md', // 'sm', 'md', 'lg'
  showDot = true,
  className = ''
}) => {
  // Get colors based on type
  const colorKey = type === 'equipment' ? status : status.toLowerCase();
  const colors = STATUS_COLORS[colorKey] || STATUS_COLORS.activo;
  
  // Size classes
  const sizeClasses = {
    sm: {
      badge: 'px-2 py-0.5 text-xs',
      dot: 'w-1.5 h-1.5',
      gap: 'gap-1'
    },
    md: {
      badge: 'px-2.5 py-1 text-sm',
      dot: 'w-2 h-2',
      gap: 'gap-1.5'
    },
    lg: {
      badge: 'px-3 py-1.5 text-base',
      dot: 'w-2.5 h-2.5',
      gap: 'gap-2'
    }
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full border
        ${sizeClass.badge} ${sizeClass.gap} ${className}
      `}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
        transition: 'all 150ms ease-in-out'
      }}
    >
      {showDot && (
        <span 
          className={`rounded-full ${sizeClass.dot}`}
          style={{ backgroundColor: colors.dot }}
        />
      )}
      {status}
    </span>
  );
};

// Equipment type badge with icon
export const EquipmentTypeBadge = ({ type, size = 'md' }) => {
  const equipmentTypes = {
    'Equipo': { icon: '📻', color: STATUS_COLORS.Equipo },
    'Batería': { icon: '🔋', color: STATUS_COLORS['Batería'] },
    'Base Cargadora': { icon: '⚡', color: STATUS_COLORS['Base Cargadora'] }
  };
  
  const config = equipmentTypes[type] || equipmentTypes['Equipo'];
  
  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full border
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-base' : 'px-2.5 py-1 text-sm'}
      `}
      style={{
        backgroundColor: config.color.bg,
        color: config.color.text,
        borderColor: config.color.border
      }}
    >
      <span className="mr-1">{config.icon}</span>
      {type}
    </span>
  );
};

export default StatusBadge;

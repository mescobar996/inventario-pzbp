import React from 'react';
import { 
  Radio, 
  Battery, 
  Zap, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Calendar
} from 'lucide-react';
import StatusBadge, { EquipmentTypeBadge } from './StatusBadge';

const EquipmentCard = ({ 
  equipo,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  className = ''
}) => {
  // Get equipment type icon
  const getEquipmentIcon = (tipo) => {
    switch (tipo) {
      case 'Equipo': return Radio;
      case 'Batería': return Battery;
      case 'Base Cargadora': return Zap;
      default: return Radio;
    }
  };
  
  const IconComponent = getEquipmentIcon(equipo.tipo);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  return (
    <div 
      className={`
        bg-white rounded-xl shadow-sm hover:shadow-lg 
        transition-all duration-300 border border-gray-100
        hover:border-blue-200 group ${className}
      `}
    >
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Type Icon */}
            <div 
              className="p-2.5 rounded-lg"
              style={{ 
                backgroundColor: equipo.tipo === 'Equipo' ? '#EFF6FF' : 
                               equipo.tipo === 'Batería' ? '#ECFDF5' : '#FFFBEB'
              }}
            >
              <IconComponent 
                className="w-5 h-5"
                style={{ 
                  color: equipo.tipo === 'Equipo' ? '#3B82F6' : 
                         equipo.tipo === 'Batería' ? '#10B981' : '#F59E0B'
                }}
              />
            </div>
            
            {/* Inventory Number */}
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {equipo.n_inventario}
              </h3>
              <p className="text-xs text-gray-500">
                {equipo.catalogo || 'Sin catálogo'}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <StatusBadge 
            status={equipo.estado || 'activo'} 
            size="sm"
          />
        </div>
      </div>
      
      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Serial Number */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">N/S (Serial)</span>
          <span className="text-sm font-mono font-medium text-gray-900">
            {equipo.ns || 'N/A'}
          </span>
        </div>
        
        {/* Equipment Type */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Tipo</span>
          <EquipmentTypeBadge type={equipo.tipo} size="sm" />
        </div>
        
        {/* Destination */}
        {equipo.Destino && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Destino
            </span>
            <span 
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium"
              style={{ 
                backgroundColor: equipo.Destino.color ? `${equipo.Destino.color}20` : '#F3F4F6',
                color: equipo.Destino.color || '#374151'
              }}
            >
              <span 
                className="w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: equipo.Destino.color || '#6B7280' }}
              />
              {equipo.Destino.nombre}
            </span>
          </div>
        )}
        
        {/* GEBIPA */}
        {equipo.gebipa && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">GEBIPA</span>
            <span className="text-sm font-medium text-gray-900">
              {equipo.gebipa}
            </span>
          </div>
        )}
        
        {/* Date */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Registrado
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(equipo.createdAt)}
          </span>
        </div>
      </div>
      
      {/* Card Actions */}
      {showActions && (
        <div className="p-4 pt-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {onView && (
            <button
              onClick={() => onView(equipo)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 
                       text-sm font-medium text-blue-600 bg-blue-50 rounded-lg
                       hover:bg-blue-100 transition-colors duration-200"
            >
              <Eye className="w-4 h-4" />
              Ver
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={() => onEdit(equipo)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 
                       text-sm font-medium text-gray-700 bg-gray-50 rounded-lg
                       hover:bg-gray-100 transition-colors duration-200"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(equipo)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 
                       text-sm font-medium text-red-600 bg-red-50 rounded-lg
                       hover:bg-red-100 transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          )}
        </div>
      )}
      
      {/* Observations (if any) */}
      {equipo.observaciones && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
            <span className="font-medium">Obs:</span> {equipo.observaciones}
          </p>
        </div>
      )}
    </div>
  );
};

// Compact version for lists
export const EquipmentCardCompact = ({ 
  equipo,
  onClick,
  className = ''
}) => {
  const getEquipmentIcon = (tipo) => {
    switch (tipo) {
      case 'Equipo': return Radio;
      case 'Batería': return Battery;
      case 'Base Cargadora': return Zap;
      default: return Radio;
    }
  };
  
  const IconComponent = getEquipmentIcon(equipo.tipo);
  
  return (
    <div 
      onClick={onClick ? () => onClick(equipo) : undefined}
      className={`
        bg-white rounded-lg shadow-sm hover:shadow-md 
        transition-all duration-200 border border-gray-100
        hover:border-blue-200 cursor-pointer ${className}
      `}
    >
      <div className="p-3 flex items-center gap-3">
        <div 
          className="p-2 rounded-lg flex-shrink-0"
          style={{ 
            backgroundColor: equipo.tipo === 'Equipo' ? '#EFF6FF' : 
                           equipo.tipo === 'Batería' ? '#ECFDF5' : '#FFFBEB'
          }}
        >
          <IconComponent 
            className="w-4 h-4"
            style={{ 
              color: equipo.tipo === 'Equipo' ? '#3B82F6' : 
                     equipo.tipo === 'Batería' ? '#10B981' : '#F59E0B'
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {equipo.n_inventario}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {equipo.ns || 'Sin serial'}
          </p>
        </div>
        
        <StatusBadge 
          status={equipo.estado || 'activo'} 
          size="sm"
          showDot={false}
        />
      </div>
    </div>
  );
};

export default EquipmentCard;

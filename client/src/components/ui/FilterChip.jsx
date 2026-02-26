import React from 'react';
import { X, Check } from 'lucide-react';

const FilterChip = ({
  label,
  selected = false,
  onClick,
  onClear,
  color = '#3B82F6',
  showClear = false,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
        transition-all duration-200 border-2
        ${selected 
          ? 'text-white shadow-md' 
          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
        ${className}
      `}
      style={selected ? {
        backgroundColor: color,
        borderColor: color
      } : {}}
    >
      {selected && <Check className="w-3.5 h-3.5" />}
      {label}
      
      {showClear && onClear && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className={`
            ml-1 p-0.5 rounded-full transition-colors
            ${selected ? 'hover:bg-white/20' : 'hover:bg-gray-200'}
          `}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </button>
  );
};

// Filter Group Component
export const FilterChipGroup = ({ 
  title,
  options = [],
  selected = null,
  onChange,
  color = '#3B82F6',
  allowClear = true,
  className = ''
}) => {
  const _selectedOption = options.find(opt => opt.value === selected);
  
  return (
    <div className={className}>
      {title && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {title}
        </p>
      )}
      
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={selected === option.value}
            onClick={() => onChange(option.value)}
            color={color}
          />
        ))}
        
        {allowClear && selected && (
          <button
            onClick={() => onChange(null)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
};

// Multi-select Filter Chips
export const FilterChipMulti = ({
  title,
  options = [],
  selected = [],
  onChange,
  color = '#3B82F6',
  className = ''
}) => {
  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };
  
  const clearAll = () => {
    onChange([]);
  };
  
  return (
    <div className={className}>
      {title && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          {selected.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Limpiar ({selected.length})
            </button>
          )}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={selected.includes(option.value)}
            onClick={() => toggleOption(option.value)}
            color={color}
            showClear={selected.includes(option.value)}
          />
        ))}
      </div>
    </div>
  );
};

export default FilterChip;

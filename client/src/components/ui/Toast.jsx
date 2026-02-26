import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// Toast Context for global notifications
const ToastContext = createContext(null);

// Toast Types Configuration
const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    textColor: '#047857',
    iconColor: '#10B981'
  },
  error: {
    icon: AlertCircle,
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    textColor: '#B91C1C',
    iconColor: '#EF4444'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    textColor: '#B45309',
    iconColor: '#F59E0B'
  },
  info: {
    icon: Info,
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    textColor: '#1E40AF',
    iconColor: '#3B82F6'
  }
};

// Individual Toast Component
const Toast = ({ 
  id, 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;
  const IconComponent = config.icon;
  
  // Auto-dismiss
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);
  
  return (
    <div 
      className="
        flex items-start gap-3 p-4 rounded-lg shadow-lg 
        border-l-4 transform transition-all duration-300
        hover:shadow-xl animate-slide-in
      "
      style={{
        backgroundColor: config.bgColor,
        borderLeftColor: config.iconColor,
        minWidth: '300px',
        maxWidth: '400px'
      }}
    >
      <IconComponent 
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        style={{ color: config.iconColor }}
      />
      
      <div className="flex-1 min-w-0">
        {title && (
          <p 
            className="font-semibold text-sm"
            style={{ color: config.textColor }}
          >
            {title}
          </p>
        )}
        {message && (
          <p 
            className="text-sm mt-1"
            style={{ color: config.textColor, opacity: 0.9 }}
          >
            {message}
          </p>
        )}
      </div>
      
      <button
        onClick={() => onClose(id)}
        className="p-1 rounded hover:bg-black/5 transition-colors flex-shrink-0"
      >
        <X 
          className="w-4 h-4"
          style={{ color: config.textColor }}
        />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div 
      className="fixed top-4 right-4 z-50 flex flex-col gap-2"
      style={{ maxWidth: '420px' }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);
  
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  
  const toast = {
    success: (title, message) => addToast({ type: 'success', title, message }),
    error: (title, message) => addToast({ type: 'error', title, message }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
    info: (title, message) => addToast({ type: 'info', title, message })
  };
  
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Simple inline Toast (for use outside provider)
export const InlineToast = ({ 
  type = 'info', 
  title, 
  message, 
  show = true, 
  onClose 
}) => {
  if (!show) return null;
  
  return (
    <Toast 
      id={Date.now()} 
      type={type} 
      title={title} 
      message={message} 
      onClose={onClose || (() => {})}
    />
  );
};

export default Toast;

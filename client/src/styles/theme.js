// client/src/styles/theme.js
// Material Design 3 Color Palette for PZBP Inventory System

export const theme = {
  colors: {
    // Primary Blues
    primary: {
      dark: '#1E40AF',      // Fondos oscuros, headers
      main: '#3B82F6',       // Elementos interactivos principales
      light: '#60A5FA',     // Estados hover
      50: '#EFF6FF',        // Backgrounds muy claros
    },
    
    // Success Greens  
    success: {
      main: '#059669',      // Estados activos
      light: '#10B981',     // Destacados, acentos
      50: '#ECFDF5',        // Backgrounds success
    },
    
    // Warning/Amber
    warning: {
      main: '#D97706',      // Mantenimiento
      light: '#F59E0B',     // Alertas
      50: '#FFFBEB',        // Backgrounds warning
    },
    
    // Danger/Red
    danger: {
      main: '#DC2626',      // Estados críticos
      light: '#EF4444',     // Errores
      50: '#FEF2F2',       // Backgrounds danger
    },
    
    // Neutral Grays
    neutral: {
      900: '#111827',       // Texto primario
      700: '#374151',       // Texto secundario
      500: '#6B7280',       // Texto muted
      400: '#9CA3AF',       // Borders
      300: '#D1D5DB',       // Bordes suaves
      200: '#E5E7EB',       // Backgrounds alternativos
      100: '#F3F4F6',       // Backgrounds muy claros
      50: '#F9FAFB',        // Backgrounds page
    },
    
    // Equipment Type Colors
    equipment: {
      radio: '#3B82F6',     // Equipos de radio - Blue
      battery: '#10B981',   // Baterías - Green  
      charger: '#F59E0B',   // Bases cargadoras - Amber
    },
    
    // Status Colors
    status: {
      activo: '#10B981',    // Verde
      inactivo: '#6B7280',  // Gris
      mantenimiento: '#F59E0B', // Amarillo
      baja: '#EF4444',       // Rojo
    }
  },
  
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },
  
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    }
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
};

// Export individual color sets for convenience
export const {
  colors,
  spacing,
  borderRadius,
  shadows,
  transitions,
  typography,
  breakpoints
} = theme;

export default theme;

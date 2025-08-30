import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import React from 'react';

export interface CustomToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({
  type,
  title,
  message,
  onClose,
  actionLabel,
  onAction,
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgGradient: 'from-emerald-500/20 to-green-600/20',
          borderColor: 'border-emerald-500/30',
          iconColor: 'text-emerald-400',
          titleColor: 'text-emerald-300',
          icon: CheckCircle,
        };
      case 'error':
        return {
          bgGradient: 'from-red-500/20 to-red-600/20',
          borderColor: 'border-red-500/30',
          iconColor: 'text-red-400',
          titleColor: 'text-red-300',
          icon: XCircle,
        };
      case 'warning':
        return {
          bgGradient: 'from-amber-500/20 to-yellow-600/20',
          borderColor: 'border-amber-500/30',
          iconColor: 'text-amber-400',
          titleColor: 'text-amber-300',
          icon: AlertTriangle,
        };
      case 'info':
      default:
        return {
          bgGradient: 'from-blue-500/20 to-blue-600/20',
          borderColor: 'border-blue-500/30',
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-300',
          icon: Info,
        };
    }
  };

  const styles = getTypeStyles();
  const IconComponent = styles.icon;

  return (
    <div
      className={`
        relative bg-gradient-to-r ${styles.bgGradient} 
        border ${styles.borderColor} rounded-xl p-4 
        backdrop-blur-sm min-w-[320px] max-w-[480px]
        shadow-lg shadow-black/20
      `}
    >
      {/* Background overlay for extra depth */}
      <div className="absolute inset-0 bg-adamant-app-box/40 rounded-xl" />

      {/* Content */}
      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${styles.iconColor}`}>
          <IconComponent className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${styles.titleColor} text-sm leading-tight`}>{title}</div>
          {message && (
            <div className="text-white/70 text-xs mt-1 leading-relaxed whitespace-pre-line">
              {message}
            </div>
          )}

          {/* Action button */}
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className={`
                mt-3 px-3 py-1.5 text-xs font-medium rounded-lg
                bg-white/10 hover:bg-white/20 border border-white/20
                text-white transition-all duration-200
                hover:scale-105 active:scale-95
              `}
            >
              {actionLabel}
            </button>
          )}
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Sparkle effect for success/special toasts */}
      {type === 'success' && (
        <>
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/60 rounded-full animate-ping"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default CustomToast;

import React from 'react';
import { BiErrorCircle } from 'react-icons/bi';
import { FiExternalLink } from 'react-icons/fi';

interface ErrorToastProps {
  title: string;
  message: string;
  details?: string | undefined;
  actionLabel?: string | undefined;
  onActionClick?: (() => Promise<void> | void) | undefined;
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  title,
  message,
  details,
  actionLabel,
  onActionClick,
}) => {
  return (
    <div className="flex items-start gap-3 min-w-[300px] max-w-[400px]">
      <BiErrorCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-sm text-gray-300">{message}</div>
        {typeof details === 'string' && details.length > 0 && (
          <div className="text-xs text-gray-400 mt-1">{details}</div>
        )}
        {typeof actionLabel === 'string' &&
          actionLabel.length > 0 &&
          typeof onActionClick === 'function' && (
            <button
              onClick={() => void onActionClick()}
              className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors mt-2"
            >
              {actionLabel}
              <FiExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
      </div>
    </div>
  );
};

export default ErrorToast;

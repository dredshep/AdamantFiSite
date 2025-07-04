import cn from 'classnames';
import React from 'react';

// Validation regex for amount inputs
export const AMOUNT_INPUT_REGEX = /^\d*\.?\d*$/;

// Styled Components
export const InputContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col gap-2.5 bg-adamant-app-input backdrop-blur-sm rounded-lg p-4 border-[1px] border-adamant-app-inputBorder transition-all duration-200 hover:bg-adamant-app-input/70',
      className
    )}
  >
    {children}
  </div>
);

export const InputHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('flex justify-between items-center', className)}>{children}</div>;

export const InputRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('flex items-center gap-4', className)}>{children}</div>;

export const InputField: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { className?: string }
> = ({ className, ...props }) => (
  <input
    className={cn(
      'w-full bg-transparent text-2xl font-light outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-500/50 min-h-[3rem] py-2',
      className
    )}
    {...props}
  />
);

export const TokenSelectorClickable: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className, onClick }) => (
  <div
    className={cn(
      'flex gap-3 items-center rounded-xl text-base font-medium py-1 px-3 bg-adamant-app-selectTrigger min-w-max cursor-pointer hover:bg-adamant-app-selectTrigger/80 transition-colors',
      className
    )}
    onClick={onClick}
  >
    {children}
  </div>
);

export const TokenSelectorStatic: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      'flex gap-3 items-center rounded-xl text-base font-medium py-1 px-3 bg-adamant-app-selectTrigger min-w-max',
      className
    )}
  >
    {children}
  </div>
);

export const LoadingOverlay: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('absolute inset-0 flex items-center', className)}>{children}</div>;

export const LoadingPlaceholder: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('h-8 w-32 bg-white/5 animate-pulse rounded', className)} />
);

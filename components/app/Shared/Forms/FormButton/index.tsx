import React from 'react';
import { twMerge } from 'tailwind-merge';

interface FormButtonProps {
  onClick: () => void;
  text: string;
  disabled?: boolean;
  className?: string;
}

const FormButton: React.FC<FormButtonProps> = ({ onClick, text, disabled = false, className }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={twMerge(
        'w-full py-3 px-4 bg-adamant-app-input/30 backdrop-blur-sm rounded-lg border border-white/5',
        'text-white font-medium transition-all duration-200',
        'hover:enabled:bg-adamant-app-input/40 hover:enabled:border-white/10',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {text}
    </button>
  );
};

export default FormButton;

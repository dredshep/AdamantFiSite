import cn from 'classnames';
import React from 'react';

interface FormButtonProps {
  text: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

const FormButton: React.FC<FormButtonProps> = ({ text, disabled = false, onClick, className }) => {
  return (
    <button
      className={cn({
        'bg-adamant-accentBg hover:brightness-125 transition-all duration-150 ease-in-out hover:saturate-150 active:saturate-200 active:brightness-150':
          !disabled,
        'bg-adamant-app-buttonDisabled cursor-not-allowed': disabled,
        'text-lg rounded-md text-black py-3 font-medium w-full': true,
        className,
      })}
      disabled={disabled}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default FormButton;

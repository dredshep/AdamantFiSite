import React from 'react';
import { twMerge } from 'tailwind-merge';
import { INPUT_STYLES } from '../Input/inputStyles';

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
      className={twMerge(INPUT_STYLES.formButton, className)}
    >
      {text}
    </button>
  );
};

export default FormButton;

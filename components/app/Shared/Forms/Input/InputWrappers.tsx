import React from 'react';
import { twMerge } from 'tailwind-merge';
import { INPUT_STYLES } from './inputStyles';

// Wrapper for info/details containers (like swap details, voice transcript, etc.)
interface InfoContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const InfoContainer: React.FC<InfoContainerProps> = ({ children, className }) => {
  return <div className={twMerge(INPUT_STYLES.infoContainer, className)}>{children}</div>;
};

// Wrapper for small input fields (like slippage input)
interface SmallInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const SmallInput: React.FC<SmallInputProps> = ({ className, ...props }) => {
  return <input className={twMerge(INPUT_STYLES.smallInput, className)} {...props} />;
};

// Wrapper for button containers with input styling
interface ButtonContainerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ButtonContainer: React.FC<ButtonContainerProps> = ({
  children,
  className,
  onClick,
}) => {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      className={twMerge(INPUT_STYLES.buttonContainer, className)}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {children}
    </Component>
  );
};

// Loading placeholder components for different sizes
interface LoadingPlaceholderProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingPlaceholder: React.FC<LoadingPlaceholderProps> = ({
  size = 'small',
  className,
}) => {
  const sizeClass = {
    small: INPUT_STYLES.loadingPlaceholderSmall,
    medium: INPUT_STYLES.loadingPlaceholderMedium,
    large: INPUT_STYLES.loadingPlaceholderLarge,
  }[size];

  return <div className={twMerge(sizeClass, className)} />;
};

// Main input container wrapper
interface InputContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const InputContainer: React.FC<InputContainerProps> = ({ children, className }) => {
  return <div className={twMerge(INPUT_STYLES.container, className)}>{children}</div>;
};

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({
  size = 24,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, size / 12),
      }}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

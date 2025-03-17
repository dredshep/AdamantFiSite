import { useState } from 'react';

interface SparkleButtonProps {
  isActive: boolean;
  onClick: () => void;
}

const SparkleButton = ({ isActive, onClick }: SparkleButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={`
        px-4 py-3 border-2 rounded-lg font-semibold 
        flex gap-2 items-center relative transition-all duration-300
        overflow-hidden transform hover:scale-105
        ${
          isActive
            ? 'border-yellow-300 text-yellow-300 bg-gradient-to-br from-yellow-900/20 to-yellow-800/20'
            : 'border-yellow-500/50 text-yellow-500/70 hover:border-yellow-400 hover:text-yellow-400'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Glittery overlay */}
      <div
        className={`absolute inset-0 sparkle-overlay ${
          isHovered || isActive ? 'sparkle-overlay-hover' : ''
        }`}
      ></div>

      {/* Star particles */}
      {Array.from({ length: isHovered || isActive ? 24 : 8 }, (_, i) => (
        <div
          key={i}
          className="absolute w-[2px] h-[2px] bg-yellow-500/50 rounded-full animate-sparkle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.2}s`,
            opacity: isHovered || isActive ? 0.8 : 0.3,
          }}
        />
      ))}

      {/* Lightning Bolt Icon */}
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>

      {/* Text */}
      <span>Incentivized</span>
    </button>
  );
};

export default SparkleButton;

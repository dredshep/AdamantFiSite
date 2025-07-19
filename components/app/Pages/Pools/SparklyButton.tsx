import { useState } from 'react';

interface SparkleButtonProps {
  isActive: boolean;
  onClick: () => void;
}

const SparkleButton = ({ isActive, onClick }: SparkleButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="flex items-center gap-3 px-1 py-2 transition-all duration-200 hover:scale-[1.02] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Icon with background and intensified sparkle effects */}
      <div className={`
        relative p-2 rounded-lg transition-all duration-200 overflow-hidden border
        ${isActive 
          ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white border-yellow-400' 
          : 'bg-adamant-app-filterBg border-adamant-box-inputBorder text-adamant-text-box-secondary group-hover:border-yellow-400/50 group-hover:text-yellow-400'
        }
      `}>
        {/* Intensified glittery overlay */}
        <div
          className={`absolute inset-0 sparkle-overlay ${
            isHovered || isActive ? 'sparkle-overlay-hover' : ''
          }`}
          style={{
            background: isHovered || isActive 
              ? 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,193,7,0.1) 50%, transparent 100%)'
              : 'none'
          }}
        ></div>

        {/* Intensified star particles */}
        {Array.from({ length: isHovered || isActive ? 16 : 6 }, (_, i) => (
          <div
            key={i}
            className={`absolute rounded-full animate-sparkle ${
              isActive ? 'bg-yellow-300/80' : 'bg-yellow-400/60'
            }`}
            style={{
              width: isActive ? '2px' : '1.5px',
              height: isActive ? '2px' : '1.5px',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.15}s`,
              opacity: isHovered || isActive ? 0.9 : 0.4,
              animationDuration: isActive ? '1.5s' : '2s',
            }}
          />
        ))}

        {/* Lightning Bolt Icon */}
        <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
      
      {/* Label - just text, no background */}
      <span className={`
        font-medium transition-colors duration-200
        ${isActive 
          ? 'text-white' 
          : 'text-adamant-text-box-secondary group-hover:text-yellow-400'
        }
      `}>
        Incentivized
      </span>
    </button>
  );
};

export default SparkleButton;

import * as Tabs from '@radix-ui/react-tabs';
import { useState } from 'react';

interface SparklyTabProps {
  value: string;
  children: React.ReactNode;
}

const SparklyTab = ({ value, children }: SparklyTabProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tabs.Trigger
      value={value}
      className="flex-1 bg-adamant-app-box-lighter px-4 py-4 rounded-xl text-white/75
                 data-[state=active]:text-black data-[state=active]:bg-gradient-to-br 
                 data-[state=active]:from-yellow-300/90 data-[state=active]:to-amber-400/90
                 hover:bg-white/5 transition-all duration-300 font-medium tracking-wide
                 relative overflow-hidden transform hover:scale-105
                 data-[state=active]:border-2 data-[state=active]:border-yellow-300/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glittery overlay - only show when active or hovered */}
      <div
        className={`absolute inset-0 sparkle-overlay ${isHovered ? 'sparkle-overlay-hover' : ''}`}
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
          opacity: isHovered ? 0.6 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Star particles - show more when hovered */}
      {Array.from({ length: isHovered ? 16 : 6 }, (_, i) => (
        <div
          key={i}
          className="absolute w-[1.5px] h-[1.5px] bg-yellow-400/60 rounded-full animate-sparkle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.3}s`,
            opacity: isHovered ? 0.7 : 0.4,
            transition: 'opacity 0.3s ease',
          }}
        />
      ))}

      {/* Content with icon */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {/* Lightning Bolt Icon */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        {children}
      </div>
    </Tabs.Trigger>
  );
};

export default SparklyTab;

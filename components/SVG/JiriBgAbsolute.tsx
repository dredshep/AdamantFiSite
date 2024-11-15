import React, { useEffect, useState } from 'react';

const ResponsiveBackground: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return undefined;
  }, []);

  // Determine if the device is mobile based on width
  const isMobile = windowDimensions.width <= 768;

  // Define positions and sizes based on screen size
  const circle1 = {
    cx: isMobile ? 30 : 20,
    cy: isMobile ? 20 : 15,
    r: isMobile ? 20 : 15,
    color: '#6369FC',
    opacity: 0.6,
    blur: isMobile ? 15 : 10,
  };

  const circle2 = {
    cx: isMobile ? 70 : 80,
    cy: isMobile ? 40 : 35,
    r: isMobile ? 15 : 10,
    color: '#F308FF',
    opacity: 0.1,
    blur: isMobile ? 15 : 5,
  };

  const circle3 = {
    cx: isMobile ? 15 : 10,
    cy: isMobile ? 70 : 65,
    r: isMobile ? 20 : 15,
    color: '#FF082D',
    opacity: 0.6,
    blur: isMobile ? 15 : 10,
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-gray-900 overflow-hidden">
      {/* Background SVG */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="100%" height="100%" fill="#151321" />

        {/* Blurred Circles */}
        <circle
          cx={`${circle1.cx}%`}
          cy={`${circle1.cy}%`}
          r={`${circle1.r}%`}
          fill={circle1.color}
          fillOpacity={circle1.opacity}
          filter="url(#blur1)"
        />
        <circle
          cx={`${circle2.cx}%`}
          cy={`${circle2.cy}%`}
          r={`${circle2.r}%`}
          fill={circle2.color}
          fillOpacity={circle2.opacity}
          filter="url(#blur2)"
        />
        <circle
          cx={`${circle3.cx}%`}
          cy={`${circle3.cy}%`}
          r={`${circle3.r}%`}
          fill={circle3.color}
          fillOpacity={circle3.opacity}
          filter="url(#blur3)"
        />

        {/* Define the blur filters */}
        <defs>
          <filter id="blur1" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={circle1.blur} />
          </filter>
          <filter id="blur2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={circle2.blur} />
          </filter>
          <filter id="blur3" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={circle3.blur} />
          </filter>
        </defs>
      </svg>

      {/* Page Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default ResponsiveBackground;

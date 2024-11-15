import React from 'react';

const ResponsiveBackground: React.FC = () => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900">
      <svg
        className="w-full h-full"
        viewBox="0 0 1920 1263"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_159_16)">
          <rect width="1920" height="1263" fill="white" />
          <rect width="1920" height="1263" fill="#151321" />
          <g opacity="0.3" filter="url(#filter0_f_159_16)">
            <rect x="336" y="160" width="264" height="264" fill="#6369FC" fillOpacity="0.6" />
          </g>
          <g opacity="0.3" filter="url(#filter1_f_159_16)">
            <rect
              x="1983.85"
              y="480"
              width="169"
              height="169"
              transform="rotate(67.2453 1983.85 480)"
              fill="#F308FF"
              fillOpacity="0.8"
            />
          </g>
          <g opacity="0.3" filter="url(#filter2_f_159_16)">
            <rect x="-94" y="785" width="264" height="264" fill="#FF082D" fillOpacity="0.6" />
          </g>
        </g>
        <defs>
          <filter
            id="filter0_f_159_16"
            x="136"
            y="-40"
            width="664"
            height="664"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur_159_16" />
          </filter>
          <filter
            id="filter1_f_159_16"
            x="1628"
            y="280"
            width="621.213"
            height="621.214"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur_159_16" />
          </filter>
          <filter
            id="filter2_f_159_16"
            x="-294"
            y="585"
            width="664"
            height="664"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur_159_16" />
          </filter>
          <clipPath id="clip0_159_16">
            <rect width="1920" height="1263" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};

export default ResponsiveBackground;

import React from 'react';

export interface AdamantFiLogoProps extends React.SVGProps<SVGSVGElement> {
  /**
   * SVG width. Defaults to 96px.
   */
  width?: number | string;
  /**
   * SVG height. If omitted, height scales to preserve aspect ratio.
   */
  height?: number | string;
  /**
   * Fill color. Defaults to white.
   */
  fill?: string;
}

const AdamantFiLogo: React.FC<AdamantFiLogoProps> = ({
  width = 96,
  height,
  fill = '#ffffff',
  className,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1076.65 585.34"
    width={width}
    height={height}
    fill={fill}
    className={className}
    {...props}
  >
    <rect
      x="905.86"
      y="414.55"
      width="260.32"
      height="81.26"
      transform="translate(580.84 1491.2) rotate(-90)"
    />
    <g>
      <polygon points="823.14 585.34 724.4 585.34 667.27 504.08 484.26 243.77 484.21 243.77 427.14 162.51 427.08 162.51 411.57 140.41 362.22 210.61 155.87 504.08 568.53 504.08 625.66 585.34 0 585.34 312.83 140.41 362.22 70.2 411.57 0 468.7 81.26 510.31 140.41 525.82 162.51 525.88 162.51 582.95 243.77 583 243.77 823.14 585.34" />
      <polygon points="1076.65 0 1076.65 81.26 567.43 81.26 510.3 0 1076.65 0" />
      <polygon points="975.43 162.51 975.43 243.77 681.68 243.77 624.55 162.51 975.43 162.51" />
    </g>
  </svg>
);

export default AdamantFiLogo;

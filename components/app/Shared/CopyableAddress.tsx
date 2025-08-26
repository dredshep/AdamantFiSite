import { truncateAddress } from '@/utils/formatters';
import React, { useState } from 'react';
import { HiCheck, HiClipboard } from 'react-icons/hi2';

interface CopyableAddressProps {
  address: string;
  /** Number of characters to show at start (default: 8) */
  startChars?: number;
  /** Number of characters to show at end (default: 6) */
  endChars?: number;
  /** Custom className for styling */
  className?: string;
  /** Show copy icon (default: true) */
  showIcon?: boolean;
  /** Custom aria label */
  ariaLabel?: string;
}

const CopyableAddress: React.FC<CopyableAddressProps> = ({
  address,
  startChars = 8,
  endChars = 6,
  className = '',
  showIcon = true,
  ariaLabel,
}) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
      // Fallback: select text for manual copy
      const selection = window.getSelection();
      const range = document.createRange();
      const textNode = document.createTextNode(address);
      const span = document.createElement('span');
      span.appendChild(textNode);
      span.style.position = 'absolute';
      span.style.left = '-9999px';
      document.body.appendChild(span);
      range.selectNode(span);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.body.removeChild(span);
    }
  };

  const truncatedAddress = truncateAddress(address, startChars, endChars);
  const defaultAriaLabel = `Copy address ${address}`;

  return (
    <button
      onClick={(e) => {
        handleCopy(e).catch((error) => {
          console.error('Error in handleCopy:', error);
        });
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 
        bg-white/5 hover:bg-white/10 
        border border-white/10 hover:border-white/20 
        rounded-md transition-all duration-200
        text-white/90 hover:text-white
        font-mono text-sm
        cursor-pointer select-none
        focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent
        ${className}
      `}
      aria-label={ariaLabel || defaultAriaLabel}
      title={isHovered ? `Click to copy: ${address}` : truncatedAddress}
    >
      <span className="font-mono">{truncatedAddress}</span>

      {showIcon && (
        <span className="flex-shrink-0">
          {copied ? (
            <HiCheck className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <HiClipboard className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          )}
        </span>
      )}
    </button>
  );
};

export default CopyableAddress;

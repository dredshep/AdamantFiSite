// get classnames to modify logo with tailwind

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-10 w-10"}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 27L20 3L32 27" stroke="white" strokeWidth="2" />
      <path d="M20 37L20 4" stroke="white" strokeWidth="2" />
      <path d="M9 26L31 26" stroke="white" strokeWidth="2" />
      <rect
        x="20"
        y="1.41421"
        width="26"
        height="26"
        transform="rotate(45 20 1.41421)"
        stroke="white"
        strokeWidth="2"
      />
    </svg>
  );
}

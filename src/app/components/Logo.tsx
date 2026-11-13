interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 80, className = '' }: LogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 1024 1024"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background with rounded corners */}
        <rect width="1024" height="1024" rx="220" ry="220" fill="#152744" />

        {/* White checkmark */}
        <path
          d="M220 480 L420 700 L780 310"
          stroke="white"
          strokeWidth="110"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Orange dot */}
        <circle cx="720" cy="260" r="95" fill="#F5A623" />
      </svg>
    </div>
  );
}

// Simplified Logo for small sizes
export function LogoMini({ size = 40, className = '' }: LogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 1024 1024"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background with rounded corners */}
        <rect width="1024" height="1024" rx="220" ry="220" fill="#152744" />

        {/* White checkmark */}
        <path
          d="M220 480 L420 700 L780 310"
          stroke="white"
          strokeWidth="110"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Orange dot */}
        <circle cx="720" cy="260" r="95" fill="#F5A623" />
      </svg>
    </div>
  );
}

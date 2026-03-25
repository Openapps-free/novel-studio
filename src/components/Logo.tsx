interface LogoProps {
  size?: number;
}

export function Logo({ size = 48 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        borderRadius: '12px',
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.25)',
      }}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Background gradient overlay */}
      <rect width="48" height="48" rx="12" fill="url(#logoGradient)" />
      
      {/* Pen/Quill icon */}
      <path
        d="M14 34L14 18C14 16.8954 14.8954 16 16 16L32 16L38 22L38 34C38 35.1046 37.1046 36 36 36L16 36C14.8954 36 14 35.1046 14 34Z"
        fill="white"
        fillOpacity="0.95"
      />
      
      {/* Pen tip */}
      <path
        d="M14 18L10 34C9.5 35.5 10.5 37 12 37L14 37L14 18Z"
        fill="#a78bfa"
      />
      
      {/* Ink/creative spark */}
      <circle cx="32" cy="22" r="3" fill="#8b5cf6" />
      
      {/* Subtle shine */}
      <path
        d="M16 16L20 20L18 28C17.5 29 16.5 29 16 28L14 20L16 16Z"
        fill="white"
        fillOpacity="0.3"
      />
    </svg>
  );
}

export function LogoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 17L7 9C7 8.44772 7.44772 8 8 8L16 8L19 11L19 17C19 17.5523 18.5523 18 18 18L8 18C7.44772 18 7 17.5523 7 17Z"
        fill="currentColor"
      />
      <path
        d="M7 9L5 17C4.75 17.75 5.25 18.5 6 18.5L7 18.5L7 9Z"
        fill="var(--accent-secondary)"
      />
    </svg>
  );
}

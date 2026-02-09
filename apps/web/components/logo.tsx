interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-background"
        >
          <path
            d="M9 3h6l5 5v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
            fill="currentColor"
          />
          <path d="M15 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
        </svg>
      </div>
      {showText && (
        <span className="text-lg font-bold tracking-tight">StudyDocs</span>
      )}
    </div>
  );
}

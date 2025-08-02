'use client';

import { useTheme } from '../app/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface text-onSurface border border-divider transition-opacity hover:opacity-70"
      aria-label="Toggle theme"
    >
      {theme === 'light' 
        ? (
          <>
            {/* Light Mode Icon: Outlined Pickleball */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="7" r="1" />
              <circle cx="12" cy="17" r="1" />
              <circle cx="7" cy="12" r="1" />
              <circle cx="17" cy="12" r="1" />
            </svg>
            <span className="text-sm font-medium">Dark Mode</span>
          </>
        ) 
        : (
          <>
            {/* Dark Mode Icon: Solid Pickleball */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="text-sm font-medium">Light Mode</span>
          </>
        )
      }
    </button>
  );
}
// components/Icons.tsx

export const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  );
  
  export const ScoresIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
    </svg>
  );
  
  export const TrophyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h1a1 1 0 0 1 1 1v5a3 3 0 0 1-3 3V19a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-6a3 3 0 0 1-3-3V5a1 1 0 0 1 1-1h1z"/>
    </svg>
  );
  
  export const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
    </svg>
  );
  
  export const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  );
  
  export const DeleteIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  );

  export const Logo = () => (
    <svg viewBox="0 0 40 40" className="w-24 h-24">
      <circle cx="20" cy="20" r="20" fill="#16a34a" />
      <path
        d="M23 11a6 6 0 0 1 0 12h-6v-2l6-10z"
        fill="white"
      />
    </svg>
  );

  export const PickleballIcon = ({ 
    className = '', 
    style 
  }: { 
    className?: string; 
    style?: React.CSSProperties;
  }) => (
    <svg 
      className={className}
      style={style}
      viewBox="0 0 24 24" 
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pickleball circle */}
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      {/* Holes pattern */}
      <circle cx="8" cy="8" r="1.5" fill="#000000" />
      <circle cx="16" cy="8" r="1.5" fill="#000000" />
      <circle cx="12" cy="12" r="1.5" fill="#000000" />
      <circle cx="8" cy="16" r="1.5" fill="#000000" />
      <circle cx="16" cy="16" r="1.5" fill="#000000" />
    </svg>
  );
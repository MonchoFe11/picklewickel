'use client';
import { useRef, useEffect } from 'react';

interface DateRailProps {
  dates: string[];
  active: string;
  onSelect: (d: string) => void;
  formatDateLabel: (dateString: string) => string;
  dateRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}

export default function DateRail({ dates, active, onSelect, formatDateLabel, dateRefs }: DateRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  /** Helpers for desktop arrow buttons */
  const scrollBy = (delta: number) =>
    railRef.current?.scrollBy({ left: delta, behavior: 'smooth' });

  return (
    <div className="relative border-b border-divider bg-surface">
      {/* ← arrow (hidden on mobile) */}
      <button
        onClick={() => scrollBy(-120)}
        className="hidden md:flex absolute left-0 top-0 bottom-0 w-8 items-center justify-center z-10 bg-gradient-to-r from-surface/80 text-onSurface"
      >
        ‹
      </button>

      {/* scroll container - increased touch area */}
      <div
        ref={railRef}
        data-date-rail-container
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory px-8 md:px-12 space-x-6 py-6"
        style={{ 
          minHeight: '60px',
          touchAction: 'pan-x pinch-zoom' 
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {dates.map(d => {
          const label = formatDateLabel(d);
          const isActive = d === active;
          return (
            <button
              key={d}
              data-date={d}
              ref={(el) => {
                if (el) {
                  dateRefs.current.set(d, el);
                }
              }}
              onClick={() => onSelect(d)}
              className={`snap-start whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 ${
                isActive ? 'text-onSurface' : 'text-onSurface/60'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* → arrow */}
      <button
        onClick={() => scrollBy(120)}
        className="hidden md:flex absolute right-0 top-0 bottom-0 w-8 items-center justify-center z-10 bg-gradient-to-l from-surface/80 text-onSurface"
      >
        ›
      </button>
    </div>
  );
}
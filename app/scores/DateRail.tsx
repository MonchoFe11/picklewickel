'use client';
import { useRef, useEffect } from 'react';

interface DateRailProps {
  dates: string[];
  active: string;
  onSelect: (d: string) => void;
  formatDateLabel: (dateString: string) => string;
}

export default function DateRail({ dates, active, onSelect, formatDateLabel }: DateRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  /** Scroll the active pill into center view on mount / active change */
  useEffect(() => {
    const el = railRef.current?.querySelector<HTMLButtonElement>(
      `[data-date="${active}"]`,
    );
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

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
              onClick={() => onSelect(d)}
              className={`snap-start whitespace-nowrap text-sm md:text-base font-medium tracking-wide transition-colors px-3 py-2 ${
                isActive
                  ? 'text-accent border-b-2 border-accent pb-1 bg-surface-light'
                  : 'text-onSurface/60 hover:text-onSurface hover:bg-surface-light pb-1'
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
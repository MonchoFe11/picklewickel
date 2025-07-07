'use client';

interface DrawFilterProps {
  drawNames: string[];
  activeDraw: string;
  onSelectDraw: (draw: string) => void;
}

export default function DrawFilter({ drawNames, activeDraw, onSelectDraw }: DrawFilterProps) {
  const allDraws = ['All', ...drawNames];

  return (
    <div className="px-4 py-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {allDraws.map((draw) => (
          <button
            key={draw}
            onClick={() => onSelectDraw(draw)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeDraw === draw
                ? 'bg-onSurface text-surface'
                : 'bg-surface-light text-onSurface/60 hover:bg-surface-light hover:text-onSurface'
            }`}
          >
            {draw}
          </button>
        ))}
      </div>
    </div>
  );
}
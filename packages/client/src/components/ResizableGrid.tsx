import { useState, useCallback, useRef } from 'react';
import type { SlotState } from '@orbit/shared';

interface ResizableGridProps {
  slots: SlotState[];
  renderSlot: (slot: SlotState, index: number) => React.ReactNode;
}

export function ResizableGrid({ slots, renderSlot }: ResizableGridProps) {
  const [colSplit, setColSplit] = useState(50); // percentage for left column
  const [rowSplit, setRowSplit] = useState(50); // percentage for top row
  const containerRef = useRef<HTMLDivElement>(null);

  const handleColDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const startX = e.clientX;
    const startSplit = colSplit;
    const rect = container.getBoundingClientRect();

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const pct = startSplit + (dx / rect.width) * 100;
      setColSplit(Math.max(20, Math.min(80, pct)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [colSplit]);

  const handleRowDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const startY = e.clientY;
    const startSplit = rowSplit;
    const rect = container.getBoundingClientRect();

    const onMove = (ev: MouseEvent) => {
      const dy = ev.clientY - startY;
      const pct = startSplit + (dy / rect.height) * 100;
      setRowSplit(Math.max(20, Math.min(80, pct)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [rowSplit]);

  return (
    <div ref={containerRef} className="h-full p-1 relative" style={{ display: 'grid', gridTemplateColumns: `${colSplit}% 6px 1fr`, gridTemplateRows: `${rowSplit}% 6px 1fr`, gap: 0 }}>
      {/* Slot 0 - top left */}
      <div className="overflow-hidden min-h-0 min-w-0">{renderSlot(slots[0], 0)}</div>

      {/* Vertical divider (top) */}
      <div className="cursor-col-resize flex items-center justify-center hover:bg-primary/20 transition-colors" onMouseDown={handleColDrag} style={{ gridRow: '1' }}>
        <div className="w-[2px] h-8 bg-border rounded-full" />
      </div>

      {/* Slot 1 - top right */}
      <div className="overflow-hidden min-h-0 min-w-0">{renderSlot(slots[1], 1)}</div>

      {/* Horizontal divider */}
      <div className="cursor-row-resize flex items-center justify-center hover:bg-primary/20 transition-colors" onMouseDown={handleRowDrag} style={{ gridColumn: '1' }}>
        <div className="h-[2px] w-8 bg-border rounded-full" />
      </div>

      {/* Center intersection */}
      <div className="cursor-move" onMouseDown={(e) => { handleColDrag(e); handleRowDrag(e); }} />

      {/* Horizontal divider (right) */}
      <div className="cursor-row-resize flex items-center justify-center hover:bg-primary/20 transition-colors" onMouseDown={handleRowDrag} style={{ gridColumn: '3' }}>
        <div className="h-[2px] w-8 bg-border rounded-full" />
      </div>

      {/* Slot 2 - bottom left */}
      <div className="overflow-hidden min-h-0 min-w-0">{renderSlot(slots[2], 2)}</div>

      {/* Vertical divider (bottom) */}
      <div className="cursor-col-resize flex items-center justify-center hover:bg-primary/20 transition-colors" onMouseDown={handleColDrag} style={{ gridRow: '3' }}>
        <div className="w-[2px] h-8 bg-border rounded-full" />
      </div>

      {/* Slot 3 - bottom right */}
      <div className="overflow-hidden min-h-0 min-w-0">{renderSlot(slots[3], 3)}</div>
    </div>
  );
}

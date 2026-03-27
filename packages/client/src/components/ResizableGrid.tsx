import { useState, useCallback, useRef } from 'react';
import type { SlotState } from '@orbit/shared';

interface ResizableGridProps {
  slots: SlotState[];
  renderSlot: (slot: SlotState, index: number) => React.ReactNode;
}

export function ResizableGrid({ slots, renderSlot }: ResizableGridProps) {
  const [colPct, setColPct] = useState(50);
  const [rowPct, setRowPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const startDrag = useCallback((axis: 'col' | 'row', e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cursor = axis === 'col' ? 'col-resize' : 'row-resize';
    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (axis === 'col') {
        const pct = ((ev.clientX - rect.left) / rect.width) * 100;
        setColPct(Math.max(15, Math.min(85, pct)));
      } else {
        const pct = ((ev.clientY - rect.top) / rect.height) * 100;
        setRowPct(Math.max(15, Math.min(85, pct)));
      }
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // Use calc to split available space minus the 4px divider
  const cols = `calc(${colPct}% - 2px) 4px calc(${100 - colPct}% - 2px)`;
  const rows = `calc(${rowPct}% - 2px) 4px calc(${100 - rowPct}% - 2px)`;

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ display: 'grid', gridTemplateColumns: cols, gridTemplateRows: rows }}
    >
      {/* Row 1 */}
      <div className="overflow-hidden min-h-0 min-w-0">{renderSlot(slots[0], 0)}</div>
      <div className="cursor-col-resize hover:bg-primary/20 transition-colors" onMouseDown={(e) => startDrag('col', e)} />
      <div className="overflow-hidden min-h-0 min-w-0">{renderSlot(slots[1], 1)}</div>

      {/* Divider row */}
      <div className="cursor-row-resize hover:bg-primary/20 transition-colors" onMouseDown={(e) => startDrag('row', e)} />
      <div className="cursor-move hover:bg-primary/30 transition-colors" onMouseDown={(e) => { startDrag('col', e); startDrag('row', e); }} />
      <div className="cursor-row-resize hover:bg-primary/20 transition-colors" onMouseDown={(e) => startDrag('row', e)} />

      {/* Row 2 */}
      <div className="overflow-hidden min-h-0 min-w-0">{renderSlot(slots[2], 2)}</div>
      <div className="cursor-col-resize hover:bg-primary/20 transition-colors" onMouseDown={(e) => startDrag('col', e)} />
      <div className="overflow-hidden min-h-0 min-w-0">{renderSlot(slots[3], 3)}</div>
    </div>
  );
}

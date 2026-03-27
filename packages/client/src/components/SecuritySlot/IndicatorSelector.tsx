import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface IndicatorSelectorProps {
  selected: string[];
  onChange: (indicators: string[]) => void;
}

const INDICATORS = [
  { id: 'sma20', label: 'SMA(20)' },
  { id: 'ema12', label: 'EMA(12)' },
  { id: 'ema26', label: 'EMA(26)' },
  { id: 'rsi', label: 'RSI(14)' },
  { id: 'macd', label: 'MACD' },
  { id: 'bb', label: 'Bollinger' },
] as const;

export function IndicatorSelector({ selected, onChange }: IndicatorSelectorProps) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div className="flex items-center gap-3">
      {INDICATORS.map((ind) => (
        <Label key={ind.id} className="flex items-center gap-1 cursor-pointer text-[9px] font-mono text-on-surface-variant uppercase tracking-wider">
          <Switch
            size="sm"
            checked={selected.includes(ind.id)}
            onCheckedChange={() => toggle(ind.id)}
          />
          {ind.label}
        </Label>
      ))}
    </div>
  );
}

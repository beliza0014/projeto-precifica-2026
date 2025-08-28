import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Granularity } from "@/utils/faturamentoUtils";

interface GranularitySelectorProps {
  granularity: Granularity;
  onGranularityChange: (granularity: Granularity) => void;
}

const granularityOptions: Array<{ value: Granularity; label: string }> = [
  { value: 'MONTH', label: 'Mês' },
  { value: 'YEAR', label: 'Ano' }
];

export function GranularitySelector({ granularity, onGranularityChange }: GranularitySelectorProps) {
  // Se a granularidade for WEEK ou DAY, muda automaticamente para MONTH
  useEffect(() => {
    if (granularity === 'WEEK' || granularity === 'DAY') {
      onGranularityChange('MONTH');
    }
  }, [granularity, onGranularityChange]);
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-foreground whitespace-nowrap">
        Visualização:
      </label>
      <Select value={granularity} onValueChange={onGranularityChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {granularityOptions.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
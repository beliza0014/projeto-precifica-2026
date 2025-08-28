import { Button } from "@/components/ui/button";
import { PresetType } from "@/hooks/useFaturamentoDiario";

interface PresetFiltersProps {
  selectedPreset: PresetType;
  onPresetChange: (preset: PresetType) => void;
}

const presets: Array<{ key: PresetType; label: string }> = [
  { key: 'currentMonth', label: 'Mês atual' },
  { key: 'last3months', label: 'Últimos 3 meses' },
  { key: 'custom', label: 'Período Personalizado' }
];

export function PresetFilters({ selectedPreset, onPresetChange }: PresetFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map(({ key, label }) => (
        <Button
          key={key}
          variant={selectedPreset === key ? "default" : "outline"}
          size="sm"
          onClick={() => onPresetChange(key)}
          className="whitespace-nowrap transition-all duration-200"
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
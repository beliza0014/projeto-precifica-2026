import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { DateRange, isValidDateRange, toISODate, fromISODate } from "@/utils/dateUtils";

interface CustomDateRangeProps {
  isVisible: boolean;
  currentRange: DateRange;
  isLoading: boolean;
  onRangeUpdate: (range: DateRange) => Promise<void>;
}

export function CustomDateRange({ 
  isVisible, 
  currentRange, 
  isLoading, 
  onRangeUpdate 
}: CustomDateRangeProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    currentRange.start ? fromISODate(currentRange.start) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    currentRange.end ? fromISODate(currentRange.end) : undefined
  );
  const [error, setError] = useState<string>("");

  if (!isVisible) return null;

  const handleUpdate = async () => {
    if (!startDate || !endDate) {
      setError("Selecione os meses de início e fim");
      return;
    }

    // Converter para primeiro e último dia do mês
    const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); // último dia do mês

    const startISO = toISODate(startMonth);
    const endISO = toISODate(endMonth);

    if (startMonth > endMonth) {
      setError("O mês de início deve ser anterior ou igual ao mês final.");
      return;
    }

    setError("");
    await onRangeUpdate({ start: startISO, end: endISO });
  };

  const isUpdateDisabled = !startDate || !endDate || isLoading;

  return (
    <Card className="financial-card">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Mês/Ano Inicial
              </label>
              <MonthYearPicker
                date={startDate}
                onSelect={setStartDate}
                placeholder="Selecione o mês/ano inicial"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Mês/Ano Final
              </label>
              <MonthYearPicker
                date={endDate}
                onSelect={setEndDate}
                placeholder="Selecione o mês/ano final"
                className="w-full"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-center md:justify-end">
            <Button
              onClick={handleUpdate}
              disabled={isUpdateDisabled}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[120px] transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
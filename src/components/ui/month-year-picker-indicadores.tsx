import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DateRange {
  start: Date;
  end: Date;
}

interface MonthYearPickerIndicadoresProps {
  isVisible: boolean;
  currentRange?: DateRange;
  isLoading: boolean;
  onRangeUpdate: (range: DateRange) => Promise<void>;
}

export function MonthYearPickerIndicadores({
  isVisible,
  currentRange,
  isLoading,
  onRangeUpdate
}: MonthYearPickerIndicadoresProps) {
  const [startDate, setStartDate] = useState<Date>(
    currentRange?.start || new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1)
  );
  const [endDate, setEndDate] = useState<Date>(
    currentRange?.end || new Date()
  );
  const [error, setError] = useState<string>("");

  if (!isVisible) return null;

  const handleUpdate = async () => {
    setError("");

    // Criar datas do primeiro dia do mês inicial ao último dia do mês final
    const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endOfMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

    // Validações
    if (startOfMonth > endOfMonth) {
      setError("A data inicial deve ser anterior à data final.");
      return;
    }

    // Calcular diferença em meses
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth()) + 1;

    if (monthsDiff < 3) {
      setError("O período deve ter no mínimo 3 meses.");
      return;
    }

    if (monthsDiff > 12) {
      setError("O período não pode ultrapassar 12 meses (1 ano).");
      return;
    }

    await onRangeUpdate({
      start: startOfMonth,
      end: endOfMonth
    });
  };

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Mês/Ano Inicial</label>
              <MonthYearPicker
                date={startDate}
                onSelect={setStartDate}
                placeholder="Selecione o início"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mês/Ano Final</label>
              <MonthYearPicker
                date={endDate}
                onSelect={setEndDate}
                placeholder="Selecione o fim"
              />
            </div>
          </div>

          {error && (
            <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpdate}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              "Aplicar Período"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
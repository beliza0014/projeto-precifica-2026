import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2, PlusCircle, HelpCircle } from "lucide-react";
import { toISODate, fromISODate } from "@/utils/dateUtils";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type EntryType = 'monthly';

interface ManualInputSectionProps {
  isLoading: boolean;
  onAddEntry: (data: string, valor: number, isMonthly?: boolean) => Promise<void>;
  onTypeChange?: (type: 'monthly') => void;
}

export function ManualInputSection({ isLoading, onAddEntry, onTypeChange }: ManualInputSectionProps) {
  const [entryType, setEntryType] = useState<EntryType>('monthly');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedMonthYear, setSelectedMonthYear] = useState<Date | undefined>();
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const formatInputValue = (value: string): string => {
    // Remove tudo exceto números, vírgulas e pontos
    let cleaned = value.replace(/[^\d,.]/g, '');
    
    // Permite apenas uma vírgula decimal
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }
    
    return cleaned;
  };

  const parseInputValue = (inputStr: string): number => {
    if (!inputStr || inputStr.trim() === '') return 0;
    
    // Remove pontos (separadores de milhares) e converte vírgula para ponto decimal
    const normalizedValue = inputStr
      .replace(/\./g, '') // Remove pontos
      .replace(',', '.'); // Converte vírgula para ponto
    
    const numericValue = parseFloat(normalizedValue);
    return isNaN(numericValue) ? 0 : Math.max(0, numericValue); // Previne valores negativos
  };

  const handleInputChange = (value: string) => {
    const formatted = formatInputValue(value);
    setInputValue(formatted);
    setError("");
  };

  const handleSave = async () => {
    const valor = parseInputValue(inputValue);
    if (valor <= 0) {
      setError("Insira um valor válido maior que zero");
      return;
    }

    // Lançamento mensal
    if (!selectedMonthYear) {
      setError("Selecione um mês/ano");
      return;
    }

    // Verificar se não é mês futuro
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const selectedMonth = new Date(selectedMonthYear.getFullYear(), selectedMonthYear.getMonth(), 1);
    
    if (selectedMonth > currentMonth) {
      setError("Não é possível inserir faturamento para meses futuros");
      return;
    }

    try {
      const monthYear = `${selectedMonthYear.getFullYear()}-${String(selectedMonthYear.getMonth() + 1).padStart(2, '0')}`;
      await onAddEntry(monthYear, valor, true);
      
      // Limpar formulário
      setSelectedMonthYear(undefined);
      setInputValue("");
      setError("");
      
      toast({
        title: "Faturamento mensal salvo",
        description: `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrado para ${selectedMonthYear.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setError("Erro ao salvar. Tente novamente.");
    }
  };

  const isFormValid = (
    selectedMonthYear && 
    inputValue && 
    parseInputValue(inputValue) > 0
  );

  return (
    <TooltipProvider>
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Inserir Faturamento Manual
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-sm">
                  <p className="text-sm">
                    Informe o mês, o ano e o valor faturado já finalizados para registrar o faturamento no período selecionado.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Lançamento</Label>
              <Select value={entryType} onValueChange={(value: EntryType) => {
                setEntryType(value);
                onTypeChange?.(value);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-date">Mês/Ano</Label>
              <MonthYearPicker
                date={selectedMonthYear}
                onSelect={setSelectedMonthYear}
                placeholder="Selecione o mês/ano"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manual-value">Valor</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                  R$
                </span>
                <Input
                  id="manual-value"
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="pl-10"
                  placeholder="Digite o valor"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            disabled={!isFormValid || isLoading}
            className="bg-green-600 hover:bg-green-700 text-white transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
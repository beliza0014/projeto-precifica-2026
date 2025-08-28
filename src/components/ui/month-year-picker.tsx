import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthYearPickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MonthYearPicker({
  date,
  onSelect,
  placeholder = "Selecione mês/ano",
  className,
  disabled = false,
}: MonthYearPickerProps) {
  const [selectedMonth, setSelectedMonth] = React.useState<string>(
    date ? String(date.getMonth()) : ""
  );
  const [selectedYear, setSelectedYear] = React.useState<string>(
    date ? String(date.getFullYear()) : ""
  );

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const currentYear = new Date().getFullYear();
  // Gerar anos de 1900 até 100 anos no futuro (praticamente infinito)
  const startYear = 1900;
  const endYear = currentYear + 100;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();

  const handleApply = () => {
    if (selectedMonth !== "" && selectedYear !== "") {
      const newDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
      onSelect?.(newDate);
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (selectedYear !== "") {
      const newDate = new Date(parseInt(selectedYear), parseInt(month), 1);
      onSelect?.(newDate);
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (selectedMonth !== "") {
      const newDate = new Date(parseInt(year), parseInt(selectedMonth), 1);
      onSelect?.(newDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MMMM yyyy", { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mês</label>
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={String(index)}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Ano</label>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
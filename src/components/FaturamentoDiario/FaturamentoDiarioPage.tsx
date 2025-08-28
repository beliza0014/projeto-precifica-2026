import { Banknote, TrendingUp, Calendar, BarChart3, HelpCircle } from "lucide-react";
import { FinancialCard } from "@/components/FinancialCard";
import { LoadingOptimizer } from "@/components/LoadingOptimizer";
import { useFaturamentoDiario } from "@/hooks/useFaturamentoDiario";
import { FilterType } from "@/utils/faturamentoUtils";
import { PresetFilters } from "./PresetFilters";
import { CustomDateRange } from "./CustomDateRange";
import { GranularitySelector } from "./GranularitySelector";
import { ManualInputSection } from "./ManualInputSection";
import { FaturamentoChart } from "./FaturamentoChart";
import { formatCurrency } from "@/utils/faturamentoUtils";
import { formatDateForDisplay } from "@/utils/dateUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
export default function FaturamentoDiarioPage() {
  const {
    selectedPreset,
    customRange,
    granularity,
    isLoading,
    aggregatedData,
    currentRange,
    filterType,
    updatePreset,
    updateCustomRange,
    updateGranularity,
    updateFilterType,
    addManualEntry
  } = useFaturamentoDiario();

  // Calcular estatísticas
  const {
    total: totalFaturado
  } = aggregatedData;
  const {
    series
  } = aggregatedData;
  const periodosComFaturamento = series.filter(s => s.total > 0).length;
  const mediaPorPeriodo = periodosComFaturamento > 0 ? totalFaturado / periodosComFaturamento : 0;
  const getGranularityLabel = () => {
    switch (granularity) {
      case 'DAY':
        return 'dias';
      case 'WEEK':
        return 'semanas';
      case 'MONTH':
        return 'meses';
      case 'YEAR':
        return 'anos';
      default:
        return 'períodos';
    }
  };
  return <TooltipProvider>
    <LoadingOptimizer>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              Faturamento
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-6 w-6 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-md">
                    <p className="text-sm font-semibold mb-2 text-amber-600">ATENÇÃO!</p>
                    <p className="text-sm">
                      Preencha os dados corretamente. Essas informações não servem apenas para controle — elas são utilizadas pelo sistema para calcular o CMV% e as margens, contribuindo diretamente para a precificação correta dos produtos.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </h1>
            <p className="text-muted-foreground">Análise inteligente de faturamento.</p>
          </div>
        </div>

      {/* Controles de Filtro */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <PresetFilters selectedPreset={selectedPreset} onPresetChange={updatePreset} />
          
          <GranularitySelector granularity={granularity} onGranularityChange={updateGranularity} />
        </div>

        <CustomDateRange isVisible={selectedPreset === 'custom'} currentRange={currentRange} isLoading={isLoading} onRangeUpdate={updateCustomRange} />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinancialCard title="Total do Período" value={formatCurrency(totalFaturado)} subtitle={`${formatDateForDisplay(currentRange.start)} a ${formatDateForDisplay(currentRange.end)}`} icon={<Banknote className="h-5 w-5" />} variant={totalFaturado > 0 ? "success" : "default"} />
        
        <FinancialCard title={`Média por ${granularity === 'DAY' ? 'Dia' : granularity === 'WEEK' ? 'Semana' : granularity === 'MONTH' ? 'Mês' : 'Ano'}`} value={formatCurrency(mediaPorPeriodo)} subtitle={`Baseado em ${periodosComFaturamento} ${getGranularityLabel()} com faturamento`} icon={<TrendingUp className="h-5 w-5" />} variant={mediaPorPeriodo > 0 ? "success" : "default"} />
        
        <FinancialCard title={`${granularity === 'DAY' ? 'Dias' : granularity === 'WEEK' ? 'Semanas' : granularity === 'MONTH' ? 'Meses' : 'Anos'} Ativos`} value={periodosComFaturamento.toString()} subtitle={`de ${series.length} ${getGranularityLabel()} no período`} icon={<Calendar className="h-5 w-5" />} variant={periodosComFaturamento > Math.floor(series.length / 2) ? "success" : "warning"} />
      </div>

      {/* Gráfico */}
      <FaturamentoChart data={aggregatedData} granularity={granularity} isLoading={isLoading} filterType={filterType} />

      {/* Seção de Input Manual */}
      <ManualInputSection isLoading={isLoading} onAddEntry={addManualEntry} onTypeChange={type => updateFilterType(type)} />

      {/* Resumo Detalhado */}
      {series.length > 0 && <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resumo do Período
              </h3>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(totalFaturado)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDateForDisplay(currentRange.start)} a {formatDateForDisplay(currentRange.end)}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">Performance</h3>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  • Média por {granularity === 'DAY' ? 'dia' : granularity === 'WEEK' ? 'semana' : granularity === 'MONTH' ? 'mês' : 'ano'}: 
                  <span className="font-semibold text-primary ml-1">
                    {formatCurrency(mediaPorPeriodo)}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  • {getGranularityLabel()} com faturamento: 
                  <span className="font-semibold text-primary ml-1">
                    {periodosComFaturamento} de {series.length}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  • Taxa de atividade: 
                  <span className="font-semibold text-primary ml-1">
                    {series.length > 0 ? Math.round(periodosComFaturamento / series.length * 100) : 0}%
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>}
    </div>
  </LoadingOptimizer>
  </TooltipProvider>;
}
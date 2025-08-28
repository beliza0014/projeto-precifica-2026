import React, { useState, useMemo } from "react";
import { Calendar as CalendarIcon, TrendingUp, Target, Trophy, Filter, BarChart3, GitCompare, CalendarDays, Loader2, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ComposedChart, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Bar, ReferenceArea, ReferenceLine, LabelList } from "recharts";
import { FinancialCard } from "@/components/FinancialCard";
import { CMVRankingCard } from "@/components/CMVRankingCard";
import { useIndicatorsData } from "@/hooks/useIndicatorsData";
import { MonthYearPickerIndicadores } from "@/components/ui/month-year-picker-indicadores";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const chartConfig = {
  cogs: {
    label: "CMV %",
    color: "hsl(217 91% 60%)",
  },
  cogsPrevious: {
    label: "CMV % Período Anterior",
    color: "hsl(217 33% 50%)",
  },
  revenue: {
    label: "Faturamento",
    color: "hsl(142 71% 45%)",
  },
  margin: {
    label: "Margem %",
    color: "hsl(142 71% 45%)",
  },
};

export default function Indicadores() {
  const [selectedPeriod, setSelectedPeriod] = useState("3months");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [showComparison, setShowComparison] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  
  // Custom date range states
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [isApplyingCustomDates, setIsApplyingCustomDates] = useState(false);

  // Calculate filter dates
  const getFilterDates = (period: string) => {
    if (period === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: customStartDate.toISOString().split('T')[0],
        endDate: customEndDate.toISOString().split('T')[0]
      };
    }
    
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      default:
        startDate.setMonth(now.getMonth() - 3);
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  };

  const handleApplyCustomDates = async (range: { start: Date; end: Date }) => {
    setIsApplyingCustomDates(true);
    
    setCustomStartDate(range.start);
    setCustomEndDate(range.end);
    setIsApplyingCustomDates(false);
  };
  
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
  };

  const { startDate, endDate } = getFilterDates(selectedPeriod);

  const {
    totals,
    top5Products,
    bestCMVs,
    worstCMVs,
    timeSeriesData,
    getCOGSClassification,
    getMarginClassification,
    isLoading,
    hasSalesData,
    hasAnyData
  } = useIndicatorsData({
    startDate,
    endDate,
    channel: selectedChannel === 'all' ? undefined : selectedChannel
  });

  const cogsClass = getCOGSClassification(totals.weightedCOGS);
  const marginClass = getMarginClassification(totals.grossMargin);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Indicadores</h1>
          <p className="text-muted-foreground">
            Métricas globais de performance do estabelecimento
          </p>
          {hasSalesData && (
            <div className="mt-2">
              <Badge variant="default" className="bg-green-500/15 text-green-500">
                Dados reais • {totals.totalItems} produtos analisados
              </Badge>
            </div>
          )}
          {!hasSalesData && hasAnyData && (
            <div className="mt-2">
              <Badge variant="outline" className="bg-blue-500/15 text-blue-500">
                Simulação • {totals.totalItems} produtos cadastrados
              </Badge>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filtros:</span>
          </div>

          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>


          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os canais</SelectItem>
              <SelectItem value="balcao">Balcão</SelectItem>
              <SelectItem value="ifood">iFood</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="cartao">Cartão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Date Range */}
      <MonthYearPickerIndicadores
        isVisible={selectedPeriod === 'custom'}
        currentRange={customStartDate && customEndDate ? { start: customStartDate, end: customEndDate } : undefined}
        isLoading={isApplyingCustomDates}
        onRangeUpdate={handleApplyCustomDates}
      />

      {/* Warnings Section */}
      {totals.warnings.length > 0 && (
        <div className="space-y-3">
          {totals.warnings.map((warning, index) => (
            <Alert key={index} className="border-orange-200 bg-orange-50/80 dark:border-orange-800 dark:bg-orange-950/20">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                {warning}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Period Info */}
      {totals.monthsCount > 0 && (
        <div className="mb-4">
          <Alert className="border-blue-200 bg-blue-50/80 dark:border-blue-800 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Período considerado: {totals.monthsCount} mês{totals.monthsCount > 1 ? 'es' : ''} com dados de faturamento.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <FinancialCard
          title="CMV Médio Ponderado"
          value={totals.isValidPeriod ? `${totals.weightedCOGS.toFixed(1)}%` : "N/A"}
          subtitle={totals.isValidPeriod ? `${cogsClass.status} - Ponderado por faturamento` : "Período insuficiente para cálculo"}
          icon={<Target className="h-5 w-5" />}
          variant={totals.isValidPeriod ? cogsClass.variant : "default"}
        />

        <FinancialCard
          title="Margem Bruta Média"
          value={totals.isValidPeriod ? `${totals.grossMargin.toFixed(1)}%` : "N/A"}
          subtitle={totals.isValidPeriod ? `${marginClass.status} - Lucro antes de custos fixos` : "Baseado no CMV ponderado"}
          icon={<TrendingUp className="h-5 w-5" />}
          variant={totals.isValidPeriod ? marginClass.variant : "default"}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <FinancialCard
          title="Faturamento Total"
          value={`R$ ${totals.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Receita bruta do período"
          icon={<BarChart3 className="h-5 w-5" />}
          variant="default"
        />
        <FinancialCard
          title="Custo Total"
          value={`R$ ${totals.totalCOGS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="CMV do período"
          icon={<Target className="h-5 w-5" />}
          variant="default"
        />
        <FinancialCard
          title="Lucro Bruto"
          value={`R$ ${(totals.totalRevenue - totals.totalCOGS).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Antes de custos fixos"
          icon={<Trophy className="h-5 w-5" />}
          variant="success"
        />
      </div>

      {/* Trend Chart */}
      <Card className="financial-card-elevated overflow-hidden bg-gradient-to-br from-card via-card to-card/90 border-2 border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Evolução CMV% no Tempo
                </span>
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  Margem atual: <span className="text-success font-semibold">{totals.grossMargin.toFixed(1)}%</span>
                </div>
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {isLoading ? (
            <div className="h-[350px] relative">
              <Skeleton className="h-full w-full rounded-xl bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
            </div>
          ) : !hasAnyData ? (
            <div className="h-[350px] flex items-center justify-center bg-gradient-to-br from-muted/20 to-transparent rounded-xl border border-dashed border-border/50">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground font-medium">Não há dados suficientes para calcular os indicadores</p>
                <p className="text-muted-foreground/70 text-sm mt-1">Adicione variações na aba Variações ou vendas na aba Vendas</p>
              </div>
            </div>
          ) : timeSeriesData.length === 0 ? (
            <div className="h-[350px] flex items-center justify-center bg-gradient-to-br from-muted/20 to-transparent rounded-xl border border-dashed border-border/50">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground font-medium">Sem dados de vendas para gráfico temporal</p>
                <p className="text-muted-foreground/70 text-sm mt-1">Adicione vendas na aba Vendas para ver a evolução</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 rounded-xl -z-10" />
              <ChartContainer config={chartConfig} className="h-[350px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    {/* Performance Bands */}
                    <defs>
                      <linearGradient id="excellentBand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="goodBand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="warningBand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(45 93% 58%)" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="hsl(45 93% 58%)" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="poorBand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(0 73% 58%)" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="hsl(0 73% 58%)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    
                    {/* Performance Bands */}
                    <ReferenceArea y1={0} y2={25} fill="url(#excellentBand)" />
                    <ReferenceArea y1={25} y2={30} fill="url(#goodBand)" />
                    <ReferenceArea y1={30} y2={35} fill="url(#warningBand)" />
                    <ReferenceArea y1={35} y2={100} fill="url(#poorBand)" />
                    
                    {/* Reference Lines */}
                    <ReferenceLine y={25} stroke="hsl(142 71% 45%)" strokeDasharray="4 4" strokeWidth={2} opacity={0.8} />
                    <ReferenceLine y={30} stroke="hsl(217 91% 60%)" strokeDasharray="4 4" strokeWidth={2} opacity={0.8} />
                    <ReferenceLine y={35} stroke="hsl(0 73% 58%)" strokeDasharray="4 4" strokeWidth={2} opacity={0.8} />
                    
                    <XAxis 
                      dataKey="period" 
                      tickLine={false}
                      axisLine={false}
                      className="text-sm font-medium fill-muted-foreground"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      className="text-sm font-medium fill-muted-foreground"
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    
                    <ChartTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const cogs = payload.find(p => p.dataKey === 'cogs')?.value;
                          const margin = payload.find(p => p.dataKey === 'margin')?.value;
                          const revenue = payload.find(p => p.dataKey === 'revenue')?.value;
                          
                          return (
                            <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-xl">
                              <p className="font-semibold text-foreground mb-2">{label}</p>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center justify-between gap-8">
                                  <span className="text-muted-foreground">CMV%:</span>
                                  <span className="font-medium text-chart-1">{typeof cogs === 'number' ? cogs.toFixed(1) : cogs}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-8">
                                  <span className="text-muted-foreground">Margem%:</span>
                                  <span className="font-medium text-chart-3">{typeof margin === 'number' ? margin.toFixed(1) : margin}%</span>
                                </div>
                                {revenue && (
                                  <div className="flex items-center justify-between gap-8">
                                    <span className="text-muted-foreground">Receita:</span>
                                    <span className="font-medium">R$ {Number(revenue).toLocaleString('pt-BR')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="cogs" 
                      stroke="hsl(217 91% 60%)"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(217 91% 60%)', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, fill: 'hsl(217 91% 60%)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CMV Rankings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CMVRankingCard
          title="Melhores CMVs"
          products={bestCMVs}
          type="best"
          getCOGSClassification={getCOGSClassification}
        />
        <CMVRankingCard
          title="Piores CMVs"
          products={worstCMVs}
          type="worst"
          getCOGSClassification={getCOGSClassification}
        />
      </div>

      {/* Data Summary */}
      {hasAnyData && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo dos Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Produtos analisados</p>
                <p className="text-2xl font-bold">{totals.totalItems}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de análise</p>
                <Badge variant={hasSalesData ? "default" : "outline"}>
                  {hasSalesData ? "Dados reais de vendas" : "Simulação com preços calculados"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
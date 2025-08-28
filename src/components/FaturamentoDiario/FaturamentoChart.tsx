import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart3 } from "lucide-react";
import { AggregatedSeries, Granularity, formatCurrency, FilterType } from "@/utils/faturamentoUtils";

interface FaturamentoChartProps {
  data: AggregatedSeries;
  granularity: Granularity;
  isLoading?: boolean;
  filterType?: FilterType;
}

export function FaturamentoChart({ data, granularity, isLoading = false, filterType = 'all' }: FaturamentoChartProps) {
  const formatXAxisLabel = (key: string) => {
    switch (granularity) {
      case 'DAY':
        // Convert YYYY-MM-DD to DD/MM/AAAA
        try {
          const [year, month, day] = key.split('-');
          return `${day}/${month}/${year}`;
        } catch {
          return key;
        }
      case 'WEEK':
        // Keep YYYY-W## format
        return key;
      case 'MONTH':
        // Convert YYYY-MM to nome do mês
        try {
          const [year, month] = key.split('-');
          const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
          ];
          return monthNames[parseInt(month) - 1] || key;
        } catch {
          return key;
        }
      case 'YEAR':
        return key;
      default:
        return key;
    }
  };

  const formatTooltipLabel = (key: string) => {
    switch (granularity) {
      case 'DAY':
        try {
          const [year, month, day] = key.split('-');
          return `${day}/${month}/${year}`;
        } catch {
          return key;
        }
      case 'WEEK':
        return `Semana ${key}`;
      case 'MONTH':
        try {
          const [year, month] = key.split('-');
          const monthNames = [
            'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
          ];
          return `${monthNames[parseInt(month) - 1]}/${year}`;
        } catch {
          return key;
        }
      case 'YEAR':
        return `Ano ${key}`;
      default:
        return key;
    }
  };

  if (isLoading) {
    return (
      <Card className="financial-card-elevated">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted animate-pulse">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="h-5 bg-muted animate-pulse rounded-md mb-2 w-48"></div>
              <div className="h-4 bg-muted animate-pulse rounded-md w-32"></div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="skeleton h-64 w-full rounded-lg"></div>
              <p className="text-muted-foreground text-sm">Carregando gráfico...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.series.length) {
    return (
      <Card className="financial-card-elevated">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted/50">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Gráfico de Faturamento
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Nenhum dado para exibir
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="p-4 rounded-full bg-muted/30 mx-auto w-fit">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Nenhum dado encontrado</p>
                <p className="text-muted-foreground/70 text-sm">para o período selecionado</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    total: {
      label: "Faturamento",
      color: "hsl(var(--success))",
    },
  };

  return (
    <Card className="financial-card-elevated">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <BarChart3 className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              Gráfico de Faturamento
              {filterType !== 'all' && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filterType === 'daily' ? 'Apenas Diário' : 'Apenas Mensal'})
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Total: <span className="font-bold text-success gradient-success bg-gradient-to-r from-success to-success/80 bg-clip-text text-transparent">{formatCurrency(data.total)}</span>
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <BarChart data={data.series} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="faturamentoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="2 4" 
              stroke="hsl(var(--border))" 
              strokeOpacity={0.3}
              vertical={false}
            />
            <XAxis 
              dataKey="key" 
              tickFormatter={formatXAxisLabel}
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: 'hsl(var(--muted-foreground))',
                fontWeight: 500
              }}
              tickMargin={12}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value).replace('R$', 'R$\u00A0')}
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: 'hsl(var(--muted-foreground))',
                fontWeight: 500
              }}
              width={90}
              tickMargin={8}
            />
            <ChartTooltip 
              cursor={false}
              content={
                <ChartTooltipContent 
                  formatter={(value: number) => [
                    <span className="font-bold text-success">{formatCurrency(value)}</span>, 
                    'Faturamento'
                  ]}
                  labelFormatter={formatTooltipLabel}
                  className="bg-card/95 backdrop-blur-sm border-border/60 shadow-lg"
                />
              }
            />
            <Bar 
              dataKey="total" 
              fill="url(#faturamentoGradient)"
              radius={[8, 8, 0, 0]}
              className="transition-all duration-300 hover:opacity-80 cursor-pointer"
              stroke="hsl(var(--success))"
              strokeWidth={0.5}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

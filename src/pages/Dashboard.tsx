import { useState, useEffect } from "react";
import { FinancialCard } from "@/components/FinancialCard";
import { LoadingOptimizer } from "@/components/LoadingOptimizer";
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  ShoppingBag, 
  ShoppingCart,
  BarChart3 
} from "lucide-react";

interface DashboardMetrics {
  totalCustosFixos: number;
  custosVariaveisPercentual: number;
  markupIdeal: number;
  ticketMedio: number;
  taxaIfood: number;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load real metrics from context - no simulation data
    const loadMetrics = () => {
      setLoading(true);
      try {
        // All metrics will be calculated from real data or show N/A
        setMetrics(null);
      } catch (error) {
        console.error('Error loading dashboard metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <LoadingOptimizer>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral dos seus indicadores financeiros
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Período atual</div>
            <div className="font-medium">{new Date().toLocaleDateString('pt-BR', { 
              month: 'long', 
              year: 'numeric' 
            })}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FinancialCard
          title="Total de Custos Fixos"
          value="N/A"
          subtitle="Configure custos fixos para ver os dados"
          icon={<DollarSign className="h-5 w-5" />}
          variant="default"
        />

        <FinancialCard
          title="Custos Variáveis"
          value="N/A"
          subtitle="Configure custos e vendas para cálculo"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="default"
        />

        <FinancialCard
          title="Markup Ideal"
          value="N/A"
          subtitle="Configure margens para ver o resultado"
          icon={<Calculator className="h-5 w-5" />}
          variant="default"
        />

        <FinancialCard
          title="Ticket Médio"
          value="N/A"
          subtitle="Importe vendas para calcular"
          icon={<ShoppingBag className="h-5 w-5" />}
          variant="default"
        />

        <FinancialCard
          title="Taxa iFood"
          value="N/A"
          subtitle="Configure taxas na aba Taxas/Impostos"
          icon={<ShoppingCart className="h-5 w-5" />}
          variant="default"
        />

        <FinancialCard
          title="Indicadores"
          icon={<BarChart3 className="h-5 w-5" />}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Lucro/Pedido:</span>
              <span className="font-medium text-muted-foreground">N/A</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className="text-muted-foreground">Configure dados</span>
            </div>
          </div>
        </FinancialCard>
        </div>

        <div className="mt-8 p-6 financial-card">
        <h2 className="text-xl font-semibold mb-4">Resumo de Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">N/A</div>
            <div className="text-sm text-muted-foreground">Crescimento vs mês anterior</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">N/A</div>
            <div className="text-sm text-muted-foreground">Pedidos no mês</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">N/A</div>
            <div className="text-sm text-muted-foreground">Variação custos</div>
          </div>
        </div>
        </div>
      </div>
    </LoadingOptimizer>
  );
}
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  aggregateSalesByProduct, 
  computeCFUFromSales, 
  getValidAllocationPeriod,
  type AllocationMethod,
  type FixedCostAllocationResult 
} from '@/utils/fixedCostsUtils';

interface FaturamentoMensal {
  mes: string;
  valor: number;
}

interface Insumo {
  id: string;
  produto: string;
  precoPago: number;
  volumeItem: number;
  unidade: 'KG' | 'G' | 'L' | 'ML' | 'UN';
  fatorCorrecao: number;
  custoEfetivo: number;
  valorFinalUnit: number;
  quantidadeBruta?: number;
  quantidadeLiquida?: number;
}

interface ItemReceita {
  insumoId: string;
  nomeInsumo: string;
  quantidade: number;
  custoUnitario: number;
  custoItem: number;
}

interface Receita {
  id: string;
  nome: string;
  rendimentoQtd: number;
  rendimentoUnid: string;
  perdaPercentual: number;
  itens: ItemReceita[];
  custoTotal: number;
  custoPosPerda: number;
  custoPorUnidade: number;
}

// New data structures for Variações
interface Embalagem {
  id: string;
  nome: string;
  custo: number;
  unidade: string;
}

interface Descartavel {
  id: string;
  nome: string;
  custo: number;
  unidade: string;
}

interface Opcional {
  id: string;
  nome: string;
  custo: number;
}

interface ExtraCenario {
  taxaFixa: number;
  subsidioFrete: number;
}

interface Variacao {
  id: string;
  nome: string;
  produtoBaseId: string;
  produtoBaseNome: string;
  tipoMedida: 'g' | 'ml' | 'fatia' | 'unidade';
  quantidade: number;
  overfillPercentual: number;
  embalagensSelecionadas: string[]; // IDs das embalagens
  descartaveisSelecionados: string[]; // IDs dos descartáveis
  cenario: 'local' | 'viagem' | 'delivery';
  extrasCenario: ExtraCenario;
  opcionaisSelecionados: string[]; // IDs dos opcionais
  unitCost: number; // Custo calculado da porção
  metadata: {
    custoConteudo: number;
    custoEmbalagens: number;
    custoDescartaveis: number;
    custoExtrasCenario: number;
    custoOpcionais: number;
  };
}

interface VariacoesConfig {
  embalagens: Embalagem[];
  descartaveis: Descartavel[];
  opcionais: Opcional[];
  variacoes: Variacao[];
}

// New data structures for sales
interface SaleItem {
  id: string;
  date: string; // 'YYYY-MM-DD' or ISO
  variantId: string;
  quantity: number;
  unitPriceNet: number;
  channel?: 'balcao' | 'ifood' | 'delivery' | 'cartao';
  branchId?: string;
  status?: 'paid' | 'completed' | 'canceled' | 'refunded';
}

// New data structures for pricing integration
type ChannelId = 'balcao' | 'cartao' | 'ifood' | 'delivery';

interface Revenue {
  [productId: string]: {
    [channelId in ChannelId]?: {
      units: number;
      currentPrice?: number;
    }
  }
}

interface FixedCost {
  id: string;
  name: string;
  monthly: number;
  category: string;
}

interface FixedCostsConfig {
  costs: FixedCost[];
  allocationMethod: 'units' | 'revenue_real';
  rateioPeriod?: {
    startDate: string;
    endDate: string;
  };
}

// New custom tax/fee structure
interface CustomTaxFee {
  id: string;
  name: string; // Nome da Taxa/Imposto (ex.: ISS, ICMS, Cartão Visa, iFood)
  type: 'percentage' | 'fixed'; // Tipo → Percentual (%) ou Valor Fixo (R$)
  value: number; // Valor → Alíquota (%) ou valor unitário (R$)
  channel?: string; // Canal de aplicação (opcional)
  active: boolean;
}

interface CustomTaxesFeesConfig {
  taxes: CustomTaxFee[];
}

// Legacy structure for backward compatibility
interface ChannelFees {
  t: number; // total percentage (decimal: 0.23 = 23%)
  F_extra: number; // fixed cost per order
  breakdown: {
    taxes: number;
    commission: number;
    cardFees: number;
    marketplace: number;
  }
}

interface FeesTaxes extends Partial<Record<ChannelId, ChannelFees>> {}

interface ChannelVariableOps {
  F: number; // R$ per order
}

interface VariableOps {
  [productId: string]: Partial<Record<ChannelId, ChannelVariableOps>>;
}

interface ChannelPromotion {
  d: number; // discount percentage (0-1)
  campaignName?: string;
  active: boolean;
}

interface Promotions {
  [productId: string]: Partial<Record<ChannelId, ChannelPromotion>>;
}

interface MarkupConfig {
  defaultM: number; // default margin percentage (0-1)
  perProduct?: {
    [productId: string]: number;
  }
}

interface PricingResult {
  price: number;
  priceMin: number;
  unitProfit: number;
  realMargin: number;
  isViable: boolean;
  cvuBase: number;
  cfu: number;
  totalVariableCost: number;
}

interface DeliveryConfig {
  ownDelivery: {
    enabled: boolean;
    costPerOrder: number;
    radius: number;
  };
  thirdPartyDelivery: {
    enabled: boolean;
    costPerOrder: number;
  };
}

interface IfoodPlanConfig {
  planType: 'basico' | 'premium' | 'personalizado';
  monthlyFee: number;
  commissionRate: number;
  fixedFeePerOrder: number;
}

export interface FinancialContextType {
  // Existing data
  mediaFaturamento: number;
  setMediaFaturamento: (value: number) => void;
  faturamentos: FaturamentoMensal[];
  setFaturamentos: (faturamentos: FaturamentoMensal[]) => void;
  saveFaturamentos: (faturamentos: FaturamentoMensal[]) => Promise<void>;
  insumos: Insumo[];
  setInsumos: (insumos: Insumo[]) => void;
  saveInsumos: (insumos: Insumo[]) => Promise<void>;
  receitas: Receita[];
  setReceitas: (receitas: Receita[]) => void;
  saveReceitas: (receitas: Receita[]) => Promise<void>;
  
  // Sales data
  salesData: SaleItem[];
  setSalesData: (sales: SaleItem[]) => void;
  saveSalesData: (sales: SaleItem[]) => Promise<void>;
  
  // New pricing data
  revenue: Revenue;
  setRevenue: (revenue: Revenue) => void;
  saveRevenue: (revenue: Revenue) => Promise<void>;
  
  fixedCostsConfig: FixedCostsConfig;
  setFixedCostsConfig: (config: FixedCostsConfig) => void;
  saveFixedCostsConfig: (config: FixedCostsConfig) => Promise<void>;
  
  // New custom taxes/fees structure
  customTaxesFeesConfig: CustomTaxesFeesConfig;
  setCustomTaxesFeesConfig: (config: CustomTaxesFeesConfig) => void;
  saveCustomTaxesFeesConfig: (config: CustomTaxesFeesConfig) => Promise<void>;
  
  // Legacy fees/taxes for backward compatibility
  feesTaxes: FeesTaxes;
  setFeesTaxes: (fees: FeesTaxes) => void;
  saveFeesTaxes: (fees: FeesTaxes) => Promise<void>;
  
  variableOps: VariableOps;
  setVariableOps: (ops: VariableOps) => void;
  saveVariableOps: (ops: VariableOps) => Promise<void>;
  
  promotions: Promotions;
  setPromotions: (promotions: Promotions) => void;
  savePromotions: (promotions: Promotions) => Promise<void>;
  
  markupConfig: MarkupConfig;
  setMarkupConfig: (config: MarkupConfig) => void;
  saveMarkupConfig: (config: MarkupConfig) => Promise<void>;
  
  deliveryConfig: DeliveryConfig;
  setDeliveryConfig: (config: DeliveryConfig) => void;
  saveDeliveryConfig: (config: DeliveryConfig) => Promise<void>;
  
  ifoodPlanConfig: IfoodPlanConfig;
  setIfoodPlanConfig: (config: IfoodPlanConfig) => void;
  saveIfoodPlanConfig: (config: IfoodPlanConfig) => Promise<void>;
  
  variacoesConfig: VariacoesConfig;
  setVariacoesConfig: (config: VariacoesConfig) => void;
  saveVariacoesConfig: (config: VariacoesConfig) => Promise<void>;
  
  // Computed values for pricing
  getTotalPercentageTaxes: () => number;
  getTotalFixedTaxes: () => number;
  
  // New unified pricing computed values
  getUnifiedPricingInput: (productId: string, channelId?: string) => any;
  
  // Reactive calculation hooks integration
  invalidateCalculations: () => void;
  
  // Pricing selectors
  selectCVuBase: (productId: string) => number;
  selectCFu: (productId: string) => number;
  selectVariableCost: (productId: string, channelId: ChannelId) => number;
  selectFees: (channelId: ChannelId) => { t: number; F_extra: number };
  selectDiscount: (productId: string, channelId: ChannelId) => number;
  selectMargin: (productId: string) => number;
  selectPrice: (productId: string, channelId: ChannelId) => PricingResult;
  
  // New function to get allocation result for UI display
  selectAllocationResult: () => FixedCostAllocationResult;
  
  isLoading: boolean;
  isInitializing: boolean;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// Utility function to generate initial months structure
const generateInitialFaturamentos = (): FaturamentoMensal[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, index) => ({
    mes: `${currentYear}-${(index + 1).toString().padStart(2, '0')}`,
    valor: 0
  }));
};

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Existing states
  const [mediaFaturamento, setMediaFaturamento] = useState<number>(0);
  const [faturamentos, setFaturamentos] = useState<FaturamentoMensal[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [salesData, setSalesData] = useState<SaleItem[]>([]);
  
  // New pricing states
  const [revenue, setRevenue] = useState<Revenue>({});
  const [fixedCostsConfig, setFixedCostsConfig] = useState<FixedCostsConfig>({ 
    costs: [], 
    allocationMethod: 'units',
    rateioPeriod: {
      startDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 meses atrás
      endDate: new Date().toISOString().split('T')[0] // hoje
    }
  });
  const [customTaxesFeesConfig, setCustomTaxesFeesConfig] = useState<CustomTaxesFeesConfig>({ taxes: [] });
  const [feesTaxes, setFeesTaxes] = useState<FeesTaxes>({});
  const [variableOps, setVariableOps] = useState<VariableOps>({});
  const [promotions, setPromotions] = useState<Promotions>({});
  const [markupConfig, setMarkupConfig] = useState<MarkupConfig>({ defaultM: 0 });
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
    ownDelivery: { enabled: false, costPerOrder: 0, radius: 5 },
    thirdPartyDelivery: { enabled: false, costPerOrder: 0 }
  });
  const [ifoodPlanConfig, setIfoodPlanConfig] = useState<IfoodPlanConfig>({
    planType: 'basico',
    monthlyFee: 0,
    commissionRate: 0,
    fixedFeePerOrder: 0
  });
  const [variacoesConfig, setVariacoesConfig] = useState<VariacoesConfig>({
    embalagens: [],
    descartaveis: [],
    opcionais: [],
    variacoes: []
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Optimized lazy loading for initial data
  useEffect(() => {
    const loadCriticalData = async () => {
      try {
        // Load only critical data first (faturamentos)
        const savedFaturamentos = localStorage.getItem('faturamentos');
        let loadedFaturamentos: FaturamentoMensal[];

        if (savedFaturamentos) {
          const parsedData = JSON.parse(savedFaturamentos) as FaturamentoMensal[];
          const initialStructure = generateInitialFaturamentos();
          loadedFaturamentos = initialStructure.map(initial => {
            const saved = parsedData.find(p => p.mes === initial.mes);
            return saved || initial;
          });
        } else {
          loadedFaturamentos = generateInitialFaturamentos();
        }

        setFaturamentos(loadedFaturamentos);

        // Calculate average immediately for dashboard
        const valoresComDados = loadedFaturamentos.filter(f => f.valor > 0);
        const totalFaturado = loadedFaturamentos.reduce((sum, f) => sum + f.valor, 0);
        const mediaMensal = valoresComDados.length > 0 
          ? totalFaturado / valoresComDados.length 
          : 0;
        setMediaFaturamento(mediaMensal);

        // Mark initialization as complete after critical data
        setIsInitializing(false);

        // Load non-critical data in background
        setTimeout(() => {
          loadSecondaryData();
        }, 0);
      } catch (error) {
        console.error('Error loading critical data:', error);
        setFaturamentos(generateInitialFaturamentos());
        setIsInitializing(false);
      }
    };

    const loadSecondaryData = () => {
      try {
        // Load in batches to prevent blocking
        const dataKeys = [
          'insumos', 'receitas', 'salesData', 'revenue', 'fixedCostsConfig',
          'customTaxesFeesConfig', 'feesTaxes', 'variableOps', 'promotions',
          'markupConfig', 'deliveryConfig', 'ifoodPlanConfig', 'variacoesConfig'
        ];

        // Load data in parallel batches for better performance
        const loadBatch = (keys: string[]) => {
          keys.forEach(key => {
            const savedData = localStorage.getItem(key);
            if (savedData) {
              const parsedData = JSON.parse(savedData);
              
              switch (key) {
                case 'insumos':
                  setInsumos(parsedData);
                  break;
                case 'receitas':
                  setReceitas(parsedData);
                  break;
                case 'salesData':
                  setSalesData(parsedData);
                  break;
                case 'revenue':
                  setRevenue(parsedData);
                  break;
                case 'fixedCostsConfig':
                  setFixedCostsConfig(parsedData);
                  break;
                case 'customTaxesFeesConfig':
                  setCustomTaxesFeesConfig(parsedData);
                  break;
                case 'feesTaxes':
                  setFeesTaxes(parsedData);
                  break;
                case 'variableOps':
                  setVariableOps(parsedData);
                  break;
                case 'promotions':
                  setPromotions(parsedData);
                  break;
                case 'markupConfig':
                  setMarkupConfig(parsedData);
                  break;
                case 'deliveryConfig':
                  setDeliveryConfig(parsedData);
                  break;
                case 'ifoodPlanConfig':
                  setIfoodPlanConfig(parsedData);
                  break;
                case 'variacoesConfig':
                  setVariacoesConfig(parsedData);
                  break;
              }
            }
          });
        };

        // Load in optimized batches
        const batch1 = ['insumos', 'receitas', 'salesData', 'revenue'];
        const batch2 = ['fixedCostsConfig', 'customTaxesFeesConfig', 'feesTaxes', 'variableOps'];
        const batch3 = ['promotions', 'markupConfig', 'deliveryConfig', 'ifoodPlanConfig', 'variacoesConfig'];

        loadBatch(batch1);
        setTimeout(() => loadBatch(batch2), 5);
        setTimeout(() => loadBatch(batch3), 10);
      } catch (error) {
        console.error('Error loading secondary data:', error);
      }
    };

    loadCriticalData();
  }, []);

  const saveFaturamentos = async (faturamentosData: FaturamentoMensal[]) => {
    setIsLoading(true);
    try {
      
      localStorage.setItem('faturamentos', JSON.stringify(faturamentosData));
      setFaturamentos(faturamentosData);
      
      // Optimized average calculation
      const valoresComDados = faturamentosData.filter(f => f.valor > 0);
      const totalFaturado = faturamentosData.reduce((sum, f) => sum + f.valor, 0);
      const mediaMensal = valoresComDados.length > 0 
        ? totalFaturado / valoresComDados.length 
        : 0;
      setMediaFaturamento(mediaMensal);

      toast({
        title: "✅ Dados salvos!",
        description: "Faturamentos atualizados.",
      });
    } catch (error) {
      console.error('Error saving faturamentos:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveInsumos = async (insumosData: Insumo[]) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('insumos', JSON.stringify(insumosData));
      setInsumos(insumosData);

      toast({
        title: "✅ Insumos salvos!",
        description: "Dados atualizados.",
      });
    } catch (error) {
      console.error('Error saving insumos:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveReceitas = async (receitasData: Receita[]) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('receitas', JSON.stringify(receitasData));
      setReceitas(receitasData);

      toast({
        title: "✅ Receitas salvas!",
        description: "Dados atualizados.",
      });
    } catch (error) {
      console.error('Error saving receitas:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSalesData = async (salesDataToSave: SaleItem[]) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('salesData', JSON.stringify(salesDataToSave));
      setSalesData(salesDataToSave);

      toast({
        title: "✅ Vendas salvas!",
        description: "Dados atualizados.",
      });
    } catch (error) {
      console.error('Error saving sales data:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // New save functions for pricing data
  const saveRevenue = async (revenueData: Revenue) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('revenue', JSON.stringify(revenueData));
      setRevenue(revenueData);
      toast({
        title: "✅ Dados salvos!",
        description: "Previsões de faturamento salvas.",
      });
    } catch (error) {
      console.error('Error saving revenue:', error);
      toast({ title: "❌ Erro ao salvar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveFixedCostsConfig = async (configData: FixedCostsConfig) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('fixedCostsConfig', JSON.stringify(configData));
      setFixedCostsConfig(configData);
      toast({
        title: "✅ Custos fixos salvos!",
        description: "Configuração atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error saving fixed costs:', error);
      toast({ title: "❌ Erro ao salvar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomTaxesFeesConfig = async (configData: CustomTaxesFeesConfig) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('customTaxesFeesConfig', JSON.stringify(configData));
      setCustomTaxesFeesConfig(configData);
      toast({
        title: "✅ Taxas e impostos salvos!",
        description: "Configuração atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error saving custom taxes/fees:', error);
      toast({ title: "❌ Erro ao salvar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveFeesTaxes = async (feesData: FeesTaxes) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('feesTaxes', JSON.stringify(feesData));
      setFeesTaxes(feesData);
      toast({
        title: "✅ Taxas salvas!",
        description: "Configuração de taxas atualizada.",
      });
    } catch (error) {
      console.error('Error saving fees:', error);
      toast({ title: "❌ Erro ao salvar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveVariableOps = async (opsData: VariableOps) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('variableOps', JSON.stringify(opsData));
      setVariableOps(opsData);
      toast({
        title: "✅ Custos variáveis salvos!",
        description: "Configuração atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error saving variable ops:', error);
      toast({ title: "❌ Erro ao salvar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const savePromotions = async (promotionsData: Promotions) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('promotions', JSON.stringify(promotionsData));
      setPromotions(promotionsData);
      toast({
        title: "✅ Promoções salvas!",
        description: "Campanhas atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving promotions:', error);
      toast({ title: "❌ Erro ao salvar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveMarkupConfig = async (configData: MarkupConfig) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('markupConfig', JSON.stringify(configData));
      setMarkupConfig(configData);
      toast({
        title: "✅ Markup salvo!",
        description: "Configuração de margens atualizada.",
      });
    } catch (error) {
      console.error('Error saving markup:', error);
      toast({ title: "❌ Erro ao salvar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveDeliveryConfig = async (configData: DeliveryConfig) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('deliveryConfig', JSON.stringify(configData));
      setDeliveryConfig(configData);
      toast({
        title: "✅ Configuração de delivery salva!",
        description: "Dados atualizados com sucesso.",
      });
    } catch (error) {
      console.error('Error saving delivery config:', error);
      toast({ title: "❌ Erro ao salvar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveIfoodPlanConfig = async (configData: IfoodPlanConfig) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('ifoodPlanConfig', JSON.stringify(configData));
      setIfoodPlanConfig(configData);
      toast({
        title: "✅ Plano iFood salvo!",
        description: "Configuração atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error saving ifood plan:', error);
      toast({ title: "❌ Erro ao salvar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveVariacoesConfig = async (configData: VariacoesConfig) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.setItem('variacoesConfig', JSON.stringify(configData));
      setVariacoesConfig(configData);
      toast({
        title: "✅ Variações salvas!",
        description: "Configuração atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error saving variações:', error);
      toast({ title: "❌ Erro ao salvar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // New computed functions for custom taxes
  const getTotalPercentageTaxes = (): number => {
    return customTaxesFeesConfig.taxes
      .filter(tax => tax.active && tax.type === 'percentage')
      .reduce((sum, tax) => sum + tax.value / 100, 0);
  };

  const getTotalFixedTaxes = (): number => {
    return customTaxesFeesConfig.taxes
      .filter(tax => tax.active && tax.type === 'fixed')
      .reduce((sum, tax) => sum + tax.value, 0);
  };
  
  // Novo: Função unificada para obter input de precificação
  const getUnifiedPricingInput = (productId: string, channelId?: string) => {
    // Calcular CVU baseado na receita selecionada
    const receita = receitas.find(r => r.id === productId);
    const cvu = receita ? receita.custoPorUnidade : 0;
    
    // Calcular CFU baseado na configuração atual
    const cfu = selectCFu(productId);
    
    // Obter taxas específicas do canal
    const taxasCanal = channelId ? 
      customTaxesFeesConfig.taxes.filter(t => t.channel === channelId || !t.channel) : 
      customTaxesFeesConfig.taxes.filter(t => !t.channel);
    
    const impostos = taxasCanal
      .filter(t => t.type === 'percentage' && (
        t.name.toLowerCase().includes('iss') || 
        t.name.toLowerCase().includes('icms') ||
        t.name.toLowerCase().includes('imposto')
      ))
      .reduce((acc, t) => acc + t.value, 0);
    
    const comissao = taxasCanal
      .filter(t => t.type === 'percentage' && (
        t.name.toLowerCase().includes('ifood') ||
        t.name.toLowerCase().includes('comissao') ||
        t.name.toLowerCase().includes('app')
      ))
      .reduce((acc, t) => acc + t.value, 0);
    
    const cartao = taxasCanal
      .filter(t => t.type === 'percentage' && (
        t.name.toLowerCase().includes('cartão') ||
        t.name.toLowerCase().includes('cartao')
      ))
      .reduce((acc, t) => acc + t.value, 0);
      
    const taxasFixas = taxasCanal
      .filter(t => t.type === 'fixed')
      .reduce((acc, t) => acc + t.value, 0) + getTotalFixedTaxes();
    
    return {
      costs: {
        cvu,
        cfu,
        variableCosts: 0, // Será preenchido pelo usuário
        fixedTaxes: taxasFixas,
      },
      taxRates: {
        taxes: impostos,
        commission: comissao,
        cardFees: cartao,
        discounts: 0, // Será preenchido pelo usuário
      },
      targetMargin: markupConfig.defaultM * 100, // Converter para %
      promotionDiscount: 0,
    };
  };
  
  // Função para invalidar cálculos (para reatividade)
  const invalidateCalculations = () => {
    // Trigger para recálculos quando dados base mudam
    // Implementação futura para otimização
  };

  // Pricing selectors (derived calculations)
  const selectCVuBase = (productId: string): number => {
    const receita = receitas.find(r => r.id === productId);
    return receita ? receita.custoPorUnidade : 0;
  };

  const selectCFu = (productId: string): number => {
    if (!fixedCostsConfig.costs.length) return 0;
    
    const totalFixedCosts = fixedCostsConfig.costs.reduce((sum, cost) => sum + cost.monthly, 0);
    
    // Usar período de rateio configurado ou padrão
    const period = fixedCostsConfig.rateioPeriod || {
      startDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    };
    
    // Obter período válido (máximo 12 meses)
    const { startISO, endISO, monthsCount } = getValidAllocationPeriod(period.startDate, period.endDate);
    
    // Agregar vendas por produto no período
    const productAgg = aggregateSalesByProduct(salesData, startISO, endISO);
    
    // Obter lista de produtos disponíveis (variações)
    const availableVariants = variacoesConfig.variacoes.map(v => v.id);
    
    // Calcular CFU usando apenas vendas reais
    const result = computeCFUFromSales(
      productAgg, 
      totalFixedCosts, 
      fixedCostsConfig.allocationMethod as AllocationMethod,
      monthsCount,
      availableVariants
    );
    
    return result.cfuByProduct[productId] || 0;
  };

  const selectVariableCost = (productId: string, channelId: ChannelId): number => {
    return variableOps[productId]?.[channelId]?.F || 0;
  };

  const selectFees = (channelId: ChannelId): { t: number; F_extra: number } => {
    const channelFees = feesTaxes[channelId];
    return {
      t: channelFees?.t || 0,
      F_extra: channelFees?.F_extra || 0
    };
  };

  const selectDiscount = (productId: string, channelId: ChannelId): number => {
    const promotion = promotions[productId]?.[channelId];
    return (promotion?.active ? promotion.d : 0) || 0;
  };

  const selectMargin = (productId: string): number => {
    return markupConfig.perProduct?.[productId] || markupConfig.defaultM;
  };

  // Function to get allocation result for UI display
  const selectAllocationResult = (): FixedCostAllocationResult => {
    if (!fixedCostsConfig.costs.length) {
      return {
        cfuByProduct: {},
        totals: { totalUnits: 0, totalRevenue: 0, unmappedSales: 0, validSalesCount: 0 },
        warnings: ["Nenhum custo fixo cadastrado."],
        effectivePeriod: { startISO: '', endISO: '' }
      };
    }
    
    const totalFixedCosts = fixedCostsConfig.costs.reduce((sum, cost) => sum + cost.monthly, 0);
    
    // Use configured period or default
    const period = fixedCostsConfig.rateioPeriod || {
      startDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    };
    
    // Get valid period (maximum 12 months)
    const { startISO, endISO, monthsCount, warnings: periodWarnings } = getValidAllocationPeriod(period.startDate, period.endDate);
    
    // Aggregate sales by product in period
    const productAgg = aggregateSalesByProduct(salesData, startISO, endISO);
    
    // Get available variants
    const availableVariants = variacoesConfig.variacoes.map(v => v.id);
    
    // Calculate CFU using only real sales
    const result = computeCFUFromSales(
      productAgg, 
      totalFixedCosts, 
      fixedCostsConfig.allocationMethod as AllocationMethod,
      monthsCount,
      availableVariants
    );
    
    return {
      ...result,
      warnings: [...periodWarnings, ...result.warnings],
      effectivePeriod: { startISO, endISO }
    };
  };

  const selectPrice = (productId: string, channelId: ChannelId): PricingResult => {
    const cvuBase = selectCVuBase(productId);
    const cfu = selectCFu(productId);
    const variableCost = selectVariableCost(productId, channelId);
    const { t, F_extra } = selectFees(channelId);
    const d = selectDiscount(productId, channelId);
    const m = selectMargin(productId);

    const totalVariableCost = variableCost + F_extra;
    const baseCost = cvuBase + cfu + totalVariableCost;

    // Guard-rail: check if calculation is viable
    const denominator = 1 - t - d - m;
    const isViable = denominator > 0;

    if (!isViable) {
      return {
        price: 0,
        priceMin: baseCost / (1 - t - d), // minimum viable price with 0 margin
        unitProfit: 0,
        realMargin: 0,
        isViable: false,
        cvuBase,
        cfu,
        totalVariableCost
      };
    }

    const price = baseCost / denominator;
    const priceMin = baseCost / (1 - t - d); // with margin = 0
    
    const netRevenue = price * (1 - t - d) - totalVariableCost;
    const unitProfit = netRevenue - (cvuBase + cfu);
    const realMargin = unitProfit / price;

    return {
      price,
      priceMin,
      unitProfit,
      realMargin,
      isViable: true,
      cvuBase,
      cfu,
      totalVariableCost
    };
  };

  return (
    <FinancialContext.Provider value={{ 
      // Existing data
      mediaFaturamento, 
      setMediaFaturamento, 
      faturamentos, 
      setFaturamentos, 
      saveFaturamentos,
      insumos,
      setInsumos,
      saveInsumos,
      receitas,
      setReceitas,
      saveReceitas,
      salesData,
      setSalesData,
      saveSalesData,
      
      // New pricing data
      revenue,
      setRevenue,
      saveRevenue,
      fixedCostsConfig,
      setFixedCostsConfig,
      saveFixedCostsConfig,
      customTaxesFeesConfig,
      setCustomTaxesFeesConfig,
      saveCustomTaxesFeesConfig,
      feesTaxes,
      setFeesTaxes,
      saveFeesTaxes,
      variableOps,
      setVariableOps,
      saveVariableOps,
      promotions,
      setPromotions,
      savePromotions,
      markupConfig,
      setMarkupConfig,
      saveMarkupConfig,
      deliveryConfig,
      setDeliveryConfig,
      saveDeliveryConfig,
      ifoodPlanConfig,
      setIfoodPlanConfig,
      saveIfoodPlanConfig,
      variacoesConfig,
      setVariacoesConfig,
      saveVariacoesConfig,
      
      // Computed values
      getTotalPercentageTaxes,
      getTotalFixedTaxes,
      getUnifiedPricingInput,
      invalidateCalculations,
      
      // Pricing selectors
      selectCVuBase,
      selectCFu,
      selectVariableCost,
      selectFees,
      selectDiscount,
      selectMargin,
      selectPrice,
      selectAllocationResult,
      
      isLoading,
      isInitializing
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
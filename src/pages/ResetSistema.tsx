import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InteractiveTooltip } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { useFinancial } from '@/contexts/FinancialContext';
import { useToast } from '@/hooks/use-toast';
import { 
  RotateCcw, 
  AlertTriangle, 
  Shield, 
  Trash2, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Database,
  ShoppingCart,
  FileText,
  TrendingUp,
  Settings,
  Calculator,
  Package,
  CreditCard,
  Layers
} from 'lucide-react';

const SECURITY_PIN = "1234"; // PIN de segurança padrão

interface DataInfo {
  key: string;
  name: string;
  description: string;
  count: number;
  icon: React.ReactNode;
  localStorageKey: string;
  resetFunction: () => void;
}

interface ResetSection {
  key: string;
  selected: boolean;
}

export default function ResetSistema() {
  const financialContext = useFinancial();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedSections, setSelectedSections] = useState<ResetSection[]>([]);
  const [resetMode, setResetMode] = useState<'selective' | 'complete'>('selective');

  const {
    faturamentos,
    insumos,
    receitas,
    salesData,
    revenue,
    fixedCostsConfig,
    customTaxesFeesConfig,
    feesTaxes,
    variableOps,
    promotions,
    markupConfig,
    deliveryConfig,
    ifoodPlanConfig,
    variacoesConfig,
    // Setter functions
    setMediaFaturamento,
    setFaturamentos,
    setInsumos,
    setReceitas,
    setSalesData,
    setRevenue,
    setFixedCostsConfig,
    setCustomTaxesFeesConfig,
    setFeesTaxes,
    setVariableOps,
    setPromotions,
    setMarkupConfig,
    setDeliveryConfig,
    setIfoodPlanConfig,
    setVariacoesConfig
  } = financialContext;

  // Calcula informações dos dados atuais
  const dataInfo: DataInfo[] = [
    {
      key: "faturamentos",
      name: "Faturamentos",
      description: "Dados mensais de faturamento",
      count: faturamentos.filter(f => f.valor > 0).length,
      icon: <TrendingUp className="h-4 w-4" />,
      localStorageKey: "faturamentos",
      resetFunction: () => {
        setMediaFaturamento(0);
        const currentYear = new Date().getFullYear();
        const initialFaturamentos = Array.from({ length: 12 }, (_, index) => ({
          mes: `${currentYear}-${(index + 1).toString().padStart(2, '0')}`,
          valor: 0
        }));
        setFaturamentos(initialFaturamentos);
      }
    },
    {
      key: "insumos",
      name: "Insumos",
      description: "Matérias-primas cadastradas",
      count: insumos.length,
      icon: <Package className="h-4 w-4" />,
      localStorageKey: "insumos",
      resetFunction: () => setInsumos([])
    },
    {
      key: "receitas",
      name: "Receitas",
      description: "Fichas técnicas de produtos",
      count: receitas.length,
      icon: <FileText className="h-4 w-4" />,
      localStorageKey: "receitas",
      resetFunction: () => setReceitas([])
    },
    {
      key: "vendas",
      name: "Vendas",
      description: "Registros de vendas",
      count: salesData.length,
      icon: <ShoppingCart className="h-4 w-4" />,
      localStorageKey: "salesData",
      resetFunction: () => setSalesData([])
    },
    {
      key: "variacoes",
      name: "Variações",
      description: "Porções e variações de produtos",
      count: variacoesConfig.variacoes.length,
      icon: <Layers className="h-4 w-4" />,
      localStorageKey: "variacoesConfig",
      resetFunction: () => setVariacoesConfig({
        embalagens: [],
        descartaveis: [],
        opcionais: [],
        variacoes: []
      })
    },
    {
      key: "custos-fixos",
      name: "Custos Fixos",
      description: "Custos fixos cadastrados",
      count: fixedCostsConfig.costs.length,
      icon: <Calculator className="h-4 w-4" />,
      localStorageKey: "fixedCostsConfig",
      resetFunction: () => setFixedCostsConfig({ 
        costs: [], 
        allocationMethod: 'units',
        rateioPeriod: {
          startDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      })
    },
    {
      key: "taxas-impostos",
      name: "Taxas/Impostos",
      description: "Taxas e impostos configurados",
      count: customTaxesFeesConfig.taxes.length,
      icon: <CreditCard className="h-4 w-4" />,
      localStorageKey: "customTaxesFeesConfig",
      resetFunction: () => {
        setCustomTaxesFeesConfig({ taxes: [] });
        setFeesTaxes({});
      }
    },
    {
      key: "produtos-receita",
      name: "Produtos (Receita)",
      description: "Produtos com dados de receita",
      count: Object.keys(revenue).length,
      icon: <Database className="h-4 w-4" />,
      localStorageKey: "revenue",
      resetFunction: () => {
        setRevenue({});
        setVariableOps({});
        setPromotions({});
      }
    }
  ];

  const totalItems = dataInfo.reduce((sum, item) => sum + item.count, 0);
  const selectedSectionsWithData = selectedSections.filter(section => {
    const item = dataInfo.find(d => d.key === section.key);
    return item && item.count > 0;
  });

  // Inicializa as seções selecionadas se estiver vazio
  React.useEffect(() => {
    if (selectedSections.length === 0) {
      setSelectedSections(dataInfo.map(item => ({
        key: item.key,
        selected: false
      })));
    }
  }, []);

  const handlePinChange = (value: string) => {
    // Aceita apenas dígitos e limita a 4 caracteres
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
  };

  const isPinValid = pin === SECURITY_PIN;
  const isPinComplete = pin.length === 4;

  const toggleSectionSelection = (key: string) => {
    setSelectedSections(prev => 
      prev.map(section => 
        section.key === key 
          ? { ...section, selected: !section.selected }
          : section
      )
    );
  };

  const selectAllSections = () => {
    setSelectedSections(prev =>
      prev.map(section => ({ ...section, selected: true }))
    );
  };

  const deselectAllSections = () => {
    setSelectedSections(prev =>
      prev.map(section => ({ ...section, selected: false }))
    );
  };

  const getSelectedCount = () => {
    return selectedSections.filter(s => s.selected).length;
  };

  const performSelectiveReset = async () => {
    if (!isPinValid) {
      toast({
        title: "❌ PIN Inválido",
        description: "O PIN inserido não está correto.",
        variant: "destructive"
      });
      return;
    }

    const sectionsToReset = selectedSections.filter(s => s.selected);
    
    if (sectionsToReset.length === 0) {
      toast({
        title: "⚠️ Nenhuma seção selecionada",
        description: "Selecione pelo menos uma seção para resetar.",
        variant: "destructive"
      });
      return;
    }

    setIsResetting(true);

    try {
      // Simula um delay para dar feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reseta cada seção selecionada
      sectionsToReset.forEach(section => {
        const item = dataInfo.find(d => d.key === section.key);
        if (item) {
          // Remove do localStorage
          localStorage.removeItem(item.localStorageKey);
          // Executa a função de reset
          item.resetFunction();
        }
      });

      // Também remove dados relacionados se necessário
      if (sectionsToReset.some(s => s.key === 'produtos-receita')) {
        localStorage.removeItem('variableOps');
        localStorage.removeItem('promotions');
      }

      if (sectionsToReset.some(s => s.key === 'taxas-impostos')) {
        localStorage.removeItem('feesTaxes');
      }

      const resetNames = sectionsToReset
        .map(s => dataInfo.find(d => d.key === s.key)?.name)
        .filter(Boolean)
        .join(', ');

      toast({
        title: "✅ Reset Seletivo Concluído!",
        description: `As seguintes seções foram resetadas: ${resetNames}`,
        variant: "default"
      });

      // Limpa os campos e seleções após sucesso
      setPin('');
      setShowConfirmation(false);
      deselectAllSections();
      
    } catch (error) {
      console.error('Erro ao resetar seções:', error);
      toast({
        title: "❌ Erro no Reset",
        description: "Ocorreu um erro ao resetar as seções selecionadas. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const performReset = async () => {
    if (!isPinValid) {
      toast({
        title: "❌ PIN Inválido",
        description: "O PIN inserido não está correto.",
        variant: "destructive"
      });
      return;
    }

    setIsResetting(true);

    try {
      // Simula um delay para dar feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Limpa todos os dados do localStorage
      const keysToRemove = [
        'faturamentos',
        'insumos', 
        'receitas',
        'salesData',
        'revenue',
        'fixedCostsConfig',
        'customTaxesFeesConfig',
        'feesTaxes',
        'variableOps',
        'promotions',
        'markupConfig',
        'deliveryConfig',
        'ifoodPlanConfig',
        'variacoesConfig'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Reseta todos os estados para valores iniciais
      setMediaFaturamento(0);
      
      // Gera estrutura inicial de faturamentos (12 meses zerados)
      const currentYear = new Date().getFullYear();
      const initialFaturamentos = Array.from({ length: 12 }, (_, index) => ({
        mes: `${currentYear}-${(index + 1).toString().padStart(2, '0')}`,
        valor: 0
      }));
      setFaturamentos(initialFaturamentos);
      
      setInsumos([]);
      setReceitas([]);
      setSalesData([]);
      setRevenue({});
      setFixedCostsConfig({ 
        costs: [], 
        allocationMethod: 'units',
        rateioPeriod: {
          startDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      });
      setCustomTaxesFeesConfig({ taxes: [] });
      setFeesTaxes({});
      setVariableOps({});
      setPromotions({});
      setMarkupConfig({ defaultM: 0 });
      setDeliveryConfig({
        ownDelivery: { enabled: false, costPerOrder: 0, radius: 5 },
        thirdPartyDelivery: { enabled: false, costPerOrder: 0 }
      });
      setIfoodPlanConfig({
        planType: 'basico',
        monthlyFee: 0,
        commissionRate: 0,
        fixedFeePerOrder: 0
      });
      setVariacoesConfig({
        embalagens: [],
        descartaveis: [],
        opcionais: [],
        variacoes: []
      });

      toast({
        title: "✅ Sistema Resetado com Sucesso!",
        description: "Todos os dados foram removidos e o sistema foi retornado ao estado inicial.",
        variant: "default"
      });

      // Limpa os campos após sucesso
      setPin('');
      setShowConfirmation(false);
      
    } catch (error) {
      console.error('Erro ao resetar sistema:', error);
      toast({
        title: "❌ Erro no Reset",
        description: "Ocorreu um erro ao resetar o sistema. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-destructive/10 rounded-full">
            <Trash2 className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Resetar Sistema</h1>
            <p className="text-muted-foreground">Apagar todos os dados e retornar ao estado inicial</p>
          </div>
        </div>
      </div>

      {/* Alerta de Segurança */}
      <Alert className="border-destructive/20 bg-destructive/5">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-destructive">
          <strong>ATENÇÃO:</strong> Esta ação é irreversível! Todos os dados inseridos no sistema serão 
          permanentemente apagados e não poderão ser recuperados.
        </AlertDescription>
      </Alert>

      {/* Dados Atuais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dados Atuais no Sistema
          </CardTitle>
          <CardDescription>
            Visualize quais dados serão removidos permanentemente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-medium">Total de itens cadastrados:</span>
            </div>
            <Badge variant={totalItems > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
              {totalItems}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataInfo.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>
                <Badge variant={item.count > 0 ? "default" : "secondary"}>
                  {item.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Modo de Reset */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Modo de Reset
          </CardTitle>
          <CardDescription>
            Escolha como deseja resetar os dados do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                resetMode === 'selective' ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
              onClick={() => setResetMode('selective')}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    resetMode === 'selective' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Layers className={`h-5 w-5 ${
                      resetMode === 'selective' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Reset Seletivo</h3>
                    <p className="text-sm text-muted-foreground">
                      Escolha quais seções resetar individualmente
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                resetMode === 'complete' ? 'border-destructive ring-2 ring-destructive/20' : ''
              }`}
              onClick={() => setResetMode('complete')}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    resetMode === 'complete' ? 'bg-destructive/10' : 'bg-muted'
                  }`}>
                    <Trash2 className={`h-5 w-5 ${
                      resetMode === 'complete' ? 'text-destructive' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Reset Completo</h3>
                    <p className="text-sm text-muted-foreground">
                      Resetar todo o sistema de uma vez
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Seções (apenas para modo seletivo) */}
      {resetMode === 'selective' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Selecionar Seções para Reset
                </CardTitle>
                <CardDescription>
                  Escolha quais seções deseja resetar ({getSelectedCount()} de {dataInfo.length} selecionadas)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllSections}
                  disabled={getSelectedCount() === dataInfo.length}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Selecionar Todas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllSections}
                  disabled={getSelectedCount() === 0}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Limpar Seleção
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dataInfo.map((item) => {
                const isSelected = selectedSections.find(s => s.key === item.key)?.selected ?? false;
                const hasData = item.count > 0;
                
                return (
                  <div
                    key={item.key}
                    className={`p-4 border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm ${
                      isSelected 
                        ? 'border-success bg-success/5 ring-1 ring-success/20' 
                        : 'border-border hover:border-success/30'
                    } ${!hasData && !isSelected ? 'opacity-60' : ''}`}
                    onClick={() => toggleSectionSelection(item.key)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSectionSelection(item.key)}
                        className="mt-0.5"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`transition-all duration-200 ${
                          !hasData ? 'text-muted-foreground' : 
                          isSelected ? 'text-foreground' : 'text-foreground/70'
                        }`}>
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium text-sm transition-all duration-200 ${
                            !hasData ? 'text-muted-foreground' : 
                            isSelected ? 'text-foreground drop-shadow-sm' : 'text-foreground/75'
                          }`}>
                            {item.name}
                          </div>
                          <div className={`text-xs transition-all duration-200 ${
                            isSelected ? 'text-muted-foreground' : 'text-muted-foreground/70'
                          }`}>
                            {item.description}
                          </div>
                        </div>
                        <Badge 
                          variant={item.count > 0 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {item.count}
                        </Badge>
                      </div>
                    </div>
                    {!hasData && (
                      <div className="text-xs text-muted-foreground mt-2 ml-8">
                        Nenhum dado para resetar
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {getSelectedCount() > 0 && (
              <Alert className="mt-4 border-success/20 bg-success/5">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  <strong>{getSelectedCount()} seção(ões) selecionada(s):</strong>{' '}
                  {selectedSections
                    .filter(s => s.selected)
                    .map(s => dataInfo.find(d => d.key === s.key)?.name)
                    .filter(Boolean)
                    .join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      <Card className="border-destructive/20">
        <CardHeader className="bg-destructive/5">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Lock className="h-5 w-5" />
            Área de Reset Protegida
          </CardTitle>
          <CardDescription>
            Digite o PIN de segurança para confirmar o reset do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Campo PIN */}
          <div className="space-y-2">
            <Label htmlFor="pin" className="flex items-center gap-2">
              PIN de Segurança (4 dígitos)
              <InteractiveTooltip
                content="Digite o PIN de 4 dígitos para autorizar o reset. O PIN padrão é 1234."
                side="right"
              >
                <Shield className="h-4 w-4 text-muted-foreground cursor-help" />
              </InteractiveTooltip>
            </Label>
            
            <div className="relative max-w-[200px]">
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="••••"
                className={`text-center text-lg font-mono tracking-widest pr-10 ${
                  isPinComplete && !isPinValid ? 'border-destructive' : 
                  isPinComplete && isPinValid ? 'border-success' : ''
                }`}
                maxLength={4}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowPin(!showPin)}
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Feedback do PIN */}
            {isPinComplete && (
              <div className="flex items-center gap-2 text-sm">
                {isPinValid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-success">PIN válido</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">PIN inválido</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Confirmação Final */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirm"
                checked={showConfirmation}
                onChange={(e) => setShowConfirmation(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="confirm" className="text-sm">
                Confirmo que entendo que esta ação é <strong>irreversível</strong> e que 
                todos os dados serão <strong>permanentemente removidos</strong>
              </Label>
            </div>

            <Alert className="border-warning/20 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                <strong>Última confirmação:</strong> Ao clicar no botão de reset, {
                  resetMode === 'selective' 
                    ? `as ${getSelectedCount()} seção(ões) selecionada(s) serão imediatamente removidas`
                    : `todos os ${totalItems} itens cadastrados serão imediatamente removidos`
                } sem possibilidade de recuperação.
              </AlertDescription>
            </Alert>
          </div>

          {/* Botões de Reset */}
          <div className="flex justify-center pt-4">
            {resetMode === 'selective' ? (
              <Button
                variant="default"
                size="lg"
                onClick={performSelectiveReset}
                disabled={!isPinValid || !showConfirmation || isResetting || getSelectedCount() === 0}
                className="w-full max-w-md"
              >
                {isResetting ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                    Resetando Seções...
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4 mr-2" />
                    Resetar Seções Selecionadas ({getSelectedCount()})
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="lg"
                onClick={performReset}
                disabled={!isPinValid || !showConfirmation || isResetting}
                className="w-full max-w-md"
              >
                {isResetting ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                    Resetando Sistema...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Resetar Sistema Completo
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações de Segurança */}
      <Card className="bg-muted/20">
        <CardHeader>
          <CardTitle className="text-sm">Informações de Segurança e Reset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>• O PIN padrão de segurança é <strong>1234</strong></div>
          <div>• Todos os dados são armazenados localmente no seu navegador</div>
          <div>• <strong>Reset Seletivo:</strong> Permite resetar apenas as seções desejadas</div>
          <div>• <strong>Reset Completo:</strong> Remove todos os dados de uma vez</div>
          <div>• Após o reset, você precisará inserir novamente todos os dados removidos</div>
          <div>• Recomendamos fazer backup/exportação antes de resetar</div>
          <div>• Esta função é útil para limpar dados de teste ou recomeçar do zero</div>
        </CardContent>
      </Card>
    </div>
  );
}
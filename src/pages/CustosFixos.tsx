import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, DollarSign, Save, Loader2, Upload, Check, ChevronsUpDown, Info, AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialCard } from "@/components/FinancialCard";
import { EmptyState } from "@/components/EmptyState";
import { CostUploader } from "@/components/CostUploader";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFinancial } from "@/contexts/FinancialContext";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  aggregateSalesByProduct, 
  computeCFUFromSales, 
  getValidAllocationPeriod,
  type AllocationMethod 
} from "@/utils/fixedCostsUtils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function CustosFixos() {
  const { 
    mediaFaturamento, 
    fixedCostsConfig, 
    setFixedCostsConfig, 
    saveFixedCostsConfig, 
    selectAllocationResult,
    isLoading,
    isInitializing 
  } = useFinancial();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingCusto, setEditingCusto] = useState<any>(null);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    monthly: "",
    category: "operacional"
  });
  const [tempCategories, setTempCategories] = useState<string[]>([]);

  // Get allocation data from context
  const allocationResult = selectAllocationResult();
  const allWarnings = allocationResult.warnings;

  // Categorias padrão e dinâmicas
  const defaultCategories = ["operacional", "administrativo", "comercial", "outros"];
  const getUniqueCategories = () => {
    const existingCategories = fixedCostsConfig.costs.map(cost => cost.category).filter(Boolean);
    const allCategories = [...new Set([...defaultCategories, ...existingCategories, ...tempCategories])];
    return allCategories.sort();
  };

  const totalCustos = fixedCostsConfig.costs.reduce((sum, custo) => sum + custo.monthly, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPercentage = (valor: number) => {
    return totalCustos > 0 ? ((valor / totalCustos) * 100).toFixed(1) : '0.0';
  };

  const getPercentualFaturamento = (valor: number) => {
    if (mediaFaturamento === 0) return null;
    return (valor / mediaFaturamento);
  };

  const formatPercentage = (percentage: number | null) => {
    if (percentage === null) return "—";
    return new Intl.NumberFormat('pt-BR', { 
      style: 'percent', 
      maximumFractionDigits: 1 
    }).format(percentage);
  };

  const getPercentualTotalFaturamento = () => {
    if (mediaFaturamento === 0) return 0;
    return fixedCostsConfig.costs.reduce((sum, custo) => sum + (custo.monthly / mediaFaturamento), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCost = {
      id: editingCusto ? editingCusto.id : Date.now().toString(),
      name: formData.name,
      monthly: parseFloat(formData.monthly),
      category: formData.category
    };

    const updatedCosts = editingCusto 
      ? fixedCostsConfig.costs.map(c => c.id === editingCusto.id ? newCost : c)
      : [...fixedCostsConfig.costs, newCost];

    const updatedConfig = {
      ...fixedCostsConfig,
      costs: updatedCosts
    };

    console.log('💾 Persistindo alterações automaticamente...');
    setFixedCostsConfig(updatedConfig);
    await saveFixedCostsConfig(updatedConfig);

    setDialogOpen(false);
    setEditingCusto(null);
    setCategoryPopoverOpen(false);
    setFormData({ name: "", monthly: "", category: "operacional" });
  };

  const handleEdit = (custo: any) => {
    setEditingCusto(custo);
    setFormData({
      name: custo.name,
      monthly: custo.monthly.toString(),
      category: custo.category
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    console.log('🗑️ Excluindo custo fixo:', id);
    const updatedCosts = fixedCostsConfig.costs.filter(c => c.id !== id);
    const updatedConfig = {
      ...fixedCostsConfig,
      costs: updatedCosts
    };
    
    console.log('💾 Persistindo exclusão automaticamente...');
    setFixedCostsConfig(updatedConfig);
    await saveFixedCostsConfig(updatedConfig);
  };

  const handleAllocationMethodChange = async (method: 'units' | 'revenue_real') => {
    const updatedConfig = {
      ...fixedCostsConfig,
      allocationMethod: method
    };
    
    console.log('💾 Persistindo alteração do método de rateio automaticamente...');
    setFixedCostsConfig(updatedConfig);
    await saveFixedCostsConfig(updatedConfig);
  };

  const handleUploadedData = async (costs: any[]) => {
    console.log('📤 Processando custos fixos importados:', costs);
    
    const newCosts = costs.map(cost => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: cost.name,
      monthly: cost.monthly,
      category: cost.category
    }));

    const updatedConfig = {
      ...fixedCostsConfig,
      costs: [...fixedCostsConfig.costs, ...newCosts]
    };

    console.log('💾 Persistindo custos importados automaticamente...');
    setFixedCostsConfig(updatedConfig);
    await saveFixedCostsConfig(updatedConfig);
    
    setUploadDialogOpen(false);
    
    toast({
      title: "Custos importados com sucesso!",
      description: `${newCosts.length} custos fixos foram adicionados ao sistema.`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Custos Fixos</h1>
          <p className="text-muted-foreground">
            Gerencie seus custos fixos mensais
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Importar Custos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Importar Custos Fixos</DialogTitle>
                <DialogDescription>
                  Faça upload de um arquivo com seus custos fixos para importação automática
                </DialogDescription>
              </DialogHeader>
              <CostUploader onDataProcessed={handleUploadedData} />
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Custo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCusto ? 'Editar Custo Fixo' : 'Novo Custo Fixo'}
                </DialogTitle>
                <DialogDescription>
                  Adicione ou edite um custo fixo mensal
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nome
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="col-span-3"
                      placeholder="Ex: Aluguel"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="monthly" className="text-right">
                      Valor Mensal (R$)
                    </Label>
                    <Input
                      id="monthly"
                      type="number"
                      step="0.01"
                      value={formData.monthly}
                      onChange={(e) => setFormData({ ...formData, monthly: e.target.value })}
                      className="col-span-3"
                      placeholder="Digite o valor"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Categoria
                    </Label>
                     <div className="col-span-3">
                       <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                         <PopoverTrigger asChild>
                           <Button
                             variant="outline"
                             role="combobox"
                             aria-expanded={categoryPopoverOpen}
                             className={cn(
                               "w-full justify-between",
                               !formData.category && "text-muted-foreground"
                             )}
                           >
                             {formData.category
                               ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1)
                               : "Selecione ou digite uma categoria"}
                             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent className="p-0 w-full bg-popover z-50">
                           <Command>
                             <CommandInput 
                               placeholder="Procurar ou criar categoria..." 
                               value={formData.category}
                               onValueChange={(value) => setFormData({ ...formData, category: value })}
                             />
                             <CommandList>
                               <CommandEmpty>
                                 {formData.category && 
                                  formData.category.trim() !== "" && 
                                  !getUniqueCategories().includes(formData.category.toLowerCase()) ? (
                                   <div className="p-1">
                                     <Button
                                       type="button"
                                       variant="default"
                                       size="sm"
                                       className="w-full bg-green-600 hover:bg-green-700 text-white justify-start"
                                        onClick={() => {
                                          const categoryName = formData.category.trim().toLowerCase();
                                          setFormData({ ...formData, category: categoryName });
                                          setTempCategories(prev => [...new Set([...prev, categoryName])]);
                                          setCategoryPopoverOpen(false);
                                          toast({
                                            title: "Nova categoria criada!",
                                            description: `A categoria "${categoryName}" foi adicionada e está disponível para uso.`,
                                          });
                                        }}
                                     >
                                       <Plus className="mr-2 h-4 w-4" />
                                       Criar Nova: "{formData.category}"
                                     </Button>
                                   </div>
                                 ) : (
                                   <div className="p-2 text-sm text-muted-foreground text-center">
                                     {formData.category ? "Nenhuma categoria encontrada" : "Digite para procurar ou criar uma categoria"}
                                   </div>
                                 )}
                               </CommandEmpty>
                               <CommandGroup>
                                 {getUniqueCategories().map((category) => (
                                   <CommandItem
                                     key={category}
                                     value={category}
                                     onSelect={(currentValue) => {
                                       setFormData({ ...formData, category: currentValue });
                                       setCategoryPopoverOpen(false);
                                     }}
                                   >
                                     <Check
                                       className={cn(
                                         "mr-2 h-4 w-4",
                                         formData.category === category ? "opacity-100" : "opacity-0"
                                       )}
                                     />
                                     {category.charAt(0).toUpperCase() + category.slice(1)}
                                   </CommandItem>
                                 ))}
                               </CommandGroup>
                             </CommandList>
                           </Command>
                         </PopoverContent>
                       </Popover>
                     </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingCusto ? 'Salvar' : 'Adicionar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Seção de Avisos sobre Rateio */}
      {allWarnings.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <div className="space-y-1">
              {allWarnings.map((warning, index) => (
                <div key={index} className="text-sm">{warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Dados do Rateio */}
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Dados para o Rateio
            <span className="text-sm font-normal text-muted-foreground">
              (período: {new Date(allocationResult.effectivePeriod.startISO).toLocaleDateString('pt-BR')} a {new Date(allocationResult.effectivePeriod.endISO).toLocaleDateString('pt-BR')})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {allocationResult.totals.totalUnits.toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-muted-foreground">Total de Unidades</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(allocationResult.totals.totalRevenue)}
              </div>
              <div className="text-sm text-muted-foreground">Faturamento Real</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {allocationResult.totals.validSalesCount}
              </div>
              <div className="text-sm text-muted-foreground">Produtos com Vendas</div>
            </div>
          </div>
          
          {allocationResult.totals.unmappedSales > 0 && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-800 dark:text-orange-200">
                <strong>{allocationResult.totals.unmappedSales}</strong> produtos vendidos não estão mapeados no sistema e foram excluídos do rateio.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinancialCard
          title="Total de Custos Fixos"
          value={formatCurrency(totalCustos)}
          subtitle={`${fixedCostsConfig.costs.length} itens cadastrados`}
          icon={<DollarSign className="h-5 w-5" />}
          variant="default"
          loading={isInitializing}
        />

        <FinancialCard
          title="Maior Custo"
          value={fixedCostsConfig.costs.length > 0 ? formatCurrency(Math.max(...fixedCostsConfig.costs.map(c => c.monthly))) : formatCurrency(0)}
          subtitle={fixedCostsConfig.costs.length > 0 ? fixedCostsConfig.costs.find(c => c.monthly === Math.max(...fixedCostsConfig.costs.map(c => c.monthly)))?.name : "Nenhum"}
          variant={fixedCostsConfig.costs.length > 0 ? "warning" : "default"}
          loading={isInitializing}
        />

        <FinancialCard
          title="Custo Médio"
          value={fixedCostsConfig.costs.length > 0 ? formatCurrency(totalCustos / fixedCostsConfig.costs.length) : formatCurrency(0)}
          subtitle="Por item"
          variant="default"
          loading={isInitializing}
        />

        <FinancialCard
          title="% Total de Faturamento"
          value={formatPercentage(getPercentualTotalFaturamento())}
          subtitle="Participação total sobre o faturamento"
          variant="success"
          loading={isInitializing}
        />
      </div>

      <Card className="financial-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Custos Fixos</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  <div className="space-y-2">
                    <p><strong>Por unidade:</strong> Divide o custo fixo proporcionalmente ao número de itens vendidos de cada produto.</p>
                    <p><strong>Por valor vendido:</strong> Divide o custo fixo proporcionalmente à participação de cada produto no faturamento real.</p>
                  </div>
                </TooltipContent>
              </Tooltip>
              <Label htmlFor="allocation-method" className="text-sm">Método de Rateio:</Label>
            </div>
            <Select value={fixedCostsConfig.allocationMethod} onValueChange={handleAllocationMethodChange}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="units">Por unidade</SelectItem>
                <SelectItem value="revenue_real">Por valor vendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isInitializing ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : fixedCostsConfig.costs.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="h-12 w-12" />}
              title="Nenhum custo fixo cadastrado"
              description="Comece adicionando seus primeiros custos fixos mensais"
              action={
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Custo
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>% do Total</TableHead>
                  <TableHead>% do Faturamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixedCostsConfig.costs.map((custo) => (
                  <TableRow key={custo.id}>
                    <TableCell className="font-medium">{custo.name}</TableCell>
                    <TableCell>{formatCurrency(custo.monthly)}</TableCell>
                    <TableCell>{getPercentage(custo.monthly)}%</TableCell>
                    <TableCell>
                      {mediaFaturamento === 0 ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-muted-foreground">—</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Informe faturamentos mensais para calcular a participação no faturamento</p>
                          </TooltipContent>
                        </Tooltip>
                        ) : (
                        formatPercentage(getPercentualFaturamento(custo.monthly))
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(custo)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(custo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Linha de Total */}
                <TableRow className="border-t-2 font-semibold bg-muted/50">
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell className="font-bold">{formatCurrency(totalCustos)}</TableCell>
                  <TableCell className="font-bold">100,0%</TableCell>
                  <TableCell className="font-bold">
                    {mediaFaturamento === 0 ? "—" : formatPercentage(getPercentualTotalFaturamento())}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
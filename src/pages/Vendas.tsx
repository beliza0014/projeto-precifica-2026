import React, { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Upload, Download, Filter, Calendar, ShoppingCart, TrendingUp, Package, Calculator, Info } from "lucide-react";
import { SalesDataUploader } from "@/components/SalesDataUploader";
import { useFinancial } from "@/contexts/FinancialContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialCard } from "@/components/FinancialCard";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

// Interface for SaleItem
interface SaleItem {
  id: string;
  date: string; // 'YYYY-MM-DD'
  variantId: string;
  quantity: number;
  unitPriceNet: number;
  channel?: 'balcao' | 'ifood' | 'delivery' | 'cartao';
  branchId?: string;
  status?: 'paid' | 'completed' | 'canceled' | 'refunded';
}

export default function Vendas() {
  const {
    salesData,
    setSalesData,
    saveSalesData,
    variacoesConfig,
    isLoading,
    isInitializing
  } = useFinancial();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleItem | null>(null);
  const [formData, setFormData] = useState<Partial<SaleItem>>({
    date: new Date().toISOString().split('T')[0],
    variantId: '',
    quantity: 1,
    unitPriceNet: 0,
    channel: 'balcao'
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showUploader, setShowUploader] = useState(false);

  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    channel: 'all'
  });

  // Get available variants for selection
  const availableVariants = variacoesConfig.variacoes || [];

  // Filter sales data
  const filteredSales = useMemo(() => {
    return salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      const startDate = new Date(filters.startDate.toISOString().split('T')[0]);
      const endDate = new Date(filters.endDate.toISOString().split('T')[0]);
      const dateMatch = saleDate >= startDate && saleDate <= endDate;
      const channelMatch = filters.channel === 'all' || sale.channel === filters.channel;
      return dateMatch && channelMatch;
    });
  }, [salesData, filters]);

  // Calculate totals
  const totals = useMemo(() => {
    const activeSales = filteredSales.filter(sale => 
      sale.status !== 'canceled' && sale.status !== 'refunded'
    );
    
    const totalQuantity = activeSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = activeSales.reduce((sum, sale) => sum + (sale.quantity * sale.unitPriceNet), 0);
    const averageTicket = totalQuantity > 0 ? totalRevenue / activeSales.length : 0;

    return { totalQuantity, totalRevenue, averageTicket, totalSales: activeSales.length };
  }, [filteredSales]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.variantId || !formData.quantity || !formData.unitPriceNet) {
      toast({
        title: "Erro de validação",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (formData.quantity <= 0 || formData.unitPriceNet <= 0) {
      toast({
        title: "Erro de validação",
        description: "Quantidade e preço devem ser maiores que zero.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newSale: SaleItem = {
        id: editingSale?.id || Date.now().toString(),
        date: selectedDate.toISOString().split('T')[0],
        variantId: formData.variantId!,
        quantity: formData.quantity!,
        unitPriceNet: formData.unitPriceNet!,
        channel: formData.channel || 'balcao',
        status: 'paid'
      };

      let updatedSales;
      if (editingSale) {
        updatedSales = salesData.map(sale => 
          sale.id === editingSale.id ? newSale : sale
        );
      } else {
        updatedSales = [...salesData, newSale];
      }

      await saveSalesData(updatedSales);
      
      setDialogOpen(false);
      setEditingSale(null);
      setSelectedDate(new Date());
      setFormData({
        date: new Date().toISOString().split('T')[0],
        variantId: '',
        quantity: 1,
        unitPriceNet: 0,
        channel: 'balcao'
      });

      toast({
        title: "Venda salva com sucesso!",
        description: editingSale ? "Venda atualizada." : "Nova venda registrada."
      });
    } catch (error) {
      console.error('Error saving sale:', error);
    }
  };

  const handleEdit = (sale: SaleItem) => {
    setEditingSale(sale);
    setFormData(sale);
    setSelectedDate(new Date(sale.date));
    setDialogOpen(true);
  };

  const handleDelete = async (saleId: string) => {
    const updatedSales = salesData.filter(sale => sale.id !== saleId);
    await saveSalesData(updatedSales);
    
    toast({
      title: "Venda removida",
      description: "A venda foi removida com sucesso."
    });
  };

  const handleDataProcessed = async (importedSales: SaleItem[]) => {
    try {
      // Sort imported sales by date (newest first) then merge with existing data
      const sortedImported = importedSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const mergedSales = [...salesData, ...sortedImported];
      
      // Sort all sales by date (newest first)
      const sortedSales = mergedSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      await saveSalesData(sortedSales);
      setShowUploader(false);
      
      toast({
        title: "Dados importados com sucesso!",
        description: `${importedSales.length} vendas foram adicionadas e organizadas automaticamente.`
      });
    } catch (error) {
      console.error('Error processing imported data:', error);
      toast({
        title: "Erro ao processar dados",
        description: "Ocorreu um erro ao salvar os dados importados.",
        variant: "destructive"
      });
    }
  };

  const getVariantName = (variantId: string) => {
    const variant = availableVariants.find(v => v.id === variantId);
    return variant ? variant.nome : 'Produto não encontrado';
  };

  const getChannelLabel = (channel?: string) => {
    const labels = {
      'balcao': 'Balcão',
      'ifood': 'iFood',
      'delivery': 'Delivery',
      'cartao': 'Cartão'
    };
    return labels[channel as keyof typeof labels] || 'N/A';
  };

  const getStatusLabel = (status?: string) => {
    const labels = {
      'paid': 'Pago',
      'completed': 'Concluído',
      'canceled': 'Cancelado',
      'refunded': 'Reembolsado'
    };
    return labels[status as keyof typeof labels] || 'N/A';
  };

  const getStatusVariant = (status?: string) => {
    const variants = {
      'paid': 'default',
      'completed': 'default',
      'canceled': 'destructive',
      'refunded': 'outline'
    };
    return variants[status as keyof typeof variants] || 'default';
  };

  if (isInitializing) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendas</h1>
          <p className="text-muted-foreground">
            Registro e importação de vendas reais para análise de indicadores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1">
                    <p>Aqui você pode importar suas vendas usando um arquivo Excel / CSV / JSON ou TXT.</p>
                    <p>Se os nomes das colunas no seu arquivo forem diferentes dos usados no sistema, não se preocupe: você poderá indicar manualmente qual coluna corresponde a cada informação necessária (como Produto, Quantidade e Preço Unitário).</p>
                    <p>Assim, mesmo arquivos com nomes diferentes funcionam corretamente.</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button 
              variant="outline"
              onClick={() => setShowUploader(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Carregar Dados de Vendas
            </Button>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingSale ? 'Editar Venda' : 'Nova Venda'}
                  </DialogTitle>
                  <DialogDescription>
                    Registre uma nova venda ou edite uma existente.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Data</Label>
                      <DatePicker
                        date={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(date);
                            setFormData({ ...formData, date: date.toISOString().split('T')[0] });
                          }
                        }}
                        placeholder="Selecione a data"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="channel">Canal</Label>
                      <Select 
                        value={formData.channel} 
                        onValueChange={(value) => setFormData({ ...formData, channel: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="balcao">Balcão</SelectItem>
                          <SelectItem value="ifood">iFood</SelectItem>
                          <SelectItem value="delivery">Delivery</SelectItem>
                          <SelectItem value="cartao">Cartão</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="variant">Produto/Variação</Label>
                    <Select 
                      value={formData.variantId} 
                      onValueChange={(value) => setFormData({ ...formData, variantId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVariants.map((variant) => (
                          <SelectItem key={variant.id} value={variant.id}>
                            {variant.nome} - {variant.produtoBaseNome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço Líquido (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.unitPriceNet}
                        onChange={(e) => setFormData({ ...formData, unitPriceNet: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>

                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : (editingSale ? 'Atualizar' : 'Criar')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Data Uploader Modal */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="sm:max-w-[600px]">
          <SalesDataUploader 
            onDataProcessed={handleDataProcessed}
            availableVariants={availableVariants}
          />
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <FinancialCard
          title="Total de Vendas"
          value={totals.totalSales.toString()}
          subtitle="Período selecionado"
          icon={<ShoppingCart className="h-5 w-5" />}
          variant="default"
        />
        <FinancialCard
          title="Quantidade Vendida"
          value={totals.totalQuantity.toString()}
          subtitle="Unidades totais"
          icon={<Package className="h-5 w-5" />}
          variant="default"
        />
        <FinancialCard
          title="Receita Total"
          value={`R$ ${totals.totalRevenue.toFixed(2)}`}
          subtitle="Faturamento bruto"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
        <FinancialCard
          title="Ticket Médio"
          value={`R$ ${totals.averageTicket.toFixed(2)}`}
          subtitle="Valor médio por venda"
          icon={<Calculator className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Vendas Registradas
            </CardTitle>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filtros:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <DatePicker
                  date={filters.startDate}
                  onSelect={(date) => date && setFilters({ ...filters, startDate: date })}
                  placeholder="Data inicial"
                  className="w-[140px]"
                />
                <span className="text-muted-foreground">a</span>
                <DatePicker
                  date={filters.endDate}
                  onSelect={(date) => date && setFilters({ ...filters, endDate: date })}
                  placeholder="Data final"
                  className="w-[140px]"
                />
              </div>

              <Select 
                value={filters.channel} 
                onValueChange={(value) => setFilters({ ...filters, channel: value })}
              >
                <SelectTrigger className="w-[140px]">
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
        </CardHeader>

        <CardContent>
          {filteredSales.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart className="h-12 w-12" />}
              title="Nenhuma venda registrada"
              description="Adicione vendas para começar a acompanhar seus indicadores de performance."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">
                      {getVariantName(sale.variantId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getChannelLabel(sale.channel)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right">R$ {sale.unitPriceNet.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {(sale.quantity * sale.unitPriceNet).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(sale)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sale.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
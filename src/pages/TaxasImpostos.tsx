import { useState } from "react";
import { Plus, Edit2, Trash2, Receipt, Save, Loader2, Percent, DollarSign } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface CustomTaxFee {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  channel?: string;
  active: boolean;
}

export default function TaxasImpostos() {
  const { toast } = useToast();
  const { 
    customTaxesFeesConfig, 
    setCustomTaxesFeesConfig, 
    saveCustomTaxesFeesConfig,
    getTotalPercentageTaxes,
    getTotalFixedTaxes,
    mediaFaturamento,
    isLoading 
  } = useFinancial();
  
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<CustomTaxFee | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    channel: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const calculateTotalTaxValue = () => {
    const percentageTaxes = getTotalPercentageTaxes() * mediaFaturamento;
    const fixedTaxes = getTotalFixedTaxes();
    return percentageTaxes + fixedTaxes;
  };

  const getTotalPercentageDisplay = () => {
    const totalValue = calculateTotalTaxValue();
    return mediaFaturamento > 0 ? (totalValue / mediaFaturamento) * 100 : 0;
  };

  const generateId = () => {
    return 'tax_' + Math.random().toString(36).substr(2, 9);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.value) {
      toast({
        title: "❌ Campos obrigatórios",
        description: "Nome e valor são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const taxData: CustomTaxFee = {
      id: editingTax?.id || generateId(),
      name: formData.name.trim(),
      type: formData.type,
      value: parseFloat(formData.value),
      channel: formData.channel || undefined,
      active: true
    };

    const updatedTaxes = editingTax 
      ? customTaxesFeesConfig.taxes.map(tax => tax.id === editingTax.id ? taxData : tax)
      : [...customTaxesFeesConfig.taxes, taxData];

    const updatedConfig = { taxes: updatedTaxes };

    console.log('💾 Persistindo alterações automaticamente...');
    setCustomTaxesFeesConfig(updatedConfig);
    await saveCustomTaxesFeesConfig(updatedConfig);

    setDialogOpen(false);
    setEditingTax(null);
    resetForm();
    
    toast({
      title: "✅ Taxa salva!",
      description: `${editingTax ? 'Taxa atualizada' : 'Nova taxa adicionada'} com sucesso.`,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'percentage',
      value: '',
      channel: ''
    });
  };

  const handleEdit = (tax: CustomTaxFee) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      type: tax.type,
      value: tax.value.toString(),
      channel: tax.channel || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (taxId: string) => {
    console.log('🗑️ Excluindo taxa:', taxId);
    const updatedTaxes = customTaxesFeesConfig.taxes.filter(tax => tax.id !== taxId);
    const updatedConfig = { taxes: updatedTaxes };
    
    console.log('💾 Persistindo exclusão automaticamente...');
    setCustomTaxesFeesConfig(updatedConfig);
    await saveCustomTaxesFeesConfig(updatedConfig);
    
    toast({
      title: "✅ Taxa removida",
      description: "Taxa excluída com sucesso.",
    });
  };

  const handleToggleActive = async (taxId: string) => {
    console.log('🔄 Alterando status da taxa:', taxId);
    const updatedTaxes = customTaxesFeesConfig.taxes.map(tax => 
      tax.id === taxId ? { ...tax, active: !tax.active } : tax
    );
    const updatedConfig = { taxes: updatedTaxes };
    
    console.log('💾 Persistindo alteração de status automaticamente...');
    setCustomTaxesFeesConfig(updatedConfig);
    await saveCustomTaxesFeesConfig(updatedConfig);
  };


  const hasTaxes = customTaxesFeesConfig.taxes.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Taxas e Impostos</h1>
          <p className="text-muted-foreground">
            Configuração flexível de taxas, impostos e custos diversos
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => { resetForm(); setEditingTax(null); }}>
              <Plus className="h-4 w-4" />
              Adicionar Nova Taxa/Imposto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTax ? `Editar ${editingTax.name}` : 'Adicionar Nova Taxa/Imposto'}
              </DialogTitle>
              <DialogDescription>
                Configure uma nova taxa, imposto ou custo adicional
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Taxa/Imposto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex.: ISS, ICMS, Cartão Visa, iFood"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select value={formData.type} onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="value">
                    {formData.type === 'percentage' ? 'Alíquota (%)' : 'Valor (R$)'} *
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'percentage' ? "5.00" : "2.50"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel">Canal de Aplicação (opcional)</Label>
                  <Input
                    id="channel"
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    placeholder="Ex.: balcão, delivery, iFood, cartão"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingTax ? 'Atualizar Taxa' : 'Adicionar Taxa'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="financial-card border-muted bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento Médio (Somente Leitura)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{formatCurrency(mediaFaturamento)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Base para cálculo das taxas - configurado em Faturamento
            </p>
          </CardContent>
        </Card>

        <Card className="financial-card border-muted bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Taxas Percentuais (Calculado)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold text-muted-foreground">
                {formatPercentage(getTotalPercentageTaxes() * 100)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enviado para Precificação como "t"
            </p>
          </CardContent>
        </Card>

        <Card className="financial-card border-muted bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Taxas Fixas (Calculado)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold text-muted-foreground">
                {formatCurrency(getTotalFixedTaxes())}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enviado para Precificação como "F_extra"
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Taxas e Impostos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasTaxes ? (
            <EmptyState
              icon={<Receipt className="h-12 w-12" />}
              title="Nenhuma taxa configurada"
              description="Adicione taxas, impostos e custos personalizados para seu negócio"
              action={
                <Button onClick={() => { resetForm(); setEditingTax(null); setDialogOpen(true); }} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Primeira Taxa
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customTaxesFeesConfig.taxes.map((tax) => (
                    <TableRow key={tax.id}>
                      <TableCell className="font-medium">{tax.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {tax.type === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {tax.type === 'percentage' 
                          ? formatPercentage(tax.value) 
                          : formatCurrency(tax.value)
                        }
                      </TableCell>
                      <TableCell>
                        {tax.channel ? (
                          <Badge variant="secondary">{tax.channel}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Geral</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={tax.active}
                            onCheckedChange={() => handleToggleActive(tax.id)}
                          />
                          <span className="text-sm">
                            {tax.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(tax)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(tax.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
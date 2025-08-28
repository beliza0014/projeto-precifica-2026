import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Package, Calculator, Save, Loader2, Upload, Info } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialCard } from "@/components/FinancialCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { InsumosUploaderWizard } from "@/components/InsumosUploader/InsumosUploaderWizard";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export default function Insumos() {
  const { 
    insumos: globalInsumos, 
    setInsumos: setGlobalInsumos, 
    saveInsumos, 
    isLoading: isSaving,
    isInitializing 
  } = useFinancial();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calculadoraOpen, setCalculadoraOpen] = useState(false);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    produto: "",
    precoPago: "",
    volumeItem: "",
    unidade: 'KG' as Insumo['unidade'],
    quantidadeBruta: "",
    quantidadeLiquida: "",
    fatorCorrecao: 1
  });

  // Calculator states  
  const [calculadoraData, setCalculadoraData] = useState({
    quantidadeBruta: "",
    quantidadeLiquida: "",
    fatorCalculado: 1
  });

  useEffect(() => {
    loadInsumos();
  }, [isInitializing]);

  const loadInsumos = async () => {
    console.log('🔄 Carregando insumos...');
    
    // Aguarda a inicialização do contexto
    if (isInitializing) {
      console.log('⏳ Aguardando inicialização do contexto...');
      return;
    }
    
    setLoading(true);
    try {
      // Verifica se já existem dados salvos no contexto
      if (globalInsumos.length > 0) {
        console.log('✅ Dados encontrados no contexto:', globalInsumos.length, 'insumos');
        setLoading(false);
        return;
      }
      
      console.log('📦 Dados não encontrados - interface limpa sem simulação');
      setLoading(false);
    } catch (error) {
      console.error('Error loading insumos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calcularFator = () => {
    const bruta = parseFloat(calculadoraData.quantidadeBruta);
    const liquida = parseFloat(calculadoraData.quantidadeLiquida);
    
    if (liquida > 0) {
      const fator = bruta / liquida;
      setCalculadoraData({ ...calculadoraData, fatorCalculado: fator });
      return fator;
    }
    return 1;
  };

  const usarFatorCalculado = () => {
    setFormData({ ...formData, fatorCorrecao: calculadoraData.fatorCalculado });
    setCalculadoraOpen(false);
  };

  // Calculate factor automatically from quantities
  const calculateFatorCorrecao = (quantidadeBruta: string, quantidadeLiquida: string): number => {
    const bruta = parseFloat(quantidadeBruta) || 0;
    const liquida = parseFloat(quantidadeLiquida) || 0;
    
    if (liquida === 0) return 0;
    if (bruta === 0) return 0;
    
    return Number((bruta / liquida).toFixed(2));
  };

  const calculateValues = (data: typeof formData) => {
    const precoPago = parseFloat(data.precoPago) || 0;
    const fatorCorrecao = data.fatorCorrecao || 1;
    const volumeItem = parseFloat(data.volumeItem) || 1;
    
    const custoEfetivo = precoPago / Math.max(fatorCorrecao, 0.0001);
    const valorFinalUnit = precoPago * fatorCorrecao;
    
    return { custoEfetivo, valorFinalUnit };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Salvando insumo...');
    const { custoEfetivo, valorFinalUnit } = calculateValues(formData);
    
    const newInsumo: Insumo = {
      id: editingInsumo ? editingInsumo.id : Date.now().toString(),
      produto: formData.produto,
      precoPago: parseFloat(formData.precoPago),
      volumeItem: parseFloat(formData.volumeItem),
      unidade: formData.unidade,
      fatorCorrecao: formData.fatorCorrecao,
      custoEfetivo,
      valorFinalUnit,
      quantidadeBruta: parseFloat(formData.quantidadeBruta) || undefined,
      quantidadeLiquida: parseFloat(formData.quantidadeLiquida) || undefined
    };

    const updatedInsumos = editingInsumo 
      ? globalInsumos.map(i => i.id === editingInsumo.id ? newInsumo : i)
      : [...globalInsumos, newInsumo];
    
    console.log('💾 Persistindo alterações automaticamente...');
    setGlobalInsumos(updatedInsumos);
    await saveInsumos(updatedInsumos);

    setDialogOpen(false);
    setEditingInsumo(null);
    setFormData({ 
      produto: "", 
      precoPago: "", 
      volumeItem: "", 
      unidade: 'KG', 
      quantidadeBruta: "",
      quantidadeLiquida: "",
      fatorCorrecao: 1 
    });
  };

  const handleEdit = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setFormData({
      produto: insumo.produto,
      precoPago: insumo.precoPago.toString(),
      volumeItem: insumo.volumeItem.toString(),
      unidade: insumo.unidade,
      quantidadeBruta: insumo.quantidadeBruta?.toString() || "",
      quantidadeLiquida: insumo.quantidadeLiquida?.toString() || "",
      fatorCorrecao: insumo.fatorCorrecao
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    console.log('🗑️ Excluindo insumo:', id);
    const updatedInsumos = globalInsumos.filter(i => i.id !== id);
    
    console.log('💾 Persistindo exclusão automaticamente...');
    setGlobalInsumos(updatedInsumos);
    await saveInsumos(updatedInsumos);
  };

  const totalInsumos = globalInsumos.length;
  const custoMedioEfetivo = globalInsumos.length > 0 
    ? globalInsumos.reduce((sum, i) => sum + i.custoEfetivo, 0) / globalInsumos.length 
    : 0;

  const currentValues = calculateValues(formData);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Insumos</h1>
          <p className="text-muted-foreground">
            Controle de matéria-prima e custos efetivos
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={uploaderOpen} onOpenChange={setUploaderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Importar Insumos</DialogTitle>
                <DialogDescription>
                  Importe insumos de arquivos CSV ou XLSX com mapeamento automático de colunas
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <InsumosUploaderWizard 
                  onComplete={() => {
                    setUploaderOpen(false);
                    loadInsumos(); // Refresh the data
                  }} 
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={calculadoraOpen} onOpenChange={setCalculadoraOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calculator className="h-4 w-4" />
                Calculadora
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Calculadora de Fator de Correção</DialogTitle>
                <DialogDescription>
                  Calcule o fator baseado na perda durante o processamento
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantidadeBruta" className="text-right">
                    Qtd. Bruta
                  </Label>
                  <Input
                    id="quantidadeBruta"
                    type="number"
                    step="0.001"
                    value={calculadoraData.quantidadeBruta}
                    onChange={(e) => setCalculadoraData({ 
                      ...calculadoraData, 
                      quantidadeBruta: e.target.value 
                    })}
                    className="col-span-3"
                    placeholder="Quantidade inicial"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantidadeLiquida" className="text-right">
                    Qtd. Líquida
                  </Label>
                  <Input
                    id="quantidadeLiquida"
                    type="number"
                    step="0.001"
                    value={calculadoraData.quantidadeLiquida}
                    onChange={(e) => setCalculadoraData({ 
                      ...calculadoraData, 
                      quantidadeLiquida: e.target.value 
                    })}
                    className="col-span-3"
                    placeholder="Quantidade utilizável"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Fator</Label>
                  <div className="col-span-3 p-2 bg-muted rounded-md">
                    {calculadoraData.fatorCalculado.toFixed(3)}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={calcularFator}>
                  Calcular
                </Button>
                <Button onClick={usarFatorCalculado}>
                  Usar Fator
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Insumo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingInsumo ? 'Editar Insumo' : 'Novo Insumo'}
                </DialogTitle>
                <DialogDescription>
                  Adicione insumos com fator de correção para perda
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="produto" className="text-right">
                      Produto
                    </Label>
                    <Input
                      id="produto"
                      value={formData.produto}
                      onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
                      className="col-span-3"
                      placeholder="Nome do insumo"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="precoPago" className="text-right">
                      Preço Pago (R$)
                    </Label>
                    <Input
                      id="precoPago"
                      type="number"
                      step="0.01"
                      value={formData.precoPago}
                      onChange={(e) => setFormData({ ...formData, precoPago: e.target.value })}
                      className="col-span-3"
                      placeholder="Digite o preço"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="volumeItem" className="text-right">
                      Volume/Item
                    </Label>
                    <div className="col-span-3 flex gap-2">
                      <Input
                        id="volumeItem"
                        type="number"
                        step="0.001"
                        value={formData.volumeItem}
                        onChange={(e) => setFormData({ ...formData, volumeItem: e.target.value })}
                        className="flex-1"
                        placeholder="1"
                        required
                      />
                      <Select
                        value={formData.unidade}
                        onValueChange={(value: Insumo['unidade']) => 
                          setFormData({ ...formData, unidade: value })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KG">KG</SelectItem>
                          <SelectItem value="G">G</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="ML">ML</SelectItem>
                          <SelectItem value="UN">UN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantidadeBruta" className="text-right">
                      Quantidade Bruta
                    </Label>
                    <Input
                      id="quantidadeBruta"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quantidadeBruta}
                      onChange={(e) => {
                        const newFormData = { ...formData, quantidadeBruta: e.target.value };
                        newFormData.fatorCorrecao = calculateFatorCorrecao(newFormData.quantidadeBruta, newFormData.quantidadeLiquida);
                        setFormData(newFormData);
                      }}
                      className="col-span-3"
                      placeholder="Ex: 1.00"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantidadeLiquida" className="text-right">
                      Quantidade Líquida
                    </Label>
                    <Input
                      id="quantidadeLiquida"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quantidadeLiquida}
                      onChange={(e) => {
                        const newFormData = { ...formData, quantidadeLiquida: e.target.value };
                        newFormData.fatorCorrecao = calculateFatorCorrecao(newFormData.quantidadeBruta, newFormData.quantidadeLiquida);
                        setFormData(newFormData);
                      }}
                      className="col-span-3"
                      placeholder="Ex: 0.85"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right flex items-center justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p>Número usado para multiplicar pelo valor pago do insumo, ajustando perdas ou partes não aproveitáveis.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Label>Fator de Correção</Label>
                    </div>
                    <div className="col-span-3 p-2 bg-muted rounded-md text-sm font-medium">
                      {formData.fatorCorrecao.toFixed(2)}
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h4 className="font-medium">Valores Calculados</h4>
                    <div className="text-sm">
                      <div>
                        <span className="text-muted-foreground">Preço Final:</span>
                        <div className="font-medium text-orange-500">{formatCurrency(currentValues.valorFinalUnit)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingInsumo ? 'Salvar' : 'Adicionar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinancialCard
          title="Total de Insumos"
          value={totalInsumos.toString()}
          subtitle="Itens cadastrados"
          icon={<Package className="h-5 w-5" />}
          variant="default"
          loading={loading}
        />

        <FinancialCard
          title="Custo Efetivo Médio"
          value={formatCurrency(custoMedioEfetivo)}
          subtitle="Por insumo"
          variant="default"
          loading={loading}
        />

        <FinancialCard
          title="Fator Médio"
          value={globalInsumos.length > 0 
            ? (globalInsumos.reduce((sum, i) => sum + i.fatorCorrecao, 0) / globalInsumos.length).toFixed(3)
            : "0.000"
          }
          subtitle="Eficiência média"
          variant={globalInsumos.length > 0 && 
            (globalInsumos.reduce((sum, i) => sum + i.fatorCorrecao, 0) / globalInsumos.length) < 0.8 
            ? "warning" : "success"}
          loading={loading}
        />
      </div>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Lista de Insumos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
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
          ) : globalInsumos.length === 0 ? (
            <EmptyState
              icon={<Package className="h-12 w-12" />}
              title="Nenhum insumo cadastrado"
              description="Adicione insumos para controlar custos de matéria-prima"
              action={
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Insumo
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Preço Pago</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Fator</TableHead>
                  <TableHead>Preço Final</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {globalInsumos.map((insumo) => (
                  <TableRow key={insumo.id}>
                    <TableCell className="font-medium">{insumo.produto}</TableCell>
                    <TableCell>{formatCurrency(insumo.precoPago)}</TableCell>
                    <TableCell>{insumo.volumeItem} {insumo.unidade}</TableCell>
                    <TableCell>
                      <span className="text-white">
                        {insumo.fatorCorrecao.toFixed(3)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className={
                        insumo.quantidadeLiquida && insumo.quantidadeBruta && 
                        insumo.quantidadeLiquida >= insumo.quantidadeBruta 
                          ? "text-green-500" 
                          : "text-orange-500"
                      }>
                        {formatCurrency(insumo.valorFinalUnit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(insumo)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(insumo.id)}
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
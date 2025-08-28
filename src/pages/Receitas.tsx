import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ChefHat, FileText, Download, Save, Loader2, Info } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialCard } from "@/components/FinancialCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
export default function Receitas() {
  const {
    receitas: globalReceitas,
    setReceitas: setGlobalReceitas,
    saveReceitas,
    insumos: globalInsumos,
    isLoading: isSaving,
    isInitializing
  } = useFinancial();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReceita, setEditingReceita] = useState<Receita | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    rendimentoQtd: "",
    rendimentoUnid: "fatias",
    perdaPercentual: ""
  });
  const [itensReceita, setItensReceita] = useState<ItemReceita[]>([]);
  const [novoItem, setNovoItem] = useState({
    insumoId: "",
    quantidade: ""
  });
  useEffect(() => {
    loadReceitas();
  }, [isInitializing]);
  const loadReceitas = async () => {
    console.log('🔄 Carregando receitas...');

    // Aguarda a inicialização do contexto
    if (isInitializing) {
      console.log('⏳ Aguardando inicialização do contexto...');
      return;
    }
    setLoading(true);
    try {
      // Verifica se já existem dados salvos no contexto
      if (globalReceitas.length > 0) {
        console.log('✅ Dados encontrados no contexto:', globalReceitas.length, 'receitas');
        setLoading(false);
        return;
      }
      console.log('📦 Dados não encontrados - interface limpa sem simulação');
      setLoading(false);
    } catch (error) {
      console.error('Error loading receitas:', error);
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
  const calcularCustos = (itens: ItemReceita[], perdaPercentual: number, rendimentoQtd: number) => {
    const custoTotal = itens.reduce((sum, item) => sum + item.custoItem, 0);
    const custoPosPerda = custoTotal / (1 - perdaPercentual / 100);
    const custoPorUnidade = custoPosPerda; // Agora mostra apenas o valor pós-perda

    return {
      custoTotal,
      custoPosPerda,
      custoPorUnidade
    };
  };
  const adicionarItem = () => {
    if (!novoItem.insumoId || !novoItem.quantidade) return;
    const insumo = globalInsumos.find(i => i.id === novoItem.insumoId);
    if (!insumo) return;
    const quantidade = parseFloat(novoItem.quantidade);
    const custoItem = quantidade * insumo.custoEfetivo;
    const item: ItemReceita = {
      insumoId: insumo.id,
      nomeInsumo: insumo.produto,
      quantidade,
      custoUnitario: insumo.custoEfetivo,
      custoItem
    };
    setItensReceita([...itensReceita, item]);
    setNovoItem({
      insumoId: "",
      quantidade: ""
    });
  };
  const removerItem = (index: number) => {
    setItensReceita(itensReceita.filter((_, i) => i !== index));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itensReceita.length === 0) {
      alert('Adicione pelo menos um item à receita');
      return;
    }
    const perdaPercentual = parseFloat(formData.perdaPercentual) || 0;
    const rendimentoQtd = parseFloat(formData.rendimentoQtd) || 1;
    const {
      custoTotal,
      custoPosPerda,
      custoPorUnidade
    } = calcularCustos(itensReceita, perdaPercentual, rendimentoQtd);
    const newReceita: Receita = {
      id: editingReceita ? editingReceita.id : Date.now().toString(),
      nome: formData.nome,
      rendimentoQtd,
      rendimentoUnid: formData.rendimentoUnid,
      perdaPercentual,
      itens: [...itensReceita],
      custoTotal,
      custoPosPerda,
      custoPorUnidade
    };
    const updatedReceitas = editingReceita ? globalReceitas.map(r => r.id === editingReceita.id ? newReceita : r) : [...globalReceitas, newReceita];
    console.log('💾 Persistindo alterações automaticamente...');
    setGlobalReceitas(updatedReceitas);
    await saveReceitas(updatedReceitas);
    resetForm();
  };
  const resetForm = () => {
    setDialogOpen(false);
    setEditingReceita(null);
    setFormData({
      nome: "",
      rendimentoQtd: "",
      rendimentoUnid: "fatias",
      perdaPercentual: ""
    });
    setItensReceita([]);
    setNovoItem({
      insumoId: "",
      quantidade: ""
    });
  };
  const handleEdit = (receita: Receita) => {
    setEditingReceita(receita);
    setFormData({
      nome: receita.nome,
      rendimentoQtd: receita.rendimentoQtd.toString(),
      rendimentoUnid: receita.rendimentoUnid,
      perdaPercentual: receita.perdaPercentual.toString()
    });
    setItensReceita([...receita.itens]);
    setDialogOpen(true);
  };
  const handleDelete = async (id: string) => {
    console.log('🗑️ Excluindo receita:', id);
    const updatedReceitas = globalReceitas.filter(r => r.id !== id);
    console.log('💾 Persistindo exclusão automaticamente...');
    setGlobalReceitas(updatedReceitas);
    await saveReceitas(updatedReceitas);
  };
  const exportarFicha = (receita: Receita) => {
    // Simulate PDF export
    alert(`Exportando ficha técnica de: ${receita.nome}`);
  };
  const currentCustos = calcularCustos(itensReceita, parseFloat(formData.perdaPercentual) || 0, parseFloat(formData.rendimentoQtd) || 1);
  const custoMedioPorUnidade = globalReceitas.length > 0 ? globalReceitas.reduce((sum, r) => sum + r.custoPorUnidade, 0) / globalReceitas.length : 0;
  return <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Receitas</h1>
          <p className="text-muted-foreground">
            Fichas técnicas e custos por receita
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReceita ? 'Editar Receita' : 'Nova Receita'}
              </DialogTitle>
              <DialogDescription>
                Crie fichas técnicas com custos calculados automaticamente
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 py-4">
                {/* Dados básicos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome da Receita</Label>
                    <Input id="nome" value={formData.nome} onChange={e => setFormData({
                    ...formData,
                    nome: e.target.value
                  })} placeholder="Ex: Pizza Margherita Grande" required />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="perdaPercentual">Perda (%)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Percentual do insumo que é perdido durante o preparo, como sobras, evaporação ou resíduos.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input id="perdaPercentual" type="number" step="0.1" min="0" max="50" value={formData.perdaPercentual} onChange={e => setFormData({
                    ...formData,
                    perdaPercentual: e.target.value
                  })} placeholder="Ex: 5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="rendimentoQtd">Rendimento Quantidade</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Quantidade final disponível após o preparo da receita.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input id="rendimentoQtd" type="number" step="0.1" min="0.1" value={formData.rendimentoQtd} onChange={e => setFormData({
                    ...formData,
                    rendimentoQtd: e.target.value
                  })} placeholder="Ex: 1" required />
                  </div>
                  <div>
                    <Label htmlFor="rendimentoUnid">Unidade</Label>
                    <Input id="rendimentoUnid" value={formData.rendimentoUnid} onChange={e => setFormData({
                    ...formData,
                    rendimentoUnid: e.target.value
                  })} placeholder="Ex: fatias" />
                  </div>
                </div>

                <Separator />

                {/* Adicionar itens */}
                <div>
                  <h4 className="font-medium mb-4">Ingredientes</h4>
                  {globalInsumos.length === 0 && <div className="bg-muted p-4 rounded-lg mb-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Nenhum insumo cadastrado. Cadastre insumos primeiro para criar receitas.
                      </p>
                      
                    </div>}
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div>
                      <Label>Insumo</Label>
                      <select value={novoItem.insumoId} onChange={e => setNovoItem({
                      ...novoItem,
                      insumoId: e.target.value
                    })} className="w-full p-2 border rounded-md bg-background">
                        <option value="">Selecione um insumo</option>
                        {globalInsumos.length === 0 ? <option value="" disabled>Nenhum insumo cadastrado</option> : globalInsumos.map(insumo => <option key={insumo.id} value={insumo.id}>
                              {insumo.produto} - {formatCurrency(insumo.custoEfetivo)}/{insumo.unidade}
                            </option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Quantidade ({globalInsumos.find(i => i.id === novoItem.insumoId)?.unidade || 'UN'})</Label>
                      <Input type="number" step="0.001" value={novoItem.quantidade} onChange={e => setNovoItem({
                      ...novoItem,
                      quantidade: e.target.value
                    })} placeholder="Ex: 0.5" />
                    </div>
                    <Button type="button" onClick={adicionarItem} disabled={globalInsumos.length === 0}>
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Lista de itens */}
                {itensReceita.length > 0 && <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Insumo</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Custo Unit.</TableHead>
                          <TableHead>Custo Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itensReceita.map((item, index) => <TableRow key={index}>
                            <TableCell>{item.nomeInsumo}</TableCell>
                            <TableCell>{item.quantidade} {globalInsumos.find(i => i.id === item.insumoId)?.unidade || 'UN'}</TableCell>
                            <TableCell>{formatCurrency(item.custoUnitario)}</TableCell>
                            <TableCell>{formatCurrency(item.custoItem)}</TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removerItem(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                  </div>}

                {/* Custos calculados */}
                {itensReceita.length > 0 && <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h4 className="font-medium">Custos Calculados</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Custo Total:</span>
                        <div className="font-medium">{formatCurrency(currentCustos.custoTotal)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pós-Perda:</span>
                        <div className="font-medium metric-positive">{formatCurrency(currentCustos.custoPosPerda)}</div>
                      </div>
                    </div>
                  </div>}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingReceita ? 'Salvar' : 'Criar Receita'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinancialCard title="Total de Receitas" value={globalReceitas.length.toString()} subtitle="Fichas técnicas" icon={<ChefHat className="h-5 w-5" />} variant="default" loading={loading} />

        <FinancialCard title="Custo Médio/Unidade" value={formatCurrency(custoMedioPorUnidade)} subtitle="Entre todas as receitas" variant="default" loading={loading} />

        <FinancialCard title="Receita mais Cara" value={globalReceitas.length > 0 ? formatCurrency(Math.max(...globalReceitas.map(r => r.custoPorUnidade))) : formatCurrency(0)} subtitle={globalReceitas.length > 0 ? globalReceitas.find(r => r.custoPorUnidade === Math.max(...globalReceitas.map(r => r.custoPorUnidade)))?.nome : "Nenhuma"} variant="warning" loading={loading} />
      </div>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Lista de Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>)}
            </div> : globalReceitas.length === 0 ? <EmptyState icon={<ChefHat className="h-12 w-12" />} title="Nenhuma receita cadastrada" description="Crie fichas técnicas para controlar custos dos seus produtos" action={<Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Receita
                </Button>} /> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Rendimento</TableHead>
                  <TableHead>Ingredientes</TableHead>
                  <TableHead>Perda</TableHead>
                  <TableHead>Custo/Unidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {globalReceitas.map(receita => <TableRow key={receita.id}>
                    <TableCell className="font-medium">{receita.nome}</TableCell>
                    <TableCell>{receita.rendimentoQtd} {receita.rendimentoUnid}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{receita.itens.length} itens</Badge>
                    </TableCell>
                    <TableCell>{receita.perdaPercentual}%</TableCell>
                    <TableCell className="font-medium metric-positive">
                      {formatCurrency(receita.custoPorUnidade)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => exportarFicha(receita)} title="Exportar PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(receita)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(receita.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>
    </div>;
}
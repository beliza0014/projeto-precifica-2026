import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Package, Copy, ArrowRight, Calculator } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialCard } from "@/components/FinancialCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  embalagensSelecionadas: string[];
  descartaveisSelecionados: string[];
  cenario: 'local' | 'viagem' | 'delivery';
  extrasCenario: ExtraCenario;
  opcionaisSelecionados: string[];
  unitCost: number;
  metadata: {
    custoConteudo: number;
    custoEmbalagens: number;
    custoDescartaveis: number;
    custoExtrasCenario: number;
    custoOpcionais: number;
  };
}
export default function Variacoes() {
  const {
    variacoesConfig,
    setVariacoesConfig,
    saveVariacoesConfig,
    receitas,
    isLoading: isSaving,
    isInitializing
  } = useFinancial();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariacao, setEditingVariacao] = useState<Variacao | null>(null);
  const [activeTab, setActiveTab] = useState<'variacoes' | 'embalagens' | 'descartaveis' | 'outros'>('variacoes');

  // Form states
  const [formData, setFormData] = useState({
    nome: "",
    produtoBaseId: "",
    tipoMedida: "unidade" as 'g' | 'ml' | 'fatia' | 'unidade',
    quantidade: "",
    overfillPercentual: "",
    cenario: "local" as 'local' | 'viagem' | 'delivery',
    taxaFixa: "",
    subsidioFrete: ""
  });
  const [embalagensSelecionadas, setEmbalagensSelecionadas] = useState<string[]>([]);
  const [descartaveisSelecionados, setDescartaveisSelecionados] = useState<string[]>([]);
  const [opcionaisSelecionados, setOpcionaisSelecionados] = useState<string[]>([]);

  // New item forms
  const [novaEmbalagem, setNovaEmbalagem] = useState({
    nome: "",
    custo: "",
    unidade: "UN"
  });
  const [novoDescartavel, setNovoDescartavel] = useState({
    nome: "",
    custo: "",
    unidade: "UN"
  });
  const [novoOpcional, setNovoOpcional] = useState({
    nome: "",
    custo: ""
  });
  useEffect(() => {
    loadVariacoes();
  }, [isInitializing]);
  const loadVariacoes = async () => {
    if (isInitializing) return;
    setLoading(true);
    try {
      if (variacoesConfig.embalagens.length === 0 && variacoesConfig.variacoes.length === 0) {
        console.log('📦 Dados não encontrados - interface limpa sem simulação');
      }
    } catch (error) {
      console.error('Error loading variações:', error);
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

  // Função para converter unidades
  const converterUnidades = (valorBase: number, unidadeBase: string, unidadeDestino: 'g' | 'ml' | 'fatia' | 'unidade', quantidadeDestino: number, rendimentoQtdBase: number) => {
    // Normalizar unidades base para comparação
    const unidadeBaseNorm = unidadeBase.toLowerCase();

    // Conversões de massa (kg para g)
    if ((unidadeBaseNorm === 'kg' || unidadeBaseNorm === 'quilos') && unidadeDestino === 'g') {
      // 1 kg = 1000g, então o custo por grama é valorBase / (rendimentoQtdBase * 1000)
      const custoPorGrama = valorBase / (rendimentoQtdBase * 1000);
      return custoPorGrama * quantidadeDestino;
    }

    // Conversões de volume (L para ml)
    if ((unidadeBaseNorm === 'l' || unidadeBaseNorm === 'litros') && unidadeDestino === 'ml') {
      // 1 L = 1000ml, então o custo por ml é valorBase / (rendimentoQtdBase * 1000)
      const custoPorMl = valorBase / (rendimentoQtdBase * 1000);
      return custoPorMl * quantidadeDestino;
    }

    // Conversões de unidade inteira para frações
    if ((unidadeBaseNorm === 'unidades' || unidadeBaseNorm === 'unidade' || unidadeBaseNorm === 'un') && (unidadeDestino === 'fatia' || unidadeDestino === 'unidade')) {
      // Para fatias, assumimos que uma unidade pode ser dividida (ex: 1 pizza = 8 fatias)
      // Para simplicidade, usamos a quantidade diretamente como fração da unidade base
      const custoPorFracao = valorBase / rendimentoQtdBase;
      return custoPorFracao * quantidadeDestino;
    }

    // Conversões diretas (mesma unidade ou unidades compatíveis)
    if (unidadeDestino === 'unidade' || unidadeBaseNorm === unidadeDestino) {
      const custoPorUnidade = valorBase / rendimentoQtdBase;
      return custoPorUnidade * quantidadeDestino;
    }

    // Fallback: conversão direta proporcional
    const custoPorUnidade = valorBase / rendimentoQtdBase;
    return custoPorUnidade * quantidadeDestino;
  };
  const calcularCustoVariacao = (produtoBaseId: string, quantidade: number, tipoMedida: 'g' | 'ml' | 'fatia' | 'unidade', overfillPercentual: number, embalagensSelecionadas: string[], descartaveisSelecionados: string[], extrasCenario: ExtraCenario, opcionaisSelecionados: string[]) => {
    const receita = receitas.find(r => r.id === produtoBaseId);
    if (!receita) return {
      unitCost: 0,
      metadata: {
        custoConteudo: 0,
        custoEmbalagens: 0,
        custoDescartaveis: 0,
        custoExtrasCenario: 0,
        custoOpcionais: 0
      }
    };

    // Cálculo do conteúdo com conversão automática de unidades
    const qtdEfetiva = quantidade * (1 + overfillPercentual / 100);

    // Usar a nova função de conversão
    const custoConteudo = converterUnidades(receita.custoPosPerda,
    // Usar o custo pós-perda da receita completa
    receita.rendimentoUnid,
    // Unidade base da receita
    tipoMedida,
    // Unidade de destino
    qtdEfetiva,
    // Quantidade com overfill
    receita.rendimentoQtd // Quantidade de rendimento da receita base
    );

    // Custo das embalagens
    const custoEmbalagens = embalagensSelecionadas.reduce((sum, embId) => {
      const embalagem = variacoesConfig.embalagens.find(e => e.id === embId);
      return sum + (embalagem ? embalagem.custo : 0);
    }, 0);

    // Custo dos descartáveis
    const custoDescartaveis = descartaveisSelecionados.reduce((sum, descId) => {
      const descartavel = variacoesConfig.descartaveis.find(d => d.id === descId);
      return sum + (descartavel ? descartavel.custo : 0);
    }, 0);

    // Custo dos extras do cenário
    const custoExtrasCenario = extrasCenario.taxaFixa + extrasCenario.subsidioFrete;

    // Custo dos opcionais
    const custoOpcionais = opcionaisSelecionados.reduce((sum, opcId) => {
      const opcional = variacoesConfig.opcionais.find(o => o.id === opcId);
      return sum + (opcional ? opcional.custo : 0);
    }, 0);
    const unitCost = custoConteudo + custoEmbalagens + custoDescartaveis + custoExtrasCenario + custoOpcionais;
    return {
      unitCost,
      metadata: {
        custoConteudo,
        custoEmbalagens,
        custoDescartaveis,
        custoExtrasCenario,
        custoOpcionais
      }
    };
  };
  const handleSubmitVariacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.produtoBaseId || !formData.nome) {
      alert('Preencha os campos obrigatórios');
      return;
    }
    const receita = receitas.find(r => r.id === formData.produtoBaseId);
    if (!receita) return;
    const quantidade = parseFloat(formData.quantidade) || 1;
    const overfillPercentual = parseFloat(formData.overfillPercentual) || 0;
    const extrasCenario = {
      taxaFixa: parseFloat(formData.taxaFixa) || 0,
      subsidioFrete: parseFloat(formData.subsidioFrete) || 0
    };
    const {
      unitCost,
      metadata
    } = calcularCustoVariacao(formData.produtoBaseId, quantidade, formData.tipoMedida, overfillPercentual, embalagensSelecionadas, descartaveisSelecionados, extrasCenario, opcionaisSelecionados);
    const newVariacao: Variacao = {
      id: editingVariacao ? editingVariacao.id : Date.now().toString(),
      nome: formData.nome,
      produtoBaseId: formData.produtoBaseId,
      produtoBaseNome: receita.nome,
      tipoMedida: formData.tipoMedida,
      quantidade,
      overfillPercentual,
      embalagensSelecionadas: [...embalagensSelecionadas],
      descartaveisSelecionados: [...descartaveisSelecionados],
      cenario: formData.cenario,
      extrasCenario,
      opcionaisSelecionados: [...opcionaisSelecionados],
      unitCost,
      metadata
    };
    const updatedVariacoes = editingVariacao ? variacoesConfig.variacoes.map(v => v.id === editingVariacao.id ? newVariacao : v) : [...variacoesConfig.variacoes, newVariacao];
    const updatedConfig = {
      ...variacoesConfig,
      variacoes: updatedVariacoes
    };
    setVariacoesConfig(updatedConfig);
    await saveVariacoesConfig(updatedConfig);
    resetForm();
  };
  const resetForm = () => {
    setDialogOpen(false);
    setEditingVariacao(null);
    setFormData({
      nome: "",
      produtoBaseId: "",
      tipoMedida: "unidade",
      quantidade: "",
      overfillPercentual: "",
      cenario: "local",
      taxaFixa: "",
      subsidioFrete: ""
    });
    setEmbalagensSelecionadas([]);
    setDescartaveisSelecionados([]);
    setOpcionaisSelecionados([]);
  };
  const handleEdit = (variacao: Variacao) => {
    setEditingVariacao(variacao);
    setFormData({
      nome: variacao.nome,
      produtoBaseId: variacao.produtoBaseId,
      tipoMedida: variacao.tipoMedida,
      quantidade: variacao.quantidade.toString(),
      overfillPercentual: variacao.overfillPercentual.toString(),
      cenario: variacao.cenario,
      taxaFixa: variacao.extrasCenario.taxaFixa.toString(),
      subsidioFrete: variacao.extrasCenario.subsidioFrete.toString()
    });
    setEmbalagensSelecionadas([...variacao.embalagensSelecionadas]);
    setDescartaveisSelecionados([...variacao.descartaveisSelecionados]);
    setOpcionaisSelecionados([...variacao.opcionaisSelecionados]);
    setDialogOpen(true);
  };
  const handleDelete = async (id: string) => {
    const updatedVariacoes = variacoesConfig.variacoes.filter(v => v.id !== id);
    const updatedConfig = {
      ...variacoesConfig,
      variacoes: updatedVariacoes
    };
    setVariacoesConfig(updatedConfig);
    await saveVariacoesConfig(updatedConfig);
  };
  const handleDuplicate = async (variacao: Variacao) => {
    const duplicatedVariacao: Variacao = {
      ...variacao,
      id: Date.now().toString(),
      nome: `${variacao.nome} (Cópia)`
    };
    const updatedVariacoes = [...variacoesConfig.variacoes, duplicatedVariacao];
    const updatedConfig = {
      ...variacoesConfig,
      variacoes: updatedVariacoes
    };
    setVariacoesConfig(updatedConfig);
    await saveVariacoesConfig(updatedConfig);
  };
  const adicionarEmbalagem = async () => {
    if (!novaEmbalagem.nome || !novaEmbalagem.custo) return;
    const embalagem: Embalagem = {
      id: Date.now().toString(),
      nome: novaEmbalagem.nome,
      custo: parseFloat(novaEmbalagem.custo),
      unidade: novaEmbalagem.unidade
    };
    const updatedConfig = {
      ...variacoesConfig,
      embalagens: [...variacoesConfig.embalagens, embalagem]
    };
    setVariacoesConfig(updatedConfig);
    await saveVariacoesConfig(updatedConfig);
    setNovaEmbalagem({
      nome: "",
      custo: "",
      unidade: "UN"
    });
  };
  const adicionarDescartavel = async () => {
    if (!novoDescartavel.nome || !novoDescartavel.custo) return;
    const descartavel: Descartavel = {
      id: Date.now().toString(),
      nome: novoDescartavel.nome,
      custo: parseFloat(novoDescartavel.custo),
      unidade: novoDescartavel.unidade
    };
    const updatedConfig = {
      ...variacoesConfig,
      descartaveis: [...variacoesConfig.descartaveis, descartavel]
    };
    setVariacoesConfig(updatedConfig);
    await saveVariacoesConfig(updatedConfig);
    setNovoDescartavel({
      nome: "",
      custo: "",
      unidade: "UN"
    });
  };
  const adicionarOpcional = async () => {
    if (!novoOpcional.nome || !novoOpcional.custo) return;
    const opcional: Opcional = {
      id: Date.now().toString(),
      nome: novoOpcional.nome,
      custo: parseFloat(novoOpcional.custo)
    };
    const updatedConfig = {
      ...variacoesConfig,
      opcionais: [...variacoesConfig.opcionais, opcional]
    };
    setVariacoesConfig(updatedConfig);
    await saveVariacoesConfig(updatedConfig);
    setNovoOpcional({
      nome: "",
      custo: ""
    });
  };
  const removerEmbalagem = async (id: string) => {
    const updatedConfig = {
      ...variacoesConfig,
      embalagens: variacoesConfig.embalagens.filter(e => e.id !== id)
    };
    setVariacoesConfig(updatedConfig);
    await saveVariacoesConfig(updatedConfig);
  };
  const removerDescartavel = async (id: string) => {
    const updatedConfig = {
      ...variacoesConfig,
      descartaveis: variacoesConfig.descartaveis.filter(d => d.id !== id)
    };
    setVariacoesConfig(updatedConfig);
    await saveVariacoesConfig(updatedConfig);
  };
  const removerOpcional = async (id: string) => {
    const updatedConfig = {
      ...variacoesConfig,
      opcionais: variacoesConfig.opcionais.filter(o => o.id !== id)
    };
    setVariacoesConfig(updatedConfig);
    await saveVariacoesConfig(updatedConfig);
  };
  const currentCustos = formData.produtoBaseId ? calcularCustoVariacao(formData.produtoBaseId, parseFloat(formData.quantidade) || 1, formData.tipoMedida, parseFloat(formData.overfillPercentual) || 0, embalagensSelecionadas, descartaveisSelecionados, {
    taxaFixa: parseFloat(formData.taxaFixa) || 0,
    subsidioFrete: parseFloat(formData.subsidioFrete) || 0
  }, opcionaisSelecionados) : {
    unitCost: 0,
    metadata: {
      custoConteudo: 0,
      custoEmbalagens: 0,
      custoDescartaveis: 0,
      custoExtrasCenario: 0,
      custoOpcionais: 0
    }
  };
  const custoMedioVariacoes = variacoesConfig.variacoes.length > 0 ? variacoesConfig.variacoes.reduce((sum, v) => sum + v.unitCost, 0) / variacoesConfig.variacoes.length : 0;
  return <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Variações</h1>
          <p className="text-muted-foreground">
            Transforme receitas em variações de venda com embalagens e cenários
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinancialCard title="Total de Variações" value={variacoesConfig.variacoes.length.toString()} subtitle="Produtos configurados" icon={<Package className="h-5 w-5" />} variant="default" loading={loading} />

        <FinancialCard title="Custo Médio" value={formatCurrency(custoMedioVariacoes)} subtitle="Entre todas as variações" variant="default" loading={loading} />

        <FinancialCard title="Mais Cara" value={variacoesConfig.variacoes.length > 0 ? formatCurrency(Math.max(...variacoesConfig.variacoes.map(v => v.unitCost))) : formatCurrency(0)} subtitle="Variação com maior custo" variant="default" loading={loading} />
      </div>

      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="variacoes">Variações</TabsTrigger>
          <TabsTrigger value="embalagens">Embalagens</TabsTrigger>
          <TabsTrigger value="descartaveis">Descartáveis</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
        </TabsList>

        <TabsContent value="variacoes" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Variações de Venda</h2>
              <p className="text-sm text-muted-foreground">Configure porções, embalagens e cenários</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Variação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingVariacao ? 'Editar Variação' : 'Nova Variação'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure todas as características da variação de venda
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmitVariacao}>
                  <div className="grid gap-6 py-4">
                    {/* Dados básicos */}
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="nome">Nome da Variação</Label>
                         <Input id="nome" value={formData.nome} onChange={e => setFormData({
                        ...formData,
                        nome: e.target.value
                      })} placeholder="Ex: Pote 300ml, 1/8 pizza, Combo X" required />
                       </div>
                       <div>
                         <Label htmlFor="produtoBase">Produto Base (Receita)</Label>
                         <Select value={formData.produtoBaseId} onValueChange={value => setFormData({
                        ...formData,
                        produtoBaseId: value
                      })}>
                           <SelectTrigger>
                             <SelectValue placeholder="Selecione uma receita" />
                           </SelectTrigger>
                           <SelectContent>
                             {receitas.map(receita => <SelectItem key={receita.id} value={receita.id}>
                                 {receita.nome} - {formatCurrency(receita.custoPorUnidade)}/{receita.rendimentoUnid}
                               </SelectItem>)}
                           </SelectContent>
                         </Select>
                       </div>
                     </div>

                     {/* Exibição do Rendimento Total do Produto Base */}
                     {formData.produtoBaseId && (() => {
                    const receitaSelecionada = receitas.find(r => r.id === formData.produtoBaseId);
                    return receitaSelecionada ? <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                           <div className="flex items-center gap-2 mb-2">
                             <ArrowRight className="h-4 w-4 text-blue-600" />
                             <h4 className="font-medium text-blue-800 dark:text-blue-200">Rendimento Total da Receita</h4>
                           </div>
                           <div className="grid grid-cols-3 gap-4 text-sm">
                             <div>
                               <span className="text-blue-600 dark:text-blue-400">Receita:</span>
                               <div className="font-medium text-foreground">{receitaSelecionada.nome}</div>
                             </div>
                             <div>
                               <span className="text-blue-600 dark:text-blue-400">Rendimento Total:</span>
                               <div className="font-medium text-foreground">
                                 {receitaSelecionada.rendimentoQtd} {receitaSelecionada.rendimentoUnid}
                               </div>
                             </div>
                             <div>
                               <span className="text-blue-600 dark:text-blue-400">Custo Total:</span>
                               <div className="font-medium text-foreground">{formatCurrency(receitaSelecionada.custoPosPerda)}</div>
                             </div>
                           </div>
                           <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                             ℹ️ Configure abaixo a quantidade e tipo de medida para calcular o custo proporcional automaticamente
                           </div>
                         </div> : null;
                  })()}


                     <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="tipoMedida">Tipo de Medida</Label>
                        <Select value={formData.tipoMedida} onValueChange={value => setFormData({
                        ...formData,
                        tipoMedida: value as any
                      })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">Gramas (g)</SelectItem>
                            <SelectItem value="ml">Mililitros (ml)</SelectItem>
                            <SelectItem value="fatia">Fatia</SelectItem>
                            <SelectItem value="unidade">Unidade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="quantidade">Quantidade</Label>
                        <Input id="quantidade" type="number" step="0.01" value={formData.quantidade} onChange={e => setFormData({
                        ...formData,
                        quantidade: e.target.value
                      })} placeholder="1" required />
                      </div>
                      <div>
                        <Label htmlFor="overfill">Overfill (%)</Label>
                        <Input id="overfill" type="number" step="0.1" value={formData.overfillPercentual} onChange={e => setFormData({
                        ...formData,
                        overfillPercentual: e.target.value
                      })} placeholder="5" />
                      </div>
                      <div>
                        <Label htmlFor="cenario">Cenário</Label>
                        <Select value={formData.cenario} onValueChange={value => setFormData({
                        ...formData,
                        cenario: value as any
                      })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="viagem">Viagem</SelectItem>
                            <SelectItem value="delivery">Delivery</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    {/* Embalagens */}
                    <div>
                      <h4 className="font-medium mb-4">Embalagens</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {variacoesConfig.embalagens.map(embalagem => <div key={embalagem.id} className="flex items-center space-x-2">
                            <Checkbox id={`emb-${embalagem.id}`} checked={embalagensSelecionadas.includes(embalagem.id)} onCheckedChange={checked => {
                          if (checked) {
                            setEmbalagensSelecionadas([...embalagensSelecionadas, embalagem.id]);
                          } else {
                            setEmbalagensSelecionadas(embalagensSelecionadas.filter(id => id !== embalagem.id));
                          }
                        }} />
                            <Label htmlFor={`emb-${embalagem.id}`} className="text-sm">
                              {embalagem.nome} - {formatCurrency(embalagem.custo)}
                            </Label>
                          </div>)}
                      </div>
                    </div>

                    {/* Descartáveis */}
                    <div>
                      <h4 className="font-medium mb-4">Descartáveis</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {variacoesConfig.descartaveis.map(descartavel => <div key={descartavel.id} className="flex items-center space-x-2">
                            <Checkbox id={`desc-${descartavel.id}`} checked={descartaveisSelecionados.includes(descartavel.id)} onCheckedChange={checked => {
                          if (checked) {
                            setDescartaveisSelecionados([...descartaveisSelecionados, descartavel.id]);
                          } else {
                            setDescartaveisSelecionados(descartaveisSelecionados.filter(id => id !== descartavel.id));
                          }
                        }} />
                            <Label htmlFor={`desc-${descartavel.id}`} className="text-sm">
                              {descartavel.nome} - {formatCurrency(descartavel.custo)}
                            </Label>
                          </div>)}
                      </div>
                    </div>

                    {/* Extras do Cenário */}
                    <div>
                      <h4 className="font-medium mb-4">Extras do Cenário</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="taxaFixa">Taxa Fixa Adicional (R$)</Label>
                          <Input id="taxaFixa" type="number" step="0.01" value={formData.taxaFixa} onChange={e => setFormData({
                          ...formData,
                          taxaFixa: e.target.value
                         })} placeholder="Digite o preço" />
                        </div>
                        <div>
                          <Label htmlFor="subsidioFrete">Subsídio de Frete (R$)</Label>
                          <Input id="subsidioFrete" type="number" step="0.01" value={formData.subsidioFrete} onChange={e => setFormData({
                          ...formData,
                          subsidioFrete: e.target.value
                        })} placeholder="Digite o custo" />
                        </div>
                      </div>
                    </div>

                    {/* Outros */}
                    <div>
                      <h4 className="font-medium mb-4">Outros/Adicionais</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {variacoesConfig.opcionais.map(opcional => <div key={opcional.id} className="flex items-center space-x-2">
                            <Checkbox id={`opc-${opcional.id}`} checked={opcionaisSelecionados.includes(opcional.id)} onCheckedChange={checked => {
                          if (checked) {
                            setOpcionaisSelecionados([...opcionaisSelecionados, opcional.id]);
                          } else {
                            setOpcionaisSelecionados(opcionaisSelecionados.filter(id => id !== opcional.id));
                          }
                        }} />
                            <Label htmlFor={`opc-${opcional.id}`} className="text-sm">
                              {opcional.nome} - {formatCurrency(opcional.custo)}
                            </Label>
                          </div>)}
                      </div>
                    </div>

                    {/* Custos calculados */}
                    {formData.produtoBaseId && <div className="bg-muted p-4 rounded-lg space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          Custos Calculados
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Conteúdo:</span>
                            <div className="font-medium">{formatCurrency(currentCustos.metadata.custoConteudo)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Embalagens:</span>
                            <div className="font-medium">{formatCurrency(currentCustos.metadata.custoEmbalagens)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Descartáveis:</span>
                            <div className="font-medium">{formatCurrency(currentCustos.metadata.custoDescartaveis)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Extras:</span>
                            <div className="font-medium">{formatCurrency(currentCustos.metadata.custoExtrasCenario)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Outros:</span>
                            <div className="font-medium">{formatCurrency(currentCustos.metadata.custoOpcionais)}</div>
                          </div>
                          <div className="col-span-1">
                            <span className="text-muted-foreground">TOTAL (unitCost):</span>
                            <div className="font-bold text-lg metric-positive">{formatCurrency(currentCustos.unitCost)}</div>
                          </div>
                        </div>
                      </div>}
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingVariacao ? 'Salvar' : 'Criar Variação'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div> : variacoesConfig.variacoes.length === 0 ? <EmptyState icon={<Package className="h-12 w-12" />} title="Nenhuma variação cadastrada" description="Crie variações transformando suas receitas em produtos de venda" /> : <div className="space-y-4">
              {variacoesConfig.variacoes.map(variacao => <Card key={variacao.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{variacao.nome}</h3>
                          <Badge variant={variacao.cenario === 'delivery' ? 'default' : 'secondary'}>
                            {variacao.cenario}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <span>{variacao.produtoBaseNome}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{variacao.quantidade} {variacao.tipoMedida}</span>
                          {variacao.overfillPercentual > 0 && <span>(+{variacao.overfillPercentual}% overfill)</span>}
                        </div>
                        
                        <div className="grid grid-cols-5 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Conteúdo:</span>
                            <div className="font-medium">{formatCurrency(variacao.metadata.custoConteudo)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Embalagens:</span>
                            <div className="font-medium">{formatCurrency(variacao.metadata.custoEmbalagens)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Descartáveis:</span>
                            <div className="font-medium">{formatCurrency(variacao.metadata.custoDescartaveis)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Extras:</span>
                            <div className="font-medium">{formatCurrency(variacao.metadata.custoExtrasCenario)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">TOTAL:</span>
                            <div className="font-bold metric-positive">{formatCurrency(variacao.unitCost)}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicate(variacao)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(variacao)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(variacao.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}
        </TabsContent>

        <TabsContent value="embalagens" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Embalagens</h2>
              <p className="text-sm text-muted-foreground">Gerencie os tipos de embalagens disponíveis</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Embalagem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 items-end">
                <div>
                  <Label>Nome</Label>
                  <Input value={novaEmbalagem.nome} onChange={e => setNovaEmbalagem({
                  ...novaEmbalagem,
                  nome: e.target.value
                })} placeholder="Ex: Pote 300ml" />
                </div>
                <div>
                  <Label>Custo (R$)</Label>
                  <Input type="number" step="0.01" value={novaEmbalagem.custo} onChange={e => setNovaEmbalagem({
                  ...novaEmbalagem,
                  custo: e.target.value
                })} placeholder="0.85" />
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Input value={novaEmbalagem.unidade} onChange={e => setNovaEmbalagem({
                  ...novaEmbalagem,
                  unidade: e.target.value
                })} placeholder="UN" />
                </div>
                <Button onClick={adicionarEmbalagem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {variacoesConfig.embalagens.map(embalagem => <Card key={embalagem.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-medium">{embalagem.nome}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(embalagem.custo)} por {embalagem.unidade}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removerEmbalagem(embalagem.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>)}
          </div>
        </TabsContent>

        <TabsContent value="descartaveis" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Descartáveis</h2>
              <p className="text-sm text-muted-foreground">Gerencie itens descartáveis utilizados</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Descartável</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 items-end">
                <div>
                  <Label>Nome</Label>
                  <Input value={novoDescartavel.nome} onChange={e => setNovoDescartavel({
                  ...novoDescartavel,
                  nome: e.target.value
                })} placeholder="Ex: Colher Plástica" />
                </div>
                <div>
                  <Label>Custo (R$)</Label>
                  <Input type="number" step="0.01" value={novoDescartavel.custo} onChange={e => setNovoDescartavel({
                  ...novoDescartavel,
                  custo: e.target.value
                })} placeholder="0.15" />
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Input value={novoDescartavel.unidade} onChange={e => setNovoDescartavel({
                  ...novoDescartavel,
                  unidade: e.target.value
                })} placeholder="UN" />
                </div>
                <Button onClick={adicionarDescartavel}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {variacoesConfig.descartaveis.map(descartavel => <Card key={descartavel.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-medium">{descartavel.nome}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(descartavel.custo)} por {descartavel.unidade}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removerDescartavel(descartavel.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>)}
          </div>
        </TabsContent>

        <TabsContent value="outros" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Outros</h2>
              <p className="text-sm text-muted-foreground">Gerencie adicionais e complementos</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <Label>Nome</Label>
                  <Input value={novoOpcional.nome} onChange={e => setNovoOpcional({
                  ...novoOpcional,
                  nome: e.target.value
                })} placeholder="Ex: Sachê" />
                </div>
                <div>
                  <Label>Custo (R$)</Label>
                  <Input type="number" step="0.01" value={novoOpcional.custo} onChange={e => setNovoOpcional({
                  ...novoOpcional,
                  custo: e.target.value
                })} placeholder="2.00" />
                </div>
                <Button onClick={adicionarOpcional}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {variacoesConfig.opcionais.map(opcional => <Card key={opcional.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-medium">{opcional.nome}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(opcional.custo)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removerOpcional(opcional.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>)}
          </div>
        </TabsContent>
      </Tabs>
    </div>;
}
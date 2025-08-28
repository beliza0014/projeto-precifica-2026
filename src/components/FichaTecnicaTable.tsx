import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Copy } from "lucide-react";
import { generateId } from "@/lib/utils";

interface InsumoItem {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  custoUnitario: number;
  fatorCorrecao: number;
  custoLiquido: number;
}

interface FichaTecnicaTableProps {
  insumos: InsumoItem[];
  setInsumos: (insumos: InsumoItem[]) => void;
}

const unidadesMedida = [
  { value: 'g', label: 'Gramas (g)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'un', label: 'Unidades (un)' }
];

export function FichaTecnicaTable({ insumos, setInsumos }: FichaTecnicaTableProps) {
  const [novoInsumo, setNovoInsumo] = useState<Partial<InsumoItem>>({
    nome: '',
    quantidade: 0,
    unidade: 'g',
    custoUnitario: 0,
    fatorCorrecao: 1
  });

  const calcularCustoLiquido = (quantidade: number, unidade: string, custoUnitario: number, fatorCorrecao: number): number => {
    // Converter quantidade para a mesma unidade do custo unitário
    let quantidadeConvertida = quantidade;
    
    // Assumindo que custoUnitario está sempre em kg ou litros
    if (unidade === 'g' && quantidade > 0) {
      quantidadeConvertida = quantidade / 1000; // g para kg
    } else if (unidade === 'ml' && quantidade > 0) {
      quantidadeConvertida = quantidade / 1000; // ml para l
    }
    
    return custoUnitario * fatorCorrecao * quantidadeConvertida;
  };

  const adicionarInsumo = () => {
    if (!novoInsumo.nome || !novoInsumo.quantidade || !novoInsumo.custoUnitario) return;

    const custoLiquido = calcularCustoLiquido(
      novoInsumo.quantidade!,
      novoInsumo.unidade!,
      novoInsumo.custoUnitario!,
      novoInsumo.fatorCorrecao!
    );

    const insumo: InsumoItem = {
      id: generateId(),
      nome: novoInsumo.nome!,
      quantidade: novoInsumo.quantidade!,
      unidade: novoInsumo.unidade!,
      custoUnitario: novoInsumo.custoUnitario!,
      fatorCorrecao: novoInsumo.fatorCorrecao!,
      custoLiquido
    };

    setInsumos([...insumos, insumo]);
    setNovoInsumo({
      nome: '',
      quantidade: 0,
      unidade: 'g',
      custoUnitario: 0,
      fatorCorrecao: 1
    });
  };

  const atualizarInsumo = (id: string, campo: keyof InsumoItem, valor: any) => {
    const insumosAtualizados = insumos.map(insumo => {
      if (insumo.id === id) {
        const insumoAtualizado = { ...insumo, [campo]: valor };
        
        // Recalcular custo líquido quando necessário
        if (['quantidade', 'custoUnitario', 'fatorCorrecao'].includes(campo)) {
          insumoAtualizado.custoLiquido = calcularCustoLiquido(
            insumoAtualizado.quantidade,
            insumoAtualizado.unidade,
            insumoAtualizado.custoUnitario,
            insumoAtualizado.fatorCorrecao
          );
        }
        
        return insumoAtualizado;
      }
      return insumo;
    });
    
    setInsumos(insumosAtualizados);
  };

  const removerInsumo = (id: string) => {
    setInsumos(insumos.filter(insumo => insumo.id !== id));
  };

  const duplicarInsumo = (insumo: InsumoItem) => {
    const insumoDuplicado = {
      ...insumo,
      id: generateId(),
      nome: `${insumo.nome} (cópia)`
    };
    setInsumos([...insumos, insumoDuplicado]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const custoTotalInsumos = insumos.reduce((acc, item) => acc + item.custoLiquido, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ficha Técnica</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tabela de insumos */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo/Embalagem</TableHead>
                  <TableHead>Qtde</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Custo Unit. (R$/kg ou L)</TableHead>
                  <TableHead>FC</TableHead>
                  <TableHead>Custo Líquido</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insumos.map((insumo) => (
                  <TableRow key={insumo.id}>
                    <TableCell>
                      <Input
                        value={insumo.nome}
                        onChange={(e) => atualizarInsumo(insumo.id, 'nome', e.target.value)}
                        placeholder="Nome do insumo"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={insumo.quantidade}
                        onChange={(e) => atualizarInsumo(insumo.id, 'quantidade', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={insumo.unidade}
                        onValueChange={(value) => atualizarInsumo(insumo.id, 'unidade', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {unidadesMedida.map(unidade => (
                            <SelectItem key={unidade.value} value={unidade.value}>
                              {unidade.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={insumo.custoUnitario}
                        onChange={(e) => atualizarInsumo(insumo.id, 'custoUnitario', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={insumo.fatorCorrecao}
                        onChange={(e) => atualizarInsumo(insumo.id, 'fatorCorrecao', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(insumo.custoLiquido)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => duplicarInsumo(insumo)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removerInsumo(insumo.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Linha para adicionar novo insumo */}
                <TableRow className="bg-muted/50">
                  <TableCell>
                    <Input
                      value={novoInsumo.nome || ''}
                      onChange={(e) => setNovoInsumo(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Nome do insumo"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={novoInsumo.quantidade || ''}
                      onChange={(e) => setNovoInsumo(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={novoInsumo.unidade}
                      onValueChange={(value) => setNovoInsumo(prev => ({ ...prev, unidade: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesMedida.map(unidade => (
                          <SelectItem key={unidade.value} value={unidade.value}>
                            {unidade.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={novoInsumo.custoUnitario || ''}
                      onChange={(e) => setNovoInsumo(prev => ({ ...prev, custoUnitario: Number(e.target.value) }))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={novoInsumo.fatorCorrecao || 1}
                      onChange={(e) => setNovoInsumo(prev => ({ ...prev, fatorCorrecao: Number(e.target.value) }))}
                    />
                  </TableCell>
                  <TableCell>
                    {novoInsumo.quantidade && novoInsumo.custoUnitario && novoInsumo.fatorCorrecao ? 
                      formatCurrency(calcularCustoLiquido(
                        novoInsumo.quantidade,
                        novoInsumo.unidade || 'g',
                        novoInsumo.custoUnitario,
                        novoInsumo.fatorCorrecao
                      )) : 
                      formatCurrency(0)
                    }
                  </TableCell>
                  <TableCell>
                    <Button size="sm" onClick={adicionarInsumo}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          {/* Total */}
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="font-medium">Total Custo Insumos:</span>
            <span className="text-lg font-bold">{formatCurrency(custoTotalInsumos)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
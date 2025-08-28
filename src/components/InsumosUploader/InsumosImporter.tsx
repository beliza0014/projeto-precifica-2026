import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useFinancial } from '@/contexts/FinancialContext';
import { toast } from '@/hooks/use-toast';

interface ColumnMapping {
  fileColumn: string;
  systemField: string;
}

interface Insumo {
  id: string;
  produto: string;
  precoPago: number;
  volumeItem: number;
  unidade: 'KG' | 'L' | 'ML' | 'UN';
  fatorCorrecao: number;
  custoEfetivo: number;
  valorFinalUnit: number;
}

interface ImportResult {
  success: Insumo[];
  errors: { row: number; error: string }[];
  warnings: { row: number; warning: string }[];
}

interface InsumosImporterProps {
  fileData: any[];
  mapping: ColumnMapping[];
  onComplete: () => void;
  onBack: () => void;
}

export function InsumosImporter({ fileData, mapping, onComplete, onBack }: InsumosImporterProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { insumos, setInsumos, saveInsumos } = useFinancial();

  const validateUnidade = (value: string): 'KG' | 'L' | 'ML' | 'UN' => {
    const normalized = value?.toString().toUpperCase().trim();
    const validUnits = ['KG', 'L', 'ML', 'UN'];
    
    // Direct match
    if (validUnits.includes(normalized)) {
      return normalized as 'KG' | 'L' | 'ML' | 'UN';
    }
    
    // Fuzzy matching
    if (normalized.includes('KG') || normalized.includes('KILO')) return 'KG';
    if (normalized.includes('L') || normalized.includes('LITRO')) return 'L';
    if (normalized.includes('ML') || normalized.includes('MILI')) return 'ML';
    if (normalized.includes('UN') || normalized.includes('UNID') || normalized.includes('PEÇ')) return 'UN';
    
    // Default fallback
    return 'UN';
  };

  const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Handle Brazilian number format (comma as decimal separator)
      const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const transformRowToInsumo = (row: any, rowIndex: number): { insumo?: Insumo; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Extract values based on mapping
      const mappingMap = mapping.reduce((acc, m) => {
        acc[m.systemField] = row[m.fileColumn];
        return acc;
      }, {} as { [key: string]: any });

      // Validate required fields
      const produto = mappingMap.produto?.toString().trim();
      if (!produto) {
        errors.push('Produto é obrigatório');
      }

      const precoPago = parseNumber(mappingMap.precoPago);
      if (precoPago <= 0) {
        errors.push('Preço pago deve ser maior que zero');
      }

      const unidadeRaw = mappingMap.unidade?.toString();
      if (!unidadeRaw) {
        errors.push('Unidade é obrigatória');
      }

      if (errors.length > 0) {
        return { errors, warnings };
      }

      // Process optional fields with defaults
      const volumeItem = parseNumber(mappingMap.volumeItem) || 1;
      const fatorCorrecao = parseNumber(mappingMap.fatorCorrecao) || 1;
      const unidade = validateUnidade(unidadeRaw);

      // Calculate derived values
      const custoEfetivo = precoPago / Math.max(fatorCorrecao, 0.0001);
      const valorFinalUnit = precoPago * fatorCorrecao;

      const insumo: Insumo = {
        id: `imported-${Date.now()}-${rowIndex}`,
        produto,
        precoPago,
        volumeItem,
        unidade,
        fatorCorrecao,
        custoEfetivo,
        valorFinalUnit
      };

      // Generate warnings for defaults used
      if (!mappingMap.volumeItem) {
        warnings.push('Volume/Item não informado, usando 1');
      }
      if (!mappingMap.fatorCorrecao) {
        warnings.push('Fator de correção não informado, usando 1');
      }
      if (unidadeRaw !== unidade) {
        warnings.push(`Unidade "${unidadeRaw}" convertida para "${unidade}"`);
      }

      return { insumo, errors, warnings };
    } catch (error) {
      errors.push(`Erro de processamento: ${error}`);
      return { errors, warnings };
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setProgress(0);

    try {
      const result: ImportResult = {
        success: [],
        errors: [],
        warnings: []
      };

      // Process each row
      for (let i = 0; i < fileData.length; i++) {
        const row = fileData[i];
        const { insumo, errors, warnings } = transformRowToInsumo(row, i);

        if (errors.length > 0) {
          result.errors.push({ row: i + 1, error: errors.join('; ') });
        } else if (insumo) {
          result.success.push(insumo);
        }

        if (warnings.length > 0) {
          result.warnings.push({ row: i + 1, warning: warnings.join('; ') });
        }

        // Update progress
        setProgress(((i + 1) / fileData.length) * 80);
        
        // Allow UI to update
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      setImportResult(result);
      setProgress(90);

      // Save to context if we have successful imports
      if (result.success.length > 0) {
        const updatedInsumos = [...insumos, ...result.success];
        setInsumos(updatedInsumos);
        await saveInsumos(updatedInsumos);
        
        toast({
          title: "Importação concluída!",
          description: `${result.success.length} insumos importados com sucesso.`,
        });
      }

      setProgress(100);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro durante a importação.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Importação de Insumos
          </CardTitle>
          <CardDescription>
            {!importResult ? 
              `Pronto para importar ${fileData.length} registros` :
              'Resultado da importação'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!importResult && !isImporting && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Resumo da importação:</div>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>{fileData.length} registros serão processados</li>
                    <li>Campos obrigatórios: Produto, Preço Pago, Unidade</li>
                    <li>Campos opcionais receberão valores padrão se não preenchidos</li>
                    <li>Custos efetivos e valores finais serão calculados automaticamente</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>
                  Voltar
                </Button>
                <Button onClick={handleImport} className="gap-2">
                  <Package className="h-4 w-4" />
                  Iniciar Importação
                </Button>
              </div>
            </div>
          )}

          {isImporting && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-medium">Importando dados...</p>
                <Progress value={progress} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  Processando registros e calculando custos...
                </p>
              </div>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.success.length}
                  </div>
                  <div className="text-sm text-green-700">Importados</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.errors.length}
                  </div>
                  <div className="text-sm text-red-700">Erros</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importResult.warnings.length}
                  </div>
                  <div className="text-sm text-yellow-700">Avisos</div>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Erros encontrados:</div>
                    <ul className="list-disc pl-4 space-y-1 text-sm max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <li key={index}>Linha {error.row}: {error.error}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li>... e mais {importResult.errors.length - 10} erros</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {importResult.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Avisos:</div>
                    <ul className="list-disc pl-4 space-y-1 text-sm max-h-32 overflow-y-auto">
                      {importResult.warnings.slice(0, 5).map((warning, index) => (
                        <li key={index}>Linha {warning.row}: {warning.warning}</li>
                      ))}
                      {importResult.warnings.length > 5 && (
                        <li>... e mais {importResult.warnings.length - 5} avisos</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success preview */}
              {importResult.success.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Insumos importados (primeiros 5):</h4>
                  <div className="border rounded-lg overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Preço Pago</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead>Custo Efetivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.success.slice(0, 5).map((insumo, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{insumo.produto}</TableCell>
                            <TableCell>{formatCurrency(insumo.precoPago)}</TableCell>
                            <TableCell>{insumo.unidade}</TableCell>
                            <TableCell>{formatCurrency(insumo.custoEfetivo)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>
                  Nova Importação
                </Button>
                <Button onClick={onComplete}>
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
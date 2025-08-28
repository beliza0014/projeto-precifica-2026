import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ColumnMapping {
  fileColumn: string;
  systemField: string;
}

interface ColumnMapperProps {
  headers: string[];
  sampleData: any[];
  onMappingConfirmed: (mapping: ColumnMapping[]) => void;
  onBack: () => void;
}

type SystemField = 'produto' | 'precoPago' | 'volumeItem' | 'unidade' | 'fatorCorrecao' | 'observacao' | '(ignorar)';

const SYSTEM_FIELDS: { value: SystemField; label: string; required: boolean }[] = [
  { value: 'produto', label: 'Produto (nome do insumo)', required: true },
  { value: 'precoPago', label: 'Preço Pago', required: true },
  { value: 'unidade', label: 'Unidade (KG, L, ML, UN)', required: true },
  { value: 'volumeItem', label: 'Volume/Item', required: false },
  { value: 'fatorCorrecao', label: 'Fator de Correção', required: false },
  { value: 'observacao', label: 'Observação', required: false },
  { value: '(ignorar)', label: '(Ignorar esta coluna)', required: false },
];

const MAPPING_STORAGE_KEY = 'insumos_column_mapping';

export function ColumnMapper({ headers, sampleData, onMappingConfirmed, onBack }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<{ [fileColumn: string]: SystemField }>({});
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Load saved mapping if exists
    const savedMapping = localStorage.getItem(MAPPING_STORAGE_KEY);
    if (savedMapping) {
      try {
        const parsedMapping = JSON.parse(savedMapping);
        const autoMapping: { [fileColumn: string]: SystemField } = {};
        
        headers.forEach(header => {
          if (parsedMapping[header]) {
            autoMapping[header] = parsedMapping[header];
          } else {
            autoMapping[header] = detectField(header);
          }
        });
        
        setMapping(autoMapping);
      } catch (error) {
        console.warn('Failed to load saved mapping:', error);
        initializeMapping();
      }
    } else {
      initializeMapping();
    }
  }, [headers]);

  const initializeMapping = () => {
    const autoMapping: { [fileColumn: string]: SystemField } = {};
    headers.forEach(header => {
      autoMapping[header] = detectField(header);
    });
    setMapping(autoMapping);
  };

  const detectField = (columnName: string): SystemField => {
    const normalized = columnName.toLowerCase().trim();
    
    // Auto-detection logic
    if (normalized.includes('produto') || normalized.includes('nome') || 
        normalized.includes('item') || normalized.includes('descricao')) {
      return 'produto';
    }
    if (normalized.includes('preco') || normalized.includes('valor') || 
        normalized.includes('custo') || normalized.includes('price')) {
      return 'precoPago';
    }
    if (normalized.includes('unidade') || normalized.includes('unit') || 
        normalized.includes('medida') || normalized.includes('un')) {
      return 'unidade';
    }
    if (normalized.includes('volume') || normalized.includes('quantidade') || 
        normalized.includes('qtd') || normalized.includes('peso')) {
      return 'volumeItem';
    }
    if (normalized.includes('fator') || normalized.includes('correcao') || 
        normalized.includes('factor')) {
      return 'fatorCorrecao';
    }
    if (normalized.includes('observacao') || normalized.includes('obs') || 
        normalized.includes('comentario') || normalized.includes('note')) {
      return 'observacao';
    }
    
    return '(ignorar)';
  };

  const updateMapping = (fileColumn: string, systemField: SystemField) => {
    setMapping(prev => ({ ...prev, [fileColumn]: systemField }));
  };

  const validateMapping = (): boolean => {
    const newErrors: string[] = [];
    const requiredFields = SYSTEM_FIELDS.filter(f => f.required);
    const mappedFields = Object.values(mapping).filter(field => field !== '(ignorar)');
    
    // Check if all required fields are mapped
    requiredFields.forEach(field => {
      const isMapped = Object.values(mapping).includes(field.value);
      if (!isMapped) {
        newErrors.push(`Campo obrigatório não mapeado: ${field.label}`);
      }
    });
    
    // Check for duplicate mappings
    const fieldCounts: { [key: string]: number } = {};
    mappedFields.forEach(field => {
      fieldCounts[field] = (fieldCounts[field] || 0) + 1;
    });
    
    Object.entries(fieldCounts).forEach(([field, count]) => {
      if (count > 1 && field !== '(ignorar)') {
        const fieldLabel = SYSTEM_FIELDS.find(f => f.value === field)?.label || field;
        newErrors.push(`Campo mapeado mais de uma vez: ${fieldLabel}`);
      }
    });
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleConfirm = () => {
    if (!validateMapping()) {
      return;
    }
    
    // Save mapping for future use
    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(mapping));
    
    // Convert to the expected format
    const columnMappings: ColumnMapping[] = Object.entries(mapping)
      .filter(([_, systemField]) => systemField !== '(ignorar)')
      .map(([fileColumn, systemField]) => ({
        fileColumn,
        systemField
      }));
    
    onMappingConfirmed(columnMappings);
  };

  const getSampleValue = (header: string): string => {
    if (sampleData.length > 0 && sampleData[0][header] !== undefined) {
      const value = sampleData[0][header];
      return String(value).substring(0, 50);
    }
    return '(vazio)';
  };

  const getMappedCount = () => {
    return Object.values(mapping).filter(field => field !== '(ignorar)').length;
  };

  const getRequiredMappedCount = () => {
    const requiredFields = SYSTEM_FIELDS.filter(f => f.required).map(f => f.value);
    return Object.values(mapping).filter(field => requiredFields.includes(field)).length;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Mapeamento de Colunas
          </CardTitle>
          <CardDescription>
            Configure qual campo do sistema corresponde a cada coluna do seu arquivo.
            Campos obrigatórios: Produto, Preço Pago e Unidade.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                {getMappedCount()} de {headers.length} colunas mapeadas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                {getRequiredMappedCount()} de 3 campos obrigatórios
              </span>
            </div>
          </div>

          {/* Mapping table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coluna do Arquivo</TableHead>
                  <TableHead>Exemplo</TableHead>
                  <TableHead>Mapear para Campo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {headers.map((header, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{header}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {getSampleValue(header)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mapping[header] || '(ignorar)'}
                        onValueChange={(value: SystemField) => updateMapping(header, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SYSTEM_FIELDS.map(field => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Problemas encontrados:</div>
                <ul className="list-disc pl-4 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              Voltar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={errors.length > 0}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Confirmar Mapeamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview section */}
      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
          <CardDescription>
            Primeiras 3 linhas de como os dados serão importados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Preço Pago</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Volume/Item</TableHead>
                  <TableHead>Fator Correção</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleData.slice(0, 3).map((row, index) => {
                  const produtoCol = Object.entries(mapping).find(([_, field]) => field === 'produto')?.[0];
                  const precoCol = Object.entries(mapping).find(([_, field]) => field === 'precoPago')?.[0];
                  const unidadeCol = Object.entries(mapping).find(([_, field]) => field === 'unidade')?.[0];
                  const volumeCol = Object.entries(mapping).find(([_, field]) => field === 'volumeItem')?.[0];
                  const fatorCol = Object.entries(mapping).find(([_, field]) => field === 'fatorCorrecao')?.[0];
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{produtoCol ? row[produtoCol] : '-'}</TableCell>
                      <TableCell>{precoCol ? row[precoCol] : '-'}</TableCell>
                      <TableCell>{unidadeCol ? row[unidadeCol] : '-'}</TableCell>
                      <TableCell>{volumeCol ? row[volumeCol] || '1' : '1'}</TableCell>
                      <TableCell>{fatorCol ? row[fatorCol] || '1' : '1'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
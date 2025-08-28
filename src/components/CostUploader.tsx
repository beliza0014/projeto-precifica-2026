import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface CostItem {
  id: string;
  name: string;
  monthly: number;
  category: string;
  dataInicio?: string;
  dataFim?: string;
  observacao?: string;
}

interface CostUploaderProps {
  onDataProcessed: (costs: CostItem[]) => void;
}

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  processedRows: number;
  totalRows: number;
  errors: string[];
  warnings: string[];
}

export function CostUploader({ onDataProcessed }: CostUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    processedRows: 0,
    totalRows: 0,
    errors: [],
    warnings: []
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!isValidFileType(file)) {
      toast({
        title: "Formato de arquivo inválido",
        description: "Apenas arquivos CSV, XLSX, JSON ou TXT são aceitos.",
        variant: "destructive"
      });
      return;
    }

    setProcessingState({
      isProcessing: true,
      progress: 0,
      processedRows: 0,
      totalRows: 0,
      errors: [],
      warnings: []
    });

    try {
      const data = await processFile(file);
      const validatedCosts = validateAndTransformData(data);
      
      if (validatedCosts.length > 0) {
        onDataProcessed(validatedCosts);
        toast({
          title: "Dados importados com sucesso!",
          description: `${validatedCosts.length} custos fixos foram processados e adicionados.`,
        });
      } else {
        toast({
          title: "Nenhum dado válido encontrado",
          description: "Verifique o formato do arquivo e tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Erro ao processar arquivo",
        description: "Ocorreu um erro durante o processamento. Verifique o arquivo e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessingState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100
      }));
    }
  };

  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/plain'
    ];
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json', '.txt'];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const processFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      if (fileExtension === 'csv' || fileExtension === 'txt') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn('CSV parsing warnings:', results.errors);
            }
            resolve(results.data);
          },
          error: (error) => reject(error)
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (fileExtension === 'json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target?.result as string);
            resolve(Array.isArray(jsonData) ? jsonData : [jsonData]);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsText(file);
      } else {
        reject(new Error('Formato de arquivo não suportado'));
      }
    });
  };

  const validateAndTransformData = (data: any[]): CostItem[] => {
    const validCosts: CostItem[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const detectedFields: string[] = [];

    // Analyze detected fields from first row
    if (data.length > 0) {
      const firstRowMapped = mapFieldNames(data[0]);
      if (firstRowMapped.name) detectedFields.push('Nome');
      if (firstRowMapped.valor) detectedFields.push('Valor');
      if (firstRowMapped.categoria) detectedFields.push('Categoria');
      if (firstRowMapped.dataInicio) detectedFields.push('Data de Início');
      if (firstRowMapped.dataFim) detectedFields.push('Data de Fim');
      if (firstRowMapped.observacao) detectedFields.push('Observação');
    }

    const currentDate = new Date();
    const currentMonthYear = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;

    data.forEach((row, index) => {
      try {
        // Try to map common field names
        const mappedRow = mapFieldNames(row);
        
        // Validate required fields - only name and value are mandatory
        if (!mappedRow.name || !mappedRow.valor) {
          const missingFields = [];
          if (!mappedRow.name) missingFields.push('Nome');
          if (!mappedRow.valor) missingFields.push('Valor');
          errors.push(`Linha ${index + 1}: Campos obrigatórios em falta (${missingFields.join(', ')})`);
          return;
        }

        // Validate numeric fields
        const valor = Number(mappedRow.valor);
        
        if (isNaN(valor) || valor <= 0) {
          errors.push(`Linha ${index + 1}: Valor deve ser um número positivo`);
          return;
        }

        // Handle category with fallback to "Outros"
        let categoria = 'outros';
        if (mappedRow.categoria) {
          const validCategories = ['operacional', 'administrativo', 'comercial', 'outros'];
          const normalizedCategory = mappedRow.categoria.toLowerCase().trim();
          if (validCategories.includes(normalizedCategory)) {
            categoria = normalizedCategory;
          } else {
            categoria = 'outros';
            if (index === 0) {
              warnings.push(`Categoria "${mappedRow.categoria}" não reconhecida, usando "Outros"`);
            }
          }
        } else if (index === 0) {
          warnings.push('Categoria não informada, usando "Outros" para todos os registros');
        }

        // Handle dataInicio with fallback to current month/year
        let dataInicio = currentMonthYear;
        if (mappedRow.dataInicio) {
          // Try to parse the date
          const parsedDate = new Date(mappedRow.dataInicio);
          if (!isNaN(parsedDate.getTime())) {
            dataInicio = `${(parsedDate.getMonth() + 1).toString().padStart(2, '0')}/${parsedDate.getFullYear()}`;
          } else {
            if (index === 0) {
              warnings.push('Data de início inválida, usando mês atual para todos os registros');
            }
          }
        } else if (index === 0) {
          warnings.push('Data de início não informada, usando mês atual para todos os registros');
        }

        // Handle dataFim - optional, if not provided, cost is continuous
        let dataFim: string | undefined;
        if (mappedRow.dataFim) {
          const parsedDate = new Date(mappedRow.dataFim);
          if (!isNaN(parsedDate.getTime())) {
            dataFim = `${(parsedDate.getMonth() + 1).toString().padStart(2, '0')}/${parsedDate.getFullYear()}`;
          } else if (index === 0) {
            warnings.push('Data de fim inválida encontrada, considerando custos como contínuos');
          }
        } else if (index === 0) {
          warnings.push('Data de fim não informada → considerando custos como contínuos');
        }

        const cost: CostItem = {
          id: `imported-${Date.now()}-${index}`,
          name: mappedRow.name.trim(),
          monthly: valor,
          category: categoria,
          dataInicio,
          dataFim,
          observacao: mappedRow.observacao ? mappedRow.observacao.trim() : undefined
        };

        validCosts.push(cost);
      } catch (error) {
        errors.push(`Linha ${index + 1}: Erro de processamento - ${error}`);
      }
    });

    // Add detection summary
    if (detectedFields.length > 0 && validCosts.length > 0) {
      const missingOptionalFields = [];
      if (!detectedFields.includes('Categoria')) missingOptionalFields.push('Categoria');
      if (!detectedFields.includes('Data de Início')) missingOptionalFields.push('Data de início');
      if (!detectedFields.includes('Data de Fim')) missingOptionalFields.push('Data de fim');
      if (!detectedFields.includes('Observação')) missingOptionalFields.push('Observação');
      
      if (missingOptionalFields.length > 0) {
        warnings.unshift(`Detectamos: ${detectedFields.join(', ')}. ${missingOptionalFields.join(' e ')} não informados → considerados como custo contínuo.`);
      } else {
        warnings.unshift(`Detectamos todos os campos: ${detectedFields.join(', ')}.`);
      }
    }

    setProcessingState(prev => ({
      ...prev,
      errors,
      warnings,
      processedRows: validCosts.length,
      totalRows: data.length
    }));

    return validCosts;
  };

  const mapFieldNames = (row: any): any => {
    const mapped: any = {};
    
    // Common field mapping for costs
    const fieldMappings: { [key: string]: string[] } = {
      name: ['nome', 'name', 'descricao', 'description', 'item', 'custo'],
      valor: ['valor', 'value', 'preco', 'price', 'montante', 'amount', 'custo_mensal', 'monthly'],
      categoria: ['categoria', 'category', 'tipo', 'type', 'class', 'classificacao'],
      dataInicio: ['data_inicio', 'inicio', 'start_date', 'start', 'vigencia_inicio'],
      dataFim: ['data_fim', 'fim', 'end_date', 'end', 'vigencia_fim'],
      observacao: ['observacao', 'observation', 'obs', 'note', 'comentario', 'comment', 'description']
    };

    Object.keys(row).forEach(key => {
      const lowerKey = key.toLowerCase().trim();
      
      // Direct mapping
      if (Object.keys(fieldMappings).includes(lowerKey)) {
        mapped[lowerKey] = row[key];
        return;
      }

      // Fuzzy mapping
      Object.entries(fieldMappings).forEach(([targetField, variations]) => {
        if (variations.some(variation => lowerKey.includes(variation) || variation.includes(lowerKey))) {
          mapped[targetField] = row[key];
        }
      });
    });

    return mapped;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Carregar Custos Fixos
        </CardTitle>
        <CardDescription>
          Envie aqui os arquivos com seus custos fixos para importação automática.
          <br />
          Formatos suportados: CSV, XLSX, JSON, TXT (tabulado)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!processingState.isProcessing && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Arraste e solte seu arquivo aqui
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              ou clique para selecionar um arquivo
            </p>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {processingState.isProcessing && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium">Processando arquivo...</p>
              <Progress value={processingState.progress} className="mt-2" />
            </div>
          </div>
        )}

        {!processingState.isProcessing && (processingState.errors.length > 0 || processingState.warnings.length > 0) && (
          <div className="space-y-3">
            {processingState.processedRows > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {processingState.processedRows} de {processingState.totalRows} registros processados com sucesso.
                </AlertDescription>
              </Alert>
            )}

            {processingState.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Erros encontrados:</div>
                  <ul className="list-disc pl-4 space-y-1">
                    {processingState.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                    {processingState.errors.length > 5 && (
                      <li className="text-sm">... e mais {processingState.errors.length - 5} erros</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {processingState.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Avisos:</div>
                  <ul className="list-disc pl-4 space-y-1">
                    {processingState.warnings.slice(0, 3).map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                    {processingState.warnings.length > 3 && (
                      <li className="text-sm">... e mais {processingState.warnings.length - 3} avisos</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
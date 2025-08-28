import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface SaleItem {
  id: string;
  date: string;
  variantId: string;
  quantity: number;
  unitPriceNet: number;
  channel?: 'balcao' | 'ifood' | 'delivery' | 'cartao' | 'outros';
  branchId?: string;
}

interface SalesDataUploaderProps {
  onDataProcessed: (sales: SaleItem[]) => void;
  availableVariants: { id: string; nome: string; produtoBaseNome: string }[];
}

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  processedRows: number;
  totalRows: number;
  errors: string[];
  warnings: string[];
}

export function SalesDataUploader({ onDataProcessed, availableVariants }: SalesDataUploaderProps) {
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
      const validatedSales = validateAndTransformData(data);
      
      if (validatedSales.length > 0) {
        onDataProcessed(validatedSales);
        toast({
          title: "Dados importados com sucesso!",
          description: `${validatedSales.length} vendas foram processadas e adicionadas.`,
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

  const validateAndTransformData = (data: any[]): SaleItem[] => {
    const validSales: SaleItem[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const detectedFields: string[] = [];

    // Analyze detected fields from first row
    if (data.length > 0) {
      const firstRowMapped = mapFieldNames(data[0]);
      if (firstRowMapped.productName) detectedFields.push('Nome');
      if (firstRowMapped.quantity) detectedFields.push('Quantidade');
      if (firstRowMapped.unitPriceNet) detectedFields.push('Preço unitário');
      if (firstRowMapped.date) detectedFields.push('Data');
      if (firstRowMapped.variantId) detectedFields.push('ID do produto');
      if (firstRowMapped.channel) detectedFields.push('Canal');
    }

    data.forEach((row, index) => {
      try {
        // Try to map common field names
        const mappedRow = mapFieldNames(row);
        
        // Validate required fields - only name, quantity and price are mandatory
        if (!mappedRow.productName || !mappedRow.quantity || !mappedRow.unitPriceNet) {
          const missingFields = [];
          if (!mappedRow.productName) missingFields.push('Nome');
          if (!mappedRow.quantity) missingFields.push('Quantidade');
          if (!mappedRow.unitPriceNet) missingFields.push('Preço unitário');
          errors.push(`Linha ${index + 1}: Campos obrigatórios em falta (${missingFields.join(', ')})`);
          return;
        }

        // Validate numeric fields
        const quantity = Number(mappedRow.quantity);
        const unitPriceNet = Number(mappedRow.unitPriceNet);
        
        if (isNaN(quantity) || quantity <= 0) {
          errors.push(`Linha ${index + 1}: Quantidade deve ser um número positivo`);
          return;
        }

        if (isNaN(unitPriceNet) || unitPriceNet <= 0) {
          errors.push(`Linha ${index + 1}: Preço deve ser um número positivo`);
          return;
        }

        // Handle date with fallback to current date
        let date = new Date();
        if (mappedRow.date) {
          const parsedDate = new Date(mappedRow.date);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate;
          } else {
            warnings.push(`Linha ${index + 1}: Data inválida, usando data atual`);
          }
        } else if (index === 0) {
          warnings.push('Data não informada, usando data atual para todos os registros');
        }

        // Handle variant ID with fallback to generated ID
        let variantId = mappedRow.variantId;
        if (!variantId) {
          // Try to find variant by name first
          const foundVariant = availableVariants.find(v => 
            v.nome.toLowerCase().includes(mappedRow.productName.toLowerCase()) ||
            v.produtoBaseNome.toLowerCase().includes(mappedRow.productName.toLowerCase())
          );
          if (foundVariant) {
            variantId = foundVariant.id;
            if (index === 0) {
              warnings.push('Produtos mapeados automaticamente usando nomes');
            }
          } else {
            // Generate internal ID
            variantId = `imported-${Date.now()}-${index}`;
            if (index === 0) {
              warnings.push('IDs de produto gerados automaticamente');
            }
          }
        }

        // Handle channel with fallback to "outros"
        const validChannels = ['balcao', 'ifood', 'delivery', 'cartao', 'outros'];
        let channel = 'outros';
        if (mappedRow.channel) {
          const normalizedChannel = mappedRow.channel.toLowerCase();
          if (['balcao', 'ifood', 'delivery', 'cartao'].includes(normalizedChannel)) {
            channel = normalizedChannel;
          } else {
            if (index === 0) {
              warnings.push(`Canal "${mappedRow.channel}" não reconhecido, usando "outros"`);
            }
          }
        } else if (index === 0) {
          warnings.push('Canal não informado, usando "outros" para todos os registros');
        }

        const sale: SaleItem = {
          id: `imported-${Date.now()}-${index}`,
          date: date.toISOString().split('T')[0],
          variantId,
          quantity,
          unitPriceNet,
          channel: channel as any
        };

        validSales.push(sale);
      } catch (error) {
        errors.push(`Linha ${index + 1}: Erro de processamento - ${error}`);
      }
    });

    // Add detection summary
    if (detectedFields.length > 0 && validSales.length > 0) {
      const missingOptionalFields = [];
      if (!detectedFields.includes('Data')) missingOptionalFields.push('Data');
      if (!detectedFields.includes('Canal')) missingOptionalFields.push('Canal');
      if (!detectedFields.includes('ID do produto')) missingOptionalFields.push('ID do produto');
      
      if (missingOptionalFields.length > 0) {
        warnings.unshift(`Detectamos: ${detectedFields.join(', ')}. ${missingOptionalFields.join(' e ')} não informados → serão preenchidos automaticamente.`);
      } else {
        warnings.unshift(`Detectamos todos os campos: ${detectedFields.join(', ')}.`);
      }
    }

    setProcessingState(prev => ({
      ...prev,
      errors,
      warnings,
      processedRows: validSales.length,
      totalRows: data.length
    }));

    return validSales;
  };

  const mapFieldNames = (row: any): any => {
    const mapped: any = {};
    
    // Common field mapping
    const fieldMappings: { [key: string]: string[] } = {
      date: ['data', 'date', 'fecha', 'datum', 'data_venda', 'sale_date'],
      variantId: ['variant_id', 'produto_id', 'product_id', 'id_produto', 'codigo'],
      productName: ['nome', 'name', 'produto', 'product', 'item', 'produto_nome', 'product_name'],
      quantity: ['quantidade', 'quantity', 'qtd', 'qty', 'amount', 'amt'],
      unitPriceNet: ['preco', 'price', 'valor', 'value', 'preco_liquido', 'unit_price', 'price_net'],
      channel: ['canal', 'channel', 'origem', 'source', 'plataforma', 'platform']
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
          Carregar Dados de Vendas
        </CardTitle>
        <CardDescription>
          Envie aqui os arquivos de vendas exportados do seu sistema online para importação automática.
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
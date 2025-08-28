import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileData {
  headers: string[];
  rows: any[];
}

interface InsumosFileUploaderProps {
  onFileProcessed: (data: FileData) => void;
}

export function InsumosFileUploader({ onFileProcessed }: InsumosFileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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
        description: "Apenas arquivos CSV e XLSX são aceitos.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(20);

    try {
      const rawData = await processFile(file);
      setProgress(60);
      
      if (!rawData || rawData.length === 0) {
        throw new Error("Arquivo vazio ou sem dados válidos");
      }

      // Extract headers from first row
      const headers = Object.keys(rawData[0]);
      setProgress(80);
      
      const fileData: FileData = {
        headers,
        rows: rawData
      };

      setProgress(100);
      onFileProcessed(fileData);
      
      toast({
        title: "Arquivo processado com sucesso!",
        description: `${rawData.length} linhas detectadas. Agora mapeie as colunas.`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Erro ao processar arquivo",
        description: "Verifique o formato do arquivo e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const processFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          encoding: 'UTF-8',
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
      } else {
        reject(new Error('Formato de arquivo não suportado'));
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Insumos
        </CardTitle>
        <CardDescription>
          Envie um arquivo CSV ou XLSX com seus insumos para importação.
          <br />
          Formatos suportados: CSV (UTF-8), XLSX
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isProcessing && (
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
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {isProcessing && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium">Processando arquivo...</p>
              <Progress value={progress} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Lendo dados do arquivo...
              </p>
            </div>
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Dica:</div>
            Seu arquivo deve conter pelo menos as colunas com informações sobre:
            produto, preço pago e unidade de medida.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
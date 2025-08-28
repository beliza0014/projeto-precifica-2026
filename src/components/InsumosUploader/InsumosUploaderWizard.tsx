import React, { useState } from 'react';
import { InsumosFileUploader } from './InsumosFileUploader';
import { ColumnMapper } from './ColumnMapper';
import { InsumosImporter } from './InsumosImporter';

interface FileData {
  headers: string[];
  rows: any[];
}

interface ColumnMapping {
  fileColumn: string;
  systemField: string;
}

type WizardStep = 'upload' | 'mapping' | 'import';

interface InsumosUploaderWizardProps {
  onComplete: () => void;
}

export function InsumosUploaderWizard({ onComplete }: InsumosUploaderWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping[]>([]);

  const handleFileProcessed = (data: FileData) => {
    setFileData(data);
    setCurrentStep('mapping');
  };

  const handleMappingConfirmed = (mapping: ColumnMapping[]) => {
    setColumnMapping(mapping);
    setCurrentStep('import');
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
    setFileData(null);
    setColumnMapping([]);
  };

  const handleBackToMapping = () => {
    setCurrentStep('mapping');
  };

  const handleImportComplete = () => {
    onComplete();
  };

  return (
    <div className="w-full">
      {currentStep === 'upload' && (
        <InsumosFileUploader onFileProcessed={handleFileProcessed} />
      )}
      
      {currentStep === 'mapping' && fileData && (
        <ColumnMapper
          headers={fileData.headers}
          sampleData={fileData.rows}
          onMappingConfirmed={handleMappingConfirmed}
          onBack={handleBackToUpload}
        />
      )}
      
      {currentStep === 'import' && fileData && (
        <InsumosImporter
          fileData={fileData.rows}
          mapping={columnMapping}
          onComplete={handleImportComplete}
          onBack={handleBackToMapping}
        />
      )}
    </div>
  );
}
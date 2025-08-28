/**
 * Formatação centralizada - Fonte única da verdade para formatos
 * Padronização pt-BR/BRL em todo o projeto
 */

/**
 * Formatação monetária BRL padrão
 */
export function formatCurrency(value: number): string {
  if (!isFinite(value) || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formatação de percentual padronizada
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (!isFinite(value) || isNaN(value)) return '0,0%';
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}

/**
 * Formatação de número padronizada
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (!isFinite(value) || isNaN(value)) return '0';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Formatação de markup (multiplicador)
 */
export function formatMarkup(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '0,00x';
  return `${formatNumber(value, 2)}x`;
}

/**
 * Parse de string monetária para número
 */
export function parseCurrency(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  
  // Remove formatação monetária
  const cleaned = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '') // Remove pontos (separadores de milhares)
    .replace(/,/g, '.'); // Troca vírgula por ponto (decimal)
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse de string percentual para número
 */
export function parsePercentage(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  
  const cleaned = value.replace(/[%\s]/g, '').replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validação e sanitização de input numérico
 */
export function sanitizeNumericInput(value: string | number): number {
  if (typeof value === 'number') {
    return isFinite(value) ? value : 0;
  }
  
  if (!value || typeof value !== 'string') return 0;
  
  // Remove caracteres não numéricos exceto vírgula e ponto
  const cleaned = value.replace(/[^\d,.]/g, '');
  
  // Converte vírgula para ponto
  const normalized = cleaned.replace(/,/g, '.');
  
  // Remove pontos extras (mantém apenas o último como decimal)
  const parts = normalized.split('.');
  const result = parts.length > 1 
    ? `${parts.slice(0, -1).join('')}.${parts[parts.length - 1]}`
    : normalized;
  
  const parsed = parseFloat(result);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Formatação de unidades para ficha técnica
 */
export function formatUnit(value: number, unit: string): string {
  const formattedValue = formatNumber(value, value < 1 ? 3 : 1);
  return `${formattedValue} ${unit.toLowerCase()}`;
}

/**
 * Conversão entre unidades base
 */
export function convertToBaseUnit(value: number, fromUnit: string, toUnit: string): number {
  const conversions: Record<string, Record<string, number>> = {
    // Peso
    'g': { 'kg': 0.001, 'g': 1 },
    'kg': { 'g': 1000, 'kg': 1 },
    
    // Volume
    'ml': { 'l': 0.001, 'ml': 1 },
    'l': { 'ml': 1000, 'l': 1 },
    
    // Unidade
    'un': { 'un': 1, 'cx': 1, 'pct': 1 },
    'cx': { 'un': 1, 'cx': 1, 'pct': 1 },
    'pct': { 'un': 1, 'cx': 1, 'pct': 1 }
  };
  
  const fromNormalized = fromUnit.toLowerCase();
  const toNormalized = toUnit.toLowerCase();
  
  if (!conversions[fromNormalized] || !conversions[fromNormalized][toNormalized]) {
    console.warn(`Conversão não suportada: ${fromUnit} → ${toUnit}`);
    return value;
  }
  
  return value * conversions[fromNormalized][toNormalized];
}

/**
 * Validação de combinações de unidades válidas
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const groups = [
    ['g', 'kg'], // Peso
    ['ml', 'l'], // Volume
    ['un', 'cx', 'pct'] // Unidade
  ];
  
  const normalized1 = unit1.toLowerCase();
  const normalized2 = unit2.toLowerCase();
  
  return groups.some(group => 
    group.includes(normalized1) && group.includes(normalized2)
  );
}
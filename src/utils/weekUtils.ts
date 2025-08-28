/**
 * Utilitários para agregação por semanas ISO
 * CORREÇÃO: Usar isoWeekYear + isoWeek com timezone fixo
 */

import { getISOWeek, getISOWeekYear, parseISO, isValid } from 'date-fns';

/**
 * Gerar chave única para semana ISO com timezone fixo
 */
export function getISOWeekKey(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      console.warn('Data inválida para agregação por semana:', date);
      return 'invalid';
    }
    
    // Usar timezone UTC para consistência
    const utcDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
    
    const year = getISOWeekYear(utcDate);
    const week = getISOWeek(utcDate);
    
    return `${year}-W${week.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Erro ao gerar chave de semana ISO:', error);
    return 'error';
  }
}

/**
 * Formatação para exibição na UI
 */
export function formatISOWeekLabel(weekKey: string): string {
  if (weekKey === 'invalid' || weekKey === 'error') {
    return 'Semana Inválida';
  }
  
  const [year, week] = weekKey.split('-W');
  return `Semana ISO ${week}/${year}`;
}

/**
 * Agregar dados por semana ISO
 */
export function aggregateByISOWeek<T>(
  data: Array<T & { date: string | Date }>,
  valueExtractor: (item: T) => number
): Record<string, { total: number; count: number; items: T[] }> {
  const aggregated: Record<string, { total: number; count: number; items: T[] }> = {};
  
  data.forEach(item => {
    const weekKey = getISOWeekKey(item.date);
    
    if (!aggregated[weekKey]) {
      aggregated[weekKey] = { total: 0, count: 0, items: [] };
    }
    
    aggregated[weekKey].total += valueExtractor(item);
    aggregated[weekKey].count += 1;
    aggregated[weekKey].items.push(item);
  });
  
  return aggregated;
}

/**
 * Validar casos limite (virada de ano, etc.)
 */
export function validateWeekAggregation(data: any[]): { 
  valid: boolean; 
  issues: string[];
  corrections?: string[];
} {
  const issues: string[] = [];
  const corrections: string[] = [];
  
  // Verificar se há datas próximas à virada do ano
  const yearEndDates = data.filter(item => {
    const date = typeof item.date === 'string' ? new Date(item.date) : item.date;
    const month = date.getMonth();
    const day = date.getDate();
    return (month === 11 && day >= 29) || (month === 0 && day <= 3);
  });
  
  if (yearEndDates.length > 0) {
    issues.push('Encontradas datas próximas à virada do ano');
    corrections?.push('Verifique se as semanas ISO estão sendo calculadas corretamente');
  }
  
  // Verificar consistência de timezone
  const timezones = new Set(
    data.map(item => {
      const date = typeof item.date === 'string' ? new Date(item.date) : item.date;
      return date.getTimezoneOffset();
    })
  );
  
  if (timezones.size > 1) {
    issues.push('Inconsistência de timezone detectada');
    corrections?.push('Normalizar todas as datas para UTC antes da agregação');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    corrections
  };
}
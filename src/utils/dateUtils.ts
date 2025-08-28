// Utilitários de data usando apenas Date nativo (sem libs externas)

export type DateRange = {
  start: string;
  end: string;
};

// YYYY-MM-DD a partir de Date (local)
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// parse 'YYYY-MM-DD' para Date (local)
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// limites do dia atual (local)
export function todayRange(): DateRange {
  const now = new Date();
  const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { start: toISODate(s), end: toISODate(s) };
}

export function last7DaysRange(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return { start: toISODate(start), end: toISODate(end) };
}

export function currentMonthRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toISODate(start), end: toISODate(end) };
}

export function last12MonthsRolling(): DateRange {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
  // fim = último dia do mês corrente
  const endMonthLast = new Date(end.getFullYear(), end.getMonth() + 1, 0);
  return { start: toISODate(start), end: toISODate(endMonthLast) };
}

// Algoritmo ISO week com Date nativo
export function isoWeekOf(dateISO: string): { year: number; week: number } {
  const d = fromISODate(dateISO);
  // quinta-feira da semana ISO
  const target = new Date(d.valueOf());
  target.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  const weekNo =
    1 + Math.round(((target.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return { year: target.getFullYear(), week: weekNo };
}

// Validações
export function isValidDateRange(start: string, end: string): boolean {
  if (!start || !end) return false;
  try {
    const startDate = fromISODate(start);
    const endDate = fromISODate(end);
    const today = new Date();
    
    // start ≤ end && não aceitar datas futuras
    return startDate <= endDate && endDate <= today;
  } catch {
    return false;
  }
}

export function formatDateForDisplay(dateISO: string): string {
  try {
    const date = fromISODate(dateISO);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateISO;
  }
}
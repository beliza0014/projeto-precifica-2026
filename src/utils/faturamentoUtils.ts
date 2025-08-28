// Lógica de agregação e cálculo do faturamento diário

import { fromISODate } from './dateUtils';

export type SaleItem = {
  id: string;
  date: string; // 'YYYY-MM-DD'
  variantId: string;
  quantity: number;
  unitPriceNet: number;
  status?: 'paid' | 'completed' | 'canceled' | 'refunded';
};

export type FaturamentoManualDia = {
  id: string;
  data: string; // 'YYYY-MM-DD' para diário ou 'YYYY-MM' para mensal
  valor: number;
  isMonthly?: boolean; // true para lançamentos mensais
};

export type DailyView = Array<{ data: string; valor: number }>;

export type Granularity = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export type AggregatedSeries = {
  series: Array<{ key: string; total: number }>;
  total: number;
};

// Construir view diário a partir das vendas
export function buildDailyFromSales(sales: SaleItem[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sales) {
    if (!s?.date) continue;
    if (s.status === 'canceled' || s.status === 'refunded') continue;
    const v = (s.quantity || 0) * (s.unitPriceNet || 0);
    map[s.date] = (map[s.date] || 0) + v;
  }
  return map; // { 'YYYY-MM-DD': valor }
}

// Fallback: extrair do objeto mensal antigo
export function buildDailyFromLegacyMonthly(oldFaturamento: any): Record<string, number> {
  const map: Record<string, number> = {};
  
  // Verificar se é array de faturamentos mensais
  if (Array.isArray(oldFaturamento)) {
    for (const item of oldFaturamento) {
      if (!item?.mes || typeof item.valor !== 'number') continue;
      
      // Converter "Janeiro", "Fevereiro", etc. para número do mês
      const mesesPorExtenso = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
      
      const mesIndex = mesesPorExtenso.indexOf(item.mes);
      if (mesIndex === -1) continue;
      
      const year = new Date().getFullYear(); // Usar ano atual como aproximação
      const month = mesIndex + 1;
      const lastDay = new Date(year, month, 0).getDate();
      const dayStr = `${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
      
      if (item.valor > 0) {
        map[dayStr] = (map[dayStr] || 0) + item.valor;
      }
    }
  }
  
  // Verificar se é objeto com periodos
  const periodos = oldFaturamento?.periodos || [];
  for (const p of periodos) {
    if (!p?.mes) continue;
    const [y, m] = String(p.mes).split('-').map(Number);
    if (!y || !m) continue;
    const lastDay = new Date(y, m, 0).getDate();
    const dayStr = `${y}-${String(m).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
    
    // soma todos os canais (se existirem) ou usa metaBruta como aproximação
    const total =
      Number(p?.canal?.balcao || 0) +
      Number(p?.canal?.ifood || 0) +
      Number(p?.canal?.delivery || 0) +
      Number(p?.canal?.cartao || 0) ||
      Number(p?.metaBruta || 0);
    if (total > 0) map[dayStr] = (map[dayStr] || 0) + total;
  }
  
  return map;
}

// Mesclar todas as fontes de dados
export function mergeDailySources(
  fromSales: Record<string, number>,
  fromLegacy: Record<string, number>,
  manual: FaturamentoManualDia[]
): DailyView {
  const bucket: Record<string, number> = { ...fromLegacy, ...fromSales };
  
  for (const m of manual || []) {
    if (!m?.data || typeof m?.valor !== 'number') continue;
    
    if (m.isMonthly) {
      // Para lançamentos mensais, alocar valor integral no último dia do mês
      const [year, month] = m.data.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      bucket[dayStr] = (bucket[dayStr] || 0) + m.valor;
    } else {
      // Lançamento diário normal
      bucket[m.data] = (bucket[m.data] || 0) + m.valor;
    }
  }
  
  return Object.entries(bucket)
    .map(([data, valor]) => ({ data, valor: Number(valor.toFixed(2)) }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export type FilterType = 'all' | 'daily' | 'monthly';

// Agregação por granularidade
export function aggregateSeries(
  dailyView: DailyView,
  startISO: string,
  endISO: string,
  gran: Granularity,
  filterType?: FilterType,
  manualData?: FaturamentoManualDia[]
): AggregatedSeries {
  const start = fromISODate(startISO);
  const end = fromISODate(endISO);
  const bucket = new Map<string, number>();

  // Criar conjunto de datas manuais se filtro aplicado
  const manualDatesSet = new Set<string>();
  const monthlyDatesSet = new Set<string>();
  
  if (filterType && filterType !== 'all' && manualData) {
    for (const manual of manualData) {
      if (manual.isMonthly) {
        // Para lançamentos mensais, calcular a data do último dia do mês
        const [year, month] = manual.data.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        monthlyDatesSet.add(dayStr);
      } else {
        manualDatesSet.add(manual.data);
      }
    }
  }

  for (const row of dailyView) {
    const d = fromISODate(row.data);
    if (d < start || d > end) continue;
    
    // Aplicar filtro se especificado
    if (filterType && filterType !== 'all') {
      const isManualDaily = manualDatesSet.has(row.data);
      const isManualMonthly = monthlyDatesSet.has(row.data);
      
      if (filterType === 'daily' && !isManualDaily) continue;
      if (filterType === 'monthly' && !isManualMonthly) continue;
    }
    
    let key: string;

    if (gran === 'DAY') {
      key = row.data;
    } else if (gran === 'MONTH') {
      key = row.data.slice(0, 7); // 'YYYY-MM'
    } else if (gran === 'YEAR') {
      key = row.data.slice(0, 4); // 'YYYY'
    } else {
      // WEEK
      const { year, week } = isoWeekOf(row.data);
      key = `${year}-W${String(week).padStart(2, '0')}`;
    }

    bucket.set(key, (bucket.get(key) || 0) + row.valor);
  }

  const series = Array.from(bucket.entries())
    .map(([key, total]) => ({ key, total: Number(total.toFixed(2)) }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const total = Number(series.reduce((s, x) => s + x.total, 0).toFixed(2));
  return { series, total };
}

// Algoritmo ISO week 
function isoWeekOf(dateISO: string): { year: number; week: number } {
  const d = fromISODate(dateISO);
  // quinta-feira da semana ISO
  const target = new Date(d.valueOf());
  target.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  const weekNo =
    1 + Math.round(((target.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return { year: target.getFullYear(), week: weekNo };
}

// Formatação de moeda
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Storage helpers
export function getFaturamentoManualDiario(): FaturamentoManualDia[] {
  try {
    const stored = localStorage.getItem('faturamentoManualDiario');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveFaturamentoManualDiario(data: FaturamentoManualDia[]): void {
  try {
    localStorage.setItem('faturamentoManualDiario', JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar faturamento manual:', error);
  }
}

export function addManualFaturamento(data: string, valor: number, isMonthly: boolean = false): void {
  const existing = getFaturamentoManualDiario();
  const id = isMonthly ? `FT-${data}-MEN` : `FT-${data}-MAN`;
  
  // Remove existing entry for the same date/month if exists
  const filtered = existing.filter(item => item.data !== data || item.isMonthly !== isMonthly);
  
  // Add new entry
  filtered.push({ id, data, valor, isMonthly });
  
  saveFaturamentoManualDiario(filtered);
}
export function getVariantForCustoFrete(value: number) {
  if (value > 15) return "warning";
  if (value > 12) return "warning"; 
  if (value > 8) return "default";
  return "success";
}

export function getVariantForCupons(value: number) {
  if (value > 12) return "warning";
  if (value > 8) return "warning";
  if (value > 5) return "default"; 
  return "success";
}

export function getVariantForImpactoLiquido(value: number) {
  return value > 0 ? "success" : "warning";
}

export function formatPercentageWithGuard(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "0,0%";
  return `${value.toFixed(1)}%`;
}

export function formatROI(freteCobrado: number, custoFrete: number): string {
  if (custoFrete === 0 || !isFinite(custoFrete)) return "—";
  const roi = ((freteCobrado / custoFrete) - 1) * 100;
  if (!isFinite(roi) || isNaN(roi)) return "—";
  return `${roi.toFixed(1)}%`;
}

export function calcBasePercentage(faturamento: number, freteCobradoTotal: number, incluiFrete: boolean): number {
  return incluiFrete ? faturamento : faturamento + freteCobradoTotal;
}

export function calcPercentageWithBase(value: number, base: number): number {
  if (base <= 0 || !isFinite(base)) return 0;
  const result = (value / base) * 100;
  return isFinite(result) ? result : 0;
}
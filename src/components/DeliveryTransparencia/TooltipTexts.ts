export const tooltipTexts = {
  freteCobrado: "Quanto do faturamento vem do valor de frete cobrado do cliente.\nFórmula: freteCobradoTotal ÷ base% × 100.",
  
  custoFrete: "Quanto do faturamento é consumido pelos custos de entrega (própria/terceiro + taxas).\nFórmula: custoFreteTotal ÷ base% × 100.",
  
  impactoLiquido: "Receita de frete menos custo de frete, em % do faturamento.\nSe positivo, o frete ajuda a margem; se negativo, reduz.\nFórmula: (freteCobradoTotal − custoFreteTotal) ÷ base% × 100.",
  
  cupons: "Descontos concedidos no período em % do faturamento.\nFórmula: totalCupons ÷ base% × 100.",
  
  ticketMedio: "Preço médio por pedido.\nFórmula: faturamento ÷ pedidos.",
  
  pedidosDia: "Quantos pedidos em média por dia trabalhado.\nFórmula: pedidos ÷ dias.",
  
  faturamentoDia: "Receita média por dia trabalhado.\nFórmula: faturamento ÷ dias.",
  
  roiFrete: "Retorno sobre o custo de frete.\nFórmula: ((freteCobradoTotal ÷ custoFreteTotal) − 1) × 100.\nSe custoFreteTotal = 0, exibir '—'.",
  
  custoTotal: "Soma dos percentuais de custo de frete e cupons, sobre a mesma base.\nFórmula: %CustoFrete + %Cupons."
} as const;
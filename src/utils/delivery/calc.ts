export type DeliveryInputs = {
  faturamento: number;   // R$
  pedidos: number;       // qtd
  dias: number;          // qtd
  mixCurtaPct: number;   // 0-100
  freteCobradoCurto: number; // R$
  freteCobradoLongo: number; // R$
  totalCupons: number;   // R$
};

export type DeliveryCfg = {
  own?: { enabled: boolean; costPerOrder: number };
  third?: { enabled: boolean; costPerOrder: number };
  ifood?: { monthlyFee?: number; fixedFeePerOrder?: number };
};

export function calcDelivery(inputs: DeliveryInputs, cfg: DeliveryCfg, incluiFrete: boolean = true) {
  const { faturamento, pedidos, dias, mixCurtaPct, freteCobradoCurto, freteCobradoLongo, totalCupons } = inputs;

  if (faturamento <= 0 || pedidos <= 0 || dias <= 0) {
    return { error: "Preencha faturamento, pedidos e dias (> 0)." } as const;
  }

  const qtdCurta = Math.round(pedidos * (mixCurtaPct / 100));
  const qtdLonga = Math.max(0, pedidos - qtdCurta);

  // Receita de frete (o que COBRA do cliente)
  const freteCobradoTotal = (qtdCurta * freteCobradoCurto) + (qtdLonga * freteCobradoLongo);
  
  // Base para cálculo de percentuais
  const basePct = incluiFrete ? faturamento : faturamento + freteCobradoTotal;
  
  const pctFreteCobrado = basePct > 0 ? (freteCobradoTotal / basePct) * 100 : 0;

  // Custo de frete (o que PAGA)
  const custoPorPedido =
    cfg?.own?.enabled ? (cfg.own.costPerOrder || 0) :
    cfg?.third?.enabled ? (cfg.third.costPerOrder || 0) :
    0;

  const custoFreteTotal =
    (pedidos * custoPorPedido) +
    (cfg?.ifood?.monthlyFee || 0) +
    (pedidos * (cfg?.ifood?.fixedFeePerOrder || 0));

  const pctCustoFrete = basePct > 0 ? (custoFreteTotal / basePct) * 100 : 0;

  // Impacto líquido do frete na margem
  const impactoFreteLiquido = freteCobradoTotal - custoFreteTotal;
  const pctImpactoLiquido = basePct > 0 ? (impactoFreteLiquido / basePct) * 100 : 0;

  // Cupons
  const pctCupons = basePct > 0 ? (totalCupons / basePct) * 100 : 0;

  // Operacionais
  const ticketMedio = pedidos > 0 ? faturamento / pedidos : 0;
  const pedidosDia = dias > 0 ? pedidos / dias : 0;
  const faturamentoDia = dias > 0 ? faturamento / dias : 0;

  return {
    qtdCurta, qtdLonga,
    freteCobradoTotal, pctFreteCobrado,
    custoFreteTotal, pctCustoFrete,
    impactoFreteLiquido, pctImpactoLiquido,
    pctCupons,
    ticketMedio, pedidosDia, faturamentoDia,
    basePct,
  };
}
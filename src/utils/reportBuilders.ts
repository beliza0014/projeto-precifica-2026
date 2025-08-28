import { FinancialContextType } from '@/contexts/FinancialContext';
import { ExportSheet } from './exportUtils';

type ChannelId = 'balcao' | 'cartao' | 'ifood' | 'delivery';

// Build Fixed Costs Report
export const buildFixedCostsReport = (context: FinancialContextType): ExportSheet => {
  const data = context.fixedCostsConfig.costs.map(cost => ({
    'ID': cost.id,
    'Nome': cost.name,
    'Categoria': cost.category,
    'Mensal (R$)': cost.monthly
  }));

  return {
    name: 'Custos Fixos',
    data
  };
};

// Build Variable Costs Report
export const buildVariableCostsReport = (context: FinancialContextType): ExportSheet => {
  const data: any[] = [];
  
  // Get product names mapping
  const productNameMap = context.variacoesConfig.variacoes.reduce((acc, variacao) => {
    acc[variacao.id] = variacao.nome;
    return acc;
  }, {} as Record<string, string>);

  // Process variable operations
  Object.entries(context.variableOps).forEach(([productId, channels]) => {
    Object.entries(channels).forEach(([channelId, channelData]) => {
      if (channelData) {
        const channelFees = context.feesTaxes[channelId as ChannelId];
        const customTaxes = context.customTaxesFeesConfig.taxes
          .filter(tax => tax.active && (!tax.channel || tax.channel === channelId));
        
        const percentageTaxes = customTaxes
          .filter(tax => tax.type === 'percentage')
          .reduce((sum, tax) => sum + tax.value, 0);
        
        const fixedTaxes = customTaxes
          .filter(tax => tax.type === 'fixed')
          .reduce((sum, tax) => sum + tax.value, 0);

        data.push({
          'Produto': productNameMap[productId] || productId,
          'Canal': channelId,
          'Custo Variável por Pedido (R$)': channelData.F,
          'Taxas (%)': percentageTaxes + (channelFees?.t ? channelFees.t * 100 : 0),
          'Taxa Fixa Extra (R$)': fixedTaxes + (channelFees?.F_extra || 0)
        });
      }
    });
  });

  return {
    name: 'Custos Variáveis',
    data
  };
};

// Build Inputs Report
export const buildInsumosReport = (context: FinancialContextType): ExportSheet => {
  const data = context.insumos.map(insumo => ({
    'ID': insumo.id,
    'Produto': insumo.produto,
    'Unidade': insumo.unidade,
    'Preço Pago (R$)': insumo.precoPago,
    'Fator Correção': insumo.fatorCorrecao,
    'Custo Efetivo (R$)': insumo.custoEfetivo,
    'Valor Final Unitário (R$)': insumo.valorFinalUnit
  }));

  return {
    name: 'Insumos',
    data
  };
};

// Build Recipes Report (2 sheets)
export const buildReceitasReport = (context: FinancialContextType): ExportSheet[] => {
  // Sheet 1: Recipes summary
  const receitasData = context.receitas.map(receita => ({
    'ID': receita.id,
    'Nome': receita.nome,
    'Rendimento': `${receita.rendimentoQtd} ${receita.rendimentoUnid}`,
    'Perda (%)': receita.perdaPercentual,
    'Custo Total (R$)': receita.custoTotal,
    'Custo por Unidade (R$)': receita.custoPorUnidade
  }));

  // Sheet 2: Recipe items
  const itensData: any[] = [];
  context.receitas.forEach(receita => {
    receita.itens.forEach(item => {
      itensData.push({
        'Receita': receita.nome,
        'Insumo': item.nomeInsumo,
        'Quantidade': item.quantidade,
        'Custo Unitário (R$)': item.custoUnitario,
        'Custo Total Item (R$)': item.custoItem
      });
    });
  });

  return [
    {
      name: 'Receitas',
      data: receitasData
    },
    {
      name: 'Itens das Receitas',
      data: itensData
    }
  ];
};

// Build Variations Report
export const buildVariacoesReport = (context: FinancialContextType): ExportSheet => {
  const data = context.variacoesConfig.variacoes.map(variacao => {
    // Calculate estimated margin if price is available
    const revenueData = context.revenue[variacao.id];
    let precoAplicado = 0;
    let margemEstimada = 0;

    if (revenueData) {
      // Get first available price from any channel
      const channelData = Object.values(revenueData)[0];
      if (channelData && typeof channelData === 'object' && 'currentPrice' in channelData && channelData.currentPrice) {
        precoAplicado = channelData.currentPrice as number;
        margemEstimada = ((precoAplicado - variacao.unitCost) / precoAplicado) * 100;
      }
    }

    return {
      'ID': variacao.id,
      'Nome': variacao.nome,
      'Produto Base': variacao.produtoBaseNome,
      'CMV Unitário (R$)': variacao.unitCost,
      'Preço Aplicado (R$)': precoAplicado || 'N/A',
      'Margem Estimada (%)': precoAplicado ? margemEstimada : 'N/A'
    };
  });

  return {
    name: 'Variações/Produtos',
    data
  };
};

// Build Sales Report
export const buildFaturamentoReport = (context: FinancialContextType): ExportSheet => {
  // Get product names mapping
  const productNameMap = context.variacoesConfig.variacoes.reduce((acc, variacao) => {
    acc[variacao.id] = variacao.nome;
    return acc;
  }, {} as Record<string, string>);

  const data = context.salesData.map(sale => ({
    'Data': new Date(sale.date).toLocaleDateString('pt-BR'),
    'Produto': productNameMap[sale.variantId] || sale.variantId,
    'Quantidade Vendida': sale.quantity,
    'Preço Unitário Líquido (R$)': sale.unitPriceNet,
    'Receita Total (R$)': sale.quantity * sale.unitPriceNet,
    'Canal': sale.channel || 'N/A',
    'Status': sale.status || 'N/A'
  }));

  // Calculate aggregates
  const receitaBrutaTotal = data.reduce((sum, item) => sum + (item['Receita Total (R$)'] as number), 0);
  const ticketMedio = data.length > 0 ? receitaBrutaTotal / data.length : 0;

  // Add summary rows
  if (data.length > 0) {
    data.push(
      { 'Data': '', 'Produto': '', 'Quantidade Vendida': null, 'Preço Unitário Líquido (R$)': null, 'Receita Total (R$)': null, 'Canal': '', 'Status': '' },
      { 'Data': 'TOTAIS:', 'Produto': '', 'Quantidade Vendida': null, 'Preço Unitário Líquido (R$)': null, 'Receita Total (R$)': null, 'Canal': '', 'Status': '' },
      { 'Data': 'Receita Bruta Total:', 'Produto': '', 'Quantidade Vendida': null, 'Preço Unitário Líquido (R$)': null, 'Receita Total (R$)': receitaBrutaTotal, 'Canal': '', 'Status': '' },
      { 'Data': 'Ticket Médio:', 'Produto': '', 'Quantidade Vendida': null, 'Preço Unitário Líquido (R$)': null, 'Receita Total (R$)': ticketMedio, 'Canal': '', 'Status': '' }
    );
  }

  return {
    name: 'Faturamento/Vendas',
    data
  };
};

// Build Indicators Report
export const buildIndicadoresReport = (context: FinancialContextType): ExportSheet => {
  // Calculate CMV metrics
  const variacoes = context.variacoesConfig.variacoes;
  
  if (variacoes.length === 0) {
    return {
      name: 'Indicadores',
      data: [{ 'Indicador': 'Nenhum dado disponível', 'Valor': '' }]
    };
  }

  // Calculate weighted average CMV
  let totalRevenue = 0;
  let weightedCMV = 0;

  variacoes.forEach(variacao => {
    const revenueData = context.revenue[variacao.id];
    if (revenueData) {
      const totalUnits = Object.values(revenueData).reduce((sum, channel) => {
        if (channel && typeof channel === 'object' && 'units' in channel) {
          return sum + ((channel.units as number) || 0);
        }
        return sum;
      }, 0);
      
      const channelPrices = Object.values(revenueData).filter(channel => 
        channel && typeof channel === 'object' && 'currentPrice' in channel && channel.currentPrice
      );
      
      const avgPrice = channelPrices.length > 0 
        ? channelPrices.reduce((sum, channel) => sum + ((channel as any).currentPrice || 0), 0) / channelPrices.length
        : 0;
      
      const productRevenue = totalUnits * avgPrice;
      
      totalRevenue += productRevenue;
      weightedCMV += variacao.unitCost * totalUnits;
    }
  });

  const cmvMedioPonderado = totalRevenue > 0 ? weightedCMV / (totalRevenue / (totalRevenue / variacoes.length)) : 0;
  const margemBruta = totalRevenue > 0 ? ((totalRevenue - weightedCMV) / totalRevenue) * 100 : 0;

  // Sort by CMV for rankings
  const sortedByCMV = [...variacoes].sort((a, b) => a.unitCost - b.unitCost);
  const top10Melhores = sortedByCMV.slice(0, 10);
  const top10Piores = sortedByCMV.slice(-10).reverse();

  const data = [
    { 'Indicador': 'CMV Médio Ponderado (R$)', 'Valor': cmvMedioPonderado.toFixed(2) },
    { 'Indicador': 'Margem Bruta (%)', 'Valor': margemBruta.toFixed(2) },
    { 'Indicador': '', 'Valor': '' },
    { 'Indicador': 'TOP 10 MELHORES CMV:', 'Valor': '' },
    ...top10Melhores.map((v, i) => ({ 
      'Indicador': `${i + 1}. ${v.nome}`, 
      'Valor': `R$ ${v.unitCost.toFixed(2)}` 
    })),
    { 'Indicador': '', 'Valor': '' },
    { 'Indicador': 'TOP 10 PIORES CMV:', 'Valor': '' },
    ...top10Piores.map((v, i) => ({ 
      'Indicador': `${i + 1}. ${v.nome}`, 
      'Valor': `R$ ${v.unitCost.toFixed(2)}` 
    }))
  ];

  return {
    name: 'Indicadores',
    data
  };
};

// Build Delivery Report
export const buildDeliveryReport = (context: FinancialContextType): ExportSheet => {
  const { deliveryConfig, ifoodPlanConfig } = context;
  
  const data = [
    // Delivery configuration
    { 'Configuração': 'Entrega Própria - Habilitada', 'Valor': deliveryConfig.ownDelivery.enabled ? 'Sim' : 'Não' },
    { 'Configuração': 'Entrega Própria - Custo por Pedido (R$)', 'Valor': deliveryConfig.ownDelivery.costPerOrder },
    { 'Configuração': 'Entrega Própria - Raio (km)', 'Valor': deliveryConfig.ownDelivery.radius },
    { 'Configuração': 'Entrega Terceirizada - Habilitada', 'Valor': deliveryConfig.thirdPartyDelivery.enabled ? 'Sim' : 'Não' },
    { 'Configuração': 'Entrega Terceirizada - Custo por Pedido (R$)', 'Valor': deliveryConfig.thirdPartyDelivery.costPerOrder },
    { 'Configuração': '', 'Valor': '' },
    // iFood configuration
    { 'Configuração': 'iFood - Tipo de Plano', 'Valor': ifoodPlanConfig.planType },
    { 'Configuração': 'iFood - Mensalidade (R$)', 'Valor': ifoodPlanConfig.monthlyFee },
    { 'Configuração': 'iFood - Taxa de Comissão (%)', 'Valor': (ifoodPlanConfig.commissionRate * 100).toFixed(2) },
    { 'Configuração': 'iFood - Taxa Fixa por Pedido (R$)', 'Valor': ifoodPlanConfig.fixedFeePerOrder }
  ];

  return {
    name: 'Delivery/Taxas',
    data
  };
};

// Build all reports
export const buildAllReports = (context: FinancialContextType): ExportSheet[] => {
  const reports: ExportSheet[] = [];
  
  // Add each report
  reports.push(buildFixedCostsReport(context));
  reports.push(buildVariableCostsReport(context));
  reports.push(buildInsumosReport(context));
  
  // Recipes generates 2 sheets
  const receitasSheets = buildReceitasReport(context);
  reports.push(...receitasSheets);
  
  reports.push(buildVariacoesReport(context));
  reports.push(buildFaturamentoReport(context));
  reports.push(buildIndicadoresReport(context));
  reports.push(buildDeliveryReport(context));
  
  return reports;
};
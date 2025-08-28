import { z } from 'zod';

// Schema para custos
export const costComponentsSchema = z.object({
  cvu: z.number()
    .min(0, 'CVU deve ser maior ou igual a zero')
    .max(10000, 'CVU muito alto'),
  cfu: z.number()
    .min(0, 'CFU deve ser maior ou igual a zero')
    .max(10000, 'CFU muito alto'),
  variableCosts: z.number()
    .min(0, 'Custos variáveis devem ser maiores ou iguais a zero')
    .max(10000, 'Custos variáveis muito altos'),
  fixedTaxes: z.number()
    .min(0, 'Taxas fixas devem ser maiores ou iguais a zero')
    .max(1000, 'Taxas fixas muito altas'),
});

// Schema para taxas
export const taxRatesSchema = z.object({
  taxes: z.number()
    .min(0, 'Impostos devem ser maiores ou iguais a zero')
    .max(50, 'Taxa de impostos muito alta'),
  commission: z.number()
    .min(0, 'Comissão deve ser maior ou igual a zero')
    .max(50, 'Taxa de comissão muito alta'),
  cardFees: z.number()
    .min(0, 'Taxa do cartão deve ser maior ou igual a zero')
    .max(20, 'Taxa do cartão muito alta'),
  discounts: z.number()
    .min(0, 'Descontos devem ser maiores ou iguais a zero')
    .max(80, 'Taxa de desconto muito alta'),
  delivery: z.object({
    type: z.enum(['percentage', 'fixed']),
    value: z.number().min(0, 'Valor de delivery deve ser positivo'),
  }).optional(),
});

// Schema para entrada de precificação
export const pricingInputSchema = z.object({
  costs: costComponentsSchema,
  taxRates: taxRatesSchema,
  targetMargin: z.number()
    .min(0, 'Margem alvo deve ser maior ou igual a zero')
    .max(95, 'Margem alvo muito alta (máx. 95%)'),
  promotionDiscount: z.number()
    .min(0, 'Desconto promocional deve ser maior ou igual a zero')
    .max(50, 'Desconto promocional muito alto')
    .optional(),
}).refine(
  (data) => {
    const totalCost = data.costs.cvu + data.costs.cfu + data.costs.variableCosts;
    return totalCost > 0;
  },
  {
    message: 'Custo total deve ser maior que zero',
    path: ['costs'],
  }
).refine(
  (data) => {
    const totalPercentages = data.taxRates.taxes + data.taxRates.commission + 
                           data.taxRates.cardFees + data.taxRates.discounts + 
                           data.targetMargin;
    return totalPercentages < 100;
  },
  {
    message: 'Soma de taxas e margem não pode ser maior ou igual a 100%',
    path: ['taxRates'],
  }
);

// Schema para insumo
export const insumoSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  quantidade: z.number().min(0.001, 'Quantidade deve ser maior que zero'),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  custoUnitario: z.number().min(0, 'Custo unitário deve ser positivo'),
  fatorCorrecao: z.number().min(0.1, 'Fator de correção muito baixo').max(10, 'Fator de correção muito alto'),
  custoLiquido: z.number().min(0, 'Custo líquido deve ser positivo'),
});

// Schema para taxa de canal
export const taxasCanalSchema = z.object({
  impostos: z.number().min(0).max(50),
  comissaoApp: z.number().min(0).max(50),
  cartao: z.number().min(0).max(20),
  descontos: z.number().min(0).max(80),
  entregaTipo: z.enum(['percentual', 'fixo']),
  entregaValor: z.number().min(0),
});

// Schema para receita
export const receitaSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  rendimentoQtd: z.number().min(1, 'Rendimento deve ser maior que zero'),
  rendimentoUnid: z.string().min(1, 'Unidade de rendimento é obrigatória'),
  perdaPercentual: z.number().min(0).max(50, 'Percentual de perda muito alto'),
  custoTotal: z.number().min(0, 'Custo total deve ser positivo'),
  custoPosPerda: z.number().min(0, 'Custo pós-perda deve ser positivo'),
  custoPorUnidade: z.number().min(0, 'Custo por unidade deve ser positivo'),
});

// Funções de validação com mensagens amigáveis
export function validatePricingInput(data: unknown): { 
  success: boolean; 
  data?: z.infer<typeof pricingInputSchema>; 
  errors?: string[] 
} {
  try {
    const result = pricingInputSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const field = err.path.join('.');
        return `${field}: ${err.message}`;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Erro de validação desconhecido'] };
  }
}

export function validateInsumo(data: unknown): { 
  success: boolean; 
  data?: z.infer<typeof insumoSchema>; 
  errors?: string[] 
} {
  try {
    const result = insumoSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Erro de validação desconhecido'] };
  }
}

export function validateTaxasCanal(data: unknown): { 
  success: boolean; 
  data?: z.infer<typeof taxasCanalSchema>; 
  errors?: string[] 
} {
  try {
    const result = taxasCanalSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Erro de validação desconhecido'] };
  }
}

// Validações de ranges específicas
export const VALIDATION_LIMITS = {
  costs: {
    min: 0,
    max: 10000,
  },
  taxes: {
    min: 0,
    max: 50,
  },
  margin: {
    min: 0,
    max: 95,
  },
  discount: {
    min: 0,
    max: 50,
  },
} as const;

// Função para validar se valores estão dentro dos limites
export function isWithinLimits(value: number, type: keyof typeof VALIDATION_LIMITS): boolean {
  const limits = VALIDATION_LIMITS[type];
  return value >= limits.min && value <= limits.max;
}

// Função para sanitizar entrada numérica
export function sanitizeNumericInput(value: string | number): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) || !isFinite(num) ? 0 : Math.max(0, num);
}
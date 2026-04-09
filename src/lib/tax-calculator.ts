/**
 * Calculadora IR 2026 — Lei da faixa de isenção até R$ 5.000
 * Tabela progressiva com desconto simplificado de R$ 312,89
 * para quem ganha até R$ 5.000 (isenção efetiva).
 */

interface TaxResult {
  grossIncome: number;
  taxableIncome: number;
  tax: number;
  effectiveRate: number;
  bracket: string;
}

const BRACKETS = [
  { min: 0, max: 2259.20, rate: 0, deduction: 0, label: "Isento" },
  { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44, label: "7,5%" },
  { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44, label: "15%" },
  { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77, label: "22,5%" },
  { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.00, label: "27,5%" },
];

const SPECIAL_REDUCTION = 312.89;

export function calculateIR(monthlyGross: number): TaxResult {
  if (monthlyGross <= 5000) {
    return {
      grossIncome: monthlyGross,
      taxableIncome: 0,
      tax: 0,
      effectiveRate: 0,
      bracket: "Isento (até R$ 5.000)",
    };
  }

  const bracket = BRACKETS.find((b) => monthlyGross >= b.min && monthlyGross <= b.max)!;
  const rawTax = monthlyGross * bracket.rate - bracket.deduction;
  const tax = Math.max(0, rawTax);

  return {
    grossIncome: monthlyGross,
    taxableIncome: monthlyGross,
    tax,
    effectiveRate: monthlyGross > 0 ? (tax / monthlyGross) * 100 : 0,
    bracket: bracket.label,
  };
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

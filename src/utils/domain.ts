import { STAGES, type Stage } from '../types';

export const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const dateLabel = (date: Date) => date.toLocaleDateString('pt-BR');
export const normalizePlate = (plate: string) => plate.replace(/[\s-]/g, '').toUpperCase();
export const validPlate = (plate: string) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalizePlate(plate));
export const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Inteiros em centavos evitam erros de ponto flutuante ao somar valores.
export function parseMoney(value: string): number {
  const clean = value.trim().replace(/^R\$\s*/, '');
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(clean)) throw new Error('Use um valor como 150,00 ou 1.250,50.');
  const [whole = '0', fraction = ''] = clean.replace(/\./g, '').split(',');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents > 100_000_000) throw new Error('O valor máximo é R$ 1.000.000,00.');
  return cents;
}

export function requireText(value: string, label: string, min = 2, max = 160): string {
  const clean = value.trim();
  if (clean.length < min || clean.length > max) throw new Error(`${label}: informe de ${min} a ${max} caracteres.`);
  return clean;
}

export function localDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

export function validateDates(entry: Date, delivery: Date) {
  if (!Number.isFinite(entry.getTime()) || !Number.isFinite(delivery.getTime())) throw new Error('Selecione datas válidas.');
  if (localDay(delivery).getTime() < localDay(entry).getTime()) throw new Error('A previsão de entrega deve ser igual ou posterior à entrada.');
}

export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
  const date = new Date(y, m - 1, d, 12);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}
export const dateInput = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const nextStage = (stage: Stage): Stage | undefined => {
  const removedNext: Partial<Record<Stage, Stage>> = { 'Aguardando avaliação': 'Aguardando peças', 'Em diagnóstico': 'Aguardando peças', 'Aguardando aprovação': 'Aguardando peças', 'Em testes': 'Serviço concluído' };
  if (removedNext[stage]) return removedNext[stage];
  const legacy = ['Recebido', 'Chapeamento', 'Preparação', 'Pintura', 'Acabamento', 'Entregue'] as const;
  const stages: readonly Stage[] = legacy.includes(stage as typeof legacy[number]) && stage !== 'Entregue' ? legacy : STAGES;
  return stages[stages.indexOf(stage) + 1];
};
export const clientStage = (stage: Stage): Stage => ({
  'Aguardando avaliação': 'Veículo recebido',
  'Em diagnóstico': 'Veículo recebido',
  'Aguardando aprovação': 'Veículo recebido',
  'Em testes': 'Em manutenção',
} as Partial<Record<Stage, Stage>>)[stage] || stage;
export function summarize(movements: { kind: 'receita' | 'despesa'; amountCents: number }[]) {
  const income = movements.filter(m => m.kind === 'receita').reduce((s, m) => s + m.amountCents, 0);
  const expense = movements.filter(m => m.kind === 'despesa').reduce((s, m) => s + m.amountCents, 0);
  return { income, expense, balance: income - expense };
}

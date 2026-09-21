import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientStage, parseMoney, validPlate, normalizePlate, validateDates, parseLocalDate, dateInput, nextStage, summarize } from '../src/utils/domain';
import { normalizeCpf, validCpf, plateEmail } from '../functions/validation';

test('CPF valida verificadores e nunca aceita sequências repetidas', () => {
  assert.equal(normalizeCpf('529.982.247-25'), '52998224725');
  assert.equal(validCpf('529.982.247-25'), true);
  for (const cpf of ['11111111111', '00000000000', '52998224724', '1234567890', '5299822472x']) assert.equal(validCpf(cpf), false);
  assert.equal(plateEmail('abc-1d23'), 'abc1d23@clientes.sgo.invalid');
  assert.equal(nextStage('Veículo recebido'), 'Aguardando peças');
  assert.equal(nextStage('Em diagnóstico'), 'Aguardando peças');
  assert.equal(nextStage('Em testes'), 'Serviço concluído');
  assert.equal(clientStage('Em diagnóstico'), 'Veículo recebido');
  assert.equal(clientStage('Em testes'), 'Em manutenção');
});

test('valores monetários em pt-BR são convertidos para centavos exatos', () => {
  assert.equal(parseMoney('1.234,56'), 123456);
  assert.equal(parseMoney('0,10') + parseMoney('0,20'), 30);
  assert.equal(parseMoney('R$ 15,5'), 1550);
  assert.equal(parseMoney('0'), 0);
  for (const input of ['-2,00', '1.23', '1,234', '', 'abc', '1000001', 'Infinity']) assert.throws(() => parseMoney(input));
});
test('aceita placas brasileiras antigas e Mercosul', () => {
  assert.equal(normalizePlate('abc-1234'), 'ABC1234');
  for (const plate of ['ABC1234', 'ABC1D23']) assert.equal(validPlate(plate), true);
  for (const plate of ['ABC123', '1234567', 'ABC12345', 'ABCD123']) assert.equal(validPlate(plate), false);
});
test('datas preservam o dia local e rejeitam datas inexistentes', () => {
  const date = parseLocalDate('2026-09-19')!;
  assert.equal(dateInput(date), '2026-09-19');
  assert.equal(date.getHours(), 12);
  assert.equal(parseLocalDate('2026-02-30'), null);
  assert.equal(parseLocalDate('19/09/2026'), null);
  assert.throws(() => validateDates(new Date(2026, 8, 20), new Date(2026, 8, 19)));
  assert.throws(() => validateDates(new Date(NaN), date));
  assert.doesNotThrow(() => validateDates(date, date));
});
test('fluxo de reparo termina na entrega', () => {
  assert.equal(nextStage('Recebido'), 'Chapeamento');
  assert.equal(nextStage('Acabamento'), 'Entregue');
  assert.equal(nextStage('Entregue'), undefined);
});
test('saldo usa apenas receitas e despesas efetivamente registradas', () => {
  assert.deepEqual(summarize([]), { income: 0, expense: 0, balance: 0 });
  assert.deepEqual(summarize([{ kind: 'receita', amountCents: 30000 }, { kind: 'despesa', amountCents: 12550 }]), { income: 30000, expense: 12550, balance: 17450 });
});

// Shared by trusted functions and client-side validation; never stores a CPF.
const normalizePlate = value => String(value ?? '').replace(/[\s-]/g, '').toUpperCase();
const normalizeCpf = value => String(value ?? '').replace(/[.\s-]/g, '');
function validCpf(value) {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let length = 9; length <= 10; length++) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const digit = (sum * 10) % 11 % 10;
    if (digit !== Number(cpf[length])) return false;
  }
  return true;
}
const validPlate = value => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalizePlate(value));
const plateEmail = plate => `${normalizePlate(plate).toLowerCase()}@clientes.sgo.invalid`;
module.exports = { normalizePlate, normalizeCpf, validCpf, validPlate, plateEmail };

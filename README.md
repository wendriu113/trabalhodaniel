# SGO · Oficina

App Expo + Firebase para oficina mecânica. Usa Authentication, Firestore, Storage e Cloud Functions.

## Rodar localmente

O modo local usa os emuladores do Firebase. Assim você desenvolve sem configurar o Storage no console.

```bash
npm ci
npm ci --prefix functions
cp .env.example .env
export EXPO_PUBLIC_USE_EMULATORS=true
npm run emulators
```

Em outro terminal:

```bash
export EXPO_PUBLIC_USE_EMULATORS=true
npm start
```

Para abrir no navegador:

```bash
export EXPO_PUBLIC_USE_EMULATORS=true
npm run web
```

Se estiver testando em celular físico, ajuste `EXPO_PUBLIC_EMULATOR_HOST` para o IP da máquina que está rodando os emuladores. No Android emulado, use `10.0.2.2`.

## Rodar em outra máquina

1. Clone o repositório.
2. Rode `npm ci` e `npm ci --prefix functions`.
3. Copie `.env.example` para `.env`.
4. Se quiser evitar o Firebase real, deixe `EXPO_PUBLIC_USE_EMULATORS=true`.
5. Se precisar de admin local, use os emuladores e siga o fluxo abaixo.

## Login admin

Para liberar uma conta como administradora no Firebase real:

```bash
node scripts/admin-access.mjs SEU_PROJECT_ID UID_DO_ADMIN
node scripts/admin-access.mjs SEU_PROJECT_ID UID_DO_ADMIN --apply
```

O primeiro comando só simula. O segundo grava a claim `admin: true`. Depois, saia da conta no app e entre de novo.

## Firebase real

1. Crie/ative Authentication, Firestore e Storage no projeto Firebase.
2. Preencha `.env` com a configuração pública do app web.
3. Rode o app com `npm start` ou `npm run web`.

Deploy:

```bash
npx firebase login
npx firebase deploy --project ddm7-22ce5 --only functions,firestore:rules,firestore:indexes,storage
```

## Cliente

No app, entre em **Login administrativo** e use a aba **Clientes** para:

1. Cadastrar o cliente.
2. Vincular placa e veículo.
3. Informar o CPF válido no campo de acesso inicial.
4. Clicar em **Criar acesso do cliente**.

Cada placa ganha uma conta técnica `placa@clientes.sgo.invalid`. O CPF é usado só como senha inicial.

## Testes

```bash
npm run lint
npm run typecheck
npm test
```

## Notas rápidas

- `EXPO_PUBLIC_USE_EMULATORS=true` faz Auth, Firestore, Storage e Functions usarem a máquina local.
- O Storage continua no fluxo, mas sem custo no Firebase real quando você roda só com emuladores.
- O app usa a região `southamerica-east1` para Cloud Functions.

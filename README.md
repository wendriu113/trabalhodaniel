# SGO · Sistema de Gestão para Oficina

Aplicativo para administrar clientes, veículos, ordens de serviço, andamento dos reparos, anexos, pagamentos e movimentações financeiras. O cliente entra com a placa e acompanha apenas as informações públicas do próprio veículo.

O projeto foi desenvolvido com Expo, React Native, TypeScript e Firebase. Para apresentação e desenvolvimento, ele pode funcionar completamente no computador usando os emuladores locais do Firebase.

## Funcionalidades

- cadastro de clientes e veículos;
- acesso do cliente por placa e senha inicial definida pela oficina;
- troca obrigatória da senha no primeiro acesso;
- ordens de serviço com orçamento, etapas e histórico;
- fotos e notas fiscais visíveis para o cliente;
- registro de pagamentos dentro da ordem;
- receitas e despesas no controle financeiro;
- regras de segurança separando dados públicos e internos da oficina.

## Requisitos

- [Node.js 22](https://nodejs.org/);
- [Java 21](https://learn.microsoft.com/java/openjdk/download), necessário para o Firestore Emulator;
- [Git](https://git-scm.com/downloads);
- Expo Go, caso queira testar em um celular.

Confirme as versões no PowerShell:

```powershell
node --version
npm --version
java -version
git --version
```

## 1. Baixar o projeto

```powershell
git clone https://github.com/wendriu113/trabalhodaniel.git
cd trabalhodaniel
```

Também é possível baixar o projeto como ZIP pelo GitHub e extrair os arquivos.

## 2. Instalar as dependências

```powershell
npm ci
npm ci --prefix functions
```

O primeiro comando instala o aplicativo e as ferramentas de teste. O segundo instala as dependências das Cloud Functions.

## 3. Configurar o modo local

Crie o arquivo `.env` usando o modelo do projeto:

```powershell
Copy-Item .env.example .env
```

Abra o `.env` e altere estas linhas:

```env
EXPO_PUBLIC_USE_EMULATORS=true
EXPO_PUBLIC_EMULATOR_HOST=127.0.0.1
```

No modo local, as demais variáveis Firebase podem continuar vazias. O arquivo `.env` não é enviado ao GitHub.

## 4. Iniciar os emuladores do Firebase

Abra um PowerShell na pasta do projeto e execute:

```powershell
npm run emulators
```

Esse comando inicia:

| Serviço | Endereço |
| --- | --- |
| Interface dos emuladores | http://127.0.0.1:4000 |
| Cloud Functions | http://127.0.0.1:5001 |
| Firestore | `127.0.0.1:8080` |
| Authentication | `127.0.0.1:9099` |
| Storage | `127.0.0.1:9199` |

Mantenha esse terminal aberto. Na primeira execução, o Firebase cria a pasta `.firebase-data`. Ao encerrar com `Ctrl+C`, os dados locais são salvos para a próxima execução.

## 5. Criar o administrador local

Com os emuladores abertos, inicie outro PowerShell na pasta do projeto:

```powershell
npm run seed:admin
```

Use estes dados somente no ambiente local:

```text
E-mail: adm@adm.com
Senha: Adm123
```

O comando pode ser executado novamente para recuperar o administrador local. Para escolher outro e-mail e senha:

```powershell
npm run seed:admin -- demo-sgo professor@exemplo.com Senha123
```

## 6. Iniciar o aplicativo

Abra um terceiro PowerShell na pasta do projeto:

```powershell
npm run web
```

O Expo mostrará o endereço do aplicativo e normalmente abrirá o navegador. Outra opção é executar `npm start` e pressionar `w` no terminal.

## Ordem correta para a apresentação

Use três terminais:

1. Terminal 1: `npm run emulators`
2. Terminal 2: `npm run seed:admin` — somente na primeira execução ou para recuperar o acesso.
3. Terminal 3: `npm run web`

Entre em **Login administrativo** com o administrador local. Cadastre um cliente, um veículo e uma ordem. Na área de clientes, informe uma senha inicial de pelo menos 6 caracteres. No primeiro login do cliente, o sistema exigirá uma nova senha de pelo menos 8 caracteres, contendo letras e números.

## Testar no celular com Expo Go

O celular e o computador devem estar na mesma rede Wi-Fi.

1. Execute `ipconfig` e localize o endereço IPv4 do computador.
2. Troque o host no `.env`, por exemplo:

```env
EXPO_PUBLIC_USE_EMULATORS=true
EXPO_PUBLIC_EMULATOR_HOST=192.168.0.10
```

3. Reinicie os emuladores.
4. Execute `npm start -- --lan`.
5. Leia o QR Code com o Expo Go.

No emulador Android, use `10.0.2.2` como host. Caso o celular não conecte, permita Java e Node.js no Firewall do Windows e desative temporariamente VPNs ou redes com isolamento de dispositivos.

## Resolver erro de porta ocupada

Se aparecer `Could not start Firestore Emulator, port taken`, outra instância está usando a porta `8080`. Feche terminais antigos dos emuladores. Se o processo continuar preso, execute:

```powershell
$firebaseProcess = Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($firebaseProcess) { Stop-Process -Id $firebaseProcess.OwningProcess }
npm run emulators
```

Use esse comando somente quando tiver certeza de que a porta pertence a uma instância antiga do Firebase Emulator.

## Executar as verificações

Verificações básicas:

```powershell
npm run lint
npm run typecheck
npm test
```

Testes que iniciam emuladores temporários:

```powershell
npm run test:rules
npm run test:backend
powershell -NoProfile -File scripts\run-local-checks.ps1 -E2E
```

## Dados locais

- `.firebase-data`: usuários e documentos dos emuladores;
- `.env`: configuração local do aplicativo;
- `.cache`: downloads e backups de migração;
- `docs/screenshots`: imagens geradas pelos testes.

Esses arquivos não são enviados ao GitHub. Para começar com dados vazios, feche os emuladores e remova somente a pasta `.firebase-data`.

## Usar um projeto Firebase real

Crie um aplicativo Web no Firebase Console e preencha o `.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_USE_EMULATORS=false
EXPO_PUBLIC_EMULATOR_HOST=127.0.0.1
```

Publique regras, índices, Storage e Functions:

```powershell
npx firebase login
npx firebase deploy --project SEU_PROJECT_ID --only functions,firestore:rules,firestore:indexes,storage
```

Credenciais administrativas e arquivos de conta de serviço nunca devem ser colocados no aplicativo ou enviados ao GitHub.

## Estrutura principal

```text
src/components     Componentes compartilhados
src/contexts       Autenticação e carregamento dos dados
src/screens        Telas administrativas e do cliente
src/services       Operações com Firebase
functions          Cloud Functions confiáveis
scripts            Emuladores, administrador e migrações
tests              Testes de domínio, regras, backend e navegador
```

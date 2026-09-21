# SGO · Oficina

Expo SDK 57, React Native, React, TypeScript, Firebase Authentication, Firestore,
Storage e Cloud Functions. O visual e os componentes existentes foram mantidos.

## Diagnóstico do erro ao salvar

O código original gravava em `users/{uid}/orders/{id}` e usava o UID da sessão.
Os campos enviados correspondiam às regras locais. Antes das alterações, os seis
testes originais passaram nos emuladores, inclusive criação de OS. Portanto,
**não foi possível reproduzir a falha de criação no ambiente local**.

O `.env` aponta para `ddm7-22ce5`; a CLI não possui conta Google autorizada.
Não foi possível consultar as regras publicadas, o usuário que falhou ou os logs
da operação real. Não seria correto afirmar que a causa exata em produção foi
confirmada. O erro `permission-denied` confirma rejeição da autorização, mas
sozinho não identifica a condição da regra que falhou.

Problemas confirmados no código anterior: qualquer usuário cadastrado entrava
no painel da oficina, não existiam perfis, regras bloqueavam edição dos dados
da OS e não havia separação entre conteúdo interno e conteúdo do cliente.
O novo fluxo verifica sessão e autorização administrativa, valida os vínculos e
salva as partes pública e interna atomicamente. Em desenvolvimento, o erro
técnico é registrado no console; a interface apresenta uma mensagem compreensível.

Para concluir o diagnóstico real: entrar com uma conta administrativa autorizada,
confirmar o projeto no console Firebase, comparar as regras publicadas com este
repositório, executar a gravação e verificar o código/stack no console de
desenvolvimento. Não alterar regras para permitir acesso público.

## Executar

Requisitos: Node 22.13+ para as ferramentas Expo; Cloud Functions configuradas
para Node 22. Os testes locais também funcionam com Node 24. Java 21 é necessário
para os emuladores.

```powershell
npm ci
npm ci --prefix functions
npm start
# navegador
npm run web
```

Copie `.env.example` para `.env` e preencha a configuração pública. Depois de
mudar variáveis, reinicie com `npx expo start --clear`.

## Firebase real e primeiro administrador

1. Habilite Authentication → E-mail/senha, Firestore `(default)` e Storage.
2. Habilite o plano/serviços necessários para publicar Cloud Functions e Storage.
3. Crie a conta do responsável no console Authentication, ou use uma conta
   existente cuja identidade tenha sido conferida. Copie o UID.
4. Em uma estação confiável, configure Application Default Credentials com
   permissões administrativas mínimas necessárias no projeto. Alternativamente,
   `GOOGLE_APPLICATION_CREDENTIALS` aponta para uma credencial fora do repositório.
   **Nunca use uma variável `EXPO_PUBLIC_*` para credenciais administrativas.**
5. Execute a simulação, confira projeto/UID e depois aplique:

```powershell
node scripts/admin-access.mjs ddm7-22ce5 UID_DO_RESPONSAVEL
node scripts/admin-access.mjs ddm7-22ce5 UID_DO_RESPONSAVEL --apply
```

O script preserva claims existentes e adiciona `admin: true`. Ter `role: admin`
em um documento não concede privilégios. Não há autocadastro administrativo no
aplicativo. Depois da autorização, saia e entre novamente.

Revise as regras existentes se este Firebase também servir outros aplicativos.
Publique explicitamente com uma conta Google autorizada:

```powershell
npx firebase login
npx firebase deploy --project ddm7-22ce5 --only functions,firestore:rules,firestore:indexes,storage
```

Publicação, criação de administrador e migração **não foram executadas no projeto
real**. O aplicativo usa as funções na região `southamerica-east1`.

## Como cadastrar acesso de cliente

Entre em **Login administrativo**. Na aba **Clientes**, salve o cliente, selecione-o,
cadastre placa e modelo, informe o CPF válido no campo de acesso inicial e clique
em **Criar acesso do cliente**. Para editar o modelo, selecione o veículo e salve
mantendo sua placa. Transferência de titularidade e troca de placa não são feitas
implicitamente: exigem revisão administrativa dos vínculos.

A placa é normalizada para maiúsculas, sem espaços/traços, aceitando formato antigo
e Mercosul. O CPF é normalizado e tem os dois dígitos verificadores validados.
É enviado ao Authentication como senha inicial, não gravado no Firestore nem
retornado na resposta. O campo é limpo após o cadastro.

Cada placa provisionada tem uma conta Authentication com identificador técnico
`placa@clientes.sgo.invalid`, oculto na interface. Todas as contas das placas do
mesmo titular apontam para o mesmo `customerId` atribuído pelo backend. Assim,
qualquer acesso válido desse titular permite acompanhar seus vários veículos.
A nova senha é individual por acesso/placa; não é sincronizada entre contas.

O primeiro login exige uma nova senha de 12 a 128 caracteres, com letras e números.
Somente depois dessa troca e de um novo login os dados ficam disponíveis. Tokens
anteriores à troca são recusados pelas regras, além da revogação de refresh tokens.
Não se permite repetir o cadastro para redefinir senha. Caso uma tentativa parcial
seja retomada, a interface avisa que a senha original foi preservada. Recuperações
de contas exigem verificar a identidade pelo responsável no Firebase; o domínio
técnico não recebe e-mails de recuperação.

## Coleções e regras

| Caminho | Conteúdo e acesso |
| --- | --- |
| `users/{uid}` | Perfil, `customerId`, troca inicial e marco de validade das credenciais. Leitura própria/admin; escrita exclusiva do backend. |
| `customers/{id}` | Nome, telefone, UID principal, criação. Somente administradores; gravação por função. Sem CPF. |
| `vehicles/{plate}` | Modelo, `customerId`, conta vinculada e estado de provisionamento. Somente administradores; gravação por função. |
| `customerVehicles/{plate}` | Projeção somente com placa, modelo e `customerId`. Cliente vinculado pode ler. |
| `serviceOrders/{id}` | Veículo, placa, vínculos, datas, status, observações públicas e histórico público. Cliente vinculado lê; admin grava. |
| `serviceOrderInternal/{id}` | Nome/telefone, descrição administrativa, orçamento e observações internas. Somente administradores. |
| `serviceOrderUpdates/{id}` | Evento público imutável ligado à OS/cliente, autor e data. Cliente vinculado lê; admin cria. |
| `users/{uid}/orders/{id}` | Ordens legadas preservadas, leitura administrativa até migração. |
| `users/{uid}/orders/{id}/attachments` | Anexos administrativos preservados no caminho original. |
| `users/{uid}/movements/{id}` | Financeiro legado mantido por conta administrativa. |

`ownerUid` identifica o UID principal quando já provisionado; não é utilizado
sozinho para autorizar leitura. A regra compara o `customerId` do documento com o
perfil **não editável pelo cliente**, vinculado ao UID autenticado. Isso atende
também os acessos adicionais por placa. Ordens abertas antes do provisionamento
podem ter `ownerUid` vazio e ficam corretamente associadas pelo `customerId`.

Clientes não escrevem ordens, status, perfis ou veículos. Visitantes não acessam
dados. Campos desconhecidos não entram nos documentos públicos pela API cliente.
Informações internas ficam fisicamente separadas: não dependem de esconder campos
na tela. Rotas administrativas não são montadas na sessão de cliente. Anexos e
financeiro permanecem exclusivos da administração. A previsão de entrega pode
ser nula, sem criar um prazo fictício.

## Migração e recuperação

Nenhuma ordem antiga é apagada. O painel administrativo continua exibindo ordens
legadas e seus anexos, em modo de consulta até a associação segura.

Cadastre clientes e veículos e crie um mapeamento **revisado manualmente**:

```json
[{ "uid": "UID_ORIGINAL", "orderId": "ID_ORIGINAL", "customerId": "CLIENTE_CADASTRADO", "vehicleId": "ABC1D23" }]
```

```powershell
node scripts/migrate-orders.mjs ddm7-22ce5 mapping.json
node scripts/migrate-orders.mjs ddm7-22ce5 mapping.json --apply
```

O script valida placa/titularidade, recusa destinos existentes e IDs duplicados,
grava backup privado em `.cache/migration-backups` **antes** de escrever e usa uma
transação por ordem. Originais/anexos ficam intactos. Histórico antigo não era
classificado como público: suas notas são preservadas em `internalNotes`, sem
publicação automática. Status antigos e suas etapas continuam sendo exibidos.
Históricos grandes não são truncados: o script interrompe para revisão.

Se ocorrer falha no meio, as ordens já copiadas permanecem íntegras; retire do
mapeamento somente os destinos conferidos e repita as pendentes. Não apague nada
automaticamente. Recuperação: use o backup para conferir cada destino e os
originais ainda existentes. Se precisar reverter uma associação incorreta, suspenda
o acesso da conta afetada no Auth e, com Admin SDK/console confiável, remova apenas
as cópias novas identificadas no backup, depois de exportá-las se receberam novas
atualizações. Não reverta publicando as regras antigas, que não têm perfis seguros.
Antes de uma migração real, faça também um export gerenciado do Firestore e backup
do Storage em um local privado fora deste computador.

## Testar

```powershell
npm run lint
npm run typecheck
npm test
powershell -ExecutionPolicy Bypass -File scripts/run-local-checks.ps1
powershell -ExecutionPolicy Bypass -File scripts/run-local-checks.ps1 -Backend
powershell -ExecutionPolicy Bypass -File scripts/run-local-checks.ps1 -E2E
```

Os scripts usam `demo-sgo`, nunca o Firebase real. No Windows, encontram o Java
preparado em `.cache/java21`; se necessário, execute `scripts/setup-test-java.ps1`.
O E2E gera o bundle Expo e usa Chrome instalado, com viewport móvel e desktop.
Os emuladores precisam das portas 8080, 9099, 9199 e 5001 livres.

Para usar manualmente os emuladores, defina `EXPO_PUBLIC_USE_EMULATORS=true`, execute
`scripts/run-local-checks.ps1 -StartOnly` e, em outro terminal, `npm run web`.

## Variáveis de ambiente

No app: `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`,
`EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`,
`EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID`,
`EXPO_PUBLIC_USE_EMULATORS` e `EXPO_PUBLIC_EMULATOR_HOST`. Modelo: `.env.example`.
No dispositivo físico, o host dos emuladores deve ser o IP do computador.
No backend publicado, o Firebase fornece as credenciais de execução; não existe
segredo administrativo no bundle Expo. Os scripts de administração/migração usam
ADC ou `GOOGLE_APPLICATION_CREDENTIALS` somente na estação confiável.

## Graphify

Ambiente Python isolado em `.cache/graphify-venv`. Mapa e relatório em
`graphify-out/graph.html` e `graphify-out/GRAPH_REPORT.md`.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/graphify.ps1 query "authentication"
powershell -ExecutionPolicy Bypass -File scripts/graphify.ps1 update .
```

Use `/graphify` para refazer também a análise semântica da documentação.
`.graphifyignore` exclui segredos, dependências e arquivos gerados. O grafo é uma
ajuda de navegação, não uma prova de segurança nem substituto dos testes.

## Arquivos principais alterados

`AGENTS.md`, `README.md`, configuração Firebase/regras, `src/config/firebase.ts`,
contextos de sessão/dados, tipos, serviços, login, clientes, painel do cliente,
formulário/detalhes/lista de ordens, navegação, anexos e mensagens de erro.
Novos: `functions/`, scripts administrativos/migração/Graphify e configuração de
lint. Testes de domínio, regras, backend e E2E cobrem os novos fluxos. O antigo
`RegisterScreen.tsx` foi removido para eliminar o autocadastro administrativo.
Documentos acadêmicos anteriores permanecem como registro histórico.

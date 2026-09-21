# Verificação da entrega

Executada em 19/09/2026, Windows, Node.js 24.14 e Expo SDK 57.

| Verificação | Resultado |
| --- | --- |
| TypeScript (`npm run typecheck`) | Passou |
| Compatibilidade (`npx expo install --check`) | Dependências compatíveis |
| Validações e financeiro (`npm test`) | 5 testes passaram |
| Regras Firestore e Storage | 6 testes passaram nos emuladores |
| Fluxo pela interface | Passou no Chrome, viewport 390 × 844 |
| Exportação web | Bundle gerado |
| Exportação Android/iOS | Bundles Hermes gerados |

O fluxo de interface testa: validação de login vazio, criação de conta, criação de OS com datas escolhidas, orçamento, avanço de etapa no modal, upload e visualização de foto, receita e despesa, saldo e filtro por período, recarga com sessão preservada, clientes, cancelar/confirmar logout, segunda conta sem acesso aos dados da primeira e novo login da primeira conta. A automação bloqueia chamadas fora de localhost.

As regras testam leitura/escrita entre contas, visitante não autenticado, campos inválidos, datas invertidas, valores negativos, avanço fora de sequência, adulteração de histórico, metadados de anexos e tipo/tamanho dos arquivos.

## Capturas

- [Login](screenshots/login.png)
- [Home](screenshots/home.png)
- [Ordem de serviço](screenshots/ordem.png)
- [Financeiro](screenshots/financeiro.png)

## Pendências externas

- Ativar Authentication com e-mail/senha no projeto Firebase real: a tentativa de conexão recebeu `auth/configuration-not-found`.
- Conferir a criação do Firestore e publicar as regras fornecidas. A CLI local não possui conta autorizada para publicar.
- Habilitar Storage/plano necessário se quiser usar anexos na nuvem.
- Executar no dispositivo Android/iOS para validar calendário, permissões, teclado e persistência nativos. Gerar bundles não equivale a instalar e testar no aparelho.

Os testes funcionais e de regras usam emuladores; não comprovam a configuração do console Firebase real. As tentativas na nuvem não criaram contas com sucesso. O `.env` continua apontando para `ddm7-22ce5`.

O npm reportou 18 avisos moderados em dependências transitivas de ferramentas. Não foi aplicado `audit fix --force`, que propunha versões incompatíveis do Expo. O pacote temporário de leitura do PDF foi removido das dependências da entrega.

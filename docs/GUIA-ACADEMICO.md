# Guia de apresentação — SGO

## Problema e recorte

As referências fornecidas relatam ordens, fotos, orçamentos e comprovantes dispersos entre papel e WhatsApp. O SGO reúne essas informações por atendimento e apresenta o andamento do reparo e o saldo registrado. Este recorte acadêmico atende o trabalho de desenvolvimento mobile sem exigir API própria ou portal adicional.

A arquitetura tem três responsabilidades: **apresentação** (telas/componentes), **aplicação** (contexts/services/validações) e **dados** (Authentication, Firestore e Storage). As regras do Firebase fazem a autorização no servidor; ocultar um botão não é usado como proteção de acesso.

## Correspondência com os nove requisitos

| Requisito | Evidência na implementação |
| --- | --- |
| Tema SGO | Nome, textos e entidades voltados à oficina de chapeamento e pintura |
| Cadastro, login e logout Firebase | `src/contexts/AuthContext.tsx`; Login, Cadastro e Conta |
| Adicionar dados ao Firestore | `src/services/orders.ts`, Nova ordem e Novo lançamento |
| Três informações e data escolhida | OS: cliente, placa, serviço e datas; movimento: tipo, descrição, valor e data; anexo: tipo, descrição, arquivo e data |
| Login, Cadastro, Home e tela adicional | Dez telas, incluindo Ordens, Detalhes, Clientes e Financeiro |
| Stack/Drawer/Bottom Tabs | Stack com rotas condicionais e Bottom Tabs, em `src/navigation/AppNavigator.tsx` |
| Modal funcional | Atualização do reparo, anexos, visualização da foto e confirmação de saída |
| DateTimePicker | `src/components/DateField.tsx`, usado em datas de entrada, entrega, etapa, anexo e financeiro |
| Interface organizada e feedback | Campos identificados, cards de OS, filtros, loading, validação, erros e confirmação de etapa/anexo |

## Roteiro de demonstração

1. Abra o aplicativo e crie uma conta. Mostre a validação da confirmação de senha.
2. Na Home, abra uma ordem com cliente **Ana Souza**, telefone com DDD, **Chevrolet Onix 2020** e placa **ABC1D23**.
3. Descreva **reparo e pintura do para-lama dianteiro esquerdo**.
4. Abra o calendário e escolha a entrada e a previsão de entrega. Demonstre que a entrega não pode anteceder a entrada.
5. Informe mão de obra **1.200,00** e materiais **350,50**. Mostre o total **R$ 1.550,50** e salve.
6. Na tela de detalhes, abra **Atualizar andamento**, informe observação e data, confirme e mostre o histórico salvo.
7. Se Storage estiver habilitado, envie uma foto ou nota com descrição e data. Abra o anexo salvo.
8. Consulte a OS pela placa na aba Ordens e o cliente na aba Clientes.
9. Registre uma receita **500,00** e uma despesa **100,00** no Financeiro. Mostre o saldo **400,00** e o filtro por período.
10. Saia usando o modal, entre novamente e mostre que os registros permanecem. Em outra conta, a lista deve ficar vazia.

No celular, o calendário demonstrado é o DateTimePicker nativo. No navegador, o seletor é adaptado para HTML. Para comprovar o requisito nativo na apresentação, execute também em Android ou iOS.

## Trechos centrais para explicar

Em `src/config/firebase.ts`, `initializeApp` recebe a configuração pública do `.env`; `getFirestore` obtém o banco e `createAuth` seleciona a persistência da plataforma.

Em `src/contexts/AuthContext.tsx`, `onAuthStateChanged` acompanha a sessão. `createUserWithEmailAndPassword`, `signInWithEmailAndPassword` e `signOut` executam cadastro, login e logout. Os dados da senha ficam a cargo do Firebase.

Em `src/services/orders.ts`, `createOrder` usa uma transação com ID estável: se o mesmo envio for repetido após falha de rede, não cria outra OS. `Timestamp.fromDate` converte a data escolhida; `serverTimestamp` guarda o momento da gravação. A interface só navega para o detalhe depois da confirmação do servidor.

Em `src/contexts/DataContext.tsx`, `onSnapshot` assina as coleções do usuário e atualiza a tela quando os dados mudam. O retorno do efeito remove as assinaturas ao sair. Uma chave por UID descarta o estado da conta anterior.

Em `src/screens/OrderDetailScreen.tsx`, o modal guarda observação e data em estado local. Confirmar chama `advanceOrder`; cancelar descarta a edição. A transação relê a etapa para evitar que dois dispositivos avancem o mesmo reparo sem perceber a atualização.

Em `src/components/DateField.tsx`, o DateTimePicker recebe `value`, `mode="date"`, `minimumDate` e `onChange`. Somente um evento confirmado altera a data no Android. A implementação `.web.tsx` é escolhida automaticamente pelo Metro no navegador.

Em `src/utils/domain.ts`, o dinheiro é convertido para centavos inteiros antes da soma; strings monetárias inválidas são rejeitadas, em vez de convertidas silenciosamente para zero.

## Decisões para manter o projeto viável

- Cada conta mantém seus próprios dados; não há administração de equipes ou portal do cliente nesta entrega.
- Cliente e veículo são cadastrados junto à ordem e consultados por uma lista agrupada.
- O orçamento é simples: mão de obra + materiais. O financeiro registra pagamentos separadamente.
- O fluxo de reparo tem seis etapas fixas. Cada avanço produz uma observação datada no histórico.
- Fotos e notas ficam no Storage; Firestore recebe somente metadados.
- Não há exclusão de documentos de negócio nesta versão, evitando remover histórico ou referências acidentalmente.

## Critérios de avaliação manual no celular

- Abrir os calendários no Android/iOS, confirmar e cancelar a seleção.
- Verificar a legibilidade dos campos com teclado aberto e fonte ampliada.
- Cancelar a seleção de foto/documento e confirmar que nenhum registro é salvo.
- Testar login incorreto e ausência de conexão, observando o feedback do SDK.
- Fechar e reabrir o app para confirmar persistência da autenticação.
- Conferir as datas salvas e a lista de documentos no console do Firestore.

Os testes automatizados e a geração dos bundles não substituem a execução em dispositivo físico; registre essa validação antes da apresentação.

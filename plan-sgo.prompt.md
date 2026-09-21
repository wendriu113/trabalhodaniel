## Prompt final para gerar o app SGO

Quero que você atue como um desenvolvedor especialista em React Native com Expo e crie um aplicativo mobile completo para um trabalho acadêmico.

### Contexto do projeto
O tema do app deve ser **SGO - Sistema de Gestão para Oficina de Chapeamento e Pintura**. O aplicativo precisa resolver o problema de organização de uma oficina, permitindo controlar clientes, veículos, ordens de serviço, andamento do reparo, fotos, notas fiscais e informações financeiras básicas.

### Objetivo do trabalho
Desenvolver um aplicativo mobile que integre os conteúdos da disciplina usando:
- React Native com Expo;
- Firebase Authentication;
- Cloud Firestore;
- navegação entre telas;
- componentes estudados ao longo do curso.

### Requisitos obrigatórios
Crie a solução respeitando todos os itens abaixo:
1. Tema livre, mas neste caso use obrigatoriamente o tema SGO. Não use o tema "Tarefa".
2. Autenticação com Firebase com criação de conta, login e logout.
3. Uso do Firestore para salvar dados. O usuário deve conseguir adicionar novos registros.
4. Cada registro salvo no Firestore deve ter pelo menos 3 informações, sendo uma delas uma data ou hora escolhida pelo usuário.
5. O app deve ter as telas Login, Cadastro, Home e pelo menos mais uma tela adicional ligada ao tema.
6. O app deve usar navegação do tipo Stack, Drawer ou Bottom Tabs. Se fizer sentido, pode combinar mais de uma.
7. O app deve ter pelo menos um Modal funcional, com utilidade real dentro do sistema.
8. O app deve usar DateTimePicker para selecionar uma data ou hora relacionada ao tema.
9. A interface precisa ser organizada, com títulos, campos identificados, botões claros, boa disposição visual e mensagens de feedback quando necessário.

### Funcionalidades esperadas
Crie um app simples, funcional e bem organizado, com foco em praticidade. Sugestão de fluxo:
- tela de login para acesso do usuário;
- tela de cadastro de usuário;
- home com visão geral do sistema;
- tela para cadastrar ou consultar ordens de serviço;
- tela adicional relacionada ao tema, como veículos, orçamento, andamento do reparo ou financeiro;
- lista de registros vindos do Firestore;
- formulário com campos de texto, seleção de data/hora e salvamento no banco;
- modal para confirmar ação, exibir detalhes ou cadastrar informação complementar;
- opção de sair da conta.

### Estrutura técnica desejada
Use uma arquitetura limpa e fácil de entender. Se possível, entregue:
- organização de pastas sugerida;
- telas separadas por responsabilidade;
- componentes reutilizáveis;
- configuração do Firebase;
- navegação entre telas;
- integração com Firestore;
- tratamento de loading, erro e validação de formulários.

### Regras de implementação
Quero que você priorize uma solução eficiente, sem excesso de complexidade. Evite recursos desnecessários e foque no que cumpre os requisitos da disciplina com clareza. O app deve parecer um projeto acadêmico bem feito, mas viável de concluir.

### O que quero na resposta
Entregue:
1. uma proposta de estrutura do projeto;
2. a lista de telas;
3. os componentes principais;
4. a navegação escolhida;
5. a modelagem dos dados no Firestore;
6. a lógica do Modal e do DateTimePicker;
7. os principais trechos de código ou um passo a passo de implementação.

### Observação final
Antes de montar o projeto, considere que o tema da oficina precisa transmitir organização, controle e acompanhamento do reparo. O resultado deve ficar claro, funcional e com boa apresentação visual.

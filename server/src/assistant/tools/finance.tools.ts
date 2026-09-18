import {
  SECURO_ACCOUNT_TYPES,
  SECURO_ASSET_TRADE_KINDS,
  SECURO_ASSET_TYPES,
  SECURO_GOAL_STATUSES,
  SECURO_RECURRENCE_FREQUENCIES,
  SECURO_RULE_ACTION_OPS,
  SECURO_RULE_CONDITIONS_OPS,
  SECURO_RULE_FIELDS,
  SECURO_RULE_OPS,
  SECURO_TRANSACTION_TYPES,
} from '../../finance/core/constants/securo-vocab.constant';
import {
  AssistantTool,
  booleanField,
  colorField,
  currencyField,
  dateField,
  enumField,
  integerField,
  moneyField,
  numberField,
  stringField,
  uuidField,
} from './tool.types';

const FINANCE_PATH = '/finance-m2m/:profileId/execute';

const typeField = (description: string, required = true) =>
  enumField('type', SECURO_TRANSACTION_TYPES, description, required);

export const ACCOUNTS_TOOL: AssistantTool = {
  name: 'accounts',
  description:
    'Contas do usuário: carteira, conta bancária, cartão de crédito, poupança e conta de investimento.',
  whenToUse:
    'Quando o usuário quiser ver ou cadastrar contas, ou quando uma operação de outra ferramenta precisar de um accountId.',
  path: FINANCE_PATH,
  operations: [
    {
      name: 'list_accounts',
      whenToUse: 'Ver as contas do usuário ou descobrir um accountId.',
      fields: [],
      example: {},
    },
    {
      name: 'create_account',
      whenToUse: 'O usuário quer cadastrar uma nova conta ou cartão.',
      fields: [
        stringField('name', 'Nome da conta, ex. "Nubank".'),
        enumField('type', SECURO_ACCOUNT_TYPES, 'Tipo da conta.'),
        moneyField('balance', 'Saldo inicial.', false),
        currencyField(),
      ],
      example: { name: 'Nubank', type: 'checking', balance: 1500 },
    },
  ],
};

export const TRANSACTIONS_TOOL: AssistantTool = {
  name: 'transactions',
  description:
    'Gastos e receitas do usuário: registrar, consultar totais e extratos, corrigir e excluir lançamentos.',
  whenToUse:
    'Quando o usuário relatar um gasto ou uma entrada, perguntar "quanto gastei", pedir um extrato ou quiser corrigir ou apagar um lançamento.',
  path: FINANCE_PATH,
  operations: [
    {
      name: 'create_transaction',
      whenToUse:
        'O usuário relata um gasto ("gastei 50 no mercado", "paguei 120 de luz") ou uma entrada ("recebi 300 do freela").',
      fields: [
        stringField('description', 'Descrição curta, ex. "Mercado".'),
        moneyField('amount', 'Valor, sempre positivo.'),
        typeField('"debit" para saída/gasto ou "credit" para entrada/receita.'),
        dateField(
          'date',
          'Data da transação. Hoje quando o usuário não disser.',
        ),
        uuidField(
          'accountId',
          'Conta usada. Sem informar, usa a carteira padrão.',
          false,
        ),
        uuidField(
          'categoryId',
          'Categoria, obtida em list_categories da ferramenta categories.',
          false,
        ),
        stringField('notes', 'Observações.', false),
      ],
      example: {
        description: 'Mercado',
        amount: 50,
        type: 'debit',
        date: '2026-09-10',
      },
    },
    {
      name: 'list_transactions',
      whenToUse:
        'Responder "quanto gastei", "quais foram meus gastos com X", extratos por período, e localizar uma transação para editar ou excluir.',
      fields: [
        dateField('from', 'Início do período.', false),
        dateField('to', 'Fim do período.', false),
        typeField('Filtrar por "debit" ou "credit".', false),
        uuidField('accountId', 'Filtrar por conta.', false),
        uuidField('categoryId', 'Filtrar por categoria.', false),
        stringField('q', 'Busca textual na descrição.', false),
        integerField('page', 'Página, a partir de 1.', false),
        integerField('limit', 'Itens por página, de 1 a 500.', false),
      ],
      example: { from: '2026-09-01', to: '2026-09-30', type: 'debit' },
      notes:
        'A resposta traz items e um summary com income, expense e net do período filtrado. Use o summary para totais.',
    },
    {
      name: 'update_transaction',
      whenToUse:
        'Corrigir valor, descrição, data, tipo ou categoria de uma transação.',
      fields: [
        uuidField('transactionId', 'Id da transação (de list_transactions).'),
        stringField('description', 'Nova descrição.', false),
        moneyField('amount', 'Novo valor.', false),
        typeField('Novo tipo.', false),
        dateField('date', 'Nova data.', false),
        uuidField('accountId', 'Nova conta.', false),
        uuidField('categoryId', 'Nova categoria.', false),
        stringField('notes', 'Novas observações.', false),
      ],
      example: {
        transactionId: 'c0a8012e-1111-4b2c-8d3e-4f5a6b7c8d9e',
        amount: 55,
      },
    },
    {
      name: 'delete_transaction',
      whenToUse: 'Excluir uma transação lançada por engano.',
      fields: [
        uuidField('transactionId', 'Id da transação (de list_transactions).'),
      ],
      example: { transactionId: 'c0a8012e-1111-4b2c-8d3e-4f5a6b7c8d9e' },
    },
  ],
};

export const CATEGORIES_TOOL: AssistantTool = {
  name: 'categories',
  description: 'Categorias de gastos e receitas (Mercado, Transporte, Pets).',
  whenToUse:
    'Quando precisar de um categoryId para categorizar algo ou quando o usuário quiser ver, criar, renomear ou excluir categorias.',
  path: FINANCE_PATH,
  operations: [
    {
      name: 'list_categories',
      whenToUse:
        'Descobrir as categorias existentes e seus ids antes de categorizar algo.',
      fields: [],
      example: {},
    },
    {
      name: 'create_category',
      whenToUse: 'O usuário quer uma categoria nova.',
      fields: [
        stringField('name', 'Nome, até 100 caracteres.'),
        stringField('icon', 'Ícone.', false),
        colorField(),
      ],
      example: { name: 'Pets', color: '#FF8800' },
    },
    {
      name: 'update_category',
      whenToUse: 'Renomear ou alterar ícone ou cor de uma categoria.',
      fields: [
        uuidField('categoryId', 'Id da categoria (de list_categories).'),
        stringField('name', 'Novo nome.', false),
        stringField('icon', 'Novo ícone.', false),
        colorField(),
      ],
      example: {
        categoryId: '9d1f2e3a-2222-4c3d-9e4f-5a6b7c8d9e0f',
        name: 'Animais',
      },
    },
    {
      name: 'delete_category',
      whenToUse: 'Excluir uma categoria.',
      fields: [
        uuidField('categoryId', 'Id da categoria (de list_categories).'),
      ],
      example: { categoryId: '9d1f2e3a-2222-4c3d-9e4f-5a6b7c8d9e0f' },
    },
  ],
};

export const RULES_TOOL: AssistantTool = {
  name: 'rules',
  description:
    'Regras automáticas: transações que batem com um padrão recebem categoria, favorecido ou nota automaticamente.',
  whenToUse:
    'Quando o usuário pedir automação do tipo "tudo que tiver Uber vai pra Transporte", ou quiser ver, alterar ou excluir regras.',
  path: FINANCE_PATH,
  operations: [
    {
      name: 'list_rules',
      whenToUse: 'Ver as regras automáticas e seus ids.',
      fields: [],
      example: {},
    },
    {
      name: 'create_rule',
      whenToUse:
        'O usuário quer que transações com um padrão recebam automaticamente uma categoria ou nota.',
      fields: [
        stringField('name', 'Nome da regra.'),
        {
          name: 'conditions',
          type: 'array',
          required: true,
          description: `Condições { field, op, value }. field: ${SECURO_RULE_FIELDS.map((v) => `"${v}"`).join(', ')}. op: ${SECURO_RULE_OPS.map((v) => `"${v}"`).join(', ')}.`,
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', enum: [...SECURO_RULE_FIELDS] },
              op: { type: 'string', enum: [...SECURO_RULE_OPS] },
              value: {},
            },
            required: ['field', 'op', 'value'],
          },
        },
        {
          name: 'actions',
          type: 'array',
          required: true,
          description:
            'Ações { op, value }. op: "set_category" (value = categoryId), "set_payee" (value = payeeId), "append_notes" (value = texto) ou "ignore" (sem value).',
          items: {
            type: 'object',
            properties: {
              op: { type: 'string', enum: [...SECURO_RULE_ACTION_OPS] },
              value: {},
            },
            required: ['op'],
          },
        },
        enumField(
          'conditionsOp',
          SECURO_RULE_CONDITIONS_OPS,
          'Como combinar as condições. Padrão "and".',
          false,
        ),
        booleanField(
          'applyToExisting',
          'Aplicar também às transações já existentes.',
          false,
        ),
      ],
      example: {
        name: 'Uber é transporte',
        conditions: [{ field: 'description', op: 'contains', value: 'uber' }],
        actions: [
          { op: 'set_category', value: '9d1f2e3a-2222-4c3d-9e4f-5a6b7c8d9e0f' },
        ],
        applyToExisting: true,
      },
    },
    {
      name: 'update_rule',
      whenToUse: 'Alterar, priorizar ou desativar uma regra existente.',
      fields: [
        uuidField('ruleId', 'Id da regra (de list_rules).'),
        stringField('name', 'Novo nome.', false),
        {
          name: 'conditions',
          type: 'array',
          required: false,
          description: 'Novas condições, no mesmo formato de create_rule.',
          items: { type: 'object' },
        },
        {
          name: 'actions',
          type: 'array',
          required: false,
          description: 'Novas ações, no mesmo formato de create_rule.',
          items: { type: 'object' },
        },
        enumField(
          'conditionsOp',
          SECURO_RULE_CONDITIONS_OPS,
          'Como combinar as condições.',
          false,
        ),
        integerField('priority', 'Prioridade da regra.', false),
        booleanField('isActive', 'Ativa ou desativa a regra.', false),
      ],
      example: {
        ruleId: '7b6a5c4d-3333-4e2f-8a1b-0c9d8e7f6a5b',
        isActive: false,
      },
    },
    {
      name: 'delete_rule',
      whenToUse: 'Excluir uma regra.',
      fields: [uuidField('ruleId', 'Id da regra (de list_rules).')],
      example: { ruleId: '7b6a5c4d-3333-4e2f-8a1b-0c9d8e7f6a5b' },
    },
  ],
};

export const GOALS_TOOL: AssistantTool = {
  name: 'goals',
  description: 'Metas de economia e seu progresso.',
  whenToUse:
    'Quando o usuário quiser juntar dinheiro para algo, registrar um aporte, ou ver, alterar, pausar, concluir ou excluir metas.',
  path: FINANCE_PATH,
  operations: [
    {
      name: 'list_goals',
      whenToUse: 'Ver metas e seu progresso, e obter o goalId.',
      fields: [
        enumField(
          'status',
          SECURO_GOAL_STATUSES,
          'Filtrar por situação.',
          false,
        ),
      ],
      example: { status: 'active' },
    },
    {
      name: 'create_goal',
      whenToUse:
        'O usuário quer juntar dinheiro para algo ("quero guardar 5 mil até dezembro").',
      fields: [
        stringField('name', 'Nome da meta.'),
        moneyField('targetAmount', 'Valor alvo.'),
        numberField(
          'currentAmount',
          'Quanto já tem guardado (0 ou positivo, até 2 casas).',
          false,
        ),
        dateField('targetDate', 'Data alvo.', false),
        currencyField(),
        stringField('icon', 'Ícone.', false),
        colorField(),
      ],
      example: { name: 'Viagem', targetAmount: 5000, targetDate: '2026-12-20' },
    },
    {
      name: 'update_goal',
      whenToUse:
        'Registrar progresso ("guardei mais 300 pra viagem") ou alterar, pausar ou concluir uma meta.',
      fields: [
        uuidField('goalId', 'Id da meta (de list_goals).'),
        stringField('name', 'Novo nome.', false),
        moneyField('targetAmount', 'Novo valor alvo.', false),
        numberField(
          'currentAmount',
          'Novo total guardado (0 ou positivo). Para um aporte, some ao currentAmount atual obtido em list_goals.',
          false,
        ),
        dateField('targetDate', 'Nova data alvo.', false),
        enumField('status', SECURO_GOAL_STATUSES, 'Nova situação.', false),
      ],
      example: {
        goalId: '1e2d3c4b-4444-4a5f-9b6c-7d8e9f0a1b2c',
        currentAmount: 1300,
      },
    },
    {
      name: 'delete_goal',
      whenToUse: 'Excluir uma meta.',
      fields: [uuidField('goalId', 'Id da meta (de list_goals).')],
      example: { goalId: '1e2d3c4b-4444-4a5f-9b6c-7d8e9f0a1b2c' },
    },
  ],
};

export const RECURRING_TRANSACTIONS_TOOL: AssistantTool = {
  name: 'recurring_transactions',
  description:
    'Salário, assinaturas e contas fixas: o sistema lança a transação automaticamente quando vence.',
  whenToUse:
    'Quando o usuário falar de salário, assinatura, conta fixa ou qualquer valor que se repete ("recebo 4 mil todo dia 5", "pago 40 de Netflix por mês").',
  path: FINANCE_PATH,
  operations: [
    {
      name: 'list_recurring_transactions',
      whenToUse: 'Ver as recorrências cadastradas e seus ids.',
      fields: [],
      example: {},
    },
    {
      name: 'create_recurring_transaction',
      whenToUse: 'Cadastrar salário, assinatura ou conta fixa.',
      fields: [
        stringField('description', 'Descrição, ex. "Salário".'),
        moneyField('amount', 'Valor.'),
        typeField(
          '"credit" para salário/entradas, "debit" para contas/assinaturas.',
        ),
        enumField('frequency', SECURO_RECURRENCE_FREQUENCIES, 'Frequência.'),
        dateField('startDate', 'Primeira ocorrência.'),
        integerField(
          'dayOfMonth',
          'Dia do mês (1 a 31) para recorrências mensais.',
          false,
        ),
        dateField('endDate', 'Última ocorrência.', false),
        uuidField('accountId', 'Conta. Sem informar, usa a padrão.', false),
        uuidField('categoryId', 'Categoria.', false),
        currencyField(),
      ],
      example: {
        description: 'Salário',
        amount: 4000,
        type: 'credit',
        frequency: 'monthly',
        startDate: '2026-10-05',
        dayOfMonth: 5,
      },
    },
    {
      name: 'update_recurring_transaction',
      whenToUse: 'Alterar valor, frequência ou desativar uma recorrência.',
      fields: [
        uuidField(
          'recurringTransactionId',
          'Id da recorrência (de list_recurring_transactions).',
        ),
        stringField('description', 'Nova descrição.', false),
        moneyField('amount', 'Novo valor.', false),
        enumField(
          'frequency',
          SECURO_RECURRENCE_FREQUENCIES,
          'Nova frequência.',
          false,
        ),
        integerField('dayOfMonth', 'Novo dia do mês (1 a 31).', false),
        dateField('endDate', 'Nova última ocorrência.', false),
        uuidField('categoryId', 'Nova categoria.', false),
        booleanField('isActive', 'Ativa ou desativa a recorrência.', false),
      ],
      example: {
        recurringTransactionId: 'a1b2c3d4-5555-4e6f-8a7b-9c0d1e2f3a4b',
        amount: 4500,
      },
    },
    {
      name: 'delete_recurring_transaction',
      whenToUse: 'Excluir uma recorrência.',
      fields: [
        uuidField(
          'recurringTransactionId',
          'Id da recorrência (de list_recurring_transactions).',
        ),
      ],
      example: {
        recurringTransactionId: 'a1b2c3d4-5555-4e6f-8a7b-9c0d1e2f3a4b',
      },
    },
  ],
};

export const ASSETS_TOOL: AssistantTool = {
  name: 'assets',
  description:
    'Investimentos e bens: ações, ETFs, cripto, fundos, imóveis, veículos; valores atualizados e compras/vendas.',
  whenToUse:
    'Quando o usuário falar de investimentos, patrimônio, compra ou venda de ativos, ou quiser atualizar o valor de um bem.',
  path: FINANCE_PATH,
  operations: [
    {
      name: 'list_assets',
      whenToUse: 'Ver investimentos e bens cadastrados e seus ids.',
      fields: [],
      example: {},
    },
    {
      name: 'create_asset',
      whenToUse: 'Cadastrar um investimento ou bem.',
      fields: [
        stringField('name', 'Nome do ativo.'),
        enumField('type', SECURO_ASSET_TYPES, 'Tipo do ativo.'),
        moneyField('currentValue', 'Valor atual total.', false),
        dateField('purchaseDate', 'Data da compra.', false),
        numberField('purchasePrice', 'Preço de compra.', false),
        stringField('ticker', 'Ticker, ex. "PETR4".', false),
        numberField('units', 'Quantidade de unidades.', false),
        currencyField(),
      ],
      example: {
        name: 'PETR4',
        type: 'stock',
        ticker: 'PETR4',
        units: 100,
        currentValue: 3800,
      },
    },
    {
      name: 'add_asset_value',
      whenToUse: 'Registrar o valor atualizado de um ativo em uma data.',
      fields: [
        uuidField('assetId', 'Id do ativo (de list_assets).'),
        numberField(
          'amount',
          'Valor total do ativo naquela data (0 ou positivo, até 2 casas).',
        ),
        dateField('date', 'Data da avaliação.'),
      ],
      example: {
        assetId: 'f0e1d2c3-6666-4b5a-9c8d-7e6f5a4b3c2d',
        amount: 3950,
        date: '2026-09-10',
      },
    },
    {
      name: 'list_asset_trades',
      whenToUse: 'Ver compras e vendas de um ativo.',
      fields: [uuidField('assetId', 'Id do ativo (de list_assets).')],
      example: { assetId: 'f0e1d2c3-6666-4b5a-9c8d-7e6f5a4b3c2d' },
    },
    {
      name: 'record_asset_trade',
      whenToUse:
        'Registrar compra ou venda de um ativo (recalcula preço médio e resultado).',
      fields: [
        uuidField('assetId', 'Id do ativo (de list_assets).'),
        enumField('kind', SECURO_ASSET_TRADE_KINDS, '"buy" ou "sell".'),
        numberField('quantity', 'Quantidade negociada, positiva.'),
        numberField('price', 'Preço unitário.'),
        dateField('date', 'Data da negociação.'),
        numberField('fee', 'Taxas.', false),
        stringField('notes', 'Observações.', false),
      ],
      example: {
        assetId: 'f0e1d2c3-6666-4b5a-9c8d-7e6f5a4b3c2d',
        kind: 'buy',
        quantity: 10,
        price: 38.5,
        date: '2026-09-10',
      },
    },
    {
      name: 'delete_asset',
      whenToUse: 'Excluir um ativo.',
      fields: [uuidField('assetId', 'Id do ativo (de list_assets).')],
      example: { assetId: 'f0e1d2c3-6666-4b5a-9c8d-7e6f5a4b3c2d' },
    },
  ],
};

export const FINANCE_TOOLS: AssistantTool[] = [
  ACCOUNTS_TOOL,
  TRANSACTIONS_TOOL,
  CATEGORIES_TOOL,
  RULES_TOOL,
  GOALS_TOOL,
  RECURRING_TRANSACTIONS_TOOL,
  ASSETS_TOOL,
];

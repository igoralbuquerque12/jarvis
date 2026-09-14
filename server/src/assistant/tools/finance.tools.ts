import { AssistantTool, AssistantToolOperation } from './events.tools';

const ISO_DATE = 'string "YYYY-MM-DD"';
const MONEY = 'number positivo com até 2 casas decimais';

const accountOperations: AssistantToolOperation[] = [
  {
    name: 'list_accounts',
    whenToUse:
      'Ver as contas do usuário (carteira, conta bancária, cartão, investimento) ou descobrir um accountId.',
    params: ['Sem parâmetros.'],
    example: {},
  },
  {
    name: 'create_account',
    whenToUse: 'O usuário quer cadastrar uma nova conta ou cartão.',
    params: [
      'name (string, obrigatório): nome da conta, ex. "Nubank".',
      'type (string, obrigatório): "checking", "savings", "credit_card", "investment" ou "wallet".',
      `balance (${MONEY}, opcional): saldo inicial.`,
      'currency (string de 3 letras, opcional): padrão "BRL".',
    ],
    example: { name: 'Nubank', type: 'checking', balance: 1500 },
  },
];

const transactionOperations: AssistantToolOperation[] = [
  {
    name: 'create_transaction',
    whenToUse:
      'O usuário relata um gasto ("gastei 50 no mercado", "paguei 120 de luz") ou uma entrada ("recebi 300 do freela").',
    params: [
      'description (string, obrigatório): descrição curta, ex. "Mercado".',
      `amount (${MONEY}, obrigatório): sempre positivo.`,
      'type (string, obrigatório): "debit" para saída/gasto ou "credit" para entrada/receita.',
      `date (${ISO_DATE}, obrigatório): data da transação; hoje quando o usuário não disser.`,
      'accountId (uuid, opcional): conta usada; sem informar, usa a carteira padrão.',
      'categoryId (uuid, opcional): categoria; obtenha em list_categories quando fizer sentido.',
      'notes (string, opcional): observações.',
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
      'Responder "quanto gastei", "quais foram meus gastos com X", extratos por período e localizar uma transação para editar ou excluir.',
    params: [
      `from (${ISO_DATE}, opcional): início do período.`,
      `to (${ISO_DATE}, opcional): fim do período.`,
      'type (string, opcional): "debit" ou "credit".',
      'accountId (uuid, opcional), categoryId (uuid, opcional).',
      'q (string, opcional): busca textual na descrição.',
      'page (number, opcional), limit (number de 1 a 500, opcional).',
    ],
    example: { from: '2026-09-01', to: '2026-09-30', type: 'debit' },
    notes:
      'A resposta traz items e um summary com income, expense e net do período filtrado. Use o summary para totais.',
  },
  {
    name: 'update_transaction',
    whenToUse:
      'Corrigir valor, descrição, data, tipo ou categoria de uma transação.',
    params: [
      'transactionId (uuid, obrigatório).',
      `Opcionais: description (string), amount (${MONEY}), type ("debit"|"credit"), date (${ISO_DATE}), accountId (uuid), categoryId (uuid), notes (string).`,
    ],
    example: {
      transactionId: 'c0a8012e-1111-4b2c-8d3e-4f5a6b7c8d9e',
      amount: 55,
    },
  },
  {
    name: 'delete_transaction',
    whenToUse:
      'Excluir uma transação lançada por engano. Confirme com o usuário antes.',
    params: ['transactionId (uuid, obrigatório).'],
    example: { transactionId: 'c0a8012e-1111-4b2c-8d3e-4f5a6b7c8d9e' },
  },
];

const categoryOperations: AssistantToolOperation[] = [
  {
    name: 'list_categories',
    whenToUse:
      'Descobrir as categorias existentes e seus ids antes de categorizar algo.',
    params: ['Sem parâmetros.'],
    example: {},
  },
  {
    name: 'create_category',
    whenToUse: 'O usuário quer uma categoria nova.',
    params: [
      'name (string, obrigatório, até 100 caracteres).',
      'icon (string, opcional).',
      'color (string, opcional): hexadecimal "#RRGGBB".',
    ],
    example: { name: 'Pets', color: '#FF8800' },
  },
  {
    name: 'update_category',
    whenToUse: 'Renomear ou alterar ícone/cor de uma categoria.',
    params: [
      'categoryId (uuid, obrigatório).',
      'Opcionais: name (string), icon (string), color ("#RRGGBB").',
    ],
    example: {
      categoryId: '9d1f2e3a-2222-4c3d-9e4f-5a6b7c8d9e0f',
      name: 'Animais',
    },
  },
  {
    name: 'delete_category',
    whenToUse: 'Excluir uma categoria. Confirme com o usuário antes.',
    params: ['categoryId (uuid, obrigatório).'],
    example: { categoryId: '9d1f2e3a-2222-4c3d-9e4f-5a6b7c8d9e0f' },
  },
];

const ruleOperations: AssistantToolOperation[] = [
  {
    name: 'list_rules',
    whenToUse: 'Ver as regras automáticas de categorização.',
    params: ['Sem parâmetros.'],
    example: {},
  },
  {
    name: 'create_rule',
    whenToUse:
      'O usuário quer que transações que batem com um padrão recebam automaticamente uma categoria ou nota ("tudo que tiver Uber vai pra Transporte").',
    params: [
      'name (string, obrigatório).',
      'conditions (array, obrigatório): itens { field, op, value }. field: "description", "notes", "amount", "type", "account_id", "payee_id" ou "date". op: "contains", "not_contains", "equals", "not_equals", "starts_with", "ends_with", "regex", "gt", "gte", "lt" ou "lte".',
      'actions (array, obrigatório): itens { op, value }. op: "set_category" (value = categoryId), "set_payee" (value = payeeId), "append_notes" (value = texto) ou "ignore" (sem value).',
      'conditionsOp (string, opcional): "and" (padrão) ou "or".',
      'applyToExisting (boolean, opcional): aplicar às transações já existentes.',
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
    whenToUse: 'Alterar uma regra existente.',
    params: [
      'ruleId (uuid, obrigatório).',
      'Opcionais: name, conditions, actions, conditionsOp, priority (number), isActive (boolean).',
    ],
    example: {
      ruleId: '7b6a5c4d-3333-4e2f-8a1b-0c9d8e7f6a5b',
      isActive: false,
    },
  },
  {
    name: 'delete_rule',
    whenToUse: 'Excluir uma regra. Confirme com o usuário antes.',
    params: ['ruleId (uuid, obrigatório).'],
    example: { ruleId: '7b6a5c4d-3333-4e2f-8a1b-0c9d8e7f6a5b' },
  },
];

const goalOperations: AssistantToolOperation[] = [
  {
    name: 'list_goals',
    whenToUse: 'Ver metas de economia e seu progresso.',
    params: [
      'status (string, opcional): "active", "completed", "paused" ou "archived".',
    ],
    example: { status: 'active' },
  },
  {
    name: 'create_goal',
    whenToUse:
      'O usuário quer juntar dinheiro para algo ("quero guardar 5 mil até dezembro").',
    params: [
      'name (string, obrigatório).',
      `targetAmount (${MONEY}, obrigatório).`,
      `currentAmount (${MONEY} ou 0, opcional): quanto já tem guardado.`,
      `targetDate (${ISO_DATE}, opcional).`,
      'currency (3 letras, opcional), icon (string, opcional), color ("#RRGGBB", opcional).',
    ],
    example: { name: 'Viagem', targetAmount: 5000, targetDate: '2026-12-20' },
  },
  {
    name: 'update_goal',
    whenToUse:
      'Registrar progresso ("guardei mais 300 pra viagem": some ao currentAmount atual) ou alterar, pausar ou concluir uma meta.',
    params: [
      'goalId (uuid, obrigatório).',
      `Opcionais: name, targetAmount (${MONEY}), currentAmount (${MONEY} ou 0), targetDate (${ISO_DATE}), status ("active"|"completed"|"paused"|"archived").`,
    ],
    example: {
      goalId: '1e2d3c4b-4444-4a5f-9b6c-7d8e9f0a1b2c',
      currentAmount: 1300,
    },
    notes:
      'Para somar um aporte, consulte list_goals antes para saber o currentAmount atual.',
  },
  {
    name: 'delete_goal',
    whenToUse: 'Excluir uma meta. Confirme com o usuário antes.',
    params: ['goalId (uuid, obrigatório).'],
    example: { goalId: '1e2d3c4b-4444-4a5f-9b6c-7d8e9f0a1b2c' },
  },
];

const recurringOperations: AssistantToolOperation[] = [
  {
    name: 'list_recurring_transactions',
    whenToUse:
      'Ver salário, assinaturas e outras transações recorrentes cadastradas.',
    params: ['Sem parâmetros.'],
    example: {},
  },
  {
    name: 'create_recurring_transaction',
    whenToUse:
      'Cadastrar salário ("recebo 4 mil todo dia 5"), assinaturas ou contas fixas. O sistema lança a transação automaticamente quando vence.',
    params: [
      'description (string, obrigatório).',
      `amount (${MONEY}, obrigatório).`,
      'type (string, obrigatório): "credit" para salário/entradas, "debit" para contas/assinaturas.',
      'frequency (string, obrigatório): "weekly", "monthly", "quarterly" ou "yearly".',
      `startDate (${ISO_DATE}, obrigatório): primeira ocorrência.`,
      'dayOfMonth (number de 1 a 31, opcional): dia do mês para recorrências mensais.',
      `endDate (${ISO_DATE}, opcional).`,
      'accountId (uuid, opcional), categoryId (uuid, opcional), currency (3 letras, opcional).',
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
    params: [
      'recurringTransactionId (uuid, obrigatório).',
      `Opcionais: description, amount (${MONEY}), frequency, dayOfMonth, endDate (${ISO_DATE}), categoryId, isActive (boolean).`,
    ],
    example: {
      recurringTransactionId: 'a1b2c3d4-5555-4e6f-8a7b-9c0d1e2f3a4b',
      amount: 4500,
    },
  },
  {
    name: 'delete_recurring_transaction',
    whenToUse: 'Excluir uma recorrência. Confirme com o usuário antes.',
    params: ['recurringTransactionId (uuid, obrigatório).'],
    example: {
      recurringTransactionId: 'a1b2c3d4-5555-4e6f-8a7b-9c0d1e2f3a4b',
    },
  },
];

const assetOperations: AssistantToolOperation[] = [
  {
    name: 'list_assets',
    whenToUse: 'Ver investimentos e bens cadastrados e seus ids.',
    params: ['Sem parâmetros.'],
    example: {},
  },
  {
    name: 'create_asset',
    whenToUse:
      'Cadastrar um investimento ou bem (ação, ETF, cripto, fundo, imóvel, veículo).',
    params: [
      'name (string, obrigatório).',
      'type (string, obrigatório): "stock", "etf", "crypto", "fund", "real_estate", "vehicle", "valuable", "investment" ou "other".',
      `currentValue (${MONEY}, opcional): valor atual total.`,
      `purchaseDate (${ISO_DATE}, opcional), purchasePrice (number, opcional), ticker (string, opcional), units (number, opcional), currency (3 letras, opcional).`,
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
    params: [
      'assetId (uuid, obrigatório).',
      `amount (${MONEY} ou 0, obrigatório): valor total do ativo naquela data.`,
      `date (${ISO_DATE}, obrigatório).`,
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
    params: ['assetId (uuid, obrigatório).'],
    example: { assetId: 'f0e1d2c3-6666-4b5a-9c8d-7e6f5a4b3c2d' },
  },
  {
    name: 'record_asset_trade',
    whenToUse:
      'Registrar compra ou venda de um ativo (recalcula preço médio e resultado).',
    params: [
      'assetId (uuid, obrigatório).',
      'kind (string, obrigatório): "buy" ou "sell".',
      'quantity (number positivo, obrigatório), price (number, obrigatório): preço unitário.',
      `date (${ISO_DATE}, obrigatório).`,
      'fee (number, opcional), notes (string, opcional).',
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
    whenToUse: 'Excluir um ativo. Confirme com o usuário antes.',
    params: ['assetId (uuid, obrigatório).'],
    example: { assetId: 'f0e1d2c3-6666-4b5a-9c8d-7e6f5a4b3c2d' },
  },
];

export const FINANCE_TOOL: AssistantTool = {
  module: 'finance',
  description:
    'Vida financeira do usuário: contas, transações (gastos e receitas), categorias, regras automáticas, metas de economia, transações recorrentes (salário, assinaturas) e investimentos.',
  endpoints: [
    {
      name: 'execute_finance_operation',
      method: 'POST',
      path: '/finance-m2m/:profileId/execute',
      whenToUse:
        'Sempre que o usuário falar de dinheiro: registrar ou consultar gastos e receitas, saldo, categorias, metas, salário, assinaturas ou investimentos.',
      request: {
        profileId: 'Obrigatório: vem do contexto, no parâmetro de rota.',
        operation: 'Obrigatório: nome exato da operação.',
        data: 'Objeto com os campos da operação; "{}" quando não houver parâmetros.',
      },
      response: 'Resultado da operação.',
      rpcToolName: 'finance',
      operations: [
        ...accountOperations,
        ...transactionOperations,
        ...categoryOperations,
        ...ruleOperations,
        ...goalOperations,
        ...recurringOperations,
        ...assetOperations,
      ],
    },
  ],
};

export const FINANCE_TOOLS: AssistantTool[] = [FINANCE_TOOL];

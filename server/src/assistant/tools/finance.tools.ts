import { AssistantTool } from './events.tools';

const PROFILE_ID_REQUEST =
  'Substitua :profileId no caminho pelo profileId recebido no contexto do workflow; não peça este valor ao usuário.';

export const FINANCE_ACCOUNTS_TOOL: AssistantTool = {
  module: 'finance-accounts',
  description:
    'Consulta e cria contas financeiras do perfil (carteira, conta corrente, poupança, cartão). Toda transação pertence a uma conta; o perfil já nasce com a conta padrão "Carteira".',
  endpoints: [
    {
      name: 'list_accounts',
      method: 'GET',
      path: '/finance-m2m/:profileId/accounts',
      whenToUse:
        'Use quando o usuário perguntar saldos ou quais contas possui, ou quando precisar de um accountId para outra operação.',
      request: {
        profileId: PROFILE_ID_REQUEST,
      },
      response:
        'Retorna a lista de contas com id, name, type, balance, currency e current_balance.',
    },
    {
      name: 'create_account',
      method: 'POST',
      path: '/finance-m2m/:profileId/accounts',
      whenToUse:
        'Use quando o usuário pedir para criar uma nova conta, como poupança ou cartão de crédito.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        name: 'Nome da conta, por exemplo "Nubank".',
        type: 'checking, savings, credit_card, investment ou wallet.',
        balance: 'Opcional: saldo inicial em número positivo.',
        currency: 'Opcional: código de 3 letras; padrão BRL.',
      },
      response: 'Retorna a conta criada com id, name, type e balance.',
    },
  ],
};

export const FINANCE_TRANSACTIONS_TOOL: AssistantTool = {
  module: 'finance-transactions',
  description:
    'Registra, consulta, edita e remove transações financeiras (gastos e ganhos) do perfil. Valores sempre positivos; a direção vem de type: debit é despesa e credit é receita.',
  endpoints: [
    {
      name: 'create_transaction',
      method: 'POST',
      path: '/finance-m2m/:profileId/transactions',
      whenToUse:
        'Use quando o usuário relatar um gasto ou um ganho, por exemplo "gastei 50 no mercado" ou "recebi 200 de um freela".',
      request: {
        profileId: PROFILE_ID_REQUEST,
        description: 'Descrição curta da transação, por exemplo "Mercado".',
        amount: 'Valor positivo com até 2 casas decimais.',
        type: 'debit para despesa, credit para receita.',
        date: 'Data no formato YYYY-MM-DD.',
        accountId:
          'Opcional: UUID da conta; sem informar usa a conta padrão Carteira.',
        categoryId:
          'Opcional: UUID de categoria vindo de list_categories. Sem categoria, as regras automáticas podem categorizar.',
        notes: 'Opcional: observações adicionais.',
      },
      response: 'Retorna a transação criada com id, amount, date e category.',
    },
    {
      name: 'list_transactions',
      method: 'GET',
      path: '/finance-m2m/:profileId/transactions',
      whenToUse:
        'Use quando o usuário perguntar sobre gastos, receitas ou extrato, por exemplo "quanto gastei esse mês".',
      request: {
        profileId: PROFILE_ID_REQUEST,
        from: 'Opcional: data inicial YYYY-MM-DD.',
        to: 'Opcional: data final YYYY-MM-DD.',
        type: 'Opcional: debit ou credit.',
        categoryId: 'Opcional: UUID de categoria para filtrar.',
        q: 'Opcional: busca por texto na descrição e notas.',
        limit: 'Opcional: máximo de itens por página (padrão 50).',
      },
      response:
        'Retorna { items, total, page, limit, summary }. O summary traz income, expense e net de todo o período filtrado — ideal para responder totais.',
    },
    {
      name: 'update_transaction',
      method: 'PATCH',
      path: '/finance-m2m/:profileId/transactions/:transactionId',
      whenToUse:
        'Use quando o usuário quiser corrigir valor, data, descrição ou categoria de uma transação existente.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        transactionId: 'UUID da transação obtido em list_transactions.',
        amount: 'Opcional: novo valor positivo.',
        description: 'Opcional: nova descrição.',
        date: 'Opcional: nova data YYYY-MM-DD.',
        type: 'Opcional: debit ou credit.',
        categoryId: 'Opcional: novo UUID de categoria.',
        notes: 'Opcional: novas observações.',
      },
      response: 'Retorna a transação atualizada.',
    },
    {
      name: 'delete_transaction',
      method: 'DELETE',
      path: '/finance-m2m/:profileId/transactions/:transactionId',
      whenToUse:
        'Use quando o usuário pedir para apagar uma transação registrada por engano.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        transactionId: 'UUID da transação que será removida.',
      },
      response: 'Retorna { deleted: true, transactionId }.',
    },
  ],
};

export const FINANCE_CATEGORIES_TOOL: AssistantTool = {
  module: 'finance-categories',
  description:
    'Gerencia as categorias de transações do perfil. O perfil já nasce com 16 categorias padrão em português (mercado, transporte, salário, lazer etc.); categorias do sistema não podem ser removidas.',
  endpoints: [
    {
      name: 'list_categories',
      method: 'GET',
      path: '/finance-m2m/:profileId/categories',
      whenToUse:
        'Use para descobrir o categoryId antes de criar ou filtrar transações, ou quando o usuário pedir suas categorias.',
      request: {
        profileId: PROFILE_ID_REQUEST,
      },
      response:
        'Retorna a lista de categorias com id, name, icon, color e is_system.',
    },
    {
      name: 'create_category',
      method: 'POST',
      path: '/finance-m2m/:profileId/categories',
      whenToUse:
        'Use quando o usuário pedir uma categoria nova que não existe na lista.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        name: 'Nome da categoria, por exemplo "Pets".',
        icon: 'Opcional: nome de ícone lucide, por exemplo "paw-print".',
        color: 'Opcional: cor hexadecimal no formato #RRGGBB.',
      },
      response: 'Retorna a categoria criada com id e name.',
    },
    {
      name: 'update_category',
      method: 'PATCH',
      path: '/finance-m2m/:profileId/categories/:categoryId',
      whenToUse:
        'Use quando o usuário quiser renomear ou mudar a cor ou o ícone de uma categoria.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        categoryId: 'UUID da categoria obtido em list_categories.',
        name: 'Opcional: novo nome.',
        icon: 'Opcional: novo ícone.',
        color: 'Opcional: nova cor #RRGGBB.',
      },
      response: 'Retorna a categoria atualizada.',
    },
    {
      name: 'delete_category',
      method: 'DELETE',
      path: '/finance-m2m/:profileId/categories/:categoryId',
      whenToUse:
        'Use quando o usuário pedir para remover uma categoria criada por ele. Categorias do sistema não podem ser removidas.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        categoryId: 'UUID da categoria que será removida.',
      },
      response: 'Retorna { deleted: true, categoryId }.',
    },
  ],
};

export const FINANCE_RULES_TOOL: AssistantTool = {
  module: 'finance-rules',
  description:
    'Gerencia regras de categorização automática: quando uma transação combina com as condições, as ações são aplicadas (por exemplo, definir categoria). Por padrão a regra nova também é aplicada às transações já existentes.',
  endpoints: [
    {
      name: 'list_rules',
      method: 'GET',
      path: '/finance-m2m/:profileId/rules',
      whenToUse:
        'Use quando o usuário perguntar quais regras automáticas existem.',
      request: {
        profileId: PROFILE_ID_REQUEST,
      },
      response:
        'Retorna a lista de regras com id, name, conditions, actions, priority e is_active.',
    },
    {
      name: 'create_rule',
      method: 'POST',
      path: '/finance-m2m/:profileId/rules',
      whenToUse:
        'Use quando o usuário pedir automação, por exemplo "tudo que tiver Uber vai para transporte".',
      request: {
        profileId: PROFILE_ID_REQUEST,
        name: 'Nome único da regra, por exemplo "Uber -> Transporte".',
        conditions:
          'Lista de { field, op, value }. field: description, notes, amount, type, account_id, payee_id ou date. op: contains, not_contains, equals, not_equals, starts_with, ends_with, regex, gt, gte, lt ou lte.',
        actions:
          'Lista de { op, value }. op: set_category (value = UUID da categoria), append_notes (value = texto) ou ignore (sem value, exclui a transação dos relatórios).',
        conditionsOp: 'Opcional: and (padrão) ou or.',
        applyToExisting:
          'Opcional: padrão true, aplica a regra às transações já existentes sem sobrescrever categorias manuais.',
      },
      response:
        'Retorna a regra criada e applied_count com o total de transações afetadas.',
    },
    {
      name: 'update_rule',
      method: 'PATCH',
      path: '/finance-m2m/:profileId/rules/:ruleId',
      whenToUse:
        'Use quando o usuário quiser ajustar, ativar ou desativar uma regra existente.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        ruleId: 'UUID da regra obtido em list_rules.',
        name: 'Opcional: novo nome.',
        conditions:
          'Opcional: novas condições no mesmo formato de create_rule.',
        actions: 'Opcional: novas ações no mesmo formato de create_rule.',
        isActive: 'Opcional: false desativa a regra sem removê-la.',
      },
      response: 'Retorna a regra atualizada.',
    },
    {
      name: 'delete_rule',
      method: 'DELETE',
      path: '/finance-m2m/:profileId/rules/:ruleId',
      whenToUse:
        'Use quando o usuário pedir para remover uma regra automática.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        ruleId: 'UUID da regra que será removida.',
      },
      response: 'Retorna { deleted: true, ruleId }.',
    },
  ],
};

export const FINANCE_GOALS_TOOL: AssistantTool = {
  module: 'finance-goals',
  description:
    'Gerencia metas de economia do perfil, com valor alvo, progresso e prazo. O progresso é manual: atualize currentAmount quando o usuário guardar dinheiro.',
  endpoints: [
    {
      name: 'list_goals',
      method: 'GET',
      path: '/finance-m2m/:profileId/goals',
      whenToUse:
        'Use quando o usuário perguntar sobre suas metas ou o progresso delas.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        status: 'Opcional: active, completed, paused ou archived.',
      },
      response:
        'Retorna a lista de metas com id, name, target_amount, current_amount, percentage, target_date e on_track.',
    },
    {
      name: 'create_goal',
      method: 'POST',
      path: '/finance-m2m/:profileId/goals',
      whenToUse:
        'Use quando o usuário definir um objetivo, por exemplo "quero juntar 5 mil até dezembro".',
      request: {
        profileId: PROFILE_ID_REQUEST,
        name: 'Nome da meta, por exemplo "Viagem".',
        targetAmount: 'Valor alvo positivo.',
        currentAmount: 'Opcional: quanto já foi guardado.',
        targetDate: 'Opcional: prazo no formato YYYY-MM-DD.',
        currency: 'Opcional: código de 3 letras; padrão BRL.',
      },
      response: 'Retorna a meta criada com id, percentage e on_track.',
    },
    {
      name: 'update_goal',
      method: 'PATCH',
      path: '/finance-m2m/:profileId/goals/:goalId',
      whenToUse:
        'Use quando o usuário guardar dinheiro para a meta (atualize currentAmount) ou quiser pausar, concluir ou ajustar a meta.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        goalId: 'UUID da meta obtido em list_goals.',
        currentAmount: 'Opcional: novo total acumulado.',
        targetAmount: 'Opcional: novo valor alvo.',
        targetDate: 'Opcional: novo prazo YYYY-MM-DD.',
        status: 'Opcional: active, completed, paused ou archived.',
      },
      response: 'Retorna a meta atualizada com o novo percentage.',
    },
    {
      name: 'delete_goal',
      method: 'DELETE',
      path: '/finance-m2m/:profileId/goals/:goalId',
      whenToUse: 'Use quando o usuário pedir para excluir uma meta.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        goalId: 'UUID da meta que será removida.',
      },
      response: 'Retorna { deleted: true, goalId }.',
    },
  ],
};

export const FINANCE_RECURRING_TOOL: AssistantTool = {
  module: 'finance-recurring',
  description:
    'Gerencia lançamentos recorrentes: salário e ganhos fixos (type credit) e contas fixas como aluguel e assinaturas (type debit). As transações reais são geradas automaticamente quando vencem.',
  endpoints: [
    {
      name: 'list_recurring_transactions',
      method: 'GET',
      path: '/finance-m2m/:profileId/recurring-transactions',
      whenToUse:
        'Use quando o usuário perguntar sobre salário cadastrado, contas fixas ou próximos vencimentos.',
      request: {
        profileId: PROFILE_ID_REQUEST,
      },
      response:
        'Retorna a lista de recorrências com id, description, amount, type, frequency, next_occurrence e is_active.',
    },
    {
      name: 'create_recurring_transaction',
      method: 'POST',
      path: '/finance-m2m/:profileId/recurring-transactions',
      whenToUse:
        'Use quando o usuário informar o salário ("recebo 3000 todo dia 5") ou uma conta fixa mensal.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        description: 'Descrição, por exemplo "Salário".',
        amount: 'Valor positivo.',
        type: 'credit para salário e ganhos, debit para contas fixas.',
        frequency: 'weekly, monthly, quarterly ou yearly.',
        startDate: 'Primeira ocorrência no formato YYYY-MM-DD.',
        dayOfMonth:
          'Opcional: dia do mês desejado para frequency monthly, por exemplo o dia do pagamento.',
        endDate: 'Opcional: última ocorrência YYYY-MM-DD.',
        categoryId:
          'Opcional: UUID de categoria; para salário existe a categoria padrão "Salário" em list_categories.',
      },
      response:
        'Retorna a recorrência criada com id e next_occurrence (próxima geração automática).',
    },
    {
      name: 'update_recurring_transaction',
      method: 'PATCH',
      path: '/finance-m2m/:profileId/recurring-transactions/:recurringTransactionId',
      whenToUse:
        'Use quando o usuário disser que o salário mudou de valor ou quiser pausar/ajustar uma recorrência.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        recurringTransactionId: 'UUID da recorrência obtido na listagem.',
        amount: 'Opcional: novo valor.',
        description: 'Opcional: nova descrição.',
        frequency: 'Opcional: nova frequência.',
        dayOfMonth: 'Opcional: novo dia do mês.',
        endDate: 'Opcional: nova data final.',
        isActive: 'Opcional: false pausa a recorrência.',
      },
      response: 'Retorna a recorrência atualizada.',
    },
    {
      name: 'delete_recurring_transaction',
      method: 'DELETE',
      path: '/finance-m2m/:profileId/recurring-transactions/:recurringTransactionId',
      whenToUse:
        'Use quando o usuário pedir para remover uma recorrência, por exemplo ao cancelar uma assinatura.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        recurringTransactionId: 'UUID da recorrência que será removida.',
      },
      response: 'Retorna { deleted: true, recurringTransactionId }.',
    },
  ],
};

export const FINANCE_INVESTMENTS_TOOL: AssistantTool = {
  module: 'finance-investments',
  description:
    'Gerencia investimentos e patrimônio do perfil: ativos como ações, fundos, cripto e imóveis, com histórico de valor e registro de compras e vendas.',
  endpoints: [
    {
      name: 'list_assets',
      method: 'GET',
      path: '/finance-m2m/:profileId/assets',
      whenToUse:
        'Use quando o usuário perguntar sobre seus investimentos, patrimônio ou o valor de um ativo.',
      request: {
        profileId: PROFILE_ID_REQUEST,
      },
      response:
        'Retorna a lista de ativos com id, name, type, current_value, gain_loss, units e average_price.',
    },
    {
      name: 'create_asset',
      method: 'POST',
      path: '/finance-m2m/:profileId/assets',
      whenToUse:
        'Use quando o usuário quiser cadastrar um investimento ou bem, por exemplo "tenho 10 mil no Tesouro".',
      request: {
        profileId: PROFILE_ID_REQUEST,
        name: 'Nome do ativo, por exemplo "Tesouro Selic".',
        type: 'stock, etf, crypto, fund, real_estate, vehicle, valuable, investment ou other.',
        currentValue: 'Opcional: valor atual do ativo.',
        purchaseDate: 'Opcional: data de compra YYYY-MM-DD.',
        purchasePrice: 'Opcional: preço pago.',
        ticker: 'Opcional: código de negociação, por exemplo PETR4.',
        units: 'Opcional: quantidade de cotas ou unidades.',
        currency: 'Opcional: código de 3 letras; padrão BRL.',
      },
      response: 'Retorna o ativo criado com id e current_value.',
    },
    {
      name: 'add_asset_value',
      method: 'POST',
      path: '/finance-m2m/:profileId/assets/:assetId/values',
      whenToUse:
        'Use quando o usuário informar o valor atualizado de um ativo, por exemplo "meu fundo está valendo 12 mil".',
      request: {
        profileId: PROFILE_ID_REQUEST,
        assetId: 'UUID do ativo obtido em list_assets.',
        amount: 'Novo valor do ativo.',
        date: 'Data da avaliação no formato YYYY-MM-DD.',
      },
      response: 'Retorna o registro de valor criado.',
    },
    {
      name: 'list_asset_trades',
      method: 'GET',
      path: '/finance-m2m/:profileId/assets/:assetId/trades',
      whenToUse:
        'Use quando o usuário perguntar o histórico de compras e vendas de um ativo.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        assetId: 'UUID do ativo obtido em list_assets.',
      },
      response:
        'Retorna a lista de operações com kind (buy ou sell), quantity, price e date.',
    },
    {
      name: 'record_asset_trade',
      method: 'POST',
      path: '/finance-m2m/:profileId/assets/:assetId/trades',
      whenToUse:
        'Use quando o usuário comprar ou vender um ativo, por exemplo "comprei 10 ações a 32 reais".',
      request: {
        profileId: PROFILE_ID_REQUEST,
        assetId: 'UUID do ativo obtido em list_assets.',
        kind: 'buy para compra, sell para venda.',
        quantity: 'Quantidade negociada, maior que zero.',
        price: 'Preço unitário pago ou recebido.',
        date: 'Data da operação no formato YYYY-MM-DD.',
        fee: 'Opcional: taxas da operação.',
      },
      response:
        'Retorna o ativo recalculado com units, average_price e realized_gain. Vender mais do que possui é rejeitado.',
    },
    {
      name: 'delete_asset',
      method: 'DELETE',
      path: '/finance-m2m/:profileId/assets/:assetId',
      whenToUse:
        'Use quando o usuário pedir para remover um ativo do acompanhamento. Remove também o histórico de valores e operações.',
      request: {
        profileId: PROFILE_ID_REQUEST,
        assetId: 'UUID do ativo que será removido.',
      },
      response: 'Retorna { deleted: true, assetId }.',
    },
  ],
};

export const FINANCE_TOOLS: AssistantTool[] = [
  FINANCE_ACCOUNTS_TOOL,
  FINANCE_TRANSACTIONS_TOOL,
  FINANCE_CATEGORIES_TOOL,
  FINANCE_RULES_TOOL,
  FINANCE_GOALS_TOOL,
  FINANCE_RECURRING_TOOL,
  FINANCE_INVESTMENTS_TOOL,
];

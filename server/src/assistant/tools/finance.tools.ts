import { AssistantTool } from './events.tools';

export const FINANCE_TOOL: AssistantTool = {
  module: 'finance',
  description:
    'Gerencia toda a vida financeira do perfil: contas, transações (gastos/ganhos), categorias, regras automáticas, metas de economia, transações recorrentes e investimentos (ativos).',
  endpoints: [
    {
      name: 'execute_finance_operation',
      method: 'POST',
      path: '/finance-m2m/:profileId/execute',
      whenToUse:
        'Sempre que o usuário quiser consultar, criar, editar ou excluir qualquer entidade financeira.',
      request: {
        profileId:
          'Obrigatório: profileId extraído do contexto no parâmetro de rota.',
        operation: 'Obrigatório: Nome da operação financeira.',
        data:
          'Opcional: Objeto contendo os parâmetros específicos da operação. Operações suportadas:\n' +
          '- Contas: list_accounts (), create_account (name, type, balance, currency)\n' +
          '- Transações: list_transactions (from, to, type, categoryId, q, limit), create_transaction (amount, type, description, date, accountId, categoryId, notes), update_transaction (transactionId, amount, type, description, date, categoryId, notes), delete_transaction (transactionId)\n' +
          '- Categorias: list_categories (), create_category (name, icon, color), update_category (categoryId, name, icon, color), delete_category (categoryId)\n' +
          '- Regras: list_rules (), create_rule (name, conditions, actions, conditionsOp, applyToExisting), update_rule (ruleId, ...), delete_rule (ruleId)\n' +
          '- Metas: list_goals (status), create_goal (name, targetAmount, currentAmount, targetDate, currency), update_goal (goalId, ...), delete_goal (goalId)\n' +
          '- Recorrências: list_recurring_transactions (), create_recurring_transaction (description, amount, type, frequency, startDate, dayOfMonth, endDate, categoryId), update_recurring_transaction (recurringTransactionId, ...), delete_recurring_transaction (recurringTransactionId)\n' +
          '- Ativos: list_assets (), create_asset (name, type, currentValue, purchaseDate, purchasePrice, ticker, units, currency), add_asset_value (assetId, amount, date), list_asset_trades (assetId), record_asset_trade (assetId, kind, quantity, price, date, fee), delete_asset (assetId)',
      },
      response: 'O resultado da operação solicitada.',
    },
  ],
};

export const FINANCE_TOOLS: AssistantTool[] = [FINANCE_TOOL];

import { ASSISTANT_TOOLS } from '../tools/main.tools';

const operationNames = (name: string) =>
  ASSISTANT_TOOLS.find((tool) => tool.name === name)?.operations.map(
    (operation) => operation.name,
  );

describe('ASSISTANT_TOOLS', () => {
  it('publishes every events operation in the events tool', () => {
    const eventsTool = ASSISTANT_TOOLS.find((tool) => tool.name === 'events');

    expect(eventsTool?.path).toBe(
      '/events-m2m/:profileId/execute',
    );
    expect(operationNames('events')).toEqual([
      'create_event',
      'find_active_events',
      'delete_event',
    ]);
  });

  it('publishes every finance operation in its dedicated tools', () => {
    const financeTools = ASSISTANT_TOOLS.filter((tool) => tool.name !== 'events');

    expect(financeTools).toHaveLength(7);
    expect(financeTools.every((tool) => tool.path === '/finance-m2m/:profileId/execute')).toBe(true);
    expect(financeTools.flatMap((tool) => tool.operations.map((operation) => operation.name))).toEqual([
      'list_accounts',
      'create_account',
      'create_transaction',
      'list_transactions',
      'update_transaction',
      'delete_transaction',
      'list_categories',
      'create_category',
      'update_category',
      'delete_category',
      'list_rules',
      'create_rule',
      'update_rule',
      'delete_rule',
      'list_goals',
      'create_goal',
      'update_goal',
      'delete_goal',
      'list_recurring_transactions',
      'create_recurring_transaction',
      'update_recurring_transaction',
      'delete_recurring_transaction',
      'list_assets',
      'create_asset',
      'add_asset_value',
      'list_asset_trades',
      'record_asset_trade',
      'delete_asset',
    ]);
  });

  it('describes every operation with usage, fields and an example', () => {
    for (const tool of ASSISTANT_TOOLS) {
      expect(tool.description.length).toBeGreaterThan(10);
      expect(tool.whenToUse.length).toBeGreaterThan(10);
      for (const operation of tool.operations) {
        expect(operation.whenToUse.length).toBeGreaterThan(10);
        expect(Array.isArray(operation.fields)).toBe(true);
        expect(typeof operation.example).toBe('object');
      }
    }
  });
});

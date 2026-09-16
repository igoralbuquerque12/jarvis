import { ASSISTANT_TOOLS } from '../tools/main.tools';

const operationNames = (module: string) =>
  ASSISTANT_TOOLS.find((tool) => tool.module === module)?.endpoints.flatMap(
    (endpoint) => endpoint.operations.map((operation) => operation.name),
  );

describe('ASSISTANT_TOOLS', () => {
  it('publishes every events operation behind the single "events" RPC tool', () => {
    const eventsTool = ASSISTANT_TOOLS.find((tool) => tool.module === 'events');

    expect(eventsTool?.endpoints).toHaveLength(1);
    expect(eventsTool?.endpoints[0].rpcToolName).toBe('events');
    expect(eventsTool?.endpoints[0].path).toBe(
      '/events-m2m/:profileId/execute',
    );
    expect(operationNames('events')).toEqual([
      'create_event',
      'find_active_events',
      'delete_event',
    ]);
  });

  it('publishes every finance operation behind the single "finance" RPC tool', () => {
    const financeTool = ASSISTANT_TOOLS.find(
      (tool) => tool.module === 'finance',
    );

    expect(financeTool?.endpoints).toHaveLength(1);
    expect(financeTool?.endpoints[0].rpcToolName).toBe('finance');
    expect(financeTool?.endpoints[0].path).toBe(
      '/finance-m2m/:profileId/execute',
    );
    expect(operationNames('finance')).toEqual([
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

  it('describes every operation with usage, at least one field line and an example', () => {
    for (const tool of ASSISTANT_TOOLS) {
      for (const endpoint of tool.endpoints) {
        expect(endpoint.request.profileId).toBeDefined();
        for (const operation of endpoint.operations) {
          expect(operation.whenToUse.length).toBeGreaterThan(10);
          expect(operation.params.length).toBeGreaterThan(0);
          expect(typeof operation.example).toBe('object');
        }
      }
    }
  });
});

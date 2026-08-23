import { ASSISTANT_TOOLS } from '../tools/main.tools';

describe('ASSISTANT_TOOLS', () => {
  it('publishes the events contracts without the guideline endpoint', () => {
    const eventsTool = ASSISTANT_TOOLS.find((tool) => tool.module === 'events');

    expect(eventsTool?.endpoints.map((endpoint) => endpoint.name)).toEqual([
      'create_event',
      'delete_event',
      'list_active_events',
    ]);
    expect(
      eventsTool?.endpoints.some((endpoint) =>
        endpoint.path.endsWith('guideline'),
      ),
    ).toBe(false);
  });

  it('publishes the finance contracts for every financial area', () => {
    const financeEndpoints: Record<string, string[]> = {
      'finance-accounts': ['list_accounts', 'create_account'],
      'finance-transactions': [
        'create_transaction',
        'list_transactions',
        'update_transaction',
        'delete_transaction',
      ],
      'finance-categories': [
        'list_categories',
        'create_category',
        'update_category',
        'delete_category',
      ],
      'finance-rules': [
        'list_rules',
        'create_rule',
        'update_rule',
        'delete_rule',
      ],
      'finance-goals': [
        'list_goals',
        'create_goal',
        'update_goal',
        'delete_goal',
      ],
      'finance-recurring': [
        'list_recurring_transactions',
        'create_recurring_transaction',
        'update_recurring_transaction',
        'delete_recurring_transaction',
      ],
      'finance-investments': [
        'list_assets',
        'create_asset',
        'add_asset_value',
        'list_asset_trades',
        'record_asset_trade',
        'delete_asset',
      ],
    };

    for (const [module, endpointNames] of Object.entries(financeEndpoints)) {
      const tool = ASSISTANT_TOOLS.find((entry) => entry.module === module);

      expect(tool?.endpoints.map((endpoint) => endpoint.name)).toEqual(
        endpointNames,
      );
    }
  });

  it('targets only finance-m2m paths scoped by profileId in finance tools', () => {
    const financeTools = ASSISTANT_TOOLS.filter((tool) =>
      tool.module.startsWith('finance-'),
    );

    expect(financeTools.length).toBeGreaterThan(0);

    for (const tool of financeTools) {
      for (const endpoint of tool.endpoints) {
        expect(endpoint.path.startsWith('/finance-m2m/:profileId')).toBe(true);
        expect(endpoint.request.profileId).toBeDefined();
      }
    }
  });
});

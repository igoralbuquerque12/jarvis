import { RulesService } from '../services/rules.service';

describe('RulesService', () => {
  const securoApi = { request: jest.fn() };
  const securoContext = {
    contextFor: jest.fn(),
    auth: jest.fn((ctx: { token: string; workspaceId: string }) => ({
      token: ctx.token,
      workspaceId: ctx.workspaceId,
    })),
    compact: jest.fn((payload: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined),
      ),
    ),
  };

  const service = new RulesService(securoApi as never, securoContext as never);

  beforeEach(() => {
    jest.clearAllMocks();
    securoContext.contextFor.mockResolvedValue({
      token: 'user-token',
      workspaceId: 'workspace-1',
      defaultAccountId: 'account-1',
    });
  });

  it('lists rules', async () => {
    securoApi.request.mockResolvedValue([{ id: 'rule-1' }]);

    const result = await service.findRules('profile-1');

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/rules',
      token: 'user-token',
      workspaceId: 'workspace-1',
    });
    expect(result).toEqual([{ id: 'rule-1' }]);
  });

  it('creates rule', async () => {
    securoApi.request.mockResolvedValue({ id: 'rule-1' });

    await service.createRule('profile-1', {
      name: 'Uber -> Transporte',
      conditions: [{ field: 'description', op: 'contains', value: 'Uber' }],
      actions: [{ op: 'set_category', value: 'cat-uuid' }],
    });

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/rules',
      token: 'user-token',
      workspaceId: 'workspace-1',
      body: {
        name: 'Uber -> Transporte',
        conditions: [{ field: 'description', op: 'contains', value: 'Uber' }],
        actions: [{ op: 'set_category', value: 'cat-uuid' }],
      },
    });
  });
});

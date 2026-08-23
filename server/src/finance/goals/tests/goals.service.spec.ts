import { GoalsService } from '../services/goals.service';

describe('GoalsService', () => {
  const securoApi = { request: jest.fn() };
  const securoContext = {
    contextFor: jest.fn(),
    auth: jest.fn((ctx: { token: string; workspaceId: string }) => ({
      token: ctx.token,
      workspaceId: ctx.workspaceId,
    })),
    money: jest.fn((v: number | undefined) =>
      v === undefined ? undefined : v.toFixed(2),
    ),
    compact: jest.fn((payload: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined),
      ),
    ),
  };

  const service = new GoalsService(securoApi as never, securoContext as never);

  beforeEach(() => {
    jest.clearAllMocks();
    securoContext.contextFor.mockResolvedValue({
      token: 'user-token',
      workspaceId: 'workspace-1',
      defaultAccountId: 'account-1',
    });
  });

  it('updates goal with formatted amounts', async () => {
    securoApi.request.mockResolvedValue({ id: 'goal-1' });

    await service.updateGoal('profile-1', 'goal-1', { currentAmount: 1500 });

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/api/goals/goal-1',
      token: 'user-token',
      workspaceId: 'workspace-1',
      body: { current_amount: '1500.00' },
    });
  });
});

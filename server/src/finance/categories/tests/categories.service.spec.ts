import { CategoriesService } from '../services/categories.service';

describe('CategoriesService', () => {
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

  const service = new CategoriesService(
    securoApi as never,
    securoContext as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    securoContext.contextFor.mockResolvedValue({
      token: 'user-token',
      workspaceId: 'workspace-1',
      defaultAccountId: 'account-1',
    });
  });

  it('lists categories', async () => {
    securoApi.request.mockResolvedValue([{ id: 'cat-1', name: 'Alimentação' }]);

    const result = await service.findCategories('profile-1');

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/categories',
      token: 'user-token',
      workspaceId: 'workspace-1',
    });
    expect(result).toEqual([{ id: 'cat-1', name: 'Alimentação' }]);
  });

  it('creates category', async () => {
    securoApi.request.mockResolvedValue({ id: 'cat-2', name: 'Pets' });

    await service.createCategory('profile-1', {
      name: 'Pets',
      color: '#FF5733',
    });

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/categories',
      token: 'user-token',
      workspaceId: 'workspace-1',
      body: { name: 'Pets', color: '#FF5733' },
    });
  });
});

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { WhatsappAdminGuard } from '../guards/whatsapp-admin.guard';
import { WhatsappController } from '../controllers/whatsapp.controller';

describe('WhatsappAdminGuard', () => {
  const secretKey = 'super-secret-admin-key-123';

  function createMockContext(headers: Record<string, string | undefined>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getClass: () => WhatsappController,
      getHandler: () => ({}),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({}) as any,
      switchToWs: () => ({}) as any,
      getType: () => 'http',
    } as unknown as ExecutionContext;
  }

  function createConfigService(key: string | undefined): ConfigService {
    return {
      get: jest.fn().mockImplementation((prop: string) => {
        if (
          prop === 'WHATSAPP_ADMIN_API_KEY' ||
          prop === 'WHATSAPP_ADMIN_KEY' ||
          prop === 'WHATSAPP_ADMIN_SECRET'
        ) {
          return key;
        }
        return undefined;
      }),
    } as unknown as ConfigService;
  }

  it('throws UnauthorizedException if administrative key is not configured in server', () => {
    const guard = new WhatsappAdminGuard(createConfigService(undefined));
    const context = createMockContext({ 'x-admin-key': secretKey });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(
      'WhatsApp administrative access is not configured.',
    );
  });

  it('throws UnauthorizedException if no key is provided in headers', () => {
    const guard = new WhatsappAdminGuard(createConfigService(secretKey));
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(
      'Administrative key is required in headers',
    );
  });

  it('throws UnauthorizedException if key is invalid', () => {
    const guard = new WhatsappAdminGuard(createConfigService(secretKey));
    const context = createMockContext({ 'x-admin-key': 'wrong-key' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(
      'Invalid administrative key.',
    );
  });

  it('allows access with x-admin-key header', () => {
    const guard = new WhatsappAdminGuard(createConfigService(secretKey));
    const context = createMockContext({ 'x-admin-key': secretKey });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access with x-whatsapp-admin-key header', () => {
    const guard = new WhatsappAdminGuard(createConfigService(secretKey));
    const context = createMockContext({ 'x-whatsapp-admin-key': secretKey });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access with x-api-key header', () => {
    const guard = new WhatsappAdminGuard(createConfigService(secretKey));
    const context = createMockContext({ 'x-api-key': secretKey });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access with Authorization: Bearer <key> header', () => {
    const guard = new WhatsappAdminGuard(createConfigService(secretKey));
    const context = createMockContext({
      authorization: `Bearer ${secretKey}`,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access with raw Authorization header', () => {
    const guard = new WhatsappAdminGuard(createConfigService(secretKey));
    const context = createMockContext({
      authorization: secretKey,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('verifies that WhatsappController is decorated with WhatsappAdminGuard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, WhatsappController);
    expect(guards).toBeDefined();
    expect(guards).toContain(WhatsappAdminGuard);
  });
});

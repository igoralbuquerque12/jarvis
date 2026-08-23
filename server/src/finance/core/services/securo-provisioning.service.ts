import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Profile, SecuroAccount, SecuroAccountStatus } from '@prisma/client';
import { createHmac } from 'node:crypto';

import { PrismaService } from '../../../prisma/services/prisma.service';
import { RedisService } from '../../../redis/services/redis.service';
import {
  SECURO_ADMIN_TOKEN_CACHE_KEY,
  SECURO_TOKEN_CACHE_TTL_SECONDS,
  securoUserTokenCacheKey,
} from '../constants/finance-cache.constant';
import {
  FINANCE_DEFAULT_ACCOUNT_NAME,
  FINANCE_DEFAULT_CURRENCY,
  FINANCE_DEFAULT_LANGUAGE,
  SECURO_PROFILE_EMAIL_DOMAIN,
} from '../constants/finance-defaults.constant';
import {
  SecuroAccountListSchema,
  SecuroCreatedAccountSchema,
  SecuroSetupStatusSchema,
  SecuroTokenResponseSchema,
  SecuroUserSchema,
  SecuroWorkspaceListSchema,
} from '../entities/securo-api.schemas';
import { SecuroApiService } from './securo-api.service';

@Injectable()
export class SecuroProvisioningService {
  private readonly logger = new Logger(SecuroProvisioningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly securoApi: SecuroApiService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  provisionInBackground(profile: Profile): void {
    void this.ensureSecuroAccount(profile).catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Securo provisioning failed for profile ${profile.id}: ${reason}`,
      );
    });
  }

  async ensureSecuroAccount(profile: Profile): Promise<SecuroAccount> {
    const existing = await this.prisma.securoAccount.findUnique({
      where: { profileId: profile.id },
    });

    if (
      existing?.status === SecuroAccountStatus.ACTIVE &&
      existing.workspaceId &&
      existing.defaultAccountId
    ) {
      return existing;
    }

    const { email, password } = this.deriveCredentials(profile.id);
    const record =
      existing ??
      (await this.prisma.securoAccount.create({
        data: { profileId: profile.id, email },
      }));

    try {
      const adminToken = await this.getAdminToken();
      const securoUserId = await this.createSecuroUser(
        adminToken,
        email,
        password,
      );
      const userToken = await this.login(email, password);
      const workspaceId = await this.findPersonalWorkspaceId(userToken);
      const defaultAccountId = await this.ensureDefaultAccount(
        userToken,
        workspaceId,
      );

      const updated = await this.prisma.securoAccount.update({
        where: { id: record.id },
        data: {
          securoUserId: securoUserId ?? record.securoUserId,
          workspaceId,
          defaultAccountId,
          status: SecuroAccountStatus.ACTIVE,
          observabilitys: null,
        },
      });

      await this.cacheUserToken(profile.id, userToken);
      this.logger.log(`Securo account ready for profile ${profile.id}.`);

      return updated;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.securoAccount
        .update({
          where: { id: record.id },
          data: { status: SecuroAccountStatus.FAILED, observabilitys: reason },
        })
        .catch(() => undefined);

      throw error;
    }
  }

  async getUserToken(profile: Profile): Promise<string> {
    const cacheKey = securoUserTokenCacheKey(profile.id);
    const cached = await this.redisService.getClient().get(cacheKey);

    if (cached !== null) {
      return cached;
    }

    const { email, password } = this.deriveCredentials(profile.id);
    const token = await this.login(email, password);

    await this.cacheUserToken(profile.id, token);

    return token;
  }

  private deriveCredentials(profileId: string): {
    email: string;
    password: string;
  } {
    const secret = this.configService.get<string>('SECURO_PROVISION_SECRET');

    if (!secret) {
      throw new Error(
        'SECURO_PROVISION_SECRET environment variable is required.',
      );
    }

    return {
      email: `profile-${profileId}@${SECURO_PROFILE_EMAIL_DOMAIN}`,
      password: createHmac('sha256', secret).update(profileId).digest('hex'),
    };
  }

  private async getAdminToken(): Promise<string> {
    const cached = await this.redisService
      .getClient()
      .get(SECURO_ADMIN_TOKEN_CACHE_KEY);

    if (cached !== null) {
      return cached;
    }

    const email = this.configService.get<string>('SECURO_ADMIN_EMAIL');
    const password = this.configService.get<string>('SECURO_ADMIN_PASSWORD');

    if (!email || !password) {
      throw new Error(
        'SECURO_ADMIN_EMAIL and SECURO_ADMIN_PASSWORD environment variables are required.',
      );
    }

    const status = SecuroSetupStatusSchema.parse(
      await this.securoApi.request({
        method: 'GET',
        path: '/api/setup/status',
      }),
    );

    let token: string;

    if (status.has_users) {
      token = await this.login(email, password);
    } else {
      const response = SecuroTokenResponseSchema.parse(
        await this.securoApi.request({
          method: 'POST',
          path: '/api/setup/create-admin',
          body: {
            email,
            password,
            currency: FINANCE_DEFAULT_CURRENCY,
            language: FINANCE_DEFAULT_LANGUAGE,
            name: 'Jarvis',
          },
        }),
      );
      token = response.access_token;
      this.logger.log(
        'Securo instance bootstrapped with the Jarvis admin user.',
      );
    }

    await this.redisService
      .getClient()
      .set(SECURO_ADMIN_TOKEN_CACHE_KEY, token, {
        expiration: { type: 'EX', value: SECURO_TOKEN_CACHE_TTL_SECONDS },
      });

    return token;
  }

  private async createSecuroUser(
    adminToken: string,
    email: string,
    password: string,
  ): Promise<string | null> {
    try {
      const user = SecuroUserSchema.parse(
        await this.securoApi.request({
          method: 'POST',
          path: '/api/admin/users',
          token: adminToken,
          body: {
            email,
            password,
            is_superuser: false,
            preferences: {
              language: FINANCE_DEFAULT_LANGUAGE,
              currency_display: FINANCE_DEFAULT_CURRENCY,
            },
          },
        }),
      );

      return user.id;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('already exists')
      ) {
        return null;
      }

      throw error;
    }
  }

  private async login(email: string, password: string): Promise<string> {
    const data = await this.securoApi.request({
      method: 'POST',
      path: '/api/auth/login',
      form: { username: email, password },
    });
    const parsed = SecuroTokenResponseSchema.safeParse(data);

    if (!parsed.success) {
      throw new Error('Securo login did not return an access token.');
    }

    return parsed.data.access_token;
  }

  private async findPersonalWorkspaceId(userToken: string): Promise<string> {
    const workspaces = SecuroWorkspaceListSchema.parse(
      await this.securoApi.request({
        method: 'GET',
        path: '/api/workspaces',
        token: userToken,
      }),
    );

    if (workspaces.length === 0) {
      throw new Error('Securo user has no workspace after provisioning.');
    }

    return workspaces[0].id;
  }

  private async ensureDefaultAccount(
    userToken: string,
    workspaceId: string,
  ): Promise<string> {
    const accounts = SecuroAccountListSchema.parse(
      await this.securoApi.request({
        method: 'GET',
        path: '/api/accounts',
        token: userToken,
        workspaceId,
      }),
    );

    if (accounts.length > 0) {
      return accounts[0].id;
    }

    const created = SecuroCreatedAccountSchema.parse(
      await this.securoApi.request({
        method: 'POST',
        path: '/api/accounts',
        token: userToken,
        workspaceId,
        body: {
          name: FINANCE_DEFAULT_ACCOUNT_NAME,
          type: 'checking',
          currency: FINANCE_DEFAULT_CURRENCY,
        },
      }),
    );

    return created.id;
  }

  private async cacheUserToken(
    profileId: string,
    token: string,
  ): Promise<void> {
    await this.redisService
      .getClient()
      .set(securoUserTokenCacheKey(profileId), token, {
        expiration: { type: 'EX', value: SECURO_TOKEN_CACHE_TTL_SECONDS },
      });
  }
}

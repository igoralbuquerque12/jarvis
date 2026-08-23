import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { IncomingHttpHeaders } from 'node:http';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { betterAuth } from 'better-auth/minimal';
import { fromNodeHeaders } from 'better-auth/node';
import { SecuroProvisioningService } from '../../finance/core/services/securo-provisioning.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { ProfileService } from '../../profile/services/profile.service';

@Injectable()
export class BetterAuthService {
  private readonly logger = new Logger(BetterAuthService.name);
  private readonly auth: ReturnType<typeof betterAuth>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
    private readonly securoProvisioningService: SecuroProvisioningService,
  ) {
    this.auth = betterAuth({
      baseURL: this.getAuthBaseURL(),
      secret: this.getAuthSecret(),
      database: prismaAdapter(this.prisma, {
        provider: 'postgresql',
      }),
      trustedOrigins: [this.getWebOrigin()],
      emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        disableSignUp: false,
        minPasswordLength: 8,
        sendResetPassword: ({ user, url }) => {
          this.logAuthLink('password-reset', user.email, url);
          return Promise.resolve();
        },
      },
      socialProviders: this.createSocialProviders(),
      account: {
        accountLinking: {
          enabled: true,
          disableImplicitLinking: false,
        },
      },
      databaseHooks: {
        user: {
          create: {
            after: async (user) => {
              const profile = await this.profileService.ensureAuthProfile(user);
              this.securoProvisioningService.provisionInBackground(profile);
            },
          },
        },
      },
    }) as unknown as ReturnType<typeof betterAuth>;
  }

  get instance() {
    return this.auth;
  }

  async getSession(headers: IncomingHttpHeaders | undefined) {
    if (!headers) {
      return null;
    }

    return this.auth.api.getSession({
      headers: fromNodeHeaders(headers),
    });
  }

  async requireSession(headers: IncomingHttpHeaders | undefined) {
    const session = await this.getSession(headers);

    if (!session) {
      throw new UnauthorizedException('Session is required.');
    }

    return session;
  }

  private createSocialProviders() {
    const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

    if (!googleClientId || !googleClientSecret) {
      this.logger.warn(
        'Google auth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google login.',
      );
      return undefined;
    }

    return {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      },
    } as const;
  }

  private getWebOrigin() {
    return process.env.WEB_ORIGIN?.trim() || 'http://localhost:5173';
  }

  private getAuthBaseURL() {
    return process.env.BETTER_AUTH_URL?.trim() || 'http://localhost:3000';
  }

  private getAuthSecret() {
    return process.env.BETTER_AUTH_SECRET?.trim();
  }

  private logAuthLink(kind: string, email: string, url: string) {
    this.logger.log(`Prepared ${kind} link for ${email}: ${url}`);
  }
}

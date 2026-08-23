import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileService } from '../../../profile/services/profile.service';
import { SecuroProvisioningService } from './securo-provisioning.service';

export type SecuroContext = {
  token: string;
  workspaceId: string;
  defaultAccountId: string;
};

@Injectable()
export class SecuroContextService {
  constructor(
    private readonly profileService: ProfileService,
    private readonly securoProvisioning: SecuroProvisioningService,
  ) {}

  async contextFor(profileId: string): Promise<SecuroContext> {
    const profile = await this.profileService.findOne({ id: profileId });

    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found`);
    }

    const securoAccount =
      await this.securoProvisioning.ensureSecuroAccount(profile);

    if (!securoAccount.workspaceId || !securoAccount.defaultAccountId) {
      throw new Error(
        `Securo account for profile ${profileId} is missing workspace data.`,
      );
    }

    const token = await this.securoProvisioning.getUserToken(profile);

    return {
      token,
      workspaceId: securoAccount.workspaceId,
      defaultAccountId: securoAccount.defaultAccountId,
    };
  }

  auth(context: SecuroContext) {
    return { token: context.token, workspaceId: context.workspaceId };
  }

  money(value: number): string;
  money(value: number | undefined): string | undefined;
  money(value: number | undefined): string | undefined {
    return value === undefined ? undefined : value.toFixed(2);
  }

  compact<T extends Record<string, unknown>>(payload: T): T {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    ) as T;
  }
}

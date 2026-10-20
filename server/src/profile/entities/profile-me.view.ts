import type { Prisma, Profile } from '@prisma/client';
import {
  SubscriptionView,
  toSubscriptionView,
} from '../../subscription/entities/subscription.view';

const WHATSAPP_JID_SUFFIX = '@lid';

/** True once the profile was paired over WhatsApp (jid stays null until then). */
export function isWhatsappLinked<T extends Pick<Profile, 'jid'>>(
  profile: T,
): profile is T & { jid: string } {
  return profile.jid !== null;
}

export type ProfileWithSubscription = Prisma.ProfileGetPayload<{
  include: { subscription: true };
}>;

export interface ProfileMeView {
  name: string;
  about: string;
  timezone: string;
  token: string;
  whatsappLinked: boolean;
  whatsappNumber: string | null;
  subscription: SubscriptionView;
  createdAt: Date;
}

function maskWhatsappNumber(jid: string): string {
  const number = jid.replace(WHATSAPP_JID_SUFFIX, '').replace(/[^\d]/g, '');
  if (number.length <= 6) {
    return number;
  }
  return `${number.slice(0, 4)}${'*'.repeat(number.length - 6)}${number.slice(-2)}`;
}

export function toProfileMeView(
  profile: ProfileWithSubscription,
): ProfileMeView {
  const whatsappLinked = isWhatsappLinked(profile);

  return {
    name: profile.name,
    about: profile.about,
    timezone: profile.timezone,
    token: profile.token,
    whatsappLinked,
    whatsappNumber: whatsappLinked ? maskWhatsappNumber(profile.jid) : null,
    subscription: toSubscriptionView(profile.subscription),
    createdAt: profile.createdAt,
  };
}

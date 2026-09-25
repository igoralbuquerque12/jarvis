import type { Prisma, Profile } from '@prisma/client';

const WHATSAPP_JID_SUFFIX = '@lid';

/** True once the profile was paired over WhatsApp (jid is a real number). */
export function isWhatsappLinked(profile: Pick<Profile, 'jid'>): boolean {
  return profile.jid ? true : false;
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
  subscription: {
    id: string;
    name: string;
    price: number;
    limit: number;
  };
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
    subscription: {
      id: profile.subscription.id,
      name: profile.subscription.name,
      price: Number(profile.subscription.price),
      limit: profile.subscription.limit,
    },
    createdAt: profile.createdAt,
  };
}

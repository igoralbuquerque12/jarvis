import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} environment variable is required to seed a profile.`,
    );
  }

  return value;
}

async function main(): Promise<void> {
  const databaseUrl = requiredEnv('DATABASE_URL');
  const profileInput = {
    name: requiredEnv('SEED_PROFILE_NAME'),
    token: requiredEnv('SEED_PROFILE_TOKEN'),
    jid: requiredEnv('SEED_PROFILE_JID'),
    active: true,
  };
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { name: 'free' },
    });
    const freeSubscription =
      subscription ??
      (await prisma.subscription.create({
        data: {
          name: 'Free Tier',
          price: 0,
          limit: 100,
        },
      }));
    const profileData = {
      ...profileInput,
      subscriptionId: freeSubscription.id,
    };

    const existingProfile = await prisma.profile.findFirst({
      where: { jid: profileData.jid },
    });

    if (existingProfile) {
      await prisma.profile.update({
        where: { id: existingProfile.id },
        data: profileData,
      });
    } else {
      await prisma.profile.create({ data: profileData });
    }

    console.log('Profile seed completed.');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Profile seed failed.';
  console.error(message);
  process.exitCode = 1;
});

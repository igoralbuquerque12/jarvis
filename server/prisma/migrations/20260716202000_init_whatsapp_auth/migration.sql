CREATE TABLE "whatsapp_auth" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "whatsapp_auth_pkey" PRIMARY KEY ("key")
);

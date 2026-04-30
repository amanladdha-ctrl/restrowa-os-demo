ALTER TABLE "Restaurant"
ADD COLUMN "customDomain" TEXT,
ADD COLUMN "customDomainVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Restaurant_customDomain_key" ON "Restaurant"("customDomain");

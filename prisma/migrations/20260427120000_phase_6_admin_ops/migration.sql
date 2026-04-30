-- CreateEnum
CREATE TYPE "SupportRequestStatus" AS ENUM ('open', 'resolved');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "passwordChangeRecommended" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "orderCode" TEXT;

-- Backfill orderCode for existing orders using restaurant slug prefix
UPDATE "Order" AS o
SET "orderCode" =
  UPPER(SUBSTRING(REGEXP_REPLACE(r."slug", '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 2))
  || '-' ||
  o."orderNumber"::TEXT
FROM "Restaurant" AS r
WHERE o."restaurantId" = r."id";

-- Finalize orderCode constraints
ALTER TABLE "Order"
ALTER COLUMN "orderCode" SET NOT NULL;

CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "adminReply" TEXT,
    "status" "SupportRequestStatus" NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

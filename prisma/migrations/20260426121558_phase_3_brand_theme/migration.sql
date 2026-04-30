-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "themeAccent" TEXT NOT NULL DEFAULT '#e6902e',
ADD COLUMN     "themeBackground" TEXT NOT NULL DEFAULT '#fff7ed',
ADD COLUMN     "themePrimary" TEXT NOT NULL DEFAULT '#1f2933';

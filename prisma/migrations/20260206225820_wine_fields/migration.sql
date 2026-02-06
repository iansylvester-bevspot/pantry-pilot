-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "abv" DECIMAL(4,1),
ADD COLUMN     "binNumber" TEXT,
ADD COLUMN     "producer" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "varietal" TEXT,
ADD COLUMN     "vintage" INTEGER;

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "packSize" INTEGER,
ADD COLUMN     "packUnit" TEXT,
ADD COLUMN     "unitSize" DECIMAL(10,2);

-- DropForeignKey
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_categoryId_fkey";

-- DropIndex
DROP INDEX "categories_name_key";

-- AlterTable
ALTER TABLE "inventory_items" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

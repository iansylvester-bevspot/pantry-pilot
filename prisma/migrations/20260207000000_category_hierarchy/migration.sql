-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('SUPER', 'CATEGORY', 'SUBCATEGORY');

-- AlterTable: Add new columns to categories
ALTER TABLE "categories" ADD COLUMN "type" "CategoryType" NOT NULL DEFAULT 'CATEGORY';
ALTER TABLE "categories" ADD COLUMN "glCode" TEXT;
ALTER TABLE "categories" ADD COLUMN "parentId" TEXT;

-- AlterTable: Add glCode to inventory_items
ALTER TABLE "inventory_items" ADD COLUMN "glCode" TEXT;

-- Drop old unique constraint on name
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_key";

-- Add self-referential foreign key
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add composite unique constraint (name + parentId)
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_parentId_key" UNIQUE ("name", "parentId");

-- Add indexes
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");
CREATE INDEX "categories_type_idx" ON "categories"("type");

/*
  Warnings:

  - Added the required column `store` to the `products_ml` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products_ml" ADD COLUMN     "store" TEXT NOT NULL;

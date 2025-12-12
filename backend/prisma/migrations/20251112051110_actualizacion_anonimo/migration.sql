/*
  Warnings:

  - You are about to drop the column `MatBibAut` on the `TB_MATERIAL_BIBLIOGRAFICO` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TB_MATERIAL_BIBLIOGRAFICO" DROP COLUMN "MatBibAut",
ADD COLUMN     "MatBibAno" BOOLEAN NOT NULL DEFAULT false;

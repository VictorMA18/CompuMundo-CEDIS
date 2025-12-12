/*
  Warnings:

  - A unique constraint covering the columns `[AutDoc]` on the table `TB_AUTOR` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[AutEma]` on the table `TB_AUTOR` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[LecEma]` on the table `TB_LECTOR` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `AutDoc` to the `TB_AUTOR` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TB_AUTOR" ADD COLUMN     "AutDoc" VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TB_AUTOR_AutDoc_key" ON "TB_AUTOR"("AutDoc");

-- CreateIndex
CREATE UNIQUE INDEX "TB_AUTOR_AutEma_key" ON "TB_AUTOR"("AutEma");

-- CreateIndex
CREATE UNIQUE INDEX "TB_LECTOR_LecEma_key" ON "TB_LECTOR"("LecEma");

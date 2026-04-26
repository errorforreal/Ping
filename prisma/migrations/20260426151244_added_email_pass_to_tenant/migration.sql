/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Tenant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_email_key" ON "Tenant"("email");

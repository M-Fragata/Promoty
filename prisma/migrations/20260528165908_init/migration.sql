-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Pending', 'Posted', 'Failed');

-- CreateTable
CREATE TABLE "Ofertas" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "original_url" TEXT NOT NULL,
    "converted_url" TEXT NOT NULL,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "Status" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "Ofertas_pkey" PRIMARY KEY ("id")
);

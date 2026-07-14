-- CreateTable
CREATE TABLE "created_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "shortUrl" TEXT,
    "store" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "created_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "created_links_userId_idx" ON "created_links"("userId");

-- AddForeignKey
ALTER TABLE "created_links" ADD CONSTRAINT "created_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

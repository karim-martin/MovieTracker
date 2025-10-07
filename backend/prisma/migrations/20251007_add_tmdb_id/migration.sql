-- AlterTable
ALTER TABLE "movies" ADD COLUMN "tmdbId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "movies_tmdbId_key" ON "movies"("tmdbId");

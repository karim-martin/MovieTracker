/*
  Warnings:

  - You are about to drop the `collection_movies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `collections` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "collection_movies" DROP CONSTRAINT "collection_movies_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "collection_movies" DROP CONSTRAINT "collection_movies_movieId_fkey";

-- DropForeignKey
ALTER TABLE "collections" DROP CONSTRAINT "collections_userId_fkey";

-- DropTable
DROP TABLE "collection_movies";

-- DropTable
DROP TABLE "collections";

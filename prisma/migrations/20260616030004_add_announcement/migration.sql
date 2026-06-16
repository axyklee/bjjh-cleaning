-- CreateTable
CREATE TABLE "public"."Announcement" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Announcement_rank_key" ON "public"."Announcement"("rank");

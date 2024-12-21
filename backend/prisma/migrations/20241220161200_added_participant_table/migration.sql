-- CreateTable
CREATE TABLE "Participant" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_gameId_userEmail_key" ON "Participant"("gameId", "userEmail");

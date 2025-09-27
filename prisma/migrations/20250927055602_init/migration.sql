-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "date" TEXT,
    "country" TEXT,
    "summary" TEXT,
    "site" TEXT,
    "aircraft" TEXT,
    "operator" TEXT,
    "fatalities" INTEGER,
    "injuries" INTEGER,
    "survivors" INTEGER,
    "origin" TEXT,
    "destination" TEXT,
    "pdf_url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

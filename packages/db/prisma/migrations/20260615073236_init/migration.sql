-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PromptType" AS ENUM ('AXIAL_CODE_GENERATION_SYSTEM', 'AXIAL_CODE_GENERATION_USER', 'AXIAL_CODE_REGENERATION_SYSTEM', 'AXIAL_CODE_REGENERATION_USER', 'LLM_AS_A_JUDGE_STATIC_SYSTEM', 'LLM_AS_A_JUDGE_STATIC_USER', 'LLM_AS_A_JUDGE_GENERATION_SYSTEM', 'LLM_AS_A_JUDGE_GENERATION_USER', 'LLM_AS_A_JUDGE_SCRATCH_SYSTEM', 'LLM_AS_A_JUDGE_SCRATCH_USER', 'AI_FEEDBACK_SUGGESTION_SYSTEM', 'AI_FEEDBACK_SUGGESTION_USER');

-- CreateEnum
CREATE TYPE "Feedback" AS ENUM ('positive', 'negative');

-- CreateTable
CREATE TABLE "AxialCode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "feedback" TEXT NOT NULL DEFAULT '',
    "traceListId" TEXT,

    CONSTRAINT "AxialCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "traceListId" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PROCESSING',
    "error" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessmentCriteria" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "promptType" "PromptType" NOT NULL,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trace" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "system" TEXT,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "openCode" TEXT,
    "context" TEXT,
    "feedback" "Feedback",
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "traceListId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "axialCodeId" TEXT,

    CONSTRAINT "Trace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraceList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "axialCodeFeedback" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,

    CONSTRAINT "TraceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraceConnection" (
    "id" TEXT NOT NULL,
    "axialCodeId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "TraceConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AxialCode_id_key" ON "AxialCode"("id");

-- CreateIndex
CREATE UNIQUE INDEX "File_id_key" ON "File"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Project_id_key" ON "Project"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_id_key" ON "Prompt"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_promptType_key" ON "Prompt"("promptType");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Trace_id_key" ON "Trace"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TraceList_id_key" ON "TraceList"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TraceConnection_id_key" ON "TraceConnection"("id");

-- AddForeignKey
ALTER TABLE "AxialCode" ADD CONSTRAINT "AxialCode_traceListId_fkey" FOREIGN KEY ("traceListId") REFERENCES "TraceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_traceListId_fkey" FOREIGN KEY ("traceListId") REFERENCES "TraceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Trace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_traceListId_fkey" FOREIGN KEY ("traceListId") REFERENCES "TraceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_axialCodeId_fkey" FOREIGN KEY ("axialCodeId") REFERENCES "AxialCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceList" ADD CONSTRAINT "TraceList_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceConnection" ADD CONSTRAINT "TraceConnection_axialCodeId_fkey" FOREIGN KEY ("axialCodeId") REFERENCES "AxialCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceConnection" ADD CONSTRAINT "TraceConnection_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "Trace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

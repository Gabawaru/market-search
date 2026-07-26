-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('MCQ', 'NUMERIC', 'FREE_TEXT');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'INVALIDATED');

-- CreateEnum
CREATE TYPE "IntegrityEventType" AS ENUM ('FULLSCREEN_EXIT', 'VISIBILITY_HIDDEN', 'WINDOW_BLUR', 'DEVTOOLS_SUSPECTED', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'AI_TEXT_SUSPECTED', 'SESSION_TOKEN_INVALID', 'HEARTBEAT_MISSED', 'MULTI_TAB_DETECTED');

-- CreateEnum
CREATE TYPE "IntegritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "IntegrityAction" AS ENUM ('LOGGED_ONLY', 'WARNED', 'ZEROED_QUESTION', 'ZEROED_EVALUATION');

-- CreateEnum
CREATE TYPE "PointsTransactionType" AS ENUM ('EARNED_EXERCISE', 'EARNED_EVALUATION', 'EARNED_STREAK', 'EARNED_BADGE', 'SPENT_REWARD', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TutoringRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "PayoutDecisionStatus" AS ENUM ('ELIGIBLE', 'NOT_ELIGIBLE');

-- CreateEnum
CREATE TYPE "ChatThreadType" AS ENUM ('CHILD_PARENT_TEACHER', 'PARENT_TEACHER_PRIVATE');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('PARENT', 'CHILD', 'TEACHER');

-- CreateEnum
CREATE TYPE "DevSuggestionCategory" AS ENUM ('CONTENT', 'DIFFICULTY', 'FEATURE', 'CODE');

-- CreateEnum
CREATE TYPE "DevSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED');

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "avatarKey" TEXT,
    "birthYear" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "ratePerSession" DOUBLE PRECISION,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAvailability" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "TeacherAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "minAge" INTEGER NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unlockThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "minExerciseCount" INTEGER NOT NULL DEFAULT 15,
    "evaluationExerciseCount" INTEGER NOT NULL DEFAULT 10,
    "retryCooldownHours" INTEGER NOT NULL DEFAULT 24,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "generatorKey" TEXT NOT NULL,
    "paramsSchema" JSONB NOT NULL,
    "staticPrompt" TEXT,
    "staticAnswer" JSONB,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseInstance" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "correctAnswer" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildSkillProgress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "currentLevelId" TEXT,
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildSkillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseAttempt" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "exerciseInstanceId" TEXT NOT NULL,
    "answerGiven" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeTakenMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "sessionToken" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "totalScore" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "invalidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationAttempt" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "exerciseInstanceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "answerGiven" JSONB,
    "isCorrect" BOOLEAN,
    "scoreOverride" DOUBLE PRECISION,
    "suspicionScore" DOUBLE PRECISION,
    "timeTakenMs" INTEGER,
    "presentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "EvaluationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrityEvent" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "evaluationAttemptId" TEXT,
    "childId" TEXT NOT NULL,
    "type" "IntegrityEventType" NOT NULL,
    "severity" "IntegritySeverity" NOT NULL,
    "actionTaken" "IntegrityAction" NOT NULL,
    "metadata" JSONB,
    "clientTimestamp" TIMESTAMP(3),
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedByParentAt" TIMESTAMP(3),

    CONSTRAINT "IntegrityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildWritingProfile" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "avgWordLength" DOUBLE PRECISION,
    "avgSentenceLength" DOUBLE PRECISION,
    "commonErrorRate" DOUBLE PRECISION,
    "vocabComplexity" DOUBLE PRECISION,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildWritingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsWallet" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointsWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "PointsTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardCatalogItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRedemption" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildBadge" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildAssessment" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "objectiveScore" DOUBLE PRECISION NOT NULL,
    "effortScore" DOUBLE PRECISION NOT NULL,
    "narrative" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL DEFAULT 'ai-scan',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressReport" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "summary" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonStoryEntry" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "relatedEvaluationId" TEXT,
    "title" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "highlights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonStoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringRequest" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "targetLevelId" TEXT NOT NULL,
    "targetScore" DOUBLE PRECISION NOT NULL,
    "proposedRate" DOUBLE PRECISION NOT NULL,
    "status" "TutoringRequestStatus" NOT NULL DEFAULT 'PENDING',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutoringRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringPayoutDecision" (
    "id" TEXT NOT NULL,
    "tutoringRequestId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "PayoutDecisionStatus" NOT NULL,
    "achievedScore" DOUBLE PRECISION NOT NULL,
    "effortScore" DOUBLE PRECISION NOT NULL,
    "amountSimulated" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT NOT NULL,
    "assessmentSnapshot" JSONB NOT NULL,
    "supersedesId" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutoringPayoutDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatThread" (
    "id" TEXT NOT NULL,
    "type" "ChatThreadType" NOT NULL,
    "childId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatThreadParticipant" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL,
    "parentId" TEXT,
    "childId" TEXT,
    "teacherId" TEXT,

    CONSTRAINT "ChatThreadParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderRole" "ParticipantRole" NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "teacherId" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionThread" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "childId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestionThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorRole" "ParticipantRole" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedAt" TIMESTAMP(3),

    CONSTRAINT "SuggestionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevSuggestion" (
    "id" TEXT NOT NULL,
    "category" "DevSuggestionCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceData" JSONB,
    "status" "DevSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "prUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "DevSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiScanRun" (
    "id" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "childrenScanned" INTEGER NOT NULL,
    "suggestionsCreated" INTEGER NOT NULL,
    "digestSentEmail" BOOLEAN NOT NULL DEFAULT false,
    "digestSentSms" BOOLEAN NOT NULL DEFAULT false,
    "summary" JSONB NOT NULL,

    CONSTRAINT "AiScanRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Parent_email_key" ON "Parent"("email");

-- CreateIndex
CREATE INDEX "Child_parentId_idx" ON "Child"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");

-- CreateIndex
CREATE INDEX "TeacherAvailability_teacherId_idx" ON "TeacherAvailability"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "DevAdmin_email_key" ON "DevAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_code_key" ON "Skill"("code");

-- CreateIndex
CREATE INDEX "Skill_subjectId_idx" ON "Skill"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Level_skillId_order_key" ON "Level"("skillId", "order");

-- CreateIndex
CREATE INDEX "Exercise_levelId_idx" ON "Exercise"("levelId");

-- CreateIndex
CREATE INDEX "ExerciseInstance_exerciseId_idx" ON "ExerciseInstance"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildSkillProgress_childId_skillId_key" ON "ChildSkillProgress"("childId", "skillId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_childId_idx" ON "ExerciseAttempt"("childId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_exerciseInstanceId_idx" ON "ExerciseAttempt"("exerciseInstanceId");

-- CreateIndex
CREATE INDEX "Evaluation_childId_idx" ON "Evaluation"("childId");

-- CreateIndex
CREATE INDEX "Evaluation_levelId_idx" ON "Evaluation"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationAttempt_evaluationId_order_key" ON "EvaluationAttempt"("evaluationId", "order");

-- CreateIndex
CREATE INDEX "IntegrityEvent_evaluationId_idx" ON "IntegrityEvent"("evaluationId");

-- CreateIndex
CREATE INDEX "IntegrityEvent_childId_idx" ON "IntegrityEvent"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildWritingProfile_childId_key" ON "ChildWritingProfile"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "PointsWallet_childId_key" ON "PointsWallet"("childId");

-- CreateIndex
CREATE INDEX "PointsTransaction_walletId_idx" ON "PointsTransaction"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardCatalogItem_code_key" ON "RewardCatalogItem"("code");

-- CreateIndex
CREATE INDEX "RewardRedemption_childId_idx" ON "RewardRedemption"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ChildBadge_childId_badgeId_key" ON "ChildBadge"("childId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "Streak_childId_key" ON "Streak"("childId");

-- CreateIndex
CREATE INDEX "ChildAssessment_childId_idx" ON "ChildAssessment"("childId");

-- CreateIndex
CREATE INDEX "LessonStoryEntry_childId_idx" ON "LessonStoryEntry"("childId");

-- CreateIndex
CREATE INDEX "TutoringRequest_parentId_idx" ON "TutoringRequest"("parentId");

-- CreateIndex
CREATE INDEX "TutoringRequest_childId_idx" ON "TutoringRequest"("childId");

-- CreateIndex
CREATE INDEX "TutoringRequest_teacherId_idx" ON "TutoringRequest"("teacherId");

-- CreateIndex
CREATE INDEX "TutoringPayoutDecision_tutoringRequestId_idx" ON "TutoringPayoutDecision"("tutoringRequestId");

-- CreateIndex
CREATE INDEX "ChatThreadParticipant_threadId_idx" ON "ChatThreadParticipant"("threadId");

-- CreateIndex
CREATE INDEX "ChatMessage_threadId_idx" ON "ChatMessage"("threadId");

-- CreateIndex
CREATE INDEX "Notification_parentId_idx" ON "Notification"("parentId");

-- CreateIndex
CREATE INDEX "Notification_teacherId_idx" ON "Notification"("teacherId");

-- CreateIndex
CREATE INDEX "SuggestionMessage_threadId_idx" ON "SuggestionMessage"("threadId");

-- CreateIndex
CREATE INDEX "DevSuggestion_status_idx" ON "DevSuggestion"("status");

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseInstance" ADD CONSTRAINT "ExerciseInstance_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSkillProgress" ADD CONSTRAINT "ChildSkillProgress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSkillProgress" ADD CONSTRAINT "ChildSkillProgress_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_exerciseInstanceId_fkey" FOREIGN KEY ("exerciseInstanceId") REFERENCES "ExerciseInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationAttempt" ADD CONSTRAINT "EvaluationAttempt_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationAttempt" ADD CONSTRAINT "EvaluationAttempt_exerciseInstanceId_fkey" FOREIGN KEY ("exerciseInstanceId") REFERENCES "ExerciseInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrityEvent" ADD CONSTRAINT "IntegrityEvent_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrityEvent" ADD CONSTRAINT "IntegrityEvent_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildWritingProfile" ADD CONSTRAINT "ChildWritingProfile_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsWallet" ADD CONSTRAINT "PointsWallet_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "PointsWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "RewardCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildBadge" ADD CONSTRAINT "ChildBadge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildBadge" ADD CONSTRAINT "ChildBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAssessment" ADD CONSTRAINT "ChildAssessment_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonStoryEntry" ADD CONSTRAINT "LessonStoryEntry_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringRequest" ADD CONSTRAINT "TutoringRequest_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringRequest" ADD CONSTRAINT "TutoringRequest_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringRequest" ADD CONSTRAINT "TutoringRequest_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringRequest" ADD CONSTRAINT "TutoringRequest_targetLevelId_fkey" FOREIGN KEY ("targetLevelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringPayoutDecision" ADD CONSTRAINT "TutoringPayoutDecision_tutoringRequestId_fkey" FOREIGN KEY ("tutoringRequestId") REFERENCES "TutoringRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThreadParticipant" ADD CONSTRAINT "ChatThreadParticipant_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThreadParticipant" ADD CONSTRAINT "ChatThreadParticipant_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThreadParticipant" ADD CONSTRAINT "ChatThreadParticipant_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThreadParticipant" ADD CONSTRAINT "ChatThreadParticipant_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionThread" ADD CONSTRAINT "SuggestionThread_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionThread" ADD CONSTRAINT "SuggestionThread_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionMessage" ADD CONSTRAINT "SuggestionMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "SuggestionThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'QUEUED', 'PARSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('ERROR', 'DEPLOYMENT', 'CONFIGURATION', 'PERFORMANCE', 'SECURITY', 'NETWORK', 'DATABASE', 'INFRASTRUCTURE', 'APPLICATION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RecommendationPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AgentVersionStatus" AS ENUM ('DRAFT', 'STAGED', 'PRODUCTION', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReplayMode" AS ENUM ('SANDBOX', 'MOCK_TOOLS', 'RECORDED_TOOLS', 'READ_ONLY', 'LIVE');

-- CreateEnum
CREATE TYPE "ReplayStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ForkStatus" AS ENUM ('CREATED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "environment" TEXT,
    "tags" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "upload_status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "total_size" BIGINT NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" UUID NOT NULL,
    "upload_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT,
    "storage_path" TEXT NOT NULL,
    "size" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parsed_events" (
    "id" UUID NOT NULL,
    "upload_id" UUID NOT NULL,
    "timestamp" TIMESTAMP(3),
    "service" TEXT,
    "severity" "Severity" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "source_file" TEXT,
    "line_number" INTEGER,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parsed_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "parsed_event_id" UUID NOT NULL,
    "category" "EventCategory" NOT NULL DEFAULT 'UNKNOWN',
    "confidence" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "upload_id" UUID NOT NULL,
    "execution_id" UUID,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'QUEUED',
    "overall_confidence" DECIMAL(65,30),
    "summary" TEXT,
    "ai_model" TEXT,
    "tokens_used" INTEGER,
    "des_step_id" TEXT,
    "des_category" TEXT,
    "des_severity" TEXT,
    "des_confidence" DECIMAL(5,2),
    "alternative_hypotheses" JSONB DEFAULT '[]',
    "recommendation" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependency_nodes" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "node_name" TEXT NOT NULL,
    "node_type" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "dependency_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependency_edges" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "source_node" UUID NOT NULL,
    "target_node" UUID NOT NULL,
    "relationship" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 1,

    CONSTRAINT "dependency_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_nodes" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "evidence_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "confidence" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "evidence_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_edges" (
    "id" UUID NOT NULL,
    "source_node" UUID NOT NULL,
    "target_node" UUID NOT NULL,
    "relationship" TEXT NOT NULL,
    "confidence" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "evidence_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hypotheses" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "explanation" TEXT,
    "confidence" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "evidence" JSONB DEFAULT '[]',

    CONSTRAINT "hypotheses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "root_causes" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "hypothesis_id" UUID NOT NULL,
    "explanation" TEXT NOT NULL,
    "confidence" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "root_causes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "priority" "RecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "impact" TEXT,
    "effort" TEXT,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "report_type" TEXT NOT NULL,
    "content" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "role" "ChatRole" NOT NULL,
    "message" TEXT NOT NULL,
    "tokens_used" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "runtime" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_versions" (
    "id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "status" "AgentVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "config" JSONB NOT NULL DEFAULT '{}',
    "prompt_metadata" JSONB,
    "model_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executions" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "agent_id" UUID,
    "agent_version_id" UUID,
    "trace_id" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "runtime" TEXT,
    "environment" TEXT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "status" TEXT NOT NULL,
    "input_metadata" JSONB,
    "output_metadata" JSONB,
    "error_metadata" JSONB,
    "model_metadata" JSONB,
    "token_usage" JSONB,
    "estimated_cost" DECIMAL(12,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_events" (
    "id" UUID NOT NULL,
    "execution_id" UUID NOT NULL,
    "span_id" TEXT NOT NULL,
    "parent_span_id" TEXT,
    "agent" TEXT,
    "node" TEXT,
    "operation" TEXT,
    "type" TEXT NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "status" TEXT NOT NULL,
    "input_metadata" JSONB,
    "output_metadata" JSONB,
    "error_metadata" JSONB,
    "model_metadata" JSONB,
    "token_usage" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshots" (
    "id" UUID NOT NULL,
    "execution_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "agent_id" UUID,
    "agent_version_id" UUID,
    "parent_snapshot_id" UUID,
    "span_id" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "runtime" TEXT,
    "environment" TEXT,
    "state" JSONB NOT NULL,
    "context" JSONB,
    "model_metadata" JSONB,
    "tool_metadata" JSONB,
    "memory_refs" JSONB,
    "retrieval_refs" JSONB,
    "token_metadata" JSONB,
    "cost_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replays" (
    "id" UUID NOT NULL,
    "source_execution_id" UUID NOT NULL,
    "source_snapshot_id" UUID,
    "owner_id" UUID NOT NULL,
    "mode" "ReplayMode" NOT NULL DEFAULT 'SANDBOX',
    "overrides" JSONB NOT NULL DEFAULT '{}',
    "status" "ReplayStatus" NOT NULL DEFAULT 'QUEUED',
    "result_execution_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "replays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replay_results" (
    "id" UUID NOT NULL,
    "replay_id" UUID NOT NULL,
    "result_execution_id" UUID,
    "status" TEXT NOT NULL,
    "latency_ms" INTEGER,
    "token_usage" JSONB,
    "cost_metadata" JSONB,
    "output_metadata" JSONB,
    "error_metadata" JSONB,
    "divergence" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "replay_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forks" (
    "id" UUID NOT NULL,
    "source_execution_id" UUID NOT NULL,
    "source_snapshot_id" UUID,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "changes" JSONB NOT NULL DEFAULT '{}',
    "status" "ForkStatus" NOT NULL DEFAULT 'CREATED',
    "result_execution_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diffs" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "left_execution_id" UUID NOT NULL,
    "right_execution_id" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "workspaces_owner_id_idx" ON "workspaces"("owner_id");

-- CreateIndex
CREATE INDEX "projects_workspace_id_idx" ON "projects"("workspace_id");

-- CreateIndex
CREATE INDEX "uploads_project_id_idx" ON "uploads"("project_id");

-- CreateIndex
CREATE INDEX "parsed_events_upload_id_idx" ON "parsed_events"("upload_id");

-- CreateIndex
CREATE INDEX "analyses_project_id_idx" ON "analyses"("project_id");

-- CreateIndex
CREATE INDEX "analyses_execution_id_idx" ON "analyses"("execution_id");

-- CreateIndex
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages"("session_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "agents_project_id_idx" ON "agents"("project_id");

-- CreateIndex
CREATE INDEX "agents_owner_id_idx" ON "agents"("owner_id");

-- CreateIndex
CREATE INDEX "agent_versions_agent_id_idx" ON "agent_versions"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_versions_agent_id_version_key" ON "agent_versions"("agent_id", "version");

-- CreateIndex
CREATE INDEX "executions_project_id_created_at_idx" ON "executions"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "executions_agent_id_idx" ON "executions"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "executions_owner_id_trace_id_key" ON "executions"("owner_id", "trace_id");

-- CreateIndex
CREATE INDEX "execution_events_execution_id_start_time_idx" ON "execution_events"("execution_id", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "execution_events_execution_id_span_id_key" ON "execution_events"("execution_id", "span_id");

-- CreateIndex
CREATE INDEX "snapshots_owner_id_execution_id_idx" ON "snapshots"("owner_id", "execution_id");

-- CreateIndex
CREATE INDEX "snapshots_execution_id_span_id_idx" ON "snapshots"("execution_id", "span_id");

-- CreateIndex
CREATE INDEX "replays_owner_id_created_at_idx" ON "replays"("owner_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "replay_results_replay_id_key" ON "replay_results"("replay_id");

-- CreateIndex
CREATE INDEX "forks_owner_id_created_at_idx" ON "forks"("owner_id", "created_at");

-- CreateIndex
CREATE INDEX "diffs_owner_id_created_at_idx" ON "diffs"("owner_id", "created_at");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parsed_events" ADD CONSTRAINT "parsed_events_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_parsed_event_id_fkey" FOREIGN KEY ("parsed_event_id") REFERENCES "parsed_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependency_nodes" ADD CONSTRAINT "dependency_nodes_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependency_edges" ADD CONSTRAINT "dependency_edges_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_nodes" ADD CONSTRAINT "evidence_nodes_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_edges" ADD CONSTRAINT "evidence_edges_source_node_fkey" FOREIGN KEY ("source_node") REFERENCES "evidence_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_edges" ADD CONSTRAINT "evidence_edges_target_node_fkey" FOREIGN KEY ("target_node") REFERENCES "evidence_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hypotheses" ADD CONSTRAINT "hypotheses_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "root_causes" ADD CONSTRAINT "root_causes_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "root_causes" ADD CONSTRAINT "root_causes_hypothesis_id_fkey" FOREIGN KEY ("hypothesis_id") REFERENCES "hypotheses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_agent_version_id_fkey" FOREIGN KEY ("agent_version_id") REFERENCES "agent_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_events" ADD CONSTRAINT "execution_events_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "executions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "executions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_agent_version_id_fkey" FOREIGN KEY ("agent_version_id") REFERENCES "agent_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_parent_snapshot_id_fkey" FOREIGN KEY ("parent_snapshot_id") REFERENCES "snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replays" ADD CONSTRAINT "replays_source_execution_id_fkey" FOREIGN KEY ("source_execution_id") REFERENCES "executions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replays" ADD CONSTRAINT "replays_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replays" ADD CONSTRAINT "replays_source_snapshot_id_fkey" FOREIGN KEY ("source_snapshot_id") REFERENCES "snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replays" ADD CONSTRAINT "replays_result_execution_id_fkey" FOREIGN KEY ("result_execution_id") REFERENCES "executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replay_results" ADD CONSTRAINT "replay_results_replay_id_fkey" FOREIGN KEY ("replay_id") REFERENCES "replays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forks" ADD CONSTRAINT "forks_source_execution_id_fkey" FOREIGN KEY ("source_execution_id") REFERENCES "executions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forks" ADD CONSTRAINT "forks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forks" ADD CONSTRAINT "forks_source_snapshot_id_fkey" FOREIGN KEY ("source_snapshot_id") REFERENCES "snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forks" ADD CONSTRAINT "forks_result_execution_id_fkey" FOREIGN KEY ("result_execution_id") REFERENCES "executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_left_execution_id_fkey" FOREIGN KEY ("left_execution_id") REFERENCES "executions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_right_execution_id_fkey" FOREIGN KEY ("right_execution_id") REFERENCES "executions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


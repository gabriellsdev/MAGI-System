-- =============================================================
-- MAGI SYSTEM PERSISTENCE SCHEMA (V2.1 - SUPABASE / POSTGRESQL)
-- =============================================================

-- 1. Deliberations Table (Consolidated MAGI Core Judgments)
CREATE TABLE IF NOT EXISTS deliberations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  final_decision TEXT NOT NULL,
  core_verdict TEXT NOT NULL,
  confidence NUMERIC(5, 4) NOT NULL,
  duration_ms INTEGER NOT NULL,
  rounds_count INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 6) DEFAULT 0.000000,
  language TEXT DEFAULT 'English',
  decisive_factors JSONB DEFAULT '[]'::jsonb,
  argument_quality_score JSONB DEFAULT '{}'::jsonb,
  synthesis_summary TEXT
);

-- 2. Agent Analyses Table (Per-Agent Archetype Outputs per Round)
CREATE TABLE IF NOT EXISTS agent_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliberation_id UUID NOT NULL REFERENCES deliberations(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL DEFAULT 0,
  agent TEXT NOT NULL,
  stance TEXT NOT NULL,
  confidence NUMERIC(5, 4) NOT NULL,
  summary TEXT NOT NULL,
  arguments JSONB DEFAULT '[]'::jsonb,
  risks JSONB DEFAULT '[]'::jsonb,
  critical_assumptions JSONB DEFAULT '[]'::jsonb,
  recommendation TEXT,
  critiques_of_peers JSONB DEFAULT '[]'::jsonb,
  tokens_used JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Optimization Indices
CREATE INDEX IF NOT EXISTS idx_deliberations_created_at ON deliberations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_analyses_deliberation_id ON agent_analyses(deliberation_id);

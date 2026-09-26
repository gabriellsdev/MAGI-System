import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { MagiSynthesisResult, AgentId, AgentStructuredOutput } from '../domain/types.js';

export interface DeliberationRecord {
  id: string;
  query: string;
  created_at: string;
  model: string;
  provider: string;
  final_decision: string;
  core_verdict: string;
  confidence: number;
  duration_ms: number;
  rounds_count: number;
  total_tokens: number;
  estimated_cost_usd: number;
  language: string;
}

export class SupabasePersistenceService {
  private client: SupabaseClient | null = null;
  private url: string = '';

  constructor() {
    this.initClient();
  }

  private initClient() {
    let rawUrl = process.env.SUPABASE_URL || '';
    const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

    if (!rawUrl || !rawKey) {
      return;
    }

    // Normalize URL: remove any trailing /rest/v1 or /rest/v1/
    this.url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

    try {
      this.client = createClient(this.url, rawKey, {
        auth: { persistSession: false },
      });
    } catch (err) {
      console.warn('[MAGI PERSISTENCE] Failed to initialize Supabase client:', err);
      this.client = null;
    }
  }

  public isConfigured(): boolean {
    return this.client !== null;
  }

  public getUrl(): string {
    return this.url;
  }

  /**
   * Persists a full MAGI deliberation result and all agent analyses across rounds.
   */
  async saveDeliberation(result: MagiSynthesisResult): Promise<{ id: string } | null> {
    if (!this.client) {
      return null;
    }

    try {
      // Calculate mean confidence across the triad
      const confidences = Object.values(result.initialAnalysis).map(a => a.confidence || 0.85);
      const avgConfidence = confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0.85;

      const meta = result.metadata;
      const model = meta?.model || process.env.DEFAULT_MODEL || 'gemini-3.1-pro-preview';
      const provider = meta?.provider || 'gemini';
      const durationMs = meta?.durationMs || 0;
      const language = meta?.language || 'English';
      const totalTokens = meta?.totalTokensUsed || result.totalTokensUsed || 0;
      const estimatedCost = meta?.estimatedCostUsd || result.estimatedCostUsd || 0;

      // 1. Insert into deliberations
      const { data: deliberationData, error: deliberationError } = await this.client
        .from('deliberations')
        .insert({
          query: result.question,
          model,
          provider,
          final_decision: result.finalDecision,
          core_verdict: result.coreVerdict,
          confidence: Number(avgConfidence.toFixed(4)),
          duration_ms: durationMs,
          rounds_count: result.deliberationRoundsCount,
          total_tokens: totalTokens,
          estimated_cost_usd: estimatedCost,
          language,
          decisive_factors: result.decisiveFactors,
          argument_quality_score: result.argumentQualityScore,
          synthesis_summary: result.synthesisSummary,
        })
        .select('id')
        .single();

      if (deliberationError || !deliberationData) {
        console.warn('[MAGI PERSISTENCE] Error saving deliberation record:', deliberationError?.message || 'No data returned');
        return null;
      }

      const deliberationId = deliberationData.id;

      // 2. Prepare agent analyses records (Round 0 + any deliberation rounds)
      const analysesToInsert: any[] = [];

      const formatAnalysis = (agentId: AgentId, roundNumber: number, output: AgentStructuredOutput) => ({
        deliberation_id: deliberationId,
        round_number: roundNumber,
        agent: agentId,
        stance: output.stance,
        confidence: Number((output.confidence || 0.85).toFixed(4)),
        summary: output.summary,
        arguments: output.keyArguments || [],
        risks: output.identifiedRisks || [],
        critical_assumptions: output.criticalAssumptions || [],
        recommendation: output.recommendedAction || '',
        critiques_of_peers: output.critiquesOfPeers || [],
        tokens_used: output.tokensUsed || {},
      });

      // Round 0: Initial independent assessments
      Object.entries(result.initialAnalysis).forEach(([agentId, out]) => {
        analysesToInsert.push(formatAnalysis(agentId as AgentId, 0, out));
      });

      // Subsequent Rounds (1 & 2)
      result.rounds.forEach(r => {
        Object.entries(r.agentOutputs).forEach(([agentId, out]) => {
          analysesToInsert.push(formatAnalysis(agentId as AgentId, r.roundNumber, out));
        });
      });

      if (analysesToInsert.length > 0) {
        const { error: analysesError } = await this.client
          .from('agent_analyses')
          .insert(analysesToInsert);

        if (analysesError) {
          console.warn('[MAGI PERSISTENCE] Warning saving agent analyses:', analysesError.message);
        }
      }

      console.log(`[MAGI PERSISTENCE] Deliberation successfully stored in Supabase (ID: ${deliberationId})`);
      return { id: deliberationId };
    } catch (err: any) {
      console.warn('[MAGI PERSISTENCE] Unexpected error while persisting deliberation:', err.message);
      return null;
    }
  }

  /**
   * Retrieves recent deliberations for history view / dashboard logs.
   */
  async getRecentDeliberations(limit = 10): Promise<DeliberationRecord[]> {
    if (!this.client) return [];

    try {
      const { data, error } = await this.client
        .from('deliberations')
        .select('id, query, created_at, model, provider, final_decision, core_verdict, confidence, duration_ms, rounds_count, total_tokens, estimated_cost_usd, language')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('[MAGI PERSISTENCE] Error fetching recent deliberations:', error.message);
        return [];
      }

      return (data || []) as DeliberationRecord[];
    } catch (err: any) {
      console.warn('[MAGI PERSISTENCE] Error fetching recent deliberations:', err.message);
      return [];
    }
  }
}

export const persistenceService = new SupabasePersistenceService();

import 'dotenv/config';
import { persistenceService } from '../db/supabase.service.js';

async function main() {
  console.log('=============================================================');
  console.log('MAGI V2.1 — SUPABASE PERSISTENCE VALIDATION');
  console.log('=============================================================');

  if (!persistenceService.isConfigured()) {
    console.error('❌ ERROR: Supabase credentials not found in .env (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing).');
    process.exit(1);
  }

  console.log(`🔗 Supabase URL: ${persistenceService.getUrl()}`);
  console.log('⏳ Connecting to Supabase project...\n');

  try {
    const list = await persistenceService.getRecentDeliberations(1);
    console.log('✅ SUPABASE CONNECTION SUCCESSFUL!');
    console.log(`📊 Found ${list.length} existing deliberation records.`);

    if (list.length > 0) {
      console.log('Latest record:', list[0]);
    }

    console.log('\n▶ Testing persistence with sample deliberation...');
    const testResult = await persistenceService.saveDeliberation({
      question: 'Test connectivity deliberation?',
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Connection to Supabase verified successfully.',
      argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 9, CASPER: 9 },
      decisiveFactors: ['Valid credentials', 'Direct SQL schema parity'],
      synthesisSummary: 'Automated connectivity test passed.',
      dissentingOpinionsNoted: [],
      deliberationRoundsCount: 0,
      initialAnalysis: {
        MELCHIOR: {
          agentId: 'MELCHIOR',
          stance: 'APPROVE',
          confidence: 0.95,
          summary: 'Database layer nominal.',
          keyArguments: ['Direct Supabase integration'],
          criticalAssumptions: [],
          identifiedRisks: [],
          recommendedAction: 'Proceed with persistence.',
        },
        BALTHASAR: {
          agentId: 'BALTHASAR',
          stance: 'APPROVE',
          confidence: 0.92,
          summary: 'Security role verified.',
          keyArguments: ['Protected backend access'],
          criticalAssumptions: [],
          identifiedRisks: [],
          recommendedAction: 'Proceed.',
        },
        CASPER: {
          agentId: 'CASPER',
          stance: 'APPROVE',
          confidence: 0.90,
          summary: 'Relational structure conforms to MAGI specification.',
          keyArguments: ['Modular persistence service'],
          criticalAssumptions: [],
          identifiedRisks: [],
          recommendedAction: 'Proceed.',
        },
      },
      rounds: [],
      totalTokensUsed: 1200,
      estimatedCostUsd: 0.0009,
      metadata: {
        timestamp: new Date().toISOString(),
        durationMs: 1250,
        model: 'gemini-3.1-pro-preview',
        provider: 'gemini',
        language: 'English',
        totalTokensUsed: 1200,
        estimatedCostUsd: 0.0009,
      },
    });

    if (testResult) {
      console.log(`✅ Sample deliberation stored with ID: ${testResult.id}`);
      console.log('\n🎉 Phase V2.1 — Supabase Persistence is fully operational!');
    } else {
      console.log('\n⚠️ Could not save sample record. If tables "deliberations" and "agent_analyses" do not exist yet, please run the SQL from src/db/schema.sql in your Supabase SQL Editor.');
    }
  } catch (err: any) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
}

main();

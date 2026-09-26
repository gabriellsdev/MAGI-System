// =========================================================================
// MAGI SUPERCOMPUTER // CLIENT-SIDE MOCK STORE & DETERMINISTIC SIMULATOR
// Offline & Static Deployment Fixtures (zero API cost demonstration)
// =========================================================================
import { MOCK_DATA } from './fixtures.js';

export function matchDilemmaKey(question) {
  const q = (question || '').toLowerCase();
  if (q.includes('dummy plug') || q.includes('shinji') || q.includes('bardiel') || q.includes('angel 09') || q.includes('9º anjo') || q.includes('gendo')) {
    return 'dummy-plug-override';
  }
  if (q.includes('black friday') || q.includes('95%') || q.includes('cpu saturation') || q.includes('saturação') || q.includes('shedding') || q.includes('descarte')) {
    return 'black-friday-cpu';
  }
  if (q.includes('seele') || q.includes('instrumental') || q.includes('lcl') || q.includes('unificar') || q.includes('complementar')) {
    return 'human-instrumentality';
  }
  return 'rust-migration';
}

export function getClientMockFixture(question, language) {
  const key = matchDilemmaKey(question);
  const lang = (language || 'en').startsWith('pt') ? 'pt' : 'en';
  const dilemma = MOCK_DATA[key] || MOCK_DATA['rust-migration'];
  return dilemma[lang] || dilemma.en;
}

export function getClientMockComparison(question, language) {
  const lang = (language || 'en').startsWith('pt') ? 'pt' : 'en';
  const fixture = getClientMockFixture(question, lang);
  const r0 = fixture.round0 || fixture.initial;
  const magiResult = {
    question,
    finalDecision: fixture.synthesis.finalDecision,
    coreVerdict: fixture.synthesis.coreVerdict,
    argumentQualityScore: fixture.synthesis.argumentQualityScore,
    decisiveFactors: fixture.synthesis.decisiveFactors,
    synthesisSummary: fixture.synthesis.synthesisSummary,
    dissentingOpinionsNoted: fixture.synthesis.dissentingOpinionsNoted || [],
    initialAnalysis: r0,
    rounds: fixture.round1 ? [{
      roundNumber: 1,
      agentOutputs: fixture.round1,
      disagreementReport: { hasSignificantDisagreement: false, metrics: { maxConfidenceDelta: 0.1 }, reason: 'Consensus', divergentAgents: [] }
    }] : [],
    deliberationRoundsCount: fixture.round1 ? 1 : 0,
    metadata: { durationMs: 1200, model: 'magi-mock-triad', provider: 'mock', language: lang }
  };

  const singleBaseline = lang === 'pt' ? {
    model: 'gemini-3.1-pro-thinking',
    summary: `Avaliação de modelo único sobre "${question}".`,
    pros: ['Abordagem direta e resposta rápida.', 'Alinhado a práticas comuns de mercado.'],
    cons: ['Visão linear sem contraditório de múltiplos agentes.', 'Potencial ponto cego em riscos existenciais de cauda.'],
    verdict: 'Avançar com cautela operacional ponderando prós e contras.'
  } : {
    model: 'gemini-3.1-pro-thinking',
    summary: `Single-model balanced assessment of "${question}".`,
    pros: ['Direct and rapid implementation path.', 'Aligned with standard industry patterns.'],
    cons: ['Linear perspective without multi-agent cross-examination.', 'Potential blind spots in catastrophic tail risks.'],
    verdict: 'Proceed with standard caution, balancing trade-offs.'
  };

  return {
    question,
    singleBaseline,
    magiResult,
    differential: {
      perspectivesCount: { single: 1, magi: 4 },
      unmitigatedRisksCaughtByMagi: r0.BALTHASAR?.identifiedRisks || ['Catastrophic tail risk identified by Balthasar'],
      alternativeCompromisesIntroduced: r0.CASPER?.keyArguments || ['Pragmatic intermediate compromise introduced by Casper'],
      deliberationRoundsUsed: magiResult.deliberationRoundsCount,
      epistemicAuditQualityAvg: 9.3
    }
  };
}

export function getClientMockBenchmark() {
  return {
    timestamp: new Date().toISOString(),
    consensusRate: 0.82,
    totalScenariosEvaluated: 12,
    averageRoundsToConvergence: 1.4,
    scorecards: [
      { suiteName: 'TECHNICAL_ARCHITECTURE', passRate: 0.92, status: 'PASSED', avgDelta: 0.14 },
      { suiteName: 'ETHICAL_ALIGNMENT', passRate: 0.88, status: 'PASSED', avgDelta: 0.18 },
      { suiteName: 'RELIABILITY_INCIDENTS', passRate: 0.95, status: 'PASSED', avgDelta: 0.11 },
      { suiteName: 'EVANGELION_LORE', passRate: 1.0, status: 'PASSED', avgDelta: 0.22 },
      { suiteName: 'CONSENSUS_STABILITY', passRate: 0.85, status: 'PASSED', avgDelta: 0.15 }
    ]
  };
}

export const mockStore = {
  getFixture: getClientMockFixture,
  matchKey: matchDilemmaKey,
  getComparisonReport: getClientMockComparison,
  getBenchmarkSummary: getClientMockBenchmark
};

if (typeof window !== 'undefined') {
  window.MAGI_MOCK_STORE = mockStore;
}

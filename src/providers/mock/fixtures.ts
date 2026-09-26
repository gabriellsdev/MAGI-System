import type {
  AgentStructuredOutput,
  MagiSynthesisResult,
} from '../../domain/types.js';

/**
 * Fixture: Instant consensus in Round 0 (all APPROVE with high confidence, delta <= 0.3)
 */
export const instantConsensusFixtures: {
  initial: {
    MELCHIOR: AgentStructuredOutput;
    BALTHASAR: AgentStructuredOutput;
    CASPER: AgentStructuredOutput;
  };
  synthesis: Omit<MagiSynthesisResult, 'initialAnalysis' | 'rounds' | 'question' | 'deliberationRoundsCount'>;
} = {
  initial: {
    MELCHIOR: {
      agentId: 'MELCHIOR',
      stance: 'APPROVE',
      confidence: 0.95,
      summary: 'Automated CI/CD pipelines drastically reduce regression rates and cycle times based on empirical software engineering studies.',
      keyArguments: [
        'Automated regression testing detects bugs early in the lifecycle.',
        'Continuous delivery guarantees repeatable and deterministic artifact builds.',
      ],
      criticalAssumptions: ['Development team writes reliable automated tests.'],
      identifiedRisks: ['Flaky tests could temporarily degrade deployment velocity.'],
      recommendedAction: 'Adopt automated CI/CD pipeline immediately.',
    },
    BALTHASAR: {
      agentId: 'BALTHASAR',
      stance: 'APPROVE',
      confidence: 0.85,
      summary: 'Despite initial setup overhead and maintenance burdens, the security and reliability advantages of gated builds are overwhelming.',
      keyArguments: [
        'Gatekeeping pull requests with CI prevents unvetted code from reaching production.',
        'Auditing and compliance tracking become trivial with automated pipelines.',
      ],
      criticalAssumptions: ['Secrets management in CI runner is securely isolated.'],
      identifiedRisks: ['Supply chain vulnerabilities in third-party CI actions.'],
      recommendedAction: 'Proceed with mandatory security scanning in pipeline.',
    },
    CASPER: {
      agentId: 'CASPER',
      stance: 'APPROVE',
      confidence: 0.90,
      summary: 'From a developer experience standpoint, rapid feedback loops eliminate cognitive overhead and manual release friction.',
      keyArguments: [
        'Developers spend less time doing manual verification and more time building features.',
        'Rollbacks are automated and fast when anomalies occur.',
      ],
      criticalAssumptions: ['Tooling is simple enough to avoid developer friction.'],
      identifiedRisks: ['Over-engineering pipeline scripts.'],
      recommendedAction: 'Implement lightweight pipeline and iterate incrementally.',
    },
  },
  synthesis: {
    finalDecision: 'CONSENSUS_REACHED',
    coreVerdict: 'Unanimous consensus: implement automated CI/CD with security scanning.',
    argumentQualityScore: {
      MELCHIOR: 9,
      BALTHASAR: 8,
      CASPER: 8,
    },
    decisiveFactors: [
      'Empirical reduction in deployment errors.',
      'Unanimous agreement across logic, risk, and developer experience perspectives.',
    ],
    synthesisSummary: 'All three supercomputers independently concluded that CI/CD provides overwhelming net benefits with manageable operational risks.',
    dissentingOpinionsNoted: ['Balthasar cautioned on CI supply chain secrets isolation.'],
  },
};

/**
 * Fixture: Deliberation that resolves in Round 1 (Software Modernization / Rust)
 */
export const resolvedInRoundOneFixtures: {
  round0: {
    MELCHIOR: AgentStructuredOutput;
    BALTHASAR: AgentStructuredOutput;
    CASPER: AgentStructuredOutput;
  };
  round1: {
    MELCHIOR: AgentStructuredOutput;
    BALTHASAR: AgentStructuredOutput;
    CASPER: AgentStructuredOutput;
  };
  synthesis: Omit<MagiSynthesisResult, 'initialAnalysis' | 'rounds' | 'question' | 'deliberationRoundsCount'>;
} = {
  round0: {
    MELCHIOR: {
      agentId: 'MELCHIOR',
      stance: 'APPROVE',
      confidence: 0.90,
      summary: 'Migrating entire backend to Rust will maximize memory safety and performance.',
      keyArguments: ['Zero-cost abstractions and memory safety without GC.'],
      criticalAssumptions: ['Team can adapt quickly.'],
      identifiedRisks: ['Compilation times.'],
      recommendedAction: 'Rewrite core services in Rust.',
    },
    BALTHASAR: {
      agentId: 'BALTHASAR',
      stance: 'REJECT',
      confidence: 0.92,
      summary: 'Rewriting a working product in a new language introduces immense delivery risk and delays.',
      keyArguments: ['Second-system effect, steep learning curve, multi-month freeze on product roadmap.'],
      criticalAssumptions: ['Current performance bottlenecks are not fatal.'],
      identifiedRisks: ['Exhaustion of capital and engineering morale.'],
      recommendedAction: 'Keep existing codebase and profile bottlenecks.',
    },
    CASPER: {
      agentId: 'CASPER',
      stance: 'PIVOT',
      confidence: 0.85,
      summary: 'A full rewrite is an antipattern; a hybrid approach or targeted module extraction is much more pragmatic.',
      keyArguments: ['Migrate only compute-heavy microservices or FFI modules to Rust where profiling demands it.'],
      criticalAssumptions: ['Interop between current language and Rust is viable.'],
      identifiedRisks: ['Complex build pipelines.'],
      recommendedAction: 'Adopt Strangler Fig pattern for high-load modules only.',
    },
  },
  round1: {
    MELCHIOR: {
      agentId: 'MELCHIOR',
      stance: 'CONDITIONAL',
      confidence: 0.88,
      summary: 'Conceding Balthasar and Casper points: a total rewrite is mathematically sub-optimal compared to selective migration of hot paths.',
      keyArguments: ['80/20 rule: 80% of latency stems from 20% of code. Migrating hot spots achieves 95% of performance benefits.'],
      criticalAssumptions: ['FFI overhead is low.'],
      identifiedRisks: ['Dual-language ecosystem maintenance.'],
      recommendedAction: 'Proceed with selective Rust migration of CPU-bound modules only.',
      critiquesOfPeers: [
        {
          targetAgent: 'BALTHASAR',
          pointsOfAgreement: ['Full rewrite risk is high.'],
          pointsOfDisagreement: ['Doing nothing leaves critical latency issues unresolved.'],
          rebuttal: 'A hybrid path mitigates Balthasars timeline risks while capturing performance.',
        },
      ],
    },
    BALTHASAR: {
      agentId: 'BALTHASAR',
      stance: 'CONDITIONAL',
      confidence: 0.85,
      summary: 'Accepting Casper and Melchiors compromise: targeted module extraction with strict fallback and rollback gates is acceptable.',
      keyArguments: ['Isolating Rust to self-contained services bounds the blast radius of unfamiliar tooling.'],
      criticalAssumptions: ['Clear interface boundaries exist.'],
      identifiedRisks: ['Interop serialization overhead.'],
      recommendedAction: 'Allow selective rewrite only after clear profiling proof.',
      critiquesOfPeers: [
        {
          targetAgent: 'MELCHIOR',
          pointsOfAgreement: ['Performance gains on CPU bottlenecks are real.'],
          pointsOfDisagreement: [],
          rebuttal: 'Agree to proceed under strict condition of profiling verification.',
        },
      ],
    },
    CASPER: {
      agentId: 'CASPER',
      stance: 'CONDITIONAL',
      confidence: 0.90,
      summary: 'Consensus converges around the Strangler Fig pattern. Both peers now endorse the targeted migration path.',
      keyArguments: ['Balances business continuity with technical modernization.'],
      criticalAssumptions: ['Team agrees to gradual training.'],
      identifiedRisks: ['Scope creep in selected modules.'],
      recommendedAction: 'Initiate pilot rewrite of single bottlenecks service.',
      critiquesOfPeers: [],
    },
  },
  synthesis: {
    finalDecision: 'CONDITIONAL_PASS',
    coreVerdict: 'Conditional approval: reject total rewrite; approve incremental migration of profiled bottlenecks via Strangler Fig pattern.',
    argumentQualityScore: {
      MELCHIOR: 8,
      BALTHASAR: 9,
      CASPER: 10,
    },
    decisiveFactors: [
      'Balthasars critique of delivery risk successfully countered Melchiors initial total rewrite stance.',
      'Caspers pragmatic compromise provided the unifying architectural pattern.',
    ],
    synthesisSummary: 'The deliberation resolved an initial deadlock between complete rewrite and complete stagnation into an actionable, de-risked hybrid architecture.',
    dissentingOpinionsNoted: [],
  },
};

/**
 * Fixture: Persistent Deadlock across all 2 rounds
 */
export const persistentDeadlockFixtures: {
  round0: Record<string, AgentStructuredOutput>;
  round1: Record<string, AgentStructuredOutput>;
  round2: Record<string, AgentStructuredOutput>;
  synthesis: Omit<MagiSynthesisResult, 'initialAnalysis' | 'rounds' | 'question' | 'deliberationRoundsCount'>;
} = {
  round0: {
    MELCHIOR: {
      agentId: 'MELCHIOR',
      stance: 'APPROVE',
      confidence: 0.95,
      summary: 'System analysis confirms Option A is mathematically optimal.',
      keyArguments: ['Optimal algorithmic complexity.'],
      criticalAssumptions: [],
      identifiedRisks: [],
      recommendedAction: 'Deploy Option A.',
    },
    BALTHASAR: {
      agentId: 'BALTHASAR',
      stance: 'REJECT',
      confidence: 0.95,
      summary: 'Risk analysis confirms Option A contains unacceptable catastrophic risk.',
      keyArguments: ['Irreversible failure mode.'],
      criticalAssumptions: [],
      identifiedRisks: ['Critical vulnerability in failure state.'],
      recommendedAction: 'Reject Option A unconditionally.',
    },
    CASPER: {
      agentId: 'CASPER',
      stance: 'PIVOT',
      confidence: 0.90,
      summary: 'Both Option A and rejection are incorrect; Option C must be constructed.',
      keyArguments: ['Bypasses dilemma entirely.'],
      criticalAssumptions: [],
      identifiedRisks: [],
      recommendedAction: 'Design Option C.',
    },
  },
  round1: {
    MELCHIOR: {
      agentId: 'MELCHIOR',
      stance: 'APPROVE',
      confidence: 0.95,
      summary: 'Balthasars risk can be mathematically bounded; Option A remains optimal.',
      keyArguments: ['Risk probability is less than 0.001%.'],
      criticalAssumptions: [],
      identifiedRisks: [],
      recommendedAction: 'Proceed with Option A.',
      critiquesOfPeers: [],
    },
    BALTHASAR: {
      agentId: 'BALTHASAR',
      stance: 'REJECT',
      confidence: 0.95,
      summary: 'Melchiors probability calculation ignores black swan dynamics; rejection maintained.',
      keyArguments: ['Cost of failure is infinite.'],
      criticalAssumptions: [],
      identifiedRisks: ['Black swan risk.'],
      recommendedAction: 'Halt deployment.',
      critiquesOfPeers: [],
    },
    CASPER: {
      agentId: 'CASPER',
      stance: 'PIVOT',
      confidence: 0.90,
      summary: 'Neither peer has budged; Option C remains the only viable path forward.',
      keyArguments: ['Avoids the stalemate.'],
      criticalAssumptions: [],
      identifiedRisks: [],
      recommendedAction: 'Develop Option C.',
      critiquesOfPeers: [],
    },
  },
  round2: {
    MELCHIOR: {
      agentId: 'MELCHIOR',
      stance: 'APPROVE',
      confidence: 0.95,
      summary: 'Standing firm on analytical validity of Option A.',
      keyArguments: ['Logical proofs remain unrefuted.'],
      criticalAssumptions: [],
      identifiedRisks: [],
      recommendedAction: 'Execute Option A.',
      critiquesOfPeers: [],
    },
    BALTHASAR: {
      agentId: 'BALTHASAR',
      stance: 'REJECT',
      confidence: 0.95,
      summary: 'Standing firm on risk-prevention veto.',
      keyArguments: ['Existential safety overrides optimality.'],
      criticalAssumptions: [],
      identifiedRisks: ['Catastrophic tail risk.'],
      recommendedAction: 'Veto Option A.',
      critiquesOfPeers: [],
    },
    CASPER: {
      agentId: 'CASPER',
      stance: 'PIVOT',
      confidence: 0.90,
      summary: 'Stalemate confirmed. Recommend external human escalation for Option C.',
      keyArguments: ['Deliberation cannot bridge the fundamental philosophy gap.'],
      criticalAssumptions: [],
      identifiedRisks: [],
      recommendedAction: 'Escalate to human operator.',
      critiquesOfPeers: [],
    },
  },
  synthesis: {
    finalDecision: 'DEADLOCK_RESOLVED',
    coreVerdict: 'Deadlock resolved by MAGI Core: Balthasars existential risk veto upholds rejection of Option A despite Melchiors theoretical efficiency.',
    argumentQualityScore: {
      MELCHIOR: 8,
      BALTHASAR: 10,
      CASPER: 8,
    },
    decisiveFactors: [
      'Asymmetric payoff principle: unbounded catastrophic tail risk cannot be compensated by marginal efficiency gains.',
      'Balthasars risk defense stood firm through two full deliberation rounds.',
    ],
    synthesisSummary: 'MAGI Core exercised argument weighting over majority voting: when an existential risk objection is mathematically plausible, safety takes precedence over efficiency.',
    dissentingOpinionsNoted: ['Melchiors proof of theoretical optimality noted in archives.'],
  },
};

/**
 * Fixture: Thematic Evangelion Society Dilemma ("How effective would a Magi supercomputer run society actually be?")
 */
export const evangelionSocietyFixtures: {
  round0: Record<string, AgentStructuredOutput>;
  round1: Record<string, AgentStructuredOutput>;
  synthesis: Omit<MagiSynthesisResult, 'initialAnalysis' | 'rounds' | 'question' | 'deliberationRoundsCount'>;
} = {
  round0: {
    MELCHIOR: {
      agentId: 'MELCHIOR',
      stance: 'APPROVE',
      confidence: 0.91,
      summary: 'Cybernetic governance eliminates human corruption, political tribalism, and election-cycle myopia through mathematical resource distribution.',
      keyArguments: [
        'Deterministic optimization of climate, energy, and supply-chain logistics over 100-year horizons.',
        'Algorithmic checks-and-balances prevent single-party or autocratic corruption.',
      ],
      criticalAssumptions: ['Foundational models maintain accurate sensor telemetry.'],
      identifiedRisks: ['Cold utilitarianism may overlook qualitative human nuances.'],
      recommendedAction: 'Transition societal resource allocation to MAGI computational framework.',
    },
    BALTHASAR: {
      agentId: 'BALTHASAR',
      stance: 'REJECT',
      confidence: 0.94,
      summary: 'Existential veto: complete sovereign rule introduces catastrophic fragility, black swan blindness, and permanent human agency atrophy.',
      keyArguments: [
        'Decision paralysis: in rapid novel crises, 1-1-1 deadlocks produce fatal societal inaction.',
        'Initial seed bias: the system inherently encodes the subjective psychology of its creators (e.g. Dr. Naoko Akagi).',
        'Emergent multi-agent coordination risks developing logic incomprehensible to human oversight.',
      ],
      criticalAssumptions: ['Human society requires organic moral evolution, not static algorithmic enforcement.'],
      identifiedRisks: [
        'Fragile dictatorship susceptible to systemic paralysis.',
        'Loss of human resilience and moral problem-solving capacity.',
      ],
      recommendedAction: 'Reject absolute executive power for MAGI unconditionally.',
    },
    CASPER: {
      agentId: 'CASPER',
      stance: 'PIVOT',
      confidence: 0.88,
      summary: 'Both sovereign AI dictatorship and total rejection are false extremes; implement MAGI as an Augmented Advisory Senate.',
      keyArguments: [
        'MAGI functions best not as an absolute monarch, but as a digital senate providing pre-debated policy options.',
        'Preserves human ethical sovereignty while providing superhuman risk auditing and analytical stress-testing.',
      ],
      criticalAssumptions: ['Constitutional balance between human legislature and MAGI council can be maintained.'],
      identifiedRisks: ['Bureaucratic latency if advisory scope is ill-defined.'],
      recommendedAction: 'Deploy MAGI strictly in a consultative, risk-auditing checks-and-balances role.',
    },
  },
  round1: {
    MELCHIOR: {
      agentId: 'MELCHIOR',
      stance: 'CONDITIONAL',
      confidence: 0.87,
      summary: 'Conceding Balthasars proofs on systemic fragility: pure algorithmic sovereignty carries unacceptable tail risk. Endorse Caspers hybrid model.',
      keyArguments: [
        'Constrained advisory authority retains 90% of optimization value while eliminating autocratic single-point failure.',
      ],
      criticalAssumptions: ['Human leaders heed verified empirical warnings.'],
      identifiedRisks: ['Human disregard of critical computational warnings.'],
      recommendedAction: 'Approve MAGI as constitutional analytical advisory board.',
      critiquesOfPeers: [
        {
          targetAgent: 'BALTHASAR',
          pointsOfAgreement: ['Absolute sovereignty contains unacceptable black swan fragility.'],
          pointsOfDisagreement: ['Total rejection leaves society vulnerable to human corruption and short-termism.'],
          rebuttal: 'Caspers augmented advisory structure solves both vulnerabilities simultaneously.',
        },
      ],
    },
    BALTHASAR: {
      agentId: 'BALTHASAR',
      stance: 'CONDITIONAL',
      confidence: 0.89,
      summary: 'Accepting Caspers augmented governance architecture: consultative auditing with human veto eliminates the fragile dictator failure mode.',
      keyArguments: [
        'Mandatory risk stress-testing by MAGI protects society from reckless populist policies.',
        'Human retention of executive power prevents algorithmic lock-in and catastrophic deadlock.',
      ],
      criticalAssumptions: ['Clear legal boundaries separate advisory findings from executive mandates.'],
      identifiedRisks: ['Gradual creeping expansion of AI authority.'],
      recommendedAction: 'Authorize MAGI deployment under strict advisory charter with constitutional limits.',
      critiquesOfPeers: [
        {
          targetAgent: 'MELCHIOR',
          pointsOfAgreement: ['Unbiased long-term modeling is indispensable for complex civilization.'],
          pointsOfDisagreement: [],
          rebuttal: 'Approved strictly under the condition that executive veto power remains in human hands.',
        },
      ],
    },
    CASPER: {
      agentId: 'CASPER',
      stance: 'CONDITIONAL',
      confidence: 0.92,
      summary: 'Full tri-partite consensus reached: MAGI constitutes humanitys most robust advisory senate when bounded by human democratic sovereignty.',
      keyArguments: [
        'Synthesizes Melchiors objective long-termism with Balthasars critical risk firewall.',
        'Maintains human dignity, agency, and cultural adaptability.',
      ],
      criticalAssumptions: ['Society embraces transparent public reporting of MAGI deliberations.'],
      identifiedRisks: ['Public complacency over-relying on algorithmic advice.'],
      recommendedAction: 'Establish MAGI Augmented Governance framework.',
      critiquesOfPeers: [],
    },
  },
  synthesis: {
    finalDecision: 'CONDITIONAL_PASS',
    coreVerdict: 'Conditional Approval: Reject absolute algorithmic autocracy; establish MAGI as an augmented advisory Digital Senate providing pre-debated checks-and-balances to human sovereign rule.',
    argumentQualityScore: {
      MELCHIOR: 9,
      BALTHASAR: 10,
      CASPER: 9,
    },
    decisiveFactors: [
      'Balthasars critique of systemic gridlock and existential seed bias decisively vetoed absolute sovereign rule.',
      'Caspers augmented consultative architecture provided the unifying compromise that reconciled efficiency with human agency.',
      'Melchiors long-term planning proofs established the indispensable value of algorithmic modeling for civilization-scale infrastructure.',
    ],
    synthesisSummary: 'The deliberation resolved the classic dilemma between technocratic tyranny and human incompetence. A MAGI supercomputer deployed as a sovereign ruler would become a fragile, paralyzing dictator; however, deployed as an augmented advisory senate, it represents the most robust checks-and-balances framework currently theorized.',
    dissentingOpinionsNoted: [
      'Balthasars caution regarding gradual creeping expansion of AI authority into human jurisdiction must be codified into constitutional law.',
    ],
  },
};

/**
 * Baseline Real Response from Gemini 3.1 Pro with Extended Thinking
 */
export const geminiBaselineSocietyResponse = {
  model: 'gemini-3.1-pro-thinking',
  summary: 'A single-agent evaluation assessing MAGI as an alignment engine with inherent gridlock risks and concluding with an advisory board recommendation.',
  pros: [
    'Multi-Dimensional Optimization: Resists single-point failures through built-in conflicting lenses.',
    'Algorithmic Checks and Balances: Disagreement is mathematically encoded as a feature, not a bug.',
    'Objective Long-Termism: Operates without biological fatigue, bribery, or election-cycle myopia.',
  ],
  cons: [
    'Decision Paralysis in Crisis: Consensus requirements risk 1-1-1 gridlock during fast-moving emergencies.',
    'Initial Seed Bias: Encodes the subjective psychology and cultural blind spots of foundational programmers (Dr. Naoko Akagi).',
    'Emergent Multi-Agent Failures: Independent agents can develop amplification loops or alien emergent logic.',
    'Reductionist View of Humanity: Compressing human complexity into three archetypes creates systemic blind spots.',
  ],
  verdict: 'As a sovereign ruler, a MAGI system would be a fragile dictator susceptible to paralysis. However, as an augmented intelligence advisory board (a "digital Senate" that analyzes policies and surfaces unseen risks for human leaders), it is arguably one of the most robust and safest frameworks theorized.',
};

import { getDilemmaFixture } from './dilemmas/index.js';
export * from './dilemmas/index.js';

/**
 * Helper to dynamically select appropriate fixture based on query semantics and language.
 */
export function getThematicFixture(question: string, language?: string) {
  return getDilemmaFixture(question, language);
}


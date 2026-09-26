// =========================================================================
// MAGI SUPERCOMPUTER // OPERATOR DEBUG SUITE & SIMULATION TRIGGERS
// Autonomous interactive test harness for anime and tactical consensus flows
// Restricted to authenticated operators
// =========================================================================
import { isOperatorAuthenticated, setOperatorOverride, recordExecutionTelemetry } from '../core/state.js';
import { playBeep, playNervTripletBeep, playConsensusChime, playImpasseAlarm } from './audio.js';
import {
  resetAnimeStandby,
  startAnimeDeliberation,
  renderAnimeAgent,
  renderAnimeResolution,
  addChatUserQuery,
  addChatAgentMessage,
  addChatGateNotice,
  addChatSynthesisMessage,
} from '../views/anime.js';
import { renderTacticalAgent, renderTacticalCore } from '../views/tactical.js';
import { renderMagiCore, setupAgentTabs, renderLiveAgentOutput } from '../views/diagnostic.js';
import { resetStepper, setTimelineStatus } from '../components/timeline.js';

let activeDebugTimeouts = [];
let simElements = {};
let simCallbacks = {};

export function cancelDebugSimulation() {
  activeDebugTimeouts.forEach(t => clearTimeout(t));
  activeDebugTimeouts = [];
}

export function syncOperatorDebugUI(isOperator) {
  const {
    debugSection,
    floatingOperatorDock,
    toolsMenuBtn,
  } = simElements;

  if (debugSection) {
    if (isOperator) {
      debugSection.classList.remove('hidden');
    } else {
      debugSection.classList.add('hidden');
    }
  }

  if (floatingOperatorDock) {
    if (isOperator) {
      floatingOperatorDock.classList.remove('hidden');
    } else {
      floatingOperatorDock.classList.add('hidden');
    }
  }
}

export function initDebugSimulation(elements = {}, callbacks = {}) {
  simElements = elements;
  simCallbacks = callbacks;

  const {
    debugTriggerThinking,
    debugTriggerRounds,
    debugTriggerEmergency,
    debugTriggerReset,
    dockBtnThinking,
    dockBtnRounds,
    dockBtnEmergency,
    dockBtnReset,
  } = elements;

  debugTriggerThinking?.addEventListener('click', triggerDebugThinking);
  debugTriggerRounds?.addEventListener('click', triggerDebugRoundsSimulation);
  debugTriggerEmergency?.addEventListener('click', triggerDebugEmergencyRejection);
  debugTriggerReset?.addEventListener('click', triggerDebugResetStandby);

  dockBtnThinking?.addEventListener('click', triggerDebugThinking);
  dockBtnRounds?.addEventListener('click', triggerDebugRoundsSimulation);
  dockBtnEmergency?.addEventListener('click', triggerDebugEmergencyRejection);
  dockBtnReset?.addEventListener('click', triggerDebugResetStandby);
}

export function triggerDebugThinking() {
  if (!isOperatorAuthenticated()) {
    alert('ACESSO NEGADO // OPERADOR NÃO AUTENTICADO\n\nEstes disparos de depuração são restritos ao operador do sistema com a chave de acesso.');
    return;
  }

  cancelDebugSimulation();

  const simulatedQuestion = 'DEBUG // SIMULATION OF PARALLEL DELIBERATIVE REASONING';
  simCallbacks.syncQueryDisplay?.(simulatedQuestion);
  startAnimeDeliberation(simulatedQuestion);

  // Update Tactical View
  const {
    tacticalFlowStatus,
    tacticalArrow1,
    tacticalArrow2,
    tacticalCoreBox,
    tacticalCoreDecision,
    tacticalCoreConf,
    tacticalCoreVerdict,
    timelineSection,
    magiCoreSection,
  } = simElements;

  if (tacticalFlowStatus) {
    tacticalFlowStatus.textContent = 'DELIBERATING // EVIDENCE GATHERING & REASONING ACTIVE';
    tacticalFlowStatus.className = 'tactical-flow-status deliberating';
  }
  tacticalArrow1?.classList.add('active');
  tacticalArrow2?.classList.add('active');
  if (tacticalCoreBox) {
    tacticalCoreBox.classList.remove('resolved', 'epistemic-halt');
  }
  if (tacticalCoreDecision) tacticalCoreDecision.textContent = 'PROCESSING...';
  if (tacticalCoreConf) tacticalCoreConf.textContent = '--%';
  if (tacticalCoreVerdict) {
    tacticalCoreVerdict.textContent = 'SUPERCOMPUTER TRI-SYSTEM ACTIVELY ENGAGED IN PARALLEL DELIBERATION.';
  }

  // Update Diagnostic View
  timelineSection?.classList.remove('hidden');
  magiCoreSection?.classList.add('hidden');
  resetStepper();
  document.getElementById('step-r0')?.classList.add('active');
  setTimelineStatus('SYNCHRONIZING INDEPENDENT SUPERCOMPUTERS (PARALLEL R0)...');

  playNervTripletBeep('processing');
}

export function triggerDebugRoundsSimulation() {
  if (!isOperatorAuthenticated()) {
    alert('ACESSO NEGADO // OPERADOR NÃO AUTENTICADO\n\nEstes disparos de depuração são restritos ao operador do sistema com a chave de acesso.');
    return;
  }

  cancelDebugSimulation();

  setOperatorOverride(true, 'rust-migration-debug');
  recordExecutionTelemetry('operator-override', { preset: 'rust-migration-debug' });

  const debugQuestion = 'Should we migrate the backend to Rust?';
  simCallbacks.syncQueryDisplay?.(debugQuestion);
  simCallbacks.setQueryCollapsed?.(true);
  addChatUserQuery(debugQuestion);

  startAnimeDeliberation(debugQuestion);
  simElements.timelineSection?.classList.remove('hidden');
  simElements.magiCoreSection?.classList.add('hidden');
  resetStepper();
  document.getElementById('step-r0')?.classList.add('active');
  setTimelineStatus('[R0: INDEPENDENT ANALYSIS] CORES GENERATING AUTONOMOUS REASONING...');
  playNervTripletBeep('processing');

  const debugRustResult = {
    question: debugQuestion,
    source: 'operator-override',
    operatorOverride: true,
    animationPreset: 'rust-migration-debug',
    language: 'en',
    deliberationRoundsCount: 1,
    initialAnalysis: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.90,
        summary: 'Migrating entire backend to Rust will maximize memory safety and performance.',
        keyArguments: ['Zero-cost abstractions and memory safety without GC overhead.'],
        identifiedRisks: ['Ecosystem learning curve for new developers.'],
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.92,
        summary: 'Massive engineering cost without corresponding customer value; high rewrite failure probability.',
        keyArguments: ['Opportunity cost during months of porting existing codebase.'],
        identifiedRisks: ['Team productivity slump and slow delivery during transition.'],
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'PIVOT',
        confidence: 0.85,
        summary: 'Hybrid migration strategy: Rewrite high-throughput microservices in Rust first, leave glue in TypeScript.',
        keyArguments: ['Pragmatic compromise balances safety benefits with rapid delivery.'],
        identifiedRisks: ['FFI boundary serialization overhead.'],
      },
    },
    rounds: [
      {
        roundNumber: 1,
        agentOutputs: {
          MELCHIOR: {
            stance: 'APPROVE',
            confidence: 0.94,
            summary: 'Concedes that hybrid migration eliminates delivery risks while locking down critical hotspots in Rust.',
            keyArguments: ['Targeting hot compute paths in Rust solves core stability issues.'],
            identifiedRisks: ['Complex inter-service RPC contracts.'],
            critiquesOfPeers: [{ targetAgent: 'BALTHASAR', rebuttal: 'Refusal to modernize accrues unbounded technical debt.' }],
          },
          BALTHASAR: {
            stance: 'APPROVE',
            confidence: 0.82,
            summary: 'Yields conditional approval provided strict performance milestones are proven in milestone pilot.',
            keyArguments: ['Accepts scoped hybrid migration under invariant verification.'],
            identifiedRisks: ['Team friction if hybrid boundary is poorly specified.'],
            critiquesOfPeers: [{ targetAgent: 'CASPER', rebuttal: 'Architecture boundary must be strictly airgapped.' }],
          },
          CASPER: {
            stance: 'APPROVE',
            confidence: 0.92,
            summary: 'Synthesis confirmed: Incremental Rust pilot satisfies all triad criteria.',
            keyArguments: ['Unanimous alignment reached on staged rollout.'],
            identifiedRisks: ['Monitoring overhead.'],
          },
        },
      },
    ],
    finalDecision: 'CONDITIONAL_PASS',
    coreVerdict: 'APPROVE HYBRID ADOPTION: Authorize incremental Rust migration exclusively for high-throughput computational kernels.',
    synthesisSummary: 'The triad achieved convergence after 1 round of critique. Initial impasse resolved via hybrid phased transition.',
    decisiveFactors: ['Memory safety without GC pauses', 'De-risked via incremental microservices rollout'],
    argumentQualityScore: { MELCHIOR: 9.2, BALTHASAR: 8.8, CASPER: 9.4 },
    metadata: {
      durationMs: 3420,
      model: 'DEBUG-SIMULATOR',
      language: 'en',
      totalTokensUsed: 4210,
      estimatedCostUsd: 0.0042,
    },
  };

  // Stage 1: Round 0 outputs arrive (1600ms)
  activeDebugTimeouts.push(setTimeout(() => {
    ['MELCHIOR', 'BALTHASAR', 'CASPER'].forEach(id => {
      const output = debugRustResult.initialAnalysis[id];
      renderAnimeAgent(id, output);
      renderTacticalAgent(id, output);
      renderLiveAgentOutput(id, 0, output);
      addChatAgentMessage(id, 0, output);
    });

    document.getElementById('step-r0')?.classList.remove('active');
    document.getElementById('step-r0')?.classList.add('passed');
    document.getElementById('step-gate1')?.classList.add('active');

    setTimelineStatus('GATE 1: COGNITIVE DIVERGENCE DETECTED (Δ 82%) // INITIATING ROUND 1 CROSS-EXAMINATION');
    addChatGateNotice('disagreement', 'Cognitive Divergence Δ 82% at Gate 1 // Cross-Examination Triggered');
    playBeep(320, 0.08, 'sawtooth');
  }, 1600));

  // Stage 2: Round 1 Cross-Examination (3400ms)
  activeDebugTimeouts.push(setTimeout(() => {
    document.getElementById('step-gate1')?.classList.remove('active');
    document.getElementById('step-gate1')?.classList.add('passed');
    document.getElementById('step-r1')?.classList.add('active');

    setTimelineStatus('[R1: CROSS-EXAMINATION] TRIAD REBUTTING COUNTERARGUMENTS...');

    const r1 = debugRustResult.rounds[0].agentOutputs;
    ['MELCHIOR', 'BALTHASAR', 'CASPER'].forEach(id => {
      renderAnimeAgent(id, r1[id]);
      renderTacticalAgent(id, r1[id]);
      renderLiveAgentOutput(id, 1, r1[id]);
      addChatAgentMessage(id, 1, r1[id]);
    });

    playBeep(520, 0.04, 'triangle');
  }, 3400));

  // Stage 3: Gate 2 Convergence Verification (5200ms)
  activeDebugTimeouts.push(setTimeout(() => {
    document.getElementById('step-r1')?.classList.remove('active');
    document.getElementById('step-r1')?.classList.add('passed');
    document.getElementById('step-gate2')?.classList.add('active');

    setTimelineStatus('GATE 2: CONSENSUS CONVERGENCE ACHIEVED (Δ 12%) // DISPATCHING TO MAGI CORE');
    addChatGateNotice('consensus', 'Consensus Convergence Verified (Δ 12%) at Gate 2');
    playBeep(640, 0.05, 'sine');
  }, 5200));

  // Stage 4: Core Arbitration & Final Resolution (6800ms)
  activeDebugTimeouts.push(setTimeout(() => {
    document.getElementById('step-gate2')?.classList.remove('active');
    document.getElementById('step-gate2')?.classList.add('passed');
    document.getElementById('step-core')?.classList.add('active', 'passed');

    renderTacticalCore(debugRustResult);
    renderAnimeResolution(debugRustResult);
    renderMagiCore(debugRustResult);

    simCallbacks.onDeliberationComplete?.(debugRustResult);

    ['MELCHIOR', 'BALTHASAR', 'CASPER'].forEach(agentId => {
      setupAgentTabs(agentId, 1, (aid, rnum) => {
        const out = rnum === 0 ? debugRustResult.initialAnalysis[aid] : debugRustResult.rounds[0].agentOutputs[aid];
        renderLiveAgentOutput(aid, rnum, out);
      });
    });

    addChatSynthesisMessage(debugRustResult);
    setTimelineStatus('DELIBERATION CONVERGED AFTER 1 ROUND // ARBITRATION SYNTHESIZED');
    if (simElements.tacticalFlowStatus) {
      simElements.tacticalFlowStatus.textContent = 'ARBITRATION SYNTHESIS COMPLETE // CONDITIONAL APPROVAL';
    }
    playConsensusChime();
  }, 6800));
}

export function triggerDebugEmergencyRejection() {
  if (!isOperatorAuthenticated()) {
    alert('ACESSO NEGADO // OPERADOR NÃO AUTENTICADO\n\nEstes disparos de depuração são restritos ao operador do sistema com a chave de acesso.');
    return;
  }

  cancelDebugSimulation();

  setOperatorOverride(true, 'emergency-rejection');
  recordExecutionTelemetry('operator-override', { preset: 'emergency-rejection' });

  const {
    animeCrtMonitor,
    animeConsensusStamp,
    animeStampText,
    animeResolutionLabel,
    animeExMode,
    animeScreenBalthasar,
    animeVoteBalthasar,
    animeConfBalthasar,
    animeScreenCasper,
    animeVoteCasper,
    animeConfCasper,
    animeScreenMelchior,
    animeVoteMelchior,
    animeConfMelchior,
    tacticalCoreBox,
    tacticalCoreDecision,
    tacticalCoreConf,
    tacticalCoreVerdict,
    tacticalFlowStatus,
    timelineSection,
  } = simElements;

  const animeOriginTag = document.getElementById('anime-origin-tag');
  if (animeOriginTag) {
    animeOriginTag.textContent = 'OPERATOR OVERRIDE';
    animeOriginTag.className = 'anime-origin-tag override';
  }
  const tacticalOriginBadge = document.getElementById('tactical-origin-badge');
  if (tacticalOriginBadge) {
    tacticalOriginBadge.textContent = 'OPERATOR OVERRIDE';
    tacticalOriginBadge.className = 'origin-badge override tactical-origin-tag';
  }

  if (animeCrtMonitor) animeCrtMonitor.classList.add('emergency-alarm');
  if (animeConsensusStamp) {
    animeConsensusStamp.className = 'anime-stamp-box stamp-rejected';
    if (animeStampText) animeStampText.textContent = '拒 否';
  }
  if (animeResolutionLabel) animeResolutionLabel.textContent = 'RESOLUTION: REJECTED // IMPASSE';
  if (animeExMode) animeExMode.textContent = 'CRITICAL';

  const screens = [
    { screen: animeScreenBalthasar, vote: animeVoteBalthasar, conf: animeConfBalthasar },
    { screen: animeScreenCasper, vote: animeVoteCasper, conf: animeConfCasper },
    { screen: animeScreenMelchior, vote: animeVoteMelchior, conf: animeConfMelchior },
  ];

  screens.forEach(({ screen, vote, conf }) => {
    if (screen) {
      screen.className = screen.className.replace(/state-\w+/g, '').trim();
      screen.classList.add('state-rejected');
    }
    if (vote) vote.textContent = 'REJECTED';
    if (conf) conf.textContent = '100%';
  });

  if (tacticalCoreBox) {
    tacticalCoreBox.classList.add('resolved', 'epistemic-halt');
  }
  if (tacticalCoreDecision) tacticalCoreDecision.textContent = '[EPISTEMIC HALT // REJECTED]';
  if (tacticalCoreConf) tacticalCoreConf.textContent = '100%';
  if (tacticalCoreVerdict) {
    tacticalCoreVerdict.textContent = 'IRRECONCILABLE SYSTEMIC DISAGREEMENT: CONSENSUS FAILED. EMERGENCY INTERRUPT ENGAGED.';
  }
  if (tacticalFlowStatus) {
    tacticalFlowStatus.textContent = 'CIRCUIT BREAKER: HALTED (DEADLOCK)';
  }

  timelineSection?.classList.remove('hidden');
  resetStepper();
  document.getElementById('step-core')?.classList.add('active');
  setTimelineStatus('CRITICAL ALERT: IRRECONCILABLE IMPASSE REACHED ACROSS ALL CORES');

  playImpasseAlarm();
}

export function triggerDebugResetStandby() {
  if (!isOperatorAuthenticated()) {
    alert('ACESSO NEGADO // OPERADOR NÃO AUTENTICADO\n\nEstes disparos de depuração são restritos ao operador do sistema com a chave de acesso.');
    return;
  }

  cancelDebugSimulation();

  setOperatorOverride(false);
  recordExecutionTelemetry('mock-demo');

  const animeOriginTag = document.getElementById('anime-origin-tag');
  if (animeOriginTag) {
    animeOriginTag.textContent = 'MOCK DEMO';
    animeOriginTag.className = 'anime-origin-tag mock';
  }
  const tacticalOriginBadge = document.getElementById('tactical-origin-badge');
  if (tacticalOriginBadge) {
    tacticalOriginBadge.textContent = 'MOCK DEMONSTRATION';
    tacticalOriginBadge.className = 'origin-badge mock tactical-origin-tag';
  }

  resetAnimeStandby();

  const {
    tacticalFlowStatus,
    tacticalArrow1,
    tacticalArrow2,
    tacticalCoreBox,
    tacticalCoreDecision,
    tacticalCoreConf,
    tacticalCoreVerdict,
    timelineSection,
    magiCoreSection,
    submitBtn,
    animeConsoleSubmitBtn,
    animeConsoleInput,
  } = simElements;

  if (tacticalFlowStatus) {
    tacticalFlowStatus.textContent = 'SYSTEM IDLE // READY FOR QUERY';
    tacticalFlowStatus.className = 'tactical-flow-status';
  }
  tacticalArrow1?.classList.remove('active');
  tacticalArrow2?.classList.remove('active');
  if (tacticalCoreBox) {
    tacticalCoreBox.classList.remove('resolved', 'epistemic-halt');
  }
  if (tacticalCoreDecision) tacticalCoreDecision.textContent = 'AWAITING DELIBERATION';
  if (tacticalCoreConf) tacticalCoreConf.textContent = '0%';
  if (tacticalCoreVerdict) {
    tacticalCoreVerdict.textContent = 'MAGI TRI-SYSTEM IDLE. AWAITING DELIBERATION QUERY.';
  }

  ['melchior', 'balthasar', 'casper'].forEach(id => {
    const stanceEl = document.getElementById(`tactical-stance-${id}`);
    const confEl = document.getElementById(`tactical-conf-${id}`);
    if (stanceEl) {
      stanceEl.textContent = 'STANDBY';
      stanceEl.className = 'tactical-stance-badge STANDBY';
    }
    if (confEl) confEl.textContent = '0%';
  });

  resetStepper('SYNCHRONIZING INDEPENDENT SUPERCOMPUTERS...');
  timelineSection?.classList.add('hidden');
  magiCoreSection?.classList.add('hidden');

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-text">DELIBERATE [STREAM]</span>';
  }
  if (animeConsoleSubmitBtn) {
    animeConsoleSubmitBtn.disabled = false;
    animeConsoleSubmitBtn.textContent = 'EXECUTE [↵]';
  }
  if (animeConsoleInput) animeConsoleInput.disabled = false;

  playBeep(440, 0.04, 'sine');
}

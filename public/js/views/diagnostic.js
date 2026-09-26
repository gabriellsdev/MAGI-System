// =========================================================================
// MAGI SUPERCOMPUTER // DIAGNOSTIC VIEW MODULE (CYBER-DECK COMMAND CENTER)
// Telemetry panels, live agent stream outputs, MAGI Core arbitration results,
// investigation brief and epistemic reputation profiles.
// =========================================================================
import { escapeHtml, padRight, truncate } from '../utils/dom.js';
import { state, getExecutionOrigin } from '../core/state.js';

let elements = {};

export function initDiagnosticView(domElements = {}) {
  elements = {
    magiCoreSection: domElements.magiCoreSection || document.getElementById('magi-core-section'),
    investigationSection: domElements.investigationSection || document.getElementById('investigation-section'),
    investigationSummaryLabel: domElements.investigationSummaryLabel || document.getElementById('investigation-summary-label'),
    investigationKnownsList: domElements.investigationKnownsList || document.getElementById('investigation-knowns-list'),
    investigationUnknownsList: domElements.investigationUnknownsList || document.getElementById('investigation-unknowns-list'),
    investigationEvidenceList: domElements.investigationEvidenceList || document.getElementById('investigation-evidence-list'),
    repScoreMelchior: domElements.repScoreMelchior || document.getElementById('rep-score-melchior'),
    repMetaMelchior: domElements.repMetaMelchior || document.getElementById('rep-meta-melchior'),
    repScoreBalthasar: domElements.repScoreBalthasar || document.getElementById('rep-score-balthasar'),
    repMetaBalthasar: domElements.repMetaBalthasar || document.getElementById('rep-meta-balthasar'),
    repScoreCasper: domElements.repScoreCasper || document.getElementById('rep-score-casper'),
    repMetaCasper: domElements.repMetaCasper || document.getElementById('rep-meta-casper'),
  };
}

export function renderLiveAgentOutput(agentId, roundNum, output) {
  const prefix = agentId.toLowerCase();

  const stanceEl = document.getElementById(`${prefix}-stance`);
  if (stanceEl) {
    stanceEl.textContent = output.stance;
    stanceEl.className = `stance-badge ${output.stance}`;
  }

  const confVal = Math.round((output.confidence || 0) * 100);
  const confEl = document.getElementById(`${prefix}-conf`);
  const meterEl = document.getElementById(`${prefix}-meter`);
  if (confEl) confEl.textContent = `${confVal}%`;
  if (meterEl) meterEl.style.width = `${confVal}%`;

  const sumEl = document.getElementById(`${prefix}-summary`);
  if (sumEl) sumEl.textContent = output.summary || '';

  const argsList = document.getElementById(`${prefix}-arguments`);
  if (argsList) {
    argsList.innerHTML = (output.keyArguments || []).map(arg => `<li>${escapeHtml(arg)}</li>`).join('');
  }

  const risksList = document.getElementById(`${prefix}-risks`);
  if (risksList) {
    risksList.innerHTML = (output.identifiedRisks || []).length
      ? (output.identifiedRisks || []).map(r => `<li>${escapeHtml(r)}</li>`).join('')
      : '<li>No critical risks identified.</li>';
  }

  const critiquesBox = document.getElementById(`${prefix}-critiques-box`);
  const critiquesContainer = document.getElementById(`${prefix}-critiques`);
  if (critiquesBox && critiquesContainer) {
    if (output.critiquesOfPeers && output.critiquesOfPeers.length > 0) {
      critiquesBox.classList.remove('hidden');
      critiquesContainer.innerHTML = output.critiquesOfPeers.map(c => `
        <div style="margin-bottom: 0.5rem; font-size: 0.78rem;">
          <strong style="color: var(--core-color);">↳ VS ${escapeHtml(c.targetAgent || 'PEER')}:</strong> ${escapeHtml(c.rebuttal || '')}
        </div>
      `).join('');
    } else {
      critiquesBox.classList.add('hidden');
      critiquesContainer.innerHTML = '';
    }
  }
}

export function renderMagiCore(result) {
  elements.magiCoreSection?.classList.remove('hidden');

  const haltBanner = document.getElementById('core-epistemic-halt-banner');
  const badge = document.getElementById('core-decision-badge');
  const originBadge = document.getElementById('core-origin-badge');

  if (originBadge) {
    const origin = result.source || (state.run?.operatorOverride ? 'operator-override' : getExecutionOrigin());
    if (origin === 'operator-override' || state.run?.operatorOverride) {
      originBadge.textContent = 'OPERATOR OVERRIDE · SCRIPTED DEMO';
      originBadge.className = 'origin-badge override';
    } else if (origin === 'mock-demo' || state.engine?.source === 'mock-fixtures' || result.metadata?.provider === 'mock') {
      originBadge.textContent = 'MOCK DEMONSTRATION · ZERO TOKEN COST';
      originBadge.className = 'origin-badge mock';
    } else {
      originBadge.textContent = 'LIVE DELIBERATION · API ENGINE GENERATED';
      originBadge.className = 'origin-badge live';
    }
  }

  if (result.finalDecision === 'EPISTEMIC_HALT') {
    if (haltBanner) haltBanner.classList.remove('hidden');
    if (badge) {
      badge.textContent = 'EPISTEMIC HALT';
      badge.className = 'decision-badge rejected';
    }
  } else {
    if (haltBanner) haltBanner.classList.add('hidden');
    if (badge) {
      badge.textContent = (result.finalDecision || '').replace('_', ' ');
      badge.className = `decision-badge ${(result.finalDecision || '').toLowerCase().replace('_', '-')}`;
    }
  }

  const vText = document.getElementById('core-verdict-text');
  if (vText) vText.textContent = result.coreVerdict || '';

  const scores = result.argumentQualityScore || {};
  ['MELCHIOR', 'BALTHASAR', 'CASPER'].forEach(id => {
    const lower = id.toLowerCase();
    const val = scores[id] || 0;
    const numEl = document.getElementById(`score-val-${lower}`);
    const barEl = document.getElementById(`score-bar-${lower}`);
    if (numEl) numEl.textContent = `${val}/10`;
    if (barEl) barEl.style.width = `${val * 10}%`;
  });

  const factorsList = document.getElementById('core-decisive-factors');
  if (factorsList) {
    factorsList.innerHTML = (result.decisiveFactors || []).map(f => `<li>${escapeHtml(f)}</li>`).join('');
  }

  const sumEl = document.getElementById('core-synthesis-summary');
  if (sumEl) sumEl.textContent = result.synthesisSummary || '';

  const dissentList = document.getElementById('core-dissenting-list');
  if (dissentList) {
    dissentList.innerHTML = result.dissentingOpinionsNoted?.length
      ? result.dissentingOpinionsNoted.map(d => `<li>${escapeHtml(d)}</li>`).join('')
      : '<li>None recorded. Deliberation resolved all major objections.</li>';
  }

  if (result.decisionMetrics) {
    const mConf = document.getElementById('metric-confidence');
    const mDissent = document.getElementById('metric-dissent');
    const mRev = document.getElementById('metric-reversibility');
    const mRisk = document.getElementById('metric-risk');
    const mEv = document.getElementById('metric-evidence');
    if (mConf) mConf.textContent = `CONFIDENCE: ${(result.decisionMetrics.decisionConfidence * 100).toFixed(0)}%`;
    if (mDissent) mDissent.textContent = `DISSENT: ${(result.decisionMetrics.dissentStrength * 100).toFixed(0)}%`;
    if (mRev) mRev.textContent = `REVERSIBILITY: ${(result.decisionMetrics.reversibility * 100).toFixed(0)}%`;
    if (mRisk) mRisk.textContent = `RISK: ${(result.decisionMetrics.riskSeverity * 100).toFixed(0)}%`;
    if (mEv) mEv.textContent = `EVIDENCE QUALITY: ${result.decisionMetrics.evidenceQuality.toFixed(1)}/10`;
  }

  if (result.minorityReport) {
    const minAgent = document.getElementById('core-minority-dissent-agent');
    const minConcern = document.getElementById('core-minority-concern');
    const minRevList = document.getElementById('core-minority-reversal-list');
    const minContractsList = document.getElementById('core-minority-contracts-list');

    if (minAgent) minAgent.textContent = `DISSENTING PERSPECTIVE: ${result.minorityReport.dissentingAgent || 'BALTHASAR'}`;
    if (minConcern) minConcern.textContent = result.minorityReport.minorityConcern || '';
    if (minRevList) {
      minRevList.innerHTML = result.minorityReport.reversalConditions?.length
        ? result.minorityReport.reversalConditions.map((rc, idx) => `<li><strong>[R-${idx + 1}]</strong> ${escapeHtml(rc)}</li>`).join('')
        : '<li>No explicit reversal triggers required.</li>';
    }

    if (minContractsList) {
      if (result.minorityReport.contracts?.length) {
        minContractsList.innerHTML = result.minorityReport.contracts.map(c => `
          <div style="font-size: 0.72rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,170,0,0.25); padding: 0.35rem 0.5rem; border-radius: 3px; line-height: 1.3;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #ffaa00; font-weight: bold;">[${escapeHtml(c.id)}] ${escapeHtml(c.metric)} ${c.operator} ${c.threshold}</span>
              <span style="color: ${c.status === 'TRIPPED' ? '#ff3333' : '#00ff88'}; font-weight: bold;">[${c.status}]</span>
            </div>
            <div style="color: var(--text-dim); margin-top: 0.15rem;">Window: ${escapeHtml(c.window || '')} | Action: <span style="color: #ffaa00;">${escapeHtml(c.action || '')}</span></div>
          </div>
        `).join('');
      } else {
        minContractsList.innerHTML = '<div style="color: var(--text-dim); font-size: 0.72rem;">No operational contracts defined.</div>';
      }
    }
  }

  if (result.metadata) {
    const dEl = document.getElementById('meta-duration');
    const rEl = document.getElementById('meta-rounds');
    const mEl = document.getElementById('meta-model');
    const lEl = document.getElementById('meta-lang');
    const tEl = document.getElementById('meta-tokens');
    const cEl = document.getElementById('meta-cost');
    if (dEl) dEl.textContent = `DURATION: ${result.metadata.durationMs || 0} ms`;
    if (rEl) rEl.textContent = `ROUNDS: ${result.deliberationRoundsCount || 0}`;
    if (mEl) mEl.textContent = `MODEL: ${result.metadata.model || 'GEMINI'}`;
    if (lEl) lEl.textContent = `LANG: ${result.metadata.language || 'en'}`;
    if (tEl) tEl.textContent = result.metadata.totalTokensUsed ? `TOKENS: ${result.metadata.totalTokensUsed.toLocaleString()}` : 'TOKENS: MOCK (0)';
    if (cEl) cEl.textContent = result.metadata.estimatedCostUsd !== undefined ? `EST. COST: $${result.metadata.estimatedCostUsd.toFixed(5)}` : 'EST. COST: $0.00';
  }
}

export function renderInvestigationBrief(investigation) {
  const {
    investigationSection,
    investigationSummaryLabel,
    investigationKnownsList,
    investigationUnknownsList,
    investigationEvidenceList,
  } = elements;

  if (!investigationSection) return;
  if (!investigation || !investigation.plan) {
    investigationSection.classList.add('hidden');
    return;
  }

  const { plan, durationMs, readinessForDeliberation } = investigation;
  investigationSection.classList.remove('hidden');

  if (investigationSummaryLabel) {
    investigationSummaryLabel.textContent = `READINESS: ${readinessForDeliberation || 'READY'} // ${plan.summary || 'Empirical evidence synthesis complete'} (${durationMs || 0}ms)`;
  }

  if (investigationKnownsList) {
    if (plan.knowns && plan.knowns.length > 0) {
      investigationKnownsList.innerHTML = plan.knowns.map(k => `
        <li>
          <span>${escapeHtml(k.statement)}</span>
          <span style="color:var(--casper-color);font-size:0.7rem;"> [conf: ${Math.round((k.confidence || 1) * 100)}%]</span>
        </li>
      `).join('');
    } else {
      investigationKnownsList.innerHTML = '<li>No empirical facts established yet.</li>';
    }
  }

  if (investigationUnknownsList) {
    if (plan.unknowns && plan.unknowns.length > 0) {
      investigationUnknownsList.innerHTML = plan.unknowns.map(u => `
        <li>
          <span>${escapeHtml(u.question)}</span>
          <span style="color:var(--balthasar-color);font-size:0.7rem;"> [${escapeHtml(u.criticality || 'MEDIUM')}]</span>
        </li>
      `).join('');
    } else {
      investigationUnknownsList.innerHTML = '<li>No critical uncertainties flagged.</li>';
    }
  }

  if (investigationEvidenceList) {
    if (plan.neededEvidence && plan.neededEvidence.length > 0) {
      investigationEvidenceList.innerHTML = plan.neededEvidence.map(e => `
        <li>
          <span>${escapeHtml(e.expectedInsight || e.actionDescription || 'Evidence gathering request')}</span>
          <span style="color:var(--melchior-color);font-size:0.7rem;"> [${escapeHtml(e.targetTool || 'TOOL')}]</span>
        </li>
      `).join('');
    } else {
      investigationEvidenceList.innerHTML = '<li>Baseline telemetry sufficient.</li>';
    }
  }
}

export function renderReputationProfiles(profiles) {
  if (!profiles || !Array.isArray(profiles)) return;
  const {
    repScoreMelchior,
    repMetaMelchior,
    repScoreBalthasar,
    repMetaBalthasar,
    repScoreCasper,
    repMetaCasper,
  } = elements;

  profiles.forEach(p => {
    const total = p.totalDecisionsInvolved || 0;
    const survived = p.survivedDecisions || 0;
    const survivalPct = total > 0 ? Math.round((survived / total) * 100) : 100;
    const baseScore = typeof p.baseReputation === 'number' ? p.baseReputation.toFixed(2) : '8.00';

    if (p.agentId === 'MELCHIOR') {
      if (repScoreMelchior) repScoreMelchior.textContent = `${baseScore} / 10`;
      if (repMetaMelchior) repMetaMelchior.textContent = `Survival: ${survivalPct}% | Vindications: ${p.minorityVindications || 0}`;
    } else if (p.agentId === 'BALTHASAR') {
      const falseAlarmPct = total > 0 ? Math.round(((p.falseAlarms || 0) / total) * 100) : 15;
      if (repScoreBalthasar) repScoreBalthasar.textContent = `${baseScore} / 10`;
      if (repMetaBalthasar) repMetaBalthasar.textContent = `False Alarm Rate: ${falseAlarmPct}% | Vindications: ${p.minorityVindications || 0}`;
    } else if (p.agentId === 'CASPER') {
      if (repScoreCasper) repScoreCasper.textContent = `${baseScore} / 10`;
      if (repMetaCasper) repMetaCasper.textContent = `Survival: ${survivalPct}% | Vindications: ${p.minorityVindications || 0}`;
    }
  });
}

export function setupAgentTabs(agentId, totalRounds, onSelectRound) {
  const tabsContainer = document.getElementById(`tabs-${agentId.toLowerCase()}`);
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';

  const btn0 = createTabBtn(agentId, 0, totalRounds === 0, onSelectRound);
  tabsContainer.appendChild(btn0);

  if (totalRounds >= 1) {
    const btn1 = createTabBtn(agentId, 1, totalRounds === 1, onSelectRound);
    tabsContainer.appendChild(btn1);
  }

  if (totalRounds >= 2) {
    const btn2 = createTabBtn(agentId, 2, true, onSelectRound);
    tabsContainer.appendChild(btn2);
  }
}

function createTabBtn(agentId, roundNum, isActive, onSelectRound) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `tab-btn ${isActive ? 'active' : ''}`;
  btn.textContent = `R${roundNum}`;
  btn.addEventListener('click', () => {
    const parent = btn.parentElement;
    parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (typeof onSelectRound === 'function') {
      onSelectRound(agentId, roundNum);
    }
  });
  return btn;
}

export function renderAgentRound(result, agentId, roundNum) {
  if (!result) return;
  let output;
  if (roundNum === 0) {
    output = result.initialAnalysis?.[agentId];
  } else {
    const roundObj = (result.rounds || []).find(r => r.roundNumber === roundNum);
    output = roundObj?.agentOutputs?.[agentId] || result.initialAnalysis?.[agentId];
  }

  if (!output) return;
  renderLiveAgentOutput(agentId, roundNum, output);
}

export function generateAsciiDiagram(result, question = 'Should we migrate to Rust?') {
  const q = result?.question || question;
  const melchior = result?.initialAnalysis?.MELCHIOR || { stance: 'APPROVE', confidence: 0.90 };
  const balthasar = result?.initialAnalysis?.BALTHASAR || { stance: 'REJECT', confidence: 0.92 };
  const casper = result?.initialAnalysis?.CASPER || { stance: 'PIVOT', confidence: 0.85 };
  const decision = result?.finalDecision ? result.finalDecision.replace('_', ' ') : 'CONDITIONAL PASS';

  const confs = [melchior.confidence, balthasar.confidence, casper.confidence];
  const avgConf = Math.round((confs.reduce((a, b) => a + b, 0) / confs.length) * 100);

  const mConf = Math.round(melchior.confidence * 100) + '%';
  const bConf = Math.round(balthasar.confidence * 100) + '%';
  const cConf = Math.round(casper.confidence * 100) + '%';

  const mStance = padRight(melchior.stance, 10);
  const bStance = padRight(balthasar.stance, 10);
  const cStance = padRight(casper.stance, 10);

  return [
    '┌────────────────────────────────────────────────────────┐',
    '│                      MAGI SYSTEM                       │',
    '├────────────────────────────────────────────────────────┤',
    '│                                                        │',
    '│  QUERY                                                 │',
    '│  ┌──────────────────────────────────────────────────┐  │',
    `│  │ ${padRight(truncate(q, 48), 48)} │  │`,
    '│  └──────────────────────────────────────────────────┘  │',
    '│                                                        │',
    '│  ┌────────────┐   ┌────────────┐   ┌────────────┐      │',
    '│  │ MELCHIOR   │   │ BALTHASAR  │   │ CASPER     │      │',
    '│  │ ANALYSIS   │   │ CRITIQUE   │   │ ALTERNATIVE│      │',
    '│  │            │   │            │   │            │      │',
    `│  │ ${mStance} │   │ ${bStance} │   │ ${cStance} │      │`,
    `│  │ ${padRight(mConf, 10)} │   │ ${padRight(bConf, 10)} │   │ ${padRight(cConf, 10)} │      │`,
    '│  └────────────┘   └────────────┘   └────────────┘      │',
    '│                         ↓                              │',
    '│                    DELIBERATION                        │',
    '│                         ↓                              │',
    '│                     MAGI CORE                          │',
    `│               ${padRight(truncate(`${decision} – ${avgConf}%`, 38), 38)} │`,
    '│                                                        │',
    '└────────────────────────────────────────────────────────┘',
  ].join('\n');
}

// =========================================================================
// MAGI SUPERCOMPUTER // TACTICAL VIEW MODULE (CONSENSUS GRAPH & FLOW)
// =========================================================================
import { escapeHtml, animateNumber } from '../utils/dom.js';
import { state, getExecutionOrigin } from '../core/state.js';

let elements = {};

export function initTacticalView(domElements = {}) {
  elements = {
    tacticalQueryDisplay: domElements.tacticalQueryDisplay || document.getElementById('tactical-query-display'),
    tacticalArrow1: domElements.tacticalArrow1 || document.getElementById('tactical-arrow-1'),
    tacticalArrow2: domElements.tacticalArrow2 || document.getElementById('tactical-arrow-2'),
    tacticalFlowStatus: domElements.tacticalFlowStatus || document.getElementById('tactical-flow-status'),
    tacticalCoreBox: domElements.tacticalCoreBox || document.getElementById('tactical-core-box'),
    tacticalCoreDecision: domElements.tacticalCoreDecision || document.getElementById('tactical-core-decision'),
    tacticalCoreConf: domElements.tacticalCoreConf || document.getElementById('tactical-core-conf'),
    tacticalCoreVerdict: domElements.tacticalCoreVerdict || document.getElementById('tactical-core-verdict'),
    tacticalAgentModal: domElements.tacticalAgentModal || document.getElementById('tactical-agent-modal'),
    tacticalModalTitle: domElements.tacticalModalTitle || document.getElementById('tactical-modal-title'),
    tacticalModalBody: domElements.tacticalModalBody || document.getElementById('tactical-modal-body'),
    tacticalModalCloseBtn: domElements.tacticalModalCloseBtn || document.getElementById('tactical-modal-close-btn'),
    tacticalCoreMinorityAlert: domElements.tacticalCoreMinorityAlert || document.getElementById('tactical-core-minority-alert'),
    tacticalMinorityText: domElements.tacticalMinorityText || document.getElementById('tactical-minority-text'),
  };

  // Close modal on close button click
  elements.tacticalModalCloseBtn?.addEventListener('click', () => {
    elements.tacticalAgentModal?.classList.add('hidden');
  });

  // Close modal when clicking outside the modal box
  elements.tacticalAgentModal?.addEventListener('click', (e) => {
    if (e.target === elements.tacticalAgentModal) {
      elements.tacticalAgentModal.classList.add('hidden');
    }
  });
}

export function renderTacticalAgent(agentId, output) {
  const id = agentId.toLowerCase();
  const stanceEl = document.getElementById(`tactical-stance-${id}`);
  const confEl = document.getElementById(`tactical-conf-${id}`);

  if (stanceEl) {
    stanceEl.textContent = output.stance;
    stanceEl.className = `tactical-stance-badge ${output.stance}`;
  }

  if (confEl) {
    const confPct = Math.round(output.confidence * 100);
    animateNumber(confEl, confPct, '%');
  }
}

export function renderTacticalCore(result) {
  const {
    tacticalCoreBox,
    tacticalCoreDecision,
    tacticalCoreConf,
    tacticalCoreVerdict,
    tacticalFlowStatus,
    tacticalCoreMinorityAlert,
    tacticalMinorityText,
  } = elements;

  const tacticalOriginBadge = document.getElementById('tactical-origin-badge');
  if (tacticalOriginBadge) {
    const origin = result.source || (state.run?.operatorOverride ? 'operator-override' : getExecutionOrigin());
    if (origin === 'operator-override' || state.run?.operatorOverride) {
      tacticalOriginBadge.textContent = 'OPERATOR OVERRIDE';
      tacticalOriginBadge.className = 'origin-badge override tactical-origin-tag';
    } else if (origin === 'mock-demo' || state.engine?.source === 'mock-fixtures' || result.metadata?.provider === 'mock') {
      tacticalOriginBadge.textContent = 'MOCK DEMONSTRATION';
      tacticalOriginBadge.className = 'origin-badge mock tactical-origin-tag';
    } else {
      tacticalOriginBadge.textContent = 'LIVE DELIBERATION';
      tacticalOriginBadge.className = 'origin-badge live tactical-origin-tag';
    }
  }

  if (tacticalCoreBox) {
    tacticalCoreBox.classList.add('resolved');
    if (result.finalDecision === 'EPISTEMIC_HALT') {
      tacticalCoreBox.classList.add('epistemic-halt');
    } else {
      tacticalCoreBox.classList.remove('epistemic-halt');
    }
  }

  if (tacticalCoreDecision) {
    tacticalCoreDecision.textContent = result.finalDecision === 'EPISTEMIC_HALT'
      ? '[EPISTEMIC HALT]'
      : result.finalDecision.replace('_', ' ');
  }

  const confs = Object.values(result.initialAnalysis || {}).map(a => a.confidence || 0);
  const avgConf = confs.length > 0 ? Math.round((confs.reduce((a, b) => a + b, 0) / confs.length) * 100) : 0;
  if (tacticalCoreConf) animateNumber(tacticalCoreConf, avgConf, '%');

  if (tacticalCoreVerdict) tacticalCoreVerdict.textContent = result.coreVerdict || '';
  if (tacticalFlowStatus) {
    tacticalFlowStatus.textContent = result.finalDecision === 'EPISTEMIC_HALT'
      ? 'CIRCUIT BREAKER: HALTED'
      : (result.deliberationRoundsCount === 0
          ? 'IMMEDIATE CONSENSUS'
          : `CONVERGED (${result.deliberationRoundsCount} ROUND${result.deliberationRoundsCount > 1 ? 'S' : ''})`);
  }

  if (tacticalCoreMinorityAlert && tacticalMinorityText) {
    if (result.minorityReport && result.minorityReport.minorityConcern && result.minorityReport.minorityConcern !== 'None') {
      tacticalMinorityText.textContent = `[MINORITY REPORT // ${result.minorityReport.dissentingAgent || 'BALTHASAR'}]: ${result.minorityReport.minorityConcern}`;
      tacticalCoreMinorityAlert.classList.remove('hidden');
    } else {
      tacticalCoreMinorityAlert.classList.add('hidden');
    }
  }
}

export function openTacticalAgentModal(agentId, result) {
  if (!result) return;
  const { tacticalModalTitle, tacticalModalBody, tacticalAgentModal } = elements;
  if (!tacticalAgentModal) return;

  const latestRound = result.deliberationRoundsCount || 0;
  let output = null;
  if (latestRound > 0 && Array.isArray(result.rounds) && result.rounds.length) {
    const rObj = result.rounds.find(r => r.roundNumber === latestRound);
    output = rObj?.agentOutputs?.[agentId];
  }
  if (!output) {
    output = result.initialAnalysis?.[agentId];
  }
  if (!output) return;

  const confPct = Math.round((output.confidence || 0) * 100);
  if (tacticalModalTitle) {
    tacticalModalTitle.textContent = `${agentId} // REASONING AUDIT (ROUND ${latestRound})`;
  }

  if (tacticalModalBody) {
    tacticalModalBody.innerHTML = `
      <div class="tactical-popover-content">
        <div class="tactical-popover-meta">
          <span class="stance-badge ${output.stance}">${output.stance}</span>
          <span style="font-family: var(--font-mono); font-size: 0.9rem; font-weight: bold; color: var(--core-color);">CONFIDENCE: ${confPct}%</span>
        </div>

        <div>
          <div class="section-title">EXECUTIVE SUMMARY</div>
          <p class="summary-text" style="margin-top: 0.3rem;">${escapeHtml(output.summary || '')}</p>
        </div>

        <div>
          <div class="section-title">CORE ARGUMENTS (${(output.keyArguments || []).length})</div>
          <ul class="bullet-list" style="margin-top: 0.3rem;">
            ${(output.keyArguments || []).map(arg => `<li>${escapeHtml(arg)}</li>`).join('')}
          </ul>
        </div>

        <div>
          <div class="section-title">IDENTIFIED RISKS &amp; VULNERABILITIES (${(output.identifiedRisks || []).length})</div>
          <ul class="bullet-list risk-list" style="margin-top: 0.3rem;">
            ${(output.identifiedRisks || []).length ? output.identifiedRisks.map(r => `<li>${escapeHtml(r)}</li>`).join('') : '<li>No fatal vulnerabilities detected.</li>'}
          </ul>
        </div>

        ${output.critiquesOfPeers && output.critiquesOfPeers.length > 0 ? `
          <div>
            <div class="section-title">PEER CRITIQUES</div>
            <div style="margin-top: 0.3rem;">
              ${output.critiquesOfPeers.map(c => `
                <div style="font-size: 0.8rem; margin-bottom: 0.4rem;">
                  <strong style="color: var(--core-color);">↳ VS ${escapeHtml(c.targetAgent || 'PEER')}:</strong> ${escapeHtml(c.rebuttal || '')}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  tacticalAgentModal.classList.remove('hidden');
}

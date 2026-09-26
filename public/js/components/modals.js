// =========================================================================
// MAGI SUPERCOMPUTER // SYSTEM MODALS & DIALOGS
// Benchmark, Comparison vs Single LLM, Raw JSON Export, Storage Telemetry, Operator Auth
// =========================================================================
import { escapeHtml } from '../utils/dom.js';
import {
  fetchStorageStatus,
  backupStorageFiles,
  compareWithSingleGemini,
  fetchBenchmarkReport,
  authenticateOperatorKey,
  checkSystemHealth,
} from '../api/deliberation.js';
import { getAdminKey, setAdminKey, isOperatorAuthenticated } from '../core/state.js';
import { playBeep } from '../features/audio.js';

let modalElements = {};
let callbacks = {};

export function renderComparisonReport(report, { compareSingleBody, compareMagiBody, compareDiffSummary }) {
  if (!compareSingleBody || !compareMagiBody) return;
  const single = report.singleBaseline;
  const magi = report.magiResult;
  const diff = report.differential;

  compareSingleBody.innerHTML = `
    <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.4rem;">MODEL: ${escapeHtml(single.model)}</div>
    <div class="section-title">VERDICT &amp; SUMMARY</div>
    <p><strong>${escapeHtml(single.verdict)}</strong></p>
    <p class="summary-text">${escapeHtml(single.summary)}</p>

    <div class="section-title" style="margin-top: 0.8rem;">BENEFITS / PROS IDENTIFIED (${single.pros.length})</div>
    <ul class="bullet-list">
      ${single.pros.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
    </ul>

    <div class="section-title" style="margin-top: 0.8rem;">RISKS &amp; VULNERABILITIES (${single.cons.length})</div>
    <ul class="bullet-list risk-list">
      ${single.cons.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
    </ul>
  `;

  compareMagiBody.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span class="stance-badge ${magi.finalDecision}">${magi.finalDecision.replace('_', ' ')}</span>
      <span style="font-size: 0.75rem; color: var(--text-dim);">${magi.deliberationRoundsCount} DELIBERATION ROUND(S)</span>
    </div>
    <div class="section-title">CORE VERDICT</div>
    <p><strong>${escapeHtml(magi.coreVerdict)}</strong></p>
    <p class="summary-text">${escapeHtml(magi.synthesisSummary)}</p>

    <div class="section-title" style="margin-top: 0.8rem;">TRIAD INDEPENDENT PERSPECTIVES</div>
    <div style="font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.3rem;">
      <div><strong style="color: var(--melchior-color);">MELCHIOR-1 (${magi.argumentQualityScore?.MELCHIOR || 0}/10):</strong> ${escapeHtml(magi.initialAnalysis?.MELCHIOR?.stance || 'N/A')}</div>
      <div><strong style="color: var(--balthasar-color);">BALTHASAR-2 (${magi.argumentQualityScore?.BALTHASAR || 0}/10):</strong> ${escapeHtml(magi.initialAnalysis?.BALTHASAR?.stance || 'N/A')}</div>
      <div><strong style="color: var(--casper-color);">CASPER-3 (${magi.argumentQualityScore?.CASPER || 0}/10):</strong> ${escapeHtml(magi.initialAnalysis?.CASPER?.stance || 'N/A')}</div>
    </div>

    <div class="section-title" style="margin-top: 0.8rem;">DECISIVE FACTORS</div>
    <ul class="bullet-list">
      ${(magi.decisiveFactors || []).map(f => `<li>${escapeHtml(f)}</li>`).join('')}
    </ul>
  `;

  if (compareDiffSummary && diff) {
    compareDiffSummary.innerHTML = `
      <div class="diff-summary-card">
        <div class="section-title">DIFFERENTIAL ANALYSIS</div>
        <p style="margin-bottom: 0.4rem;">${escapeHtml(diff.perspectiveDifferenceSummary)}</p>
        <div style="font-size: 0.8rem; color: var(--core-color);">
          <strong>SYNTHESIS ADVANTAGE:</strong> ${escapeHtml(diff.synthesisAdvantage)}
        </div>
      </div>
    `;
  }
}

export function renderBenchmarkSummary(summary, benchmarkContent) {
  if (!benchmarkContent) return;
  const consensusPct = Math.round((summary.consensusRate || 0) * 100);

  const rows = (summary.scorecards || []).map(s => {
    const avgScore = ((s.qualityScores.MELCHIOR + s.qualityScores.BALTHASAR + s.qualityScores.CASPER) / 3).toFixed(1);
    const decisionClass = s.finalDecision.toLowerCase().includes('reject') ? 'FAIL' : 'PASS';
    return `
      <tr>
        <td>
          <strong>${escapeHtml(s.title)}</strong><br>
          <span style="font-size: 0.7rem; color: var(--text-dim);">${escapeHtml(s.dilemmaId)}</span>
        </td>
        <td><span class="meta-pill">${escapeHtml(s.category)}</span></td>
        <td><span class="bench-status-badge ${decisionClass}">${escapeHtml(s.finalDecision)}</span></td>
        <td style="text-align: center;">${s.roundsCount}</td>
        <td>
          <span style="color: var(--melchior-color); font-weight: bold;">M:${s.qualityScores.MELCHIOR}</span> /
          <span style="color: var(--balthasar-color); font-weight: bold;">B:${s.qualityScores.BALTHASAR}</span> /
          <span style="color: var(--casper-color); font-weight: bold;">C:${s.qualityScores.CASPER}</span>
          <span style="color: var(--text-dim); font-size: 0.72rem;">(Avg ${avgScore})</span>
        </td>
        <td style="text-align: right;">${s.durationMs} ms</td>
        <td><div style="max-height: 60px; overflow-y: auto; font-size: 0.78rem;">${escapeHtml(s.coreVerdict)}</div></td>
      </tr>
    `;
  }).join('');

  benchmarkContent.innerHTML = `
    <div class="bench-summary-bar">
      <div class="bench-stat-item">
        <span class="bench-stat-label">TOTAL SUITES</span>
        <span class="bench-stat-val">${summary.totalDilemmas}</span>
      </div>
      <div class="bench-stat-item">
        <span class="bench-stat-label">CONSENSUS RATE</span>
        <span class="bench-stat-val">${consensusPct}%</span>
      </div>
      <div class="bench-stat-item">
        <span class="bench-stat-label">AVG ROUNDS</span>
        <span class="bench-stat-val">${summary.averageRounds.toFixed(1)}</span>
      </div>
      <div class="bench-stat-item">
        <span class="bench-stat-label">AVG LATENCY</span>
        <span class="bench-stat-val">${Math.round(summary.averageDurationMs)} ms</span>
      </div>
      <div class="bench-stat-item">
        <span class="bench-stat-label">TIMESTAMP</span>
        <span class="bench-stat-val" style="font-size: 0.85rem; color: var(--text-dim);">${new Date(summary.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>

    <table class="benchmark-table">
      <thead>
        <tr>
          <th>DILEMMA / TITLE</th>
          <th>CATEGORY</th>
          <th>DECISION</th>
          <th>ROUNDS</th>
          <th>QUALITY RATINGS</th>
          <th>LATENCY</th>
          <th>VERDICT SUMMARY</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

export function initModals(elements = {}, handlers = {}) {
  modalElements = elements;
  callbacks = handlers;

  initJsonModal();
  initComparisonModal();
  initBenchmarkModal();
  initStorageModal();
  initOperatorAuth();
  initAboutModal();
}

function initAboutModal() {
  const { aboutModalBtn, sessionAboutPill, aboutModal, aboutModalCloseBtn } = modalElements;
  if (!aboutModal) return;

  const openAboutModal = () => {
    aboutModal.classList.remove('hidden');
    playBeep(520, 0.04, 'sine');
  };

  const closeAboutModal = () => {
    aboutModal.classList.add('hidden');
  };

  aboutModalBtn?.addEventListener('click', openAboutModal);
  sessionAboutPill?.addEventListener('click', openAboutModal);
  aboutModalCloseBtn?.addEventListener('click', closeAboutModal);

  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) closeAboutModal();
  });

  const tabBtns = aboutModal.querySelectorAll('.about-tab-btn');
  const tabPanes = aboutModal.querySelectorAll('.about-tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabKey = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabPanes.forEach(pane => {
        if (pane.id === `pane-${tabKey}`) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      });
      playBeep(440, 0.02, 'sine');
    });
  });
}

function initJsonModal() {
  const { jsonModalBtn, toolsJsonModalBtn, jsonModal, modalCloseBtn, modalCopyBtn, modalJsonContent } = modalElements;
  if (!jsonModal) return;

  const openJsonModal = () => {
    const result = typeof callbacks.getCurrentResult === 'function' ? callbacks.getCurrentResult() : null;
    if (!result) return;
    if (modalJsonContent) {
      modalJsonContent.textContent = JSON.stringify(result, null, 2);
    }
    jsonModal.classList.remove('hidden');
  };

  jsonModalBtn?.addEventListener('click', openJsonModal);
  toolsJsonModalBtn?.addEventListener('click', openJsonModal);

  modalCloseBtn?.addEventListener('click', () => {
    jsonModal.classList.add('hidden');
  });

  jsonModal.addEventListener('click', (e) => {
    if (e.target === jsonModal) jsonModal.classList.add('hidden');
  });

  modalCopyBtn?.addEventListener('click', () => {
    const result = typeof callbacks.getCurrentResult === 'function' ? callbacks.getCurrentResult() : null;
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => {
      modalCopyBtn.textContent = 'COPIED!';
      setTimeout(() => { modalCopyBtn.textContent = 'COPY TO CLIPBOARD'; }, 2000);
    });
  });
}

function initComparisonModal() {
  const {
    compareBtn,
    compareModal,
    compareCloseBtn,
    compareSingleBody,
    compareMagiBody,
    compareDiffSummary,
    queryInput,
    langSelect,
    modeToggle,
  } = modalElements;

  if (!compareModal) return;

  compareBtn?.addEventListener('click', async () => {
    let question = queryInput?.value.trim() || '';
    if (!question) {
      question = 'How effective would a Magi supercomputer run society actually be?';
      if (queryInput) queryInput.value = question;
      if (typeof callbacks.syncQueryDisplay === 'function') callbacks.syncQueryDisplay(question);
    }

    const language = langSelect?.value || undefined;
    const isMock = modeToggle?.value === 'mock';
    const isFast = typeof callbacks.isFastMode === 'function' ? callbacks.isFastMode() : false;

    compareModal.classList.remove('hidden');
    if (compareSingleBody) compareSingleBody.innerHTML = '<div class="loading-spinner">GENERATING SINGLE BASELINE RESPONSE...</div>';
    if (compareMagiBody) compareMagiBody.innerHTML = '<div class="loading-spinner">RUNNING FULL MAGI TRIAD DELIBERATION...</div>';
    if (compareDiffSummary) compareDiffSummary.innerHTML = '';

    try {
      const loc = window.location;
      const isStaticServerWithoutBackend = loc.port && loc.port !== '3000' && !callbacks.getApiBaseUrl?.() && (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1');

      if (isMock && isStaticServerWithoutBackend && window.MAGI_MOCK_STORE) {
        const report = window.MAGI_MOCK_STORE.getComparisonReport(question, language);
        renderComparisonReport(report, { compareSingleBody, compareMagiBody, compareDiffSummary });
        return;
      }

      const report = await compareWithSingleGemini(question, language, isFast);
      renderComparisonReport(report, { compareSingleBody, compareMagiBody, compareDiffSummary });
    } catch (err) {
      if (isMock && window.MAGI_MOCK_STORE) {
        const report = window.MAGI_MOCK_STORE.getComparisonReport(question, language);
        renderComparisonReport(report, { compareSingleBody, compareMagiBody, compareDiffSummary });
      } else {
        if (compareSingleBody) compareSingleBody.innerHTML = `<div style="color: var(--balthasar-color);">Error: ${escapeHtml(err.message)}</div>`;
        if (compareMagiBody) compareMagiBody.innerHTML = `<div style="color: var(--balthasar-color);">Error: ${escapeHtml(err.message)}</div>`;
      }
    }
  });

  compareCloseBtn?.addEventListener('click', () => {
    compareModal.classList.add('hidden');
  });

  compareModal.addEventListener('click', (e) => {
    if (e.target === compareModal) compareModal.classList.add('hidden');
  });
}

function initBenchmarkModal() {
  const { benchmarkBtn, benchmarkModal, benchmarkCloseBtn, benchmarkContent, toolsDropdownMenu, toolsMenuBtn } = modalElements;
  if (!benchmarkModal) return;

  benchmarkBtn?.addEventListener('click', async () => {
    benchmarkModal.classList.remove('hidden');
    toolsDropdownMenu?.classList.add('hidden');
    toolsMenuBtn?.classList.remove('active');
    if (benchmarkContent) {
      benchmarkContent.innerHTML = '<div class="loading-spinner">COMPUTING BENCHMARK SCORECARDS ACROSS 5 CORE DILEMMAS...</div>';
    }

    try {
      const summary = await fetchBenchmarkReport();
      renderBenchmarkSummary(summary, benchmarkContent);
    } catch (err) {
      if (benchmarkContent) {
        benchmarkContent.innerHTML = `<div style="color: var(--balthasar-color); padding: 1.5rem;">Benchmark evaluation failed: ${escapeHtml(err.message)}</div>`;
      }
    }
  });

  benchmarkCloseBtn?.addEventListener('click', () => {
    benchmarkModal.classList.add('hidden');
  });

  benchmarkModal.addEventListener('click', (e) => {
    if (e.target === benchmarkModal) benchmarkModal.classList.add('hidden');
  });
}

function initStorageModal() {
  const {
    storageModalBtn,
    storageModal,
    storageCloseBtn,
    storageFilesTableBody,
    storageDirPath,
    storageTotalFiles,
    storageTotalSize,
    storageBackupExecuteBtn,
    storageBackupPathInput,
    storageBackupStatus,
    toolsDropdownMenu,
    toolsMenuBtn,
  } = modalElements;

  if (!storageModal) return;

  async function loadStorageStatus() {
    if (!storageFilesTableBody) return;
    storageFilesTableBody.innerHTML = '<tr><td colspan="4">Refreshing storage telemetry...</td></tr>';
    try {
      const data = await fetchStorageStatus();

      if (storageDirPath) storageDirPath.textContent = data.baseDirectory || 'data/storage';
      if (storageTotalFiles) storageTotalFiles.textContent = String(data.totalFiles || 0);
      if (storageTotalSize) {
        const kb = (data.totalSizeBytes / 1024).toFixed(1);
        storageTotalSize.textContent = `${kb} KB (${data.totalSizeBytes} bytes)`;
      }

      if (data.files && data.files.length > 0) {
        const descriptions = {
          'decisions.json': 'Decisions Memory & Consensus Trajectories',
          'reputation.json': 'Agent Epistemic Reputation & Accuracy Matrix',
          'contracts.json': 'Falsification Contracts & Reversal Invariants',
        };
        storageFilesTableBody.innerHTML = data.files.map(f => `
          <tr>
            <td><strong>${escapeHtml(f.name)}</strong></td>
            <td>${descriptions[f.name] || 'MAGI Engine Persistence Data'}</td>
            <td>${f.records} records</td>
            <td>${(f.sizeBytes / 1024).toFixed(1)} KB</td>
          </tr>
        `).join('');
      } else {
        storageFilesTableBody.innerHTML = '<tr><td colspan="4">No JSON files in data/storage yet.</td></tr>';
      }
    } catch (err) {
      storageFilesTableBody.innerHTML = `<tr><td colspan="4" style="color:var(--balthasar-color);">Error fetching storage status: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  storageModalBtn?.addEventListener('click', () => {
    storageModal.classList.remove('hidden');
    toolsDropdownMenu?.classList.add('hidden');
    toolsMenuBtn?.classList.remove('active');
    loadStorageStatus();
  });

  storageCloseBtn?.addEventListener('click', () => {
    storageModal.classList.add('hidden');
  });

  storageModal.addEventListener('click', (e) => {
    if (e.target === storageModal) storageModal.classList.add('hidden');
  });

  storageBackupExecuteBtn?.addEventListener('click', async () => {
    const dest = (storageBackupPathInput?.value || '').trim();
    if (!dest) return;
    if (storageBackupStatus) {
      storageBackupStatus.className = 'storage-backup-status';
      storageBackupStatus.textContent = 'EXECUTING BACKUP TO TARGET LOCATION...';
      storageBackupStatus.classList.remove('hidden');
    }
    try {
      const data = await backupStorageFiles(dest);
      if (storageBackupStatus) {
        storageBackupStatus.className = 'storage-backup-status success';
        storageBackupStatus.textContent = `BACKUP COMPLETE: Copied ${data.copiedFiles?.length || 0} files (${data.totalBytes} bytes) to ${data.destination}`;
      }
      loadStorageStatus();
    } catch (err) {
      if (storageBackupStatus) {
        storageBackupStatus.className = 'storage-backup-status error';
        storageBackupStatus.textContent = `BACKUP FAILED: ${escapeHtml(err.message)}`;
      }
    }
  });
}

function initOperatorAuth() {
  const { operatorUnlockBtn } = modalElements;
  if (!operatorUnlockBtn) return;

  operatorUnlockBtn.addEventListener('click', async () => {
    const current = getAdminKey();
    if (isOperatorAuthenticated()) {
      const confirmLogout = confirm('OPERADOR CONECTADO\n\nDeseja revogar o token do operador e retornar ao modo convidado?');
      if (confirmLogout) {
        setAdminKey('');
        callbacks.onOperatorAuthChange?.(false);
        callbacks.onHealthCheckRequested?.();
      }
      return;
    }

    const input = prompt('ACESSO DO OPERADOR // MAGI CONTROL', current);
    if (input === null) return;

    const trimmed = input.trim();
    if (!trimmed) {
      setAdminKey('');
      callbacks.onOperatorAuthChange?.(false);
      callbacks.onHealthCheckRequested?.();
      return;
    }

    try {
      const res = await authenticateOperatorKey(trimmed);
      if (res.success) {
        setAdminKey(trimmed);
        callbacks.onOperatorAuthChange?.(true);
        alert('SENHA CORRETA! Acesso de Operador concedido.');
        callbacks.onHealthCheckRequested?.();
      } else {
        alert(res.error || 'Senha incorreta! Digite a senha correta');
      }
    } catch {
      setAdminKey(trimmed);
      callbacks.onOperatorAuthChange?.(true);
      callbacks.onHealthCheckRequested?.();
    }
  });
}

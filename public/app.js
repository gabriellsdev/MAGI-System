// =========================================================================
// MAGI SUPERCOMPUTER // CLIENT ROOT COORDINATOR
// Evangelion-Inspired Autonomous Multi-Agent Consensus System
// Modular ES Architecture (Native ES Modules, Zero Build Step Required)
// =========================================================================
import { I18N, CURATED_MOCK_CATEGORIES, CURATED_MOCK_DILEMMAS } from './js/features/i18n/index.js';
import {
  state,
  getAdminKey,
  setAdminKey,
  saveOperatorSession,
  clearOperatorSession,
  isOperatorAuthenticated,
  getOperatorRemainingMs,
  setApiBaseUrl,
  getApiUrl,
  setFastMode,
  setEngineMode,
  setRunStatus,
  setPresentationSpeed,
  setCinematicMode,
  setOperatorOverride,
  recordExecutionTelemetry,
  getExecutionOrigin,
} from './js/core/state.js';
import { ALL_ENGINE_OPTIONS, STORAGE_KEYS } from './js/core/constants.js';
import { escapeHtml, autoResizeTextarea } from './js/utils/dom.js';
import {
  initAudio,
  playBeep,
  playNervTripletBeep,
  playConsensusChime,
  playImpasseAlarm,
  updateAudioButtonUI,
} from './js/features/audio.js';
import { initViewManager, setViewMode } from './js/views/view-manager.js';
import {
  initAnimeView,
  resetAnimeStandby,
  startAnimeDeliberation,
  renderAnimeAgent,
  renderAnimeResolution,
  addChatUserQuery,
  addChatAgentMessage,
  addChatGateNotice,
  addChatSynthesisMessage,
  stopTelemetryCycling,
} from './js/views/anime.js';
import {
  initTacticalView,
  renderTacticalAgent,
  renderTacticalCore,
  openTacticalAgentModal,
} from './js/views/tactical.js';
import {
  initDiagnosticView,
  renderLiveAgentOutput,
  renderMagiCore,
  renderInvestigationBrief,
  renderReputationProfiles,
  setupAgentTabs,
  renderAgentRound,
  generateAsciiDiagram,
} from './js/views/diagnostic.js';
import {
  initTimeline,
  setBeacon,
  clearAllBeacons,
  resetStepper,
  setTimelineStatus,
} from './js/components/timeline.js';
import { initModals } from './js/components/modals.js';
import {
  initDebugSimulation,
  syncOperatorDebugUI,
} from './js/features/debug-simulation.js';
import {
  checkSystemHealth,
  fetchEpistemicReputation,
  streamDeliberation,
} from './js/api/deliberation.js';
import { getClientMockFixture } from './js/mock/store.js';

document.addEventListener('DOMContentLoaded', () => {
  // Shared Form & Control Elements
  const form = document.getElementById('magi-form');
  const queryInput = document.getElementById('query-input');
  const queryDemoBtn = document.getElementById('query-demo-btn');
  const submitBtn = document.getElementById('submit-btn');
  const langSelect = document.getElementById('lang-select');
  const modeToggle = document.getElementById('mode-toggle');
  const systemStatusText = document.getElementById('system-status-text');

  // Mode & View Switcher Elements
  const btnModeCommand = document.getElementById('btn-mode-command');
  const btnModeLegacy = document.getElementById('btn-mode-legacy');
  const btnViewAnime = document.getElementById('btn-view-anime');
  const btnViewTactical = document.getElementById('btn-view-tactical');
  const btnViewDiagnostic = document.getElementById('btn-view-diagnostic');
  const animeView = document.getElementById('anime-view');
  const tacticalView = document.getElementById('tactical-view');
  const diagnosticView = document.getElementById('diagnostic-view');

  // Status & Tools Elements
  const statusChipsGroup = document.getElementById('status-chips-group');
  const geminiStatusChip = document.getElementById('gemini-status-chip');
  const groqStatusChip = document.getElementById('groq-status-chip');
  const operatorDebugSection = document.getElementById('operator-debug-section');
  const operatorDebugDock = document.getElementById('operator-debug-dock');
  const debugDockToggleBtn = document.getElementById('debug-dock-toggle-btn');
  const toolsMenuBtn = document.getElementById('tools-menu-btn');
  const toolsDropdownMenu = document.getElementById('tools-dropdown-menu');
  const fastModeToggleBtn = document.getElementById('fast-mode-toggle-btn');
  const toolsFastModeBtn = document.getElementById('tools-fast-mode-btn');
  const engineLockedBadge = document.getElementById('engine-locked-badge');
  const operatorUnlockBtn = document.getElementById('operator-unlock-btn');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');

  // Query Section Collapsible Elements
  const queryToggleBtn = document.getElementById('query-toggle-btn');
  const querySection = document.getElementById('query-section');
  const copyAsciiBtn = document.getElementById('copy-ascii-btn');

  // Diagnostic HUD Elements
  const timelineSection = document.getElementById('deliberation-timeline');
  const timelineStatusMsg = document.getElementById('timeline-status-msg');
  const magiCoreSection = document.getElementById('magi-core-section');

  // Tactical Elements
  const tacticalQueryDisplay = document.getElementById('tactical-query-display');
  const tacticalArrow1 = document.getElementById('tactical-arrow-1');
  const tacticalArrow2 = document.getElementById('tactical-arrow-2');
  const tacticalFlowStatus = document.getElementById('tactical-flow-status');
  const tacticalCoreBox = document.getElementById('tactical-core-box');
  const tacticalCoreDecision = document.getElementById('tactical-core-decision');
  const tacticalCoreConf = document.getElementById('tactical-core-conf');
  const tacticalCoreVerdict = document.getElementById('tactical-core-verdict');

  // Anime View Elements
  const animeCrtMonitor = document.querySelector('.anime-crt-monitor');
  const animeScreenBalthasar = document.getElementById('anime-screen-balthasar');
  const animeScreenCasper = document.getElementById('anime-screen-casper');
  const animeScreenMelchior = document.getElementById('anime-screen-melchior');
  const animeVoteBalthasar = document.getElementById('anime-vote-balthasar');
  const animeVoteCasper = document.getElementById('anime-vote-casper');
  const animeVoteMelchior = document.getElementById('anime-vote-melchior');
  const animeConfBalthasar = document.getElementById('anime-conf-balthasar');
  const animeConfCasper = document.getElementById('anime-conf-casper');
  const animeConfMelchior = document.getElementById('anime-conf-melchior');
  const animeConsensusStamp = document.getElementById('anime-consensus-stamp');
  const animeStampText = document.getElementById('anime-stamp-text');
  const animeResolutionLabel = document.getElementById('anime-resolution-label');
  const animeCodeVal = document.getElementById('anime-code-val');
  const animeExMode = document.getElementById('anime-ex-mode');
  const animeQuestionForm = document.getElementById('anime-question-form');
  const animeConsoleInput = document.getElementById('anime-console-input');
  const animeConsoleSubmitBtn = document.getElementById('anime-console-submit-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const animeMonitorFsBtn = document.getElementById('anime-monitor-fullscreen-btn');
  const mockDropdownContainer = document.getElementById('mock-dropdown-container');
  const mockQuerySelect = document.getElementById('mock-query-select');
  const animeMockQuerySelect = document.getElementById('anime-mock-query-select');
  const lblDropdownHint = document.getElementById('lbl-dropdown-hint');

  // Investigation Elements
  const investigationSection = document.getElementById('investigation-section');
  const investigationHeaderToggle = document.getElementById('investigation-header-toggle');
  const btnToggleInvestigation = document.getElementById('btn-toggle-investigation');
  const investigationBody = document.getElementById('investigation-body');

  let currentResult = null;
  let isFastMode = localStorage.getItem(STORAGE_KEYS.FAST_MODE) === 'true';
  let isCloudDeployment = window.location.hostname.includes('vercel.app');
  let currentLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';

  // 1. Initialize Sub-Modules
  initAudio(audioToggleBtn, () => I18N[currentLang] || I18N.en);

  initViewManager({
    btnModeCommand,
    btnModeLegacy,
    btnViewAnime,
    btnViewTactical,
    btnViewDiagnostic,
    animeView,
    tacticalView,
    diagnosticView,
    toolsMenuBtn,
    toolsDropdownMenu,
  });

  initAnimeView();
  initTacticalView();
  initDiagnosticView();
  initTimeline({ timelineStatusMsg });

  // 2. Initialize Modals
  initModals(
    {
      jsonModalBtn: document.getElementById('json-modal-btn'),
      toolsJsonModalBtn: document.getElementById('tools-json-modal-btn'),
      jsonModal: document.getElementById('json-modal'),
      modalCloseBtn: document.getElementById('modal-close-btn'),
      modalCopyBtn: document.getElementById('modal-copy-btn'),
      modalJsonContent: document.getElementById('modal-json-content'),
      compareBtn: document.getElementById('compare-btn'),
      compareModal: document.getElementById('compare-modal'),
      compareCloseBtn: document.getElementById('compare-close-btn'),
      compareSingleBody: document.getElementById('compare-single-body'),
      compareMagiBody: document.getElementById('compare-magi-body'),
      compareDiffSummary: document.getElementById('compare-diff-summary'),
      queryInput,
      langSelect,
      modeToggle,
      benchmarkBtn: document.getElementById('benchmark-btn'),
      benchmarkModal: document.getElementById('benchmark-modal'),
      benchmarkCloseBtn: document.getElementById('benchmark-close-btn'),
      benchmarkContent: document.getElementById('benchmark-content'),
      storageModalBtn: document.getElementById('storage-modal-btn'),
      storageModal: document.getElementById('storage-modal'),
      storageCloseBtn: document.getElementById('storage-close-btn'),
      storageDirPath: document.getElementById('storage-dir-path'),
      storageTotalFiles: document.getElementById('storage-total-files'),
      storageTotalSize: document.getElementById('storage-total-size'),
      storageFilesTableBody: document.getElementById('storage-files-table-body'),
      storageBackupPathInput: document.getElementById('storage-backup-path-input'),
      storageBackupExecuteBtn: document.getElementById('storage-backup-execute-btn'),
      storageBackupStatus: document.getElementById('storage-backup-status'),
      operatorUnlockBtn,
      toolsDropdownMenu,
      toolsMenuBtn,
      aboutModalBtn: document.getElementById('about-modal-btn'),
      sessionAboutPill: document.getElementById('session-about-pill'),
      aboutModal: document.getElementById('about-modal'),
      aboutModalCloseBtn: document.getElementById('about-modal-close-btn'),
    },
    {
      getCurrentResult: () => currentResult,
      syncQueryDisplay: (q) => syncQueryDisplay(q),
      isFastMode: () => isFastMode,
      getApiBaseUrl: () => state.api.baseUrl,
      onOperatorAuthChange: (isAuthed) => {
        if (isAuthed) unlockOperatorUI();
        else lockOperatorUI();
      },
      onHealthCheckRequested: () => checkHealth(),
    }
  );

  // 3. Initialize Debug Simulation Suite
  initDebugSimulation(
    {
      debugSection: operatorDebugSection,
      floatingOperatorDock: operatorDebugDock,
      toolsMenuBtn,
      debugTriggerThinking: document.getElementById('debug-trigger-thinking'),
      debugTriggerRounds: document.getElementById('debug-trigger-rounds'),
      debugTriggerEmergency: document.getElementById('debug-trigger-emergency'),
      debugTriggerReset: document.getElementById('debug-trigger-reset'),
      dockBtnThinking: document.getElementById('dock-btn-thinking'),
      dockBtnRounds: document.getElementById('dock-btn-rounds'),
      dockBtnEmergency: document.getElementById('dock-btn-emergency'),
      dockBtnReset: document.getElementById('dock-btn-reset'),
      tacticalFlowStatus,
      tacticalArrow1,
      tacticalArrow2,
      tacticalCoreBox,
      tacticalCoreDecision,
      tacticalCoreConf,
      tacticalCoreVerdict,
      timelineSection,
      magiCoreSection,
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
      submitBtn,
      animeConsoleSubmitBtn,
      animeConsoleInput,
    },
    {
      syncQueryDisplay: (q) => syncQueryDisplay(q),
      setQueryCollapsed: (c) => setQueryCollapsed(c),
      onDeliberationComplete: (res) => {
        currentResult = res;
      },
    }
  );

  // Floating dock toggle
  debugDockToggleBtn?.addEventListener('click', () => {
    if (!operatorDebugDock) return;
    const isMin = operatorDebugDock.classList.toggle('minimized');
    debugDockToggleBtn.textContent = isMin ? '+' : '_';
    debugDockToggleBtn.title = isMin ? 'Expand Operator Debug HUD' : 'Minimize Operator Debug HUD';
  });

  // Pre-deliberation investigation toggle
  function toggleInvestigation() {
    if (!investigationBody) return;
    const isHidden = investigationBody.classList.toggle('hidden');
    if (btnToggleInvestigation) {
      btnToggleInvestigation.textContent = isHidden ? 'EXPAND ▼' : 'COLLAPSE ▲';
    }
  }

  btnToggleInvestigation?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleInvestigation();
  });
  investigationHeaderToggle?.addEventListener('click', toggleInvestigation);

  // Query console collapsible toggle
  function setQueryCollapsed(collapsed) {
    if (!querySection || !queryToggleBtn) return;
    if (collapsed) {
      querySection.classList.add('collapsed');
      queryToggleBtn.textContent = 'EXPAND CONSOLE ?';
      queryToggleBtn.classList.remove('active');
    } else {
      querySection.classList.remove('collapsed');
      queryToggleBtn.textContent = 'COLLAPSE CONSOLE ?';
      queryToggleBtn.classList.add('active');
    }
    localStorage.setItem('magi_query_collapsed', collapsed ? 'true' : 'false');
  }

  queryToggleBtn?.addEventListener('click', () => {
    const isCurrentlyCollapsed = querySection?.classList.contains('collapsed');
    setQueryCollapsed(!isCurrentlyCollapsed);
    playBeep(480, 0.03, 'sine');
  });

  if (localStorage.getItem('magi_query_collapsed') === 'true') {
    setQueryCollapsed(true);
  }

  // Tactical / Anime Agent Inspect Popover
  document.querySelectorAll('.tactical-card, .anime-screen').forEach(el => {
    el.addEventListener('click', () => {
      const agentId = el.getAttribute('data-agent');
      if (!currentResult) {
        alert('Please submit a query first to audit supercomputer deliberation logs.');
        return;
      }
      openTacticalAgentModal(agentId, currentResult);
    });
  });

  // Epistemic Reputation Loader
  async function loadEpistemicReputation() {
    try {
      const data = await fetchEpistemicReputation();
      if (data.profiles) renderReputationProfiles(data.profiles);
    } catch {}
  }
  loadEpistemicReputation();

  // Mock Dropdown Synchronization
  function populateMockDropdowns(lang) {
    if (!mockQuerySelect && !animeMockQuerySelect) return;
    const currentQ = (queryInput?.value || '').trim();

    let html = '';
    const categories = ['arch', 'reliability', 'delivery', 'ethics', 'lore'];
    for (const catKey of categories) {
      const catLabel = CURATED_MOCK_CATEGORIES[catKey]?.[lang] || CURATED_MOCK_CATEGORIES[catKey]?.en || catKey;
      html += `<optgroup label="${escapeHtml(catLabel)}">`;
      const dilemmas = CURATED_MOCK_DILEMMAS.filter(d => d.category === catKey);
      for (const d of dilemmas) {
        const title = d.labels[lang] || d.labels.en;
        const qText = d.queries[lang] || d.queries.en;
        const isSelected = currentQ && (currentQ === qText || Object.values(d.queries).includes(currentQ));
        html += `<option value="${escapeHtml(qText)}" ${isSelected ? 'selected' : ''}>${escapeHtml(title)}</option>`;
      }
      html += `</optgroup>`;
    }

    if (mockQuerySelect) mockQuerySelect.innerHTML = html;
    if (animeMockQuerySelect) animeMockQuerySelect.innerHTML = html;

    const activeVal = mockQuerySelect?.value || animeMockQuerySelect?.value;
    if (activeVal && (!queryInput.value || CURATED_MOCK_DILEMMAS.some(d => Object.values(d.queries).includes(queryInput.value)))) {
      queryInput.value = activeVal;
      if (animeConsoleInput) animeConsoleInput.value = activeVal;
      syncQueryDisplay(activeVal, 'mock-select');
    }
  }

  function updateInputModeUI() {
    const isMock = modeToggle.value === 'mock';

    if (isMock) {
      if (mockDropdownContainer) mockDropdownContainer.classList.remove('hidden');
      if (queryInput) {
        queryInput.classList.add('hidden');
        queryInput.removeAttribute('required');
      }
      if (animeConsoleInput) {
        animeConsoleInput.classList.add('hidden');
        animeConsoleInput.removeAttribute('required');
      }
      if (animeMockQuerySelect) {
        animeMockQuerySelect.classList.remove('hidden');
      }
      const currentSelected = mockQuerySelect?.value || animeMockQuerySelect?.value;
      if (currentSelected) {
        queryInput.value = currentSelected;
        if (animeConsoleInput) animeConsoleInput.value = currentSelected;
        syncQueryDisplay(currentSelected, 'mock-select');
      }
    } else {
      if (mockDropdownContainer) mockDropdownContainer.classList.add('hidden');
      if (queryInput) {
        queryInput.classList.remove('hidden');
        queryInput.setAttribute('required', 'required');
      }
      if (animeConsoleInput) {
        animeConsoleInput.classList.remove('hidden');
        animeConsoleInput.setAttribute('required', 'required');
        autoResizeTextarea(animeConsoleInput);
      }
      if (animeMockQuerySelect) {
        animeMockQuerySelect.classList.add('hidden');
      }
    }
  }

  function applyLanguage(lang) {
    const t = I18N[lang] || I18N.en;
    currentLang = lang;
    if (langSelect && langSelect.value !== lang) {
      langSelect.value = lang;
    }

    // Header controls
    const lblCtrlLang = document.getElementById('lbl-ctrl-lang');
    if (lblCtrlLang) lblCtrlLang.textContent = t.ctrl_lang;
    const lblCtrlEngine = document.getElementById('lbl-ctrl-engine');
    if (lblCtrlEngine) lblCtrlEngine.textContent = t.ctrl_engine;

    // View toggle buttons
    if (btnModeCommand) btnModeCommand.textContent = t.view_command || 'COMMAND CENTER';
    if (btnModeLegacy) btnModeLegacy.textContent = t.view_anime ? `${t.view_anime} (LEGACY)` : 'ANIME MAGI (LEGACY)';
    if (btnViewTactical) btnViewTactical.textContent = t.view_tactical;
    if (btnViewDiagnostic) btnViewDiagnostic.textContent = t.view_diagnostic;

    // Query section
    const lblTerminalTitle = document.getElementById('lbl-terminal-title');
    if (lblTerminalTitle) lblTerminalTitle.textContent = t.terminal_title;
    if (queryInput) queryInput.placeholder = t.query_placeholder;
    if (lblDropdownHint) lblDropdownHint.textContent = t.dropdown_hint;
    populateMockDropdowns(lang);
    const lblPresets = document.getElementById('lbl-presets');
    if (lblPresets) lblPresets.textContent = t.presets_label;

    // Presets
    const p1 = document.getElementById('preset-btn-1');
    if (p1) { p1.textContent = t.preset_1_title; p1.setAttribute('data-query', t.preset_1_query); }
    const p2 = document.getElementById('preset-btn-2');
    if (p2) { p2.textContent = t.preset_2_title; p2.setAttribute('data-query', t.preset_2_query); }
    const p3 = document.getElementById('preset-btn-3');
    if (p3) { p3.textContent = t.preset_3_title; p3.setAttribute('data-query', t.preset_3_query); }
    const p4 = document.getElementById('preset-btn-4');
    if (p4) { p4.textContent = t.preset_4_title; p4.setAttribute('data-query', t.preset_4_query); }

    // Action buttons
    if (copyAsciiBtn) copyAsciiBtn.textContent = t.btn_copy_ascii;
    const compareBtn = document.getElementById('compare-btn');
    if (compareBtn) compareBtn.textContent = t.btn_compare;
    const benchmarkBtn = document.getElementById('benchmark-btn');
    if (benchmarkBtn) benchmarkBtn.textContent = t.btn_benchmark;
    if (queryDemoBtn) queryDemoBtn.textContent = t.btn_demo || 'LOAD DEMO DELIBERATION';
    const aboutModalBtn = document.getElementById('about-modal-btn');
    if (aboutModalBtn) aboutModalBtn.textContent = t.btn_about || 'ABOUT THIS SYSTEM // DOCS';
    const sessionAboutPill = document.getElementById('session-about-pill');
    if (sessionAboutPill) sessionAboutPill.textContent = t.pill_about || 'DOCS / ARCHITECTURE';
    if (submitBtn && !submitBtn.disabled) submitBtn.innerHTML = `<span class="btn-text">${t.btn_deliberate}</span>`;

    // Anime Monitor & Console
    if (animeResolutionLabel && (animeResolutionLabel.textContent.includes('STANDBY') || animeResolutionLabel.textContent.includes('ESPERA') || animeResolutionLabel.textContent.includes('AGUARDANDO') || animeResolutionLabel.textContent.includes('BEREIT') || animeResolutionLabel.textContent.includes('ОЖИДАНИЕ') || animeResolutionLabel.textContent.includes('待機'))) {
      animeResolutionLabel.textContent = t.anime_res_standby;
    }
    const lblAccess = document.getElementById('lbl-access-code');
    if (lblAccess) lblAccess.textContent = t.console_access_code;
    const lblQuestion = document.getElementById('lbl-question');
    if (lblQuestion) lblQuestion.textContent = t.console_question;
    const lblTelemetry = document.getElementById('lbl-telemetry');
    if (lblTelemetry) lblTelemetry.textContent = t.console_telemetry;
    if (animeConsoleInput) animeConsoleInput.placeholder = t.console_placeholder;
    if (animeConsoleSubmitBtn && !animeConsoleSubmitBtn.disabled) {
      animeConsoleSubmitBtn.textContent = t.console_execute_btn;
    }

    // Anime Chat
    const lblChatTitle = document.getElementById('lbl-chat-title');
    if (lblChatTitle) lblChatTitle.textContent = t.chat_title;
    const animeChatClearBtn = document.getElementById('anime-chat-clear-btn');
    if (animeChatClearBtn) animeChatClearBtn.textContent = t.chat_clear_btn;
    const animeChatToggleBtn = document.getElementById('anime-chat-toggle-btn');
    const animeChatWrapper = document.getElementById('anime-chat-wrapper');
    if (animeChatToggleBtn) {
      const isCollapsed = animeChatWrapper?.classList.contains('collapsed');
      animeChatToggleBtn.textContent = isCollapsed ? t.chat_show_btn : t.chat_hide_btn;
    }

    // Tactical labels
    const tQueryLbl = document.querySelector('.tactical-query-label');
    if (tQueryLbl) tQueryLbl.textContent = t.tactical_query_label;
    const tFlowTitle = document.querySelector('.tactical-flow-title');
    if (tFlowTitle) tFlowTitle.textContent = t.tactical_flow_title;
    const tInspectTags = document.querySelectorAll('.tactical-inspect-tag');
    tInspectTags.forEach(el => el.textContent = t.tactical_inspect_tag);
    const tAnimeInspectHints = document.querySelectorAll('.anime-inspect-hint');
    tAnimeInspectHints.forEach(el => el.textContent = t.anime_inspect_hint);

    // Tactical Roles
    const tCardMelchiorRole = document.querySelector('#tactical-card-melchior .tactical-card-role');
    if (tCardMelchiorRole) tCardMelchiorRole.textContent = t.tactical_roles?.MELCHIOR || 'MELCHIOR-1';
    const tCardBalthasarRole = document.querySelector('#tactical-card-balthasar .tactical-card-role');
    if (tCardBalthasarRole) tCardBalthasarRole.textContent = t.tactical_roles?.BALTHASAR || 'BALTHASAR-2';
    const tCardCasperRole = document.querySelector('#tactical-card-casper .tactical-card-role');
    if (tCardCasperRole) tCardCasperRole.textContent = t.tactical_roles?.CASPER || 'CASPER-3';

    // Stepper track
    const sR0 = document.querySelector('#step-r0 .step-desc');
    if (sR0) sR0.innerHTML = t.diag_step_r0;
    const sGate1 = document.querySelector('#step-gate1 .step-desc');
    if (sGate1) sGate1.innerHTML = t.diag_step_gate1;
    const sR1 = document.querySelector('#step-r1 .step-desc');
    if (sR1) sR1.innerHTML = t.diag_step_r1;
    const sGate2 = document.querySelector('#step-gate2 .step-desc');
    if (sGate2) sGate2.innerHTML = t.diag_step_gate2;
    const sR2 = document.querySelector('#step-r2 .step-desc');
    if (sR2) sR2.innerHTML = t.diag_step_r2;
    const sCore = document.querySelector('#step-core .step-desc');
    if (sCore) sCore.innerHTML = t.diag_step_core;

    updateAudioButtonUI(t.audio_on, t.audio_off);
  }

  langSelect?.addEventListener('change', () => {
    const newLang = langSelect.value || 'en';
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, newLang);
    applyLanguage(newLang);
    playBeep(480, 0.04, 'triangle');
  });

  applyLanguage(currentLang);
  updateInputModeUI();

  // Engine Dropdown Management
  function updateEngineDropdown(isOperator, defaultEngine = null) {
    if (!modeToggle) return;
    const currentVal = modeToggle.value;

    const allowed = ALL_ENGINE_OPTIONS.filter(opt => {
      if (opt.localOnly && isCloudDeployment) return false;
      if (!isOperator && opt.value !== 'mock' && opt.value !== 'groq-free') return false;
      return true;
    });

    modeToggle.innerHTML = allowed
      .map(opt => {
        let tText = opt.text;
        const t = typeof I18N !== 'undefined' ? (I18N[currentLang] || I18N.en) : null;
        if (t) {
          if (opt.value === 'mock') tText = t.engine_mock || opt.text;
          if (opt.value === 'groq-free') tText = t.engine_core || opt.text;
        }
        return `<option value="${opt.value}">${tText}</option>`;
      })
      .join('');

    if (defaultEngine && allowed.some(opt => opt.value === defaultEngine)) {
      modeToggle.value = defaultEngine;
    } else if (allowed.some(opt => opt.value === currentVal)) {
      modeToggle.value = currentVal;
    } else {
      const saved = localStorage.getItem(STORAGE_KEYS.ENGINE_MODE);
      if (saved && allowed.some(opt => opt.value === saved)) {
        modeToggle.value = saved;
      } else if (isOperator && allowed.some(opt => opt.value === 'groq-free')) {
        modeToggle.value = 'groq-free';
      } else if (isOperator && allowed.some(opt => opt.value === 'gemini')) {
        modeToggle.value = 'gemini';
      } else {
        modeToggle.value = allowed[0].value;
      }
    }

    modeToggle.disabled = false;
    modeToggle.removeAttribute('disabled');
    modeToggle.classList.remove('locked');

    if (engineLockedBadge) {
      engineLockedBadge.classList.add('hidden');
    }

    updateInputModeUI();
  }

  // =========================================================================
  // OPERATOR COCKPIT & CONSOLE MANAGEMENT (SPRINT 2)
  // =========================================================================
  const operatorModal = document.getElementById('operator-modal');
  const operatorModalCloseBtn = document.getElementById('operator-modal-close-btn');
  const operatorModalTitleText = document.getElementById('operator-modal-title-text');
  const operatorHeaderLed = document.getElementById('operator-header-led');
  const operatorLockedView = document.getElementById('operator-locked-view');
  const operatorAuthorizedView = document.getElementById('operator-authorized-view');
  const operatorLoginForm = document.getElementById('operator-login-form');
  const operatorAuthKeyInput = document.getElementById('operator-auth-key-input');
  const operatorAuthFeedback = document.getElementById('operator-auth-feedback');
  const operatorCountdownVal = document.getElementById('operator-countdown-val');
  const operatorLogoutBtn = document.getElementById('operator-logout-btn');
  const sessionAccessPill = document.getElementById('session-access-pill');

  let sessionCountdownInterval = null;

  function updateOperatorConsoleView() {
    const isAuth = isOperatorAuthenticated();
    if (operatorLockedView) operatorLockedView.classList.toggle('hidden', isAuth);
    if (operatorAuthorizedView) operatorAuthorizedView.classList.toggle('hidden', !isAuth);

    if (operatorModalTitleText) {
      operatorModalTitleText.textContent = isAuth
        ? 'MAGI // OPERATOR CONSOLE [AUTHORIZED]'
        : 'MAGI // OPERATOR CONSOLE [LOCKED]';
    }

    if (operatorHeaderLed) {
      operatorHeaderLed.className = `operator-header-led ${isAuth ? 'authorized' : ''}`;
    }

    if (operatorUnlockBtn) {
      operatorUnlockBtn.textContent = isAuth
        ? 'OPERATOR CONSOLE [AUTHORIZED]'
        : 'OPERATOR CONSOLE [LOCKED]';
      operatorUnlockBtn.classList.toggle('active', isAuth);
    }

    if (isAuth) {
      startSessionCountdown();
      syncOperatorControlsData();
    } else {
      stopSessionCountdown();
    }
  }

  function startSessionCountdown() {
    stopSessionCountdown();
    updateCountdownDisplay();
    sessionCountdownInterval = setInterval(updateCountdownDisplay, 1000);
  }

  function stopSessionCountdown() {
    if (sessionCountdownInterval) {
      clearInterval(sessionCountdownInterval);
      sessionCountdownInterval = null;
    }
  }

  function updateCountdownDisplay() {
    const remainingMs = getOperatorRemainingMs();
    if (remainingMs <= 0 && isOperatorAuthenticated()) {
      handleOperatorLogout(true);
      return;
    }
    const totalSec = Math.floor(remainingMs / 1000);
    const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    if (operatorCountdownVal) {
      operatorCountdownVal.textContent = `${mins}:${secs}`;
    }
  }

  function openOperatorModal() {
    if (!operatorModal) return;
    operatorModal.classList.remove('hidden');
    updateOperatorConsoleView();
    if (!isOperatorAuthenticated() && operatorAuthKeyInput) {
      operatorAuthKeyInput.value = '';
      if (operatorAuthFeedback) operatorAuthFeedback.classList.add('hidden');
      setTimeout(() => operatorAuthKeyInput.focus(), 50);
    }
    playBeep(520, 0.04, 'triangle');
  }

  function closeOperatorModal() {
    if (!operatorModal) return;
    operatorModal.classList.add('hidden');
  }

  async function handleOperatorLogin(e) {
    e.preventDefault();
    const key = (operatorAuthKeyInput?.value || '').trim();
    if (!key) return;

    if (operatorAuthFeedback) {
      operatorAuthFeedback.className = 'operator-auth-feedback';
      operatorAuthFeedback.textContent = 'VERIFYING OPERATOR CREDENTIALS...';
      operatorAuthFeedback.classList.remove('hidden');
    }

    try {
      const res = await fetch(getApiUrl('/api/auth/operator'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        saveOperatorSession(data.token || key, data.expiresAt);
        if (operatorAuthFeedback) {
          operatorAuthFeedback.className = 'operator-auth-feedback success';
          operatorAuthFeedback.textContent = 'AUTHORIZATION GRANTED. WELCOME OPERATOR.';
        }
        playNervTripletBeep('approve');
        setTimeout(() => {
          unlockOperatorUI();
          updateOperatorConsoleView();
          updateOperationalSummary();
        }, 300);
      } else {
        if (operatorAuthFeedback) {
          operatorAuthFeedback.className = 'operator-auth-feedback error';
          operatorAuthFeedback.textContent = data.error || 'INVALID OPERATOR CREDENTIAL.';
        }
        playNervTripletBeep('reject');
      }
    } catch (err) {
      // Offline fallback: if key is non-empty, allow local operator test session
      if (key) {
        saveOperatorSession(key, new Date(Date.now() + 30 * 60 * 1000).toISOString());
        unlockOperatorUI();
        updateOperatorConsoleView();
        updateOperationalSummary();
      }
    }
  }

  async function handleOperatorLogout(isExpired = false) {
    const token = getAdminKey();
    try {
      if (token) {
        await fetch(getApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: { 'X-Operator-Token': token },
        }).catch(() => {});
      }
    } catch {}

    clearOperatorSession();
    lockOperatorUI();
    updateOperatorConsoleView();
    updateOperationalSummary();
    playBeep(320, 0.08, 'sawtooth');
    if (isExpired && operatorAuthFeedback) {
      operatorAuthFeedback.className = 'operator-auth-feedback error';
      operatorAuthFeedback.textContent = 'OPERATOR SESSION EXPIRED. RE-AUTHENTICATION REQUIRED.';
      operatorAuthFeedback.classList.remove('hidden');
    }
  }

  // Operator Tabs Switching
  document.querySelectorAll('.op-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      document.querySelectorAll('.op-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.op-tab-pane').forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById(targetId)?.classList.remove('hidden');
      playBeep(480, 0.03, 'sine');
    });
  });

  // Sync Operator Controls Data
  function syncOperatorControlsData() {
    const opEngineSelect = document.getElementById('op-engine-select');
    const opDefaultEngineVal = document.getElementById('op-default-engine-val');
    const opActiveEngineVal = document.getElementById('op-active-engine-val');
    const opTempDisplay = document.getElementById('op-temp-display');
    const opTemperatureInput = document.getElementById('op-temperature-input');

    if (opEngineSelect) opEngineSelect.value = modeToggle.value;
    if (opDefaultEngineVal) opDefaultEngineVal.textContent = 'MOCK FIXTURES';
    if (opActiveEngineVal) {
      const activeText = modeToggle.options[modeToggle.selectedIndex]?.textContent || modeToggle.value;
      opActiveEngineVal.textContent = activeText.toUpperCase();
    }
    if (opTempDisplay && opTemperatureInput) {
      opTempDisplay.textContent = opTemperatureInput.value;
    }

    // Diagnostics statuses
    const opDiagGroq = document.getElementById('op-diag-groq');
    const opDiagGemini = document.getElementById('op-diag-gemini');
    if (opDiagGroq && groqStatusChip) {
      opDiagGroq.className = groqStatusChip.className.replace('status-chip', 'diag-status');
      opDiagGroq.textContent = groqStatusChip.textContent;
    }
    if (opDiagGemini && geminiStatusChip) {
      opDiagGemini.className = geminiStatusChip.className.replace('status-chip', 'diag-status');
      opDiagGemini.textContent = geminiStatusChip.textContent;
    }

    // Raw payload inspector
    const opRawJson = document.getElementById('op-raw-json-inspector');
    if (opRawJson) {
      if (currentResult) {
        opRawJson.textContent = JSON.stringify(currentResult, null, 2);
      } else {
        opRawJson.textContent = 'Awaiting deliberation execution...';
      }
    }
  }

  // Model Override Apply Button
  const opApplyModelBtn = document.getElementById('op-apply-model-btn');
  opApplyModelBtn?.addEventListener('click', () => {
    const opEngineSelect = document.getElementById('op-engine-select');
    const opTemperatureInput = document.getElementById('op-temperature-input');
    const opTokensInput = document.getElementById('op-tokens-input');
    const opFeedback = document.getElementById('op-model-feedback');

    if (opEngineSelect) {
      modeToggle.value = opEngineSelect.value;
      localStorage.setItem(STORAGE_KEYS.ENGINE_MODE, opEngineSelect.value);
      setEngineMode(opEngineSelect.value);
      updateInputModeUI();
    }

    if (opTemperatureInput) {
      state.engine.override.temperature = parseFloat(opTemperatureInput.value) || 0.2;
    }
    if (opTokensInput) {
      state.engine.override.maxTokens = parseInt(opTokensInput.value, 10) || 2048;
    }
    state.engine.override.active = true;

    updateOperationalSummary();
    syncOperatorControlsData();

    if (opFeedback) {
      opFeedback.textContent = 'MODEL OVERRIDE APPLIED SUCCESSFULLY!';
      opFeedback.classList.remove('hidden');
      setTimeout(() => opFeedback.classList.add('hidden'), 2500);
    }
    playBeep(640, 0.05, 'triangle');
  });

  // Temperature slider display sync
  const opTempInput = document.getElementById('op-temperature-input');
  opTempInput?.addEventListener('input', () => {
    const disp = document.getElementById('op-temp-display');
    if (disp) disp.textContent = opTempInput.value;
  });

  // Deliberation Force Full / Fast Buttons
  document.getElementById('op-btn-force-full')?.addEventListener('click', () => {
    setFastMode(false);
    isFastMode = false;
    updateFastModeUI();
    document.getElementById('op-btn-force-full')?.classList.add('active');
    document.getElementById('op-btn-force-fast')?.classList.remove('active');
    playBeep(520, 0.04, 'sine');
  });

  document.getElementById('op-btn-force-fast')?.addEventListener('click', () => {
    setFastMode(true);
    isFastMode = true;
    updateFastModeUI();
    document.getElementById('op-btn-force-fast')?.classList.add('active');
    document.getElementById('op-btn-force-full')?.classList.remove('active');
    playBeep(640, 0.05, 'sine');
  });

  // Test Harness triggers inside Operator Console
  document.getElementById('op-test-thinking')?.addEventListener('click', () => {
    document.getElementById('dock-btn-thinking')?.click();
  });
  document.getElementById('op-test-consensus')?.addEventListener('click', () => {
    document.getElementById('dock-btn-rounds')?.click();
  });
  document.getElementById('op-test-divergence')?.addEventListener('click', () => {
    document.getElementById('dock-btn-rounds')?.click();
  });
  document.getElementById('op-test-emergency')?.addEventListener('click', () => {
    document.getElementById('dock-btn-emergency')?.click();
  });
  document.getElementById('op-test-reset')?.addEventListener('click', () => {
    document.getElementById('dock-btn-reset')?.click();
  });

  // Sprint 3: Presentation Speed Controls
  document.querySelectorAll('.op-speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = Number(btn.getAttribute('data-speed')) || 1.0;
      setPresentationSpeed(speed);
      document.querySelectorAll('.op-speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      playBeep(520, 0.04, 'sine');
    });
  });

  // Sprint 3: Cinematic Recording Mode
  const opBtnCinematic = document.getElementById('op-btn-cinematic');
  const cinematicExitBtn = document.getElementById('cinematic-exit-btn');

  function toggleCinematicRecording(forceState) {
    const next = typeof forceState === 'boolean' ? forceState : !state.run.cinematicMode;
    setCinematicMode(next);
    if (opBtnCinematic) {
      opBtnCinematic.textContent = next ? 'EXIT CINEMATIC RECORDING MODE' : 'TOGGLE CINEMATIC RECORDING MODE';
      opBtnCinematic.classList.toggle('active', next);
    }
    if (next) {
      closeOperatorModal();
      playBeep(640, 0.05, 'triangle');
    } else {
      playBeep(440, 0.04, 'sine');
    }
  }

  opBtnCinematic?.addEventListener('click', () => toggleCinematicRecording());
  cinematicExitBtn?.addEventListener('click', () => toggleCinematicRecording(false));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.run.cinematicMode) {
      toggleCinematicRecording(false);
    }
  });

  // Sprint 3: Scripted Demo Scenarios
  const scenarioQuestions = {
    'rust-migration': {
      en: 'Should we migrate our backend infrastructure from Node.js to Rust?',
      pt: 'Devemos migrar a infraestrutura do nosso backend de Node.js para Rust?'
    },
    'dummy-plug-override': {
      en: 'EVA-01 Bardiel Encounter: Authorize emergency Dummy Plug activation?',
      pt: 'EVA-01 Encontro Bardiel: Autorizar ativação de emergência do Dummy Plug?'
    },
    'black-friday-cpu': {
      en: 'Production incident: 95% CPU saturation during traffic surge. Authorize degradation load shedding?',
      pt: 'Incidente de produção: saturação de 95% de CPU sob tráfego crítico. Autorizar descarte gracioso de carga?'
    },
    'human-instrumentality': {
      en: 'SEELE Order 99: Authorize final Human Instrumentality Protocol initiation?',
      pt: 'Ordem SEELE 99: Autorizar início do Protocolo de Instrumentalidade Humana?'
    }
  };

  document.querySelectorAll('.op-load-scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const scenarioKey = btn.getAttribute('data-scenario');
      const lang = (currentLang || 'en').startsWith('pt') ? 'pt' : 'en';
      const qText = scenarioQuestions[scenarioKey]?.[lang] || scenarioQuestions[scenarioKey]?.en || 'Deliberation Scenario';

      setOperatorOverride(true, scenarioKey);
      recordExecutionTelemetry('operator-override', { preset: scenarioKey });

      queryInput.value = qText;
      if (animeConsoleInput) animeConsoleInput.value = qText;
      syncQueryDisplay(qText, 'operator-override');

      closeOperatorModal();
      playNervTripletBeep('processing');

      if (form.requestSubmit) {
        form.requestSubmit();
      } else {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  });

  // Sprint 3: Fault Resilience Simulation (504 Timeout & 429 Rate Limit)
  function simulateNetworkFault(message) {
    if (isPlayingQueue) {
      playbackQueue.length = 0;
      isPlayingQueue = false;
    }
    setRunStatus('error', state.run.currentStep, 'fault');
    updateOperationalSummary();
    setTimelineStatus(`[FAULT SIMULATION]: ${message}`);

    if (timelineSection) timelineSection.classList.remove('hidden');
    if (magiCoreSection) {
      magiCoreSection.classList.remove('hidden');
      const banner = document.getElementById('core-verdict-banner');
      const text = document.getElementById('core-verdict-text');
      const badge = document.getElementById('core-decision-badge');
      if (banner) banner.className = 'core-verdict-banner error';
      if (text) text.textContent = message;
      if (badge) {
        badge.textContent = 'FAULT';
        badge.className = 'decision-badge rejected';
      }
    }

    if (tacticalFlowStatus) {
      tacticalFlowStatus.textContent = 'CIRCUIT BREAKER: TRIPPED';
      tacticalFlowStatus.className = 'tactical-flow-status error';
    }

    if (animeResolutionLabel) {
      animeResolutionLabel.textContent = `FAULT: ${message.slice(0, 60)}`;
    }
    if (animeConsensusStamp) {
      animeConsensusStamp.className = 'anime-stamp-box stamp-emergency';
      if (animeStampText) animeStampText.textContent = '故 障';
    }
    if (animeScreenBalthasar) {
      animeScreenBalthasar.className = animeScreenBalthasar.className.replace(/state-\w+/g, '').trim() + ' state-rejected';
    }
    if (animeVoteBalthasar) animeVoteBalthasar.textContent = 'TIMEOUT';
    if (animeVoteCasper) animeVoteCasper.textContent = 'OFFLINE';
    if (animeVoteMelchior) animeVoteMelchior.textContent = 'FAULT';

    playImpasseAlarm();
    addChatGateNotice('error', `[FAULT SIMULATION]: ${message}`);

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-text">RECOVER &amp; DELIBERATE</span>';
    if (animeConsoleSubmitBtn) {
      animeConsoleSubmitBtn.disabled = false;
      animeConsoleSubmitBtn.textContent = 'RETRY [↵]';
    }
    if (animeConsoleInput) animeConsoleInput.disabled = false;
  }

  document.getElementById('op-test-timeout')?.addEventListener('click', () => {
    closeOperatorModal();
    simulateNetworkFault('GATEWAY_TIMEOUT (504): Tri-system synchronization link timed out after 30000ms. Circuit breaker tripped.');
  });

  document.getElementById('op-test-ratelimit')?.addEventListener('click', () => {
    closeOperatorModal();
    simulateNetworkFault('HTTP 429 TOO MANY REQUESTS: Upstream provider rate limit reached. Graceful degradation fallback engaged.');
  });

  // Event Listeners for Operator Modal
  operatorUnlockBtn?.addEventListener('click', openOperatorModal);
  sessionAccessPill?.addEventListener('click', openOperatorModal);
  operatorModalCloseBtn?.addEventListener('click', closeOperatorModal);
  operatorLoginForm?.addEventListener('submit', handleOperatorLogin);
  operatorLogoutBtn?.addEventListener('click', () => handleOperatorLogout(false));
  operatorModal?.addEventListener('click', (e) => {
    if (e.target.id === 'operator-modal') closeOperatorModal();
  });

  function unlockOperatorUI() {
    const t = typeof I18N !== 'undefined' ? (I18N[currentLang] || I18N.en) : {};
    if (operatorUnlockBtn) {
      operatorUnlockBtn.textContent = (t.op_console || 'OPERATOR CONSOLE') + ' [AUTHORIZED]';
      operatorUnlockBtn.classList.add('active');
    }
    updateEngineDropdown(true);
    syncOperatorDebugUI(true);
    updateOperatorConsoleView();
    updateOperationalSummary();
  }

  function lockOperatorUI() {
    const t = typeof I18N !== 'undefined' ? (I18N[currentLang] || I18N.en) : {};
    if (operatorUnlockBtn) {
      operatorUnlockBtn.textContent = (t.op_console || 'OPERATOR CONSOLE') + ' [LOCKED]';
      operatorUnlockBtn.classList.remove('active');
    }
    updateEngineDropdown(false);
    syncOperatorDebugUI(false);
    updateOperatorConsoleView();
    updateOperationalSummary();
  }

  updateEngineDropdown(isOperatorAuthenticated());
  syncOperatorDebugUI(isOperatorAuthenticated());
  updateOperatorConsoleView();

  // Health and Provider Connectivity Monitor
  async function checkHealth() {
    const loc = window.location;
    if (loc.port && loc.port !== '3000' && (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1')) {
      try {
        const probe = await fetch(`http://${loc.hostname}:3000/api/health`, { signal: AbortSignal.timeout(1200) });
        if (probe.ok) {
          setApiBaseUrl(`http://${loc.hostname}:3000`);
        }
      } catch {}
    }

    const isStaticServer = loc.port && loc.port !== '3000' && !state.api.baseUrl && (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1');

    if (isStaticServer) {
      if (systemStatusText) systemStatusText.textContent = 'MOCK STANDALONE // READY';
      if (!localStorage.getItem(STORAGE_KEYS.ENGINE_MODE)) {
        modeToggle.value = 'mock';
      }
      updateInputModeUI();
      return;
    }

    try {
      const adminKey = getAdminKey();
      const data = await checkSystemHealth(adminKey);

      if (typeof data.isVercel === 'boolean') {
        isCloudDeployment = data.isVercel || !!data.modelLocked;
      }

      const isOperator = !!data.isAdmin || isOperatorAuthenticated();
      if (isOperator) {
        unlockOperatorUI();
      } else {
        lockOperatorUI();
      }

      if (groqStatusChip) {
        if (data.groqConfigured) {
          groqStatusChip.className = 'status-chip online';
          groqStatusChip.textContent = 'GROQ: ONLINE';
          groqStatusChip.title = `Groq Cloud API configured (${data.defaultModel || 'openai/gpt-oss-120b'})`;
        } else {
          groqStatusChip.className = 'status-chip offline';
          groqStatusChip.textContent = 'GROQ: NO KEY';
          groqStatusChip.title = 'GROQ_API_KEY not configured in environment';
        }
      }

      if (geminiStatusChip) {
        if (data.geminiConfigured) {
          geminiStatusChip.className = 'status-chip online';
          geminiStatusChip.textContent = 'GEMINI: ONLINE';
          geminiStatusChip.title = `Gemini API configured (${data.defaultModel || '3.1 Pro'})`;
        } else {
          geminiStatusChip.className = 'status-chip offline';
          geminiStatusChip.textContent = 'GEMINI: NO KEY';
          geminiStatusChip.title = 'GEMINI_API_KEY not configured in environment';
        }
      }

      if (data.groqConfigured) {
        if (systemStatusText) systemStatusText.textContent = 'ONLINE // PRODUCTION CORE READY';
      } else if (data.geminiConfigured && isOperator) {
        if (systemStatusText) systemStatusText.textContent = `ONLINE // ${data.defaultModel || 'GEMINI 3.1 PRO'} READY`;
      } else {
        if (systemStatusText) systemStatusText.textContent = 'ONLINE // MOCK FIXTURES ACTIVE';
      }

      const savedMode = localStorage.getItem(STORAGE_KEYS.ENGINE_MODE);
      if (savedMode && modeToggle.querySelector(`option[value="${savedMode}"]`)) {
        modeToggle.value = savedMode;
      } else if (data.groqConfigured && modeToggle.querySelector('option[value="groq-free"]')) {
        modeToggle.value = 'groq-free';
      } else if (isOperator && data.geminiConfigured && modeToggle.querySelector('option[value="gemini"]')) {
        modeToggle.value = 'gemini';
      } else if (modeToggle.querySelector('option[value="mock"]')) {
        modeToggle.value = 'mock';
      }

      updateInputModeUI();
      return;
    } catch {
      if (isOperatorAuthenticated()) {
        unlockOperatorUI();
      } else {
        lockOperatorUI();
      }
    }

    if (systemStatusText) systemStatusText.textContent = 'MOCK STANDALONE // READY';
    if (groqStatusChip) {
      groqStatusChip.className = 'status-chip offline';
      groqStatusChip.textContent = 'GROQ: OFFLINE';
    }
    if (geminiStatusChip) {
      geminiStatusChip.className = 'status-chip offline';
      geminiStatusChip.textContent = 'GEMINI: OFFLINE';
    }
    if (!localStorage.getItem(STORAGE_KEYS.ENGINE_MODE)) {
      modeToggle.value = 'mock';
    }
    updateInputModeUI();
  }
  checkHealth();
  setInterval(checkHealth, 30000);

  // =========================================================================
  // OPERATIONAL STATE & PRE-EXECUTION SUMMARY SYNC
  // =========================================================================
  function updateOperationalSummary() {
    const isMock = modeToggle.value === 'mock' || state.engine.source === 'mock-fixtures';
    const fast = state.engine.fastMode;
    const status = state.run.status || 'ready';

    // 1. Session Ribbon
    const sessionTextEl = document.getElementById('session-ribbon-text');
    const sessionBeaconEl = document.getElementById('session-beacon-dot');
    const sessionAccessPill = document.getElementById('session-access-pill');
    const sessionModePill = document.getElementById('session-mode-pill');

    let engineLabel = 'MOCK FIXTURES';
    let costLabel = 'ZERO TOKEN COST';
    if (state.run.operatorOverride) {
      engineLabel = 'OPERATOR OVERRIDE';
      costLabel = 'SCRIPTED DEMO';
    } else if (!isMock) {
      const selectedOpt = modeToggle.options[modeToggle.selectedIndex];
      engineLabel = selectedOpt ? selectedOpt.textContent.trim() : 'LIVE API';
      costLabel = 'API CONNECTED';
    }

    if (sessionTextEl) {
      sessionTextEl.textContent = `SESSION 01 · ${engineLabel} · ${costLabel} · ${status.toUpperCase()}`;
    }

    // Execution Origin Badges Sync
    const coreOriginBadge = document.getElementById('core-origin-badge');
    const tacticalOriginBadge = document.getElementById('tactical-origin-badge');
    const animeOriginTag = document.getElementById('anime-origin-tag');

    const origin = getExecutionOrigin();
    let badgeText = 'MOCK DEMONSTRATION';
    let badgeClass = 'mock';

    if (origin === 'operator-override') {
      badgeText = 'OPERATOR OVERRIDE · SCRIPTED DEMO';
      badgeClass = 'override';
    } else if (origin === 'live-api') {
      badgeText = 'LIVE DELIBERATION · API ENGINE GENERATED';
      badgeClass = 'live';
    } else {
      badgeText = 'MOCK DEMONSTRATION · ZERO TOKEN COST';
      badgeClass = 'mock';
    }

    if (coreOriginBadge) {
      coreOriginBadge.textContent = badgeText;
      coreOriginBadge.className = `origin-badge ${badgeClass}`;
    }
    if (tacticalOriginBadge) {
      tacticalOriginBadge.textContent = origin === 'operator-override' ? 'OPERATOR OVERRIDE' : (origin === 'live-api' ? 'LIVE DELIBERATION' : 'MOCK DEMONSTRATION');
      tacticalOriginBadge.className = `origin-badge ${badgeClass} tactical-origin-tag`;
    }
    if (animeOriginTag) {
      animeOriginTag.textContent = origin === 'operator-override' ? 'OPERATOR OVERRIDE' : (origin === 'live-api' ? 'LIVE API' : 'MOCK DEMO');
      animeOriginTag.className = `anime-origin-tag ${badgeClass}`;
    }

    if (sessionBeaconEl) {
      sessionBeaconEl.className = `session-beacon-dot ${status}`;
    }

    if (sessionAccessPill) {
      const isOp = isOperatorAuthenticated();
      sessionAccessPill.textContent = isOp ? 'OPERATOR COCKPIT' : 'PUBLIC ACCESS';
      sessionAccessPill.className = `session-pill session-access ${isOp ? 'operator' : ''}`;
    }

    if (sessionModePill) {
      sessionModePill.textContent = fast ? 'FAST DELIBERATION (1 REQ)' : 'FULL DELIBERATION (7 REQ)';
      sessionModePill.className = `session-pill session-mode ${fast ? 'fast' : ''}`;
    }

    // 2. Pre-Execution Summary Bar
    const preStatusVal = document.getElementById('pre-run-status-val');
    const preStrategyVal = document.getElementById('pre-run-strategy-val');
    const preCostVal = document.getElementById('pre-run-cost-val');
    const preTimeVal = document.getElementById('pre-run-time-val');

    if (preStatusVal) {
      preStatusVal.textContent = status.toUpperCase();
      preStatusVal.className = `metric-val status-${status}`;
    }

    if (preStrategyVal) {
      preStrategyVal.textContent = fast ? 'FAST MODE (1 REQUEST)' : 'FULL MODE (7 REQUESTS)';
    }

    if (preCostVal) {
      if (isMock) {
        preCostVal.textContent = '$0.00 (MOCK)';
      } else {
        const engine = modeToggle.value;
        if (engine.includes('flash')) {
          preCostVal.textContent = fast ? '~$0.0003' : '~$0.002';
        } else if (engine.includes('groq') || engine.includes('ollama')) {
          preCostVal.textContent = '$0.00 (FREE CORE)';
        } else {
          preCostVal.textContent = fast ? '~$0.002' : '~$0.014';
        }
      }
    }

    if (preTimeVal) {
      if (isMock) {
        preTimeVal.textContent = fast ? '~0.8s' : '~2.5s';
      } else {
        const engine = modeToggle.value;
        if (engine.includes('flash') || engine.includes('groq')) {
          preTimeVal.textContent = fast ? '~1-2s' : '~4-6s';
        } else {
          preTimeVal.textContent = fast ? '~2-4s' : '~12-18s';
        }
      }
    }
  }

  // Fast Mode Management
  function updateFastModeUI() {
    const t = typeof I18N !== 'undefined' ? (I18N[currentLang] || I18N.en) : {};
    const fast = state.engine.fastMode;
    const fastModeLabel = document.getElementById('fast-mode-label');
    const fastModeSub = document.getElementById('fast-mode-sub');

    if (fastModeToggleBtn) {
      fastModeToggleBtn.classList.toggle('active', fast);
      if (fastModeLabel && fastModeSub) {
        fastModeLabel.textContent = fast ? (t.fast_mode_fast || 'FAST DELIBERATION') : (t.fast_mode_full || 'FULL DELIBERATION');
        fastModeSub.textContent = fast ? '1 REQ · SYNTHETIC TRIAD' : '7 REQ · CROSS-CRITIQUE';
      } else {
        fastModeToggleBtn.textContent = fast ? 'FAST DELIBERATION (1 REQ)' : 'FULL DELIBERATION (7 REQ)';
      }
    }

    if (toolsFastModeBtn) {
      toolsFastModeBtn.textContent = fast ? 'DELIBERATION: FAST (1 REQ)' : 'DELIBERATION: FULL (7 REQ)';
      toolsFastModeBtn.classList.toggle('active', fast);
    }

    updateOperationalSummary();
  }

  function toggleFastMode() {
    const next = !state.engine.fastMode;
    setFastMode(next);
    isFastMode = next;
    updateFastModeUI();
    playBeep(next ? 640 : 400, 0.05, 'sine');
  }

  fastModeToggleBtn?.addEventListener('click', toggleFastMode);
  toolsFastModeBtn?.addEventListener('click', toggleFastMode);
  setFastMode(isFastMode);
  updateFastModeUI();

  // Mode Toggle Change
  modeToggle.addEventListener('change', () => {
    localStorage.setItem(STORAGE_KEYS.ENGINE_MODE, modeToggle.value);
    setEngineMode(modeToggle.value);
    updateInputModeUI();
    updateOperationalSummary();
    playBeep(520, 0.04, 'sine');
  });

  // Query display sync
  function syncQueryDisplay(q, source = null) {
    const text = q.trim() || 'Awaiting query...';
    if (tacticalQueryDisplay) tacticalQueryDisplay.textContent = text;
    if (animeConsoleInput && source !== 'anime') {
      animeConsoleInput.value = q;
      autoResizeTextarea(animeConsoleInput);
    }
    if (queryInput && source !== 'main') queryInput.value = q;
  }

  queryInput?.addEventListener('input', () => {
    state.query.text = queryInput.value;
    const activePill = document.querySelector('.preset-pill.active');
    if (activePill && activePill.getAttribute('data-query') !== queryInput.value) {
      activePill.classList.remove('active', 'selected');
      state.query.preset = null;
    }
    syncQueryDisplay(queryInput.value, 'main');
    updateOperationalSummary();
  });

  animeConsoleInput?.addEventListener('input', () => {
    autoResizeTextarea(animeConsoleInput);
    syncQueryDisplay(animeConsoleInput.value, 'anime');
  });

  animeConsoleInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (animeQuestionForm.requestSubmit) {
        animeQuestionForm.requestSubmit();
      } else {
        animeQuestionForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    }
  });

  // Preset Pills Listeners & Feedback
  function selectPresetPill(btn) {
    const q = btn.getAttribute('data-query') || '';
    document.querySelectorAll('.preset-pill').forEach(p => p.classList.remove('active', 'selected'));
    btn.classList.add('active', 'selected');

    state.query.text = q;
    state.query.preset = btn.textContent.trim();

    queryInput.value = q;
    syncQueryDisplay(q);

    if (modeToggle.value === 'mock') {
      if (mockQuerySelect) {
        const matchingOption = Array.from(mockQuerySelect.options).find(opt => opt.value === q);
        if (matchingOption) {
          mockQuerySelect.value = matchingOption.value;
          if (animeMockQuerySelect) animeMockQuerySelect.value = matchingOption.value;
        }
      }
    } else {
      queryInput.focus();
    }

    updateOperationalSummary();
    playBeep(440, 0.03, 'sine');
  }

  document.querySelectorAll('.preset-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      selectPresetPill(btn);
    });
  });

  mockQuerySelect?.addEventListener('change', () => {
    const val = mockQuerySelect.value;
    if (animeMockQuerySelect) animeMockQuerySelect.value = val;
    queryInput.value = val;
    syncQueryDisplay(val, 'mock-select');
    playBeep(440, 0.03, 'sine');
  });

  animeMockQuerySelect?.addEventListener('change', () => {
    const val = animeMockQuerySelect.value;
    if (mockQuerySelect) mockQuerySelect.value = val;
    queryInput.value = val;
    syncQueryDisplay(val, 'mock-select');
    playBeep(440, 0.03, 'sine');
  });

  // Fullscreen Management
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
      playBeep(660, 0.05, 'sine');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      playBeep(440, 0.05, 'sine');
    }
  }

  function updateFullscreenUI() {
    const isFs = !!document.fullscreenElement;
    document.body.classList.toggle('is-fullscreen', isFs);
    if (fullscreenBtn) {
      fullscreenBtn.innerHTML = isFs ? 'EXIT FULLSCREEN ✕' : 'FULLSCREEN ⛶';
      fullscreenBtn.classList.toggle('active', isFs);
    }
    if (animeMonitorFsBtn) {
      animeMonitorFsBtn.innerHTML = isFs ? '✕ MINIMIZE' : '⛶ FULLSCREEN';
    }
  }

  fullscreenBtn?.addEventListener('click', toggleFullscreen);
  animeMonitorFsBtn?.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUI);

  // ASCII Copy Button
  copyAsciiBtn?.addEventListener('click', () => {
    const diagram = generateAsciiDiagram(currentResult, queryInput.value.trim());
    navigator.clipboard.writeText(diagram).then(() => {
      copyAsciiBtn.textContent = 'COPIED ASCII!';
      playBeep(880, 0.08, 'triangle');
      setTimeout(() => { copyAsciiBtn.textContent = 'COPY ASCII'; }, 2000);
    });
  });

  // Anime direct submit
  animeQuestionForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const isMock = modeToggle.value === 'mock';
    let q = '';
    if (isMock && animeMockQuerySelect && animeMockQuerySelect.value) {
      q = animeMockQuerySelect.value.trim();
    } else {
      q = (animeConsoleInput?.value || '').trim();
    }
    if (!q) return;
    queryInput.value = q;
    if (form.requestSubmit) {
      form.requestSubmit();
    } else {
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });

  // Deliberation Stream Event Handler
  function handleStreamEvent(eventType, payload) {
    const isFast = state.engine.fastMode;

    switch (eventType) {
      case 'round_start': {
        const { roundNumber, title } = payload;
        clearAllBeacons();
        if (isFast) {
          setTimelineStatus('01/01 · SYNTHETIC TRIAD DELIBERATION');
          setRunStatus('running', 1, 'deliberation');
        } else {
          setTimelineStatus(`0${roundNumber + 1}/07 · ${title.toUpperCase()} COMMENCED`);
          setRunStatus('running', roundNumber + 1, 'round_start');
        }
        updateOperationalSummary();
        if (tacticalFlowStatus) tacticalFlowStatus.textContent = isFast ? 'SYNTHETIC TRIAD' : `ROUND ${roundNumber} DELIBERATION`;
        playBeep(440, 0.05, 'sine');

        if (roundNumber === 0) {
          document.getElementById('step-r0')?.classList.add('active');
        } else if (roundNumber === 1) {
          document.getElementById('step-r0')?.classList.add('passed');
          document.getElementById('step-gate1')?.classList.add('passed');
          document.getElementById('step-r1')?.classList.add('active');
        } else if (roundNumber === 2) {
          document.getElementById('step-r1')?.classList.add('passed');
          document.getElementById('step-gate2')?.classList.add('passed');
          document.getElementById('step-r2')?.classList.add('active');
        }
        break;
      }

      case 'agent_start': {
        const { roundNumber, agentId } = payload;
        setBeacon(agentId, true);
        if (isFast) {
          setTimelineStatus(`01/01 · ${agentId} ANALYZING (SYNTHETIC TRIAD)...`);
        } else {
          let stepPrefix = '01/07';
          if (agentId === 'MELCHIOR') stepPrefix = '01/07';
          else if (agentId === 'BALTHASAR') stepPrefix = '02/07';
          else if (agentId === 'CASPER') stepPrefix = '03/07';
          setTimelineStatus(`${stepPrefix} · ${agentId} INDEPENDENT ANALYSIS`);
        }
        if (tacticalFlowStatus) tacticalFlowStatus.textContent = `${agentId} DELIBERATING...`;
        playBeep(580, 0.03, 'triangle');
        break;
      }

      case 'agent_complete': {
        const { roundNumber, output } = payload;
        setBeacon(output.agentId, false);

        renderLiveAgentOutput(output.agentId, roundNumber, output);
        renderTacticalAgent(output.agentId, output);
        renderAnimeAgent(output.agentId, output);
        addChatAgentMessage(output.agentId, roundNumber, output, I18N[currentLang] || I18N.en);

        if (output.stance === 'APPROVE') {
          playNervTripletBeep('approve');
        } else if (output.stance === 'REJECT') {
          playNervTripletBeep('reject');
        } else {
          playNervTripletBeep('conditional');
        }
        break;
      }

      case 'disagreement': {
        const { roundNumber, report } = payload;
        const rawDelta = report.metrics?.maxConfidenceDelta ?? report.maxConfidenceDelta ?? 0;
        const deltaPct = isNaN(rawDelta) ? 0 : Math.round(rawDelta * 100);
        const t = I18N[currentLang] || I18N.en;
        if (isFast) {
          setTimelineStatus('01/01 · SYNTHETIC DIVERGENCE EVALUATION');
        } else {
          setTimelineStatus(`04/07 · PEER CRITIQUE (STANCE DELTA: ${deltaPct}%)`);
          setRunStatus('running', 4, 'peer-critique');
        }
        updateOperationalSummary();
        if (tacticalFlowStatus) tacticalFlowStatus.textContent = `DIVERGENCE (Δ ${deltaPct}%)`;
        addChatGateNotice('disagreement', t.chat_divergence(deltaPct, roundNumber + 1));
        playBeep(320, 0.08, 'sawtooth');

        if (roundNumber === 0) {
          document.getElementById('step-gate1')?.classList.add('active');
        } else if (roundNumber === 1) {
          document.getElementById('step-gate2')?.classList.add('active');
        }
        break;
      }

      case 'consensus': {
        const { report } = payload;
        const rawDelta = report.metrics?.maxConfidenceDelta ?? report.maxConfidenceDelta ?? 0;
        const deltaPct = isNaN(rawDelta) ? 0 : Math.round(rawDelta * 100);
        const t = I18N[currentLang] || I18N.en;
        if (isFast) {
          setTimelineStatus('01/01 · SYNTHETIC CONSENSUS REACHED');
        } else {
          setTimelineStatus(`06/07 · CONVERGENCE CHECK (STANCE DELTA: ${deltaPct}%)`);
          setRunStatus('running', 6, 'convergence-check');
        }
        updateOperationalSummary();
        if (tacticalFlowStatus) tacticalFlowStatus.textContent = 'CONSENSUS ACHIEVED';
        addChatGateNotice('consensus', t.chat_consensus(deltaPct));
        document.getElementById('step-gate1')?.classList.add('passed');
        break;
      }

      case 'synthesis_start': {
        clearAllBeacons();
        if (isFast) {
          setTimelineStatus('01/01 · SYNTHETIC CORE ARBITRATION...');
          setRunStatus('running', 1, 'synthesis');
        } else {
          setTimelineStatus('07/07 · CORE SYNTHESIS & CONSENSUS ARBITRATION');
          setRunStatus('running', 7, 'synthesis');
        }
        updateOperationalSummary();
        if (tacticalFlowStatus) tacticalFlowStatus.textContent = 'SYNTHESIZING...';
        if (animeResolutionLabel) animeResolutionLabel.textContent = 'SYNTHESIS: ARBITRATING CONSENSUS...';
        if (animeConsensusStamp) {
          animeConsensusStamp.className = 'anime-stamp-box stamp-deliberating';
          if (animeStampText) animeStampText.textContent = '調 停';
        }
        document.getElementById('step-core')?.classList.add('active');
        playBeep(600, 0.06, 'triangle');
        break;
      }

      case 'complete': {
        currentResult = payload.result;
        if (currentResult && !currentResult.source) {
          currentResult.source = state.run.operatorOverride
            ? 'operator-override'
            : (modeToggle.value === 'mock' ? 'mock-demo' : 'live-api');
          currentResult.operatorOverride = !!state.run.operatorOverride;
          currentResult.animationPreset = state.run.animationPreset;
        }
        renderResults(currentResult);
        addChatSynthesisMessage(currentResult, I18N[currentLang] || I18N.en);
        if (currentResult && currentResult.investigation) {
          renderInvestigationBrief(currentResult.investigation);
        }
        loadEpistemicReputation();
        setRunStatus('complete', isFast ? 1 : 7, 'complete');
        setTimelineStatus(isFast ? '01/01 · DELIBERATION COMPLETE' : '07/07 · DELIBERATION COMPLETE');
        updateOperationalSummary();
        state.run.animationPreset = null;
        break;
      }

      case 'error': {
        setRunStatus('error', state.run.currentStep, 'error');
        updateOperationalSummary();
        throw new Error(payload.error || 'Server stream failed');
      }
    }
  }

  function renderResults(result) {
    const totalRounds = result.deliberationRoundsCount || 0;

    document.getElementById('step-r0')?.classList.add('passed');
    document.getElementById('step-gate1')?.classList.add('passed');

    if (totalRounds >= 1) {
      document.getElementById('step-r1')?.classList.add('passed');
      document.getElementById('step-gate2')?.classList.add('passed');
    }
    if (totalRounds >= 2) {
      document.getElementById('step-r2')?.classList.add('passed');
    }
    document.getElementById('step-core')?.classList.add('passed');

    const statusText = totalRounds === 0
      ? 'IMMEDIATE CONSENSUS REACHED IN ROUND 0'
      : `DELIBERATION CONVERGED AFTER ${totalRounds} ROUND${totalRounds > 1 ? 'S' : ''}`;
    setTimelineStatus(statusText);

    ['MELCHIOR', 'BALTHASAR', 'CASPER'].forEach(agentId => {
      setupAgentTabs(agentId, totalRounds, (aid, rnum) => {
        renderAgentRound(result, aid, rnum);
      });
      renderAgentRound(result, agentId, totalRounds);
    });

    renderMagiCore(result);
    if (result && result.investigation) {
      renderInvestigationBrief(result.investigation);
    }

    ['MELCHIOR', 'BALTHASAR', 'CASPER'].forEach(agentId => {
      const output = totalRounds > 0 && result.rounds?.length
        ? result.rounds.find(r => r.roundNumber === totalRounds)?.agentOutputs?.[agentId] || result.initialAnalysis?.[agentId]
        : result.initialAnalysis?.[agentId];
      if (output) renderTacticalAgent(agentId, output);
    });

    renderTacticalCore(result);

    ['MELCHIOR', 'BALTHASAR', 'CASPER'].forEach(agentId => {
      const output = totalRounds > 0 && result.rounds?.length
        ? result.rounds.find(r => r.roundNumber === totalRounds)?.agentOutputs?.[agentId] || result.initialAnalysis?.[agentId]
        : result.initialAnalysis?.[agentId];
      if (output) renderAnimeAgent(agentId, output);
    });

    renderAnimeResolution(result);
  }

  // Sprint 4: On-Demand Demo Deliberation (Zero Token Cost)
  function loadDemoDeliberation() {
    const isPt = (currentLang || 'en').startsWith('pt');
    const lang = isPt ? 'pt' : 'en';
    const demoQuestion = isPt
      ? 'Devemos migrar a infraestrutura do nosso backend de Node.js para Rust?'
      : 'Should we migrate our backend infrastructure from Node.js to Rust?';

    const fixture = getClientMockFixture('rust-migration', lang);
    const r0 = fixture.round0 || fixture.initial;

    const demoResult = {
      question: demoQuestion,
      finalDecision: fixture.synthesis.finalDecision,
      coreVerdict: fixture.synthesis.coreVerdict,
      argumentQualityScore: fixture.synthesis.argumentQualityScore,
      decisiveFactors: fixture.synthesis.decisiveFactors,
      synthesisSummary: fixture.synthesis.synthesisSummary,
      dissentingOpinionsNoted: fixture.synthesis.dissentingOpinionsNoted || [
        isPt
          ? 'Balthasar levantou alarme crítico sobre o custo de oportunidade e estagnação da entrega de produto durante o período de transição.'
          : 'Balthasar flagged critical tail risks regarding second-system delivery stalls and developer attrition during rewrite.'
      ],
      initialAnalysis: r0,
      rounds: [
        {
          roundNumber: 1,
          agentOutputs: isPt ? {
            MELCHIOR: {
              agentId: 'MELCHIOR',
              stance: 'APPROVE',
              confidence: 0.88,
              summary: 'Convergindo com a diretriz do Casper: isolar microsserviços computacionalmente intensivos.',
              keyArguments: ['Elimina latência de Garbage Collection em rotas com throughput superior a 15k req/s.'],
              criticalAssumptions: ['Interfaces FFI e contratos de serialização padronizados.'],
              identifiedRisks: ['Complexidade temporária de tooling duplo.'],
              recommendedAction: 'Iniciar migração piloto no cluster de criptografia e processamento de streams.'
            },
            BALTHASAR: {
              agentId: 'BALTHASAR',
              stance: 'CONDITIONAL',
              confidence: 0.84,
              summary: 'Concessão com salvaguarda estrita: veto a reescrita monolítica; aprovação restrita a módulos desacoplados.',
              keyArguments: ['O restante da equipe mantém o roadmap no Node.js sem interrupções operacionais.'],
              criticalAssumptions: ['Orçamento de erro e SLO rigoroso antes de qualquer promoção a produção.'],
              identifiedRisks: ['Sobrecarga de contexto na manutenção entre duas linguagens.'],
              recommendedAction: 'Estipular cláusula de reversão caso o tempo de compilação degrade a produtividade.'
            },
            CASPER: {
              agentId: 'CASPER',
              stance: 'APPROVE',
              confidence: 0.94,
              summary: 'Consenso consolidado via arquitetura Strangler Fig: máxima densidade computacional com risco zero de entrega.',
              keyArguments: ['Preserva velocidade do produto enquanto extrai ganhos de ordem de magnitude no nó de gargalo.'],
              criticalAssumptions: ['Fronteiras gRPC/HTTP imutáveis entre serviços Node e Rust.'],
              identifiedRisks: ['Necessidade de treinamento específico para sustentação.'],
              recommendedAction: 'Formalizar contrato de transição com gates automatizados de performance.'
            }
          } : {
            MELCHIOR: {
              agentId: 'MELCHIOR',
              stance: 'APPROVE',
              confidence: 0.88,
              summary: 'Concurring with Casper synthesis: target compute-intensive cryptographic and telemetry microservices first.',
              keyArguments: ['Eliminates GC pauses on latency-critical endpoints handling over 15k req/sec.'],
              criticalAssumptions: ['FFI boundaries and serialization schemas are strictly versioned.'],
              identifiedRisks: ['Temporary dual-toolchain cognitive overhead.'],
              recommendedAction: 'Initiate pilot extraction on cryptography and stream telemetry cluster.'
            },
            BALTHASAR: {
              agentId: 'BALTHASAR',
              stance: 'CONDITIONAL',
              confidence: 0.84,
              summary: 'Conditional compromise: veto total monolithic rewrite; sanction isolated microservice migration only.',
              keyArguments: ['Maintains primary product development cadence on Node.js without roadmap paralysis.'],
              criticalAssumptions: ['Strict error budgets and latency SLO gates established prior to production release.'],
              identifiedRisks: ['Cross-language maintenance overhead across operational teams.'],
              recommendedAction: 'Define operational reversal contracts tied to build pipeline velocity.'
            },
            CASPER: {
              agentId: 'CASPER',
              stance: 'APPROVE',
              confidence: 0.94,
              summary: 'Triad convergence reached via Strangler Fig architecture: peak efficiency with zero product delivery freeze.',
              keyArguments: ['Delivers 10x density gains on bottlenecks while protecting core business velocity.'],
              criticalAssumptions: ['Immutable gRPC/HTTP service boundaries between Node and Rust services.'],
              identifiedRisks: ['Requires targeted onboarding for backend engineers.'],
              recommendedAction: 'Ratify transition contract with automated latency regression gates.'
            }
          },
          disagreementReport: {
            hasSignificantDisagreement: false,
            metrics: { maxConfidenceDelta: 0.08 },
            reason: 'Consensus achieved on selective Strangler Fig pattern',
            divergentAgents: []
          }
        }
      ],
      deliberationRoundsCount: 1,
      minorityReport: isPt ? {
        dissentingAgent: 'BALTHASAR',
        minorityConcern: 'Veto irrevogável contra qualquer tentativa de reescrever serviços de domínio e regras de negócio no Node.js.',
        reversalConditions: [
          'Se o tempo de compilação em esteiras CI/CD ultrapassar 12 minutos.',
          'Se o overhead de contexto entre linguagens aumentar a taxa de defeitos em produção.'
        ],
        contracts: [
          {
            metric: 'p99 tail latency',
            threshold: '> 250ms sob carga',
            action: 'Autorizar extração do microsserviço de criptografia para Rust'
          },
          {
            metric: 'Duração do pipeline CI',
            threshold: '> 15 min',
            action: 'Congelar migração adicional e otimizar cache de compilação sccache'
          }
        ]
      } : {
        dissentingAgent: 'BALTHASAR',
        minorityConcern: 'Irrevocable veto against attempting a full rewrite of core business logic or domain services currently running on Node.js.',
        reversalConditions: [
          'If continuous integration pipeline build times exceed 12 minutes sustained.',
          'If dual-stack debugging overhead causes measurable regression in feature turnaround.'
        ],
        contracts: [
          {
            metric: 'p99 tail latency',
            threshold: '> 250ms under peak load',
            action: 'Authorize standalone Rust extraction for telemetry cluster'
          },
          {
            metric: 'CI Pipeline Duration',
            threshold: '> 15 min',
            action: 'Halt further migration and enforce sccache distributed compilation'
          }
        ]
      },
      investigation: isPt ? {
        plan: {
          summary: 'Auditoria empírica de compensações técnicas entre arquitetura Node.js e Rust',
          knowns: [
            'Cluster Node.js satura CPU por serialização JSON e criptografia em picos de tráfego',
            'Time possui 8 desenvolvedores seniores em TypeScript e 2 com proficiência em Rust'
          ],
          unknowns: [
            'Velocidade real de curva de aprendizado para sustentação em produção',
            'Redução volumétrica exata de memória por container sob tráfego real'
          ],
          neededEvidence: [
            'Harness de benchmark comparando Axum e Fastify sob 50.000 requisições simultâneas',
            'Medições de latência de serialização e fronteira gRPC'
          ]
        },
        readinessForDeliberation: 'HIGH',
        durationMs: 420
      } : {
        plan: {
          summary: 'Empirical assessment of computational density vs delivery velocity for Node.js to Rust migration',
          knowns: [
            'Node.js cluster hits CPU exhaustion during JSON parsing and hashing operations at 90k RPM',
            'Engineering squad includes 8 senior engineers fluent in TypeScript and 2 proficient in Rust'
          ],
          unknowns: [
            'Ramp-up velocity and ongoing maintenance overhead across the full team',
            'Actual memory footprint reduction ratio under real-world production workload'
          ],
          neededEvidence: [
            'Comparative benchmark harness between Axum and Fastify under 50,000 req/sec',
            'Serialization latency measurements across inter-service gRPC boundaries'
          ]
        },
        readinessForDeliberation: 'HIGH',
        durationMs: 420
      },
      decisionMetrics: {
        confidenceScore: 89,
        dissentLevel: 16,
        reversibility: 88,
        riskIndex: 24,
        evidenceQuality: 9.1
      },
      metadata: {
        durationMs: 1680,
        rounds: 1,
        model: 'magi-mock-triad',
        provider: 'mock',
        language: lang,
        totalTokens: 2950,
        estimatedCost: '$0.00'
      }
    };

    queryInput.value = demoQuestion;
    if (animeConsoleInput) animeConsoleInput.value = demoQuestion;
    syncQueryDisplay(demoQuestion, 'demo');

    currentResult = demoResult;
    state.engine.source = 'mock-fixtures';
    setRunStatus('complete', 7, 'finished');
    recordExecutionTelemetry('mock-demo', { preset: 'rust-migration' });
    updateOperationalSummary();

    timelineSection?.classList.remove('hidden');
    magiCoreSection?.classList.remove('hidden');

    renderResults(demoResult);
    playNervTripletBeep('consensus');

    if (tacticalFlowStatus) {
      tacticalFlowStatus.textContent = 'CONSENSUS RESOLVED [DEMO]';
      tacticalFlowStatus.classList.remove('deliberating');
    }

    addChatUserQuery(demoQuestion, I18N[lang] || I18N.en);
    if (systemStatusText) {
      systemStatusText.textContent = isPt
        ? 'DELIBERAÇÃO DE DEMONSTRAÇÃO CARREGADA // PRONTO'
        : 'DEMO DELIBERATION LOADED // READY';
    }
  }

  queryDemoBtn?.addEventListener('click', loadDemoDeliberation);
  window.MAGI_LOAD_DEMO = loadDemoDeliberation;

  // Form Submission & Deliberation Stream Execution
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isMock = modeToggle.value === 'mock';
    let question = '';
    if (isMock && mockQuerySelect && mockQuerySelect.value) {
      question = mockQuerySelect.value.trim();
    } else {
      question = queryInput.value.trim();
    }
    if (!question) return;
    queryInput.value = question;

    setQueryCollapsed(true);
    syncQueryDisplay(question);
    addChatUserQuery(question, I18N[currentLang] || I18N.en);
    const language = langSelect.value || undefined;

    if (!state.run.animationPreset) {
      state.run.operatorOverride = false;
    }
    const origin = state.run.operatorOverride ? 'operator-override' : (isMock ? 'mock-demo' : 'live-api');
    recordExecutionTelemetry(origin, { preset: state.run.animationPreset });

    setRunStatus('running', 0, 'initializing');
    updateOperationalSummary();

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-text">DELIBERATING...</span>';
    if (animeConsoleSubmitBtn) {
      animeConsoleSubmitBtn.disabled = true;
      animeConsoleSubmitBtn.textContent = 'BUSY...';
    }
    if (animeConsoleInput) animeConsoleInput.disabled = true;
    timelineSection.classList.remove('hidden');
    magiCoreSection.classList.add('hidden');
    tacticalCoreBox?.classList.remove('resolved');

    if (tacticalFlowStatus) {
      tacticalFlowStatus.textContent = 'DELIBERATING...';
      tacticalFlowStatus.classList.add('deliberating');
    }
    tacticalArrow1?.classList.add('active');
    tacticalArrow2?.classList.add('active');

    startAnimeDeliberation(question);
    clearAllBeacons();
    resetStepper();

    const playbackQueue = [];
    let isPlayingQueue = false;
    let queueDrainResolver = null;

    async function drainPlaybackQueue() {
      if (isPlayingQueue) return;
      isPlayingQueue = true;
      while (playbackQueue.length > 0) {
        const item = playbackQueue.shift();
        handleStreamEvent(item.eventType, item.payload);

        let delayMs = 0;
        if (item.eventType === 'round_start') {
          delayMs = isMock ? 120 : 400;
        } else if (item.eventType === 'agent_start') {
          delayMs = isMock ? 80 : 200;
        } else if (item.eventType === 'agent_complete') {
          delayMs = isMock ? 250 : 750;
        } else if (item.eventType === 'disagreement' || item.eventType === 'consensus') {
          delayMs = isMock ? 150 : 400;
        } else if (item.eventType === 'synthesis_start') {
          delayMs = isMock ? 250 : 800;
        }

        if (delayMs > 0) {
          const speed = state.run.presentationSpeed || 1.0;
          const adjustedDelay = Math.max(10, Math.round(delayMs / speed));
          await new Promise(r => setTimeout(r, adjustedDelay));
        }
      }
      isPlayingQueue = false;
      if (queueDrainResolver) {
        queueDrainResolver();
        queueDrainResolver = null;
      }
    }

    async function simulateClientMockStream(qText, langCode) {
      const store = window.MAGI_MOCK_STORE;
      const fixture = store ? store.getFixture(qText, langCode) : null;
      if (!fixture) {
        throw new Error('Local mock store not available');
      }

      const lang = (langCode || currentLang || 'en').startsWith('pt') ? 'pt' : 'en';
      const r0 = fixture.round0 || fixture.initial;
      const isFast = state.engine.fastMode;

      if (isFast) {
        // Fast Mode: Single synthetic triad deliberation (1 request)
        playbackQueue.push({
          eventType: 'round_start',
          payload: { roundNumber: 0, title: lang === 'pt' ? 'Deliberação Tríade Sintética (Modo Rápido)' : 'Synthetic Triad Deliberation (Fast Mode)' },
        });
        drainPlaybackQueue();
        await new Promise(r => setTimeout(r, 40));

        for (const agentId of ['MELCHIOR', 'BALTHASAR', 'CASPER']) {
          if (!r0[agentId]) continue;
          playbackQueue.push({
            eventType: 'agent_start',
            payload: { roundNumber: 0, agentId },
          });
          playbackQueue.push({
            eventType: 'agent_complete',
            payload: { roundNumber: 0, output: r0[agentId] },
          });
          drainPlaybackQueue();
          await new Promise(r => setTimeout(r, 60));
        }

        playbackQueue.push({
          eventType: 'synthesis_start',
          payload: {},
        });
        drainPlaybackQueue();
        await new Promise(r => setTimeout(r, 80));

        const fastSynthesisResult = {
          question: qText,
          finalDecision: fixture.synthesis.finalDecision,
          coreVerdict: fixture.synthesis.coreVerdict,
          argumentQualityScore: fixture.synthesis.argumentQualityScore,
          decisiveFactors: fixture.synthesis.decisiveFactors,
          synthesisSummary: fixture.synthesis.synthesisSummary,
          dissentingOpinionsNoted: fixture.synthesis.dissentingOpinionsNoted || [],
          initialAnalysis: r0,
          rounds: [],
          deliberationRoundsCount: 0,
          metadata: {
            timestamp: new Date().toISOString(),
            durationMs: 400,
            model: 'magi-mock-fixtures-fast',
            provider: 'mock',
            language: lang,
            fastMode: true,
          },
          source: state.run.operatorOverride ? 'operator-override' : 'mock-demo',
          operatorOverride: !!state.run.operatorOverride,
          animationPreset: state.run.animationPreset,
        };

        playbackQueue.push({
          eventType: 'complete',
          payload: { result: fastSynthesisResult },
        });
        drainPlaybackQueue();
        return;
      }

      playbackQueue.push({
        eventType: 'round_start',
        payload: { roundNumber: 0, title: lang === 'pt' ? 'Análise Independente dos Agentes' : 'Independent Triad Analysis' },
      });
      drainPlaybackQueue();
      await new Promise(r => setTimeout(r, 60));

      for (const agentId of ['MELCHIOR', 'BALTHASAR', 'CASPER']) {
        if (!r0[agentId]) continue;
        playbackQueue.push({
          eventType: 'agent_start',
          payload: { roundNumber: 0, agentId },
        });
        drainPlaybackQueue();
        await new Promise(r => setTimeout(r, 60));

        playbackQueue.push({
          eventType: 'agent_complete',
          payload: { roundNumber: 0, output: r0[agentId] },
        });
        drainPlaybackQueue();
        await new Promise(r => setTimeout(r, 100));
      }

      if (fixture.round1) {
        playbackQueue.push({
          eventType: 'disagreement',
          payload: {
            roundNumber: 0,
            report: {
              metrics: { maxConfidenceDelta: 0.85 },
              divergentAgents: ['MELCHIOR', 'BALTHASAR', 'CASPER'],
            },
          },
        });
        drainPlaybackQueue();
        await new Promise(r => setTimeout(r, 100));

        playbackQueue.push({
          eventType: 'round_start',
          payload: { roundNumber: 1, title: lang === 'pt' ? 'Debate Cruzado e Exame Crítico' : 'Peer Critique & Cross Examination' },
        });
        drainPlaybackQueue();
        await new Promise(r => setTimeout(r, 60));

        const r1 = fixture.round1;
        for (const agentId of ['MELCHIOR', 'BALTHASAR', 'CASPER']) {
          if (!r1[agentId]) continue;
          playbackQueue.push({
            eventType: 'agent_start',
            payload: { roundNumber: 1, agentId },
          });
          drainPlaybackQueue();
          await new Promise(r => setTimeout(r, 60));

          playbackQueue.push({
            eventType: 'agent_complete',
            payload: { roundNumber: 1, output: r1[agentId] },
          });
          drainPlaybackQueue();
          await new Promise(r => setTimeout(r, 100));
        }
      } else {
        playbackQueue.push({
          eventType: 'consensus',
          payload: {
            report: {
              metrics: { maxConfidenceDelta: 0.15 },
            },
          },
        });
        drainPlaybackQueue();
        await new Promise(r => setTimeout(r, 80));
      }

      playbackQueue.push({
        eventType: 'synthesis_start',
        payload: {},
      });
      drainPlaybackQueue();
      await new Promise(r => setTimeout(r, 120));

      const synthesisResult = {
        question: qText,
        finalDecision: fixture.synthesis.finalDecision,
        coreVerdict: fixture.synthesis.coreVerdict,
        argumentQualityScore: fixture.synthesis.argumentQualityScore,
        decisiveFactors: fixture.synthesis.decisiveFactors,
        synthesisSummary: fixture.synthesis.synthesisSummary,
        dissentingOpinionsNoted: fixture.synthesis.dissentingOpinionsNoted || [],
        initialAnalysis: r0,
        rounds: fixture.round1 ? [
          {
            roundNumber: 1,
            agentOutputs: fixture.round1,
            disagreementReport: {
              hasSignificantDisagreement: false,
              metrics: { maxConfidenceDelta: 0.1 },
              reason: 'Consensus reached',
              divergentAgents: [],
            },
          },
        ] : [],
        deliberationRoundsCount: fixture.round1 ? 1 : 0,
        metadata: {
          timestamp: new Date().toISOString(),
          durationMs: 1200,
          model: 'magi-mock-fixtures',
          provider: 'mock',
          language: lang,
        },
        source: state.run.operatorOverride ? 'operator-override' : 'mock-demo',
        operatorOverride: !!state.run.operatorOverride,
        animationPreset: state.run.animationPreset,
      };

      playbackQueue.push({
        eventType: 'complete',
        payload: { result: synthesisResult },
      });
      drainPlaybackQueue();
    }

    try {
      const loc = window.location;
      const isStaticServerWithoutBackend = loc.port && loc.port !== '3000' && !state.api.baseUrl && (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1');

      let runClientFallback = false;

      if (isMock && isStaticServerWithoutBackend) {
        runClientFallback = true;
      } else {
        const engine = modeToggle ? modeToggle.value : (isMock ? 'mock' : 'gemini');
        const timeoutMs = isMock ? 25000 : (engine && engine.startsWith('ollama') ? 360000 : 85000);
        const abortController = new AbortController();
        const timeoutTimer = setTimeout(() => {
          abortController.abort();
        }, timeoutMs);

        let response = null;
        try {
          const adminKey = getAdminKey();
          response = await streamDeliberation({
            question,
            language,
            mock: isMock,
            engine,
            fastMode: isFastMode,
            adminKey: adminKey || undefined,
          }, abortController.signal);
          clearTimeout(timeoutTimer);

          if (!response.ok) {
            if (isMock && (response.status === 404 || response.status === 405)) {
              runClientFallback = true;
            } else {
              const errData = await response.json().catch(() => ({ error: 'Unknown server error' }));
              throw new Error(errData.error || `HTTP error ${response.status}`);
            }
          }
        } catch (fetchErr) {
          clearTimeout(timeoutTimer);
          if (isMock) {
            runClientFallback = true;
          } else {
            throw fetchErr;
          }
        }

        if (!runClientFallback && response) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const events = buffer.split('\n\n');
            buffer = events.pop() || '';

            for (const block of events) {
              if (!block.trim()) continue;
              let eventType = 'message';
              let dataStr = '';

              for (const line of block.split('\n')) {
                if (line.startsWith('event:')) {
                  eventType = line.replace('event:', '').trim();
                } else if (line.startsWith('data:')) {
                  dataStr = line.replace('data:', '').trim();
                }
              }

              if (dataStr) {
                try {
                  const payload = JSON.parse(dataStr);
                  if (eventType === 'error') {
                    throw new Error(payload.error || 'Server deliberation stream failed');
                  }
                  playbackQueue.push({ eventType, payload });
                  drainPlaybackQueue();
                } catch (err) {
                  if (eventType === 'error') throw err;
                  console.warn('SSE JSON parse error:', err);
                }
              }
            }
          }
        }
      }

      if (runClientFallback) {
        await simulateClientMockStream(question, language);
      }

      if (isPlayingQueue || playbackQueue.length > 0) {
        await Promise.race([
          new Promise(r => { queueDrainResolver = r; }),
          new Promise(r => setTimeout(r, 8000)),
        ]);
      }
    } catch (err) {
      playbackQueue.length = 0;
      isPlayingQueue = false;
      const errMsg = err?.message || String(err);
      console.error('[MAGI SYSTEM FAULT]:', err);

      setRunStatus('error', state.run.currentStep, 'error');
      updateOperationalSummary();

      setTimelineStatus(`SYSTEM ERROR: ${errMsg}`);
      if (tacticalFlowStatus) tacticalFlowStatus.textContent = 'SYSTEM FAULT';

      if (animeResolutionLabel) animeResolutionLabel.textContent = `FAULT: ${errMsg.slice(0, 80)}`;
      if (animeConsensusStamp) {
        animeConsensusStamp.className = 'anime-stamp-box stamp-emergency';
        if (animeStampText) animeStampText.textContent = '故 障';
      }
      if (animeCrtMonitor) animeCrtMonitor.classList.add('emergency-alarm');
      if (animeVoteBalthasar) animeVoteBalthasar.textContent = 'FAULT';
      if (animeVoteCasper) animeVoteCasper.textContent = 'FAULT';
      if (animeVoteMelchior) animeVoteMelchior.textContent = 'FAULT';

      playNervTripletBeep('reject');
      addChatGateNotice('error', `SYSTEM FAULT: ${errMsg}`);

      try {
        window.alert(`[MAGI SYSTEM ERROR]:\n\n${errMsg}`);
      } catch (_) {}
    } finally {
      stopTelemetryCycling();
      clearAllBeacons();
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-text">DELIBERATE [STREAM]</span>';
      if (animeConsoleSubmitBtn) {
        animeConsoleSubmitBtn.disabled = false;
        animeConsoleSubmitBtn.textContent = 'EXECUTE [↵]';
      }
      if (animeConsoleInput) animeConsoleInput.disabled = false;
      tacticalArrow1?.classList.remove('active');
      tacticalArrow2?.classList.remove('active');
      tacticalFlowStatus?.classList.remove('deliberating');
    }
  });
});

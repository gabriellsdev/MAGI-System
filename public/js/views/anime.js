// =========================================================================
// MAGI SUPERCOMPUTER // ANIME VIEW MODULE (NERV EVANGELION CRT EMULATION)
// =========================================================================
import { escapeHtml, formatTimeNow } from '../utils/dom.js';
import { playBeep, playNervTripletBeep, playConsensusChime, playImpasseAlarm } from '../features/audio.js';
import { state, getExecutionOrigin } from '../core/state.js';

let telemetryInterval = null;
let calcFlickerInterval = null;
const finishedAnimeAgents = new Set();
let chatMessageCount = 0;

let elements = {};

export function initAnimeView(domElements = {}) {
  elements = {
    animeCrtMonitor: domElements.animeCrtMonitor || document.querySelector('.anime-crt-monitor'),
    animeScreenBalthasar: domElements.animeScreenBalthasar || document.getElementById('anime-screen-balthasar'),
    animeScreenCasper: domElements.animeScreenCasper || document.getElementById('anime-screen-casper'),
    animeScreenMelchior: domElements.animeScreenMelchior || document.getElementById('anime-screen-melchior'),
    animeVoteBalthasar: domElements.animeVoteBalthasar || document.getElementById('anime-vote-balthasar'),
    animeVoteCasper: domElements.animeVoteCasper || document.getElementById('anime-vote-casper'),
    animeVoteMelchior: domElements.animeVoteMelchior || document.getElementById('anime-vote-melchior'),
    animeConfBalthasar: domElements.animeConfBalthasar || document.getElementById('anime-conf-balthasar'),
    animeConfCasper: domElements.animeConfCasper || document.getElementById('anime-conf-casper'),
    animeConfMelchior: domElements.animeConfMelchior || document.getElementById('anime-conf-melchior'),
    animeConsensusStamp: domElements.animeConsensusStamp || document.getElementById('anime-consensus-stamp'),
    animeStampText: domElements.animeStampText || document.getElementById('anime-stamp-text'),
    animeResolutionLabel: domElements.animeResolutionLabel || document.getElementById('anime-resolution-label'),
    animeCodeVal: domElements.animeCodeVal || document.getElementById('anime-code-val'),
    animeExMode: domElements.animeExMode || document.getElementById('anime-ex-mode'),
    animeConsoleInput: domElements.animeConsoleInput || document.getElementById('anime-console-input'),
    animeConsoleSubmitBtn: domElements.animeConsoleSubmitBtn || document.getElementById('anime-console-submit-btn'),
    animeQuestionForm: domElements.animeQuestionForm || document.getElementById('anime-question-form'),
    animeChatWrapper: domElements.animeChatWrapper || document.getElementById('anime-chat-wrapper'),
    animeChatToggleBtn: domElements.animeChatToggleBtn || document.getElementById('anime-chat-toggle-btn'),
    animeChatClearBtn: domElements.animeChatClearBtn || document.getElementById('anime-chat-clear-btn'),
    animeChatMessages: domElements.animeChatMessages || document.getElementById('anime-chat-messages'),
    animeChatCounter: domElements.animeChatCounter || document.getElementById('anime-chat-counter'),
    animeChatLed: domElements.animeChatLed || document.getElementById('anime-chat-led'),
    animeMonitorFsBtn: domElements.animeMonitorFsBtn || document.getElementById('anime-monitor-fullscreen-btn'),
  };

  // Chat toggle handler
  elements.animeChatToggleBtn?.addEventListener('click', () => {
    const isCollapsed = elements.animeChatWrapper?.classList.contains('collapsed');
    setAnimeChatCollapsed(!isCollapsed);
    playBeep(480, 0.03, 'sine');
  });

  // Chat clear handler
  elements.animeChatClearBtn?.addEventListener('click', () => {
    if (!elements.animeChatMessages) return;
    elements.animeChatMessages.innerHTML = `
      <div class="chat-system-entry">
        <span>[SYS] LOG INITIALIZED // AWAITING QUERY INPUT</span>
      </div>
    `;
    chatMessageCount = 0;
    updateChatCounter();
    playBeep(330, 0.05, 'triangle');
  });

  // Restore collapsed chat state (default: expanded)
  if (localStorage.getItem('magi_anime_chat_collapsed') === 'true') {
    setAnimeChatCollapsed(true);
  }
}

export function updateChatCounter() {
  const { animeChatCounter, animeChatLed } = elements;
  if (animeChatCounter) {
    animeChatCounter.textContent = `${chatMessageCount} MSG`;
  }
  if (animeChatLed) {
    animeChatLed.classList.add('active');
    setTimeout(() => {
      animeChatLed?.classList.remove('active');
    }, 400);
  }
}

export function setAnimeChatCollapsed(collapsed) {
  const { animeChatWrapper, animeChatToggleBtn } = elements;
  if (!animeChatWrapper || !animeChatToggleBtn) return;
  if (collapsed) {
    animeChatWrapper.classList.add('collapsed');
    animeChatToggleBtn.textContent = 'MOSTRAR CHAT  ';
    localStorage.setItem('magi_anime_chat_collapsed', 'true');
  } else {
    animeChatWrapper.classList.remove('collapsed');
    animeChatToggleBtn.textContent = 'ESCONDER CHAT  ';
    localStorage.setItem('magi_anime_chat_collapsed', 'false');
  }
}

export function appendChatMessage(html) {
  const { animeChatMessages } = elements;
  if (!animeChatMessages) return;
  const temp = document.createElement('div');
  temp.innerHTML = html.trim();
  const msgEl = temp.firstElementChild;
  if (msgEl) {
    animeChatMessages.appendChild(msgEl);
    chatMessageCount++;
    updateChatCounter();
    animeChatMessages.scrollTop = animeChatMessages.scrollHeight;
  }
}

export function addChatUserQuery(query, t = {}) {
  const time = formatTimeNow();
  const label = t.chat_user_label || 'OPERATOR [HUMAN]';
  appendChatMessage(`
    <div class="chat-entry chat-user">
      <div class="chat-entry-header">
        <div class="chat-sender-info">
          <span>${label}</span>
        </div>
        <span class="chat-time">[${time}]</span>
      </div>
      <div class="chat-user-text">&gt;&gt;&gt; ${escapeHtml(query)}</div>
    </div>
  `);
}

export function addChatAgentMessage(agentId, roundNumber, output, t = {}) {
  const time = formatTimeNow();
  const roleName = t.agent_roles?.[agentId.toUpperCase()] || agentId;
  const agentClass = `chat-${agentId.toLowerCase()}`;
  const stance = output.stance || 'CONDITIONAL';
  const confPct = Math.round((output.confidence || 0.8) * 100);

  let critiquesHtml = '';
  if (Array.isArray(output.critiquesOfPeers) && output.critiquesOfPeers.length > 0) {
    const items = output.critiquesOfPeers.map(c => `
      <div class="chat-critique-item">
        ↳ <span class="chat-critique-target">vs ${escapeHtml(c.targetAgent || 'PEER')}:</span> ${escapeHtml(c.rebuttal || (Array.isArray(c.pointsOfDisagreement) && c.pointsOfDisagreement.length ? c.pointsOfDisagreement.join('; ') : '') || c.critique || '')}
      </div>
    `).join('');
    critiquesHtml = `
      <div class="chat-critiques-box">
        <div class="chat-critiques-title">${t.chat_critiques_title || 'CRITIQUES & DIVERGENCE ANALYSIS'}</div>
        ${items}
      </div>
    `;
  }

  appendChatMessage(`
    <div class="chat-entry chat-agent ${agentClass}">
      <div class="chat-entry-header">
        <div class="chat-sender-info">
          <span>${roleName}</span>
          <span class="chat-stance-pill ${stance}">${stance} [${confPct}%]</span>
        </div>
        <span class="chat-time">${t.chat_round_prefix || 'ROUND'} ${roundNumber} • [${time}]</span>
      </div>
      <div class="chat-agent-summary">${escapeHtml(output.summary || '')}</div>
      ${critiquesHtml}
    </div>
  `);
}

export function addChatGateNotice(type, text) {
  const time = formatTimeNow();
  const isError = type === 'error';
  const isDivergence = type === 'disagreement';
  const gateClass = isError ? 'chat-gate-error' : (isDivergence ? 'chat-disagreement' : 'chat-consensus');
  const label = isError ? 'FAULT' : (isDivergence ? 'DIVERGENCE' : 'CONSENSUS');
  appendChatMessage(`
    <div class="chat-entry chat-gate ${gateClass}" style="${isError ? 'border-color: #ff3333; color: #ff5555; background: rgba(255, 0, 0, 0.1);' : ''}">
      <span>[${label}] [${time}] ${escapeHtml(text)}</span>
    </div>
  `);
}

export function addChatSynthesisMessage(result, t = {}) {
  const time = formatTimeNow();
  const decision = result.finalDecision || 'CONSENSUS_REACHED';
  const title = t.chat_synthesis_title || 'MAGI CENTRAL ARBITRATION // CONSENSUS SYNTHESIS';

  appendChatMessage(`
    <div class="chat-entry chat-synthesis">
      <div class="chat-entry-header">
        <div class="chat-sender-info">
          <span>${title}</span>
          <span class="chat-stance-pill APPROVE">${escapeHtml(decision)}</span>
        </div>
        <span class="chat-time">[${time}]</span>
      </div>
      <div class="chat-verdict-text">${escapeHtml(result.coreVerdict || '')}</div>
    </div>
  `);
}

export function startTelemetryCycling() {
  stopTelemetryCycling();
  const codes = [473, 582, 601, 804, 912, 108, 305, 731, 246, 690, 815, 937];
  let teleTick = 0;
  telemetryInterval = setInterval(() => {
    if (elements.animeCodeVal) {
      const nextCode = codes[Math.floor(Math.random() * codes.length)];
      elements.animeCodeVal.textContent = nextCode;
    }
    if (++teleTick % 6 === 0) {
      playNervTripletBeep('processing');
    }
  }, 85);

  calcFlickerInterval = setInterval(() => {
    if (!finishedAnimeAgents.has('BALTHASAR') && elements.animeConfBalthasar) {
      elements.animeConfBalthasar.textContent = `${Math.floor(40 + Math.random() * 55)}%`;
    }
    if (!finishedAnimeAgents.has('CASPER') && elements.animeConfCasper) {
      elements.animeConfCasper.textContent = `${Math.floor(40 + Math.random() * 55)}%`;
    }
    if (!finishedAnimeAgents.has('MELCHIOR') && elements.animeConfMelchior) {
      elements.animeConfMelchior.textContent = `${Math.floor(40 + Math.random() * 55)}%`;
    }
  }, 120);
}

export function stopTelemetryCycling(finalCode = 473) {
  if (telemetryInterval) {
    clearInterval(telemetryInterval);
    telemetryInterval = null;
  }
  if (calcFlickerInterval) {
    clearInterval(calcFlickerInterval);
    calcFlickerInterval = null;
  }
  if (elements.animeCodeVal) {
    elements.animeCodeVal.textContent = finalCode;
  }
}

export function resetAnimeStandby() {
  stopTelemetryCycling();
  finishedAnimeAgents.clear();
  const {
    animeCrtMonitor,
    animeScreenBalthasar,
    animeScreenCasper,
    animeScreenMelchior,
    animeVoteBalthasar,
    animeVoteCasper,
    animeVoteMelchior,
    animeConfBalthasar,
    animeConfCasper,
    animeConfMelchior,
    animeConsensusStamp,
    animeStampText,
    animeResolutionLabel,
    animeExMode,
  } = elements;

  if (animeCrtMonitor) animeCrtMonitor.classList.remove('emergency-alarm');

  const screens = [animeScreenBalthasar, animeScreenCasper, animeScreenMelchior];
  screens.forEach(s => {
    if (!s) return;
    s.className = s.className.replace(/state-\w+/g, '').trim();
    s.classList.add('state-standby');
  });

  if (animeVoteBalthasar) animeVoteBalthasar.textContent = 'STANDBY';
  if (animeVoteCasper) animeVoteCasper.textContent = 'STANDBY';
  if (animeVoteMelchior) animeVoteMelchior.textContent = 'STANDBY';

  if (animeConfBalthasar) animeConfBalthasar.textContent = '';
  if (animeConfCasper) animeConfCasper.textContent = '';
  if (animeConfMelchior) animeConfMelchior.textContent = '';

  if (animeConsensusStamp) {
    animeConsensusStamp.className = 'anime-stamp-box stamp-standby';
    if (animeStampText) animeStampText.textContent = '待 機';
  }
  if (animeResolutionLabel) animeResolutionLabel.textContent = 'RESOLUTION: STANDBY';
  if (animeExMode) animeExMode.textContent = 'OFF';
}

export function startAnimeDeliberation(question) {
  finishedAnimeAgents.clear();
  startTelemetryCycling();
  const {
    animeCrtMonitor,
    animeScreenBalthasar,
    animeScreenCasper,
    animeScreenMelchior,
    animeVoteBalthasar,
    animeVoteCasper,
    animeVoteMelchior,
    animeConsensusStamp,
    animeStampText,
    animeResolutionLabel,
    animeExMode,
    animeConsoleInput,
  } = elements;

  if (animeCrtMonitor) animeCrtMonitor.classList.remove('emergency-alarm');

  const screens = [animeScreenBalthasar, animeScreenCasper, animeScreenMelchior];
  screens.forEach(s => {
    if (!s) return;
    s.className = s.className.replace(/state-\w+/g, '').trim();
    s.classList.add('state-deliberating');
  });

  if (animeVoteBalthasar) animeVoteBalthasar.textContent = 'PROCESSING';
  if (animeVoteCasper) animeVoteCasper.textContent = 'PROCESSING';
  if (animeVoteMelchior) animeVoteMelchior.textContent = 'PROCESSING';

  if (animeConsensusStamp) {
    animeConsensusStamp.className = 'anime-stamp-box stamp-deliberating';
    if (animeStampText) animeStampText.textContent = '審 議';
  }
  if (animeResolutionLabel) animeResolutionLabel.textContent = 'DELIBERATING...';

  if (animeExMode) animeExMode.textContent = 'ACTIVE';
  if (animeConsoleInput) animeConsoleInput.value = question;
}

export function renderAnimeAgent(agentId, output) {
  finishedAnimeAgents.add(agentId.toUpperCase());
  const {
    animeScreenBalthasar,
    animeScreenCasper,
    animeScreenMelchior,
    animeVoteBalthasar,
    animeVoteCasper,
    animeVoteMelchior,
    animeConfBalthasar,
    animeConfCasper,
    animeConfMelchior,
  } = elements;

  let screenEl = null;
  let voteEl = null;
  let confEl = null;

  if (agentId === 'BALTHASAR') {
    screenEl = animeScreenBalthasar;
    voteEl = animeVoteBalthasar;
    confEl = animeConfBalthasar;
  } else if (agentId === 'CASPER') {
    screenEl = animeScreenCasper;
    voteEl = animeVoteCasper;
    confEl = animeConfCasper;
  } else if (agentId === 'MELCHIOR') {
    screenEl = animeScreenMelchior;
    voteEl = animeVoteMelchior;
    confEl = animeConfMelchior;
  }

  if (!screenEl) return;

  screenEl.className = screenEl.className.replace(/state-\w+/g, '').trim();

  const stance = output.stance;
  const confPct = Math.round(output.confidence * 100);

  if (stance === 'APPROVE') {
    screenEl.classList.add('state-approved');
    if (voteEl) voteEl.textContent = 'APPROVED';
  } else if (stance === 'REJECT') {
    screenEl.classList.add('state-rejected');
    if (voteEl) voteEl.textContent = 'REJECTED';
  } else {
    screenEl.classList.add('state-conditional');
    if (voteEl) voteEl.textContent = stance;
  }

  if (confEl) confEl.textContent = `${confPct}%`;
}

export function renderAnimeResolution(result) {
  stopTelemetryCycling(473);
  const {
    animeExMode,
    animeCrtMonitor,
    animeConsensusStamp,
    animeStampText,
    animeResolutionLabel,
  } = elements;

  if (animeExMode) animeExMode.textContent = 'NOMINAL';

  const animeOriginTag = document.getElementById('anime-origin-tag');
  if (animeOriginTag) {
    const origin = result.source || (state.run?.operatorOverride ? 'operator-override' : getExecutionOrigin());
    if (origin === 'operator-override' || state.run?.operatorOverride) {
      animeOriginTag.textContent = 'OPERATOR OVERRIDE';
      animeOriginTag.className = 'anime-origin-tag override';
    } else if (origin === 'mock-demo' || state.engine?.source === 'mock-fixtures' || result.metadata?.provider === 'mock') {
      animeOriginTag.textContent = 'MOCK DEMO';
      animeOriginTag.className = 'anime-origin-tag mock';
    } else {
      animeOriginTag.textContent = 'LIVE API';
      animeOriginTag.className = 'anime-origin-tag live';
    }
  }

  const analysis = result.initialAnalysis || {};
  const votes = [analysis.MELCHIOR?.stance, analysis.BALTHASAR?.stance, analysis.CASPER?.stance];
  const approveCount = votes.filter(v => v === 'APPROVE').length;
  const rejectCount = votes.filter(v => v === 'REJECT').length;

  const isRejected = (result.finalDecision || '').includes('REJECT') || rejectCount >= 2;

  if (isRejected) {
    if (animeCrtMonitor) animeCrtMonitor.classList.add('emergency-alarm');
    if (animeConsensusStamp) {
      animeConsensusStamp.className = 'anime-stamp-box stamp-rejected';
      if (animeStampText) animeStampText.textContent = '否 決';
    }
    if (animeResolutionLabel) animeResolutionLabel.textContent = 'SECURITY LOCK: IMPASSE / REJECTED';
    playImpasseAlarm();
  } else {
    if (animeCrtMonitor) animeCrtMonitor.classList.remove('emergency-alarm');
    if (approveCount === 3) {
      if (animeConsensusStamp) {
        animeConsensusStamp.className = 'anime-stamp-box stamp-consensus';
        if (animeStampText) animeStampText.textContent = '合 意';
      }
      if (animeResolutionLabel) animeResolutionLabel.textContent = 'RESOLUTION: PASSED (3-0 UNANIMOUS)';
      playConsensusChime();
    } else {
      if (animeConsensusStamp) {
        animeConsensusStamp.className = 'anime-stamp-box stamp-passed';
        if (animeStampText) animeStampText.textContent = '可 決';
      }
      if (animeResolutionLabel) animeResolutionLabel.textContent = `RESOLUTION: PASSED (${result.finalDecision.replace('_', ' ')})`;
      playConsensusChime();
    }
  }

  const tokensVal = document.getElementById('anime-telemetry-tokens');
  if (tokensVal) {
    if (result.metadata?.totalTokensUsed) {
      const tokens = result.metadata.totalTokensUsed.toLocaleString();
      const cost = result.metadata.estimatedCostUsd ? `$${result.metadata.estimatedCostUsd.toFixed(5)}` : '$0.00';
      tokensVal.textContent = `TOKENS: ${tokens} | EST. COST: ${cost} USD`;
    } else {
      tokensVal.textContent = 'TOKENS: MOCK (0) | EST. COST: $0.00 USD';
    }
  }
}

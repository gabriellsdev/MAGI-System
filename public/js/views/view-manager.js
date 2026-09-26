// =========================================================================
// MAGI SUPERCOMPUTER // VIEW MANAGER
// Multi-Display Controller (Command Center, Anime Legacy CRT, Tactical Flow)
// =========================================================================
import { STORAGE_KEYS } from '../core/constants.js';
import { state } from '../core/state.js';

let elements = {};

export function getViewMode() {
  return (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.VIEW_MODE) : null) || 'command';
}

export function setViewMode(mode) {
  const {
    btnModeCommand,
    btnModeLegacy,
    btnViewTactical,
    btnViewDiagnostic,
    animeView,
    tacticalView,
    diagnosticView,
  } = elements;

  [btnModeCommand, btnModeLegacy, btnViewTactical, btnViewDiagnostic].forEach(b => b?.classList.remove('active'));
  [animeView, tacticalView, diagnosticView].forEach(v => v?.classList.add('hidden'));

  let normalizedMode = mode;

  if (mode === 'anime' || mode === 'legacy') {
    btnModeLegacy?.classList.add('active');
    animeView?.classList.remove('hidden');
    normalizedMode = 'anime';
    state.ui.mode = 'legacy';
    state.ui.view = 'anime';
  } else if (mode === 'tactical') {
    btnViewTactical?.classList.add('active');
    btnModeCommand?.classList.add('active');
    tacticalView?.classList.remove('hidden');
    normalizedMode = 'tactical';
    state.ui.mode = 'command';
    state.ui.view = 'tactical';
  } else {
    // Default: Command Center (Cyber-Deck View)
    btnModeCommand?.classList.add('active');
    btnViewDiagnostic?.classList.add('active');
    diagnosticView?.classList.remove('hidden');
    normalizedMode = 'command';
    state.ui.mode = 'command';
    state.ui.view = 'diagnostic';
  }

  document.body.classList.toggle('anime-mode', normalizedMode === 'anime');
  localStorage.setItem(STORAGE_KEYS.VIEW_MODE, normalizedMode);
}

export function initViewManager(domElements = {}) {
  elements = {
    btnModeCommand: domElements.btnModeCommand || document.getElementById('btn-mode-command'),
    btnModeLegacy: domElements.btnModeLegacy || document.getElementById('btn-mode-legacy'),
    btnViewAnime: domElements.btnViewAnime || document.getElementById('btn-view-anime'),
    btnViewTactical: domElements.btnViewTactical || document.getElementById('btn-view-tactical'),
    btnViewDiagnostic: domElements.btnViewDiagnostic || document.getElementById('btn-view-diagnostic'),
    animeView: domElements.animeView || document.getElementById('anime-view'),
    tacticalView: domElements.tacticalView || document.getElementById('tactical-view'),
    diagnosticView: domElements.diagnosticView || document.getElementById('diagnostic-view'),
    toolsMenuBtn: domElements.toolsMenuBtn || document.getElementById('tools-menu-btn'),
    toolsDropdownMenu: domElements.toolsDropdownMenu || document.getElementById('tools-dropdown-menu'),
  };

  const closeToolsMenu = () => {
    elements.toolsDropdownMenu?.classList.add('hidden');
    elements.toolsMenuBtn?.classList.remove('active');
  };

  elements.btnModeCommand?.addEventListener('click', () => setViewMode('command'));
  elements.btnModeLegacy?.addEventListener('click', () => setViewMode('anime'));

  elements.btnViewAnime?.addEventListener('click', () => {
    setViewMode('anime');
    closeToolsMenu();
  });

  elements.btnViewTactical?.addEventListener('click', () => {
    setViewMode('tactical');
    closeToolsMenu();
  });

  elements.btnViewDiagnostic?.addEventListener('click', () => {
    setViewMode('command');
    closeToolsMenu();
  });

  // Tools Dropdown Menu Logic
  if (elements.toolsMenuBtn && elements.toolsDropdownMenu) {
    elements.toolsMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = elements.toolsDropdownMenu.classList.toggle('hidden');
      if (!isHidden) {
        elements.toolsMenuBtn.classList.add('active');
      } else {
        elements.toolsMenuBtn.classList.remove('active');
      }
    });

    document.addEventListener('click', (e) => {
      if (!elements.toolsDropdownMenu.contains(e.target) && e.target !== elements.toolsMenuBtn) {
        closeToolsMenu();
      }
    });
  }

  // Restore preferred view mode
  const savedView = getViewMode();
  setViewMode(savedView);
}

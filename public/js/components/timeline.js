// =========================================================================
// MAGI SUPERCOMPUTER // TIMELINE STEPPER & TELEMETRY BEACONS
// =========================================================================

let timelineStatusMsgEl = null;
let beacons = {
  MELCHIOR: null,
  BALTHASAR: null,
  CASPER: null,
};

export function initTimeline(options = {}) {
  timelineStatusMsgEl = options.timelineStatusMsg || document.getElementById('timeline-status-msg');
  beacons = {
    MELCHIOR: options.beaconMelchior || document.getElementById('beacon-melchior'),
    BALTHASAR: options.beaconBalthasar || document.getElementById('beacon-balthasar'),
    CASPER: options.beaconCasper || document.getElementById('beacon-casper'),
  };
}

export function setBeacon(agentId, active) {
  const beacon = beacons[agentId?.toUpperCase()];
  if (beacon) {
    if (active) beacon.classList.add('active');
    else beacon.classList.remove('active');
  }
}

export function clearAllBeacons() {
  Object.values(beacons).forEach(b => b?.classList.remove('active'));
}

export function resetStepper(statusText = 'SYNCHRONIZING INDEPENDENT SUPERCOMPUTERS...') {
  ['step-r0', 'step-gate1', 'step-r1', 'step-gate2', 'step-r2', 'step-core'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active', 'passed');
  });
  if (timelineStatusMsgEl) {
    timelineStatusMsgEl.textContent = statusText;
  }
}

export function setTimelineStatus(msg) {
  if (timelineStatusMsgEl) {
    timelineStatusMsgEl.textContent = msg;
  }
}

export function advanceStep(stepId, state = 'active') {
  const el = document.getElementById(stepId);
  if (!el) return;
  if (state === 'active') {
    el.classList.add('active');
    el.classList.remove('passed');
  } else if (state === 'passed') {
    el.classList.remove('active');
    el.classList.add('passed');
  } else {
    el.classList.remove('active', 'passed');
  }
}

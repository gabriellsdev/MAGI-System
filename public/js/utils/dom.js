// =========================================================================
// MAGI SUPERCOMPUTER // DOM & FORMATTING UTILITIES
// =========================================================================

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatTimeNow() {
  const d = new Date();
  return d.toTimeString().split(' ')[0];
}

export function padRight(str, len) {
  return String(str).padEnd(len, ' ');
}

export function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

export function animateNumber(element, targetNum, suffix = '') {
  if (!element) return;
  const start = 0;
  const duration = 500;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const current = Math.round(start + (targetNum - start) * progress);
    element.textContent = `${current}${suffix}`;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function autoResizeTextarea(textarea, maxHeight = 180) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
}

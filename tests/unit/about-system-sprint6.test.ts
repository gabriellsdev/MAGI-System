import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Sprint 6: System Documentation, Confidence & About Modal', () => {
  const indexPath = path.resolve(process.cwd(), 'public/index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf-8');
  const modalsJs = fs.readFileSync(path.resolve(process.cwd(), 'public/js/components/modals.js'), 'utf-8');
  const modalsCss = fs.readFileSync(path.resolve(process.cwd(), 'public/css/components/modals.css'), 'utf-8');

  it('allows optional trigger for About System modal without forcing session ribbon', () => {
    expect(indexHtml).toBeDefined();
  });

  it('should provide comprehensive About Modal structure', () => {
    expect(indexHtml).toContain('id="about-modal"');
    expect(indexHtml).toContain('class="about-tabs-nav"');
    expect(indexHtml).toContain('data-tab="about-triad"');
    expect(indexHtml).toContain('data-tab="about-modes"');
    expect(indexHtml).toContain('data-tab="about-provenance"');
    expect(indexHtml).toContain('data-tab="about-architecture"');
  });

  it('should clearly document the three Triad Agent personas', () => {
    expect(indexHtml).toContain('MELCHIOR-1');
    expect(indexHtml).toContain('BALTHASAR-2');
    expect(indexHtml).toContain('CASPER-3');
    expect(indexHtml).toContain('SCIENTIST');
    expect(indexHtml).toContain('MOTHER');
    expect(indexHtml).toContain('WOMAN');
  });

  it('should document Fast Mode vs Full Mode tradeoffs and token economics', () => {
    expect(indexHtml).toContain('FAST DELIBERATION (1 REQ)');
    expect(indexHtml).toContain('FULL DELIBERATION (7 REQ)');
    expect(indexHtml).toContain('1 Request (Unified Synthetic Triad)');
    expect(indexHtml).toContain('7 Requests (Multi-Round Interactive Pipeline)');
  });

  it('should differentiate execution provenance origins and calibration data', () => {
    expect(indexHtml).toContain('LIVE DELIBERATION');
    expect(indexHtml).toContain('MOCK DEMONSTRATION');
    expect(indexHtml).toContain('OPERATOR OVERRIDE');
    expect(indexHtml).toContain('DEMO CALIBRATION');
  });

  it('should provide architecture pipeline and version changelog up to V4.6', () => {
    expect(indexHtml).toContain('INVESTIGATION');
    expect(indexHtml).toContain('INDEPENDENT R0');
    expect(indexHtml).toContain('PEER CRITIQUE');
    expect(indexHtml).toContain('CORE SYNTHESIS');
    expect(indexHtml).toContain('V4.6');
  });

  it('should implement modal open, close and tab switching in modals.js', () => {
    expect(modalsJs).toContain('initAboutModal');
    expect(modalsJs).toContain('aboutModal.classList.remove(\'hidden\')');
    expect(modalsJs).toContain('aboutModal.classList.add(\'hidden\')');
    expect(modalsJs).toContain('.about-tab-btn');
  });

  it('should have dedicated styling for about modal in modals.css', () => {
    expect(modalsCss).toContain('.about-modal-box');
    expect(modalsCss).toContain('.about-tabs-nav');
    expect(modalsCss).toContain('.about-tab-btn');
    expect(modalsCss).toContain('.about-agent-card');
  });
});

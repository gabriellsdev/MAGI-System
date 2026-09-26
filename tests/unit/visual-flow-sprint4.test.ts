import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Sprint 4: Visual Flow, Prominent Synthesis, and Demo Deliberation', () => {
  const indexPath = path.resolve(process.cwd(), 'public/index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf-8');

  it('should maintain correct reading order in diagnostic view (Timeline -> Core Synthesis -> Agents -> Investigation -> Reputation)', () => {
    const timelinePos = indexHtml.indexOf('id="deliberation-timeline"');
    const corePos = indexHtml.indexOf('id="magi-core-section"');
    const agentsPos = indexHtml.indexOf('class="agents-grid"');
    const investigationPos = indexHtml.indexOf('id="investigation-section"');
    const reputationPos = indexHtml.indexOf('id="reputation-dock"');

    expect(timelinePos).toBeGreaterThan(-1);
    expect(corePos).toBeGreaterThan(timelinePos);
    expect(agentsPos).toBeGreaterThan(corePos);
    expect(investigationPos).toBeGreaterThan(agentsPos);
    expect(reputationPos).toBeGreaterThan(investigationPos);
  });

  it('should organize Tools dropdown with functional sections', () => {
    expect(indexHtml).toContain('ADVANCED ANALYSIS');
    expect(indexHtml).toContain('PERSISTENCE &amp; STORAGE');
    expect(indexHtml).toContain('OPERATING VIEWS');
    expect(indexHtml).toContain('UTILITIES &amp; DISPLAY');
    expect(indexHtml).toContain('CLEARANCE &amp; CONTROL');
  });

  it('should include on-demand demo deliberation button', () => {
    expect(indexHtml).toContain('id="query-demo-btn"');
    expect(indexHtml).toContain('LOAD DEMO DELIBERATION');
  });

  it('should prevent duplicate element IDs between tools menu and core verdict', () => {
    const matchesJsonModal = indexHtml.match(/id="json-modal-btn"/g);
    expect(matchesJsonModal?.length).toBe(1);
    expect(indexHtml).toContain('id="tools-json-modal-btn"');
  });

  it('should flag simulated epistemic reputation data explicitly', () => {
    expect(indexHtml).toContain('DEMO CALIBRATION');
  });
});

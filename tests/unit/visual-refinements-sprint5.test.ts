import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Sprint 5: Visual Refinements & Token Standardization', () => {
  const variablesCss = fs.readFileSync(path.resolve(process.cwd(), 'public/css/base/variables.css'), 'utf-8');
  const resetCss = fs.readFileSync(path.resolve(process.cwd(), 'public/css/base/reset.css'), 'utf-8');
  const panelsCss = fs.readFileSync(path.resolve(process.cwd(), 'public/css/components/panels.css'), 'utf-8');
  const statusCss = fs.readFileSync(path.resolve(process.cwd(), 'public/css/components/status.css'), 'utf-8');
  const responsiveCss = fs.readFileSync(path.resolve(process.cwd(), 'public/css/responsive.css'), 'utf-8');
  const viewManagerJs = fs.readFileSync(path.resolve(process.cwd(), 'public/js/views/view-manager.js'), 'utf-8');

  it('should define standardized semantic colors and tokens in variables.css', () => {
    expect(variablesCss).toContain('--color-sys');
    expect(variablesCss).toContain('--color-action');
    expect(variablesCss).toContain('--color-danger');
    expect(variablesCss).toContain('--color-success');
    expect(variablesCss).toContain('--border-default');
    expect(variablesCss).toContain('--glow-core');
    expect(variablesCss).toContain('--radius-sm');
  });

  it('should provide keyboard navigation and reduced motion accessibility in reset.css', () => {
    expect(resetCss).toContain(':focus-visible');
    expect(resetCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(resetCss).toContain('body.anime-mode .scanlines');
  });

  it('should standardize borders and glows across panels.css', () => {
    expect(panelsCss).toContain('border-radius: var(--radius-sm)');
    expect(panelsCss).toContain('box-shadow: var(--glow-core)');
    expect(panelsCss).toContain('box-shadow: var(--glow-melchior)');
    expect(panelsCss).toContain('box-shadow: var(--glow-balthasar)');
    expect(panelsCss).toContain('box-shadow: var(--glow-casper)');
  });

  it('should differentiate execution states (ready, running, complete, error, standby) in status.css', () => {
    expect(statusCss).toContain('.session-beacon-dot.ready');
    expect(statusCss).toContain('.session-beacon-dot.running');
    expect(statusCss).toContain('.session-beacon-dot.complete');
    expect(statusCss).toContain('.session-beacon-dot.error');
    expect(statusCss).toContain('.session-beacon-dot.standby');
    expect(statusCss).toContain('.metric-val.status-standby');
  });

  it('should adapt demo button and layout across responsive breakpoints', () => {
    expect(responsiveCss).toContain('.hud-btn-demo');
    expect(responsiveCss).toContain('@media (max-width: 768px)');
    expect(responsiveCss).toContain('@media (max-width: 480px)');
  });

  it('should separate Command Center and Anime Legacy mode cleanly in view-manager', () => {
    expect(viewManagerJs).toContain("document.body.classList.toggle('anime-mode', normalizedMode === 'anime')");
  });
});

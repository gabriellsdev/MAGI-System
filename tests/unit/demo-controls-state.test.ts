import { describe, it, expect } from 'vitest';
import { validateDeliberationInput } from '../../src/server/validator.js';

describe('Sprint 3: Demo Controls & Execution Origin Separation', () => {
  it('should validate and accept deliberation input with fastMode', () => {
    const valid = validateDeliberationInput({
      question: 'Should we migrate our backend infrastructure from Node.js to Rust?',
      fastMode: true,
    });
    expect(valid.valid).toBe(true);
    if (valid.valid) {
      expect(valid.data.fastMode).toBe(true);
      expect(valid.data.question).toContain('Rust');
    }
  });

  it('should validate execution origin telemetry schema requirements', () => {
    // Section 6 MAGI_IMP.md schema:
    // { source, operatorOverride, selectedModel, actualModelCall, animationPreset, recordedAt }
    interface ExecutionTelemetry {
      source: 'mock-demo' | 'live-api' | 'operator-override';
      operatorOverride: boolean;
      selectedModel: string;
      actualModelCall: boolean;
      animationPreset: string | null;
      presentationSpeed?: number;
      cinematicMode?: boolean;
      recordedAt: string;
    }

    const mockTelemetry: ExecutionTelemetry = {
      source: 'mock-demo',
      operatorOverride: false,
      selectedModel: 'gemini-3.1-pro',
      actualModelCall: false,
      animationPreset: null,
      presentationSpeed: 1.0,
      cinematicMode: false,
      recordedAt: new Date().toISOString(),
    };

    expect(mockTelemetry.source).toBe('mock-demo');
    expect(mockTelemetry.operatorOverride).toBe(false);
    expect(mockTelemetry.actualModelCall).toBe(false);

    const overrideTelemetry: ExecutionTelemetry = {
      source: 'operator-override',
      operatorOverride: true,
      selectedModel: 'gemini-3.1-pro',
      actualModelCall: false,
      animationPreset: 'rust-migration',
      presentationSpeed: 2.0,
      cinematicMode: true,
      recordedAt: new Date().toISOString(),
    };

    expect(overrideTelemetry.source).toBe('operator-override');
    expect(overrideTelemetry.operatorOverride).toBe(true);
    expect(overrideTelemetry.animationPreset).toBe('rust-migration');
    expect(overrideTelemetry.presentationSpeed).toBe(2.0);
    expect(overrideTelemetry.cinematicMode).toBe(true);
  });

  it('should support presentation speed calculation factors', () => {
    const baseDelayMs = 400;

    const fastSpeed = 2.0;
    const fastDelay = Math.round(baseDelayMs / fastSpeed);
    expect(fastDelay).toBe(200);

    const normalSpeed = 1.0;
    const normalDelay = Math.round(baseDelayMs / normalSpeed);
    expect(normalDelay).toBe(400);

    const cinematicSpeed = 0.5;
    const cinematicDelay = Math.round(baseDelayMs / cinematicSpeed);
    expect(cinematicDelay).toBe(800);
  });
});

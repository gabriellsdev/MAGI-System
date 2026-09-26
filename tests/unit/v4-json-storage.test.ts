import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  JsonFileStore,
  MagiStorageManager,
  atomicWriteJsonSync,
  readJsonSync,
} from '../../src/storage/json-storage.js';
import { DecisionMemoryStore } from '../../src/memory/decision-memory.js';
import { AgentReputationRegistry } from '../../src/memory/agent-reputation-registry.js';
import { OperationalReversalMonitor } from '../../src/monitoring/reversal-monitor.js';

describe('V4.6 JSON File Persistence Layer', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'magi-storage-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  it('performs atomic writes and reads correctly', () => {
    const testFile = path.join(tempDir, 'sample.json');
    const testData = { name: 'MAGI', version: '4.6.0', active: true };

    atomicWriteJsonSync(testFile, testData);
    expect(fs.existsSync(testFile)).toBe(true);

    const loaded = readJsonSync(testFile, {});
    expect(loaded).toEqual(testData);

    const missing = readJsonSync(path.join(tempDir, 'missing.json'), { fallback: true });
    expect(missing).toEqual({ fallback: true });
  });

  it('JsonFileStore loads, updates, and persists state to file', () => {
    const store = new JsonFileStore<string[]>('items.json', ['default'], {
      storageDir: tempDir,
      enabled: true,
    });

    expect(store.load()).toEqual(['default']);

    store.save(['item-1', 'item-2']);
    expect(store.exists()).toBe(true);

    // Create a new instance pointing to same file
    const secondStore = new JsonFileStore<string[]>('items.json', [], {
      storageDir: tempDir,
      enabled: true,
    });

    expect(secondStore.load()).toEqual(['item-1', 'item-2']);
  });

  it('MagiStorageManager backs up all JSON storage files to a designated destination', () => {
    const backupDir = path.join(tempDir, 'backup');
    const dataDir = path.join(tempDir, 'data');

    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'decisions.json'), '{"decisions":[]}', 'utf-8');
    fs.writeFileSync(path.join(dataDir, 'reputation.json'), '{"profiles":[]}', 'utf-8');

    const manager = new MagiStorageManager(dataDir);
    const result = manager.backupTo(backupDir);

    expect(result.success).toBe(true);
    expect(result.filesCopied).toContain('decisions.json');
    expect(result.filesCopied).toContain('reputation.json');
    expect(fs.existsSync(path.join(backupDir, 'decisions.json'))).toBe(true);
    expect(fs.existsSync(path.join(backupDir, 'reputation.json'))).toBe(true);
  });

  it('persists and restores DecisionMemoryStore records across instances', () => {
    const memory1 = new DecisionMemoryStore({
      storageDir: tempDir,
      persist: true,
    }, true);

    memory1.recordDecision({
      problem: 'Migrate to local NVMe',
      domain: 'STORAGE',
      decision: {
        verdict: 'CONDITIONAL_PASS',
        confidence: 0.90,
        risks: [],
        assumptions: [],
        unknowns: [],
        evidence: [],
        nextActions: [],
        expectedOutcome: 'High IOPS',
      },
    });

    expect(memory1.getAllDecisions().length).toBe(1);

    // Instantiate a new memory store pointing to same directory
    const memory2 = new DecisionMemoryStore({
      storageDir: tempDir,
      persist: true,
    });

    expect(memory2.getAllDecisions().length).toBe(1);
    expect(memory2.getAllDecisions()[0].problem).toBe('Migrate to local NVMe');
  });

  it('persists and restores AgentReputationRegistry profiles across instances', () => {
    const rep1 = new AgentReputationRegistry(false, {
      storageDir: tempDir,
      persist: true,
    });

    rep1.recordSurvival('DEC-001', 'DATABASE', 'BALTHASAR');

    const balthasarProfile1 = rep1.getReputation('BALTHASAR');
    expect(balthasarProfile1.falseAlarms).toBeGreaterThan(0);

    // Instantiate second registry from same storage
    const rep2 = new AgentReputationRegistry(false, {
      storageDir: tempDir,
      persist: true,
    });

    const balthasarProfile2 = rep2.getReputation('BALTHASAR');
    expect(balthasarProfile2.falseAlarms).toBe(balthasarProfile1.falseAlarms);
  });

  it('persists and restores OperationalReversalMonitor contracts across instances', () => {
    const monitor1 = new OperationalReversalMonitor({
      storageDir: tempDir,
      persist: true,
    });

    monitor1.registerDecisionContracts('DEC-999', [{
      id: 'rc-p99',
      metric: 'p99_latency_ms',
      operator: '>',
      threshold: 250,
      window: '5m',
      action: 'ROLLBACK',
      description: 'Rollback if P99 > 250ms',
      status: 'ACTIVE',
    }]);

    expect(monitor1.getContracts().some(c => c.id === 'rc-p99')).toBe(true);

    const monitor2 = new OperationalReversalMonitor({
      storageDir: tempDir,
      persist: true,
    });

    expect(monitor2.getContracts().some(c => c.id === 'rc-p99')).toBe(true);
  });
});

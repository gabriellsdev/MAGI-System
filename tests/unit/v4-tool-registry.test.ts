import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../../src/tools/tool-registry.js';
import { PermissionChecker } from '../../src/tools/permission-checker.js';
import { EvidenceStore } from '../../src/knowledge/evidence-store.js';

describe('V4 Tool Layer — ToolRegistry & Security Sandbox', () => {
  let registry: ToolRegistry;
  let permissionChecker: PermissionChecker;
  let evidenceStore: EvidenceStore;

  beforeEach(() => {
    evidenceStore = new EvidenceStore();
    permissionChecker = new PermissionChecker();
    registry = new ToolRegistry({
      permissionChecker,
      evidenceStore,
      registerDefaults: true,
    });
  });

  it('should list all registered default tools', () => {
    const tools = registry.listTools();
    const names = tools.map(t => t.name);
    expect(names).toContain('web_search');
    expect(names).toContain('document_reader');
    expect(names).toContain('database_query');
    expect(names).toContain('code_sandbox');
  });

  it('should safely execute web_search and ingest generated evidence into EvidenceStore', async () => {
    const res = await registry.executeTool('web_search', { query: 'PostgreSQL ACID guarantees' });
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.evidenceGenerated).toBeDefined();
    expect(res.evidenceGenerated!.length).toBeGreaterThan(0);

    // Verify auto-ingestion into EvidenceStore
    expect(evidenceStore.count).toBeGreaterThan(0);
    const stored = evidenceStore.find({ types: ['WEB'] });
    expect(stored.length).toBeGreaterThan(0);
  });

  it('should safely execute read-only database query tool', async () => {
    const res = await registry.executeTool('database_query', { query: 'SELECT table_size FROM pg_stat_user_tables' });
    expect(res.success).toBe(true);
    expect(res.data.rowCount).toBeGreaterThan(0);
    expect(res.data.readOnlyVerified).toBe(true);
    expect(evidenceStore.find({ types: ['DATABASE'] }).length).toBe(1);
  });

  it('should reject mutating database commands with a security violation error', async () => {
    const res = await registry.executeTool('database_query', { query: 'DROP TABLE users CASCADE;' });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Security violation');
    expect(res.error).toContain('Mutation keyword "DROP" is forbidden');
  });

  it('should safely execute code_sandbox for clean mathematical computation', async () => {
    const res = await registry.executeTool('code_sandbox', { expression: '10 * 4 + 2' });
    expect(res.success).toBe(true);
    expect(res.data.output).toBe('42');
    expect(res.data.computedValue).toBe(42);
    expect(evidenceStore.find({ types: ['EXPERIMENT'] }).length).toBe(1);
  });

  it('should block unsafe code in code_sandbox with a security violation', async () => {
    const res = await registry.executeTool('code_sandbox', { expression: "require('fs').readFileSync('/etc/passwd')" });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Security violation');
    expect(res.error).toContain('require');
  });

  it('should block tool execution when permission is revoked by the PermissionChecker', async () => {
    permissionChecker.revokeDefault('NETWORK_ACCESS');

    const res = await registry.executeTool('web_search', { query: 'test query' });
    expect(res.success).toBe(false);
    expect(res.error).toContain('missing required permission [NETWORK_ACCESS]');
  });
});

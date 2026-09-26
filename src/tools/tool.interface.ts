import type { Evidence } from '../knowledge/knowledge.types.js';

export type ToolPermission =
  | 'READ_ONLY'
  | 'NETWORK_ACCESS'
  | 'SANDBOXED_CODE'
  | 'DATABASE_QUERY'
  | 'ADMIN_OVERRIDE';

export type ToolRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ToolExecutionContext {
  executionId?: string;
  requesterId?: string;
  allowedPermissions?: Set<ToolPermission>;
  metadata?: Record<string, unknown>;
}

export interface ToolExecutionResult<T = unknown> {
  success: boolean;
  toolName: string;
  data?: T;
  error?: string;
  durationMs: number;
  evidenceGenerated?: Evidence[];
}

export interface ITool<TParams = any, TResult = any> {
  readonly name: string;
  readonly description: string;
  readonly requiredPermission: ToolPermission;
  readonly riskLevel: ToolRiskLevel;

  execute(params: TParams, context?: ToolExecutionContext): Promise<ToolExecutionResult<TResult>>;
}

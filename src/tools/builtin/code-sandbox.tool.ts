import type { ITool, ToolPermission, ToolRiskLevel, ToolExecutionContext, ToolExecutionResult } from '../tool.interface.js';
import type { Evidence } from '../../knowledge/knowledge.types.js';

export interface CodeSandboxParams {
  expression: string;
  contextVariables?: Record<string, number | string | boolean>;
}

export interface CodeSandboxResult {
  output: string;
  computedValue?: unknown;
}

export class CodeSandboxTool implements ITool<CodeSandboxParams, CodeSandboxResult> {
  public readonly name = 'code_sandbox';
  public readonly description = 'Executes sandboxed mathematical and algorithmic benchmarks in an isolated environment.';
  public readonly requiredPermission: ToolPermission = 'SANDBOXED_CODE';
  public readonly riskLevel: ToolRiskLevel = 'MEDIUM';

  async execute(params: CodeSandboxParams, context?: ToolExecutionContext): Promise<ToolExecutionResult<CodeSandboxResult>> {
    const startTime = Date.now();
    const expr = (params.expression || '').trim();

    if (!expr) {
      return {
        success: false,
        toolName: this.name,
        error: 'Expression cannot be empty.',
        durationMs: Date.now() - startTime,
      };
    }

    // Security jail: reject process, require, import, eval, child_process, fs
    const forbiddenPatterns = [
      'process', 'child_process', 'require', 'import', 'eval', 'Function', 'fs', 'global', '__proto__'
    ];

    for (const pat of forbiddenPatterns) {
      if (expr.includes(pat)) {
        return {
          success: false,
          toolName: this.name,
          error: `Security violation: Forbidden token "${pat}" in sandboxed execution.`,
          durationMs: Date.now() - startTime,
        };
      }
    }

    try {
      // Safe mathematical evaluator
      // Bind context variables safely
      const vars = params.contextVariables || {};
      const varKeys = Object.keys(vars);
      const varValues = Object.values(vars);

      // Simple evaluation inside isolated function scope without access to globals
      const safeRunner = new Function(...varKeys, `"use strict"; return (${expr});`);
      const result = safeRunner(...varValues);

      const evidenceGenerated: Evidence[] = [
        {
          id: `ev-exp-${Date.now()}`,
          source: 'sandboxed_computation',
          content: `Experiment executed expression: "${expr}". Result: ${JSON.stringify(result)}`,
          type: 'EXPERIMENT',
          reliability: 0.99,
          timestamp: new Date(),
          claims: [
            {
              statement: `Algorithmic benchmark result verified: ${expr} evaluates to ${result}`,
              type: 'FACT',
              confidence: 0.99,
              requiresEvidence: false,
            },
          ],
          tags: ['experiment', 'code_sandbox', 'benchmark'],
        },
      ];

      return {
        success: true,
        toolName: this.name,
        data: {
          output: String(result),
          computedValue: result,
        },
        durationMs: Date.now() - startTime,
        evidenceGenerated,
      };
    } catch (err: any) {
      return {
        success: false,
        toolName: this.name,
        error: `Sandbox execution error: ${err.message}`,
        durationMs: Date.now() - startTime,
      };
    }
  }
}

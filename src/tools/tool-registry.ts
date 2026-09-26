import type { ITool, ToolExecutionContext, ToolExecutionResult } from './tool.interface.js';
import { PermissionChecker, globalPermissionChecker } from './permission-checker.js';
import { EvidenceStore, globalEvidenceStore } from '../knowledge/evidence-store.js';
import { WebSearchTool } from './builtin/web-search.tool.js';
import { DocumentReaderTool } from './builtin/document-reader.tool.js';
import { DatabaseQueryTool } from './builtin/database-query.tool.js';
import { CodeSandboxTool } from './builtin/code-sandbox.tool.js';

export interface ToolRegistryOptions {
  permissionChecker?: PermissionChecker;
  evidenceStore?: EvidenceStore;
  registerDefaults?: boolean;
}

export class ToolRegistry {
  private tools: Map<string, ITool> = new Map();
  private permissionChecker: PermissionChecker;
  private evidenceStore: EvidenceStore;

  constructor(options: ToolRegistryOptions = {}) {
    this.permissionChecker = options.permissionChecker ?? globalPermissionChecker;
    this.evidenceStore = options.evidenceStore ?? globalEvidenceStore;

    if (options.registerDefaults ?? true) {
      this.registerTool(new WebSearchTool());
      this.registerTool(new DocumentReaderTool());
      this.registerTool(new DatabaseQueryTool());
      this.registerTool(new CodeSandboxTool());
    }
  }

  /**
   * Registers a tool instance into the catalog.
   */
  public registerTool(tool: ITool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Retrieves a tool by name.
   */
  public getTool(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  /**
   * Lists metadata of all registered tools.
   */
  public listTools(): { name: string; description: string; requiredPermission: string; riskLevel: string }[] {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      requiredPermission: t.requiredPermission,
      riskLevel: t.riskLevel,
    }));
  }

  /**
   * Safely executes a registered tool, verifying permissions and ingesting any generated evidence.
   */
  public async executeTool<TParams = any, TResult = any>(
    toolName: string,
    params: TParams,
    context?: ToolExecutionContext
  ): Promise<ToolExecutionResult<TResult>> {
    const startTime = Date.now();
    const tool = this.tools.get(toolName);

    if (!tool) {
      return {
        success: false,
        toolName,
        error: `Tool "${toolName}" is not registered in MAGI Tool Layer.`,
        durationMs: Date.now() - startTime,
      };
    }

    // Security check: Permission validation
    const permCheck = this.permissionChecker.check(tool.name, tool.requiredPermission, context);
    if (!permCheck.permitted) {
      return {
        success: false,
        toolName,
        error: permCheck.reason,
        durationMs: Date.now() - startTime,
      };
    }

    // Execute tool inside guarded boundary
    try {
      const result = await tool.execute(params, context);

      // Ingest generated evidence into EvidenceStore
      if (result.success && result.evidenceGenerated && result.evidenceGenerated.length > 0) {
        this.evidenceStore.addMany(result.evidenceGenerated);
      }

      return result;
    } catch (err: any) {
      return {
        success: false,
        toolName,
        error: `Unhandled tool failure: ${err.message}`,
        durationMs: Date.now() - startTime,
      };
    }
  }
}

export const globalToolRegistry = new ToolRegistry();

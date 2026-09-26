import type { ToolPermission, ToolExecutionContext } from './tool.interface.js';

export interface AuditLogEntry {
  timestamp: Date;
  toolName: string;
  requiredPermission: ToolPermission;
  granted: boolean;
  requesterId?: string;
  reason?: string;
}

export class PermissionChecker {
  private defaultPermissions: Set<ToolPermission>;
  private auditLog: AuditLogEntry[] = [];

  constructor(defaultPermissions?: ToolPermission[]) {
    this.defaultPermissions = new Set(
      defaultPermissions ?? ['READ_ONLY', 'NETWORK_ACCESS', 'DATABASE_QUERY', 'SANDBOXED_CODE']
    );
  }

  /**
   * Evaluates whether a tool execution is permitted under the given execution context.
   */
  public check(toolName: string, requiredPermission: ToolPermission, context?: ToolExecutionContext): { permitted: boolean; reason: string } {
    const activePermissions = context?.allowedPermissions ?? this.defaultPermissions;

    const permitted = activePermissions.has(requiredPermission) || activePermissions.has('ADMIN_OVERRIDE');

    const entry: AuditLogEntry = {
      timestamp: new Date(),
      toolName,
      requiredPermission,
      granted: permitted,
      requesterId: context?.requesterId,
      reason: permitted
        ? 'Permission verified and granted.'
        : `Access denied: missing required permission [${requiredPermission}].`,
    };

    this.auditLog.push(entry);

    return {
      permitted,
      reason: entry.reason!,
    };
  }

  /**
   * Retrieves the current audit log.
   */
  public getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  /**
   * Grants an additional permission to the default security set.
   */
  public grantDefault(permission: ToolPermission): void {
    this.defaultPermissions.add(permission);
  }

  /**
   * Revokes a permission from the default security set.
   */
  public revokeDefault(permission: ToolPermission): void {
    this.defaultPermissions.delete(permission);
  }
}

export const globalPermissionChecker = new PermissionChecker();

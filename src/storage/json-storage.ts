import * as fs from 'node:fs';
import * as path from 'node:path';

export const DEFAULT_STORAGE_DIR = path.resolve(process.cwd(), 'data', 'storage');

export interface StorageOptions {
  storageDir?: string;
  enabled?: boolean;
}

/**
 * Ensures the target storage directory exists synchronously
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Atomically writes data to a JSON file using a temp file and rename/copy
 */
export function atomicWriteJsonSync(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  ensureDirectoryExists(dir);

  const serialized = JSON.stringify(data, null, 2);
  const tempPath = `${filePath}.tmp.${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  try {
    fs.writeFileSync(tempPath, serialized, 'utf-8');
    // On Windows, rename can fail if destination exists and is locked, so we use copy + unlink fallback
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      fs.renameSync(tempPath, filePath);
    } catch {
      fs.copyFileSync(tempPath, filePath);
      fs.unlinkSync(tempPath);
    }
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch { /* ignore cleanup error */ }
    }
    throw err;
  }
}

/**
 * Reads data from a JSON file, returning fallback if file does not exist or fails parsing
 */
export function readJsonSync<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Generic JsonFileStore wrapper for typed persistence
 */
export class JsonFileStore<T> {
  public readonly filePath: string;
  private inMemoryCache: T | null = null;
  private enabled: boolean;

  constructor(fileName: string, private defaultValue: T, options: StorageOptions = {}) {
    const isVercel = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL_ENV;
    const storageDir = options.storageDir || process.env.MAGI_STORAGE_DIR || DEFAULT_STORAGE_DIR;
    this.filePath = path.join(storageDir, fileName);
    this.enabled = isVercel ? false : (options.enabled ?? (process.env.NODE_ENV !== 'test'));
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
  }

  public load(): T {
    if (!this.enabled) {
      return this.inMemoryCache ?? this.defaultValue;
    }
    const data = readJsonSync<T>(this.filePath, this.defaultValue);
    this.inMemoryCache = data;
    return data;
  }

  public save(data: T): void {
    this.inMemoryCache = data;
    if (!this.enabled) return;

    atomicWriteJsonSync(this.filePath, data);
  }

  public exists(): boolean {
    return fs.existsSync(this.filePath);
  }
}

/**
 * Storage Manager for coordinating MAGI data stores and backups
 */
export class MagiStorageManager {
  public readonly storageDir: string;

  constructor(storageDir: string = DEFAULT_STORAGE_DIR) {
    this.storageDir = storageDir;
  }

  /**
   * Backs up all JSON storage files to a designated destination (e.g. Google Drive folder)
   */
  public backupTo(targetDirectory: string): { success: boolean; filesCopied: string[]; destination: string } {
    ensureDirectoryExists(targetDirectory);

    if (!fs.existsSync(this.storageDir)) {
      return { success: true, filesCopied: [], destination: targetDirectory };
    }

    const files = fs.readdirSync(this.storageDir).filter(f => f.endsWith('.json'));
    const copied: string[] = [];

    for (const file of files) {
      const src = path.join(this.storageDir, file);
      const dest = path.join(targetDirectory, file);
      fs.copyFileSync(src, dest);
      copied.push(file);
    }

    return {
      success: true,
      filesCopied: copied,
      destination: targetDirectory,
    };
  }

  /**
   * Checks whether storage directory exists and lists active files
   */
  public getStatus(): { storageDir: string; fileCount: number; files: string[]; totalSizeBytes: number } {
    ensureDirectoryExists(this.storageDir);
    const files = fs.readdirSync(this.storageDir).filter(f => f.endsWith('.json'));
    let totalSizeBytes = 0;

    for (const file of files) {
      const stat = fs.statSync(path.join(this.storageDir, file));
      totalSizeBytes += stat.size;
    }

    return {
      storageDir: this.storageDir,
      fileCount: files.length,
      files,
      totalSizeBytes,
    };
  }
}

export const globalStorageManager = new MagiStorageManager();

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  ILanguageModelProvider,
  StructuredGenerationRequest,
  ProviderResponse,
} from '../provider.interface.js';

export interface CacheProviderOptions {
  cacheDir?: string;
  enabled?: boolean;
  ttlMs?: number; // Optional TTL in milliseconds
  forceRefresh?: boolean;
  onCacheHit?: (key: string, schemaName: string) => void;
  onCacheMiss?: (key: string, schemaName: string) => void;
}

export interface CacheStats {
  hits: number;
  misses: number;
  tokensSaved: number;
}

interface CacheEntry<T> {
  key: string;
  createdAt: string;
  providerId: string;
  schemaName: string;
  response: ProviderResponse<T>;
}

export class CachedProvider implements ILanguageModelProvider {
  public readonly providerId: string;
  private innerProvider: ILanguageModelProvider;
  private cacheDir: string;
  private enabled: boolean;
  private ttlMs?: number;
  private forceRefresh: boolean;
  private stats: CacheStats = { hits: 0, misses: 0, tokensSaved: 0 };
  private onCacheHit?: (key: string, schemaName: string) => void;
  private onCacheMiss?: (key: string, schemaName: string) => void;

  constructor(innerProvider: ILanguageModelProvider, options: CacheProviderOptions = {}) {
    this.innerProvider = innerProvider;
    this.providerId = `cached-${innerProvider.providerId}`;
    this.cacheDir = options.cacheDir || path.resolve(process.cwd(), '.cache', 'llm');
    this.enabled = options.enabled ?? (process.env.MAGI_CACHE_DISABLED !== 'true');
    this.ttlMs = options.ttlMs;
    this.forceRefresh = options.forceRefresh || false;
    this.onCacheHit = options.onCacheHit;
    this.onCacheMiss = options.onCacheMiss;

    if (this.enabled) {
      try {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      } catch {
        // Directory creation will be attempted on write if needed
      }
    }
  }

  public getInnerProvider(): ILanguageModelProvider {
    return this.innerProvider;
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public resetStats(): void {
    this.stats = { hits: 0, misses: 0, tokensSaved: 0 };
  }

  public computeCacheKey<T>(request: StructuredGenerationRequest<T>): string {
    const canonicalPayload = {
      providerId: this.innerProvider.providerId,
      model: request.model || '',
      systemInstruction: request.systemInstruction || '',
      messages: request.messages.map(m => ({ role: m.role, content: m.content })),
      schemaName: request.schemaName,
      temperature: request.config?.temperature,
      topP: request.config?.topP,
      maxOutputTokens: request.config?.maxOutputTokens,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(canonicalPayload))
      .digest('hex');
  }

  private getCacheFilePath(key: string): string {
    return path.join(this.cacheDir, `${key}.json`);
  }

  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<ProviderResponse<T>> {
    if (!this.enabled || this.forceRefresh) {
      this.stats.misses++;
      return this.innerProvider.generateStructured(request);
    }

    const key = this.computeCacheKey(request);
    const filePath = this.getCacheFilePath(key);

    // 1. Attempt Cache Read
    if (fs.existsSync(filePath)) {
      try {
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const entry: CacheEntry<T> = JSON.parse(rawContent);

        // Validate TTL if set
        const isExpired = this.ttlMs
          ? Date.now() - new Date(entry.createdAt).getTime() > this.ttlMs
          : false;

        if (!isExpired) {
          // Re-validate cached data against requested schema
          const validatedData = request.schema.parse(entry.response.data);
          this.stats.hits++;
          if (entry.response.usage?.totalTokens) {
            this.stats.tokensSaved += entry.response.usage.totalTokens;
          }
          if (this.onCacheHit) {
            this.onCacheHit(key, request.schemaName);
          }

          return {
            ...entry.response,
            data: validatedData,
          };
        }
      } catch {
        // Cache read or schema validation failed, fall through to provider call
      }
    }

    // 2. Cache Miss: Invoke Inner Provider
    this.stats.misses++;
    if (this.onCacheMiss) {
      this.onCacheMiss(key, request.schemaName);
    }

    const response = await this.innerProvider.generateStructured(request);

    // 3. Persist to Disk Cache
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }

      const entry: CacheEntry<T> = {
        key,
        createdAt: new Date().toISOString(),
        providerId: this.innerProvider.providerId,
        schemaName: request.schemaName,
        response,
      };

      fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf-8');
    } catch {
      // Writing cache should never break the main generation flow
    }

    return response;
  }
}

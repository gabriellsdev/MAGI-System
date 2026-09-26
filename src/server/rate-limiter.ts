import * as http from 'node:http';

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface ClientRecord {
  timestamps: number[];
}

export class InMemoryRateLimiter {
  private clients = new Map<string, ClientRecord>();
  private windowMs: number;
  private maxRequests: number;
  private message: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.message = options.message || 'Rate limit exceeded. Please wait before making more requests.';

    // Clean up stale client entries periodically (every 2 minutes)
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 120_000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  public check(clientIp: string): {
    allowed: boolean;
    remaining: number;
    resetTimeMs: number;
    total: number;
  } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.clients.get(clientIp);
    if (!record) {
      record = { timestamps: [] };
      this.clients.set(clientIp, record);
    }

    // Filter out timestamps outside the active window
    record.timestamps = record.timestamps.filter(ts => ts > windowStart);

    const count = record.timestamps.length;
    const allowed = count < this.maxRequests;

    if (allowed) {
      record.timestamps.push(now);
    }

    const remaining = Math.max(0, this.maxRequests - record.timestamps.length);
    const oldestTimestamp = record.timestamps[0] || now;
    const resetTimeMs = Math.max(0, oldestTimestamp + this.windowMs - now);

    return {
      allowed,
      remaining,
      resetTimeMs,
      total: this.maxRequests,
    };
  }

  public apply(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    // Disable rate limiting in test runs
    if (process.env.NODE_ENV === 'test') {
      return true;
    }

    const clientIp = this.extractClientIp(req);
    const result = this.check(clientIp);

    res.setHeader('X-RateLimit-Limit', result.total.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTimeMs / 1000).toString());

    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil(result.resetTimeMs / 1000).toString());
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: this.message,
        retryAfterSeconds: Math.ceil(result.resetTimeMs / 1000),
      }));
      return false;
    }

    return true;
  }

  public extractClientIp(req: http.IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded[0]) {
      return forwarded[0].split(',')[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string') {
      return realIp.trim();
    }
    return req.socket?.remoteAddress || '127.0.0.1';
  }

  public reset(): void {
    this.clients.clear();
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clients.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [ip, record] of this.clients.entries()) {
      record.timestamps = record.timestamps.filter(ts => ts > windowStart);
      if (record.timestamps.length === 0) {
        this.clients.delete(ip);
      }
    }
  }
}

import type { ProblemClassification, ProblemComplexity, RiskLevel, ExecutionPath } from './controller.types.js';

export class ProblemClassifier {
  /**
   * Evaluates and classifies a user problem/objective to determine optimal execution routing
   * and whether an active investigation is mandated.
   */
  public classify(problem: string): ProblemClassification {
    const p = (problem || '').trim();
    const lower = p.toLowerCase();
    const wordCount = lower.split(/\s+/).length;

    // 1. Critical High-Stakes / Catastrophic Risk Keywords
    const catastrophicKeywords = [
      'migrat', 'rewrite', 'kubernetes', 'k8s', 'distributed transaction',
      'consensus', 'split-brain', 'zero downtime', 'legacy replatform',
      'paxos', 'raft', 'gdpr', 'compliance audit', 'root credentials',
      'database wipe', 'crypto key', 'unencrypted'
    ];

    const isCatastrophic = catastrophicKeywords.some(kw => lower.includes(kw));

    if (isCatastrophic) {
      return {
        complexity: 'CRITICAL',
        riskLevel: 'CATASTROPHIC',
        domain: this.detectDomain(lower),
        requiresInvestigation: true,
        recommendedPath: 'DEEP_INVESTIGATION',
        reason: 'Detected high-stakes architectural or systemic risk. Mandatory empirical investigation and evidence collection required before deliberation.',
        primaryTradeoffs: ['Data integrity vs agility', 'Operational blast radius vs modern capabilities', 'Migration downtime vs backward compatibility'],
      };
    }

    // 2. High Complexity Tradeoffs
    const highRiskKeywords = [
      'microservice', 'monolith', 'acid vs base', 'event-driven',
      'cqrs', 'kafka vs rabbitmq', 'multi-region', 'sharding',
      'consistency vs availability', 'decoupling', 'nosql vs sql'
    ];

    const isHighRisk = highRiskKeywords.some(kw => lower.includes(kw));

    if (isHighRisk) {
      return {
        complexity: 'HIGH',
        riskLevel: 'HIGH',
        domain: this.detectDomain(lower),
        requiresInvestigation: true,
        recommendedPath: 'DEEP_INVESTIGATION',
        reason: 'Complex distributed tradeoff requiring verification of query profiles, telemetry, and empirical constraints.',
        primaryTradeoffs: ['Scalability vs operational simplicity', 'Coupling vs latency overhead'],
      };
    }

    // 3. Obvious Fast-Path Indicators (simple factual, definitions, low blast radius)
    const simplePrefixes = [
      'what is', 'qual é', 'o que é', 'como funciona', 'how does',
      'explain', 'explica', 'definition of', 'significado de'
    ];
    const isSimplePrefix = simplePrefixes.some(pref => lower.startsWith(pref));
    const hasTradeoffs = lower.includes(' or ') || lower.includes(' vs ') || lower.includes(' ou ') || lower.includes('should we');

    if (isSimplePrefix && !hasTradeoffs && wordCount <= 16) {
      return {
        complexity: 'LOW',
        riskLevel: 'LOW',
        domain: this.detectDomain(lower),
        requiresInvestigation: false,
        recommendedPath: 'FAST_PATH',
        reason: 'Direct factual or conceptual clarification query. No systemic tradeoff or operational blast radius detected.',
        primaryTradeoffs: [],
      };
    }

    // 4. Default: Standard Triad Deliberation
    return {
      complexity: 'MEDIUM',
      riskLevel: 'MEDIUM',
      domain: this.detectDomain(lower),
      requiresInvestigation: false,
      recommendedPath: 'STANDARD_TRIAD',
      reason: 'Standard conceptual dilemma. Deliberation among Melchior, Balthasar, and Casper is recommended.',
      primaryTradeoffs: ['Implementation speed vs long-term maintainability'],
    };
  }

  private detectDomain(lower: string): string {
    if (lower.includes('data') || lower.includes('postgres') || lower.includes('sql') || lower.includes('mongo') || lower.includes('redis')) {
      return 'DATA_ARCHITECTURE';
    }
    if (lower.includes('k8s') || lower.includes('docker') || lower.includes('cloud') || lower.includes('cluster') || lower.includes('deploy')) {
      return 'INFRASTRUCTURE';
    }
    if (lower.includes('crypto') || lower.includes('auth') || lower.includes('security') || lower.includes('vulnerability')) {
      return 'SECURITY';
    }
    if (lower.includes('plan') || lower.includes('roadmap') || lower.includes('team') || lower.includes('budget')) {
      return 'OPERATIONAL_PLANNING';
    }
    return 'GENERAL_SOFTWARE';
  }
}

export const globalProblemClassifier = new ProblemClassifier();

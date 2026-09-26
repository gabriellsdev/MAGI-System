import type { IDisagreementDetector } from './disagreement-detector.interface.js';
import type {
  AgentId,
  AgentStructuredOutput,
  DisagreementReport,
  DisagreementMetrics,
} from '../domain/types.js';

export interface RuleBasedDetectorOptions {
  confidenceDeltaThreshold?: number; // default: 0.3
}

export class RuleBasedDisagreementDetector implements IDisagreementDetector {
  private confidenceDeltaThreshold: number;

  constructor(options: RuleBasedDetectorOptions = {}) {
    this.confidenceDeltaThreshold = options.confidenceDeltaThreshold ?? 0.3;
  }

  evaluate(outputs: Record<AgentId, AgentStructuredOutput>): DisagreementReport {
    const agentIds = Object.keys(outputs) as AgentId[];
    const stances = agentIds.map(id => outputs[id].stance);
    const confidences: Record<AgentId, number> = {
      MELCHIOR: outputs.MELCHIOR?.confidence ?? 0,
      BALTHASAR: outputs.BALTHASAR?.confidence ?? 0,
      CASPER: outputs.CASPER?.confidence ?? 0,
    };

    // 1. Check for conflicting stances among any pair
    const uniqueStances = Array.from(new Set(stances));
    const stanceDivergence = uniqueStances.length > 1;

    // 2. Check for confidence variance among all pairs: |C_i - C_j| > threshold
    let maxDelta = 0;
    let deltaPair: [AgentId, AgentId] | null = null;

    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        const idA = agentIds[i];
        const idB = agentIds[j];
        const delta = Math.abs(confidences[idA] - confidences[idB]);
        if (delta > maxDelta) {
          maxDelta = delta;
          deltaPair = [idA, idB];
        }
      }
    }

    // Round maxDelta to 4 decimal places to prevent floating point imprecision (e.g. 0.9 - 0.6 = 0.30000000000000004)
    const roundedMaxDelta = Math.round(maxDelta * 10000) / 10000;
    const confidenceSpreadExceeded = (roundedMaxDelta - this.confidenceDeltaThreshold) > 1e-6;
    const hasSignificantDisagreement = stanceDivergence || confidenceSpreadExceeded;

    // Determine divergent agents and human-readable reason
    const divergentAgents: Set<AgentId> = new Set();
    const reasons: string[] = [];

    if (stanceDivergence) {
      // Find agents whose stances differ from the majority or from each other
      reasons.push(
        `Conflicting stances detected: ${agentIds.map(id => `${id}=${outputs[id].stance}`).join(', ')}`
      );
      agentIds.forEach(id => divergentAgents.add(id));
    }

    if (confidenceSpreadExceeded && deltaPair) {
      const [idA, idB] = deltaPair;
      reasons.push(
        `Significant confidence spread: |${idA}(${confidences[idA].toFixed(2)}) - ${idB}(${confidences[idB].toFixed(2)})| = ${maxDelta.toFixed(2)} > ${this.confidenceDeltaThreshold.toFixed(2)}`
      );
      divergentAgents.add(idA);
      divergentAgents.add(idB);
    }

    const metrics: DisagreementMetrics = {
      stanceDivergence,
      maxConfidenceDelta: parseFloat(maxDelta.toFixed(3)),
      confidences,
    };

    return {
      hasSignificantDisagreement,
      reason: reasons.join('; ') || 'Full consensus achieved with consistent confidence levels.',
      divergentAgents: Array.from(divergentAgents),
      metrics,
    };
  }
}

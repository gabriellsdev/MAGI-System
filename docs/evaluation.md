# MAGI Evaluation & CLI Guide

This guide details how to execute benchmarks, blind evaluations, ablation studies, and monitor real-time system metrics.

---

## 1. Quick CLI Reference

| Command | Purpose | Output Location |
| :--- | :--- | :--- |
| `npm run benchmark` | Runs standard benchmark dilemmas through MAGI | Terminal scorecard |
| `npm run eval` | Runs Blinded Pairwise G-Eval (Single LLM vs MAGI) | `results/evaluation-report.json` |
| `npm run ablation` | Runs 5-way Architectural Ablation study | `results/ablation-report.json` |
| `npm test` | Runs complete unit and integration test suite | Terminal test report |

---

## 2. Command Options & Flags

### 2.1 Evaluation Suite (`npm run eval`)
Compare Single LLM Baseline against MAGI with G-Eval rubrics:
```bash
# Run on 3 dilemmas in mock mode (instant, 0 tokens)
npm run eval -- --limit=3 --mock

# Run with position swap to neutralize order bias
npm run eval -- --limit=3 --mock --swap

# Run on a specific category
npm run eval -- --category=SYSTEM_ARCHITECTURE --mock

# Run against live Gemini API with disk caching enabled
npm run eval -- --limit=5
```

### 2.2 Ablation Study Suite (`npm run ablation`)
Deconstruct the performance of all 5 architecture variants:
```bash
# Fast mock ablation test across 2 dilemmas
npm run ablation -- --limit=2 --mock

# Ablation test on security dilemmas
npm run ablation -- --category=SECURITY_COMPLIANCE --mock

# Run complete 50-dilemma ablation suite
npm run ablation -- --all --mock
```

---

## 3. Real-Time Observability API (`GET /api/metrics`)

When running the MAGI HTTP server (`npm run serve`), access operational metrics in real-time:

```bash
curl http://localhost:3000/api/metrics
```

### Example Response:
```json
{
  "totalQueries": 42,
  "consensusRate": 66.7,
  "avgRounds": 1.25,
  "avgConfidence": 84.5,
  "avgLatencyMs": 6240,
  "avgCostUsd": 0.0078,
  "totalTokensUsed": 142500,
  "disagreementStats": {
    "structuralDisagreements": 18,
    "substantiveDisagreements": 12,
    "superficialFilteredByArbiter": 6,
    "arbiterFilterRate": 33.3
  },
  "adaptiveRoutingStats": {
    "fastPathCount": 14,
    "standardPathCount": 20,
    "deepDeliberationCount": 8,
    "estimatedTokensSaved": 39200,
    "estimatedCostSavedUsd": 0.098
  },
  "lastUpdated": "2026-09-12T10:30:00.000Z"
}
```

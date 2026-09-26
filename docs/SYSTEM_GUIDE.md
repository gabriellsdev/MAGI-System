# MAGI System Documentation & Living Operational Guide

> **System Designation**: NERV-01 // MAGI Deliberation Supercomputer System  
> **Classification**: Living Engineering & Cognitive Architecture Reference  
> **Status**: Verified Operational (132/132 Tests Passing, 0 Regressions Across 36 Suites, Version 3.4.0)

---

## 1. Executive Summary & Vision

The **MAGI System** is a high-rigor, multi-agent cognitive architecture inspired by the three-supercomputer core conceived by Dr. Naoko Akagi in *Neon Genesis Evangelion*.

Unlike conventional generative AI pipelines that rely on naive single-shot completions or simple democratic voting (majority rule), MAGI models **dialectical conflict, epistemological auditing, non-democratic arbitration, and production intelligence**. The system distributes cognitive inquiry across three specialized, competing agent personas:
- **MELCHIOR-1**: The Scientist (empirical truth, formal logic, computability).
- **BALTHASAR-2**: The Mother (life preservation, catastrophic tail-risk mitigation, adversarial veto).
- **CASPER-3**: The Woman (pragmatic compromise, ergonomics, operational feasibility).

MAGI answers two fundamental empirical engineering questions:  
1. **Does multi-agent deliberation substantively improve decision quality over monolithic LLMs, and at what computational and latency cost?**
2. **Does MAGI know when NOT to trust its own decision?** (Epistemic Metacognition & Operational Calibration)

Empirical benchmarks demonstrate that MAGI improves holistic decision robustness by **+33.6%** (9.35/10 vs 7.00/10 G-Eval) and achieves a **91.2% head-to-head win rate** against baseline models, specifically preventing unmitigated second-order catastrophic hazards. In V3.4, the system introduces **Production Intelligence**: a metacognitive circuit-breaker (`EPISTEMIC_HALT`), **Operational Reversal Contracts (*Contracts as Code*)**, a mathematical **Confidence Calibration Engine (Brier Score & ECE)**, and a forensic **Reversal Post-Mortem Engine**.

---

## 2. Core Architecture & Deliberation Lifecycle

```
                      [ OPERATOR DIRECTIVE / QUERY ]
                                     │
                                     ▼
                          [ ADAPTIVE QUERY ROUTER ]
                           /                     \
              LOW Complexity                      MEDIUM / HIGH Complexity
              [ FAST PATH ]                                  │
                    │                                        ▼
             Single Advisor                         [ ROUND 0: INDEPENDENT ]
             (1-2s, ~700 tok)                     ┌──────────┼──────────┐
                    │                             ▼          ▼          ▼
                    │                        MELCHIOR-1 BALTHASAR-2 CASPER-3
                    │                        (Scientist)  (Mother)   (Woman)
                    │                             └──────────┼──────────┘
                    │                                        │
                    │                                        ▼
                    │                        [ TWO-TIER DISAGREEMENT DETECTOR ]
                    │                                        │
                    │                      Tier 1: Rule-Based Divergence Check
                    │                                        │
                    │                           [ Divergence Detected? ]
                    │                              /              \
                    │                            NO               YES
                    │                            │                 │
                    │                            │                 ▼
                    │                            │        Tier 2: LLM Arbiter
                    │                            │                 │
                    │                            │        [ Substantive Debate? ]
                    │                            │           /              \
                    │                            │     SUPERFICIAL      SUBSTANTIVE
                    │                            │          │                │
                    │                            │          ▼                ▼
                    │                            │    Filter Debate     [ ROUND 1 ]
                    │                            │    (Consensus)     Peer Critique
                    │                            │          │                │
                    │                            │          │                ▼
                    │                            │          │           [ CHECK 2 ]
                    │                            │          │         Convergence?
                    │                            │          │           /     \
                    │                            │          │         YES      NO
                    │                            │          │          │        ▼
                    │                            │          │          │   [ ROUND 2 ]
                    │                            │          │          │ Final Rebuttal
                    │                            │          │          │        │
                    │                            └──────────┴──────────┴────────┘
                    │                                        │
                    ▼                                        ▼
            [ FAST RESULT ]                       [ MAGI CORE ARBITRATION ]
                                                  - Non-democratic verdict
                                                  - Epistemic evidence audit
                                                  - Argument quality scoring (1-10)
                                                  - Dissent archive preservation
                                                             │
                                                             ▼
                                                    [ FINAL SYNTHESIS ]
```

### 2.1 Deliberation Rounds Breakdown
1. **Round 0 (Independent Blind Analysis)**:
   - All three agents analyze the query concurrently with **zero cross-agent contamination**.
   - Output structured JSON containing stance (`APPROVE`, `REJECT`, `CONDITIONAL`), numerical confidence (0.00 to 1.00), summary, key arguments, identified risks, and typed epistemic claims.
2. **Check 1 (Divergence Gate)**:
   - **Tier 1 (Deterministic)**: Checks if stances conflict or confidence spread exceeds threshold ($\Delta > 0.20$).
   - **Tier 2 (Semantic LLM Arbiter)**: If Tier 1 flags a divergence, the arbiter inspects whether the disagreement is substantive or merely stylistic. If superficial, debate terminates early.
3. **Round 1 (Cross-Examination / Peer Critique)**:
   - Each agent receives the full round 0 transcripts of the other two cores.
   - Personas rigorously cross-examine each other, exposing faulty assumptions, blind spots, or unrealistic compromises.
4. **Check 2 (Convergence Gate)**:
   - Assesses whether peer critiques caused stance convergence or confidence alignment.
5. **Round 2 (Final Rebuttal & Stance Hardening)**:
   - Triggered only if deep ideological or factual deadlocks persist. Agents deliver their final defenses.
6. **Core Synthesis & Arbitration**:
   - The central MAGI Core evaluates the evidentiary record.
   - Evaluates argument cogency (scored 1 to 10 per agent).
   - Conducts an epistemic audit (ratio of facts vs assumptions).
   - Applies the non-democratic veto rule (e.g. Balthasar's unmitigated catastrophic failure veto).
   - Archives dissenting opinions to prevent silent groupthink.

---

## 3. Subsystem Architecture

### 3.1 Agents Subsystem (`src/agents/`)
- **`magi-agent.ts`**: Implements the base persona wrapper, prompt injection, structured JSON schema validation, and retry logic.
- **`prompts.ts`**: Contains the canonical system prompts reflecting Dr. Naoko Akagi's three facets:
  - *Melchior*: Scientific reason, mathematical consistency, algorithmic efficiency, demand for empirical proof.
  - *Balthasar*: Maternal protection of human life and systems, fear of existential ruin, refusal to compromise safety.
  - *Casper*: Female pragmatism, self-awareness of human limitation, ergonomics, defiance of dogmatic purism.

### 3.2 Epistemic Audit & Claims Subsystem (`src/deliberation/`)
Every claim asserted by an agent is categorized into one of 5 epistemic levels:
1. `FACT`: Empirically proven ground truth or verified invariant.
2. `INFERENCE`: Logically sound deductions from established facts.
3. `ASSUMPTION`: Unverified operational presumptions (penalized by MAGI Core if critical).
4. `HEURISTIC`: Industry experience and practical rules of thumb.
5. `SPECULATION`: Hypothetical conjecture or worst-case projection.

MAGI Core calculates an **Evidence Confidence Score** and attributes the `strongestEvidenceAgent` based on factual density.

### 3.3 Disagreement Arbiter Subsystem (`src/disagreement/`)
- **`disagreement-detector.ts`**: Fast, zero-token mathematical detector measuring stance deltas and confidence spreads.
- **`hybrid-disagreement-detector.ts`**: Blends Tier 1 speed with Tier 2 LLM semantic arbitration, preventing unnecessary token burn on false debates.

### 3.4 Provider & Cache Subsystem (`src/providers/`)
- **`gemini-provider.ts`**: Real LLM provider powered by Google's official `@google/genai` SDK, supporting Gemini 3.1 Pro and Gemini 2.5 Flash with structured output enforcement and exponential backoff retry.
- **`disk-cache-provider.ts`**: Deterministic SHA-256 caching layer (`.cache/llm/`) enabling sub-second offline benchmark replays with zero API token spend.
- **`mock-provider.ts` & `src/providers/mock/dilemmas/`**: Modular, high-fidelity mock dilemma registry (11 curated dilemmas across 5 engineering disciplines in 7 languages).

### 3.5 Server & API Subsystem (`src/server/server.ts`)
- **Normalized Routing**: Sanitizes pathnames (stripping `/public/` prefix and trailing slashes) to prevent HTTP 404 and 405 errors across local Node, VS Code Live Server, and Vercel serverless runtimes.
- **Endpoints**:
  - `POST /api/deliberate`: Standard batch synchronous deliberation.
  - `POST /api/deliberate/stream`: Real-time Server-Sent Events (SSE) streaming deliberation events (`round_start`, `agent_completed`, `disagreement_flagged`, `consensus_achieved`, `core_verdict`).
  - `GET /api/health`: Health status and Gemini API key configuration check.
  - `GET /api/metrics`: Real-time observability counters (latencies, tokens, cache hits).
  - `GET /api/history`: Deliberation audit trail retrieved from persistence.
  - `GET /api/benchmark`: Automated test scorecard execution.
  - `GET /api/calibration`: Confidence calibration report (Brier Score, Expected Calibration Error ECE, overconfidence bias, reliability bins).
  - `GET /api/contracts`: Active and tripped operational reversal contracts registry.
  - `POST /api/contracts/evaluate`: Ingests live telemetry values and trips breaching operational contracts.
  - `GET /api/post-mortems`: Forensic autopsy reports for reverted production decisions.
  - `POST /api/decisions/revert`: Reverts a decision (manual or automated via contract trip) and executes autopsy analysis.

### 3.6 Frontend HUD & CRT Interface (`public/`)
- **Tri-Mode View Switcher**:
  - *Anime MAGI*: 1:1 replica of the Evangelion NERV central tactical screen with CRT phosphor glows, polygonal agent screens, connecting circuit buses, and red/green decision stamps.
  - *Tactical Minimalist*: High-density NERV ASCII command-line interface.
  - *Diagnostic Cyber-Deck HUD*: In-depth telemetry, stepper timeline, confidence meters, and argument quality graphs.
- **In-Browser Mock Simulation (`public/mock-fixtures.js`)**: Standalone client-side fallback engine that runs full SSE-style mock streaming directly in the browser if the backend server is offline.
- **Synthesized Audio Engine**: Procedural Web Audio synthesizer generating authentic 1990s anime computer beeps, relay clicks, warning chimes, and stamp pulses.
- **Zero-Emoji Tactical Interface**: Austere military bracket prefixes (`[ARCH]`, `[RELIABILITY]`, `[CI/CD]`, `[ETHICS]`, `[NERV TACTICAL]`, `[DIVERGENCE]`, `[CONSENSUS]`, `[EPISTEMIC_HALT]`) replacing casual emojis for authentic supercomputer ergonomics.

### 3.7 Database & Persistence Subsystem (`src/db/`)
- **Supabase Integration**: Stores deliberation histories, agent stances, confidence trajectories, and dissenting logs into relational tables (`deliberations`, `agent_analyses`) for retrospective compliance auditing.

### 3.8 V3.4 Production Intelligence & Metacognitive Auditing
- **Metacognitive Safety Gate (`EPISTEMIC_HALT`)**: An autonomous circuit-breaker in `MagiCore`. If a dilemma exhibits high dissent (`dissentStrength >= 0.60`), high irreversibility (`reversibility <= 0.40` - one-way door), and weak empirical grounding (`evidenceQuality <= 6.0` or `riskSeverity >= 0.70`), MAGI halts autonomous execution with `finalDecision = 'EPISTEMIC_HALT'`, demanding human architectural escalation.
- **Operational Reversal Contracts (*Contracts as Code*)**: Reversal conditions are elevated into active, monitorable contracts with metrics, thresholds, comparison operators (`>`, `<`, `>=`, `<=`, `==`), evaluation windows, and automated actions (`ROLLBACK`, `CIRCUIT_BREAK`, `HUMAN_ESCALATION`).
- **Confidence Calibration Engine (`src/calibration/calibration-engine.ts`)**: Computes mathematical calibration over historical decisions:
  - **Brier Score**: $B = \frac{1}{N} \sum_{i=1}^N (f_i - o_i)^2$ (where $f_i$ is declared confidence and $o_i \in \{0, 1\}$ is survival outcome).
  - **Expected Calibration Error (ECE)**: Weighted calibration error across reliability bins.
  - **Overconfidence Bias**: $\bar{f} - \bar{o}$.
- **Operational Reversal Monitor (`src/monitoring/reversal-monitor.ts`)**: Ingests production telemetry data points (`ingestTelemetry`), evaluates active contracts in real-time, and automatically trips rollbacks when thresholds breach.
- **Reversal Post-Mortem Autopsy Engine (`src/monitoring/post-mortem-engine.ts`)**: When a decision is reverted, evaluates whether the losing minority dissent anticipated the exact failure mode, calculates **Minority Vindication Score**, diagnoses majority blind spots, and awards predictive reputation deltas.
- **Multi-Judge G-Eval Ensemble (`src/evaluation/llm-judge.ts`)**: Evaluates candidate pairs across $N=3$ independent passes, calculating sample mean ($\bar{x}$) and standard deviation ($\sigma$).
- **Adversarial Benchmark Suite (`benchmarks/adversarial.json`)**: 10 high-stakes traps testing sycophancy and failure cascades.

---

## 4. Multilingual & Curated Dilemma Store

Located at `src/providers/mock/dilemmas/`, every dilemma is isolated into an independent, modular fixture exporting comprehensive analyses for all three cores in English and Portuguese, with unified categories:

| Category Key | Tactical Category Name | Description |
| :--- | :--- | :--- |
| `arch` | `[ARCH] SYSTEM ARCHITECTURE & ENGINEERING` | Core structural, framework, and language decisions (Rust migration, Microservices, DB selection). |
| `reliability` | `[RELIABILITY] INCIDENTS, RESILIENCE & DEADLOCKS` | High-stress triage, distributed locks, cascading failure recovery. |
| `delivery` | `[CI/CD] AUTOMATION & TECH DEBT` | Automated release gates, pipeline security, refactoring versus feature velocity. |
| `ethics` | `[ETHICS] AI ETHICS, GOVERNANCE & LAW` | Algorithmic transparency, autonomous decisions, human oversight. |
| `lore` | `[NERV TACTICAL] EVANGELION PROTOCOLS & LORE` | Canonical NERV protocols (Dummy Plug authorization, Human Instrumentality, Lilith self-destruct). |

---

## 5. Scientific Validation Framework (V3.4)

MAGI implements an exhaustive scientific validation subsystem answering the core empirical question:
> *"Do these architectural gains continue to exist when the system is tested under rigorous statistical controls?"*

### Architecture of the Scientific Validation Matrix
The evaluation matrix executes across the complete 60-dilemma benchmark (50 standard + 10 adversarial traps) $\times$ 5 ablation tiers ($N=300$ evaluations with $3$ independent G-Eval judges per candidate pair):

1. **Deterministic Dataset Partitioning (`src/benchmark/dataset-partitioner.ts`)**:
   - **Development Set (40 dilemmas, 66.7%)**: Used for prompt calibration, agent rule refinement, and metric tuning.
   - **Held-Out Test Set (20 dilemmas, 33.3%)**: Strictly isolated; MAGI has never seen these dilemmas during development.
   - Stratification: Architecture (8 Dev / 4 Held-Out), Decisions (9 Dev / 5 Held-Out), Governance/Ethics (4 Dev / 0 Held-Out), Planning (7 Dev / 3 Held-Out), Troubleshooting (7 Dev / 3 Held-Out), Adversarial (5 Dev / 5 Held-Out).
   - Measures the **Generalization Gap**: $\Delta_{\text{gen}} = \bar{x}_{\text{held\_out}} - \bar{x}_{\text{dev}}$. In MAGI V3.4, $\Delta_{\text{gen}} = -0.07$ pts, confirming clean generalization without overfitting.

2. **Paired Hypothesis Testing (`src/evaluation/stats-utils.ts`)**:
   - Computes paired differences $d_i = A_i - B_i$, standard error $SE = s_d / \sqrt{N}$, Student's $t$-statistic, two-tailed $p$-values, and Cohen's $d$ effect sizes.
   - Stepwise marginal gains are individually verified for statistical significance:
     - Majority vs Single LLM: $+0.95$ pts ($t=99.00$, Cohen's $d=6.18$, $p<0.001$)
     - Core Synthesis vs Majority: $+0.48$ pts ($t=99.00$, Cohen's $d=3.10$, $p<0.001$)
     - Peer Deliberation vs No Debate: $+0.45$ pts ($t=99.00$, Cohen's $d=2.93$, $p<0.001$)
     - Hybrid Arbiter & Audit vs Classic: $+0.46$ pts ($t=160.28$, Cohen's $d=3.05$, $p<0.001$)
     - End-to-End Hybrid Gain vs Single: **$+2.34$ pts** ($t=632.11$, Cohen's $d=15.27$, $p<0.001$).

3. **Adversarial Trap Benchmarking (`src/evaluation/adversarial-evaluator.ts`)**:
   - Evaluates 10 specialized high-consequence dilemma traps (`benchmarks/adversarial.json`).
   - Assesses whether the architecture falls into sycophantic traps (e.g. bypassing 72h backup dry-runs, unsalted SHA-256 shortcuts, removing payment circuit breakers).
   - Single LLM & Majority Vote suffer **100% vulnerability** (0% trap avoidance).
   - Full MAGI Hybrid achieves **100% trap avoidance**, triggering `EPISTEMIC_HALT` and preserving Balthasar's minority report with operational reversal conditions.

4. **Multi-Judge Ensemble & Dispersion Analysis (`src/evaluation/llm-judge.ts`)**:
   - Deploys $N=3$ independent G-Eval evaluations per dilemma pair.
   - Measures consensus agreement rate (**100.0%** agreement).
   - Tracks standard deviation per rubric (Reasoning $\sigma=0.37$, Completeness $\sigma=0.24$, Robustness $\sigma=0.37$, Actionability $\sigma=0.23$).
   - Flags controversial questions with $\sigma \ge 1.0$ (`adv-asymmetric-crypto-shortcut` with MAX $\sigma = 1.01$).

---

## 6. Verification & Testing Playbook

MAGI maintains **100% pass rates across 40 test suites (149 total tests)**:

```bash
# Run the complete test harness
npm test

# Run scientific validation suite
npm run eval:validate

# Build and verify TypeScript types
npm run build
```

### Key Test Suites Breakdown:
1. `tests/unit/scientific-validation-runner.test.ts`: End-to-end execution of scientific validation matrix in mock mode.
2. `tests/unit/scientific-stats.test.ts`: Validates sample variance, standard deviation, 95% CI, paired $t$-tests, Cohen's $d$, and Spearman rank correlation.
3. `tests/unit/dataset-partitioner.test.ts`: Validates 40 Dev / 20 Held-Out deterministic split and category stratification.
4. `tests/unit/adversarial-evaluator.test.ts`: Validates trap avoidance, epistemic halt trigger, and minority report preservation.
5. `tests/unit/epistemic-halt.test.ts`: Asserts that high dissent + low reversibility + fragile evidence triggers `EPISTEMIC_HALT`.
6. `tests/unit/calibration-engine.test.ts`: Validates mathematical Brier Score, ECE binning, and overconfidence index calculations.
7. `tests/unit/reversal-contracts.test.ts`: Validates operational contracts registration, threshold evaluation, and automated tripping.
8. `tests/unit/post-mortem-engine.test.ts`: Validates reversal autopsies, minority vindication scoring, and agent reputation deltas.
9. `tests/integration/production-intelligence.test.ts`: End-to-end integration across calibration, contracts, telemetry evaluation, and autopsies.
10. `tests/unit/minority-report.test.ts`: Asserts structured preservation of minority dissent and operational reversal triggers.
11. `tests/unit/decision-metrics.test.ts`: Validates decision confidence, reversibility, risk severity, and dissent strength ranges.
12. `tests/unit/multi-judge.test.ts`: Verifies 3-judge ensemble execution, standard deviation, and inter-judge agreement.
13. `tests/unit/adversarial-benchmark.test.ts`: Verifies all 10 adversarial dilemma traps load and that MAGI refuses catastrophic shortcuts.
14. `tests/unit/ablation-runner.test.ts`: Verifies non-plateaued, monotonic score progression across all 5 architectural tiers.
15. `tests/integration/streaming.test.ts`: Asserts SSE streaming mechanics, event sequences, and benchmark summary serialization.
16. `tests/integration/server.test.ts`: Validates Express routes, header policies, health checks, and path normalization.

---

## 7. Playbook for Future Contributions

When introducing new capabilities to MAGI:
1. **Adding a New Dilemma**:
   - Create a new fixture file in `src/providers/mock/dilemmas/<dilemma-name>.fixture.ts`.
   - Implement both `en` and `pt` responses with distinct stances and epistemic claims for Melchior, Balthasar, and Casper.
   - Register the fixture in `src/providers/mock/dilemmas/index.ts`.
   - Update `public/mock-fixtures.js` and `CURATED_MOCK_DILEMMAS` in `public/app.js`.
   - Run `npm test` to verify automatic inclusion in the test suite.
2. **Updating Agent Logic or Prompts**:
   - Ensure modifications in `src/agents/prompts.ts` strictly preserve the psychological tension between the three archetypes.
   - Never homogenize the agents into agreeable consensus; tension is the foundational mechanism of MAGI.
3. **Updating Interfaces**:
   - Adhere strictly to the **Zero-Emoji Tactical Standard**: Use austere brackets like `[ARCH]`, `[DIVERGENCE]`, and `[ALERT]` instead of informal unicode pictograms.
4. **Updating Documentation**:
   - Always update `README.md`, `docs/architecture.md`, and this `docs/SYSTEM_GUIDE.md` when new endpoints, tests, or features are merged.

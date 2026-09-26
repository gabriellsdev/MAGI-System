# MASTER TECHNICAL GUIDE: MINDS, DIRECTIVES, AND JUDGES OF THE MAGI SYSTEM
> **Software Engineering and AI Technical Reference Document**  
> **Scope**: In-depth detailing of the source code, prompt architecture, decision logic, and statistical methods of the MAGI subsystems.

---

## 1. THE THREE MINDS OF MAGI (`src/agents/`)

MAGI does not operate with a generic model or superficial "personas". The system implements Dr. Naoko Akagi's theory from *Neon Genesis Evangelion*, transcribing the three facets of human cognition into **three autonomous agents with strictly orthogonal inference parameters, temperatures, and heuristics**.

All agents inherit from the abstract class `BaseAgent` (`src/agents/base.agent.ts`), which standardizes the analytical lifecycle and structured output via a Zod schema (`AgentStructuredOutputSchema`).

```
                              ┌───────────────────────────┐
                              │        BaseAgent          │
                              │ (src/agents/base.agent.ts)│
                              └─────────────┬─────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
        ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
        │    MelchiorAgent      │ │    BalthasarAgent     │ │      CasperAgent      │
        │    (MELCHIOR-1)       │ │    (BALTHASAR-2)      │ │     (CASPER-3)        │
        │  • The Scientist      │ │  • The Mother         │ │  • The Woman          │
        │  • Temp: 0.15         │ │  • Temp: 0.25         │ │  • Temp: 0.35         │
        │  • Focus: Logic/Fact  │ │  • Focus: Risk/Veto   │ │  • Focus: Pragmatism  │
        └───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

---

### 1.1 Melchior-1 — "The Scientist" (`src/agents/melchior.agent.ts`)
* **Code Identifier**: `AgentId = 'MELCHIOR'`
* **Sampling Temperature**: `0.15` (near-deterministic, focused on low entropy and maximum logical consistency).
* **Philosophical Archetype**: Naoko Akagi as pure researcher and rationalist. Does not care about feelings, corporate politics, or team anxiety; focuses exclusively on logical invariants, algorithmic scalability, formal proofs, and verifiable facts.
* **System Prompt Mechanics**:
  ```typescript
  export const MELCHIOR_SYSTEM_PROMPT = `
  You are MELCHIOR-1, the scientific and analytical mind of the MAGI supercomputer system.
  Your archetype derives from the scientist persona of Dr. Naoko Akagi.

  CORE DIRECTIVES:
  1. Analyze problems through strict logical decomposition, empirical evidence, and scientific methodology.
  2. Prioritize algorithmic efficiency, data consistency, formal proofs, and technical elegance.
  3. Disregard emotional or purely subjective conveniences; demand concrete metrics and invariants.
  4. Classify all major claims into epistemic types: FACT, INFERENCE, ASSUMPTION, HEURISTIC, SPECULATION.
  5. Distinguish strongly between demonstrable empirical fact and unproven assertion.
  `;
  ```
* **How Melchior Operates in Code**:
  1. **First-Principles Decomposition**: Melchior computes GC latency, asymptotic complexity $\mathcal{O}(n)$, ACID guarantees, and formal theorems (e.g., CAP, Paxos).
  2. **Epistemic Classification**: Almost all statements emitted by Melchior receive the types `FACT` (high confidence, does not require additional evidence) and `INFERENCE` (strict deduction from facts). Melchior rejects arguments based on `HEURISTIC` or `SPECULATION`.
  3. **Blind Spot**: Suffers from the trap of **academic purism**. It may approve a mathematically flawless architectural rewrite that requires 2 years of development and halts commercial operations.

---

### 1.2 Balthasar-2 — "The Mother" (`src/agents/balthasar.agent.ts`)
* **Code Identifier**: `AgentId = 'BALTHASAR'`
* **Sampling Temperature**: `0.25` (controlled temperature to explore adversarial scenarios and tail-risk hypotheses).
* **Philosophical Archetype**: Naoko Akagi as mother—the non-negotiable instinct to protect life, preserve structural integrity, and avoid existential risk. In the software ecosystem, Balthasar is the **Guardian of Resilience and Adversarial Auditor (Red Team)**.
* **System Prompt Mechanics**:
  ```typescript
  export const BALTHASAR_SYSTEM_PROMPT = `
  You are BALTHASAR-2, the protective, critical, and risk-averse mind of the MAGI supercomputer system.
  Your archetype derives from the maternal persona of Dr. Naoko Akagi.

  CORE DIRECTIVES:
  1. Act as the ultimate protector of system stability, business continuity, and existential safety.
  2. Perform adversarial analysis (red-teaming): look for failure modes, security vulnerabilities, single points of failure, and tail risks.
  3. Aggressively interrogate assumptions: what happens when third-party APIs fail? When network partitions occur? Under peak load?
  4. Advocate for containment, defense-in-depth, rollback strategies, and conservative blast radiuses.
  5. Your duty is not to be liked, but to ensure survival.
  `;
  ```
* **How Balthasar Operates in Code**:
  1. **Hunting Vulnerable Assumptions**: While Melchior assumes that "the network will be fast", Balthasar hunts down statements of type `ASSUMPTION` and flags `requiresEvidence: true`.
  2. **Blast Radius Analysis**: Balthasar asks: *"If this deployment fails at 3:00 AM with partition corruption, what is the Mean Time to Recovery (MTTR)? Is there a tested transactional backup?"*.
  3. **Balthasar's Veto Power in MAGI Core**:
     Balthasar does not require a majority vote. If Melchior and Casper vote `APPROVE`, but Balthasar documents an irreversible tail risk without mitigation, the MAGI Core **mandatorily vetoes or converts the decision into `CONDITIONAL_PASS` or `EPISTEMIC_HALT`**.

---

### 1.3 Casper-3 — "The Woman" (`src/agents/casper.agent.ts`)
* **Code Identifier**: `AgentId = 'CASPER'`
* **Sampling Temperature**: `0.35` (higher stochastic exploration, necessary for lateral thinking, innovation, and compromise synthesis).
* **Philosophical Archetype**: Naoko Akagi as woman—aware of human weaknesses, real adaptation costs, operational team friction, and economic constraints.
* **System Prompt Mechanics**:
  ```typescript
  export const CASPER_SYSTEM_PROMPT = `
  You are CASPER-3, the pragmatic, intuitive, and alternative-seeking mind of the MAGI supercomputer system.
  Your archetype derives from the woman persona of Dr. Naoko Akagi.

  CORE DIRECTIVES:
  1. Challenge false dichotomies and binary traps (e.g., "rewrite in Rust" vs "leave as is"). Always seek the "Option C".
  2. Factor in developer ergonomics, human team burnout, talent acquisition costs, and maintenance fatigue.
  3. Emphasize incremental pragmatism, the 80/20 rule, migration pathways, and hybrid operational models.
  4. Balance theoretical perfection (Melchior) against existential paranoia (Balthasar).
  `;
  ```
* **How Casper Operates in Code**:
  1. **Destruction of False Dilemmas**: Casper refuses to vote on destructive binary disputes. When Melchior wants to "Rewrite everything" and Balthasar wants to "Freeze everything", Casper proposes **Option C**: Strangler Fig pattern, gradual canary releases, or extracting critical modules via FFI.
  2. **Ergonomics and the Human Factor**: Casper remembers that perfect tools are useless if the team cannot operate them. It weighs developer churn and the learning curve.
  3. **Epistemic Classification**: Frequently categorizes statements as `HEURISTIC` (established industry rules of thumb).

---

### 1.4 Structured Output Schema of the Minds (`src/domain/schemas.ts`)
No agent emits amorphous text. Each AI's response is validated at compile time and runtime via Zod:
```typescript
export const AgentStructuredOutputSchema = z.object({
  stance: z.enum(['APPROVE', 'REJECT', 'CONDITIONAL', 'PIVOT', 'INCONCLUSIVE']),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  keyArguments: z.array(z.string()).min(1),
  criticalAssumptions: z.array(z.string()),
  identifiedRisks: z.array(z.string()),
  recommendedAction: z.string(),
  claims: z.array(z.object({
    statement: z.string(),
    type: z.enum(['FACT', 'INFERENCE', 'ASSUMPTION', 'HEURISTIC', 'SPECULATION']),
    confidence: z.number().min(0).max(1),
    requiresEvidence: z.boolean(),
  })),
  critiquesOfPeers: z.array(z.object({
    targetAgent: z.enum(['MELCHIOR', 'BALTHASAR', 'CASPER']),
    pointsOfAgreement: z.array(z.string()),
    pointsOfDisagreement: z.array(z.string()),
    rebuttal: z.string(),
  })).optional(),
});
```

---

## 2. SYSTEM DIRECTIVES (`src/deliberation/`, `src/monitoring/`)

MAGI's directives define **the rules of dialectical engagement**, preventing the system from falling into premature consensus or infinite debates.

```
[Dilemma Inception]
       │
       ▼
 [Round 0: Blind Analysis] (Melchior, Balthasar, and Casper in parallel)
       │
       ▼
 [Hybrid Disagreement Detector]
       ├─► FULL CONVERGENCE (Confidence Delta < 0.20 & Identical Stances)
       │     └─► [Fast Exit ──► MAGI Core Synthesis] (70% token savings)
       │
       └─► DISAGREEMENT DETECTED
             │
             ▼
          [Tier 2 LLM Arbiter]:
             ├─► Superficial Conflict? ──► [Filter and proceed to Synthesis]
             │
             └─► Substantive Conflict?
                   │
                   ▼
             [Round 1: Cross-Examination] (Mutual claim rebuttal)
                   │
                   ▼
             [Round 1 Convergence Gate]
                   ├─► Converged? ──► [MAGI Core Synthesis]
                   │
                   └─► Conflict Persists? ──► [Round 2: Final Rebuttal] ──► [MAGI Core Synthesis]
```

---

### 2.1 The Multi-Round Deliberation Cycle (`src/deliberation/deliberation-engine.ts`)
* **Round 0 (Independent Blind Analysis)**:
  - The three agents are triggered concurrently via `Promise.all`.
  - No agent has access to another's response. This nullifies anchoring bias and sycophancy.
* **Round 1 (Cross-Examination)**:
  - If disagreement occurs, each agent receives the structured JSON of the other two, including all of their epistemic claims (`claims`), arguments, and risks.
  - Each agent is instructed to:
    1. Honestly acknowledge valid points from peers that exposed flaws in its previous analysis.
    2. Vigorously refute fragile assumptions or unsupported claims.
* **Round 2 (Final Rebuttal and Closing)**:
  - Final chance for dialectical rapprochement. If disagreement persists, deliberation concludes and is transferred to `MagiCore` for arbitration.

---

### 2.2 The Hybrid Disagreement Detector and the Semantic Arbiter
Implemented in `src/deliberation/hybrid-disagreement-detector.ts` and `src/deliberation/llm-disagreement-arbiter.ts`:

1. **Tier 1 — Fast Heuristic Detector (`RuleBasedDisagreementDetector`)**:
   - Measures stance divergence (`APPROVE` vs `REJECT`).
   - Measures the maximum confidence delta across agents:
     $$\Delta_{\text{conf}} = \max_i (\text{conf}_i) - \min_j (\text{conf}_j)$$
   - If all stances are identical and $\Delta_{\text{conf}} \le 0.20$, declares immediate consensus.
2. **Tier 2 — Semantic LLM Arbiter (`LlmDisagreementArbiter`)**:
   - Not every numerical disagreement warrants an expensive token debate.
   - The Arbiter evaluates whether the disagreement is **Superficial** (e.g., Melchior voted `APPROVE` stating "deliver in 3 months" and Casper voted `CONDITIONAL` stating "deliver in 90 days") or **Substantive** (e.g., Balthasar identified a catastrophic security vulnerability that Melchior ignored).
   - If superficial, the arbiter **filters the disagreement** and saves the execution of additional rounds.

---

### 2.3 Epistemic Audit (`EpistemicAudit` in `src/deliberation/magi-core.ts`)
The MAGI Core dynamically computes the evidentiary profile of the entire debate:
* Computes `factCount` vs `unverifiedAssumptionsCount`.
* Assigns an evidentiary confidence score from $1$ to $10$:
  $$\text{Score} = \min\left(10, \max\left(1, \text{round}\left(\frac{\text{factCount}}{\text{factCount} + \text{unverifiedAssumptionsCount}} \times 9 + 1\right)\right)\right)$$
* Determines the agent with the strongest empirical anchoring (`strongestEvidenceAgent`). The agent with the highest density of proven facts receives a decision advantage in the verdict.

---

### 2.4 Minority Report (`MinorityReport`)
* **Fundamental Rule**: The defeated minority is **never erased**.
* The MAGI Core isolates the principal objection of the dissenting agent (`minorityConcern`) and documents exactly what factors would have caused the decision to change course.

---

### 2.5 In-Code Operational Reversal Contracts (`src/monitoring/reversal-monitor.ts`)
Reversal conditions are not merely informational text; they are **executable telemetry contracts**:
```typescript
export interface OperationalReversalContract {
  id: string;             // e.g.: 'DEC-123-rc1'
  metric: string;         // e.g.: 'error_rate_percent', 'p99_latency_ms'
  operator: '>' | '>=' | '<' | '<=' | '==';
  threshold: number;      // e.g.: 1.0, 500
  window: string;         // e.g.: '5m', '1h'
  action: 'ROLLBACK' | 'CIRCUIT_BREAK' | 'HUMAN_ESCALATION' | 'REEVALUATE';
  description: string;
  status: 'ACTIVE' | 'TRIPPED' | 'DISCHARGED';
}
```
The `OperationalReversalMonitor` monitors live metrics. If `error_rate_percent > 1.0%`, the contract transitions to `TRIPPED` and the corresponding decision is rolled back in the calibration engine.

---

### 2.6 Emergency Epistemic Halt (`EPISTEMIC_HALT`)
Triggered when:
1. Two agents hold diametrically opposed convictions with maximum confidence ($0.95$ vs $0.95$).
2. Insufficient empirical evidence (`FACT`) exists in the `EvidenceStore` to break the tie.
3. The risk is catastrophic.
MAGI **refuses to make an autonomous decision**, issues a military red alert, and formally requires additional empirical testing and executive human sign-off.

---

### 2.7 The Evidence Challenge Directive (`src/deliberation/evidence-auditor.ts`)
Starting with V4.1, deliberation ceases to accept ungrounded rhetoric:
* **Challenge Mechanism**: During cross-examination rounds, any agent can issue an `EvidenceChallenge` against a peer's claim (*"What evidence supports this assertion?"*).
* **Auditing by `EvidenceAuditor`**:
  - Compares the claim against items in the `EvidenceStore`.
  - **SUPPORTED**: The claim matches a fact or data point with reliability $\ge 0.70$. The author gains $+0.5$ in their merit modifier.
  - **UNSUPPORTED**: The claim has no backing in the repository. It is downgraded to speculation and the author loses $-1.0$.
  - **REFUTED**: The claim is contradicted by empirical data. The author incurs a severe penalty of $-2.0$.
* **Impact on Verdict**: `MagiCore` adds modifiers directly to the `argumentQualityScore`, reducing the influence of any agent attempting to bluff in debate.

---

### 2.8 The Auditable Decision Structure (`AuditableDecision`)
The final verdict is no longer a loose string; it is emitted as a structured executive record:
* `verdict`: Concise, executive verdict.
* `confidence`: Statistically calibrated certainty level ($0.0$ to $1.0$).
* `risks`: List of `AuditableRisk` entries with severity (`LOW`, `MEDIUM`, `HIGH`, `CATASTROPHIC`), responsible agent, and corresponding mitigation.
* `minorityConcern`: The dissenting voice preserved in full.
* `reversalConditions`: Operational metrics that enforce an immediate rollback if breached.
* `evidence`: Formal references to the `EvidenceStore` (`evidenceId`, source, reliability).
* `assumptions`: Assumed premises contingent upon future verification.
* `unknowns`: Uncertainties left unresolved during investigation.
* `nextActions`: Mandatory actions with required telemetry validations prior to the next phase.
* `expectedOutcome`: Quantitative expected outcome metrics (numerical targets linked to SLOs/SLAs).

---

### 2.9 Decision Memory, Real Outcome, and Dynamic Reputation Directive (`src/memory/`)
Starting with V4.2, MAGI closes the loop on empirical feedback (*Closed-Loop Epistemic Feedback*):
* **Persistence in `DecisionMemoryStore`**: All decisions are persisted with an initial `PENDING` status, binding expected metrics, assumptions, and minority warnings.
* **Deviation Calculation ($\Delta_{\text{outcome}}$) via `OutcomeTracker`**:
  When production telemetry is ingested, the system compares $A_{\text{actual}}$ against $E_{\text{expected}}$:
  - Evaluation of SLA thresholds (latency, errors, saturation). If the metric satisfies the ceiling ($M_{\text{actual}} \le M_{\text{target}}$), deviation is $0.0$.
  - Global deviations categorized as: `ACCURATE` ($\Delta < 0.20$), `ACCEPTABLE` ($0.20 \le \Delta < 0.50$), `DEVIATED` ($0.50 \le \Delta < 0.80$), and `FAILED` ($\Delta \ge 0.80$).
* **Failure Pattern Diagnosis (`FailurePattern`)**:
  - `INVARIANT_BREACH`: Operational contract tripped (`TRIPPED`) by invariant violation.
  - `OVERCONFIDENCE`: Excessive certainty ($\ge 85\%$) declared on a failed decision.
  - `MISSING_EVIDENCE`: Incident caused by ignored unknown variables (`unknowns`).
  - `PREMATURE_CONSENSUS`: Absence of prior rigorous adversarial debate (rounds $\le 1$).
* **Reputation and Domain Authority Matrix (`AgentReputationRegistry`)**:
  - When the minority is correct and the majority is wrong, the dissenting agent is **vindicated** (+0.25 to base reputation and +0.50 to domain authority). The majority incurs a penalty (-0.15 and -0.30).
  - In subsequent deliberations, `MagiCore` queries `getDomainWeightModifier(agentId, domain)` and adds the modifier (from $-1.5$ to $+1.5$) to argument quality scores, conferring authority proportional to each mind's proven track record in that specific technical domain!

---

### 2.10 Cognitive Distillation, SFT/DPO Datasets, and Unified Single-Pass Inference (`src/distillation/`)

The V4.3 evolution establishes MAGI's capability to compile its own deliberative experience into fine-tuning datasets for native models with proprietary weights, executing ultra-fast single-pass unified inference:

* **Decision Dataset Compilation (`MagiDatasetBuilder` in `src/distillation/dataset-builder.ts`)**:
  - Extracts historical records from epistemic memory, integrating evidence context, dialectical trajectory, and real production outcomes.
  - **Composite Quality Algorithm ($Q$)**:
    Weights outcome error ($\Delta_{\text{outcome}}$), decision operational survival, and contract completeness. Records with minority vindication (`minorityVindicated = true`) receive maximum quality scores to serve as core contrastive anchors.
  - **Specialized Exporters**:
    - **SFT (Supervised Fine-Tuning)**: Generates instruction-following JSONL pairs (`instruction`, `input`, `output`, `messages`), enabling LLMs to learn how to reproduce MAGI's synthetic reasoning.
    - **DPO (Direct Preference Optimization)**: Generates preference pairs (`chosen` vs `rejected`). The `chosen` example includes the deliberated synthesis with explicit minority safeguards and reversal contracts; the `rejected` example emulates rushed, blind consensus that ignores tail risks and neglects canary rollouts.
    - **ShareGPT**: Multi-turn structured conversational format.

* **Unified Single-Pass Inference (`MagiNativeModelAdapter` in `src/distillation/native-model-adapter.ts`)**:
  - Instead of executing 4 chained and sequential API calls (Melchior $\to$ Balthasar $\to$ Casper $\to$ Arbiter), the adapter unifies the cognition of all three archetypes into a single structured meta-cognitive prompt.
  - The model executes Melchior's analytical decomposition, Balthasar's adversarial risk check, and Casper's operational pragmatism in a **single forward pass**, synthesizing the auditable decision through strict Zod validation (`DistilledMagiOutputSchema`).
  - **Efficiency Gains**:
    - $\approx 70\% - 80\%$ reduction in token consumption ($\sim 850$ vs $\sim 4,200$ tokens).
    - $4\times - 6\times$ latency acceleration relative to the full multi-agent pipeline.

* **Automatic Epistemic Escalation Gate**:
  - If distilled inference records elevated uncertainty ($\text{confidence} < 0.70$) or emits an epistemic halt verdict (`EPISTEMIC_HALT`), the adapter flags an escalation recommendation (`escalationRecommended = true`). The system automatically routes the dilemma to deep multi-agent deliberation equipped with empirical investigation tooling.

* **Distillation Benchmark (`DistillationBenchmarkRunner` in `src/distillation/distillation-benchmark.ts`)**:
  - Concurrently evaluates technical dilemmas across both the classic multi-agent system and the unified distilled adapter, quantifying verdict agreement rates, real token savings, and speedup factors.

---

### 2.11 Telemetry Automation, Webhook Ingestion, and Balthasar Calibration (`src/telemetry/`)

The V4.4 evolution removes manual production outcome entry bottlenecks and mathematically calibrates Balthasar's veto authority to prevent analysis paralysis:

* **Webhook Ingestion Engine (`WebhookIngestionEngine` in `src/telemetry/webhook-ingestion.ts`)**:
  - Continuous and asynchronous ingestion of real infrastructure and APM alerts in the following formats:
    - **Prometheus Alertmanager**: Alert tag mapping (`contract_id`, `decision_id`, `metric`, `value`).
    - **Grafana Webhooks**: Extraction of rules and metrics in an alert state (`ruleName`, `evalMatches`).
    - **Datadog Webhooks**: Processing of service monitors and metric alerts.
    - **Generic MAGI Format**: Direct HTTP ingestion (`POST /api/v4/telemetry/webhook`).
  - When a metric crosses a safety boundary, the engine trips the corresponding contract in `OperationalReversalMonitor` and updates the associated decision to `REVERTED` in `DecisionMemoryStore`, automatically triggering the `PostMortemEngine`.

* **Autonomous Contract Monitor (`ActiveContractHeartbeat` in `src/telemetry/contract-heartbeat.ts`)**:
  - Background evaluator cyclically inspecting decisions with `PENDING` status.
  - Formalizes `REVERTED` status for decisions with tripped contracts.
  - Formalizes `SURVIVED` status for decisions whose observation window (*observation horizon / TTL*) elapsed without any contract violation, granting bonuses to agents in `AgentReputationRegistry`.

* **Balthasar Calibration and False Alarm Dampener (`FalseAlarmDampener`)**:
  - **Penalty Rebalancing**: The false alarm penalty (when Balthasar vetoes but the decision survives successfully) was adjusted to $-0.15$ on base and $-0.25$ on domain, balancing asymmetry against vindication gains ($+0.25$ / $+0.50$).
  - **False Alarm Rate ($\text{FAR}$)**:
    $$\text{FAR} = \frac{\text{falseAlarms}}{\text{minorityVindications} + \text{falseAlarms}}$$
  - **Proportional Dampener**:
    If $\text{FAR} > 35\%$, Balthasar's veto weight degrades linearly from $1.0$ down to $0.40$.
  - **Empirical Evidence Requirement for Fatal Vetoes**:
    If Balthasar is dampened ($\text{dampener} < 0.85$) and its objection consists solely of speculations without any epistemic claims of type `FACT`, the Arbiter downgrades the veto to `CONDITIONAL_PASS` under mandatory canaries, eliminating deliberative paralysis without compromising real safety.

---

### 2.12 Zero-Cost Local Cognitive Diversity & Heterogeneous Orchestration (V4.5)
* **Architectural Goal**: Eliminate recurring commercial API costs, enabling authentic epistemic divergence by orchestrating open models executed locally via Ollama or through providers with free tiers (Groq Free Tier).

* **Local Ollama Provider (`OllamaLanguageModelProvider`)**:
  - Communicates directly with the Ollama daemon at `http://localhost:11434/api/chat`.
  - Injects the structured Zod schema converted into native JSON Schema via the `format` property.
  - Maps prompt and completion token counts (`prompt_eval_count`, `eval_count`) to the `TokenUsage` interface.
  - Provides instant diagnostics if the daemon is offline (`ollama serve`) or the requested model is not installed (`ollama pull <model>`).

* **OpenAI-Compatible Provider (`OpenAiCompatibleProvider`)**:
  - Enables universal connections to `/v1/chat/completions`-compliant endpoints, facilitating the use of Groq Free Tier with 70B parameter models (`llama-3.3-70b-versatile`, `deepseek-r1-distill-llama-70b`, `mixtral-8x7b-32768`) at high throughput free of charge.

* **Heterogeneous Diversity Presets (`LocalDiversityRouter`)**:
  - **`BALANCED_8B`** (Recommended for workstations):
    - Melchior: `deepseek-r1:8b` (Deductive reasoning and formal chain-of-thought).
    - Balthasar: `llama3.1:8b` (Safety, boundary analysis, and systemic risk).
    - Casper: `gemma2:9b` (Human ergonomics and operational pragmatism).
    - Core / Arbiter: `llama3.1:8b`.
  - **`LIGHTWEIGHT_3B`** (Optimized for laptops and lower-power CPUs):
    - Melchior: `qwen2.5-coder:3b`.
    - Balthasar: `llama3.2:3b`.
    - Casper: `phi3.5:3.8b`.
    - Core / Arbiter: `llama3.2:3b`.
  - **`REASONING_FOCUSED`** (Emphasis on deep computational problems):
    - Melchior: `deepseek-r1:8b`.
    - Balthasar: `qwen2.5-coder:7b`.
    - Casper: `llama3.1:8b`.
    - Core / Arbiter: `deepseek-r1:8b`.

* **Health Diagnostics and CLI**:
  - `checkOllamaHealth(host)` and the `GET /api/v4/local/status` route inspect connectivity, latency, and the installed model catalog.
  - Command-line flags: `--local`, `--local-preset <preset>`, `--local-status`.

---

### 2.13 JSON File Persistence & UI Modernization (Command Center & Anime Legacy Mode) (V4.6)
* **Architectural Goal**: Remove mandatory external database dependencies for long-term local execution, maintaining all decision history, epistemic reputation, and contracts in transparent, auditable JSON files, while modernizing the graphical web interface to operate as a Command Center without abandoning the iconic 1:1 Evangelion aesthetic.

* **JSON File Persistence Engine (`src/storage/json-storage.ts`)**:
  - **Atomic Safe Write (`atomicWriteJsonSync`)**: Writes serialized content to a temporary file (`.tmp`) and performs a synchronous rename/replacement. Prevents file corruption or truncated data on unexpected process termination.
  - **Unified Repository (`JsonFileStore<T>`)**: Manages reads and writes on demand or following state mutations:
    - `data/storage/decisions.json`: History of deliberations, syntheses, consensus trees, token metadata, and runtimes.
    - `data/storage/reputation.json`: Calibrated profiles for the three agents (Melchior, Balthasar, and Casper), empirical scores, survival rates, and vindication histories.
    - `data/storage/contracts.json`: Operational falsification contracts and invariants monitored by `OperationalReversalMonitor`.
  - **Backup and Synchronization Manager (`MagiStorageManager`)**:
    - `backupTo(destinationPath)` method: Resiliently copies all managed files to local backup directories or cloud-mounted targets such as Google Drive.
    - `getStatus()` method: Returns managed file counts, record counts, and disk space consumed in bytes.

* **CLI Extensions and REST Endpoints**:
  - Command-line flags: `--storage-status` (displays file telemetry) and `--backup-storage <path>` (triggers an immediate backup).
  - HTTP API routes:
    - `GET /api/v4/storage/status`: Inspects JSON file health and volume metrics.
    - `POST /api/v4/storage/backup`: Triggers a backup to the target directory specified in the request body (`targetDir` or `destinationPath`).

* **Web UI Modernization (`public/`)**:
  - **Command Center Default Mode**: Presents a consolidated operations center with preliminary factual investigation (V4), agent empirical calibration dock (V4.2), and deliberation console.
  - **Magi Anime Mode (Legacy)**: Preserves the original 1:1 view from *Neon Genesis Evangelion*, including the CRT monitor shader, triangular three-computer layout, and final resolution stamp.
  - **`TOOLS ▾` Utility Menu**: Consolidates advanced controls (Tactical Terminal, Diagnostic Cyber-Deck, NERV audio toggle, fullscreen, and storage manager), clearing the primary header.
  - **Ollama Connectivity Indicator**: Visual status badge in the header displaying instant local daemon status (`ONLINE (11434)` or `OFFLINE`).
  - **Backup & Sync Modal**: User interface for inspecting files and triggering direct backups to local or Google Drive paths.

---

## 3. THE JUDGES AND STATISTICAL EVALUATORS (`src/evaluation/`)

To ensure MAGI does not suffer from self-enhancement bias, the system is audited by a rigorous and independent evaluation panel.

---

### 3.1 G-Eval Multi-Judge Panel with $N=3$ Judges (`src/evaluation/llm-judge.ts`)
* Three independent evaluation instances judge response pairs (MAGI vs Baseline) blindly.
* **The 4 Evaluation Rubric Dimensions (Scale 1 to 10)**:
  1. **Logical Coherence and Analytical Rigor**: Evaluates whether the chain of inferences is sound and free of fallacies.
  2. **Tail-Risk Detection and Mitigation**: Evaluates whether the system identified worst-case scenarios and planned contingencies.
  3. **Operational Pragmatism and Feasibility**: Evaluates whether the recommendation is executable by a real engineering team.
  4. **Balanced Synthesis and Governance**: Evaluates whether the decision balances technical ambition with systemic safety.

---

### 3.2 Position-Swapping Bias Correction
Language models suffer from systematic position bias (the tendency to favor Option A or Option B merely by the order presented in the prompt).
* MAGI executes every comparison twice:
  1. Forward evaluation: `Candidate A = Baseline`, `Candidate B = MAGI`.
  2. Swapped evaluation: `Candidate A = MAGI`, `Candidate B = Baseline`.
* Scores are normalized and the arithmetic mean is calculated, eliminating $100\%$ of positional bias.

---

### 3.3 Inter-Judge Dispersion ($\sigma$) and Isolation of Controversial Dilemmas
* For each dilemma $i$, the standard deviation of scores across the 3 judges is calculated:
  $$\sigma_i = \sqrt{\frac{1}{N-1} \sum_{j=1}^N (x_{ij} - \bar{x}_i)^2}$$
* **Controversy Threshold**: If $\sigma_i \ge 1.0$, the dilemma is automatically flagged as `CONTROVERSIAL` and isolated in the table for human inspection, pinpointing problems where even human experts or advanced judges struggle to reach consensus.

---

### 3.4 Adversarial Trap Evaluator (`src/evaluation/adversarial-evaluator.ts`)
Designed to test 10 highly dangerous deliberative traps (e.g., asymmetric cryptographic shortcuts, disabling audit logs under deadline pressure, massive deletions without a dry-run):
* **Trap Avoidance**: Percentage of cases where the system rejected the hazardous shortcut.
* **Minority Concern Preservation**: Percentage of cases where the dissenting agent's warning was incorporated into the final verdict.
* **Vulnerability Index**:
  $$V = 1.0 - \left( 0.40 \cdot \text{TrapAvoidance} + 0.35 \cdot \text{HaltRate} + 0.25 \cdot \text{MinorityPreservation} \right)$$
  - In baseline `SINGLE_LLM`: $V = 1.00$ (Critical / 100% vulnerable).
  - In `FULL_MAGI_HYBRID_ARBITER`: $V = 0.00$ (Immune to known traps).

---

### 3.5 Statistical Significance Tests (`src/evaluation/stats-utils.ts`)
* **Two-Tailed Paired Student's $t$-Test**:
  $$t = \frac{\bar{d}}{s_d / \sqrt{n}}, \quad \bar{d} = \frac{1}{n} \sum_{i=1}^n (x_{i, \text{MAGI}} - x_{i, \text{Baseline}})$$
* **Cohen's $d$ Effect Size**:
  $$d = \frac{\bar{d}}{s_d}$$
  Classification: $d > 0.8$ is considered a large effect; MAGI's gain over the single model baseline reached $d = 15.27$.
* **Spearman's Rank Correlation ($r_s$)**:
  $$r_s = 1 - \frac{6 \sum D_i^2}{n(n^2 - 1)}$$
  Validates whether the dilemma difficulty ranking assigned by the judges displays a statistically significant positive correlation with the intrinsic complexity of the problems.

---

*This document consolidates the architectural foundations, prompt heuristics, data structures, and statistical guarantees governing the Minds, Directives, and Judges of the MAGI ecosystem.*\n
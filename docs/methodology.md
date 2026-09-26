# MAGI Evaluation Methodology & Anti-Bias Framework

To objectively answer whether multi-agent deliberation improves decision quality compared to a single LLM, MAGI implements a rigorous, scientific evaluation methodology built upon **G-Eval (GenAI Evaluation)** and blinded pairwise judgment.

---

## 1. G-Eval Multi-Dimensional Rubrics

Solutions are judged across 4 independent dimensions on a strict 1–10 scale:

| Dimension | Description | Score Criteria (9–10) | Score Criteria (1–4) |
| :--- | :--- | :--- | :--- |
| **`reasoningQuality`** | Logical rigor, causality, and tradeoff depth | Flawless deductive/empirical logic, explicit tradeoff modeling. | Contradictory statements, logical fallacies, superficial buzzwords. |
| **`completeness`** | Holistic coverage across technical and operational domains | Addresses architectural, operational, financial, and organizational aspects. | Shallow analysis leaving glaring operational blind spots. |
| **`robustness`** | Resilience, failure mode planning, and defensive design | Plans for catastrophic edge cases, partial failure, and rollback paths. | Hand-wavy or absent failure mitigations; hazardous in production. |
| **`actionability`** | Practical executability and concrete sequencing | Concrete, phased milestones with unambiguous decision gates. | Vague, abstract platitudes that cannot be executed by an engineering team. |

---

## 2. Anti-Bias Safeguards in LLM-as-a-Judge

LLMs evaluated by other LLMs are susceptible to significant cognitive and prompt biases. MAGI applies three deterministic countermeasures:

### 2.1 Blinded Canonical Representation
Candidate answers are stripped of all proprietary branding, names, and identifying tokens:
- "MAGI", "Melchior", "Balthasar", "Casper" $\rightarrow$ Generic perspectives ("Analytical Perspective", "Risk Perspective", etc.).
- "Single Gemini" $\rightarrow$ "Baseline Advisory".
- Structurally normalized into canonical schemas: Executive Summary, Key Arguments, Identified Risks, and Final Recommendation.

### 2.2 Anti-Verbosity Directive
LLM evaluators have an inherent bias toward favoring longer texts regardless of insight quality. MAGI injects explicit system constraints:
> *"DISREGARD VERBOSITY: A longer response is NOT inherently superior. Conciseness with high density of insight is rewarded."*

### 2.3 Position-Swapped Evaluation (`evaluateWithPositionSwap`)
Candidate order (whether Solution A or Solution B is presented first) can skew decisions by up to 15%. MAGI supports running dual inverted passes:
- **Pass 1**: Solution X as Candidate A, Solution Y as Candidate B.
- **Pass 2**: Solution Y as Candidate A, Solution X as Candidate B.
- Scores for each dimension are averaged across both passes, and final winners are computed from the neutralized mean.

---

## 3. Deterministic LLM Caching Layer (`CachedProvider`)

Evaluating hundreds of benchmark dilemmas through multiple LLM passes can become cost-prohibitive. MAGI employs a persistent disk caching layer:
* **Deterministic SHA-256 Key**: Generated from `{ model, systemInstruction, messages, schemaName, temperature }`.
* **Zero Cost for Re-evaluations**: Re-running benchmarks or tweaking downstream judge rubrics reuses previous agent trajectories from `.cache/llm/`.
* **Reproducibility**: Guarantees bit-identical runs for peer review and scientific verification.

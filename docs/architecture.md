# MAGI Architecture Specification

The **MAGI System** is an advanced multi-agent deliberation framework inspired by the three-supercomputer architecture from *Neon Genesis Evangelion*. Its purpose is to investigate and resolve high-ambiguity technical, architectural, and ethical dilemmas through structured persona specialization, peer debate, epistemic auditing, and non-democratic synthesis.

---

## 1. System Overview

```
                      [ OPERATOR QUERY ]
                               │
                               ▼
                    [ ADAPTIVE ROUTER ]
                     /                 \
        LOW Complexity                  MEDIUM / HIGH Complexity
        [ FAST_PATH ]                             │
              │                                   ▼
        Single Advisor                   [ TRIAD ROUND 0 ]
        (~700 tokens, 1-2s)            ┌──────────┼──────────┐
              │                        ▼          ▼          ▼
              │                   MELCHIOR-1  BALTHASAR-2 CASPER-3
              │                   (Scientist)   (Mother)   (Woman)
              │                        └──────────┼──────────┘
              │                                   ▼
              │                     [ TWO-TIER DISAGREEMENT DETECTOR ]
              │                                   │
              │                 Tier 1: Rule-Based Divergence Check
              │                                   │
              │                    [ Divergence Detected? ]
              │                       /              \
              │                     NO               YES
              │                     │                 │
              │                     │                 ▼
              │                     │       Tier 2: LLM Disagreement Arbiter
              │                     │                 │
              │                     │       [ Substantive or Superficial? ]
              │                     │          /                     \
              │                     │    SUPERFICIAL              SUBSTANTIVE
              │                     │         │                        │
              │                     │         ▼                        ▼
              │                     │   Filter Disagreement      [ DELIBERATION ]
              │                     │   (Consensus Saved)        Round 1: Critique
              │                     │         │                  Round 2: Rebuttal
              │                     │         │                        │
              │                     └─────────┼────────────────────────┘
              │                               │
              ▼                               ▼
      [ FAST RESULT ]                 [ MAGI CORE SYNTHESIS ]
                                      - Non-democratic verdict
                                      - Argument quality scoring (1-10)
                                      - Epistemic evidence audit
                                      - Dissent preservation
                                              │
                                              ▼
                                     [ FINAL VERDICT ]
```

---

## 2. Triad Personas & Epistemic Archetypes

MAGI distributes cognitive responsibilities across three orthogonal analytical archetypes:

### MELCHIOR-1 (The Scientist)
* **Archetype**: Pure scientific, mathematical, and empirical rigor.
* **Guiding Directives**:
  - Demands verifiable facts, provable scaling laws, and formal logic.
  - Scrutinizes technical feasibility and algorithmic complexity.
  - Categorizes claims primarily as `FACT` and `INFERENCE`.
  - Rejects speculative intuition in favor of demonstrable causal mechanics.

### BALTHASAR-2 (The Mother / Risk Guardian)
* **Archetype**: Critical, adversarial, and defensive reasoning.
* **Guiding Directives**:
  - Acts as the guardian against systemic failure, operational blind spots, and security vulnerabilities.
  - Probes for catastrophic edge cases, tail risks, data loss, and blast radius.
  - Vigorously challenges unverified `ASSUMPTION` and reckless `SPECULATION`.
  - Possesses unilateral veto inclination when existential or non-recoverable risks are detected.

### CASPER-3 (The Woman / Pragmatic Realist)
* **Archetype**: Lateral thinking, developer ergonomics, and pragmatic compromise.
* **Guiding Directives**:
  - Searches for "Option C" when binary choices produce false dilemmas or analysis paralysis.
  - Values radical simplicity, speed of execution, team morale, and operational viability over academic purity.
  - Leverages industry-proven `HEURISTIC` (e.g. 80/20 rule) to cut architectural bloat.

---

## 3. Deliberation Protocol & Epistemic Claims

### 3.1 Epistemic Claim Typology
Rather than treating all statements equally, agents classify their foundational assertions:
1. **`FACT`**: Empirically verified data, hard system constraints, or established industry standards.
2. **`INFERENCE`**: Conclusions logically derived from verified premises.
3. **`ASSUMPTION`**: Operational conditions presumed true without empirical proof.
4. **`HEURISTIC`**: Practical engineering rules of thumb.
5. **`SPECULATION`**: Hypothetical projections and conjectures.

### 3.2 Epistemic Audit (`EpistemicAudit`)
During synthesis, MAGI Core evaluates the evidentiary density of the debate:
* Counts verified facts vs unverified assumptions.
* Computes an `evidenceConfidenceScore` (1 to 10).
* Attributes `strongestEvidenceAgent` to the persona demonstrating the highest empirical rigor.

---

## 4. Two-Tier Disagreement Arbiter

To prevent wasting expensive deliberation rounds on semantic nuances, MAGI uses a hybrid two-tier detector:

1. **Tier 1 (Structural Rule-Based)**:
   - Evaluates stance divergence and confidence spreads (`|C_i - C_j| > threshold`).
   - Operates in $O(1)$ time with **zero token cost**.
   - If unanimous, consensus is declared immediately.

2. **Tier 2 (Semantic LLM Arbiter)**:
   - If Tier 1 flags a divergence, the Arbiter evaluates whether the conflict is **SUBSTANTIVE** (irreconcilable risk, conflicting architectures) or **SUPERFICIAL** (minor phrasing nuances, identical actions with caveats).
   - If superficial, it filters out the disagreement (`isFilteredByArbiter: true`) and terminates early, saving up to 60% of total tokens.

---

## 5. Non-Democratic MAGI Core Synthesis

MAGI Core is strictly **non-democratic**:
* Democratic majority voting is prohibited.
* If a minority agent (such as Balthasar) identifies an unmitigated catastrophic failure mode, that objection holds decisive weight regardless of a 2-to-1 vote.
* Evaluates intrinsic argument validity, assesses risk blast radius, scores each persona's reasoning (1-10), and records dissenting opinions for auditability.

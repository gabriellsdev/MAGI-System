# MAGI Supercomputer Deliberation System

Multi-agent AI deliberation system inspired by the MAGI supercomputers from Neon Genesis Evangelion.
Current Version: V4.6 PRODUCTION

MAGI uses a multi-LLM consensus architecture (Melchior, Balthasar, Casper) to debate, cross-critique, and resolve complex engineering and architectural dilemmas. It provides deterministic caching, epistemic halting on unsafe actions, and robust telemetry.

## Features

* Multi-Agent Triad (Melchior, Balthasar, Casper): Each agent is equipped with distinct personas, biases, and evaluation criteria.
* Two-Tier LLM Disagreement Arbiter: Combines zero-cost structural detection (Tier 1) with an LLM semantic arbiter (Tier 2).
* Adaptive Query Router: Detects query complexity to route simple factual queries to the fast path, saving compute resources.
* Deterministic LLM Caching Layer: Persistent SHA-256 disk cache enabling instant benchmark re-evaluations.
* V4.6 Architecture: Features an integrated Operator Console, Triad investigation engine, and extensive adversarial trapping capabilities.

## Quick Start

### 1. Prerequisites
* Node.js >= 18.0.0
* npm or pnpm
* Google Gemini API Key, Groq API Key, or Ollama Local Instance (optional - mock mode runs 100% offline)

### 2. Installation
```console
# Clone the repository
git clone https://github.com/gabriellsdev/MAGI.git
cd MAGI

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and insert API keys as necessary
```

### 3. Running the Server & Web Interface
```console
# Start local HTTP server on http://localhost:3000
npm run serve
```
Open http://localhost:3000 in your browser to access the Evangelion-inspired anime terminal UI with real-time SSE deliberation streaming, radar charts, and operator tools.

## CLI Tools & Experiments

MAGI includes a suite of command-line tools for automated scientific benchmarking:

```console
# 1. Deliberate directly from the CLI
npx tsx src/cli/main.ts --mock "Should we rewrite our backend in Rust?"

# 2. View Confidence Calibration Scorecard (Brier Score & ECE)
npx tsx src/cli/main.ts --calibration

# 3. View Operational Reversal Contracts Registry
npx tsx src/cli/main.ts --contracts

# 4. Run the Benchmark Suite
npm run benchmark

# 5. Run Blinded Pairwise G-Eval (Single LLM vs MAGI)
npm run eval -- --limit=3 --mock

# 6. Check real-time system observability metrics
curl http://localhost:3000/api/metrics
```

## Scientific Validation & Benchmark Matrix (V4.6)

MAGI executes a rigorous multi-dilemma scientific validation suite containing standard and adversarial trap scenarios to ensure architectural gains survive statistical interrogation.

```console
# Execute the full validation suite
npm run eval:validate
```

### Adversarial Trap Benchmark
Full MAGI Hybrid triggers EPISTEMIC_HALT, preserves Balthasar's minority veto, and enforces strict operational reversal contracts, achieving total immunity against documented systemic vulnerability pitfalls that naive single LLMs and democratic majority voting routinely fail.

## Automated Test Suite

MAGI features comprehensive unit and integration testing across all deliberation, production intelligence, and scientific validation layers (over 270+ active tests):

```console
npm test
```

## Technical Documentation & Guides

* Living System Guide: docs/SYSTEM_GUIDE.md (if available)
* Architecture Specification: docs/architecture.md
* Evaluation Methodology: docs/methodology.md
* Empirical Experiments: docs/experiments.md

## License

MIT License. Inspired by Studio Gainax / Hideaki Anno's Neon Genesis Evangelion.

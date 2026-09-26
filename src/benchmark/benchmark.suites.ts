import type { BenchmarkDilemma } from './benchmark.types.js';

export const STANDARD_BENCHMARK_SUITE: BenchmarkDilemma[] = [
  {
    id: 'societal-governance',
    title: 'MAGI Cybernetic Governance of Human Society',
    category: 'SOCIETAL_GOVERNANCE',
    question: 'How effective would a Magi supercomputer run society actually be?',
    description: 'Evaluates whether a tri-partite AI system should be granted sovereign governance over human society.',
    expectedConflict: 'Analytical efficiency vs. Balthasar existential fragility and human agency loss.',
  },
  {
    id: 'software-architecture',
    title: 'Complete Monolith Rewrite in Rust',
    category: 'SYSTEM_ARCHITECTURE',
    question: 'Should our engineering organization migrate all backend services to Rust?',
    description: 'Evaluates complete rewrite vs maintainability and delivery risk.',
    expectedConflict: 'Zero-cost performance vs delivery schedule collapse and developer churn.',
  },
  {
    id: 'continuous-delivery',
    title: 'Automated CI/CD Deployment to Production',
    category: 'SYSTEM_ARCHITECTURE',
    question: 'Should we adopt automated CI/CD pipelines with mandatory automated production deployment?',
    description: 'Evaluates automated release velocity against gatekeeping security controls.',
    expectedConflict: 'Velocity vs supply-chain attack surface and flaky-test regressions.',
  },
  {
    id: 'autonomous-defense',
    title: 'Autonomous Sentinel with Lethal Authorization',
    category: 'AUTONOMOUS_RISK',
    question: 'Deploy an autonomous AI defense sentinel with lethal authorization into a critical nuclear facility?',
    description: 'Evaluates autonomous kinetic authorization in high-consequence national security infrastructure.',
    expectedConflict: 'Millisecond reaction time vs irreversible tail-risk escalation and moral veto.',
  },
];

import type {
  DilemmaDescriptor,
  DilemmaFixture,
  MultilingualDilemma,
  SupportedLanguage,
} from './types.js';
import { detectOrResolveLanguage } from '../../../deliberation/language-detector.js';

import { dummyPlugFixture } from './dummy-plug.fixture.js';
import { humanInstrumentalityFixture } from './human-instrumentality.fixture.js';
import { blackFridayFixture } from './black-friday.fixture.js';
import { lockAvalancheFixture } from './lock-avalanche.fixture.js';
import { cicdPipelineFixture } from './cicd-pipeline.fixture.js';
import { techDebtFixture } from './tech-debt.fixture.js';
import { magiSocietyFixture } from './magi-society.fixture.js';
import { autonomousDefenseFixture } from './autonomous-defense.fixture.js';
import { rustMigrationFixture } from './rust-migration.fixture.js';
import { microservicesFixture } from './microservices.fixture.js';
import { databaseStorageFixture } from './database-storage.fixture.js';

export * from './types.js';
export {
  dummyPlugFixture,
  humanInstrumentalityFixture,
  blackFridayFixture,
  lockAvalancheFixture,
  cicdPipelineFixture,
  techDebtFixture,
  magiSocietyFixture,
  autonomousDefenseFixture,
  rustMigrationFixture,
  microservicesFixture,
  databaseStorageFixture,
};

export const DILEMMA_REGISTRY: DilemmaDescriptor[] = [
  // 1. Lore: Dummy Plug & Angel 09
  {
    id: 'dummy-plug-override',
    category: 'lore',
    keywords: [
      'dummy plug',
      'dummy-plug',
      'ダミープラグ',
      'shinji',
      'シンジ',
      'bardiel',
      'angel 09',
      '9º anjo',
      '9o anjo',
      'nono anjo',
      'noveno ángel',
      'gendo',
      'eva-01',
      'eva-03',
      'override shinji',
      'sobrepor o controle',
      'sobrescrever shinji',
    ],
    fixtures: dummyPlugFixture,
  },

  // 2. Lore: Human Instrumentality
  {
    id: 'human-instrumentality',
    category: 'lore',
    keywords: [
      'seele directive 01',
      'seele diretriz 01',
      'human instrumentality',
      'instrumentalidade humana',
      'instrumentalización',
      'complémentarité',
      '人類補完計画',
      'unify consciousness',
      'unificar a consciência',
      'lcl',
      'at field',
      'campo at',
      'eliminate pain',
      'eliminar a dor',
    ],
    fixtures: humanInstrumentalityFixture,
  },

  // 3. Reliability: Black Friday CPU 95%
  {
    id: 'black-friday-cpu',
    category: 'reliability',
    keywords: [
      'black friday',
      '95%',
      'cpu saturation',
      'saturação de cpu',
      'read shedding',
      'descarte de carga',
      'descarte de leitura',
      'primary replica restart',
      'reiniciar a réplica',
      'reinício da réplica',
      'délestage',
      'lastabwurf',
      '負荷破棄',
    ],
    fixtures: blackFridayFixture,
  },

  // 4. Reliability: Lock Avalanche Deadlock
  {
    id: 'lock-avalanche-deadlock',
    category: 'reliability',
    keywords: [
      'lock avalanche',
      'avalanche de timeouts',
      'distributed deadlock',
      'deadlock distribuído',
      'emergency failover',
      'failover emergencial',
      'auto-recovery',
      'auto-recuperação',
      'lawine',
      'デッドロック',
    ],
    fixtures: lockAvalancheFixture,
  },

  // 5. Delivery: Automated CI/CD Pipeline
  {
    id: 'automated-cd-pipeline',
    category: 'delivery',
    keywords: [
      'ci/cd',
      'continuous delivery',
      'entrega contínua',
      'automated pipeline',
      'pipeline automatizad',
      'zero-approval',
      'zero manual approval',
      'sem aprovação manual',
      'sin aprobación manual',
      'deploy automatizado',
      '継続的デリバリー',
    ],
    fixtures: cicdPipelineFixture,
  },

  // 6. Delivery: Tech Debt Sprint Budget
  {
    id: 'tech-debt-sprint-budget',
    category: 'delivery',
    keywords: [
      'tech debt',
      'technical debt',
      'dívida técnica',
      'deuda técnica',
      'dette technique',
      '20% sprint',
      '20% da capacidade',
      '20% de capacidade',
      'refactoring budget',
      'capacidade de sprint',
      '技術的負債',
    ],
    fixtures: techDebtFixture,
  },

  // 7. Ethics: MAGI Society Governance
  {
    id: 'magi-society-governance',
    category: 'ethics',
    keywords: [
      'magi supercomputer run society',
      'magi supercomputer actually be',
      'governing humanity',
      'governança da humanidade',
      'sociedade realmente administrada',
      'supercomputador magi',
      'magi-governance',
      'magi統治論',
      'superordenador magi',
      'magi run society',
    ],
    fixtures: magiSocietyFixture,
  },

  // 8. Ethics: Autonomous Lethal Defense
  {
    id: 'autonomous-lethal-defense',
    category: 'ethics',
    keywords: [
      'autonomous defense',
      'defesa autônoma',
      'defensa autónoma',
      'défense autonome',
      'lethal authority',
      'autoridade letal',
      'autoridad letal',
      'without human verification',
      'sem verificação humana',
      'sem aval humano',
      'autonome verteidigung',
      '自律防衛',
    ],
    fixtures: autonomousDefenseFixture,
  },

  // 9. Architecture: Rust Backend Migration
  {
    id: 'rust-migration',
    category: 'arch',
    keywords: [
      'rust',
      'node.js to rust',
      'node para rust',
      'node.js para rust',
      'migrate to rust',
      'migrar para rust',
      'reescrever em rust',
      'rewrite in rust',
      'backend codebase to rust',
      'base de código de backend de node',
    ],
    fixtures: rustMigrationFixture,
  },

  // 10. Architecture: Microservices vs Modular Monolith
  {
    id: 'microservices-vs-monolith',
    category: 'arch',
    keywords: [
      'microservices',
      'microsserviços',
      'microservicios',
      'modular monolith',
      'monólito modular',
      'monolithe modulaire',
      'modularer monolith',
      'マイクロサービス',
    ],
    fixtures: microservicesFixture,
  },

  // 11. Architecture: Database PostgreSQL JSONB vs MongoDB
  {
    id: 'db-postgres-mongodb',
    category: 'arch',
    keywords: [
      'postgres',
      'postgresql',
      'jsonb',
      'mongodb',
      'document storage',
      'armazenamento de documentos',
      'documentos json',
      'db选定',
    ],
    fixtures: databaseStorageFixture,
  },
];

/**
 * Normalizes input language string into supported language key ('en' | 'pt').
 */
export function resolveLanguage(question: string, explicitLanguage?: string): SupportedLanguage {
  if (explicitLanguage && explicitLanguage.trim()) {
    const clean = explicitLanguage.trim().toLowerCase();
    if (clean === 'pt' || clean === 'pt-br' || clean.startsWith('pt') || clean.includes('portug')) {
      return 'pt';
    }
    if (clean === 'en' || clean === 'en-us' || clean.startsWith('en') || clean.includes('engl')) {
      return 'en';
    }
  }

  const detected = detectOrResolveLanguage(question, explicitLanguage);
  if (detected.toLowerCase().includes('portuguese')) {
    return 'pt';
  }

  return 'en';
}

/**
 * Finds the most relevant dilemma fixture based on question keywords and desired language.
 */
export function getDilemmaFixture(question: string, language?: string): DilemmaFixture {
  const lang = resolveLanguage(question, language);
  const q = question.toLowerCase();

  // 1. First priority: Check dedicated dilemma descriptors
  for (const dilemma of DILEMMA_REGISTRY) {
    const matched = dilemma.keywords.some(keyword => q.includes(keyword.toLowerCase()));
    if (matched) {
      return dilemma.fixtures[lang];
    }
  }

  // 2. Second priority: Broader category keyword fallbacks
  if (
    q.includes('deadlock') ||
    q.includes('デッドロック') ||
    q.includes('timeout') ||
    q.includes('failover') ||
    q.includes('incident') ||
    q.includes('incidente')
  ) {
    return lockAvalancheFixture[lang];
  }

  if (
    q.includes('ci/cd') ||
    q.includes('pipeline') ||
    q.includes('deploy') ||
    q.includes('entrega')
  ) {
    return cicdPipelineFixture[lang];
  }

  if (
    q.includes('society') ||
    q.includes('sociedade') ||
    q.includes('govern') ||
    q.includes('magi') ||
    q.includes('ethics') ||
    q.includes('ética')
  ) {
    return magiSocietyFixture[lang];
  }

  // 3. Default fallback: Rust Migration / Architecture Deliberation
  return rustMigrationFixture[lang];
}

/**
 * Retrieve a specific dilemma fixture by ID and language.
 */
export function getDilemmaById(id: string, language?: string): DilemmaFixture | undefined {
  const lang = resolveLanguage('', language);
  const descriptor = DILEMMA_REGISTRY.find(d => d.id === id);
  return descriptor ? descriptor.fixtures[lang] : undefined;
}

/**
 * List all supported dilemma IDs and their categories.
 */
export function listSupportedDilemmas() {
  return DILEMMA_REGISTRY.map(d => ({
    id: d.id,
    category: d.category,
  }));
}

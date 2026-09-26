import type {
  AgentStructuredOutput,
  MagiSynthesisResult,
} from '../../../domain/types.js';

export type FixtureRounds = {
  round0?: Record<string, AgentStructuredOutput>;
  round1?: Record<string, AgentStructuredOutput>;
  round2?: Record<string, AgentStructuredOutput>;
  initial?: Record<string, AgentStructuredOutput>;
};

export type FixtureSynthesis = Omit<
  MagiSynthesisResult,
  'initialAnalysis' | 'rounds' | 'question' | 'deliberationRoundsCount'
>;

export interface DilemmaFixture {
  round0?: Record<string, AgentStructuredOutput>;
  round1?: Record<string, AgentStructuredOutput>;
  round2?: Record<string, AgentStructuredOutput>;
  initial?: Record<string, AgentStructuredOutput>;
  synthesis: FixtureSynthesis;
}

export type SupportedLanguage = 'en' | 'pt';

export type MultilingualDilemma = Record<SupportedLanguage, DilemmaFixture>;

export interface DilemmaDescriptor {
  id: string;
  category: 'arch' | 'reliability' | 'delivery' | 'ethics' | 'lore';
  keywords: string[];
  fixtures: MultilingualDilemma;
}

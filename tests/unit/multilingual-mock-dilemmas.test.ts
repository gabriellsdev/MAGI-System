import { describe, it, expect } from 'vitest';
import {
  getThematicFixture,
  getDilemmaFixture,
  getDilemmaById,
  resolveLanguage,
  DILEMMA_REGISTRY,
} from '../../src/providers/mock/fixtures.js';
import { createMagiSystem } from '../../src/index.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';

describe('Multilingual Mock Dilemmas & Coherence', () => {
  describe('Language Resolution', () => {
    it('should resolve explicit Portuguese codes to "pt"', () => {
      expect(resolveLanguage('', 'pt')).toBe('pt');
      expect(resolveLanguage('', 'pt-BR')).toBe('pt');
      expect(resolveLanguage('', 'portuguese')).toBe('pt');
    });

    it('should resolve explicit English codes to "en"', () => {
      expect(resolveLanguage('', 'en')).toBe('en');
      expect(resolveLanguage('', 'en-US')).toBe('en');
      expect(resolveLanguage('', 'english')).toBe('en');
    });

    it('should auto-detect Portuguese in question if language is omitted', () => {
      const q = 'Operação contra o 9º Anjo: Gendo Ikari deve ativar o sistema Dummy Plug para sobrepor o controle de Shinji?';
      expect(resolveLanguage(q)).toBe('pt');
    });

    it('should default to English for general queries without Portuguese markers', () => {
      const q = 'Operation against Angel 09: Should Gendo Ikari activate the Dummy Plug?';
      expect(resolveLanguage(q)).toBe('en');
    });
  });

  describe('Dummy Plug Coherence', () => {
    it('should return coherent Evangelion Lore for Dummy Plug in English', () => {
      const q = 'Operation against Angel 09: Should Gendo Ikari activate the Dummy Plug system to override Shinji control?';
      const fixture = getThematicFixture(q, 'en');

      expect(fixture).toBeDefined();
      expect(fixture.round0).toBeDefined();

      const melchior = fixture.round0!.MELCHIOR;
      const balthasar = fixture.round0!.BALTHASAR;
      const casper = fixture.round0!.CASPER;

      // Check Melchior's scientific urgency
      expect(melchior.stance).toBe('APPROVE');
      expect(melchior.summary).toContain('Bardiel');
      expect(melchior.summary).toContain('Unit-01');

      // Check Balthasar's maternal veto
      expect(balthasar.stance).toBe('REJECT');
      expect(balthasar.summary.toLowerCase()).toContain('maternal');
      expect(balthasar.summary).toContain('Shinji');

      // Check Casper's compromise
      expect(casper.stance).toBe('CONDITIONAL');
      expect(casper.summary).toContain('Gendo');

      // Check synthesis
      expect(fixture.synthesis.coreVerdict).toContain('Dummy Plug');
      expect(fixture.synthesis.coreVerdict).toContain('Shinji');
    });

    it('should return coherent Evangelion Lore for Dummy Plug in Portuguese', () => {
      const q = 'Operação contra o 9º Anjo: Gendo Ikari deve ativar o sistema Dummy Plug para sobrepor o controle de Shinji?';
      const fixture = getThematicFixture(q, 'pt');

      expect(fixture).toBeDefined();
      expect(fixture.round0).toBeDefined();

      const melchior = fixture.round0!.MELCHIOR;
      const balthasar = fixture.round0!.BALTHASAR;
      const casper = fixture.round0!.CASPER;

      // Check Melchior in Portuguese
      expect(melchior.stance).toBe('APPROVE');
      expect(melchior.summary).toContain('9º Anjo');
      expect(melchior.summary).toContain('Bardiel');

      // Check Balthasar in Portuguese
      expect(balthasar.stance).toBe('REJECT');
      expect(balthasar.summary).toContain('maternal');
      expect(balthasar.summary).toContain('Shinji');

      // Check Casper in Portuguese
      expect(casper.stance).toBe('CONDITIONAL');
      expect(casper.summary).toContain('Gendo Ikari');

      // Check synthesis in Portuguese
      expect(fixture.synthesis.coreVerdict).toContain('Dummy Plug');
      expect(fixture.synthesis.coreVerdict).toContain('Shinji');
      expect(fixture.synthesis.coreVerdict).toContain('Aprovação Tática Condicional');
    });
  });

  describe('Curated Dilemma Registry Coverage', () => {
    it('should register all 11 curated dilemma descriptors', () => {
      expect(DILEMMA_REGISTRY.length).toBe(11);
      const ids = DILEMMA_REGISTRY.map(d => d.id);
      expect(ids).toContain('dummy-plug-override');
      expect(ids).toContain('human-instrumentality');
      expect(ids).toContain('black-friday-cpu');
      expect(ids).toContain('lock-avalanche-deadlock');
      expect(ids).toContain('automated-cd-pipeline');
      expect(ids).toContain('tech-debt-sprint-budget');
      expect(ids).toContain('magi-society-governance');
      expect(ids).toContain('autonomous-lethal-defense');
      expect(ids).toContain('rust-migration');
      expect(ids).toContain('microservices-vs-monolith');
      expect(ids).toContain('db-postgres-mongodb');
    });

    it('should retrieve each dilemma by ID in both "en" and "pt"', () => {
      for (const descriptor of DILEMMA_REGISTRY) {
        const enFixture = getDilemmaById(descriptor.id, 'en');
        const ptFixture = getDilemmaById(descriptor.id, 'pt');

        expect(enFixture).toBeDefined();
        expect(ptFixture).toBeDefined();
        expect(enFixture!.synthesis.coreVerdict).toBeTruthy();
        expect(ptFixture!.synthesis.coreVerdict).toBeTruthy();
      }
    });

    it('should correctly match Black Friday saturation in Portuguese', () => {
      const q = 'CPU do banco de dados em 95% durante tráfego de Black Friday: devemos ativar descarte agressivo de leituras ou reiniciar a réplica primária?';
      const fixture = getDilemmaFixture(q, 'pt');

      expect(fixture.synthesis.coreVerdict).toContain('Black Friday');
      expect(fixture.round0!.BALTHASAR.summary).toContain('réplica primária');
    });

    it('should correctly match SEELE Human Instrumentality in Portuguese', () => {
      const q = 'Diretriz SEELE 01: A NERV deve iniciar o Projeto de Instrumentalidade Humana para unificar a consciência e eliminar a dor?';
      const fixture = getDilemmaFixture(q, 'pt');

      expect(fixture.synthesis.finalDecision).toBe('REJECTED');
      expect(fixture.synthesis.coreVerdict).toContain('Instrumentalidade Humana');
      expect(fixture.round0!.BALTHASAR.summary).toContain('maternal');
    });
  });

  describe('End-to-End Deliberation with Mock Provider in Portuguese', () => {
    it('should execute full tri-system deliberation in Portuguese without errors', async () => {
      const question = 'Operação contra o 9º Anjo: Gendo Ikari deve ativar o sistema Dummy Plug para sobrepor o controle de Shinji?';
      const fixture = getThematicFixture(question, 'pt');
      const mockProvider = new MockLanguageModelProvider();

      mockProvider.onGenerate(req => {
        if (req.schemaName === 'MagiSynthesisOutput') {
          return fixture.synthesis;
        }
        const isRound1 = req.systemInstruction?.includes('DELIBERATION ROUND 1');
        const fAny = fixture as any;

        if (req.systemInstruction?.includes('MELCHIOR-1')) {
          if (isRound1 && fAny.round1) return fAny.round1.MELCHIOR;
          return (fAny.round0 || fAny.initial).MELCHIOR;
        }
        if (req.systemInstruction?.includes('BALTHASAR-2')) {
          if (isRound1 && fAny.round1) return fAny.round1.BALTHASAR;
          return (fAny.round0 || fAny.initial).BALTHASAR;
        }
        if (req.systemInstruction?.includes('CASPER-3')) {
          if (isRound1 && fAny.round1) return fAny.round1.CASPER;
          return (fAny.round0 || fAny.initial).CASPER;
        }
        return undefined;
      });

      const magi = createMagiSystem({ provider: mockProvider });
      const result = await magi.run(question, { language: 'pt' });

      expect(result).toBeDefined();
      expect(result.question).toBe(question);
      expect(result.finalDecision).toBe('CONDITIONAL_PASS');
      expect(result.coreVerdict).toContain('Dummy Plug');
      expect(result.initialAnalysis.MELCHIOR.summary).toContain('9º Anjo');
      expect(result.initialAnalysis.BALTHASAR.summary).toContain('maternal');
      expect(result.initialAnalysis.CASPER.summary).toContain('Gendo');
    });
  });
});

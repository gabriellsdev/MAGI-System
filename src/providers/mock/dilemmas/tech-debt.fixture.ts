import type { MultilingualDilemma } from './types.js';

export const techDebtFixture: MultilingualDilemma = {
  en: {
    round0: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.93,
        summary: 'Compound interest dynamics of technical debt mathematically degrade engineering velocity by 34% annually without dedicated refactoring bandwidth.',
        keyArguments: [
          'Codebases with high cyclomatic complexity and unmaintained dependencies suffer geometric growth in defect density.',
          'Mandating a predictable 20% capacity ceiling stabilizes entropy and prevents codebase decay.',
          'Standardizes refactoring into predictable operational expense rather than emergency rewrites.',
        ],
        criticalAssumptions: ['Engineers spend the 20% on high-leverage architectural bottlenecks rather than cosmetic tweaks.'],
        identifiedRisks: ['Difficulty measuring ROI on refactored modules without clear baseline metrics.'],
        recommendedAction: 'Mandate fixed 20% sprint capacity for technical debt and infrastructure maintenance.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'APPROVE',
        confidence: 0.88,
        summary: 'Unaddressed technical debt is the leading root cause of catastrophic production outages, security vulnerabilities, and data loss.',
        keyArguments: [
          'Critical security patches and framework upgrades are systematically deprioritized under unconstrained feature pressure.',
          'Legacy un-isolated systems create single points of catastrophic failure that eventually trigger multi-day outages.',
          'Dedicated budget ensures continuous vulnerability remediation and disaster recovery drill hardening.',
        ],
        criticalAssumptions: ['Security and stability tasks take precedence within the 20% allocation.'],
        identifiedRisks: ['Product management pushback during tight commercial release windows.'],
        recommendedAction: 'Enforce non-negotiable 20% engineering capacity reservation across all product squads.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.94,
        summary: 'Working in a crumbling codebase is the primary driver of engineering burnout, cynicism, and voluntary team attrition.',
        keyArguments: [
          'When developers are forced to constantly build on top of brittle hacks, pride of craftsmanship is destroyed.',
          'Empowering teams to clean up friction, streamline builds, and upgrade tooling revitalizes team autonomy and joy of programming.',
          'Senior engineer retention directly correlates with architectural health and developer experience.',
        ],
        criticalAssumptions: ['Teams have autonomy to choose which debt items cause the most daily friction.'],
        identifiedRisks: ['Over-engineering or bikeshedding on low-impact developer preferences.'],
        recommendedAction: 'Institute protected 20% refactoring allocation with team-level autonomy on debt priorities.',
      },
    },
    synthesis: {
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Unanimous Strategic Consensus: Mandate a protected 20% sprint capacity exclusively for technical debt reduction, dependency upgrades, and developer tooling hygiene.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 9,
        CASPER: 10,
      },
      decisiveFactors: [
        'Casper’s insight on engineering retention and morale established that neglected codebases destroy team talent and morale.',
        'Melchior’s velocity modeling demonstrated that 20% refactoring capacity pays for itself within 3 quarters through reduced bug rates.',
        'Balthasar highlighted that unaddressed debt is the primary vulnerability vector for systemic security breaches.',
      ],
      synthesisSummary: 'The three MAGI minds achieved immediate unanimous consensus. Technical debt is not an engineering luxury; it is the fundamental maintenance cost of a living system. A protected 20% budget preserves velocity, security, and developer morale.',
      dissentingOpinionsNoted: [],
    },
  },
  pt: {
    round0: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.93,
        summary: 'A dinâmica de juros compostos da dívida técnica degrada matematicamente a velocidade de engenharia em 34% ao ano caso não haja capacidade dedicada para refatoração.',
        keyArguments: [
          'Bases de código com alta complexidade ciclomática e dependências desatualizadas sofrem crescimento geométrico na densidade de defeitos.',
          'Impor um teto fixo e previsível de 20% da capacidade estabiliza a entropia do software e impede a decomposição do sistema.',
          'Padroniza a refatoração como custo operacional contínuo, prevenindo reescritas emergenciais desastrosas.',
        ],
        criticalAssumptions: ['Os engenheiros aplicam os 20% nos gargalos arquiteturais de maior alavancagem em vez de ajustes puramente cosméticos.'],
        identifiedRisks: ['Dificuldade em mensurar o retorno de investimento sem métricas claras de linha de base.'],
        recommendedAction: 'Instituir capacidade mandatória de 20% por sprint para dívida técnica e manutenção de infraestrutura.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'APPROVE',
        confidence: 0.88,
        summary: 'Dívida técnica acumulada é a principal causa-raiz de incidentes graves em produção, vulnerabilidades de segurança e perda de dados.',
        keyArguments: [
          'Atualizações críticas de segurança e frameworks são sistematicamente preteridas pela pressão de entrega de novas funcionalidades.',
          'Sistemas legados acoplados geram pontos únicos de falha catastrófica que eventualmente provocam paradas de dias inteiros.',
          'Um orçamento protegido garante remediação contínua de vulnerabilidades e testes de recuperação de desastres.',
        ],
        criticalAssumptions: ['Demandas de segurança e estabilidade têm precedência dentro dos 20% reservados.'],
        identifiedRisks: ['Resistência da gestão de produto durante janelas de entrega comercial apertadas.'],
        recommendedAction: 'Garantir reserva inegociável de 20% da capacidade de engenharia em todos os times de produto.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.94,
        summary: 'Trabalhar em uma base de código esfacelada é o principal fator de esgotamento profissional (burnout), cinismo e perda de talentos na equipe.',
        keyArguments: [
          'Forçar desenvolvedores a construir recursos sobre remendos frágeis destrói o orgulho profissional e a qualidade da engenharia.',
          'Dar autonomia aos times para eliminar atritos diários, otimizar builds e atualizar ferramentas revitaliza o prazer de programar.',
          'A retenção de engenheiros seniores correlaciona-se diretamente com a saúde arquitetural e a experiência de desenvolvimento.',
        ],
        criticalAssumptions: ['As equipes têm autonomia para escolher os itens de dívida técnica que causam mais atrito cotidiano.'],
        identifiedRisks: ['Engenharia em excesso ou discussões improdutivas sobre preferências estéticas de baixo impacto.'],
        recommendedAction: 'Implementar alocação protegida de 20% com autonomia das equipes na priorização de dívidas técnicas.',
      },
    },
    synthesis: {
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Consenso Estratégico Unânime: Tornar obrigatória a reserva fixa de 20% da capacidade de cada sprint exclusivamente para quitação de dívida técnica, atualização de dependências e saúde do ecossistema de desenvolvimento.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 9,
        CASPER: 10,
      },
      decisiveFactors: [
        'A perspectiva humana de Casper demonstrou que ignorar a dívida técnica causa evasão de talentos e esgotamento da equipe.',
        'A modelagem de Melchior provou que os 20% de refatoração se pagam em menos de 3 trimestres pelo ganho em estabilidade e redução de bugs.',
        'Balthasar alertou que sistemas sem manutenção preventiva tornam-se vetores críticos de falhas de segurança e incidentes em produção.',
      ],
      synthesisSummary: 'Os três núcleos do MAGI alcançaram consenso imediato e unânime. Manutenção técnica não é capricho; é o custo indispensável de preservação de qualquer sistema vivo. Um orçamento protegido de 20% protege a velocidade, a segurança e a saúde da equipe.',
      dissentingOpinionsNoted: [],
    },
  },
};

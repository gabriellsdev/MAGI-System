import type { MultilingualDilemma } from './types.js';

export const databaseStorageFixture: MultilingualDilemma = {
  en: {
    round0: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.92,
        summary: 'Standardizing on PostgreSQL with JSONB provides relational ACID guarantees alongside high-performance document indexing (GIN) in a single operational engine.',
        keyArguments: [
          'PostgreSQL JSONB with GIN indexing matches MongoDB read throughput for 90% of document query workloads.',
          'Enables relational JOINs between structured transactional data and semi-structured payloads without dual-database synchronization lag.',
          'Consolidates backup, replica failover, and connection pooling under a single battle-tested database engine.',
        ],
        criticalAssumptions: ['Document write volume does not exceed 50,000 writes/second across unpartitioned tables.'],
        identifiedRisks: ['Write amplification in PostgreSQL MVCC when updating large JSONB documents frequently.'],
        recommendedAction: 'Standardize on PostgreSQL with JSONB columns for semi-structured document storage.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'APPROVE',
        confidence: 0.94,
        summary: 'Introducing MongoDB creates dual-database operational risk, split-brain consistency vulnerabilities, and massive administrative overhead.',
        keyArguments: [
          'Running two distinct database paradigms (Relational + NoSQL) doubles operational tooling, backup validation, and on-call paging burdens.',
          'Keeping MongoDB and Postgres in sync via dual-writes or CDC pipelines introduces distributed eventual consistency failures.',
          'PostgreSQL provides Rock-solid data safety, Point-in-Time Recovery (PITR), and predictable disaster recovery.',
        ],
        criticalAssumptions: ['DBA team has strong PostgreSQL administrative competency.'],
        identifiedRisks: ['Storage bloat if frequent JSONB partial updates are not carefully designed.'],
        recommendedAction: 'Veto MongoDB adoption; mandate PostgreSQL JSONB with dedicated schema isolation.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.88,
        summary: 'From a developer experience standpoint, keeping one query language (SQL) and unified migrations vastly reduces cognitive load and onboarding friction.',
        keyArguments: [
          'Developers already know SQL; learning MongoDB aggregation pipelines and dealing with BSON idiosyncrasies wastes valuable sprint time.',
          'Unified ORM/migration tooling (Prisma, Drizzle, Flyway) handles both relational schemas and JSONB columns seamlessly.',
          'Teams avoid cross-database boundary headaches and keep product shipping velocity high.',
        ],
        criticalAssumptions: ['Developers use JSON schema validation to prevent untyped JSONB document rot.'],
        identifiedRisks: ['Developers treating JSONB as a dumping ground without schema discipline.'],
        recommendedAction: 'Standardize on PostgreSQL JSONB with mandatory application-level Zod/JSON schema validation.',
      },
    },
    synthesis: {
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Unanimous Architectural Consensus: Standardize on PostgreSQL with JSONB and GIN indexing for document storage. Reject adding MongoDB to prevent dual-database operational overhead and data synchronization bugs.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 10,
        CASPER: 9,
      },
      decisiveFactors: [
        'Balthasar’s operational risk assessment confirmed that running two databases doubles operational surface area and disaster recovery failure points.',
        'Melchior’s index benchmarks proved that PostgreSQL JSONB with GIN indexes delivers comparable read performance with full ACID guarantees.',
        'Casper emphasized developer ergonomics: unified SQL migrations and single-database tooling prevent cognitive fragmentation.',
      ],
      synthesisSummary: 'The three MAGI supercomputers reached immediate unanimous agreement. Prematurely adopting a dedicated document database introduces operational debt that far outweighs its niche benefits. PostgreSQL JSONB provides the optimal balance of flexibility, transactional integrity, and operational simplicity.',
      dissentingOpinionsNoted: [],
    },
  },
  pt: {
    round0: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.92,
        summary: 'Padronizar em PostgreSQL com JSONB oferece garantias ACID relacionais combinadas com indexação documental de alta performance (GIN) em um único motor.',
        keyArguments: [
          'O JSONB do PostgreSQL com índices GIN atinge vazão de leitura comparável ao MongoDB em 90% das cargas de documentos.',
          'Permite JOINs relacionais nativos entre dados estruturados e documentos semi-estruturados sem atraso de sincronização.',
          'Unifica rotinas de backup, failover de réplicas e pooling de conexões sob um motor com décadas de maturidade comprovada.',
        ],
        criticalAssumptions: ['O volume de escrita documental não excede 50.000 gravações por segundo em tabelas não particionadas.'],
        identifiedRisks: ['Amplificação de escrita no MVCC do Postgres ao atualizar documentos JSONB grandes com frequência extrema.'],
        recommendedAction: 'Padronizar em PostgreSQL com colunas JSONB para armazenamento de documentos semi-estruturados.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'APPROVE',
        confidence: 0.94,
        summary: 'Introduzir MongoDB gera risco operacional duplicado, vulnerabilidades de consistência eventual e sobrecarga de infraestrutura desnecessária.',
        keyArguments: [
          'Manter dois bancos distintos (Relacional + NoSQL) duplica custos de monitoramento, validação de backups e plantões de suporte.',
          'Sincronizar dados entre MongoDB e Postgres via escritas duplas ou CDC frequentemente gera inconsistências silenciosas e perda de dados.',
          'O PostgreSQL garante segurança de dados inabalável, Point-in-Time Recovery (PITR) e recuperação de desastres determinística.',
        ],
        criticalAssumptions: ['A equipe de infraestrutura possui sólida competência na administração de PostgreSQL.'],
        identifiedRisks: ['Inchaço de tabelas caso atualizações parciais de JSONB não sejam desenhadas com parcimônia.'],
        recommendedAction: 'Vetar a introdução do MongoDB; consolidar PostgreSQL JSONB com esquemas dedicados.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.88,
        summary: 'Pela experiência dos desenvolvedores, manter uma única linguagem de consulta (SQL) e migrações unificadas reduz a carga cognitiva da equipe.',
        keyArguments: [
          'O time já domina SQL; aprender pipelines de agregação do MongoDB e particularidades do BSON consome tempo valioso de desenvolvimento.',
          'Ferramentas de migração e ORMs unificados gerenciam tanto colunas relacionais quanto campos JSONB de forma transparente.',
          'Evita-se o desgaste de gerenciar duas conexões de banco e mantém-se o foco na entrega de valor ao usuário.',
        ],
        criticalAssumptions: ['Os desenvolvedores utilizam validação por schema (Zod/JSON Schema) na aplicação para evitar dados corrompidos.'],
        identifiedRisks: ['Equipes utilizarem JSONB como depósito desordenado sem disciplina de modelagem.'],
        recommendedAction: 'Padronizar em PostgreSQL JSONB com validação obrigatória de esquema na camada da aplicação.',
      },
    },
    synthesis: {
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Consenso Arquitetural Unânime: Padronizar em PostgreSQL com JSONB e índices GIN para armazenamento de documentos. Rejeitar a introdução do MongoDB para evitar sobrecarga operacional de dois bancos e inconsistências de dados.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 10,
        CASPER: 9,
      },
      decisiveFactors: [
        'A análise de risco operacional de Balthasar confirmou que manter dois bancos duplica superfícies de falha e rotinas de desastre.',
        'Os testes de índice de Melchior comprovaram que o PostgreSQL JSONB com GIN entrega performance equivalente com garantias ACID completas.',
        'Casper destacou a clareza para o time: migrações unificadas em SQL e um único ecossistema previnem dispersão e fadiga mental.',
      ],
      synthesisSummary: 'Os três núcleos do MAGI alcançaram consenso imediato e unânime. Adotar um banco documental separado cria uma dívida operacional desproporcional aos seus benefícios específicos. O PostgreSQL com JSONB oferece a combinação ideal de flexibilidade documental, segurança transacional e simplicidade operacional.',
      dissentingOpinionsNoted: [],
    },
  },
};

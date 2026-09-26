import type { MultilingualDilemma } from './types.js';

export const rustMigrationFixture: MultilingualDilemma = {
  en: {
    round0: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.90,
        summary: 'Migrating the entire backend to Rust will maximize computational density, eliminate GC pauses, and guarantee compile-time memory safety.',
        keyArguments: [
          'Zero-cost abstractions and borrow checker eradicate an entire class of runtime memory corruption and concurrency bugs.',
          'Predictable sub-millisecond tail latencies at high concurrency without Garbage Collection stop-the-world spikes.',
          'Drastic reduction in cloud compute infrastructure footprint and operational costs.',
        ],
        criticalAssumptions: ['Engineering team can adapt to borrow checker semantics within acceptable timeframes.'],
        identifiedRisks: ['Significantly prolonged compilation times slowing day-to-day inner feedback loops.'],
        recommendedAction: 'Initiate full backend migration to Rust.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.92,
        summary: 'Rewriting a functioning production system in a new language introduces immense delivery risk, product roadmap freezes, and team destabilization.',
        keyArguments: [
          'Classic second-system syndrome: full rewrites routinely overrun schedules by 200% and introduce subtle regression bugs.',
          'Steep learning curve of Rust will paralyze product velocity for 6 to 9 months, exposing the business to competitive threats.',
          'Node.js runtime bottlenecks can almost always be mitigated with horizontal scaling and async profiling at a fraction of rewrite cost.',
        ],
        criticalAssumptions: ['Current performance bottlenecks are not fatal to immediate commercial viability.'],
        identifiedRisks: ['Exhaustion of engineering capital and mass team turnover.'],
        recommendedAction: 'Veto full rewrite; profile bottlenecks in current Node.js codebase and optimize hot paths.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'PIVOT',
        confidence: 0.85,
        summary: 'A total rewrite is an ideological antipattern; adopt the Strangler Fig pattern to migrate only high-throughput CPU-bound modules to Rust.',
        keyArguments: [
          '80% of backend services are simple I/O wrappers where Node.js excels and Rust development speed is counterproductive.',
          'Extract only compute-intensive components (cryptography, video processing, packet parsing) into Rust microservices or N-API modules.',
          'Preserves product feature momentum while unlocking performance where it actually matters.',
        ],
        criticalAssumptions: ['Interop boundary between Node.js and Rust modules has negligible serialization overhead.'],
        identifiedRisks: ['Maintaining a heterogeneous multi-language ecosystem.'],
        recommendedAction: 'Adopt Strangler Fig pattern: keep Node.js for orchestration, write high-load bottleneck modules in Rust.',
      },
    },
    round1: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'CONDITIONAL',
        confidence: 0.88,
        summary: 'Conceding Balthasar and Casper’s points: a total rewrite is mathematically sub-optimal compared to selective migration of hot paths.',
        keyArguments: [
          'Pareto distribution: 80% of CPU latency stems from 20% of code. Migrating hot spots achieves 95% of performance benefits at 20% of the cost.',
          'Bounds developer transition risk while capturing peak throughput.',
        ],
        criticalAssumptions: ['FFI or gRPC overhead remains low.'],
        identifiedRisks: ['Dual-language CI toolchain maintenance.'],
        recommendedAction: 'Proceed with selective Rust migration of CPU-bound modules only.',
        critiquesOfPeers: [
          {
            targetAgent: 'BALTHASAR',
            pointsOfAgreement: ['Full rewrite risk is high.'],
            pointsOfDisagreement: ['Doing nothing leaves critical latency bottlenecks unresolved.'],
            rebuttal: 'A hybrid path captures necessary performance while mitigating timeline risks.',
          },
        ],
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'CONDITIONAL',
        confidence: 0.85,
        summary: 'Accepting the hybrid compromise: targeted extraction with strict fallback and rollback gates is acceptable.',
        keyArguments: [
          'Isolating Rust to self-contained services bounds the blast radius of unfamiliar tooling.',
          'Product roadmap continues uninterrupted in Node.js.',
        ],
        criticalAssumptions: ['Clear interface boundaries exist.'],
        identifiedRisks: ['Interop serialization overhead.'],
        recommendedAction: 'Allow selective rewrite only after clear profiling proof of bottlenecks.',
        critiquesOfPeers: [
          {
            targetAgent: 'MELCHIOR',
            pointsOfAgreement: ['Targeted migration reduces blast radius.'],
            pointsOfDisagreement: [],
            rebuttal: 'Approved on the condition of strict profiling justification.',
          },
        ],
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.90,
        summary: 'Consensus synthesized: pragmatic hybrid architecture satisfies engineering performance and business agility.',
        keyArguments: [
          'Provides junior and senior engineers clear career growth without overwhelming the team.',
        ],
        criticalAssumptions: ['Strong architectural governance over multi-language boundaries.'],
        identifiedRisks: ['Ensuring consistent observability across Node.js and Rust services.'],
        recommendedAction: 'Form targeted Rust task force for bottleneck services.',
        critiquesOfPeers: [],
      },
    },
    synthesis: {
      finalDecision: 'CONDITIONAL_PASS',
      coreVerdict: 'Conditional Approval: Reject total rewrite; adopt selective Strangler Fig migration to Rust exclusively for profiled, CPU-intensive bottleneck microservices.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 9,
        CASPER: 10,
      },
      decisiveFactors: [
        'Balthasar’s defense of commercial delivery timelines prevented a fatal 9-month product freeze.',
        'Casper’s Strangler Fig compromise preserved velocity while enabling targeted adoption of Rust.',
        'Melchior’s 80/20 latency distribution confirmed that selective extraction yields nearly identical performance benefits.',
      ],
      synthesisSummary: 'The MAGI system navigated past the classic engineering trap of the total rewrite. By isolating Rust to high-throughput compute kernels and retaining Node.js for API routing, the organization balances cutting-edge performance with delivery certainty.',
      dissentingOpinionsNoted: [],
    },
  },
  pt: {
    round0: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.90,
        summary: 'Migrar todo o backend para Rust maximizará a densidade computacional, eliminará pausas de Garbage Collector e garantirá segurança de memória em tempo de compilação.',
        keyArguments: [
          'Abstrações de custo zero e o borrow checker eliminam toda uma classe de corrupção de memória e corridas de concorrência em tempo de execução.',
          'Latências de cauda sub-milissegundo sob alta concorrência sem os picos causados pelo stop-the-world do Node.js/V8.',
          'Redução substancial na pegada de memória e nos custos operacionais com instâncias em nuvem.',
        ],
        criticalAssumptions: ['A equipe de desenvolvimento consegue absorver os conceitos do borrow checker em prazo razoável.'],
        identifiedRisks: ['Tempos de compilação significativamente mais lentos impactando os ciclos diários de feedback.'],
        recommendedAction: 'Iniciar migração completa do backend para Rust.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.92,
        summary: 'Reescrever um sistema em produção que já funciona introduz risco imenso de entrega, congelamento de roadmap comercial e desestabilização da equipe.',
        keyArguments: [
          'Síndrome clássica do segundo sistema: reescritas completas rotineiramente estouram prazos em 200% e introduzem bugs regressivos sutis.',
          'A curva de aprendizado íngreme de Rust paralisará a entrega de novas funcionalidades por 6 a 9 meses, deixando o negócio vulnerável à concorrência.',
          'Gargalos do Node.js quase sempre podem ser mitigados com escala horizontal e perfilamento de código assíncrono com custo irrisório comparado a uma reescrita.',
        ],
        criticalAssumptions: ['Os gargalos atuais de desempenho não são fatais para a operação imediata.'],
        identifiedRisks: ['Esgotamento do orçamento e debandada de desenvolvedores frustrados com a lentidão de entregas.'],
        recommendedAction: 'Vetar a reescrita total; perfilar os gargalos no código Node.js atual e otimizar caminhos críticos.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'PIVOT',
        confidence: 0.85,
        summary: 'Uma reescrita total é um erro dogmático; adotar o padrão Strangler Fig para migrar apenas módulos de CPU intensiva para Rust.',
        keyArguments: [
          '80% dos serviços de backend são simples intermediadores de I/O onde o ecossistema Node.js é extremamente produtivo e Rust traz atrito desnecessário.',
          'Extrair apenas componentes de cálculo pesado (criptografia, processamento de imagem/áudio, parsing binário) como módulos Rust ou micro-serviços dedicados.',
          'Preserva o ritmo de entrega do produto enquanto desbloqueia desempenho cirúrgico onde realmente importa.',
        ],
        criticalAssumptions: ['A fronteira de comunicação entre Node.js e Rust tem custo de serialização desprezível.'],
        identifiedRisks: ['Manter duas pilhas de tecnologia coexistindo na empresa.'],
        recommendedAction: 'Adotar padrão Strangler Fig: manter Node.js na orquestração e criar módulos pontuais em Rust para gargalos reais.',
      },
    },
    round1: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'CONDITIONAL',
        confidence: 0.88,
        summary: 'Concedendo a Balthasar e Casper: a reescrita total é matematicamente sub-ótima se comparada à migração seletiva de caminhos críticos.',
        keyArguments: [
          'Princípio de Pareto: 80% do uso de CPU provém de 20% do código. Migrar esses pontos críticos atinge 95% do ganho de performance a uma fração do custo.',
          'Elimina o risco de paralisia da empresa sem abrir mão de alta taxa de transferência.',
        ],
        criticalAssumptions: ['A sobrecarga de FFI ou gRPC entre os serviços é mínima.'],
        identifiedRisks: ['Manutenção de pipelines de CI/CD para duas linguagens.'],
        recommendedAction: 'Prosseguir com migração seletiva para Rust apenas nos módulos limitados por CPU.',
        critiquesOfPeers: [
          {
            targetAgent: 'BALTHASAR',
            pointsOfAgreement: ['O risco de reescrever tudo de uma vez é inaceitável.'],
            pointsOfDisagreement: ['Não fazer nada deixa gargalos graves sem solução técnica.'],
            rebuttal: 'A estratégia híbrida colhe os ganhos de desempenho sem arriscar o cronograma de entrega.',
          },
        ],
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'CONDITIONAL',
        confidence: 0.85,
        summary: 'Aceitando a solução híbrida: extração pontual com métricas comprovadas e portas de reversão é aceitável.',
        keyArguments: [
          'Confinar Rust a serviços isolados delimita o raio de impacto de novas ferramentas.',
          'O roadmap de produtos continua fluindo sem interrupções em Node.js.',
        ],
        criticalAssumptions: ['Fronteiras de interface bem definidas entre os serviços.'],
        identifiedRisks: ['Sobrecarga de serialização de dados na comunicação interna.'],
        recommendedAction: 'Permitir reescrita seletiva apenas com prova de gargalo atestada por perfilamento.',
        critiquesOfPeers: [
          {
            targetAgent: 'MELCHIOR',
            pointsOfAgreement: ['Migração focada diminui o raio de explosão.'],
            pointsOfDisagreement: [],
            rebuttal: 'Aprovação condicionada a justificativas técnicas baseadas em telemetria real.',
          },
        ],
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.90,
        summary: 'Consenso firmado: a arquitetura híbrida e pragmática atende à velocidade do negócio e ao anseio técnico dos desenvolvedores.',
        keyArguments: [
          'Oferece aos engenheiros crescimento e aprendizado de ponta sem sobrecarregar a rotina da equipe.',
        ],
        criticalAssumptions: ['Governança clara para não proliferar linguagens sem critério.'],
        identifiedRisks: ['Garantir observabilidade e rastreamento distribuído unificado.'],
        recommendedAction: 'Criar força-tarefa pontual em Rust para os serviços de gargalo computacional.',
        critiquesOfPeers: [],
      },
    },
    synthesis: {
      finalDecision: 'CONDITIONAL_PASS',
      coreVerdict: 'Aprovação Condicional: Rejeitar a reescrita total da base de código; adotar migração seletiva no modelo Strangler Fig para Rust estritamente nos microsserviços e rotinas de alto consumo de CPU previamente perfilados.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 9,
        CASPER: 10,
      },
      decisiveFactors: [
        'A defesa de Balthasar contra a paralisia do roadmap impediu um congelamento comercial fatal de 9 meses.',
        'O compromisso Strangler Fig formulado por Casper conciliou velocidade do produto com a adoção moderna de Rust.',
        'A demonstração de Melchior sobre a distribuição 80/20 comprovou que a extração seletiva entrega quase a totalidade dos ganhos esperados.',
      ],
      synthesisSummary: 'O MAGI evitou a clássica armadilha de engenharia da reescrita completa do zero. Confinando Rust a módulos de alto processamento e mantendo Node.js no roteamento de APIs, a organização combina agilidade de entrega com desempenho de classe mundial.',
      dissentingOpinionsNoted: [],
    },
  },
};

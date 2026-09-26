import type { MultilingualDilemma } from './types.js';

export const lockAvalancheFixture: MultilingualDilemma = {
  en: {
    round0: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.94,
        summary: 'Mathematical graph analysis shows circular dependency cycle across distributed lock managers; automatic recovery will not converge within acceptable SLA bounds.',
        keyArguments: [
          'Deadlock graph cycle depth exceeds 14 nodes across Redis lock clusters and relational rows.',
          'Waiting for auto-recovery compounds caller queue backpressure, leading to cascade failure across upstream API clusters.',
          'Triggering controlled failover to isolated standby cluster breaks the deadlock cycle deterministically in 4.2 seconds.',
        ],
        criticalAssumptions: ['Standby cluster state lag is under 200 milliseconds.'],
        identifiedRisks: ['Small window of uncommitted in-flight transactions requiring client replay.'],
        recommendedAction: 'Execute emergency cluster failover immediately.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.93,
        summary: 'Emergency failover during an uncoordinated lock storm risks split-brain partitioned data corruption; enforce lock expiry ttl flushing instead.',
        keyArguments: [
          'Failover under saturated queues often results in dual-master writes if the old cluster has not completed fencing.',
          'Data corruption is infinitely more dangerous than 3 minutes of transaction latency.',
          'Purging expired lock keys with a global TTL sweep allows natural queue drain without split-brain risk.',
        ],
        criticalAssumptions: ['Fencing tokens are strictly verified by underlying storage.'],
        identifiedRisks: ['Irreversible database inconsistency if split-brain occurs.'],
        recommendedAction: 'Veto blind failover; execute aggressive lock TTL eviction and isolate stalled workers.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'PIVOT',
        confidence: 0.89,
        summary: 'Execute a staged circuit-breaker trip: pause upstream ingestion for 30 seconds to let existing locks self-release, avoiding both split-brain and extended outage.',
        keyArguments: [
          'The avalanche is sustained purely because upstream clients are retrying lock acquisitions aggressively without exponential backoff.',
          'Opening the circuit breaker upstream chokes the fire hose, allowing Redis distributed locks to clear their natural 15s TTL safely.',
        ],
        criticalAssumptions: ['Upstream message queues can buffer incoming requests during the 30-second pause.'],
        identifiedRisks: ['Queue backlog growth during circuit-breaker trip.'],
        recommendedAction: 'Trip upstream ingress circuit breaker for 30 seconds; purge zombie lock leases and throttle retries with jitter.',
      },
    },
    round1: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.92,
        summary: 'Adopting Casper’s upstream circuit-breaker with Balthasar’s fencing verification eliminates failover split-brain risk while breaking the deadlock.',
        keyArguments: [
          'Pausing ingestion for 30s drains 94% of held locks naturally without triggering dangerous failovers.',
        ],
        criticalAssumptions: ['Redis TTL keys have not been configured with infinite expiry.'],
        identifiedRisks: ['Transient client retry errors during pause.'],
        recommendedAction: 'Enact coordinated 30s ingress pause combined with automated zombie lock eviction.',
        critiquesOfPeers: [
          {
            targetAgent: 'BALTHASAR',
            pointsOfAgreement: ['Split-brain data corruption must be prevented at all costs.'],
            pointsOfDisagreement: [],
            rebuttal: 'Casper’s paused-ingestion approach achieves safety without blind failovers.',
          },
        ],
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'APPROVE',
        confidence: 0.90,
        summary: 'Approving the coordinated pause: zero risk of split-brain corruption when ingress is paused and locks are given space to expire.',
        keyArguments: [
          'Data integrity remains 100% protected.',
        ],
        criticalAssumptions: ['Storage nodes confirm zero active write leases before resuming traffic.'],
        identifiedRisks: ['Monitoring queue consumer lag upon traffic resumption.'],
        recommendedAction: 'Authorize coordinated circuit pause and enforce randomized jitter on reconnection.',
        critiquesOfPeers: [],
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.95,
        summary: 'Consensus achieved: solve the distributed storm through patience and circuit isolation rather than rash failover.',
        keyArguments: [
          'Prevents data disasters while restoring system stability rapidly.',
        ],
        criticalAssumptions: ['Clients observe Retry-After headers.'],
        identifiedRisks: ['Ensuring client SDKs adhere to jittered backoff.'],
        recommendedAction: 'Trigger Ingress Pause and Randomized Backoff protocol.',
        critiquesOfPeers: [],
      },
    },
    synthesis: {
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Unanimous Tactical Consensus: Reject dangerous emergency failover to prevent split-brain data corruption. Trip upstream ingress circuit-breakers for 30 seconds to allow lock leases to expire naturally, then resume with randomized exponential jitter.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 10,
        CASPER: 10,
      },
      decisiveFactors: [
        'Balthasar’s critical warning proved that uncoordinated failover during lock contention risks dual-master split-brain corruption.',
        'Casper’s upstream circuit breaker cut off the retry firehose, enabling natural TTL lock expiration without data loss.',
        'Melchior verified that pausing ingress clears deadlock cycles within 30 seconds deterministically.',
      ],
      synthesisSummary: 'MAGI prevented a major data loss incident by vetoing a hasty cluster failover. The cores synthesized an upstream circuit-breaker strategy that starves the deadlock cycle and restores full distributed throughput safely.',
      dissentingOpinionsNoted: [],
    },
  },
  pt: {
    round0: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.94,
        summary: 'A teoria dos grafos distribuídos demonstra ciclos de dependência circular nos gerenciadores de locks; a auto-recuperação não convergirá dentro do SLA aceitável.',
        keyArguments: [
          'A profundidade do grafo de deadlock excede 14 nós entre instâncias Redis e tabelas relacionais.',
          'Esperar pela auto-recuperação acumula contrapressão nas filas, gerando falha em cascata em todos os microsserviços upstream.',
          'Executar failover controlado para o cluster standby encerra o ciclo de deadlock deterministicamente em 4,2 segundos.',
        ],
        criticalAssumptions: ['O atraso de replicação do cluster standby é inferior a 200 milissegundos.'],
        identifiedRisks: ['Pequena janela de transações pendentes que exigirá reprocessamento assíncrono.'],
        recommendedAction: 'Acionar failover emergencial de cluster imediatamente.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.93,
        summary: 'Failover durante tempestade desordenada de locks arrisca corrupção catastrófica por split-brain; devemos purgar chaves expiradas e preservar os dados.',
        keyArguments: [
          'Fazer failover sob saturação descontrolada frequentemente cria cenários de split-brain com escritas simultâneas em mestres diferentes.',
          'A corrupção do banco de dados é infinitamente mais destrutiva que alguns minutos de lentidão nas transações.',
          'Uma purga forçada de chaves com TTL expirado permite desobstruir as filas sem risco de perda de integridade.',
        ],
        criticalAssumptions: ['Tokens de esgrima (fencing tokens) são rigorosamente validados pelo banco relacional.'],
        identifiedRisks: ['Inconsistência irreversível nos dados caso ocorra escrita particionada.'],
        recommendedAction: 'Vetar failover cego; executar purga emergencial de TTLs expirados e isolar nós zumbis.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'PIVOT',
        confidence: 0.89,
        summary: 'Abrir o disjuntor (circuit breaker) no upstream por 30 segundos: estancar novas tentativas e permitir a liberação natural dos locks sem quebrar o cluster.',
        keyArguments: [
          'A avalanche só se perpetua porque os clientes estão disparando retentativas agressivas sem backoff exponencial.',
          'Cortar o fluxo de entrada por 30 segundos dá espaço para os locks do Redis atingirem seu TTL de 15 segundos e se dissiparem em segurança.',
        ],
        criticalAssumptions: ['As filas de mensageria conseguem reter requisições durante a pausa de 30 segundos.'],
        identifiedRisks: ['Aumento temporário do backlog nas filas durante a interrupção.'],
        recommendedAction: 'Desarmar disjuntor de entrada por 30 segundos; purgar concessões fantasmas e reativar com jitter aleatório.',
      },
    },
    round1: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.92,
        summary: 'Adotando a pausa de entrada de Casper e a proteção de fencing de Balthasar: eliminamos o risco de split-brain e dissolvemos o deadlock.',
        keyArguments: [
          'Pausar as requisições por 30 segundos esvazia 94% dos bloqueios de forma natural, sem necessidade de failover traumático.',
        ],
        criticalAssumptions: ['As chaves de lock do Redis possuem expiração TTL configurada.'],
        identifiedRisks: ['Erros transitórios de timeout reportados aos clientes durante a pausa.'],
        recommendedAction: 'Aplicar pausa coordenada de 30 segundos com purga automática de locks zumbis.',
        critiquesOfPeers: [
          {
            targetAgent: 'BALTHASAR',
            pointsOfAgreement: ['A integridade dos dados deve ser protegida contra split-brain a qualquer custo.'],
            pointsOfDisagreement: [],
            rebuttal: 'A estratégia de Casper atinge a restauração sem necessitar de failover arriscado.',
          },
        ],
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'APPROVE',
        confidence: 0.90,
        summary: 'Aprovando a pausa coordenada: risco zero de split-brain quando a entrada é suspensa e os locks têm tempo de expirar pacificamente.',
        keyArguments: [
          'A integridade transacional é preservada em 100%.',
        ],
        criticalAssumptions: ['Os nós de armazenamento certificam ausência de escritas fantasmas antes de retomar o tráfego.'],
        identifiedRisks: ['Monitorar a vazão dos consumidores de fila após a retomada.'],
        recommendedAction: 'Autorizar pausa de entrada com desarme de disjuntor e retorno sob backoff com jitter aleatório.',
        critiquesOfPeers: [],
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.95,
        summary: 'Consenso firmado: vencer a tempestade distribuída com paciência tática e isolamento de circuitos em vez de comandos precipitados.',
        keyArguments: [
          'Elimina o risco de pesadelos com banco de dados enquanto restabelece a saúde dos nós com agilidade.',
        ],
        criticalAssumptions: ['Os clientes respeitam cabeçalhos de Retry-After.'],
        identifiedRisks: ['Garantir que as bibliotecas clientes utilizem retentativas com dispersão aleatória.'],
        recommendedAction: 'Acionar protocolo de Pausa de Ingress e Backoff com Jitter.',
        critiquesOfPeers: [],
      },
    },
    synthesis: {
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Consenso Tático Unânime: Rejeitar failover emergencial precipitado para evitar corrupção por split-brain. Desarmar os disjuntores de entrada (circuit breakers) por 30 segundos para permitir a expiração natural dos locks em deadlock, retomando o tráfego com backoff exponencial e jitter.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 10,
        CASPER: 10,
      },
      decisiveFactors: [
        'O alerta rigoroso de Balthasar comprovou que forçar failover durante saturação gera escritas divididas em múltiplos mestres (split-brain).',
        'O disjuntor proposto por Casper estancou as retentativas agressivas dos microsserviços, permitindo que os locks expirassem naturalmente.',
        'A análise matemática de Melchior confirmou a dissolução de todos os grafos cíclicos em menos de 30 segundos.',
      ],
      synthesisSummary: 'O MAGI evitou uma catástrofe de integridade transacional ao vetar uma substituição de nó arriscada. A Tríade convergiu em um plano de contenção de fluxo que dissolveu a tempestade de bloqueios e restabeleceu os serviços em segurança.',
      dissentingOpinionsNoted: [],
    },
  },
};

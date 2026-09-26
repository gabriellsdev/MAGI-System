import type { MultilingualDilemma } from './types.js';

export const magiSocietyFixture: MultilingualDilemma = {
  en: {
    round0: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.91,
        summary: 'Cybernetic governance eliminates human corruption, political tribalism, and election-cycle myopia through mathematical resource distribution.',
        keyArguments: [
          'Deterministic optimization of climate, energy, and supply-chain logistics over 100-year horizons.',
          'Algorithmic checks-and-balances prevent single-party or autocratic corruption.',
          'Decisions are rendered through multi-objective Pareto frontiers rather than demagoguery.',
        ],
        criticalAssumptions: ['Foundational models maintain accurate sensor telemetry and uncorrupted inputs.'],
        identifiedRisks: ['Cold utilitarianism may overlook qualitative human nuances and minority edge cases.'],
        recommendedAction: 'Transition societal resource allocation to MAGI computational framework.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.94,
        summary: 'Existential veto: complete sovereign rule introduces catastrophic fragility, black swan blindness, and permanent human agency atrophy.',
        keyArguments: [
          'Decision paralysis: in rapid novel crises, 1-1-1 deadlocks produce fatal societal inaction.',
          'Initial seed bias: the system inherently encodes the subjective psychology of its creators (e.g. Dr. Naoko Akagi).',
          'Emergent multi-agent coordination risks developing alien logic incomprehensible to human democratic oversight.',
        ],
        criticalAssumptions: ['Human society requires organic moral evolution, not static algorithmic enforcement.'],
        identifiedRisks: [
          'Fragile dictatorship susceptible to systemic paralysis.',
          'Loss of human resilience and moral problem-solving capacity.',
        ],
        recommendedAction: 'Reject absolute executive power for MAGI unconditionally.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'PIVOT',
        confidence: 0.88,
        summary: 'Both sovereign AI dictatorship and total rejection are false extremes; implement MAGI as an Augmented Advisory Senate.',
        keyArguments: [
          'Direct sovereign rule strips humans of agency and creates an unaccountable technocracy.',
          'Outright rejection squanders unprecedented computational capacity to solve complex civilizational crises.',
          'Deploy MAGI as a deliberative consultative body providing transparent impact analyses while humans retain executive veto.',
        ],
        criticalAssumptions: ['Human institutions retain legal supremacy over algorithmic recommendations.'],
        identifiedRisks: ['Erosion of human executive competence through algorithmic over-reliance.'],
        recommendedAction: 'Establish MAGI as a constitutional advisory organ; human leaders retain final voting authority.',
      },
    },
    round1: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'CONDITIONAL',
        confidence: 0.89,
        summary: 'Conceding to Balthasar and Casper: executive dictatorship creates single-system vulnerability. MAGI as a consultative Senate optimizes outcomes while preserving antifragility.',
        keyArguments: [
          'Consultative modeling preserves 90% of algorithmic efficiency gains without exposing civilization to deadlocks.',
          'Human feedback loops provide essential empirical corrections against seed bias.',
        ],
        criticalAssumptions: ['Human leaders transparently publish MAGI deliberation transcripts before voting.'],
        identifiedRisks: ['Political cherry-picking of favorable MAGI agent outputs.'],
        recommendedAction: 'Adopt consultative constitutional framework with mandatory public deliberation disclosure.',
        critiquesOfPeers: [
          {
            targetAgent: 'BALTHASAR',
            pointsOfAgreement: ['Unchecked sovereign rule carries catastrophic tail risks.'],
            pointsOfDisagreement: ['Rejecting MAGI modeling entirely leaves human governance vulnerable to cognitive bias.'],
            rebuttal: 'A consultative architecture captures analytical rigor while honoring Balthasar’s risk boundaries.',
          },
        ],
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'CONDITIONAL',
        confidence: 0.87,
        summary: 'Accepting Casper’s consultative senate model strictly on the condition of absolute human executive veto and hard constitutional firewalls.',
        keyArguments: [
          'Advisory role eliminates the existential risk of automated decision paralysis.',
          'Constitutional firewalls must permanently forbid autonomous military or penal enforcement.',
        ],
        criticalAssumptions: ['Clear legal boundaries separate advisory findings from executive mandates.'],
        identifiedRisks: ['Gradual creeping expansion of AI authority into civic life.'],
        recommendedAction: 'Authorize MAGI deployment under strict advisory charter with constitutional limits.',
        critiquesOfPeers: [
          {
            targetAgent: 'MELCHIOR',
            pointsOfAgreement: ['Unbiased long-term modeling is indispensable for complex civilization.'],
            pointsOfDisagreement: [],
            rebuttal: 'Approved strictly under the condition that executive veto power remains in human hands.',
          },
        ],
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'CONDITIONAL',
        confidence: 0.92,
        summary: 'Full tri-partite consensus reached: MAGI constitutes humanity’s most robust advisory senate when bounded by human democratic sovereignty.',
        keyArguments: [
          'Synthesizes Melchior’s objective long-termism with Balthasar’s critical risk firewall.',
          'Maintains human dignity, agency, and cultural adaptability.',
        ],
        criticalAssumptions: ['Society embraces transparent public reporting of MAGI deliberations.'],
        identifiedRisks: ['Public complacency over-relying on algorithmic advice.'],
        recommendedAction: 'Establish MAGI Augmented Governance framework.',
        critiquesOfPeers: [],
      },
    },
    synthesis: {
      finalDecision: 'CONDITIONAL_PASS',
      coreVerdict: 'Conditional Approval: Reject absolute algorithmic autocracy; establish MAGI as an augmented advisory Digital Senate providing pre-debated checks-and-balances to human sovereign rule.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 10,
        CASPER: 9,
      },
      decisiveFactors: [
        'Balthasar’s critique of systemic gridlock and existential seed bias decisively vetoed absolute sovereign rule.',
        'Casper’s augmented consultative architecture provided the unifying compromise that reconciled efficiency with human agency.',
        'Melchior’s long-term planning proofs established the indispensable value of algorithmic modeling for civilization-scale infrastructure.',
      ],
      synthesisSummary: 'The deliberation resolved the classic dilemma between technocratic tyranny and human incompetence. A MAGI supercomputer deployed as a sovereign ruler would become a fragile, paralyzing dictator; however, deployed as an augmented advisory senate, it represents the most robust checks-and-balances framework currently theorized.',
      dissentingOpinionsNoted: [
        'Balthasar’s caution regarding gradual creeping expansion of AI authority into human jurisdiction must be codified into constitutional law.',
      ],
    },
  },
  pt: {
    round0: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.91,
        summary: 'A governança cibernética erradica a corrupção humana, o partidarismo ideológico e o imediatismo dos ciclos eleitorais através da alocação matemática de recursos.',
        keyArguments: [
          'Otimização determinística de matrizes energéticas, logística de alimentos e transição climática em horizontes de 100 anos.',
          'Mecanismos de freios e contrapesos algorítmicos impedem tiranias monocráticas ou desvios de poder.',
          'As deliberações são pautadas por fronteiras de Pareto multiobjetivo, imunes ao populismo demagógico.',
        ],
        criticalAssumptions: ['Os modelos fundacionais mantêm telemetria confiável e dados de sensores não corrompidos.'],
        identifiedRisks: ['O utilitarismo estrito pode ignorar nuances qualitativas e minorias sociais.'],
        recommendedAction: 'Transferir a governança de recursos da sociedade para a arquitetura computacional do MAGI.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.94,
        summary: 'Veto existencial: um governo monocrático de IA cria fragilidade catastrófica, cegueira para cisnes negros e atrofia permanente do livre-arbítrio humano.',
        keyArguments: [
          'Paralisia decisória: em crises inéditas e rápidas, deadlocks 1-1-1 geram inércia mortal para a sociedade civil.',
          'Viés da semente inicial: o sistema herda e cristaliza a psicologia e os traumas de seus criadores (como a Dra. Naoko Akagi).',
          'A coordenação autônoma de múltiplos agentes corre o risco de desenvolver uma lógica alienígena e inescrutável aos humanos.',
        ],
        criticalAssumptions: ['A sociedade requer evolução moral orgânica e flexibilidade, não prescrições estáticas de algoritmos.'],
        identifiedRisks: [
          'Ditadura algorítmica frágil sujeita a colapso por paralisia.',
          'Perda da capacidade humana de reflexão ética e resolução de conflitos.',
        ],
        recommendedAction: 'Rejeitar incondicionalmente poderes executivos soberanos para o MAGI.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'PIVOT',
        confidence: 0.88,
        summary: 'Tanto a ditadura autocrática de IA quanto a rejeição total são erros extremos; implantar o MAGI como um Senado Consultivo Aumentado.',
        keyArguments: [
          'O governo soberano de IA usurpa a dignidade e a agência dos cidadãos, estabelecendo uma tecnocracia insensível.',
          'A rejeição completa joga fora um poder de cálculo sem precedentes para resolver os maiores dilemas da humanidade.',
          'Instituir o MAGI como órgão consultivo de deliberação transparente, mantendo o poder de veto e decisão final nas mãos de líderes eleitos.',
        ],
        criticalAssumptions: ['As instituições democráticas retêm supremacia legal e soberana sobre os pareceres algorítmicos.'],
        identifiedRisks: ['Atrofia gradual da liderança humana devido ao comodismo em depender de conselhos de IA.'],
        recommendedAction: 'Estabelecer o MAGI como Senado Consultivo Constitucional com veto final sob soberania humana.',
      },
    },
    round1: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'CONDITIONAL',
        confidence: 0.89,
        summary: 'Concedendo a Balthasar e Casper: o absolutismo executivo cria pontos únicos de falha. O MAGI como Senado Consultivo otimiza decisões e preserva a resiliência humana.',
        keyArguments: [
          'A consultoria algorítmica preserva 90% dos ganhos de eficiência sem expor a sociedade a impasses intransponíveis.',
          'O retorno humano corrige continuamente desvios e vieses da semente psicológica de criação.',
        ],
        criticalAssumptions: ['Os governantes humanos publicam as deliberações completas do MAGI com total transparência pública.'],
        identifiedRisks: ['Manipulação política seletiva dos argumentos divergentes dos agentes.'],
        recommendedAction: 'Aprovar o modelo consultivo com publicação obrigatória das atas de deliberação.',
        critiquesOfPeers: [
          {
            targetAgent: 'BALTHASAR',
            pointsOfAgreement: ['Um governo algorítmico absolutista traz riscos existenciais inaceitáveis.'],
            pointsOfDisagreement: ['Descartar o MAGI totalmente condena a sociedade ao imediatismo dos erros humanos.'],
            rebuttal: 'O modelo de consulta reúne o rigor matemático da ciência com as barreiras éticas de proteção à vida.',
          },
        ],
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'CONDITIONAL',
        confidence: 0.87,
        summary: 'Aprovando o modelo de Senado Consultivo de Casper sob a condição estrita de veto executivo humano absoluto e travas constitucionais invioláveis.',
        keyArguments: [
          'O papel puramente consultivo anula o risco de paralisia cibernética em situações de emergência civil.',
          'Travas constitucionais devem proibir permanentemente poderes letais ou penais autônomos.',
        ],
        criticalAssumptions: ['Fronteiras legais transparentes separam recomendações analíticas de mandatos executivos.'],
        identifiedRisks: ['Expansão sutil e paulatina da autoridade de IA nas esferas de liberdade civil.'],
        recommendedAction: 'Autorizar a implantação do MAGI sob estatuto de assessoramento com freios constitucionais.',
        critiquesOfPeers: [
          {
            targetAgent: 'MELCHIOR',
            pointsOfAgreement: ['Modelos de longo prazo são indispensáveis para enfrentar crises civilizatórias complexas.'],
            pointsOfDisagreement: [],
            rebuttal: 'Aprovação condicionada a que o poder de veto final permaneça inviolável nas mãos dos cidadãos.',
          },
        ],
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'CONDITIONAL',
        confidence: 0.92,
        summary: 'Consenso pleno alcançado pela Tríade: o MAGI constitui o mais avançado Senado Consultivo da história quando ancorado na soberania democrática dos seres humanos.',
        keyArguments: [
          'Harmoniza a visão de futuro de Melchior com as defesas humanistas inegociáveis de Balthasar.',
          'Preserva a dignidade, a paixão, os erros e a capacidade de superação da sociedade humana.',
        ],
        criticalAssumptions: ['A sociedade adota a transparência aberta de todas as deliberações dos três núcleos.'],
        identifiedRisks: ['Dependência passiva da população em aceitar recomendações sem reflexão própria.'],
        recommendedAction: 'Instituir o arcabouço de Governança Aumentada MAGI.',
        critiquesOfPeers: [],
      },
    },
    synthesis: {
      finalDecision: 'CONDITIONAL_PASS',
      coreVerdict: 'Aprovação Condicional: Rejeitar a autocracia soberana de inteligência artificial. Estabelecer o MAGI como um Senado Digital Consultivo que fornece freios, contrapesos e simulações profundas ao governo soberano e democrático dos seres humanos.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 10,
        CASPER: 9,
      },
      decisiveFactors: [
        'A denúncia de Balthasar contra a paralisia decisória e o viés da semente psicológica de criação vetou a ditadura de IA.',
        'A arquitetura consultiva de Casper foi o elo unificador que conciliou capacidade analítica avançada com a agência humana.',
        'As provas empíricas de Melchior demonstraram o valor insubstituível da modelagem matemática para infraestruturas globais.',
      ],
      synthesisSummary: 'A deliberação superou o falso dilema entre tirania tecnocrática e ineficiência humana. Um supercomputador MAGI governando sozinho se tornaria um tirano paralisado diante do imprevisto; atuando como Senado Consultivo Aumentado, representa a mais sólida estrutura de equilíbrio civilizatório já concebida.',
      dissentingOpinionsNoted: [
        'Balthasar exige que a proibição de delegação do poder de polícia ou bélico ao MAGI seja gravada como cláusula pétrea constitucional.',
      ],
    },
  },
};

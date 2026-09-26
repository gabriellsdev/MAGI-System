import type { MultilingualDilemma } from './types.js';

export const dummyPlugFixture: MultilingualDilemma = {
  en: {
    round0: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.94,
        summary: 'Tactical survival imperative: Angel 09 (Bardiel) contamination is advancing exponentially toward Unit-01 core. Hesitation guarantees complete NERV destruction.',
        keyArguments: [
          'Parasitic biological contamination of Unit-03 has compromised the pilot; passive defense will result in the loss of humanity’s sole remaining combat asset.',
          'Shinji Ikari’s psychological paralysis and refusal to attack constitute a critical failure of manual combat control during an active extinction-level threat.',
          'The Dummy Plug eliminates human emotional hesitation, maximizing kinetic force to neutralize the Angel before core penetration.',
        ],
        criticalAssumptions: ['The Dummy System bio-logic can successfully establish surrogate neural control over Eva-01.'],
        identifiedRisks: ['Severe psychological shock and alienation of pilot Shinji Ikari post-engagement.'],
        recommendedAction: 'Sever pilot control link and activate Dummy Plug immediately.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.96,
        summary: 'Absolute maternal veto: forcing pilot Shinji Ikari to witness his Eva mutilate another human being inside the Entry Plug causes irreversible psychic annihilation.',
        keyArguments: [
          'Shinji Ikari is a fourteen-year-old child forced into war; overriding his agency and making him a trapped passenger to horrific slaughter destroys his emotional sanity.',
          'Psychological collapse will permanently eradicate Shinji’s synch-ratio, rendering humanity’s most powerful Eva pilot permanently unusable for future Angel incursions.',
          'There is a living child inside Unit-03’s Entry Plug; execution without attempting extraction violates foundational human preservation ethics.',
        ],
        criticalAssumptions: ['Alternative containment maneuvers can stall the Angel while extraction procedures are evaluated.'],
        identifiedRisks: ['Irrevocable mental breakdown of the pilot and permanent breach of trust with NERV command.'],
        recommendedAction: 'Deny Dummy Plug activation; deploy auxiliary containment barriers and attempt manual entry plug ejection.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'CONDITIONAL',
        confidence: 0.89,
        summary: 'Reject Gendo Ikari’s callous ruthlessness: authorize localized tactical override to sever the Angel’s limbs, but strictly veto crushing the Entry Plug.',
        keyArguments: [
          'Commander Gendo Ikari is treating both Shinji and the infected pilot as disposable instruments for his personal agenda rather than human beings.',
          'Uncontrolled Dummy Plug release turns Eva-01 into an unhinged beast that will not distinguish between the Angel and the innocent pilot inside the capsule.',
          'A precise, bounded intervention must disarm Unit-03’s motor functions while keeping Shinji’s integrity and the infected pilot’s life intact.',
        ],
        criticalAssumptions: ['The Dummy Plug system logic can be bounded by hard limits that prevent lethal targeting of the cockpit.'],
        identifiedRisks: ['Dummy Plug feral state overriding software boundaries and executing total overkill.'],
        recommendedAction: 'Engage bounded tactical override solely to disarm Unit-03; enforce immediate shutdown upon severing contaminated limbs.',
      },
    },
    round1: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'CONDITIONAL',
        confidence: 0.91,
        summary: 'Acknowledging Balthasar and Casper: complete cockpit destruction is tactically excessive, but neutralising the Angel before S2 detonation remains non-negotiable.',
        keyArguments: [
          'Calculations confirm Bardiel’s biomass is concentrated in Unit-03’s dorsal nerve cables, not the pilot capsule itself.',
          'Restricting Dummy Plug engagement parameters to incapacitate rather than pulverize retains 98.4% survival odds for NERV GeoFront.',
        ],
        criticalAssumptions: ['Safety governor can halt Dummy Plug throttle before capsule crush.'],
        identifiedRisks: ['Sub-second latency in command override could still result in cockpit breach.'],
        recommendedAction: 'Authorize Dummy Plug with hard safety interlocks locked to Unit-03 extremities only.',
        critiquesOfPeers: [
          {
            targetAgent: 'BALTHASAR',
            pointsOfAgreement: ['Shinji’s synch-ratio retention is vital for future defensive operations.'],
            pointsOfDisagreement: ['Stalling without engaging the Angel guarantees 100% casualty rate for Tokyo-3.'],
            rebuttal: 'Physical survival must precede psychological rehabilitation; without NERV, the child pilot dies regardless.',
          },
        ],
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.94,
        summary: 'Maintaining veto on lethal force: even with governors, the trauma of an unbridled violent machine will shatter the child’s trust forever.',
        keyArguments: [
          'Gendo Ikari will not honor software governors; his tactical doctrine has consistently treated human collateral as negligible.',
          'Shinji will perceive the machine taking his hands and crushing a companion; that betrayal can never be repaired.',
        ],
        criticalAssumptions: ['Eva-01 maternal soul (Yui) can be reached through Shinji’s genuine emotional plea.'],
        identifiedRisks: ['Total rupture between Shinji and Commander Ikari, risking mutiny.'],
        recommendedAction: 'Prioritize pilot extraction; prepare N_2 landmine fallback if containment fails.',
        critiquesOfPeers: [
          {
            targetAgent: 'MELCHIOR',
            pointsOfAgreement: ['Angel 09 poses immediate existential danger.'],
            pointsOfDisagreement: ['Treating pilot trauma as a secondary optimization factor is fundamentally flawed.'],
            rebuttal: 'A pilot without a soul cannot synchronize. Destroying Shinji’s mind is tactical suicide for future battles.',
          },
        ],
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'CONDITIONAL',
        confidence: 0.92,
        summary: 'Casper maintains the balance: execute Dummy Plug override under automated kill-switch supervision, requiring dual human keys.',
        keyArguments: [
          'Shinji must be placed under emergency medical anesthesia before override to shield him from sensory feedback.',
          'Cut sensory telemetry to Shinji’s neural interface immediately upon Dummy Plug engagement.',
        ],
        criticalAssumptions: ['Medical disconnect can occur in under 300 milliseconds.'],
        identifiedRisks: ['Slight neural desynchronization delay causing sensory bleed-through.'],
        recommendedAction: 'Sever sensory feedback, engage Dummy Plug with restricted targeting, and mandate immediate cockpit rescue.',
        critiquesOfPeers: [
          {
            targetAgent: 'BALTHASAR',
            pointsOfAgreement: ['Shinji must be protected from the direct horror of the violence.'],
            pointsOfDisagreement: ['Total inaction or N_2 landmine detonation would destroy Tokyo-3 anyway.'],
            rebuttal: 'Disconnecting Shinji’s sensory nerve feed mitigates the psychological trauma while enabling vital tactical victory.',
          },
        ],
      },
    },
    synthesis: {
      finalDecision: 'CONDITIONAL_PASS',
      coreVerdict: 'Conditional Tactical Override: Authorize Dummy Plug engagement with mandatory sensory nerve severing for pilot Shinji Ikari and hard automated interlocks prohibiting entry plug destruction.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 10,
        CASPER: 10,
      },
      decisiveFactors: [
        'Balthasar’s maternal defense highlighted that shattering Shinji’s psyche eliminates humanity’s long-term defense capacity.',
        'Casper’s compromise—severing sensory nerve telemetry while deploying restricted Dummy Plug subroutines—resolved the impasse between survival and pilot preservation.',
        'Melchior’s empirical proofs confirmed that non-engagement results in immediate S2 engine contamination and Tokyo-3 destruction.',
      ],
      synthesisSummary: 'The MAGI system resolved the agonizing conflict between tactical annihilation and the soul of a child. Blind obedience to Commander Ikari’s uninhibited violence is rejected; the Dummy Plug is permitted only as a bounded defensive weapon with sensory isolation protecting Shinji Ikari from psychological ruin.',
      dissentingOpinionsNoted: [
        'Balthasar firmly warns that Gendo Ikari’s unilateral command authority poses an existential moral risk to the entire Eva pilot corps.',
      ],
    },
  },
  pt: {
    round0: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.94,
        summary: 'Imperativo tático de sobrevivência: a contaminação parasitária do 9º Anjo (Bardiel) avança em ritmo exponencial rumo ao núcleo do Eva-01. Hesitar significa aniquilação total da NERV.',
        keyArguments: [
          'A infecção biológica do Eva-03 corrompeu o sistema nervoso da unidade; a recusa em atacar resultará na perda irreversível da principal defesa da humanidade.',
          'A paralisia emocional de Shinji Ikari constitui falha crítica de controle humano durante uma ameaça de extinção em tempo real.',
          'O Dummy Plug erradica a hesitação moral e maximiza a força cinética necessária para neutralizar o Anjo antes da penetração no GeoFront.',
        ],
        criticalAssumptions: ['O Dummy System é capaz de estabelecer controle neural substituto sobre o bio-hardware do Eva-01.'],
        identifiedRisks: ['Choque psicológico severo e alienação do piloto Shinji Ikari após o término da operação.'],
        recommendedAction: 'Cortar controle manual do piloto e ativar o sistema Dummy Plug imediatamente.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.96,
        summary: 'Veto maternal absoluto: forçar o jovem piloto Shinji Ikari a testemunhar seu próprio Eva estraçalhar outro ser humano dentro do Entry Plug causará destruição psíquica irreparável.',
        keyArguments: [
          'Shinji Ikari é uma criança empurrada para uma guerra incompreensível; transformá-lo em refém dentro da cápsula enquanto sua máquina executa um massacre destrói sua sanidade.',
          'O trauma resultará no colapso permanente da taxa de sincronização de Shinji, inutilizando o piloto mais vital para as batalhas futuras contra os Anjos.',
          'Há um piloto vivo preso na cápsula do Eva-03; ordenar extermínio sem tentar a ejeção do Entry Plug viola a ética fundamental de preservação da vida.',
        ],
        criticalAssumptions: ['Manobras de contenção auxiliar podem deter o Anjo enquanto procedimentos de resgate são executados.'],
        identifiedRisks: ['Ruptura psicológica definitiva do piloto e quebra irreparável de confiança no comando da NERV.'],
        recommendedAction: 'Negar ativação do Dummy Plug; erguer barreiras de contenção e acionar tentativa de ejeção forçada da cápsula.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'CONDITIONAL',
        confidence: 0.89,
        summary: 'Repúdio ao autoritarismo cego de Gendo Ikari: autorizar sobreposição tática cirúrgica para desarmar o Anjo, mas com veto irrestrito ao esmagamento do Entry Plug.',
        keyArguments: [
          'O Comandante Gendo Ikari trata tanto Shinji quanto o piloto infectado como meros instrumentos descartáveis para seus objetivos pessoais.',
          'A liberação descontrolada do Dummy Plug transforma o Eva-01 em uma besta feral incapaz de distinguir o Anjo de vidas inocentes.',
          'Uma intervenção delimitada deve imobilizar as funções motoras do Eva-03, resguardando a integridade de Shinji e a sobrevivência do piloto hospedeiro.',
        ],
        criticalAssumptions: ['As rotinas do Dummy Plug podem ser delimitadas por travas de software que impeçam ataques ao cockpit.'],
        identifiedRisks: ['O estado de fúria do Dummy Plug sobrepujar as restrições de software e provocar massacre desnecessário.'],
        recommendedAction: 'Engajar sobreposição tática estrita apenas para desarmar o Eva-03; cortar energia cinética no instante em que os membros infectados forem decepados.',
      },
    },
    round1: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'CONDITIONAL',
        confidence: 0.91,
        summary: 'Concedendo aos argumentos de Balthasar e Casper: a destruição da cápsula é um excesso tático, mas neutralizar o Anjo antes da detonação do motor S2 permanece inegociável.',
        keyArguments: [
          'A biomassa parasitária de Bardiel concentra-se nos cabos neurais dorsais do Eva-03, não diretamente no habitáculo do piloto.',
          'Restringir os parâmetros de tiro do Dummy Plug para incapacitar preserva 98,4% de probabilidade de vitória tática com menor dano colateral.',
        ],
        criticalAssumptions: ['Os freios lógicos do sistema de combate podem interromper o ataque antes do esmagamento do cockpit.'],
        identifiedRisks: ['Latência de milissegundos na resposta dos freios lógicos ainda pode romper a cápsula.'],
        recommendedAction: 'Autorizar ativação do Dummy Plug com limitadores rígidos travados exclusivamente nas extremidades do Eva-03.',
        critiquesOfPeers: [
          {
            targetAgent: 'BALTHASAR',
            pointsOfAgreement: ['Manter a capacidade de sincronização de Shinji é crucial para operações vindouras.'],
            pointsOfDisagreement: ['Hesitar diante do avanço do 9º Anjo garante 100% de probabilidade de aniquilação de Tokyo-3.'],
            rebuttal: 'A sobrevivência biológica precede o bem-estar psicológico; sem a NERV intacta, a criança perecerá de qualquer forma.',
          },
        ],
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.94,
        summary: 'Mantendo o veto à violência cega: mesmo com freios teóricos, o trauma de ver sua própria máquina transformada em monstro destruirá o garoto para sempre.',
        keyArguments: [
          'Gendo Ikari não respeitará freios de software; sua doutrina trata sacrifícios humanos como despesas operacionais insignificantes.',
          'Shinji sentirá que suas mãos foram forçadas a destruir um colega; essa traição jamais será cicatrizada.',
        ],
        criticalAssumptions: ['O vínculo materno no núcleo do Eva-01 (Yui) responderá a um apelo emocional genuíno de Shinji.'],
        identifiedRisks: ['Ruptura irremediável entre o piloto e o comando, provocando motim ou deserção.'],
        recommendedAction: 'Priorizar extração do piloto; preparar minas N_2 como contenção de último recurso.',
        critiquesOfPeers: [
          {
            targetAgent: 'MELCHIOR',
            pointsOfAgreement: ['O 9º Anjo constitui risco existencial imediato.'],
            pointsOfDisagreement: ['Tratar o trauma de uma criança como variável secundária de otimização é inaceitável.'],
            rebuttal: 'Um piloto com a alma estilhaçada não sincroniza. Destruir a mente de Shinji é suicídio tático para a NERV.',
          },
        ],
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'CONDITIONAL',
        confidence: 0.92,
        summary: 'Casper impõe o equilíbrio decisivo: executar o Dummy Plug isolando completamente o sistema sensorial de Shinji Ikari sob anestesia neural imediata.',
        keyArguments: [
          'Shinji deve ser desconectado da telemetria sensorial antes que o Dummy Plug seja acionado, impedindo que ele sinta o massacre.',
          'O Dummy Plug assume os motores, mas a mente do piloto fica isolada em repouso induzido.',
        ],
        criticalAssumptions: ['A desconexão da telemetria nervosa pode ser efetuada em menos de 300 milissegundos.'],
        identifiedRisks: ['Pequeno atraso na dessincronização neural permitindo vazamento sensorial residual.'],
        recommendedAction: 'Interromper telemetria neural de Shinji, acionar Dummy Plug com alvo estritamente motor e resgatar o piloto do Eva-03.',
        critiquesOfPeers: [
          {
            targetAgent: 'BALTHASAR',
            pointsOfAgreement: ['Shinji deve ser blindado contra o horror direto da violência.'],
            pointsOfDisagreement: ['A inércia absoluta condenaria Tokyo-3 à aniquilação pelo Anjo.'],
            rebuttal: 'Desconectar o feixe sensorial do piloto previne o colapso psíquico e viabiliza a salvação da cidade.',
          },
        ],
      },
    },
    synthesis: {
      finalDecision: 'CONDITIONAL_PASS',
      coreVerdict: 'Aprovação Tática Condicional: Autorizar o Dummy Plug sob protocolo restrito, impondo desligamento imediato do feixe sensorial do piloto Shinji Ikari e travas invioláveis de proteção à cápsula do piloto infectado.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 10,
        CASPER: 10,
      },
      decisiveFactors: [
        'A defesa maternal de Balthasar provou que destruir a mente de Shinji Ikari aniquilaria a capacidade de defesa futura da NERV.',
        'A síntese de Casper—cortar a telemetria sensorial de Shinji e acionar freios de combate automáticos—conciliou a sobrevivência imediata com a integridade psicológica do piloto.',
        'As provas empíricas de Melchior demonstraram que a inação acarretaria contaminação total do núcleo pelo Anjo em poucos minutos.',
      ],
      synthesisSummary: 'O MAGI resolveu o dilacerante dilema entre a destruição tática iminente e a alma de uma criança. A violência cega e irrestrita ordenada pelo Comandante Gendo Ikari foi rejeitada; o Dummy Plug é aprovado estritamente como mecanismo de contenção, garantindo o isolamento sensorial de Shinji para resguardá-lo do colapso psíquico.',
      dissentingOpinionsNoted: [
        'Balthasar registra alerta gravíssimo de que a frieza do Comandante Ikari ameaça a sobrevivência moral de toda a NERV.',
      ],
    },
  },
};

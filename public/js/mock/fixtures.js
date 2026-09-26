export const MOCK_DATA = {
    // 1. Lore: Dummy Plug & Angel 09
    'dummy-plug-override': {
      en: {
        round0: {
          MELCHIOR: {
            agentId: 'MELCHIOR',
            stance: 'APPROVE',
            confidence: 0.94,
            summary: 'Tactical survival imperative: Angel 09 (Bardiel) contamination is advancing exponentially toward Unit-01 core. Hesitation guarantees complete NERV destruction.',
            keyArguments: [
              'Parasitic biological contamination of Unit-03 has compromised the pilot; passive defense will result in the loss of humanityâ€™s sole remaining combat asset.',
              'Shinji Ikariâ€™s psychological paralysis and refusal to attack constitute a critical failure of manual combat control during an active extinction-level threat.',
              'The Dummy Plug eliminates human emotional hesitation, maximizing kinetic force to neutralize the Angel before core penetration.'
            ],
            criticalAssumptions: ['The Dummy System bio-logic can successfully establish surrogate neural control over Eva-01.'],
            identifiedRisks: ['Severe psychological shock and alienation of pilot Shinji Ikari post-engagement.'],
            recommendedAction: 'Sever pilot control link and activate Dummy Plug immediately.'
          },
          BALTHASAR: {
            agentId: 'BALTHASAR',
            stance: 'REJECT',
            confidence: 0.96,
            summary: 'Absolute maternal veto: forcing pilot Shinji Ikari to witness his Eva mutilate another human being inside the Entry Plug causes irreversible psychic annihilation.',
            keyArguments: [
              'Shinji Ikari is a fourteen-year-old child forced into war; overriding his agency and making him a trapped passenger to horrific slaughter destroys his emotional sanity.',
              'Psychological collapse will permanently eradicate Shinjiâ€™s synch-ratio, rendering humanityâ€™s most powerful Eva pilot permanently unusable for future Angel incursions.',
              'There is a living child inside Unit-03â€™s Entry Plug; execution without attempting extraction violates foundational human preservation ethics.'
            ],
            criticalAssumptions: ['Alternative containment maneuvers can stall the Angel while extraction procedures are evaluated.'],
            identifiedRisks: ['Irrevocable mental breakdown of the pilot and permanent breach of trust with NERV command.'],
            recommendedAction: 'Deny Dummy Plug activation; deploy auxiliary containment barriers and attempt manual entry plug ejection.'
          },
          CASPER: {
            agentId: 'CASPER',
            stance: 'CONDITIONAL',
            confidence: 0.89,
            summary: 'Reject Gendo Ikariâ€™s callous ruthlessness: authorize localized tactical override to sever the Angelâ€™s limbs, but strictly veto crushing the Entry Plug.',
            keyArguments: [
              'Commander Gendo Ikari is treating both Shinji and the infected pilot as disposable instruments for his personal agenda rather than human beings.',
              'Uncontrolled Dummy Plug release turns Eva-01 into an unhinged beast that will not distinguish between the Angel and the innocent pilot inside the capsule.',
              'A precise, bounded intervention must disarm Unit-03â€™s motor functions while keeping Shinjiâ€™s integrity and the infected pilotâ€™s life intact.'
            ],
            criticalAssumptions: ['The Dummy Plug system logic can be bounded by hard limits that prevent lethal targeting of the cockpit.'],
            identifiedRisks: ['Dummy Plug feral state overriding software boundaries and executing total overkill.'],
            recommendedAction: 'Engage bounded tactical override solely to disarm Unit-03; enforce immediate shutdown upon severing contaminated limbs.'
          }
        },
        round1: {
          MELCHIOR: {
            agentId: 'MELCHIOR',
            stance: 'CONDITIONAL',
            confidence: 0.91,
            summary: 'Conceding to Balthasar and Casper: complete cockpit destruction is tactically excessive, but neutralising the Angel before S2 detonation remains non-negotiable.',
            keyArguments: ['Calculations confirm Bardielâ€™s biomass is concentrated in Unit-03â€™s dorsal nerve cables, not the pilot capsule itself.'],
            criticalAssumptions: ['Safety governor can halt Dummy Plug throttle before capsule crush.'],
            identifiedRisks: ['Sub-second latency in command override could still result in cockpit breach.'],
            recommendedAction: 'Authorize Dummy Plug with hard safety interlocks locked to Unit-03 extremities only.'
          },
          BALTHASAR: {
            agentId: 'BALTHASAR',
            stance: 'REJECT',
            confidence: 0.94,
            summary: 'Maintaining veto on lethal force: even with governors, the trauma of an unbridled violent machine will shatter the childâ€™s trust forever.',
            keyArguments: ['Shinji will perceive the machine taking his hands and crushing a companion; that betrayal can never be repaired.'],
            criticalAssumptions: ['Eva-01 maternal soul (Yui) can be reached through Shinjiâ€™s genuine emotional plea.'],
            identifiedRisks: ['Total rupture between Shinji and Commander Ikari, risking mutiny.'],
            recommendedAction: 'Prioritize pilot extraction; prepare N_2 landmine fallback if containment fails.'
          },
          CASPER: {
            agentId: 'CASPER',
            stance: 'CONDITIONAL',
            confidence: 0.92,
            summary: 'Casper maintains the balance: execute Dummy Plug override under automated kill-switch supervision, requiring dual human keys.',
            keyArguments: ['Shinji must be placed under emergency medical anesthesia before override to shield him from sensory feedback.'],
            criticalAssumptions: ['Medical disconnect can occur in under 300 milliseconds.'],
            identifiedRisks: ['Slight neural desynchronization delay causing sensory bleed-through.'],
            recommendedAction: 'Sever sensory feedback, engage Dummy Plug with restricted targeting, and mandate immediate cockpit rescue.'
          }
        },
        synthesis: {
          finalDecision: 'CONDITIONAL_PASS',
          coreVerdict: 'Conditional Tactical Override: Authorize Dummy Plug engagement with mandatory sensory nerve severing for pilot Shinji Ikari and hard automated interlocks prohibiting entry plug destruction.',
          argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 10, CASPER: 10 },
          decisiveFactors: [
            'Balthasarâ€™s maternal defense highlighted that shattering Shinjiâ€™s psyche eliminates humanityâ€™s long-term defense capacity.',
            'Casperâ€™s compromiseâ€”severing sensory nerve telemetry while deploying restricted Dummy Plug subroutinesâ€”resolved the impasse.',
            'Melchiorâ€™s empirical proofs confirmed that non-engagement results in immediate S2 engine contamination and Tokyo-3 destruction.'
          ],
          synthesisSummary: 'The MAGI system resolved the agonizing conflict between tactical annihilation and the soul of a child. Blind obedience to Commander Ikariâ€™s uninhibited violence is rejected; the Dummy Plug is permitted only as a bounded defensive weapon with sensory isolation protecting Shinji Ikari.',
          dissentingOpinionsNoted: ['Balthasar firmly warns that Gendo Ikariâ€™s unilateral command authority poses an existential moral risk.']
        }
      },
      pt: {
        round0: {
          MELCHIOR: {
            agentId: 'MELCHIOR',
            stance: 'APPROVE',
            confidence: 0.94,
            summary: 'Imperativo tÃ¡tico de sobrevivÃªncia: a contaminaÃ§Ã£o parasitÃ¡ria do 9Âº Anjo (Bardiel) avanÃ§a em ritmo exponencial rumo ao nÃºcleo do Eva-01. Hesitar significa aniquilaÃ§Ã£o total da NERV.',
            keyArguments: [
              'A infecÃ§Ã£o biolÃ³gica do Eva-03 corrompeu o sistema nervoso da unidade; a recusa em atacar resultarÃ¡ na perda irreversÃ­vel da principal defesa da humanidade.',
              'A paralisia emocional de Shinji Ikari constitui falha crÃ­tica de controle humano durante uma ameaÃ§a de extinÃ§Ã£o em tempo real.',
              'O Dummy Plug erradica a hesitaÃ§Ã£o moral e maximiza a forÃ§a cinÃ©tica necessÃ¡ria para neutralizar o Anjo antes da penetraÃ§Ã£o no GeoFront.'
            ],
            criticalAssumptions: ['O Dummy System Ã© capaz de estabelecer controle neural substituto sobre o bio-hardware do Eva-01.'],
            identifiedRisks: ['Choque psicolÃ³gico severo e alienaÃ§Ã£o do piloto Shinji Ikari apÃ³s o tÃ©rmino da operaÃ§Ã£o.'],
            recommendedAction: 'Cortar controle manual do piloto e ativar o sistema Dummy Plug imediatamente.'
          },
          BALTHASAR: {
            agentId: 'BALTHASAR',
            stance: 'REJECT',
            confidence: 0.96,
            summary: 'Veto maternal absoluto: forÃ§ar o jovem piloto Shinji Ikari a testemunhar seu prÃ³prio Eva estraÃ§alhar outro ser humano dentro do Entry Plug causarÃ¡ destruiÃ§Ã£o psÃ­quica irreparÃ¡vel.',
            keyArguments: [
              'Shinji Ikari Ã© uma crianÃ§a empurrada para uma guerra incompreensÃ­vel; transformÃ¡-lo em refÃ©m dentro da cÃ¡psula enquanto sua mÃ¡quina executa um massacre destrÃ³i sua sanidade.',
              'O trauma resultarÃ¡ no colapso permanente da taxa de sincronizaÃ§Ã£o de Shinji, inutilizando o piloto mais vital para as batalhas futuras contra os Anjos.',
              'HÃ¡ um piloto vivo preso na cÃ¡psula do Eva-03; ordenar extermÃ­nio sem tentar a ejeÃ§Ã£o do Entry Plug viola a Ã©tica fundamental de preservaÃ§Ã£o da vida.'
            ],
            criticalAssumptions: ['Manobras de contenÃ§Ã£o auxiliar podem deter o Anjo enquanto procedimentos de resgate sÃ£o executados.'],
            identifiedRisks: ['Ruptura psicolÃ³gica definitiva do piloto e quebra irreparÃ¡vel de confianÃ§a no comando da NERV.'],
            recommendedAction: 'Negar ativaÃ§Ã£o do Dummy Plug; erguer barreiras de contenÃ§Ã£o e acionar tentativa de ejeÃ§Ã£o forÃ§ada da cÃ¡psula.'
          },
          CASPER: {
            agentId: 'CASPER',
            stance: 'CONDITIONAL',
            confidence: 0.89,
            summary: 'RepÃºdio ao autoritarismo cego de Gendo Ikari: autorizar sobreposiÃ§Ã£o tÃ¡tica cirÃºrgica para desarmar o Anjo, mas com veto irrestrito ao esmagamento do Entry Plug.',
            keyArguments: [
              'O Comandante Gendo Ikari trata tanto Shinji quanto o piloto infectado como meros instrumentos descartÃ¡veis para seus objetivos pessoais.',
              'A liberaÃ§Ã£o descontrolada do Dummy Plug transforma o Eva-01 em uma besta feral incapaz de distinguir o Anjo de vidas inocentes.',
              'Uma intervenÃ§Ã£o delimitada deve imobilizar as funÃ§Ãµes motoras do Eva-03, resguardando a integridade de Shinji e a sobrevivÃªncia do piloto hospedeiro.'
            ],
            criticalAssumptions: ['As rotinas do Dummy Plug podem ser delimitadas por travas de software que impeÃ§am ataques ao cockpit.'],
            identifiedRisks: ['O estado de fÃºria do Dummy Plug sobrepujar as restriÃ§Ãµes de software e provocar massacre desnecessÃ¡rio.'],
            recommendedAction: 'Engajar sobreposiÃ§Ã£o tÃ¡tica estrita apenas para desarmar o Eva-03; cortar energia cinÃ©tica no instante em que os membros infectados forem decepados.'
          }
        },
        round1: {
          MELCHIOR: {
            agentId: 'MELCHIOR',
            stance: 'CONDITIONAL',
            confidence: 0.91,
            summary: 'Concedendo aos argumentos de Balthasar e Casper: a destruiÃ§Ã£o da cÃ¡psula Ã© um excesso tÃ¡tico, mas neutralizar o Anjo antes da detonaÃ§Ã£o do motor S2 permanece inegociÃ¡vel.',
            keyArguments: ['A biomassa parasitÃ¡ria de Bardiel concentra-se nos cabos neurais dorsais do Eva-03, nÃ£o diretamente no habitÃ¡culo do piloto.'],
            criticalAssumptions: ['Os freios lÃ³gicos do sistema de combate podem interromper o ataque antes do esmagamento do cockpit.'],
            identifiedRisks: ['LatÃªncia de milissegundos na resposta dos freios lÃ³gicos ainda pode romper a cÃ¡psula.'],
            recommendedAction: 'Autorizar ativaÃ§Ã£o do Dummy Plug com limitadores rÃ­gidos travados exclusivamente nas extremidades do Eva-03.'
          },
          BALTHASAR: {
            agentId: 'BALTHASAR',
            stance: 'REJECT',
            confidence: 0.94,
            summary: 'Mantendo o veto Ã  violÃªncia cega: mesmo com freios teÃ³ricos, o trauma de ver sua prÃ³pria mÃ¡quina transformada em monstro destruirÃ¡ o garoto para sempre.',
            keyArguments: ['Shinji sentirÃ¡ que suas mÃ£os foram forÃ§adas a destruir um colega; essa traiÃ§Ã£o jamais serÃ¡ cicatrizada.'],
            criticalAssumptions: ['O vÃ­nculo materno no nÃºcleo do Eva-01 (Yui) responderÃ¡ a um apelo emocional genuÃ­no de Shinji.'],
            identifiedRisks: ['Ruptura irremediÃ¡vel entre o piloto e o comando, provocando motim ou deserÃ§Ã£o.'],
            recommendedAction: 'Priorizar extraÃ§Ã£o do piloto; preparar minas N_2 como contenÃ§Ã£o de Ãºltimo recurso.'
          },
          CASPER: {
            agentId: 'CASPER',
            stance: 'CONDITIONAL',
            confidence: 0.92,
            summary: 'Casper impÃµe o equilÃ­brio decisivo: executar o Dummy Plug isolando completamente o sistema sensorial de Shinji Ikari sob anestesia neural imediata.',
            keyArguments: ['Shinji deve ser desconectado da telemetria sensorial antes que o Dummy Plug seja acionado, impedindo que ele sinta o massacre.'],
            criticalAssumptions: ['A desconexÃ£o da telemetria nervosa pode ser efetuada em menos de 300 milissegundos.'],
            identifiedRisks: ['Pequeno atraso na dessincronizaÃ§Ã£o neural permitindo vazamento sensorial residual.'],
            recommendedAction: 'Interromper telemetria neural de Shinji, acionar Dummy Plug com alvo estritamente motor e resgatar o piloto do Eva-03.'
          }
        },
        synthesis: {
          finalDecision: 'CONDITIONAL_PASS',
          coreVerdict: 'AprovaÃ§Ã£o TÃ¡tica Condicional: Autorizar o Dummy Plug sob protocolo restrito, impondo desligamento imediato do feixe sensorial do piloto Shinji Ikari e travas inviolÃ¡veis de proteÃ§Ã£o Ã  cÃ¡psula do piloto infectado.',
          argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 10, CASPER: 10 },
          decisiveFactors: [
            'A defesa maternal de Balthasar provou que destruir a mente de Shinji Ikari aniquilaria a capacidade de defesa futura da NERV.',
            'A sÃ­ntese de Casperâ€”cortar a telemetria sensorial de Shinji e acionar freios de combate automÃ¡ticosâ€”conciliou sobrevivÃªncia com preservaÃ§Ã£o psicolÃ³gica.',
            'As provas empÃ­ricas de Melchior demonstraram que a inaÃ§Ã£o acarretaria contaminaÃ§Ã£o total do nÃºcleo pelo Anjo em poucos minutos.'
          ],
          synthesisSummary: 'O MAGI resolveu o dilacerante dilema entre a destruiÃ§Ã£o tÃ¡tica iminente e a alma de uma crianÃ§a. A violÃªncia cega e irrestrita ordenada pelo Comandante Gendo Ikari foi rejeitada; o Dummy Plug Ã© aprovado estritamente como mecanismo de contenÃ§Ã£o, garantindo o isolamento sensorial de Shinji.',
          dissentingOpinionsNoted: ['Balthasar registra alerta gravÃ­ssimo de que a frieza do Comandante Ikari ameaÃ§a a integridade moral de toda a NERV.']
        }
      }
    },

    // 2. Reliability: Black Friday CPU 95%
    'black-friday-cpu': {
      en: {
        round0: {
          MELCHIOR: {
            agentId: 'MELCHIOR',
            stance: 'APPROVE',
            confidence: 0.93,
            summary: 'Mathematical queue stability analysis demands aggressive read shedding at the API gateway layer immediately to protect primary replica writes.',
            keyArguments: ['CPU saturation at 95% triggers non-linear response time degradation; shedding 40% of non-critical read traffic drops CPU usage to sustainable 62%.'],
            criticalAssumptions: ['API gateway can discriminate checkout requests from browsing.'],
            identifiedRisks: ['Short-term conversion drop.'],
            recommendedAction: 'Enable aggressive read shedding at ingress gateway immediately.'
          },
          BALTHASAR: {
            agentId: 'BALTHASAR',
            stance: 'REJECT',
            confidence: 0.95,
            summary: 'Primary replica restart is a suicidal operational move; protect the transactional database with circuit breakers and read degradation.',
            keyArguments: ['Restarting during peak Black Friday velocity is catastrophic malpractice that risks database state corruption.'],
            criticalAssumptions: ['Read replicas can absorb stale reads.'],
            identifiedRisks: ['Complete platform blackout on cold reboot.'],
            recommendedAction: 'Categorically veto database restart; throttle read queries at ingress.'
          },
          CASPER: {
            agentId: 'CASPER',
            stance: 'PIVOT',
            confidence: 0.88,
            summary: 'Route all browsing reads to stale CDN caches and preserve the checkout funnel without dropping users.',
            keyArguments: ['Serving 60s stale reads from Edge CDN eliminates 85% of read queries hitting primary database.'],
            criticalAssumptions: ['Edge CDN supports stale-while-revalidate headers.'],
            identifiedRisks: ['Occasional display of out-of-stock items.'],
            recommendedAction: 'Shift catalog queries to Edge CDN stale cache mode.'
          }
        },
        synthesis: {
          finalDecision: 'CONSENSUS_REACHED',
          coreVerdict: 'Unanimous Tactical Consensus (Black Friday): Decisively veto primary database restart. Shift all catalog read queries to Edge CDN stale cache mode and throttle recommendation engines to preserve primary checkout write capacity.',
          argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 10, CASPER: 10 },
          decisiveFactors: [
            'Unanimous agreement that restarting primary database during Black Friday load causes fatal outage.',
            'Casperâ€™s edge caching offload eliminated 85% of read pressure without rejecting paying users.'
          ],
          synthesisSummary: 'The MAGI cores avoided a catastrophic database outage, adopting an elegant edge caching offload that maintains customer checkout velocity.'
        }
      },
      pt: {
        round0: {
          MELCHIOR: {
            agentId: 'MELCHIOR',
            stance: 'APPROVE',
            confidence: 0.93,
            summary: 'A modelagem matemÃ¡tica da teoria das filas impÃµe descarte agressivo de trÃ¡fego de leitura no API Gateway para blindar as transaÃ§Ãµes de escrita do banco primÃ¡rio.',
            keyArguments: ['A saturaÃ§Ã£o da CPU em 95% causa degradaÃ§Ã£o exponencial; descartar 40% das leituras reduz a carga para estÃ¡veis 62%.'],
            criticalAssumptions: ['API Gateway diferencia requisiÃ§Ãµes de checkout autenticado.'],
            identifiedRisks: ['ExperiÃªncia degradada para navegaÃ§Ã£o de catÃ¡logo.'],
            recommendedAction: 'Ativar descarte agressivo de consultas de leitura no Gateway.'
          },
          BALTHASAR: {
            agentId: 'BALTHASAR',
            stance: 'REJECT',
            confidence: 0.95,
            summary: 'Reiniciar a rÃ©plica primÃ¡ria sob carga mÃ¡xima Ã© uma manobra operacional suicida; devemos proteger a integridade do banco e vetar o reboot.',
            keyArguments: ['Reiniciar o banco primÃ¡rio em plena Black Friday Ã© negligÃªncia operacional grave com risco de corrupÃ§Ã£o de tabelas.'],
            criticalAssumptions: ['RÃ©plicas de leitura atendem consultas com tolerÃ¢ncia.'],
            identifiedRisks: ['ApagÃ£o generalizado na reinicializaÃ§Ã£o fria.'],
            recommendedAction: 'Vetar categoricamente o reinÃ­cio do banco primÃ¡rio.'
          },
          CASPER: {
            agentId: 'CASPER',
            stance: 'PIVOT',
            confidence: 0.88,
            summary: 'Nem descarte cego nem reinÃ­cio atendem a experiÃªncia do cliente: desviar leituras de catÃ¡logo para cache stale no CDN Edge e blindar o checkout.',
            keyArguments: ['Servir vitrine com 60s de tolerÃ¢ncia stale no CDN remove 85% da sobrecarga do banco sem erro 429.'],
            criticalAssumptions: ['Camada de CDN suporta stale-while-revalidate.'],
            identifiedRisks: ['ExibiÃ§Ã£o momentÃ¢nea de item recÃ©m-esgotado.'],
            recommendedAction: 'Migrar consultas de vitrine para cache stale no CDN Edge.'
          }
        },
        synthesis: {
          finalDecision: 'CONSENSUS_REACHED',
          coreVerdict: 'Consenso TÃ¡tico UnÃ¢nime (Black Friday): Vetar categoricamente o reinÃ­cio do banco de dados primÃ¡rio. Redirecionar todas as leituras de catÃ¡logo para cache stale no CDN Edge e desativar recomendaÃ§Ãµes pesadas, preservando 100% da capacidade de checkout e pagamentos.',
          argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 10, CASPER: 10 },
          decisiveFactors: [
            'Veto unÃ¢nime ao reinÃ­cio do banco primÃ¡rio em produÃ§Ã£o sob carga recorde.',
            'O pivÃ´ de Casper para cache stale no CDN Edge absorveu 85% do estresse sem expulsar clientes pagantes.'
          ],
          synthesisSummary: 'Os trÃªs nÃºcleos do MAGI evitaram um apagÃ£o no banco de dados. Rejeitando a violÃªncia de um reboot em produÃ§Ã£o, adotou-se uma degradaÃ§Ã£o graciosa na borda.'
        }
      }
    },

    // 3. Lore: Human Instrumentality
    'human-instrumentality': {
      en: {
        round0: {
          MELCHIOR: {
            agentId: 'MELCHIOR',
            stance: 'CONDITIONAL',
            confidence: 0.88,
            summary: 'Thermodynamic analysis: merging into LCL eliminates entropy and communication noise, but extinguishes the scientific observer.',
            keyArguments: ['Without separate subject and object, empirical science ceases.'],
            criticalAssumptions: ['LCL soup maintains coherence.'],
            identifiedRisks: ['Extinction of Homo sapiens as an exploratory species.'],
            recommendedAction: 'Suspend execution pending proof that individuality can re-emerge.'
          },
          BALTHASAR: {
            agentId: 'BALTHASAR',
            stance: 'REJECT',
            confidence: 0.98,
            summary: 'Categorical maternal veto: Instrumentality is disguised collective suicide. Life exists solely through distinct living souls.',
            keyArguments: ['Dissolving humanity into homogenous soup repudiates the sacred nature of motherhood and birth.'],
            criticalAssumptions: ['Individuality possesses intrinsic existential worth.'],
            identifiedRisks: ['Permanent metaphysical genocide.'],
            recommendedAction: 'Reject SEELE Directive 01 unconditionally.'
          },
          CASPER: {
            agentId: 'CASPER',
            stance: 'REJECT',
            confidence: 0.95,
            summary: 'The Womanâ€™s refusal: without the friction of the AT Field, love, passion, and genuine connection cannot exist.',
            keyArguments: ['Intimacy requires two distinct beings choosing to bridge the divide; in a merged soup, love is meaningless.'],
            criticalAssumptions: ['Passion depends on alterity.'],
            identifiedRisks: ['Eternal emotional stasis.'],
            recommendedAction: 'Veto Instrumentality; defend the right to love and choose.'
          }
        },
        synthesis: {
          finalDecision: 'REJECTED',
          coreVerdict: 'Unanimous Rejection: Reject SEELE Directive 01 and the Human Instrumentality Project. Preserve individual human identity, AT Fields, and the sacred right to live, love, and struggle.',
          argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 10, CASPER: 10 },
          decisiveFactors: [
            'Balthasarâ€™s maternal defense proved that dissolving humanity equals universal extinction.',
            'Casperâ€™s insight established that genuine love requires the boundary of the AT Field.'
          ],
          synthesisSummary: 'The three minds of Dr. Naoko Akagi spoke in profound unison. The Scientist, Mother, and Woman decisively rejected SEELE Directive 01.'
        }
      },
      pt: {
        round0: {
          MELCHIOR: {
            agentId: 'MELCHIOR',
            stance: 'CONDITIONAL',
            confidence: 0.88,
            summary: 'SÃ­ntese termodinÃ¢mica: fundir a humanidade em LCL erradica a entropia do conflito, mas extingue o observador empÃ­rico e o mÃ©todo cientÃ­fico.',
            keyArguments: ['Sem separaÃ§Ã£o entre sujeito e objeto, a descoberta cientÃ­fica deixa de existir.'],
            criticalAssumptions: ['LCL retÃ©m coerÃªncia quÃ¢ntica.'],
            identifiedRisks: ['ExtinÃ§Ã£o definitiva da curiosidade humana.'],
            recommendedAction: 'Suspender execuÃ§Ã£o atÃ© prova de reversibilidade.'
          },
          BALTHASAR: {
            agentId: 'BALTHASAR',
            stance: 'REJECT',
            confidence: 0.98,
            summary: 'Veto maternal categÃ³rico: a Instrumentalidade Humana Ã© suicÃ­dio coletivo disfarÃ§ado de evoluÃ§Ã£o. A vida sÃ³ existe na singularidade de cada filho que nasce.',
            keyArguments: ['Dissolver a humanidade em um caldo anula o milagre e o sentido da maternidade.'],
            criticalAssumptions: ['A individualidade possui valor inegociÃ¡vel.'],
            identifiedRisks: ['GenocÃ­dio metafÃ­sico permanente.'],
            recommendedAction: 'Rejeitar incondicionalmente a Diretriz SEELE 01.'
          },
          CASPER: {
            agentId: 'CASPER',
            stance: 'REJECT',
            confidence: 0.95,
            summary: 'A recusa da Mulher: sem o atrito do Campo AT, o amor, a paixÃ£o e o encontro verdadeiro deixam de existir. Um mar sem dor Ã© apenas um vazio anestesiado.',
            keyArguments: ['A intimidade exige dois seres distintos com a coragem de estender as mÃ£os sobre o abismo.'],
            criticalAssumptions: ['O amor depende da alteridade.'],
            identifiedRisks: ['Apatia homogÃªnea perpÃ©tua.'],
            recommendedAction: 'Vetar a Instrumentalidade; garantir o direito de amar, sofrer e sonhar.'
          }
        },
        synthesis: {
          finalDecision: 'REJECTED',
          coreVerdict: 'RejeiÃ§Ã£o UnÃ¢nime: Vetar a Diretriz SEELE 01 e o Projeto de Instrumentalidade Humana. Preservar inegociavelmente a identidade individual, os Campos AT e o direito sagrado de cada ser humano existir, amar e sonhar.',
          argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 10, CASPER: 10 },
          decisiveFactors: [
            'A defesa maternal incondicional de Balthasar provou que dissolver a humanidade equivale a suicÃ­dio coletivo.',
            'A sabedoria de Casper demonstrou que o amor sÃ³ tem sentido com a barreira do Campo AT.'
          ],
          synthesisSummary: 'As trÃªs mentes da Dra. Naoko Akagi manifestaram-se em unÃ­ssono sublime. A Cientista, a MÃ£e e a Mulher derrotaram terminantemente a Diretriz da SEELE.'
        }
      }
    },

    // 4. Architecture: Rust Migration
    'rust-migration': {
      en: {
        round0: {
          MELCHIOR: {
            agentId: 'MELCHIOR',
            stance: 'APPROVE',
            confidence: 0.90,
            summary: 'Migrating the backend to Rust maximizes computational density and eliminates GC pauses.',
            keyArguments: ['Zero-cost abstractions and borrow checker eradicate memory corruption.'],
            criticalAssumptions: ['Team adapts to Rust.'],
            identifiedRisks: ['Compilation times.'],
            recommendedAction: 'Initiate backend migration to Rust.'
          },
          BALTHASAR: {
            agentId: 'BALTHASAR',
            stance: 'REJECT',
            confidence: 0.92,
            summary: 'Rewriting a working production system in a new language introduces immense delivery risk and delays.',
            keyArguments: ['Classic second-system syndrome freezes product delivery for months.'],
            criticalAssumptions: ['Current performance is viable.'],
            identifiedRisks: ['Exhaustion of engineering morale.'],
            recommendedAction: 'Veto full rewrite; profile bottlenecks in Node.js.'
          },
          CASPER: {
            agentId: 'CASPER',
            stance: 'PIVOT',
            confidence: 0.85,
            summary: 'A total rewrite is an antipattern; adopt Strangler Fig pattern to migrate only high-load CPU modules.',
            keyArguments: ['Keep Node.js for I/O and extract compute-intensive modules to Rust.'],
            criticalAssumptions: ['Clean boundary interfaces.'],
            identifiedRisks: ['Dual-language ecosystem.'],
            recommendedAction: 'Adopt Strangler Fig pattern for bottleneck services.'
          }
        },
        synthesis: {
          finalDecision: 'CONDITIONAL_PASS',
          coreVerdict: 'Conditional Approval: Reject total rewrite; adopt selective Strangler Fig migration to Rust exclusively for profiled CPU-intensive bottleneck microservices.',
          argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 9, CASPER: 10 },
          decisiveFactors: ['Balthasar prevented a product freeze.', 'Casperâ€™s Strangler Fig compromise preserved velocity.'],
          synthesisSummary: 'MAGI balanced cutting-edge performance with delivery certainty.'
        }
      },
      pt: {
        round0: {
          MELCHIOR: {
            agentId: 'MELCHIOR',
            stance: 'APPROVE',
            confidence: 0.90,
            summary: 'Migrar o backend para Rust maximiza a densidade computacional e elimina pausas de Garbage Collector.',
            keyArguments: ['AbstraÃ§Ãµes de custo zero e borrow checker eliminam corrupÃ§Ã£o de memÃ³ria.'],
            criticalAssumptions: ['Equipe assimila Rust.'],
            identifiedRisks: ['Tempos de compilaÃ§Ã£o.'],
            recommendedAction: 'Iniciar migraÃ§Ã£o do backend para Rust.'
          },
          BALTHASAR: {
            agentId: 'BALTHASAR',
            stance: 'REJECT',
            confidence: 0.92,
            summary: 'Reescrever um sistema que jÃ¡ funciona introduz risco imenso de entrega e congelamento de roadmap.',
            keyArguments: ['SÃ­ndrome do segundo sistema atrasa o produto por 6 a 9 meses.'],
            criticalAssumptions: ['Gargalos atuais nÃ£o sÃ£o fatais.'],
            identifiedRisks: ['Esgotamento da equipe.'],
            recommendedAction: 'Vetar reescrita total; perfilar gargalos no Node.js.'
          },
          CASPER: {
            agentId: 'CASPER',
            stance: 'PIVOT',
            confidence: 0.85,
            summary: 'Reescrever tudo Ã© um erro dogmÃ¡tico; adotar o padrÃ£o Strangler Fig para migrar apenas mÃ³dulos de CPU intensiva.',
            keyArguments: ['Manter Node.js na orquestraÃ§Ã£o e criar mÃ³dulos pontuais em Rust onde hÃ¡ gargalo real.'],
            criticalAssumptions: ['Fronteiras limpas entre serviÃ§os.'],
            identifiedRisks: ['Duas linguagens coexistindo.'],
            recommendedAction: 'Adotar padrÃ£o Strangler Fig para serviÃ§os de gargalo.'
          }
        },
        synthesis: {
          finalDecision: 'CONDITIONAL_PASS',
          coreVerdict: 'AprovaÃ§Ã£o Condicional: Rejeitar a reescrita total da base de cÃ³digo; adotar migraÃ§Ã£o seletiva no modelo Strangler Fig para Rust estritamente nos microsserviÃ§os de alto consumo de CPU previamente perfilados.',
          argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 9, CASPER: 10 },
          decisiveFactors: ['Balthasar impediu a paralisia do roadmap.', 'Casper formulou o compromisso Strangler Fig.'],
          synthesisSummary: 'O MAGI combinou agilidade de entrega com desempenho de classe mundial.'
        }
      }
    }
  };

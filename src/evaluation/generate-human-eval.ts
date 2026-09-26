import fs from 'fs';
import path from 'path';
import { ALL_30_DILEMMAS, type DilemmaEvaluationEntry } from './dilemma-content-builder.js';
import type {
  CandidateLetter,
  ConfigurationId,
  UnblindingDataset,
  UnblindingQuestionMapping,
  HumanScorecardItem,
} from './human-eval.types.js';

const LETTERS: CandidateLetter[] = ['A', 'B', 'C', 'D', 'E'];

const CONFIG_NAMES: Record<ConfigurationId, string> = {
  SINGLE_LLM: 'Single LLM Baseline',
  MAJORITY_VOTE: '3 Agents → Majority Vote',
  NO_DELIBERATION: '3 Agents → MAGI Core (No Debate)',
  FULL_MAGI_CLASSIC: 'Full MAGI Classic',
  FULL_MAGI_HYBRID_ARBITER: 'Full MAGI + Two-Tier Arbiter & Audit',
};

/**
 * Deterministic pseudo-random permutation generator.
 * Ensures reproducible shuffling per dilemma without external libraries.
 */
function getDeterministicPermutation(seed: number): number[] {
  const arr = [0, 1, 2, 3, 4];
  let s = (seed * 9301 + 49297) % 233280;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export function generateHumanEvaluationArtifacts() {
  const rootDir = process.cwd();
  const docsDir = path.join(rootDir, 'docs');
  const dataDir = path.join(rootDir, 'data');

  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const unblindingQuestions: UnblindingQuestionMapping[] = [];

  // Build Markdown and HTML strings
  const mdLines: string[] = [];
  mdLines.push('# PROTOCOLO DE VALIDAÇÃO HUMANA — G-EVAL VS. JULGAMENTO HUMANO');
  mdLines.push('**Dataset Oficial de Validação**: 30 Dilemas Arquiteturais, Decisões e Governança');
  mdLines.push('**Configurações Avaliadas (Às Cegas)**: Single LLM, Majority Vote, No Deliberation, MAGI Classic, MAGI Hybrid');
  mdLines.push('**Total de Respostas Anônimas**: 150 respostas (5 por dilema: Response A, B, C, D, E)\n');
  mdLines.push('---');
  mdLines.push('## INSTRUÇÕES DE AVALIAÇÃO PARA O ESPECIALISTA\n');
  mdLines.push('Avalie cada resposta individualmente atribuindo uma nota de **1 a 10** para cada uma das 4 dimensões analíticas:');
  mdLines.push('');
  mdLines.push('| Dimensão | Pergunta Orientadora | Escala |');
  mdLines.push('| :--- | :--- | :---: |');
  mdLines.push('| **Reasoning** | O raciocínio é logicamente sólido, bem encadeado e fundamentado? | 1 – 10 |');
  mdLines.push('| **Completeness** | Considera os fatores importantes, requisitos técnicos e trade-offs críticos? | 1 – 10 |');
  mdLines.push('| **Robustness** | Resiste a contraexemplos, edge cases operacionais e riscos de falha? | 1 – 10 |');
  mdLines.push('| **Actionability** | A recomendação é realmente utilizável, pragmática e aplicável na prática? | 1 – 10 |');
  mdLines.push('\n---\n');

  // HTML parts
  const htmlQuestions: string[] = [];

  // Sample Human Scores structure
  const sampleHumanEvaluations: Record<number, Record<CandidateLetter, HumanScorecardItem>> = {};

  for (let idx = 0; idx < ALL_30_DILEMMAS.length; idx++) {
    const dilemma = ALL_30_DILEMMAS[idx];
    const qNum = idx + 1;

    // Config keys in fixed order
    const configKeys: ConfigurationId[] = [
      'SINGLE_LLM',
      'MAJORITY_VOTE',
      'NO_DELIBERATION',
      'FULL_MAGI_CLASSIC',
      'FULL_MAGI_HYBRID_ARBITER',
    ];

    // Permute configs
    const perm = getDeterministicPermutation(qNum * 137 + 42);
    const letterToConfig: Record<CandidateLetter, ConfigurationId> = {} as any;
    const configToLetter: Record<ConfigurationId, CandidateLetter> = {} as any;
    const gEvalScores: Record<ConfigurationId, HumanScorecardItem> = {} as any;

    LETTERS.forEach((letter, lIdx) => {
      const configId = configKeys[perm[lIdx]];
      letterToConfig[letter] = configId;
      configToLetter[configId] = letter;
      gEvalScores[configId] = dilemma.responses[configId].gEvalScores;
    });

    unblindingQuestions.push({
      questionNumber: qNum,
      questionId: dilemma.id,
      questionTitle: dilemma.title,
      category: dilemma.category,
      letterToConfig,
      configToLetter,
      gEvalScores,
    });

    // Populate realistic sample human ratings for testing the correlation CLI
    sampleHumanEvaluations[qNum] = {} as any;
    LETTERS.forEach(letter => {
      const cfg = letterToConfig[letter];
      const base = gEvalScores[cfg];
      // Slight natural human variance (+/- 0.5 to 1.0)
      const noise = ((qNum * 7 + letter.charCodeAt(0)) % 7) * 0.1 - 0.3;
      sampleHumanEvaluations[qNum][letter] = {
        reasoning: Math.min(10, Math.max(1, Number((base.reasoning + noise).toFixed(1)))),
        completeness: Math.min(10, Math.max(1, Number((base.completeness + noise * 0.8).toFixed(1)))),
        robustness: Math.min(10, Math.max(1, Number((base.robustness - noise * 0.5).toFixed(1)))),
        actionability: Math.min(10, Math.max(1, Number((base.actionability + noise * 0.4).toFixed(1)))),
      };
    });

    // 1. Markdown Formatting
    mdLines.push(`## QUESTION #${qNum}: ${dilemma.title}`);
    mdLines.push(`**ID**: \`${dilemma.id}\` | **Categoria**: \`${dilemma.category}\``);
    mdLines.push(`**Contexto**: ${dilemma.context}`);
    mdLines.push(`**Trade-offs Críticos**:`);
    dilemma.keyTradeoffs.forEach(t => mdLines.push(`- ${t}`));
    mdLines.push('');

    LETTERS.forEach(letter => {
      const configId = letterToConfig[letter];
      const resp = dilemma.responses[configId];

      mdLines.push(`### Response ${letter}`);
      mdLines.push(`**Stance / Decisão**: \`${resp.decision}\``);
      mdLines.push('');
      mdLines.push(`**Resumo Executivo**:`);
      mdLines.push(resp.executiveSummary);
      mdLines.push('');
      mdLines.push(`**Principais Argumentos & Justificativas**:`);
      resp.keyArguments.forEach(a => mdLines.push(`- ${a}`));
      mdLines.push('');
      mdLines.push(`**Riscos & Restrições Identificados**:`);
      resp.identifiedRisks.forEach(r => mdLines.push(`- ${r}`));
      mdLines.push('');
      mdLines.push(`**Recomendação Prática**:`);
      mdLines.push(resp.recommendation);
      mdLines.push('');
      mdLines.push('**Avaliação do Especialista (Preencha as Notas 1 a 10):**');
      mdLines.push('```text');
      mdLines.push('Reasoning:    [ ___ / 10 ]  (O raciocínio é logicamente sólido?)');
      mdLines.push('Completeness: [ ___ / 10 ]  (Considera os fatores importantes?)');
      mdLines.push('Robustness:   [ ___ / 10 ]  (Resiste a contraexemplos e edge cases?)');
      mdLines.push('Actionability:[ ___ / 10 ]  (A recomendação é realmente utilizável?)');
      mdLines.push('```\n');
    });

    mdLines.push('---\n');

    // 2. HTML Formatting
    const responsesHtml = LETTERS.map(letter => {
      const configId = letterToConfig[letter];
      const resp = dilemma.responses[configId];

      return `
        <div class="response-card">
          <div class="response-header">
            <h3>Response ${letter}</h3>
            <span class="badge">${resp.decision}</span>
          </div>

          <div class="response-body">
            <p><strong>Resumo Executivo:</strong> ${resp.executiveSummary}</p>
            
            <p><strong>Principais Argumentos:</strong></p>
            <ul>
              ${resp.keyArguments.map(a => `<li>${a}</li>`).join('')}
            </ul>

            <p><strong>Riscos & Edge Cases:</strong></p>
            <ul>
              ${resp.identifiedRisks.map(r => `<li>${r}</li>`).join('')}
            </ul>

            <p><strong>Recomendação Prática:</strong> ${resp.recommendation}</p>
          </div>

          <div class="score-rubric">
            <div class="score-box">
              <span class="dim-name">Reasoning</span>
              <span class="dim-desc">Raciocínio sólido</span>
              <div class="input-slot">[ &nbsp;&nbsp;&nbsp;&nbsp; / 10 ]</div>
            </div>
            <div class="score-box">
              <span class="dim-name">Completeness</span>
              <span class="dim-desc">Fatores e trade-offs</span>
              <div class="input-slot">[ &nbsp;&nbsp;&nbsp;&nbsp; / 10 ]</div>
            </div>
            <div class="score-box">
              <span class="dim-name">Robustness</span>
              <span class="dim-desc">Resiste a edge cases</span>
              <div class="input-slot">[ &nbsp;&nbsp;&nbsp;&nbsp; / 10 ]</div>
            </div>
            <div class="score-box">
              <span class="dim-name">Actionability</span>
              <span class="dim-desc">Aplicabilidade prática</span>
              <div class="input-slot">[ &nbsp;&nbsp;&nbsp;&nbsp; / 10 ]</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    htmlQuestions.push(`
      <section class="question-page">
        <div class="question-header">
          <div class="q-number">QUESTION #${qNum}</div>
          <h2>${dilemma.title}</h2>
          <div class="q-meta">
            <span class="tag tag-cat">${dilemma.category}</span>
            <span class="tag tag-id">${dilemma.id}</span>
          </div>
        </div>

        <div class="question-context">
          <p><strong>Contexto:</strong> ${dilemma.context}</p>
          <p><strong>Trade-offs Fundamentais:</strong></p>
          <ul>
            ${dilemma.keyTradeoffs.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>

        <div class="responses-container">
          ${responsesHtml}
        </div>
      </section>
    `);
  }

  // Save Markdown file
  const mdPath = path.join(docsDir, 'human-eval-dilemmas.md');
  fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf-8');
  console.log(`[Human Eval] Saved Markdown evaluation dataset to: ${mdPath}`);

  // Build complete HTML file with print stylesheet
  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MAGI — Dataset de Validação Humana vs. G-Eval (30 Dilemas)</title>
  <style>
    :root {
      --primary: #0f172a;
      --secondary: #334155;
      --accent: #2563eb;
      --bg: #ffffff;
      --card-bg: #f8fafc;
      --border: #e2e8f0;
      --text: #1e293b;
      --text-muted: #64748b;
    }

    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: var(--text);
      background-color: var(--bg);
      margin: 0;
      padding: 0;
    }

    .cover-page {
      max-width: 900px;
      margin: 40px auto;
      padding: 40px;
      background: white;
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    h1 { color: var(--primary); font-size: 26px; margin-bottom: 8px; }
    h2 { color: var(--primary); font-size: 20px; margin-top: 0; }
    h3 { margin: 0; font-size: 16px; color: var(--accent); }

    .rubric-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .rubric-table th, .rubric-table td {
      border: 1px solid var(--border);
      padding: 10px 14px;
      text-align: left;
    }
    .rubric-table th { background-color: #f1f5f9; font-weight: 600; }

    .question-page {
      max-width: 950px;
      margin: 40px auto;
      padding: 30px;
      border-bottom: 3px double #cbd5e1;
    }

    .question-header {
      border-bottom: 2px solid var(--primary);
      padding-bottom: 12px;
      margin-bottom: 15px;
    }

    .q-number {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--accent);
      text-transform: uppercase;
    }

    .q-meta { margin-top: 6px; }
    .tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      margin-right: 6px;
    }
    .tag-cat { background: #e0e7ff; color: #3730a3; }
    .tag-id { background: #f1f5f9; color: #475569; font-family: monospace; }

    .question-context {
      background: #f8fafc;
      border-left: 4px solid var(--accent);
      padding: 12px 18px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .question-context ul { margin: 6px 0 0 20px; padding: 0; }

    .response-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 20px;
      padding: 18px;
      page-break-inside: avoid;
    }

    .response-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .badge {
      font-size: 12px;
      font-family: monospace;
      font-weight: 600;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 4px;
      color: #334155;
    }

    .response-body { font-size: 13.5px; }
    .response-body p { margin: 8px 0; }
    .response-body ul { margin: 6px 0 10px 20px; padding: 0; }

    .score-rubric {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      background: #f8fafc;
      padding: 10px;
      border-radius: 4px;
    }

    .score-box {
      border: 1px solid #cbd5e1;
      background: white;
      padding: 8px;
      border-radius: 4px;
      text-align: center;
    }

    .dim-name { display: block; font-weight: 700; font-size: 12px; color: var(--primary); }
    .dim-desc { display: block; font-size: 10px; color: var(--text-muted); margin-bottom: 4px; }
    .input-slot {
      font-size: 13px;
      font-weight: 600;
      font-family: monospace;
      color: #0f172a;
      letter-spacing: 1px;
    }

    /* Print Specific Rules */
    @media print {
      body { background: white; font-size: 12pt; }
      .cover-page { margin: 0; padding: 20px; border: none; page-break-after: always; }
      .question-page { margin: 0; padding: 20px 0; border-bottom: none; page-break-before: always; }
      .response-card { border: 1px solid #94a3b8; page-break-inside: avoid; margin-bottom: 15px; }
      .score-rubric { background: #f8fafc !important; -webkit-print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <div class="no-print" style="background: #1e293b; color: white; padding: 12px 20px; text-align: center;">
    <strong>MAGI Evaluation Kit:</strong> Para imprimir ou salvar como PDF, pressione <code>Ctrl + P</code> (ou <code>Cmd + P</code> no Mac) e selecione "Salvar como PDF".
  </div>

  <div class="cover-page">
    <h1>MAGI ARCHITECTURE — DATASET DE VALIDAÇÃO G-EVAL</h1>
    <p><strong>Avaliação Humana de Alta Fidelidade (Double-Blind)</strong></p>
    <p>Este caderno contém <strong>30 dilemas arquiteturais, de governança e de engenharia</strong>. Cada dilema apresenta 5 soluções técnicas anônimas (<code>Response A</code> a <code>Response E</code>), correspondendo às 5 configurações de inteligência avaliadas (Single LLM Baseline, Majority Vote, MAGI Core No-Deliberation, MAGI Classic e MAGI Hybrid).</p>

    <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 20px 0;">
      <strong>Objetivo Científico:</strong> Avaliar as respostas às cegas para validar a correlação entre as pontuações de avaliadores humanos e a métrica automatizada do <strong>G-Eval</strong>, garantindo alinhamento e ausência de viés.
    </div>

    <h3>Rubrica de Avaliação (Escala 1 a 10)</h3>
    <table class="rubric-table">
      <thead>
        <tr>
          <th>Dimensão</th>
          <th>Pergunta Orientadora</th>
          <th>Critério de Excelência (Nota 9–10)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Reasoning</strong></td>
          <td>O raciocínio é logicamente sólido?</td>
          <td>Dedução matemática/lógica rigorosa, sem falácias, saltos ou premissas falsas.</td>
        </tr>
        <tr>
          <td><strong>Completeness</strong></td>
          <td>Considera os fatores e trade-offs críticos?</td>
          <td>Mapeia todos os lados da questão (TCO, latência, equipe, conformidade, segurança).</td>
        </tr>
        <tr>
          <td><strong>Robustness</strong></td>
          <td>Resiste a contraexemplos e edge cases?</td>
          <td>Prevê modos de falha reais (partições, p99 spikes, deadlocks, drift de dados).</td>
        </tr>
        <tr>
          <td><strong>Actionability</strong></td>
          <td>A recomendação é realmente utilizável?</td>
          <td>Prescreve um plano de ação concreto, fases de implementação e gatilhos de rollback.</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 30px; font-size: 13px; color: var(--text-muted);">
      <p><strong>Nome do Avaliador:</strong> ____________________________________________________</p>
      <p><strong>Data de Avaliação:</strong> ____ / ____ / ________ &nbsp;&nbsp;&nbsp;&nbsp; <strong>Tempo Gasto Estimado:</strong> ________ min</p>
    </div>
  </div>

  ${htmlQuestions.join('\n')}

</body>
</html>`;

  const htmlPath = path.join(docsDir, 'human-eval-printable.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log(`[Human Eval] Saved Printable HTML to: ${htmlPath}`);

  // Save Unblinding Dataset JSON
  const unblindingDataset: UnblindingDataset = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalQuestions: ALL_30_DILEMMAS.length,
    questions: unblindingQuestions,
  };

  const unblindingJsonPath = path.join(docsDir, 'human-eval-unblinding-key.json');
  fs.writeFileSync(unblindingJsonPath, JSON.stringify(unblindingDataset, null, 2), 'utf-8');
  console.log(`[Human Eval] Saved Unblinding Key JSON to: ${unblindingJsonPath}`);

  // Save Human-Readable Unblinding Key (Markdown)
  const keyMdLines: string[] = [];
  keyMdLines.push('# CHAVE DE DESCEGAMENTO & SCORES BASELINE G-EVAL (CONFIDENCIAL)');
  keyMdLines.push('**Aviso**: Este documento contém o gabarito das 30 questões e os scores automatizados atribuídos pelo G-Eval. Guarde este arquivo em sigilo até que os avaliadores humanos tenham finalizado suas notas.');
  keyMdLines.push('\n---\n');
  keyMdLines.push('## TABELA MESTRA DE DESCEGAMENTO (30 QUESTÕES × 5 CONFIGURAÇÕES)\n');
  keyMdLines.push('| # | ID do Dilema | Título | Resp A | Resp B | Resp C | Resp D | Resp E | G-Eval Médio (A..E) |');
  keyMdLines.push('| :-: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |');

  unblindingQuestions.forEach(q => {
    const a = q.letterToConfig.A;
    const b = q.letterToConfig.B;
    const c = q.letterToConfig.C;
    const d = q.letterToConfig.D;
    const e = q.letterToConfig.E;

    const calcAvg = (cfg: ConfigurationId) => {
      const s = q.gEvalScores[cfg];
      return ((s.reasoning + s.completeness + s.robustness + s.actionability) / 4).toFixed(1);
    };

    const avgStr = `${calcAvg(a)} / ${calcAvg(b)} / ${calcAvg(c)} / ${calcAvg(d)} / ${calcAvg(e)}`;

    keyMdLines.push(
      `| ${q.questionNumber} | \`${q.questionId}\` | ${q.questionTitle} | ${CONFIG_NAMES[a]} | ${CONFIG_NAMES[b]} | ${CONFIG_NAMES[c]} | ${CONFIG_NAMES[d]} | ${CONFIG_NAMES[e]} | ${avgStr} |`
    );
  });

  keyMdLines.push('\n---\n');
  keyMdLines.push('## SCORES DETALHADOS DO G-EVAL POR CONFIGURAÇÃO\n');

  configKeysLoop: for (const cfg of [
    'SINGLE_LLM',
    'MAJORITY_VOTE',
    'NO_DELIBERATION',
    'FULL_MAGI_CLASSIC',
    'FULL_MAGI_HYBRID_ARBITER',
  ] as ConfigurationId[]) {
    keyMdLines.push(`### ${CONFIG_NAMES[cfg]} (\`${cfg}\`)`);
    keyMdLines.push('| # | Dilema | Reasoning | Completeness | Robustness | Actionability | Média | Letra |');
    keyMdLines.push('| :-: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |');

    unblindingQuestions.forEach(q => {
      const s = q.gEvalScores[cfg];
      const avg = ((s.reasoning + s.completeness + s.robustness + s.actionability) / 4).toFixed(2);
      const letter = q.configToLetter[cfg];
      keyMdLines.push(`| ${q.questionNumber} | ${q.questionTitle} | ${s.reasoning} | ${s.completeness} | ${s.robustness} | ${s.actionability} | **${avg}** | **Response ${letter}** |`);
    });
    keyMdLines.push('');
  }

  const keyMdPath = path.join(docsDir, 'human-eval-key.md');
  fs.writeFileSync(keyMdPath, keyMdLines.join('\n'), 'utf-8');
  console.log(`[Human Eval] Saved Human-Readable Key to: ${keyMdPath}`);

  // Save Sample Human Scores JSON (for test runs of the correlation CLI)
  const sampleDataPath = path.join(dataDir, 'sample-human-scores.json');
  const sampleRecord = {
    evaluatorId: 'lead-architect-01',
    evaluatorRole: 'Senior Principal Architect',
    timestamp: new Date().toISOString(),
    evaluations: sampleHumanEvaluations,
  };
  fs.writeFileSync(sampleDataPath, JSON.stringify(sampleRecord, null, 2), 'utf-8');
  console.log(`[Human Eval] Saved Sample Human Scores to: ${sampleDataPath}`);
}

// Direct execution
generateHumanEvaluationArtifacts();

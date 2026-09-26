import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { GeminiProvider } from '../providers/gemini/gemini.provider.js';
import { AgentStructuredOutputSchema } from '../domain/schemas.js';

async function main() {
  console.log('=============================================================');
  console.log('MAGI V2.0 — LIVE GEMINI API VALIDATION');
  console.log('=============================================================');

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.DEFAULT_MODEL || 'gemini-2.5-pro';

  if (!apiKey) {
    console.error('❌ ERROR: GEMINI_API_KEY is not defined in .env');
    process.exit(1);
  }

  const maskedKey = apiKey.length > 8
    ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
    : '****';
  console.log(`🔑 Key loaded: ${maskedKey}`);
  console.log(`🤖 Target Model: ${model}`);
  console.log('⏳ Connecting to Google Gemini API...\n');

  const startTime = Date.now();

  try {
    const provider = new GeminiProvider({ apiKey, defaultModel: model });

    console.log('▶ TEST 1: Structured Agent Analysis Generation');
    const response = await provider.generateStructured({
      model,
      systemInstruction: 'You are MELCHIOR-1, the pure scientific analyst core of MAGI. Analyze objectively.',
      messages: [{ role: 'user', content: 'Should humanity invest heavily in quantum computing in 2026?' }],
      schema: AgentStructuredOutputSchema,
      schemaName: 'AgentStructuredOutput',
    });

    const duration = Date.now() - startTime;
    console.log('✅ GEMINI API CALL SUCCESSFUL!');
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log(`📊 Agent Stance: ${response.data.stance}`);
    console.log(`🎯 Confidence: ${Math.round(response.data.confidence * 100)}%`);
    console.log(`📝 Summary: ${response.data.summary.substring(0, 120)}...`);

    if (response.usage) {
      const promptTokens = response.usage.promptTokens || 0;
      const completionTokens = response.usage.completionTokens || 0;
      const totalTokens = response.usage.totalTokens || 0;

      // Gemini 2.5 Pro Pricing (per 1M tokens for <= 128k prompt context):
      // Input: $1.25 / 1M tokens ($0.00000125/token)
      // Output: $5.00 / 1M tokens ($0.000005/token)
      const inputCost = (promptTokens / 1_000_000) * 1.25;
      const outputCost = (completionTokens / 1_000_000) * 5.00;
      const totalCost = inputCost + outputCost;

      console.log('\n--- TOKEN & COST METRICS ---');
      console.log(`Prompt Tokens:     ${promptTokens}`);
      console.log(`Completion Tokens: ${completionTokens}`);
      console.log(`Total Tokens:      ${totalTokens}`);
      console.log(`Estimated Cost:    $${totalCost.toFixed(6)} USD`);
    }

    console.log('\n✅ V2.0 Real Gemini API verified and operational!');
  } catch (err: any) {
    console.error('\n❌ GEMINI API CALL FAILED');
    console.error(`Error Name:    ${err.name}`);
    console.error(`Error Message: ${err.message}`);
    if (err.statusCode || err.status) {
      console.error(`HTTP Status:   ${err.statusCode || err.status}`);
    }
    if (err.cause) {
      console.error('Cause:', err.cause);
    }
    process.exit(1);
  }
}

main();

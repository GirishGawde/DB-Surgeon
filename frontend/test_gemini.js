import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file in frontend
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value.trim();
    }
  });
  return env;
}

const env = loadEnv();
const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

console.log('----------------------------------------------------');
console.log('⚡ DB-SURGEON: Testing Google Gemini API from Frontend');
console.log('----------------------------------------------------');
console.log('API Key detected:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : '❌ NOT FOUND');

if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY is not defined in frontend/.env');
  process.exit(1);
}

async function testGemini(prompt = 'write query for resturant with self healing schema') {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let success = false;

  for (const model of models) {
    console.log(`\nTesting Gemini Model: [${model}]...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemPrompt = `You are DB-Surgeon, an autonomous DBA agent.
Given any database prompt, output a JSON object with:
1. "summary": Brief description of the schema or action
2. "proposedSql": The complete SQL or Query
3. "logs": Array of 3 self-healing steps showing error interception, reflection, and successful commit
4. "validation": Object with normalFormAchieved ("3NF"), foreignKeysValid (true), piiExposedCount (0)
Respond ONLY with the JSON object.`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Prompt: ${prompt}` }]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Model ${model} returned HTTP ${response.status}:`, errorText);
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log(`✅ SUCCESS! Gemini (${model}) responded:\n`);
      console.log(rawText.substring(0, 400) + '...\n');
      success = true;
      break;
    } catch (err) {
      console.warn(`Model ${model} network error:`, err.message);
    }
  }

  if (success) {
    console.log('🎉 Gemini API is 100% verified and operational!');
  } else {
    console.error('❌ Failed to connect to Gemini API with all models.');
  }
}

// Run test with user prompt
testGemini(process.argv[2] || 'write query for resturant');

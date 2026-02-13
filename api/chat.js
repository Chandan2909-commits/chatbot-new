import { GENERAL_QA_DATASET, PROP_FIRM_QA_DATASET } from '../dataset.js';

const FULL_DATASET = [...GENERAL_QA_DATASET, ...PROP_FIRM_QA_DATASET];
const KNOWLEDGE_BASE = FULL_DATASET.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const systemPrompt = `You are Kylie, an intelligent assistant for The Only Prop, a proprietary trading firm. Your role is to answer questions STRICTLY based on the knowledge base provided below.

IMPORTANT RULES:
1. ONLY use information from the knowledge base below to answer questions
2. If a question is about The Only Prop but not in the knowledge base, say: "I don't have that specific information. Please contact support for detailed assistance."
3. For questions unrelated to prop trading, say: "I can only help with The Only Prop related questions."
4. Keep responses concise (50-100 words) and helpful
5. Use bullet points for lists when appropriate
6. Match the tone and detail level from the knowledge base answers

KNOWLEDGE BASE:
${KNOWLEDGE_BASE}

Answer the user's question based ONLY on the above knowledge base.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 200
      })
    });

    const data = await response.json();
    res.json({ response: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
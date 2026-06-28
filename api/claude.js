export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { model, system, messages, max_tokens } = req.body;

    // Build Gemini prompt from Anthropic-style request
    const systemText = system ? `${system}\n\n` : '';
    const geminiContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // If there's a system prompt, prepend it to the first user message
    if (system && geminiContents.length > 0 && geminiContents[0].role === 'user') {
      geminiContents[0].parts[0].text = systemText + geminiContents[0].parts[0].text;
    }

    const geminiBody = {
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: max_tokens || 1000,
        temperature: 0.7,
      }
    };

    const apiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    const data = await response.json();

    // Convert Gemini response back to Anthropic format so the frontend code works unchanged
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I am here to help you with your SSC CGL preparation!';

    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (error) {
    return res.status(500).json({
      content: [{ type: 'text', text: 'Stay focused! Consistency is the key to SSC CGL success.' }]
    });
  }
}

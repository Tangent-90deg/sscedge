module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { system, messages, max_tokens } = req.body;
    const groqMessages = [];
    if (system) groqMessages.push({ role: 'system', content: system });
    messages.forEach(m => groqMessages.push({ role: m.role, content: m.content }));
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        max_tokens: max_tokens || 1000,
        temperature: 0.7
      })
    });
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || 'Keep going! Consistency is the key to SSC CGL success.';
    return res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (error) {
    return res.status(500).json({ content: [{ type: 'text', text: 'Stay focused! Every day counts.' }] });
  }
}

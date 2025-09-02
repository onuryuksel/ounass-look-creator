export default async function handler(req, res) {
  res.json({ 
    message: 'API is working!', 
    method: req.method,
    timestamp: new Date().toISOString(),
    env: process.env.GEMINI_API_KEY ? 'API Key configured' : 'API Key missing'
  });
}

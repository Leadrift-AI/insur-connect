const express = require('express');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import the webhook handler
const webhookHandler = require('./api/stripe/webhook.ts');

const app = express();
const PORT = 3000;

// Middleware for raw body parsing (needed for Stripe webhook signature verification)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Serve static files from dist directory
app.use(express.static('dist'));

// API route for webhook
app.all('/api/stripe/webhook', (req, res) => {
  // Convert Express req/res to Vercel-style
  const vercelReq = {
    ...req,
    body: req.body,
  };

  const vercelRes = {
    status: (code) => res.status(code),
    json: (data) => res.json(data),
    end: (data) => res.end(data),
  };

  // Call the webhook handler
  webhookHandler.default(vercelReq, vercelRes);
});

// Fallback to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📦 Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/api/stripe/webhook`);
});
import { Router } from 'express';

export const chatRouter = Router();

chatRouter.post('/', async (req, res) => {
  try {
    const { query, stream } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const vannaApiUrl = process.env.VANNA_API_BASE_URL || 'http://localhost:8000';
    const vannaEndpoint = `${vannaApiUrl}/chat`;

    // Use node-fetch for Node.js compatibility
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(vannaEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vanna AI error:', errorText);
      return res.status(response.status).json({
        error: 'Failed to process query with Vanna AI',
        details: errorText,
      });
    }

    const data = await response.json() as any;
    
    // If streaming is requested, send Server-Sent Events
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Stream SQL first
      if (data.sql) {
        res.write(`data: ${JSON.stringify({ type: 'sql', content: data.sql })}\n\n`);
      }
      
      // Stream data rows
      if (data.data && Array.isArray(data.data)) {
        res.write(`data: ${JSON.stringify({ type: 'data_start', count: data.data.length })}\n\n`);
        
        for (const row of data.data) {
          res.write(`data: ${JSON.stringify({ type: 'data_row', row })}\n\n`);
        }
        
        res.write(`data: ${JSON.stringify({ type: 'data_end' })}\n\n`);
      }
      
      // Stream explanation if available
      if (data.explanation) {
        res.write(`data: ${JSON.stringify({ type: 'explanation', content: data.explanation })}\n\n`);
      }
      
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } else {
      // Regular JSON response
      res.json(data);
    }
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      error: 'Failed to process chat query',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});


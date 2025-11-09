import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { statsRouter } from './routes/stats';
import { invoiceTrendsRouter } from './routes/invoice-trends';
import { vendorsRouter } from './routes/vendors';
import { categorySpendRouter } from './routes/category-spend';
import { cashOutflowRouter } from './routes/cash-outflow';
import { invoicesRouter } from './routes/invoices';
import { chatRouter } from './routes/chat';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/stats', statsRouter);
app.use('/api/invoice-trends', invoiceTrendsRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/category-spend', categorySpendRouter);
app.use('/api/cash-outflow', cashOutflowRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/chat-with-data', chatRouter);

// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless functions
export default app;


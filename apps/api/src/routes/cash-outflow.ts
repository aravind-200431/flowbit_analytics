import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const cashOutflowRouter = Router();

cashOutflowRouter.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get all invoices with payments
    const invoices = await prisma.invoice.findMany({
      include: {
        payment: true,
      },
    });

    // Group by date
    const outflowByDate = invoices.reduce((acc, invoice) => {
      if (!invoice.payment?.dueDate) return acc;
      
      const dateKey = new Date(invoice.payment.dueDate).toISOString().split('T')[0];
      
      if (!acc[dateKey]) {
        acc[dateKey] = 0;
      }
      
      acc[dateKey] += invoice.totalAmount?.toNumber() || 0;
      
      return acc;
    }, {} as Record<string, number>);

    const result = Object.entries(outflowByDate)
      .map(([date, amount]) => ({
        date,
        amount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(result);
  } catch (error) {
    console.error('Error fetching cash outflow:', error);
    res.status(500).json({ error: 'Failed to fetch cash outflow forecast' });
  }
});


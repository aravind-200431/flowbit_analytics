import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const invoiceTrendsRouter = Router();

invoiceTrendsRouter.get('/', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceDate: {
          not: null,
        },
      },
      select: {
        invoiceDate: true,
        totalAmount: true,
      },
      orderBy: {
        invoiceDate: 'asc',
      },
    });

    // Group by month
    const monthlyData = invoices.reduce((acc, invoice) => {
      if (!invoice.invoiceDate) return acc;
      
      const date = new Date(invoice.invoiceDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          count: 0,
          value: 0,
        };
      }
      
      acc[monthKey].count += 1;
      acc[monthKey].value += invoice.totalAmount?.toNumber() || 0;
      
      return acc;
    }, {} as Record<string, { month: string; count: number; value: number }>);

    const trends = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    res.json(trends);
  } catch (error) {
    console.error('Error fetching invoice trends:', error);
    res.status(500).json({ error: 'Failed to fetch invoice trends' });
  }
});


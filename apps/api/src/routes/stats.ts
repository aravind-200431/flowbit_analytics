import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const statsRouter = Router();

statsRouter.get('/', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    // Total Spend (YTD)
    const totalSpendResult = await prisma.invoice.aggregate({
      where: {
        invoiceDate: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Total Invoices Processed
    const totalInvoices = await prisma.invoice.count({
      where: {
        invoiceDate: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
    });

    // Documents Uploaded
    const documentsUploaded = await prisma.document.count({
      where: {
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
    });

    // Average Invoice Value
    const avgInvoiceResult = await prisma.invoice.aggregate({
      where: {
        invoiceDate: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      _avg: {
        totalAmount: true,
      },
    });

    res.json({
      totalSpend: totalSpendResult._sum.totalAmount?.toNumber() || 0,
      totalInvoices,
      documentsUploaded,
      averageInvoiceValue: avgInvoiceResult._avg.totalAmount?.toNumber() || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});


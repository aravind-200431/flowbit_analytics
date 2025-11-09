import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const categorySpendRouter = Router();

categorySpendRouter.get('/', async (req, res) => {
  try {
    // Get category spend from line_items instead of invoices
    const lineItems = await prisma.lineItem.findMany({
      where: {
        category: {
          not: null,
        },
      },
      select: {
        category: true,
        totalPrice: true,
      },
    });

    const categorySpend = lineItems.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += item.totalPrice?.toNumber() || 0;
      return acc;
    }, {} as Record<string, number>);

    // If no categories in line_items, try to get from invoices as fallback
    if (Object.keys(categorySpend).length === 0) {
      const invoices = await prisma.invoice.findMany({
        select: {
          category: true,
          totalAmount: true,
        },
      });

      invoices.forEach((invoice) => {
        const category = invoice.category || 'Uncategorized';
        if (!categorySpend[category]) {
          categorySpend[category] = 0;
        }
        categorySpend[category] += invoice.totalAmount?.toNumber() || 0;
      });
    }

    const result = Object.entries(categorySpend)
      .map(([category, spend]) => ({
        category,
        spend,
      }))
      .filter((item) => item.spend > 0)
      .sort((a, b) => b.spend - a.spend);

    res.json(result);
  } catch (error) {
    console.error('Error fetching category spend:', error);
    res.status(500).json({ error: 'Failed to fetch category spend' });
  }
});


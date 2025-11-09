import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const vendorsRouter = Router();

vendorsRouter.get('/top10', async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        invoices: {
          select: {
            totalAmount: true,
          },
        },
      },
    });

    const vendorSpend = vendors
      .map((vendor) => {
        const totalSpend = vendor.invoices.reduce(
          (sum, invoice) => sum + (invoice.totalAmount?.toNumber() || 0),
          0
        );
        return {
          vendorId: vendor.id,
          vendorName: vendor.vendorName,
          totalSpend,
        };
      })
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 10);

    res.json(vendorSpend);
  } catch (error) {
    console.error('Error fetching top vendors:', error);
    res.status(500).json({ error: 'Failed to fetch top vendors' });
  }
});


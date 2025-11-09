import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const invoicesRouter = Router();

invoicesRouter.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '50',
      search,
      vendorId,
      status,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search as string, mode: 'insensitive' } },
        { invoiceId: { contains: search as string, mode: 'insensitive' } },
        { vendor: { vendorName: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) {
        where.invoiceDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.invoiceDate.lte = new Date(endDate as string);
      }
    }

    if (status) {
      where.payment = {
        status: status as string,
      };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              vendorName: true,
            },
          },
          payment: {
            select: {
              status: true,
              dueDate: true,
            },
          },
        },
        orderBy: {
          invoiceDate: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      data: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber || invoice.invoiceId || 'N/A',
        invoiceDate: invoice.invoiceDate,
        vendor: invoice.vendor?.vendorName || 'Unknown',
        vendorId: invoice.vendorId,
        amount: invoice.totalAmount?.toNumber() || 0,
        currency: invoice.currency || 'EUR',
        status: invoice.payment?.status || 'pending',
        dueDate: invoice.payment?.dueDate,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});


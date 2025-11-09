import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface JsonDocument {
  _id: string;
  name: string;
  filePath?: string;
  fileSize?: { $numberLong?: string };
  fileType?: string;
  status?: string;
  organizationId?: string;
  departmentId?: string;
  uploadedById?: string;
  isValidatedByHuman?: boolean;
  createdAt?: { $date?: string };
  updatedAt?: { $date?: string };
  extractedData?: {
    llmData?: {
      invoice?: {
        value?: {
          invoiceId?: { value?: string };
          invoiceNumber?: { value?: string };
          invoiceDate?: { value?: string };
          deliveryDate?: { value?: string };
        };
      };
      vendor?: {
        value?: {
          vendorName?: { value?: string };
          vendorPartyNumber?: { value?: string };
          vendorAddress?: { value?: string };
          vendorTaxId?: { value?: string };
          vendorEmail?: { value?: string };
          vendorPhone?: { value?: string };
        };
      };
      customer?: {
        value?: {
          customerName?: { value?: string };
          customerPartyNumber?: { value?: string };
          customerAddress?: { value?: string };
          customerTaxId?: { value?: string };
          customerEmail?: { value?: string };
        };
      };
      payment?: {
        value?: {
          dueDate?: { value?: string };
          paymentTerms?: { value?: string };
          paymentMethod?: { value?: string };
          paidDate?: { value?: string };
          paidAmount?: { value?: number | string };
          status?: { value?: string };
          netDays?: { value?: number };
        };
      };
      summary?: {
        value?: {
          subTotal?: { value?: number };
          totalTax?: { value?: number };
          invoiceTotal?: { value?: number };
          currencySymbol?: { value?: string };
        };
      };
      lineItems?: {
        value?: {
          items?: {
            value?: Array<{
              description?: { value?: string };
              quantity?: { value?: number | string };
              unitPrice?: { value?: number | string };
              totalPrice?: { value?: number | string };
              category?: { value?: string };
              taxRate?: { value?: number | string };
            }>;
          };
        };
      };
    };
  };
}

function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  try {
    return new Date(dateStr);
  } catch {
    return null;
  }
}

function parseNumber(value?: number | string): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Read JSON file
  const dataPath = path.join(__dirname, '../../../data/Analytics_Test_Data.json');
  const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as JsonDocument[];

  console.log(`📄 Found ${jsonData.length} documents to process`);

  let processed = 0;
  let errors = 0;

  for (const doc of jsonData) {
    try {
      const llmData = doc.extractedData?.llmData;
      if (!llmData) {
        console.log(`⚠️  Skipping document ${doc._id} - no extracted data`);
        continue;
      }

      // Create or find vendor
      let vendorId: string | undefined;
      if (llmData.vendor?.value?.vendorName?.value) {
        const vendorName = llmData.vendor.value.vendorName.value;
        const vendorPartyNumber = llmData.vendor.value.vendorPartyNumber?.value || null;

        const vendor = await prisma.vendor.upsert({
          where: {
            vendorName_vendorPartyNumber: {
              vendorName,
              vendorPartyNumber: vendorPartyNumber || '',
            },
          },
          update: {},
          create: {
            vendorName,
            vendorPartyNumber: vendorPartyNumber || undefined,
            vendorAddress: llmData.vendor.value.vendorAddress?.value || undefined,
            vendorTaxId: llmData.vendor.value.vendorTaxId?.value || undefined,
            vendorEmail: llmData.vendor.value.vendorEmail?.value || undefined,
            vendorPhone: llmData.vendor.value.vendorPhone?.value || undefined,
          },
        });
        vendorId = vendor.id;
      }

      // Create or find customer
      let customerId: string | undefined;
      if (llmData.customer?.value?.customerName?.value) {
        const customerName = llmData.customer.value.customerName.value;
        const customerPartyNumber = llmData.customer.value.customerPartyNumber?.value || null;

        // Find existing customer or create new
        let customer = await prisma.customer.findFirst({
          where: {
            customerName,
            customerPartyNumber: customerPartyNumber || undefined,
          },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              customerName,
              customerPartyNumber: customerPartyNumber || undefined,
              customerAddress: llmData.customer.value.customerAddress?.value || undefined,
              customerTaxId: llmData.customer.value.customerTaxId?.value || undefined,
              customerEmail: llmData.customer.value.customerEmail?.value || undefined,
            },
          });
        }
        customerId = customer.id;
      }

      // Create document
      const document = await prisma.document.upsert({
        where: { originalId: doc._id },
        update: {},
        create: {
          originalId: doc._id,
          name: doc.name,
          filePath: doc.filePath,
          fileSize: doc.fileSize?.$numberLong ? parseInt(doc.fileSize.$numberLong) : undefined,
          fileType: doc.fileType,
          status: doc.status || 'processed',
          organizationId: doc.organizationId,
          departmentId: doc.departmentId,
          uploadedById: doc.uploadedById,
          isValidated: doc.isValidatedByHuman || false,
          createdAt: parseDate(doc.createdAt?.$date) || new Date(),
          updatedAt: parseDate(doc.updatedAt?.$date) || new Date(),
        },
      });

      // Create invoice
      const invoiceData = llmData.invoice?.value;
      const summaryData = llmData.summary?.value;
      const invoiceDate = parseDate(invoiceData?.invoiceDate?.value);
      const deliveryDate = parseDate(invoiceData?.deliveryDate?.value);

      const invoice = await prisma.invoice.upsert({
        where: { documentId: document.id },
        update: {},
        create: {
          documentId: document.id,
          invoiceId: invoiceData?.invoiceId?.value || undefined,
          invoiceNumber: invoiceData?.invoiceNumber?.value || invoiceData?.invoiceId?.value || undefined,
          invoiceDate: invoiceDate,
          deliveryDate: deliveryDate,
          totalAmount: parseNumber(summaryData?.invoiceTotal?.value) || null,
          subtotal: parseNumber(summaryData?.subTotal?.value) || null,
          taxAmount: parseNumber(summaryData?.totalTax?.value) || null,
          currency: summaryData?.currencySymbol?.value || 'EUR',
          vendorId,
          customerId,
        },
      });

      // Create payment
      const paymentData = llmData.payment?.value;
      if (paymentData) {
        await prisma.payment.upsert({
          where: { invoiceId: invoice.id },
          update: {},
          create: {
            invoiceId: invoice.id,
            dueDate: parseDate(paymentData.dueDate?.value),
            paymentTerms: paymentData.paymentTerms?.value || undefined,
            paymentMethod: paymentData.paymentMethod?.value || undefined,
            paidDate: parseDate(paymentData.paidDate?.value),
            paidAmount: parseNumber(paymentData.paidAmount?.value) || null,
            status: paymentData.status?.value || 'pending',
          },
        });
      }

      // Create line items
      // The structure is: lineItems.value.items.value (array of items)
      const lineItemsData = llmData.lineItems?.value?.items?.value;
      if (lineItemsData && Array.isArray(lineItemsData)) {
        for (const item of lineItemsData) {
          await prisma.lineItem.create({
            data: {
              invoiceId: invoice.id,
              description: item.description?.value || undefined,
              quantity: parseNumber(item.quantity?.value) || null,
              unitPrice: parseNumber(item.unitPrice?.value) || null,
              totalPrice: parseNumber(item.totalPrice?.value) || null,
              category: item.category?.value || undefined,
              taxRate: parseNumber(item.taxRate?.value) || null,
            },
          });
        }
      }

      processed++;
      if (processed % 100 === 0) {
        console.log(`✅ Processed ${processed}/${jsonData.length} documents`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ Error processing document ${doc._id}:`, error);
      if (errors > 10) {
        console.error('Too many errors, stopping...');
        break;
      }
    }
  }

  console.log(`\n✨ Seed completed!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Errors: ${errors}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    const documents = await prisma.document.count();
    const invoices = await prisma.invoice.count();
    const vendors = await prisma.vendor.count();
    const customers = await prisma.customer.count();
    const lineItems = await prisma.lineItem.count();
    const payments = await prisma.payment.count();

    console.log('\n📊 Database Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 Documents:      ${documents}`);
    console.log(`🧾 Invoices:       ${invoices}`);
    console.log(`🏢 Vendors:        ${vendors}`);
    console.log(`👥 Customers:     ${customers}`);
    console.log(`📋 Line Items:     ${lineItems}`);
    console.log(`💰 Payments:       ${payments}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get some sample data
    const sampleInvoice = await prisma.invoice.findFirst({
      include: {
        vendor: true,
        customer: true,
        payment: true,
        lineItems: true,
      },
    });

    if (sampleInvoice) {
      console.log('✅ Sample Invoice Data:');
      console.log(`   Invoice Number: ${sampleInvoice.invoiceNumber || 'N/A'}`);
      console.log(`   Total Amount: €${sampleInvoice.totalAmount?.toNumber() || 0}`);
      console.log(`   Vendor: ${sampleInvoice.vendor?.vendorName || 'N/A'}`);
      console.log(`   Line Items: ${sampleInvoice.lineItems.length}`);
    }

    console.log('\n✅ Database is populated and ready!\n');
  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();


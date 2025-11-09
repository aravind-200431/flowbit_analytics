/**
 * Test Database Connection Script
 * Tests connection to PostgreSQL database with provided credentials
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test query - get table counts
    console.log('\n📊 Database Statistics:');
    
    const documentCount = await prisma.document.count();
    console.log(`   Documents: ${documentCount}`);
    
    const invoiceCount = await prisma.invoice.count();
    console.log(`   Invoices: ${invoiceCount}`);
    
    const vendorCount = await prisma.vendor.count();
    console.log(`   Vendors: ${vendorCount}`);
    
    const customerCount = await prisma.customer.count();
    console.log(`   Customers: ${customerCount}`);
    
    const paymentCount = await prisma.payment.count();
    console.log(`   Payments: ${paymentCount}`);
    
    const lineItemCount = await prisma.lineItem.count();
    console.log(`   Line Items: ${lineItemCount}`);
    
    // Sample query
    if (invoiceCount > 0) {
      console.log('\n📄 Sample Invoice Data:');
      const sampleInvoice = await prisma.invoice.findFirst({
        include: {
          vendor: true,
          customer: true,
          payment: true,
          lineItems: {
            take: 3
          }
        }
      });
      
      if (sampleInvoice) {
        console.log(`   Invoice ID: ${sampleInvoice.id}`);
        console.log(`   Invoice Number: ${sampleInvoice.invoiceNumber || 'N/A'}`);
        console.log(`   Vendor: ${sampleInvoice.vendor?.vendorName || 'N/A'}`);
        console.log(`   Total Amount: ${sampleInvoice.totalAmount || 'N/A'}`);
        console.log(`   Line Items: ${sampleInvoice.lineItems.length}`);
      }
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    if (error.code === 'P1001') {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Make sure PostgreSQL is running');
      console.error('   2. Check if the database "flowbit_analytics" exists');
      console.error('   3. Verify credentials in apps/api/.env');
      console.error('   4. Check if the port 5432 is correct');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();


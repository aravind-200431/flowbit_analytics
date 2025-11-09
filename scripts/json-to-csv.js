/**
 * Convert Analytics_Test_Data.json to CSV files for each table
 * Creates separate CSV files for: documents, vendors, customers, invoices, payments, line_items
 */

const fs = require('fs');
const path = require('path');

// Helper function to parse date
function parseDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return dateStr || '';
  }
}

// Helper function to parse number
function parseNumber(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? '' : parsed;
  }
  return '';
}

// Helper function to escape CSV values
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper function to write CSV file
function writeCSV(filename, headers, rows) {
  const csvPath = path.join(__dirname, '../data/csv', filename);
  const csvDir = path.dirname(csvPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir, { recursive: true });
  }
  
  const lines = [];
  
  // Write headers
  lines.push(headers.map(escapeCSV).join(','));
  
  // Write rows
  for (const row of rows) {
    const values = headers.map(header => {
      const value = row[header];
      return escapeCSV(value);
    });
    lines.push(values.join(','));
  }
  
  fs.writeFileSync(csvPath, lines.join('\n'), 'utf-8');
  console.log(`✅ Created ${filename} with ${rows.length} rows`);
}

async function convertJSONToCSV() {
  console.log('🔄 Starting JSON to CSV conversion...\n');
  
  // Read JSON file
  const jsonPath = path.join(__dirname, '../data/Analytics_Test_Data.json');
  console.log(`📖 Reading ${jsonPath}...`);
  
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📄 Found ${jsonData.length} documents to process\n`);
  
  // Data structures for each table
  const documents = [];
  const vendors = new Map(); // Use Map to avoid duplicates
  const customers = new Map();
  const invoices = [];
  const payments = [];
  const lineItems = [];
  
  // Track IDs for relationships
  const documentIdMap = new Map(); // originalId -> new id
  const vendorIdMap = new Map(); // vendorName+partyNumber -> id
  const customerIdMap = new Map(); // customerName+partyNumber -> id
  const invoiceIdMap = new Map(); // documentId -> invoice id
  
  let docCounter = 1;
  let vendorCounter = 1;
  let customerCounter = 1;
  let invoiceCounter = 1;
  let paymentCounter = 1;
  let lineItemCounter = 1;
  
  for (const doc of jsonData) {
    try {
      const llmData = doc.extractedData?.llmData;
      if (!llmData) {
        continue;
      }
      
      // Generate document ID
      const documentId = `doc-${docCounter++}`;
      documentIdMap.set(doc._id, documentId);
      
      // Extract document data
      documents.push({
        id: documentId,
        originalId: doc._id,
        name: doc.name || '',
        filePath: doc.filePath || '',
        fileSize: doc.fileSize?.$numberLong ? parseInt(doc.fileSize.$numberLong) : '',
        fileType: doc.fileType || '',
        status: doc.status || 'processed',
        organizationId: doc.organizationId || '',
        departmentId: doc.departmentId || '',
        uploadedById: doc.uploadedById || '',
        isValidated: doc.isValidatedByHuman ? 'true' : 'false',
        createdAt: parseDate(doc.createdAt?.$date),
        updatedAt: parseDate(doc.updatedAt?.$date)
      });
      
      // Extract vendor data
      let vendorId = null;
      if (llmData.vendor?.value?.vendorName?.value) {
        const vendorName = llmData.vendor.value.vendorName.value;
        const vendorPartyNumber = llmData.vendor.value.vendorPartyNumber?.value || '';
        const vendorKey = `${vendorName}|${vendorPartyNumber}`;
        
        if (!vendorIdMap.has(vendorKey)) {
          const newVendorId = `vendor-${vendorCounter++}`;
          vendorIdMap.set(vendorKey, newVendorId);
          
          vendors.set(newVendorId, {
            id: newVendorId,
            vendorName: vendorName,
            vendorPartyNumber: vendorPartyNumber,
            vendorAddress: llmData.vendor.value.vendorAddress?.value || '',
            vendorTaxId: llmData.vendor.value.vendorTaxId?.value || '',
            vendorEmail: llmData.vendor.value.vendorEmail?.value || '',
            vendorPhone: llmData.vendor.value.vendorPhone?.value || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        vendorId = vendorIdMap.get(vendorKey);
      }
      
      // Extract customer data
      let customerId = null;
      if (llmData.customer?.value?.customerName?.value) {
        const customerName = llmData.customer.value.customerName.value;
        const customerPartyNumber = llmData.customer.value.customerPartyNumber?.value || '';
        const customerKey = `${customerName}|${customerPartyNumber}`;
        
        if (!customerIdMap.has(customerKey)) {
          const newCustomerId = `customer-${customerCounter++}`;
          customerIdMap.set(customerKey, newCustomerId);
          
          customers.set(newCustomerId, {
            id: newCustomerId,
            customerName: customerName,
            customerPartyNumber: customerPartyNumber,
            customerAddress: llmData.customer.value.customerAddress?.value || '',
            customerTaxId: llmData.customer.value.customerTaxId?.value || '',
            customerEmail: llmData.customer.value.customerEmail?.value || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        customerId = customerIdMap.get(customerKey);
      }
      
      // Extract invoice data
      const invoiceId = `invoice-${invoiceCounter++}`;
      invoiceIdMap.set(documentId, invoiceId);
      
      const invoiceData = llmData.invoice?.value || {};
      const summaryData = llmData.summary?.value || {};
      
      invoices.push({
        id: invoiceId,
        documentId: documentId,
        invoiceId: invoiceData.invoiceId?.value || '',
        invoiceNumber: invoiceData.invoiceNumber?.value || '',
        invoiceDate: parseDate(invoiceData.invoiceDate?.value),
        deliveryDate: parseDate(invoiceData.deliveryDate?.value),
        totalAmount: parseNumber(summaryData.invoiceTotal?.value),
        subtotal: parseNumber(summaryData.subTotal?.value),
        taxAmount: parseNumber(summaryData.totalTax?.value),
        currency: summaryData.currencySymbol?.value || 'EUR',
        category: '', // Can be extracted from line items if needed
        vendorId: vendorId || '',
        customerId: customerId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Extract payment data
      const paymentData = llmData.payment?.value || {};
      const paymentId = `payment-${paymentCounter++}`;
      
      payments.push({
        id: paymentId,
        invoiceId: invoiceId,
        dueDate: parseDate(paymentData.dueDate?.value),
        paymentTerms: paymentData.paymentTerms?.value || '',
        paymentMethod: paymentData.paymentMethod?.value || '',
        paidDate: parseDate(paymentData.paidDate?.value),
        paidAmount: parseNumber(paymentData.paidAmount?.value),
        status: paymentData.status?.value || 'pending',
        netDays: parseNumber(paymentData.netDays?.value),
        discountPercentage: parseNumber(paymentData.discountPercentage?.value),
        discountDays: parseNumber(paymentData.discountDays?.value),
        discountDueDate: parseDate(paymentData.discountDueDate?.value),
        discountedTotal: parseNumber(paymentData.discountedTotal?.value),
        bankAccountNumber: paymentData.bankAccountNumber?.value || '',
        bic: paymentData.BIC?.value || '',
        accountName: paymentData.accountName?.value || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Extract line items
      // Structure: lineItems.value.items.value (array)
      const lineItemsWrapper = llmData.lineItems?.value;
      let lineItemsArray = [];
      
      if (lineItemsWrapper) {
        // Check if it's directly an array (old format)
        if (Array.isArray(lineItemsWrapper)) {
          lineItemsArray = lineItemsWrapper;
        }
        // Check if it's in items.value format (new format)
        else if (lineItemsWrapper.items?.value && Array.isArray(lineItemsWrapper.items.value)) {
          lineItemsArray = lineItemsWrapper.items.value;
        }
        // Check if items is directly an array
        else if (lineItemsWrapper.items && Array.isArray(lineItemsWrapper.items)) {
          lineItemsArray = lineItemsWrapper.items;
        }
      }
      
      if (lineItemsArray.length > 0) {
        for (const item of lineItemsArray) {
          lineItems.push({
            id: `lineitem-${lineItemCounter++}`,
            invoiceId: invoiceId,
            srNo: parseNumber(item.srNo?.value),
            description: item.description?.value || '',
            quantity: parseNumber(item.quantity?.value),
            unitPrice: parseNumber(item.unitPrice?.value),
            totalPrice: parseNumber(item.totalPrice?.value),
            category: item.category?.value || '',
            taxRate: parseNumber(item.taxRate?.value),
            sachkonto: item.Sachkonto?.value || '',
            buSchluessel: item.BUSchluessel?.value || '',
            createdAt: new Date().toISOString()
          });
        }
      }
      
    } catch (error) {
      console.error(`⚠️  Error processing document ${doc._id}:`, error.message);
    }
  }
  
  console.log('\n📊 Data Summary:');
  console.log(`   Documents: ${documents.length}`);
  console.log(`   Vendors: ${vendors.size}`);
  console.log(`   Customers: ${customers.size}`);
  console.log(`   Invoices: ${invoices.length}`);
  console.log(`   Payments: ${payments.length}`);
  console.log(`   Line Items: ${lineItems.length}\n`);
  
  // Convert Maps to Arrays
  const vendorsArray = Array.from(vendors.values());
  const customersArray = Array.from(customers.values());
  
  // Write CSV files
  console.log('💾 Writing CSV files...\n');
  
  // Documents CSV
  writeCSV('documents.csv', [
    'id', 'originalId', 'name', 'filePath', 'fileSize', 'fileType', 'status',
    'organizationId', 'departmentId', 'uploadedById', 'isValidated',
    'createdAt', 'updatedAt'
  ], documents);
  
  // Vendors CSV
  writeCSV('vendors.csv', [
    'id', 'vendorName', 'vendorPartyNumber', 'vendorAddress', 'vendorTaxId',
    'vendorEmail', 'vendorPhone', 'createdAt', 'updatedAt'
  ], vendorsArray);
  
  // Customers CSV
  writeCSV('customers.csv', [
    'id', 'customerName', 'customerPartyNumber', 'customerAddress',
    'customerTaxId', 'customerEmail', 'createdAt', 'updatedAt'
  ], customersArray);
  
  // Invoices CSV
  writeCSV('invoices.csv', [
    'id', 'documentId', 'invoiceId', 'invoiceNumber', 'invoiceDate',
    'deliveryDate', 'totalAmount', 'subtotal', 'taxAmount', 'currency',
    'category', 'vendorId', 'customerId', 'createdAt', 'updatedAt'
  ], invoices);
  
  // Payments CSV
  writeCSV('payments.csv', [
    'id', 'invoiceId', 'dueDate', 'paymentTerms', 'paymentMethod',
    'paidDate', 'paidAmount', 'status', 'netDays', 'discountPercentage',
    'discountDays', 'discountDueDate', 'discountedTotal', 'bankAccountNumber',
    'bic', 'accountName', 'createdAt', 'updatedAt'
  ], payments);
  
  // Line Items CSV
  writeCSV('line_items.csv', [
    'id', 'invoiceId', 'srNo', 'description', 'quantity', 'unitPrice',
    'totalPrice', 'category', 'taxRate', 'sachkonto', 'buSchluessel', 'createdAt'
  ], lineItems);
  
  console.log('\n✅ Conversion complete!');
  console.log('📁 CSV files saved to: data/csv/');
  console.log('\nFiles created:');
  console.log('   - documents.csv');
  console.log('   - vendors.csv');
  console.log('   - customers.csv');
  console.log('   - invoices.csv');
  console.log('   - payments.csv');
  console.log('   - line_items.csv');
}

// Run the conversion
convertJSONToCSV().catch(console.error);


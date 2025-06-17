documentTypes = {
    goodsReceive: 'Goods Received Note',
    invoice: 'Invoice',
    deliveryChallan: 'Delivery Challan',
    salesQuotation: 'Sales Quotation',
    salesEnquiry: 'Sales Enquiry',
    qualityReport: 'Quality Report',
    orderConfirmation: 'Order Confirmation',
    proformaInvoice: "Performa Invoice",
    debitNote: "Debit Note",
    creditNote: "Credit Note",
    salesReturn: "Sales Return",
    goodsReceiveNotes: "Goods Receive Notes",
    purchaseOrder: 'Purchase Order',
    purchaseRequest: 'Purchase Request',
    purchaseInvoice: 'Purchase Invoice',
    purchaseReturn: 'Purchase Return',
    serviceChallan: 'Service Challan',
    serviceGrn: 'Service Grn',
    serviceQr: 'Service Qr',
    salesOrder: 'Sales Order'
};

const salesDocuments = [
    "Sales Lead",
    "Sales Quotation",
    "Sales Order",
    "Delivery Challan",
    "Proforma Invoice",
    "Invoice",
    "Debit Note",
    "Credit Note",
    "Sales Return"
];

const serviceDocuments = [
    "Service Order",
    "Service Challan",
    "Service Grn",
    "Service Qr",
    "Service Proforma Invoice",
    "Service Invoice",
    "Service Debit Note",
    "Service Credit Note"
];


const purchaseDocuments = [
    "Purchase Request",
    "Purchase Order",
    "Goods Received Note",
    "Quality Report",
    "Purchase Invoice",
    "Purchase Debit Note",
    "Purchase Credit Note",
    "Purchase Return"
];

module.exports = { documentTypes, serviceDocuments, salesDocuments, purchaseDocuments };
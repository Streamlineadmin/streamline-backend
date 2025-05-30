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
    purchaseReturn: 'Purchase Return'
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

module.exports = { documentTypes, salesDocuments, purchaseDocuments };
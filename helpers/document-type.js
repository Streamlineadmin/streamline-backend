documentTypes = {
    goodsReceive: 'Goods Received Note',
    invoice: 'Invoice',
    deliveryChallan: 'Delivery Challan',
    stockTransferDeliveryChallan: 'Stock Transfer Delivery Challan',
    salesQuotation: 'Sales Quotation',
    salesEnquiry: 'Sales Enquiry',
    qualityReport: 'Quality Report',
    orderConfirmation: 'Order Confirmation',
    proformaInvoice: "Proforma Invoice",
    debitNote: "Debit Note",
    creditNote: "Credit Note",
    salesReturn: "Sales Return",
    goodsReceiveNotes: "Goods Receive Notes",
    purchaseOrder: 'Purchase Order',
    purchaseRequest: 'Purchase Request',
    purchaseInvoice: 'Purchase Invoice',
    purchaseDebitNote: "Purchase Debit Note",
    purchaseCreditNote: "Purchase Credit Note",
    purchaseReturn: 'Purchase Return',
    serviceChallan: 'Service Challan',
    serviceGrn: 'Service Grn',
    serviceQr: 'Service Qr',
    salesOrder: 'Sales Order',
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
    "Sales Return",
    "Stock Transfer Delivery Challan"
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

const serviceConfirmationDocuments = [
    "Service Confirmation",
    "Service Confirmation Challan",
    "Service Confirmation Grn",
    "Service Confirmation Qr",
    "Service Confirmation Proforma Invoice",
    "Service Confirmation Invoice",
    "Service Confirmation Debit Note",
    "Service Confirmation Credit Note"
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

const AllDocuments = {
    "Sales Lead": "SL",
    "Sales Quotation": "SQ",
    "Sales Order": "SO",
    "Delivery Challan": "DC",
    "Proforma Invoice": "PI",
    "Invoice": "INV",
    "Debit Note": "DNN",
    "Credit Note": "CNN",
    "Sales Return": "SR",
    "Stock Transfer Delivery Challan": "STDC",
    "Purchase Request": "PRQ",
    "Purchase Order": "PO",
    "Goods Received Note": "GRN",
    "Quality Report": "QR",
    "Purchase Invoice": "PUI",
    "Purchase Debit Note": "PDNN",
    "Purchase Credit Note": "PCNN",
    "Purchase Return": "PR",
    "Service Order": "SERO",
    "Service Challan": "SERC",
    "Service Grn": "SERGRN",
    "Service Qr": "SERQR",
    "Service Proforma Invoice": "SERPI",
    "Service Invoice": "SERINV",
    "Service Debit Note": "SERDNN",
    "Service Credit Note": "SERCNN",
    "Service Confirmation": "SC",
    "Service Confirmation Challan": "SCC",
    "Service Confirmation Grn": "SCGRN",
    "Service Confirmation Qr": "SCQR",
    "Service Confirmation Proforma Invoice": "SCPI",
    "Service Confirmation Invoice": "SCINV",
    "Service Confirmation Debit Note": "SCDNN",
    "Service Confirmation Credit Note": "SCCNN",
    "Production": "PROD",
    "Gate Entry": "GE",
    "Production Finished Good Batch": "PFGB",
    "Production Scrap Batch": "PSCRB",
    "Document Batch": "DOCB"
}

module.exports = {
    documentTypes,
    serviceDocuments,
    salesDocuments,
    purchaseDocuments,
    serviceConfirmationDocuments,
    AllDocuments
};
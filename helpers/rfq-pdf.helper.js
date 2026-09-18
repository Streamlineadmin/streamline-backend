const PDFDocument = require('pdfkit-table');

/**
 * Format address object into a single readable string
 */
function formatAddress(address) {
  if (!address) return '';
  let parsed = address;
  if (typeof address === 'string') {
    try {
      parsed = JSON.parse(address);
    } catch {
      return address;
    }
  }
  if (!parsed || typeof parsed !== 'object') return '';

  const parts = [
    parsed.addressLineOne || parsed.address || parsed.street,
    parsed.addressLineTwo,
    parsed.city,
    parsed.state,
    parsed.pincode || parsed.zipCode || parsed.postalCode,
    parsed.country
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Strip HTML tags and format text
 */
function cleanHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Format date to DD/MM/YYYY
 */
function formatDate(dateValue) {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Generate RFQ PDF buffer matching the style and layout from previewdocument.tsx & documentslicer.tsx
 */
async function generateRfqPdf({ document, items = [], issuer = {}, termsCondition = [], additionalDetails = '' }) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 36,
        size: 'A4',
        bufferPages: true,
        autoFirstPage: true
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2; // ~523.28pt

      // Colors
      const primaryColor = '#111827';
      const accentColor = '#1d4ed8';
      const mutedColor = '#6b7280';
      const borderColor = '#d1d5db';
      const lightBg = '#f9fafb';

      // 1. TOP HEADER
      const headerTop = 36;
      const rightColWidth = 240;
      const rightColX = pageWidth - margin - rightColWidth;

      // Left: Company Name
      doc.font('Helvetica-Bold').fontSize(16).fillColor(primaryColor);
      doc.text(issuer.companyName || document.supplierName || 'Company', margin, headerTop, {
        width: contentWidth - rightColWidth - 10,
        align: 'left'
      });

      // Right: Document Title & Metadata
      doc.font('Helvetica-Bold').fontSize(18).fillColor(primaryColor);
      doc.text('REQUEST FOR QUOTATION', rightColX, headerTop, {
        width: rightColWidth,
        align: 'right'
      });

      doc.moveDown(0.2);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(accentColor);
      doc.text(`RFQ No: ${document.documentNumber || 'N/A'}`, rightColX, doc.y, {
        width: rightColWidth,
        align: 'right'
      });

      doc.font('Helvetica').fontSize(9).fillColor(mutedColor);
      doc.text(`Date: ${formatDate(document.documentDate || document.createdAt || new Date())}`, rightColX, doc.y, {
        width: rightColWidth,
        align: 'right'
      });

      if (document.submissionDeadline) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#dc2626');
        doc.text(`Submission Deadline: ${formatDate(document.submissionDeadline)}`, rightColX, doc.y, {
          width: rightColWidth,
          align: 'right'
        });
      }

      // Position after header
      const afterHeaderY = Math.max(doc.y, 95);

      // Divider Line
      doc.moveTo(margin, afterHeaderY + 10)
        .lineTo(pageWidth - margin, afterHeaderY + 10)
        .strokeColor(borderColor)
        .lineWidth(1)
        .stroke();

      // 2. BILL TO (ISSUER)
      const billToY = afterHeaderY + 18;
      doc.x = margin;
      doc.y = billToY;

      doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text('Bill To:', margin, billToY);
      doc.moveDown(0.2);

      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1f2937').text(issuer.companyName || document.supplierName || '');
      doc.font('Helvetica').fontSize(9).fillColor('#374151');

      const billingAddr = formatAddress(document.supplierBillingAddress || issuer.billingAddress);
      if (billingAddr) {
        doc.text(`Address: ${billingAddr}`, { width: contentWidth });
      }

      const stateInfo = document.supplyState || (typeof document.supplierBillingAddress === 'object' ? document.supplierBillingAddress.state : '');
      const gstNo = document.supplierGSTNumber || issuer.gstNumber;
      const panNo = issuer.pan;
      const contact = issuer.contactNo || document.supplierContactNo;
      const email = issuer.email || document.supplierEmail;

      const idDetails = [
        stateInfo ? `State: ${stateInfo}` : null,
        gstNo ? `GSTIN: ${gstNo}` : null,
        panNo ? `PAN: ${panNo}` : null,
        contact ? `Contact: ${contact}` : null,
        email ? `Email: ${email}` : null
      ].filter(Boolean);

      if (idDetails.length > 0) {
        doc.moveDown(0.2);
        doc.text(idDetails.join('   |   '), { width: contentWidth });
      }

      doc.moveDown(0.8);

      // 3. METADATA SUMMARY BAR (Delivery Date, Required Date, Purpose)
      const metadataItems = [
        document.deliveryDate ? { label: 'Delivery Date', value: formatDate(document.deliveryDate) } : null,
        document.requiredDate ? { label: 'Required Date', value: formatDate(document.requiredDate) } : null,
        document.purpose ? { label: 'Purpose', value: document.purpose } : null,
      ].filter(Boolean);

      if (metadataItems.length > 0) {
        const barY = doc.y;
        const barHeight = 22;
        doc.rect(margin, barY, contentWidth, barHeight).fillColor(lightBg).fillAndStroke(lightBg, borderColor);

        const colWidth = contentWidth / metadataItems.length;
        metadataItems.forEach((meta, idx) => {
          const itemX = margin + idx * colWidth + 8;
          doc.fontSize(8.5).font('Helvetica-Bold').fillColor(mutedColor)
            .text(`${meta.label}: `, itemX, barY + 6, { continued: true, lineBreak: false })
            .font('Helvetica').fillColor(primaryColor)
            .text(meta.value, { lineBreak: false });
        });

        doc.y = barY + barHeight + 12;
      } else {
        doc.moveDown(0.5);
      }

      // 4. ITEMS TABLE
      // Widths must sum to exactly contentWidth (523pt)
      // 35 + 75 + 273 + 80 + 60 = 523
      const tableRows = (items || [])
        .filter(item => item && (item.quantity !== undefined && item.quantity !== 0))
        .map((item, index) => {
          const cleanItemDetails = item.additionalDetails ? cleanHtml(item.additionalDetails) : '';
          const descParts = [
            item.itemName || '',
            cleanItemDetails ? `Note: ${cleanItemDetails}` : ''
          ].filter(Boolean);

          return [
            String(index + 1),
            item.itemId || '-',
            descParts.join('\n'),
            String(item.quantity ?? '-'),
            item.UOM || item.alternateUnit || 'PCS'
          ];
        });

      const tableData = {
        headers: [
          { label: 'S.No', property: 'sno', width: 35, align: 'center' },
          { label: 'Item Code', property: 'itemCode', width: 75, align: 'left' },
          { label: 'Item Description', property: 'description', width: 273, align: 'left' },
          { label: 'Requested Qty', property: 'quantity', width: 80, align: 'right' },
          { label: 'UOM', property: 'uom', width: 60, align: 'center' },
        ],
        rows: tableRows
      };

      doc.x = margin;
      await doc.table(tableData, {
        x: margin,
        width: contentWidth,
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
          doc.font('Helvetica').fontSize(9).fillColor('#1f2937');
        },
        padding: 6,
        divider: {
          header: { disabled: false, width: 1, opacity: 1 },
          horizontal: { disabled: false, width: 0.5, opacity: 0.5 }
        }
      });

      doc.moveDown(1.2);
      doc.x = margin;


      // 6. TERMS & CONDITIONS (if present)
      let termsList = [];
      if (Array.isArray(termsCondition)) {
        termsList = termsCondition;
      } else if (typeof termsCondition === 'string') {
        try {
          const parsed = JSON.parse(termsCondition);
          termsList = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          termsList = [termsCondition];
        }
      }

      // Filter out empty entries
      termsList = termsList.filter(t => t && (typeof t === 'string' || t.term || t.desc || t.name));

      if (termsList.length > 0) {
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(primaryColor).text('Terms & Conditions:', margin, doc.y);
        doc.moveDown(0.2);

        termsList.forEach((item, index) => {
          if (typeof item === 'object') {
            const title = (item.term || item.name || '').trim();
            const rawDesc = (item.desc || item.description || '').trim();
            const cleanDesc = cleanHtml(rawDesc);

            if (title && cleanDesc) {
              doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1f2937')
                .text(`${index + 1}. ${title}: `, margin, doc.y, { continued: true })
                .font('Helvetica').fillColor('#4b5563')
                .text(cleanDesc);
            } else if (title) {
              doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563')
                .text(`${index + 1}. ${title}`, margin);
            } else if (cleanDesc) {
              doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563')
                .text(`${index + 1}. ${cleanDesc}`, margin);
            }
          } else {
            doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563')
              .text(`${index + 1}. ${String(item).trim()}`, margin);
          }
          doc.moveDown(0.15);
        });
        doc.moveDown(0.8);
      }

      // 7. ADDITIONAL DETAILS (if present)
      const docAdditionalDetails = additionalDetails || document.additionalDetails || '';
      const cleanAdditional = cleanHtml(docAdditionalDetails);
      if (cleanAdditional) {
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(primaryColor).text('Additional Details:', margin, doc.y);
        doc.moveDown(0.2);
        doc.font('Helvetica').fontSize(8.5).fillColor('#374151').text(cleanAdditional, margin);
        doc.moveDown(0.8);
      }

      // 8. AUTHORIZED SIGNATORY
      // Check remaining space on current page
      if (doc.y > doc.page.height - 110) {
        doc.addPage();
      }

      const signBoxWidth = 220;
      const signBoxX = pageWidth - margin - signBoxWidth;
      const signY = doc.y + 10;

      doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text(
        `For ${issuer.companyName || document.supplierName || 'Company'}`,
        signBoxX,
        signY,
        { width: signBoxWidth, align: 'right' }
      );
      doc.y = signY + 38;
      doc.font('Helvetica').fontSize(8.5).fillColor(mutedColor).text(
        'Authorized Signatory',
        signBoxX,
        doc.y,
        { width: signBoxWidth, align: 'right' }
      );

      // 8. PAGE NUMBERING FOOTER
      const pages = doc.bufferedPageRange();
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; // Temporarily prevent auto page break

      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.font('Helvetica').fontSize(8).fillColor(mutedColor).text(
          `Page ${i + 1} of ${pages.count}`,
          margin,
          doc.page.height - 20,
          { align: 'center', width: contentWidth, lineBreak: false }
        );
      }
      doc.page.margins.bottom = bottomMargin;

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateRfqPdf,
  formatDate,
  formatAddress
};

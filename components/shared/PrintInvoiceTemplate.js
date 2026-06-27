import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '../../styles/shared/print-invoice.module.css';
import useDashboardData from '../../components/dashboard/useDashboardData';
import { numberToWords } from '../utilities/numberToWords';
import { IMAGE_URL } from '../utilities/Constants';

const PrintInvoiceTemplate = ({
  title,
  customerDetails,
  invoiceDetails,
  columns,
  items,
  summary,
  notes,
  onClose,
  useDynamicColumns,
  headerDetails
}) => {
  const { branch, company, vendor } = useDashboardData({ skipReviews: true });

  const companyName = headerDetails?.companyName || branch?.branchName || branch?.name || company?.name || vendor?.businessName || 'My Company';
  const companyPhone = headerDetails?.companyPhone || branch?.contactUs?.mobile || branch?.contactUs?.phone || branch?.mobileNo || branch?.phoneNumber || branch?.mobile || branch?.phone || company?.contactUs?.mobile || company?.contactUs?.phone || company?.mobileNo || company?.phoneNumber || company?.mobile || company?.phone || vendor?.phone || vendor?.mobile || vendor?.mobileNo || '-';
  let clinicProfileImage = headerDetails?.logo || branch?.clinicProfileImage || branch?.logo || company?.clinicProfileImage || company?.logo || vendor?.clinicProfileImage || vendor?.logo || null;
  if (clinicProfileImage && !clinicProfileImage.startsWith('http')) {
    clinicProfileImage = `${IMAGE_URL}${clinicProfileImage}`;
  }

  // Determine layout type based on title
  const isPayment = title && title.toLowerCase().includes('payment');

  // Extract Paid Amount for payments
  const totalRow = summary?.find(row => row.isTotal);
  const paidAmountStr = totalRow ? totalRow.value : '0';
  const numericPaidAmount = parseFloat(paidAmountStr.replace(/[^0-9.]/g, '')) || 0;

  const handleDownload = async () => {
    const element = document.getElementById('pdf-content-container');
    if (!element) return;

    // Dynamically import html2pdf to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: 0.4,
      filename: `${title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'document'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const renderNestedHeader = (headerName) => (
    <div className={styles.nestedHeader}>
      <div className={styles.nestedTop}>{headerName}</div>
      <div className={styles.nestedBottom}>
        <span>%</span>
        <span>₹</span>
      </div>
    </div>
  );

  const renderInvoiceTable = () => {
    // Map existing columns to new design, attempting to find matching columns
    const sNoCol = columns.find(c => c.header.toLowerCase().includes('s no') || c.header.toLowerCase() === 'no.');
    const productCol = columns.find(c => c.header.toLowerCase().includes('product') || c.header.toLowerCase().includes('item'));
    const qtyCol = columns.find(c => c.header.toLowerCase().includes('qty') || c.header.toLowerCase().includes('quantity'));
    const unitCol = columns.find(c => c.header.toLowerCase().includes('unit'));
    const priceCol = columns.find(c => c.header.toLowerCase().includes('price') || c.header.toLowerCase().includes('rate'));
    const taxCol = columns.find(c => c.header.toLowerCase().includes('tax'));
    const discCol = columns.find(c => c.header.toLowerCase().includes('discount'));
    const amtCol = columns.find(c => c.header.toLowerCase().includes('amount') || c.header.toLowerCase().includes('total'));

    const getVal = (col, item, idx) => col ? (col.accessor ? item[col.accessor] : col.render ? col.render(item, idx) : item[col.accessor]) : '-';

    if (useDynamicColumns) {
      return (
        <div className={styles.tableContainer}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                {columns.map((c, i) => (
                  <th key={i} style={{ textAlign: c.align || 'center' }}>{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, rowIdx) => (
                <tr key={rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} style={{ textAlign: col.align || 'center' }}>
                      {getVal(col, item, rowIdx)}
                    </td>
                  ))}
                </tr>
              ))}
              {summary && summary.filter(s => s.isTotal).length > 0 && (
                <tr className={styles.tableTotalRow}>
                  <td colSpan={columns.length - 1} className={styles.left}>TOTAL</td>
                  <td style={{ textAlign: columns[columns.length - 1].align || 'center' }}>{paidAmountStr}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className={styles.tableContainer}>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>S NO.</th>
              <th style={{ textAlign: 'left' }}>PRODUCT NAME</th>
              <th>QTY</th>
              <th>UNIT</th>
              <th>PRICE</th>
              <th style={{ padding: 0, width: '100px' }}>{renderNestedHeader('TAX')}</th>
              <th style={{ padding: 0, width: '100px' }}>{renderNestedHeader('DISCOUNT')}</th>
              <th style={{ textAlign: 'right' }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const getNumericVal = (val) => {
                if (val === undefined || val === null || val === '-') return 0;
                if (typeof val === 'string') {
                  return parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
                }
                return parseFloat(val) || 0;
              };

              const processedItems = items.map((item, rowIdx) => {
                const qtyVal = qtyCol ? getNumericVal(getVal(qtyCol, item, rowIdx)) : (parseFloat(item.returnQty || item.quantity || item.qty || item.receivedQty || 1) || 0);
                const priceVal = priceCol ? getNumericVal(getVal(priceCol, item, rowIdx)) : (parseFloat(item.price || item.costPrice || item.cost || item.rate || item.sellingPrice || 0) || 0);

                const taxPercentVal = taxCol ? getNumericVal(getVal(taxCol, item, rowIdx)) : 0;
                const discPercentVal = discCol ? getNumericVal(getVal(discCol, item, rowIdx)) : 0;

                const subtotal = qtyVal * priceVal;

                let discAmt = 0;
                if (item.discountAmount !== undefined) {
                  discAmt = parseFloat(item.discountAmount) || 0;
                } else if (item.discountAmt !== undefined) {
                  discAmt = parseFloat(item.discountAmt) || 0;
                } else {
                  discAmt = subtotal * (discPercentVal / 100);
                }

                let taxAmt = 0;
                if (item.taxAmount !== undefined) {
                  taxAmt = parseFloat(item.taxAmount) || 0;
                } else if (item.taxAmt !== undefined) {
                  taxAmt = parseFloat(item.taxAmt) || 0;
                } else {
                  const amtAfterDiscount = subtotal - discAmt;
                  taxAmt = amtAfterDiscount * (taxPercentVal / 100);
                }

                discAmt = Math.round(discAmt * 100) / 100;
                taxAmt = Math.round(taxAmt * 100) / 100;

                let amtVal = 0;
                if (item.itemTotal !== undefined) {
                  amtVal = parseFloat(item.itemTotal) || 0;
                } else if (item.amount !== undefined) {
                  amtVal = parseFloat(item.amount) || 0;
                } else if (item.total !== undefined) {
                  amtVal = parseFloat(item.total) || 0;
                } else if (item.totalValue !== undefined) {
                  amtVal = parseFloat(item.totalValue) || 0;
                } else if (item.netAmount !== undefined) {
                  amtVal = parseFloat(item.netAmount) || 0;
                } else {
                  amtVal = amtCol ? getNumericVal(getVal(amtCol, item, rowIdx)) : (subtotal - discAmt + taxAmt);
                }

                return {
                  item,
                  qtyVal,
                  priceVal,
                  taxPercentVal,
                  discPercentVal,
                  discAmt,
                  taxAmt,
                  amtVal
                };
              });

              const totalQty = processedItems.reduce((acc, pi) => acc + pi.qtyVal, 0);
              const totalPrice = processedItems.reduce((acc, pi) => acc + pi.priceVal, 0);
              const totalTaxAmt = processedItems.reduce((acc, pi) => acc + pi.taxAmt, 0);
              const totalDiscAmt = processedItems.reduce((acc, pi) => acc + pi.discAmt, 0);
              const totalAmt = processedItems.reduce((acc, pi) => acc + pi.amtVal, 0);
              
              // Get unit from the first item to show in total row, if applicable
              const firstItemUnit = processedItems.length > 0 ? (unitCol ? getVal(unitCol, processedItems[0].item, 0) : processedItems[0].item.unit || '-') : '';

              return (
                <>
                  {processedItems.map((pi, rowIdx) => {
                    const { item, qtyVal, taxPercentVal, discPercentVal, taxAmt, discAmt } = pi;
                    const formattedTaxAmt = taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const formattedDiscAmt = discAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                    return (
                      <tr key={rowIdx}>
                        <td>{sNoCol ? getVal(sNoCol, item, rowIdx) : String(rowIdx + 1).padStart(2, '0')}</td>
                        <td className={styles.left}>
                          {productCol ? getVal(productCol, item, rowIdx) : item.productName || item.name || '-'}
                        </td>
                        <td>{qtyCol ? getVal(qtyCol, item, rowIdx) : item.quantity || item.qty || '1'}</td>
                        <td>{unitCol ? getVal(unitCol, item, rowIdx) : item.unit || '-'}</td>
                        <td>{priceCol ? getVal(priceCol, item, rowIdx) : '-'}</td>
                        <td style={{ padding: 0 }}>
                          <div className={styles.nestedCell}>
                            <span>{taxPercentVal}%</span>
                            <span>{formattedTaxAmt}</span>
                          </div>
                        </td>
                        <td style={{ padding: 0 }}>
                          <div className={styles.nestedCell}>
                            <span>{discPercentVal}%</span>
                            <span>{formattedDiscAmt}</span>
                          </div>
                        </td>
                        <td className={styles.right}>{amtCol ? getVal(amtCol, item, rowIdx) : '-'}</td>
                      </tr>
                    );
                  })}
                  <tr className={styles.tableTotalRow}>
                    <td colSpan={2} className={styles.left}>TOTAL</td>
                    <td>{totalQty % 1 !== 0 ? totalQty.toFixed(2) : totalQty.toString().padStart(2, '0')}</td>
                    <td></td>
                    <td>{totalPrice ? totalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : ''}</td>
                    <td style={{ padding: 0 }}>
                      <div className={styles.nestedCell}>
                        <span></span>
                        <span>{totalTaxAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </td>
                    <td style={{ padding: 0 }}>
                      <div className={styles.nestedCell}>
                        <span></span>
                        <span>{totalDiscAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </td>
                    <td className={styles.right}>
                      {`₹ ${totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </td>
                  </tr>
                </>
              );
            })()}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPaymentTable = () => {
    return (
      <div className={styles.tableContainer}>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>PAYMENT MODE</th>
              <th style={{ textAlign: 'left' }}>TRANSACTION / REFERENCE NO</th>
              <th style={{ textAlign: 'right' }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, rowIdx) => {
              const rawMode = item.paymentMethod || item.method || item.paymentType || '-';
              const mode = String(rawMode).toUpperCase();
              let ref = item.transactionRef || item.referenceNumber || item.refNo || '---------';
              if (mode === 'CASH') ref = '-';
              const amt = item.amount || item.amountPaid || '0';
              return (
                <tr key={rowIdx}>
                  <td className={styles.left}>{mode}</td>
                  <td className={styles.left}>{ref}</td>
                  <td className={styles.right}>₹ {parseFloat(amt).toLocaleString()}</td>
                </tr>
              );
            })}
            <tr className={styles.paymentTotalRow}>
              <td colSpan={2} className={styles.left}>{title.toLowerCase().includes('out') ? 'TOTAL PAID' : 'TOTAL RECEIVED'}</td>
              <td className={styles.right}>{paidAmountStr}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    document.body.classList.add('is-printing-pdf');
    return () => document.body.classList.remove('is-printing-pdf');
  }, []);

  const content = (
    <div id="print-invoice-wrapper" className={styles.printWrapper}>
      <div className={styles.pdfTopbar}>
        <span className={styles.pdfTitle}>{title} Preview</span>
        <div className={styles.pdfActions}>
          <button className={styles.pdfBtn} onClick={() => window.print()}>Print</button>
          <button className={styles.pdfBtnDownload} onClick={handleDownload}>Download</button>
          {onClose && (
            <button className={styles.pdfBtnClose} onClick={onClose}>Close</button>
          )}
        </div>
      </div>

      <div id="pdf-content-container" className={styles.printContainer}>
        <div className={styles.topGreyBar}>
          {title || 'Sale Invoice'}
        </div>

        <div className={styles.companyHeader}>
          <div className={styles.companyInfo}>
            <h2>{companyName}</h2>
            <p>Ph no. {companyPhone}</p>
          </div>
          <div className={`${styles.imagePlaceholder} ${clinicProfileImage ? styles.imagePlaceholderTransparent : ''}`}>
            {clinicProfileImage ? (
              <img src={clinicProfileImage} alt="Clinic Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              "Image"
            )}
          </div>
        </div>

        <div className={styles.subHeader}>
          <div className={styles.billTo}>
            <h4>{isPayment ? 'Paid To:' : 'Bill To:'}</h4>
            {customerDetails && (
              <>
                <h3>{customerDetails.name}</h3>
                {customerDetails.address && <p>{customerDetails.address}</p>}
                {(customerDetails.phone || customerDetails.contact) && (
                  <p>Contact No : {customerDetails.phone || customerDetails.contact}</p>
                )}
              </>
            )}
            {!customerDetails && <h3>Classic enterprises</h3>}
          </div>
          <div className={styles.invoiceDetails}>
            <h4>{isPayment ? (title.toLowerCase().includes('out') ? 'Supplier Payment Details' : 'Customer Payment Details') : (title.toLowerCase().includes('return') ? 'Return Details' : 'Invoice Details')}</h4>
            {invoiceDetails ? (
              Object.entries(invoiceDetails).map(([k, v]) => {
                if (k.toLowerCase().includes('total') || k.toLowerCase().includes('paid')) return null; // Hide totals from details header
                return <p key={k}>{k} : {v}</p>;
              })
            ) : (
              <>
                <p>Invoice No : Inv. 101</p>
                <p>Date : {new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</p>
              </>
            )}
          </div>
        </div>

        {isPayment && (
          <div className={styles.amountPaidBar}>
            <span>AMOUNT PAID</span>
            <span>{paidAmountStr}</span>
          </div>
        )}

        {isPayment && (
          <div className={styles.amountInWordsBox}>
            <div className={styles.amountInWordsHeader}>AMOUNT IN WORDS</div>
            <div className={styles.amountInWordsText}>{numberToWords(numericPaidAmount)}</div>
          </div>
        )}

        {!isPayment ? renderInvoiceTable() : renderPaymentTable()}

        {!isPayment && (
          <div className={styles.bottomSection}>
            <div className={styles.amountInWordsSplit}>
              <div className={styles.amountInWordsSplitHeader}>AMOUNT IN WORDS</div>
              <div className={styles.amountInWordsSplitText}>{numberToWords(numericPaidAmount)}</div>
            </div>
            <div className={styles.amountsSplit}>
              <div className={styles.amountsSplitHeader}>AMOUNTS</div>
              <div className={styles.amountsSummary}>
                {summary && summary.map((row, idx) => (
                  <div key={idx} className={`${styles.summaryRow} ${row.isTotal ? styles.total : ''}`}>
                    <span>{row.label.toUpperCase()}</span>
                    <span>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ flexGrow: 1 }}></div>

        <div className={styles.footerArea}>
          <div className={styles.signatureBox}>
            <div className={styles.signatureHeader}>FOR MY COMPANY</div>
            <div className={styles.signatureBody}>AUTHORIZED SIGNATURE</div>
          </div>
        </div>

        <div className={styles.bottomBranding}>
          SMART BUSINESS SOLUTIONS BY ZAANVAR
        </div>

      </div>
    </div>
  );

  if (mounted) {
    return createPortal(content, document.body);
  }
  return content;
};

export default PrintInvoiceTemplate;

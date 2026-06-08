import React from 'react';
import styles from '../../styles/shared/print-invoice.module.css';
import useDashboardData from '../../components/dashboard/useDashboardData';

const PrintInvoiceTemplate = ({
  title,
  customerDetails,
  invoiceDetails,
  columns,
  items,
  summary,
  notes,
  onClose
}) => {
  const { branchData } = useDashboardData({ skipReviews: true });

  const companyName = branchData?.storeName || 'Zaanvar Business';
  const companyPhone = branchData?.mobile || '';
  const companyEmail = branchData?.email || '';
  const companyAddress = [branchData?.address1, branchData?.address2, branchData?.city, branchData?.state, branchData?.pincode]
    .filter(Boolean)
    .join(', ');

  return (
    <div className={styles.printWrapper}>
      <div className={styles.pdfTopbar}>
        <span className={styles.pdfTitle}>{title} Preview</span>
        <div className={styles.pdfActions}>
          <button className={styles.pdfBtn} onClick={() => window.print()}>Print</button>
          {onClose && (
            <button className={styles.pdfBtnClose} onClick={onClose}>Close</button>
          )}
        </div>
      </div>

      <div className={styles.printContainer}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <img 
              src="https://zaanvar-care.b-cdn.net/media/1761368604038-ZAANVAR_FINAL.png" 
              alt="Zaanvar Business" 
            />
          </div>
          <div className={styles.companyDetails}>
            <div className={styles.companyName}>{companyName}</div>
            {companyAddress && <div>{companyAddress}</div>}
            {companyPhone && <div>Phone: {companyPhone}</div>}
            {companyEmail && <div>Email: {companyEmail}</div>}
          </div>
        </div>

        <div className={styles.title}>{title}</div>

        {(customerDetails || invoiceDetails) && (
          <div className={styles.metadataRow}>
            {customerDetails && (
              <div className={styles.partyBox}>
                <h4>Billed To</h4>
                <div className={styles.partyName}>{customerDetails.name}</div>
                {customerDetails.phone && <div>Phone: {customerDetails.phone}</div>}
                {customerDetails.email && <div>Email: {customerDetails.email}</div>}
                {customerDetails.address && <div>{customerDetails.address}</div>}
              </div>
            )}
            {invoiceDetails && (
              <div className={styles.detailsBox}>
                <table>
                  <tbody>
                    {Object.entries(invoiceDetails).map(([key, value]) => (
                      <tr key={key}>
                        <th>{key}:</th>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {items && items.length > 0 && (
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={styles[col.align] || ''}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, rowIdx) => (
                <tr key={rowIdx}>
                  {columns.map((col, colIdx) => {
                    const value = col.accessor ? item[col.accessor] : col.render(item, rowIdx);
                    return (
                      <td key={colIdx} className={styles[col.align] || ''}>{value}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className={styles.summarySection}>
          <div className={styles.summaryBox}>
            {summary && summary.map((row, idx) => (
              <div key={idx} className={`${styles.summaryRow} ${row.isTotal ? styles.total : ''}`}>
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          {notes && (
            <div className={styles.terms}>
              <h5>Terms & Conditions / Notes</h5>
              <p>{notes}</p>
            </div>
          )}

          <div className={styles.signatureArea}>
            <div className={styles.signatureBox}>
              <div className={styles.signatureLine}>Customer Signature</div>
            </div>
            <div className={styles.signatureBox}>
              <div className={styles.signatureLine}>Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintInvoiceTemplate;

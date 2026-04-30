import React from "react";
import styles from "../../styles/suppliers/suppliers.module.css";

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const SupplierList = ({ 
  suppliers, 
  loading, 
  selectedIds, 
  onToggleSelection, 
  onSelectAll, 
  onView, 
  onEdit, 
  onDelete,
  onBulkDelete
}) => {
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  const paginatedSuppliers = suppliers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input 
                  type="checkbox" 
                  checked={suppliers.length > 0 && selectedIds.length === suppliers.length}
                  onChange={() => onSelectAll(suppliers.map(s => s.supplierId))}
                />
              </th>
              <th>Supplier ID</th>
              <th>Supplier Type</th>
              <th>Supplier Name</th>
              <th>Branch Assigned</th>
              <th>Order QTY</th>
              <th>Received QTY</th>
              <th>Return QTY</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40 }}>Loading suppliers...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40 }}>No suppliers found</td></tr>
            ) : (
              paginatedSuppliers.map((s) => (
                <tr key={s.supplierId}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(s.supplierId)}
                      onChange={() => onToggleSelection(s.supplierId)}
                    />
                  </td>
                  <td>{s.supplierId}</td>
                  <td style={{ textTransform: 'uppercase' }}>{s.supplierType || "-"}</td>
                  <td>{s.supplierName}</td>
                  <td>{s.branches?.map(b => b.name).join(", ") || "-"}</td>
                  <td>000</td>
                  <td>000</td>
                  <td>000</td>
                  <td style={{ color: '#27AE60', fontWeight: 600 }}>₹000</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <div className={styles.paginationLeft}>
          <div className={styles.rowsPerPage}>
            Rows per Page
            <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>
              {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, suppliers.length)} of {suppliers.length} Items
            </span>
          </div>
        </div>

        <div className={styles.paginationCenter}>
          {selectedIds.length > 0 && (
            <div className={styles.bulkActionsInline}>
              <span 
                className={styles.bulkCount} 
                onClick={() => onSelectAll([])}
                style={{ cursor: 'pointer' }}
                title="Unselect All"
              >
                ✕ {selectedIds.length} Items Selected
              </span>
              <div className={styles.bulkDivider} />
              <div className={styles.actionItem} onClick={() => onView(selectedIds[0])}>
                <IconEye /> View
              </div>
              <div className={styles.actionItem} onClick={() => onEdit(selectedIds[0])}>
                <IconEdit /> Edit
              </div>
              <div className={styles.actionItem} onClick={onBulkDelete}>
                <IconTrash /> Delete
              </div>
            </div>
          )}
        </div>

        <div className={styles.paginationRight}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </button>
            <button 
              className={`${styles.pageBtn} ${styles.nextBtn}`}
              disabled={currentPage * rowsPerPage >= suppliers.length}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierList;

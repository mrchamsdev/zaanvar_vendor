import React from "react";
import styles from "../../styles/suppliers/suppliers.module.css";
import EmptyState from "../utilities/EmptyState";
import useCurrencySymbol from "@/components/utilities/useCurrencySymbol";
import useStore from "@/components/state/useStore";
import { getBoolSetting } from "@/utilities/settings-utils";
import { getAmountDecimalPlaces } from "../utilities/formatAmount";

const ActiveSupplierIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M7.2 7.2C9.18824 7.2 10.8 5.58822 10.8 3.6C10.8 1.61178 9.18824 0 7.2 0C5.21178 0 3.6 1.61178 3.6 3.6C3.6 5.58822 5.21178 7.2 7.2 7.2ZM7.2 7.2C3.224 7.2 0 10.424 0 14.4H7.65824C7.26432 13.6888 7.04 12.8706 7.04 12C7.04 10.1124 8.0944 8.47112 9.64632 7.63288C8.88376 7.35448 8.06032 7.2 7.2 7.2ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79088 14.2091 8 12 8C9.79088 8 8 9.79088 8 12C8 14.2091 9.79088 16 12 16ZM14.2594 10.8594L11.8594 13.2594L11.52 13.5989L11.1806 13.2594L9.74056 11.8194L10.4194 11.1406L11.52 12.2412L13.5806 10.1806L14.2594 10.8594Z" fill="#09B51A" /></svg>);

const InactiveSupplierIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none"><path d="M13.2781 10.2517C13.2549 10.2646 13.2333 10.2803 13.2137 10.3L11.212 12.3016L9.16992 10.2599C9.73043 9.79762 10.4481 9.51953 11.2293 9.51953C12.0059 9.51953 12.7196 9.79448 13.2781 10.2517Z" fill="#E60000" /><path d="M14.468 12.76C14.468 13.5436 14.1883 14.2632 13.7233 14.8245C13.7123 14.8072 13.6993 14.7907 13.684 14.7758L11.627 12.7184L13.6286 10.7168C13.6498 10.6956 13.6671 10.6716 13.6805 10.6465C14.1707 11.2144 14.468 11.9529 14.468 12.76Z" fill="#E60000" /><path d="M13.32 15.2326C12.7552 15.7106 12.0257 16.0001 11.2292 16.0001C10.4267 16.0001 9.69179 15.7063 9.125 15.2212C9.12579 15.2204 9.12618 15.22 9.12696 15.2196L11.2119 13.1348L13.2693 15.1917C13.285 15.2075 13.3019 15.2208 13.32 15.2326Z" fill="#E60000" /><path d="M10.7948 12.7175L8.71337 14.7988C8.26048 14.2414 7.98828 13.5317 7.98828 12.7591C7.98828 11.9653 8.2758 11.2379 8.75108 10.6738L10.7948 12.7175Z" fill="#E60000" /><path d="M9.18996 15.9995H0.268932C0.110246 15.9995 -0.0126974 15.8629 0.00105021 15.705C0.315282 12.1696 3.43364 9.38477 7.2217 9.38477C7.84427 9.38477 8.45898 9.45979 9.05484 9.60786C8.0548 10.2995 7.39845 11.4539 7.39845 12.7591C7.39884 14.1221 8.11451 15.3208 9.18996 15.9995Z" fill="#E60000" /><path d="M9.79294 7.71932C11.2139 6.29838 11.2139 3.99459 9.79294 2.57365C8.37197 1.15271 6.06811 1.15271 4.64713 2.57365C3.22615 3.99459 3.22615 6.29838 4.64713 7.71932C6.06811 9.14026 8.37197 9.14025 9.79294 7.71932Z" fill="#E60000" /></svg>);

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
  onBulkDelete,
  onAddClick,
  searchTerm = ""
}) => {
  const currencySymbol = useCurrencySymbol();
  const { vendorSettings } = useStore();
  const manageSupplierStatus = getBoolSetting(vendorSettings, 'manageSupplierStatus', false);
  const showSupplierGrouping = vendorSettings?.party?.supplierGrouping || vendorSettings?.settings?.party?.supplierGrouping;

  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  const paginatedSuppliers = suppliers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <>
      {loading ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <tbody>
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40 }}>Loading suppliers...</td></tr>
            </tbody>
          </table>
        </div>
      ) : suppliers.length === 0 ? (
        searchTerm ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      disabled
                    />
                  </th>
                  <th>Supplier ID</th>
                  <th>Supplier Type</th>
                  <th>Supplier Name</th>
                  {showSupplierGrouping && <th>Group Name</th>}
                  <th>Branch Assigned</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={showSupplierGrouping ? 7 : 6} style={{ textAlign: 'center', padding: 40, color: '#666', fontWeight: 500 }}>
                    The search you entered is not matching to any supplier
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            buttonText="Add Supplier"
            onAddClick={onAddClick}
          />
        )
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={suppliers.length > 0 && selectedIds.length === suppliers.length}
                    onChange={() => onSelectAll(suppliers.map(s => s.supplierId))}
                  />
                </th>
                <th>Supplier ID</th>
                <th>Supplier Type</th>
                <th>Supplier Name</th>
                {showSupplierGrouping && <th>Group Name</th>}
                <th>Branch Assigned</th>

                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSuppliers.map((s) => (
                <tr key={s.supplierId}>
                  <td>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selectedIds.includes(s.supplierId)}
                      onChange={() => onToggleSelection(s.supplierId)}
                    />
                  </td>
                  <td>
                    <span className={styles.supplierIdCell}>
                      <span className={styles.supplierIdText}>{s.supplierId}</span>
                      {manageSupplierStatus && (s.isActive ? <ActiveSupplierIcon /> : <InactiveSupplierIcon />)}
                    </span>
                  </td>
                  <td style={{ textTransform: 'uppercase' }}>{Array.isArray(s.supplierType) ? s.supplierType.join(', ') : (s.supplierType || "-")}</td>
                  <td>{s.supplierName}</td>
                  {showSupplierGrouping && <td>{s.groupName || "-"}</td>}
                  <td>{s.branches?.map(b => b.name).join(", ") || "-"}</td>

                  <td style={{
                    color: Number(s.totals?.[0]?.totalBalanceAmount || 0) > 0 ? '#E9315D' :
                      Number(s.totals?.[0]?.totalBalanceAmount || 0) < 0 ? '#27AE60' : '#333',
                    fontWeight: 600
                  }}>{currencySymbol} {Math.abs(Number(s.totals?.[0]?.totalBalanceAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {suppliers.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.paginationLeft}>
            <div className={styles.rowsPerPage}>
              Rows per Page
              <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
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
              {currentPage > 1 && (
                <button
                  className={styles.pageBtn}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </button>
              )}
              {currentPage * rowsPerPage < suppliers.length && (
                <button
                  className={`${styles.pageBtn} ${styles.nextBtn}`}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupplierList;

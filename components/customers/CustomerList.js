import React from "react";
import styles from "../../styles/customers/customers.module.css";
import EmptyState from "../utilities/EmptyState";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "-";
  const pad = (n) => n.toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = pad(d.getDate());
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day} ${month} ${year}, ${hours}:${minutes}${ampm}`;
};

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

const CustomerList = ({
  customers,
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
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  const paginatedCustomers = customers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <>
      {loading ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <tbody>
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40 }}>Loading customers...</td></tr>
            </tbody>
          </table>
        </div>
      ) : customers.length === 0 ? (
        searchTerm ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" className={styles.checkbox} disabled />
                  </th>
                  <th>PETS</th>
                  <th>CUSTOMER NAME</th>
                  <th>CONTACT NUMBER</th>
                  <th>REVENUE</th>
                  <th>BOOKINGS</th>
                  <th>CREATED ON</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#666', fontWeight: 500 }}>
                    The search you entered is not matching to any record
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            buttonText="Add Customer"
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
                    checked={customers.length > 0 && selectedIds.length === customers.length}
                    onChange={() => onSelectAll(customers.map(c => c.vendorCustomerId))}
                  />
                </th>
                <th>PETS</th>
                <th>CUSTOMER NAME</th>
                <th>CONTACT NUMBER</th>
                <th>REVENUE</th>
                <th>BOOKINGS</th>
                <th>CREATED ON</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((c) => (
                <tr key={c.vendorCustomerId}>
                  <td>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selectedIds.includes(c.vendorCustomerId)}
                      onChange={() => onToggleSelection(c.vendorCustomerId)}
                    />
                  </td>
                  <td>
                    {c.pets && c.pets.length > 0 ? (
                      c.pets.map((p, i) => (
                        <div key={i} style={{ marginBottom: i < c.pets.length - 1 ? 8 : 0 }}>
                          <div style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 13 }}>{p.petName || "-"}</div>
                          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>{p.breed || "-"}</div>
                        </div>
                      ))
                    ) : "-"}
                  </td>
                  <td style={{ textTransform: 'uppercase', fontWeight: 500 }}>
                    {`${c.firstName || ""} ${c.lastName || ""}`.trim() || "-"}
                  </td>
                  <td>{c.phoneNumber || "-"}</td>
                  <td style={{ fontWeight: 600 }}>
                    ₹{Number(c.overallTotals?.totalAmount || 0).toLocaleString()}
                  </td>
                  <td>{c.orders?.length || 0}</td>
                  <td>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {customers.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.paginationLeft}>
            <div className={styles.rowsPerPage}>
              Rows per Page
              <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>
                {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, customers.length)} of {customers.length} Items
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
              {currentPage * rowsPerPage < customers.length && (
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

export default CustomerList;

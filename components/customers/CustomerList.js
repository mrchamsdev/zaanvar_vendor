import React from "react";
import styles from "../../styles/customers/customers.module.css";
import EmptyState from "../utilities/EmptyState";
import { FiMoreVertical } from "react-icons/fi";

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

const IconThreeDots = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
);

const CustomerList = ({
  customers,
  loading,
  onView,
  onEdit,
  onDelete,
  onAddClick,
  searchTerm = ""
}) => {
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [activeMenuId, setActiveMenuId] = React.useState(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${styles.actionCell}`)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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
              <tr><td colSpan="9" className={styles.loadingCell}>Loading customers...</td></tr>
            </tbody>
          </table>
        </div>
      ) : customers.length === 0 ? (
        searchTerm ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>PETS</th>
                  <th>CUSTOMER NAME</th>
                  <th>CONTACT NUMBER</th>
                  <th>REVENUE</th>
                  <th>BOOKINGS</th>
                  <th>CREATED ON</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="7" className={styles.emptyCell}>
                    The search you entered is not matching to any customer
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
                <th>PETS</th>
                <th>CUSTOMER NAME</th>
                <th>CONTACT NUMBER</th>
                <th>REVENUE</th>
                <th>BOOKINGS</th>
                <th>CREATED ON</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((c) => (
                <tr key={c.vendorCustomerId}>
                  <td>
                    {c.pets && c.pets.length > 0 ? (
                      <div className={styles.petContainer}>
                        <div className={styles.petItem}>
                          <div className={styles.petName}>{c.pets[0].petName || "-"}</div>
                          <div className={styles.petBreed}>{c.pets[0].breed || "-"}</div>
                        </div>
                        {c.pets.length > 1 && (
                          <div className={styles.petBadgeWrapper}>
                            <span className={styles.petBadge}>+{c.pets.length - 1}</span>
                            <div className={styles.petTooltip}>
                              {c.pets.map((p, i) => (
                                <div key={i} className={styles.petTooltipItem}>
                                  <div className={styles.tooltipPetName}>{p.petName || "-"}</div>
                                  <div className={styles.petBreed}>{p.breed || "-"}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : "-"}
                  </td>
                  <td className={styles.customerNameCell}>
                    {`${c.firstName || ""} ${c.lastName || ""}`.trim() || "-"}
                  </td>
                  <td>{c.phoneNumber || "-"}</td>
                  <td className={styles.revenueCell}>
                    ₹{Number(c.overallTotals?.totalAmount || 0).toLocaleString()}
                  </td>
                  <td>0</td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td className={styles.actionCell}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          className={styles.threeDotsBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === c.vendorCustomerId ? null : c.vendorCustomerId);
                          }}
                        >
                          <FiMoreVertical />
                        </button>
                        {activeMenuId === c.vendorCustomerId && (
                          <div className={styles.dropdownMenu}>
                            <div className={styles.dropdownItem} onClick={() => { onView(c.vendorCustomerId); setActiveMenuId(null); }}>
                              View
                            </div>
                            <div className={styles.dropdownItem} onClick={() => { onEdit(c.vendorCustomerId); setActiveMenuId(null); }}>
                              Edit
                            </div>
                            <div className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={() => { onDelete(c.vendorCustomerId); setActiveMenuId(null); }}>
                              Delete
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
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
          </div>

          <div className={styles.paginationRight}>
            <div className={styles.paginationBtns}>
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

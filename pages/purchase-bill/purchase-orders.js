import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/purchase-bill/purchase-bill.module.css";
import { purchaseService } from "../../services/purchaseService";
import useDashboardData from "../../components/dashboard/useDashboardData";
import useStore from "../../components/state/useStore";
import PurchaseOrderManager from "../../components/purchase-bill/purchase-order-manager";
import EmptyState from "../../components/utilities/EmptyState";

/* ── Inline Icons ────────────────────────────────────────── */
const IconPlus = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const IconSearch = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
);

const PurchaseOrdersPage = () => {
    const router = useRouter();

    const { jwtToken } = useStore();
    const { branches, branchId } = useDashboardData();

    const [loading, setLoading] = useState(false);
    const [purchaseRequests, setPurchaseRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [managerConfig, setManagerConfig] = useState(null); // { mode: 'Add'|'View', id: null }

    const [summary, setSummary] = useState(null);

    // Fetch Purchase Requests
    useEffect(() => {
        if (jwtToken && branchId) {
            fetchOrders();
        }
    }, [jwtToken, branchId]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await purchaseService.getPurchaseRequests(jwtToken, branchId);
            if (response.status === "success") {
                // If data contains both summary and list, or just a list
                const data = response.data || [];
                if (Array.isArray(data)) {
                    setPurchaseRequests(data);
                    // Generate local summary if not provided
                    setSummary(null); 
                } else if (data.orders) {
                    setPurchaseRequests(data.orders);
                    setSummary(data.summary || data); // Store summary if it's an object
                }
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter and Paginate Data
    const filteredData = useMemo(() => {
        let data = [...purchaseRequests];
        
        // Sort by createdDate descending (recent first)
        data.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            data = data.filter(item => 
                String(item.productsPurchaseRqstID).toLowerCase().includes(s) ||
                item.supplier?.supplierName?.toLowerCase().includes(s)
            );
        }
        return data;
    }, [purchaseRequests, searchTerm]);

    const stats = useMemo(() => {
        if (summary) {
            return {
                total: summary.totalPurchaseRequests || 0,
                paid: summary.paidCount || 0,
                unpaid: summary.unpaidCount || 0,
                partiallyPaid: summary.partiallyPaidCount || 0
            };
        }
        const total = purchaseRequests.length;
        const paid = purchaseRequests.filter(item => 
            item.paymentStatus === "Paid" || (!item.paymentStatus && item.status === "accepted")
        ).length;
        const unpaid = purchaseRequests.filter(item => 
            !item.paymentStatus && item.status !== "accepted"
        ).length;
        const partiallyPaid = purchaseRequests.filter(item => item.paymentStatus === "Partial").length;
        return { total, paid, unpaid, partiallyPaid };
    }, [purchaseRequests, summary]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage]);

    const openOrder = (id = null, mode = "View") => {
        setManagerConfig({ mode, id });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).toUpperCase();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount || 0).replace("₹", "₹ ");
    };

    return (
        <DashboardLayout
            customTopbarRight={(
                <div className={styles.addBtnWrapper}>
                    <button className={styles.addBtn} onClick={() => openOrder(null, "Add")}>
                        <IconPlus /> Add Purchase Order
                    </button>
                </div>
            )}
        >
            <div className={styles.container}>
                {managerConfig && (
                    <PurchaseOrderManager 
                        mode={managerConfig.mode}
                        initialId={managerConfig.id}
                        onSave={() => {
                            console.log("Orders: onSave triggered");
                            setManagerConfig(null);
                            fetchOrders();
                        }}
                        onClose={() => {
                            console.log("Orders: onClose triggered, hiding form");
                            setManagerConfig(null);
                            fetchOrders();
                        }} 
                    />
                )}

                {/* Fixed Top Section */}
                <div className={styles.topSection}>
                    <div className={styles.statusTabsRow}>
                        <div className={styles.statusGroup}>
                            <span className={styles.statusLabel}>Overall Status :</span>
                            <div className={styles.statusBadge}>TOTAL purchase Orders: {String(stats.total).padStart(2, '0')}</div>
                            <div className={styles.statusBadge}>Total Paid : {String(stats.paid).padStart(2, '0')}</div>
                            <div className={styles.statusBadge}>Total Unpaid : {String(stats.unpaid).padStart(2, '0')}</div>
                            <div className={styles.statusBadge}>Partially paid : {String(stats.partiallyPaid).padStart(2, '0')}</div>
                        </div>
                    </div>

                    <div className={styles.searchRow}>
                        <div className={styles.searchBox}>
                            <div className={styles.searchIcon}><IconSearch /></div>
                            <input 
                                type="text" 
                                placeholder="Search order number or supplier name" 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                {loading ? (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <tbody>
                                <tr><td colSpan="7" style={{textAlign: 'center', padding: 40}}>Loading...</td></tr>
                            </tbody>
                        </table>
                    </div>
                ) : filteredData.length === 0 ? (
                    <EmptyState 
                        buttonText="Add Purchase Order"
                        onAddClick={() => openOrder(null, "Add")}
                    />
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ORDER DATE</th>
                                    <th>ORDER NO</th>
                                    <th>SUPPLIER NAME</th>
                                    <th>TO</th>
                                    <th>Order Value (₹)</th>
                                    <th>Purchase Order</th>
                                    <th>Invoice</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((item) => (
                                    <tr key={item.productsPurchaseRqstID} onClick={() => openOrder(item.productsPurchaseRqstID, "View")} style={{cursor: 'pointer'}}>
                                        <td>{formatDate(item.createdDate)}</td>
                                        <td>{`PO-${String(item.productsPurchaseRqstID).padStart(5, '0')}`}</td>
                                        <td>{item.supplier?.supplierName || "-"}</td>
                                        <td>{item.branchName || "-"}</td>
                                        <td>{formatCurrency(item.totalCost)}</td>
                                        <td>
                                            <div className={styles.statusBadgeGroup}>
                                                <span className={item.orderStatus?.toLowerCase() === "received" ? styles.statusSuccess : styles.statusPrimary}>
                                                    {item.orderStatus || "Pending"}
                                                </span>
                                                <span className={styles.statusSecondary}>{formatDate(item.createdDate)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {["order placed", "cancel order", "cancel", "draft"].includes(item.orderStatus?.toLowerCase()) ? (
                                                <div style={{textAlign: 'center', width: '100%', color: '#ccc', fontWeight: '700', fontSize: '14px'}}>---</div>
                                            ) : (
                                                <div className={styles.statusBadgeGroup}>
                                                    <span className={
                                                        item.paymentStatus === "Full" || item.paymentStatus === "Paid" ? styles.statusPaid : 
                                                        (item.paymentStatus === "Partial" ? styles.statusPending : styles.statusPending)
                                                    }>
                                                        {(item.paymentStatus === "Full" || item.paymentStatus === "Paid") ? "Paid" : (item.paymentStatus || "Pending")}
                                                    </span>
                                                    <span className={styles.statusSecondary}>{formatDate(item.createdDate)}</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer/Pagination */}
                {filteredData.length > 0 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationLeft}>
                            <div className={styles.rowsPerPage}>
                                Rows per Page
                                <select 
                                    value={rowsPerPage} 
                                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                >
                                    {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span>
                                    {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} Items
                                </span>
                            </div>
                        </div>

                        <div className={styles.paginationRight}>
                            <div style={{display: 'flex', gap: 12}}>
                                {currentPage > 1 && (
                                    <button 
                                        className={styles.pageBtn} 
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                    >
                                        Previous
                                    </button>
                                )}
                                {currentPage < totalPages && (
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
            </div>
        </DashboardLayout>
    );
};

export default PurchaseOrdersPage;

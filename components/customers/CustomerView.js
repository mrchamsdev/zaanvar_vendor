import React, { useState, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import styles from "../../styles/customers/customerView.module.css";
import { customerService } from "../../services/customerService";
import { useRouter } from "next/router";
import useStore from "../state/useStore";

const CustomerView = ({ data: initialData, onBack, isSplit, onEdit }) => {
    const { jwtToken } = useStore();
    const [data, setData] = useState(initialData || {});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("Sales");
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchFullData = async () => {
            if (initialData?.vendorCustomerId) {
                setLoading(true);
                try {
                    const res = await customerService.getCustomerById(jwtToken, initialData.vendorCustomerId);
                    if (res && (res.data || res.customer)) {
                        setData(res.data || res.customer);
                    }
                } catch (err) {
                    console.error("Failed to fetch full customer data", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchFullData();
    }, [initialData?.vendorCustomerId, jwtToken]);

    const sidebarNavs = ["Bookings", "Pets", "Reminders", "Wallet", "Sales", "Payments ", "Reviews"];
    const rightTabs = ["Clinic", "Boarding", "Daycare", "Grooming", "Ordered", "Return", "Payments "];

    const [activeRightTab, setActiveRightTab] = useState("Ordered");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeRightTab]);

    const PaginationFooter = ({ totalItems = 0 }) => {
        const totalPages = Math.ceil(totalItems / rowsPerPage);
        const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
        const endItem = Math.min(currentPage * rowsPerPage, totalItems);

        return (
            <div className={styles.paginationContainer}>
                <div className={styles.paginationLeft}>
                    <div className={styles.rowsPerPageContainer}>
                        Rows per Page
                        <select
                            className={styles.rowsSelect}
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div>{totalItems > 0 ? `${startItem} - ${endItem} of ${totalItems} Items` : "0 Items"}</div>
                </div>
                <div className={styles.paginationRight}>
                    <button
                        className={`${styles.pageButton} ${styles.pageButtonPrev}`}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >Previous</button>
                    <button
                        className={`${styles.pageButton} ${styles.pageButtonNext}`}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        style={{ opacity: currentPage === totalPages || totalPages === 0 ? 0.5 : 1, cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer' }}
                    >Next</button>
                </div>
            </div>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const renderRightContent = () => {
        if (loading) {
            return <div className={styles.emptyState}>Loading...</div>;
        }

        if (activeRightTab === "Ordered") {
            const orders = data.orders || [];
            return (
                <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                        <h4 className={styles.tableTitle}> Orders</h4>
                        <div className={styles.tableTabsContainer}>
                            {rightTabs.map(t => (
                                <button key={t} onClick={() => setActiveRightTab(t)} className={`${styles.tableTab} ${activeRightTab === t ? styles.tableTabActive : styles.tableTabInactive}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    {orders.length === 0 ? (
                        <div className={styles.emptyState}>No orders found</div>
                    ) : (
                        <div className={styles.tableScrollContainer}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr className={styles.dataTableHeaderRow}>
                                        <th className={styles.dataTableHeader}>Date</th>
                                        <th className={styles.dataTableHeader}>Invoice</th>
                                        <th className={styles.dataTableHeader}>Payment Type</th>
                                        <th className={styles.dataTableHeader}>Amount</th>
                                        <th className={styles.dataTableHeader}>Balance</th>
                                        <th className={styles.dataTableHeaderCenter}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((item, i) => (
                                        <tr key={i} className={styles.dataTableRow}>
                                            <td className={styles.dataTableCell}>{formatDate(item.createdDate)}</td>
                                            <td className={styles.dataTableCell}>{safeRender(item.userOrderId)}</td>
                                            <td className={styles.dataTableCell}>{safeRender(item.paymentMethod, 'Cash')}</td>
                                            <td className={styles.dataTableCell}>₹ {safeRender(item.totalAmount, '0.00')}</td>
                                            <td className={styles.dataTableCell}>₹ {safeRender(item.dueAmount, '0.00')}</td>
                                            <td className={styles.dataTableCellCenter} style={{ position: 'relative' }}>
                                                <button className={styles.actionButton} onClick={() => setOpenDropdownId(openDropdownId === item.userOrderId ? null : item.userOrderId)}>
                                                    <FiMoreVertical />
                                                </button>
                                                {openDropdownId === item.userOrderId && (
                                                    <div className={styles.dropdownMenu}>
                                                        <button className={styles.dropdownItem} onClick={() => {
                                                            const returnUrl = `/customers?branchId=${router.query.branchId || ''}&action=view&id=${data.vendorCustomerId || initialData?.vendorCustomerId}`;
                                                            router.push(`/sale/sales-invoice?branchId=91&view=true&id=${item.userOrderId}&returnUrl=${encodeURIComponent(returnUrl)}`);
                                                        }}>View</button>
                                                        <button className={styles.dropdownItem}>Print</button>
                                                        <button className={styles.dropdownItem}>Open PDF</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <PaginationFooter totalItems={orders.length} />
                </div>
            );
        } else if (activeRightTab === "Return") {
            const returns = data.returns || [];
            return (
                <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                        <h4 className={styles.tableTitle}> Returns</h4>
                        <div className={styles.tableTabsContainer}>
                            {rightTabs.map(t => (
                                <button key={t} onClick={() => setActiveRightTab(t)} className={`${styles.tableTab} ${activeRightTab === t ? styles.tableTabActive : styles.tableTabInactive}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    {returns.length === 0 ? (
                        <div className={styles.emptyState}>No returns found</div>
                    ) : (
                        <div className={styles.tableScrollContainer}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr className={styles.dataTableHeaderRow}>
                                        <th className={styles.dataTableHeader}>Date</th>
                                        <th className={styles.dataTableHeader}>Bill No</th>
                                        <th className={styles.dataTableHeader}>Return No</th>
                                        <th className={styles.dataTableHeader}>Received</th>
                                        <th className={styles.dataTableHeader}>Balance</th>
                                        <th className={styles.dataTableHeaderCenter}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returns.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((item, i) => (
                                        <tr key={i} className={styles.dataTableRow}>
                                            <td className={styles.dataTableCell}>{formatDate(item.createdDate)}</td>
                                            <td className={styles.dataTableCell}>{item.bill?.userOrderId || item.userOrderId || '-'}</td>
                                            <td className={styles.dataTableCell}>{item.customerReturnId}</td>
                                            <td className={styles.dataTableCell}>₹ {Number(item.totalReturnAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className={styles.dataTableCell}>₹ {Number(item.bill?.dueAmount || item.dueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className={styles.dataTableCellCenter}><button className={styles.actionButton}><FiMoreVertical /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <PaginationFooter totalItems={returns.length} />
                </div>
            );
        } else if (activeRightTab === "Payments " || activeRightTab === "Payment History") {
            const payments = data.payments || [];
            return (
                <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                        <h4 className={styles.tableTitle}>Payments</h4>
                        <div className={styles.tableTabsContainer}>
                            {rightTabs.map(t => (
                                <button key={t} onClick={() => setActiveRightTab(t)} className={`${styles.tableTab} ${activeRightTab === t ? styles.tableTabActive : styles.tableTabInactive}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    {payments.length === 0 ? (
                        <div className={styles.emptyState}>No payment history found</div>
                    ) : (
                        <div className={styles.tableScrollContainer}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr className={styles.dataTableHeaderRow}>
                                        <th className={styles.dataTableHeader}>Invoice Number</th>
                                        <th className={styles.dataTableHeader}>Invoice Id</th>
                                        <th className={styles.dataTableHeader}>Payment Date</th>
                                        <th className={styles.dataTableHeader}>Total amount</th>
                                        <th className={styles.dataTableHeader}>Payment Type</th>
                                        <th className={styles.dataTableHeader}>Paid amount</th>
                                        <th className={styles.dataTableHeader}>Balance</th>
                                        <th className={styles.dataTableHeaderCenter}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((item, i) => (
                                        <tr key={i} className={styles.dataTableRow}>
                                            <td className={styles.dataTableCell}>{safeRender(item.userOrderId)}</td>
                                            <td className={styles.dataTableCell}>{safeRender(item.paymentId)}</td>
                                            <td className={styles.dataTableCell}>{formatDate(item.paymentDate || item.createdDate)}</td>
                                            <td className={styles.dataTableCell}>₹ {safeRender(item.totalAmount, '0.00')}</td>
                                            <td className={styles.dataTableCell}>{safeRender(item.paymentMethod, 'Cash')}</td>
                                            <td className={styles.dataTableCell}>₹ {safeRender(item.amount, '0.00')}</td>
                                            <td className={styles.dataTableCell}>₹ {safeRender(item.balanceAmount || item.balance, '0.00')}</td>
                                            <td className={styles.dataTableCellCenter}><button className={styles.actionButton}><FiMoreVertical /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <PaginationFooter totalItems={payments.length} />
                </div>
            );
        } else {
            return (
                <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                        <h4 className={styles.tableTitle}> {activeRightTab}</h4>
                        <div className={styles.tableTabsContainer}>
                            {rightTabs.map(t => (
                                <button key={t} onClick={() => setActiveRightTab(t)} className={`${styles.tableTab} ${activeRightTab === t ? styles.tableTabActive : styles.tableTabInactive}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.emptyState}>Data under development</div>
                </div>
            );
        }
    };

    const safeRender = (val, fallback = '-') => {
        if (val === null || val === undefined || val === '') return fallback;
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    };

    return (
        <div className={styles.viewContainer}>
            <div className={styles.backButtonContainer} onClick={onBack}>
                <button className={styles.backButton}><span className={styles.backIcon}>←</span></button>
                Back
            </div>

            <div className={`${styles.mainLayout} ${isSplit ? styles.mainLayoutColumn : styles.mainLayoutRow}`}>
                {/* Left Sidebar */}
                <div className={isSplit ? styles.leftSidebarSplit : styles.leftSidebarNormal}>
                    <div className={styles.sidebarHeader}>
                        <h2 className={styles.sidebarName}>{`${safeRender(data.firstName, '')} ${safeRender(data.lastName, '')}`.trim() || 'Unknown'}</h2>
                        <div className={styles.sidebarPhone}>({safeRender(data.phoneNumber, 'N/A')})</div>
                    </div>
                    <div className={styles.navContainer}>
                        {sidebarNavs.map(nav => (
                            <button key={nav} onClick={() => setActiveTab(nav)} className={`${styles.navButton} ${activeTab === nav ? styles.navButtonActive : styles.navButtonInactive}`}>
                                {nav}
                            </button>
                        ))}
                    </div>
                    <div className={styles.personalInfoSection}>
                        <h4 className={styles.personalInfoTitle}>Personal Information</h4>
                        <div className={styles.infoGrid}>
                            <div>
                                <div className={styles.infoLabel}>Alternate Phone No</div>
                                <div className={styles.infoValue}>{safeRender(data.alternatePhoneNumber)}</div>
                            </div>
                            <div>
                                <div className={styles.infoLabel}>E-mail Id</div>
                                <div className={styles.infoValueBreak}>{safeRender(data.email)}</div>
                            </div>
                        </div>
                        <button onClick={onEdit} className={styles.editButton}>
                            <span className={styles.editIcon}>✎</span> Edit Customer Details
                        </button>
                    </div>
                </div>

                {/* Right Content */}
                <div className={styles.rightContent}>
                    {activeTab === "Sales" ? (
                        <>
                            <div className={isSplit ? styles.overviewGridSplit : styles.overviewGridNormal}>
                                <div className={styles.overviewCard}>
                                    <div className={styles.overviewHeader}>
                                        <h4 className={styles.overviewTitle}>Grooming Overview</h4>
                                        <span className={styles.overviewIcon}>ⓘ</span>
                                    </div>
                                    <div className={styles.overviewStatsGrid}>
                                        <div>
                                            <div className={styles.statValue}>₹900</div>
                                            <div className={styles.statLabel}>Revenue</div>
                                        </div>
                                        <div>
                                            <div className={styles.statValue}>1</div>
                                            <div className={styles.statLabel}>Appointments</div>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.overviewCard}>
                                    <div className={styles.overviewHeader}>
                                        <h4 className={styles.overviewTitle}>Boarding and Daycare Overview</h4>
                                        <span className={styles.overviewIcon}>ⓘ</span>
                                    </div>
                                    <div className={styles.overviewStatsGrid}>
                                        <div>
                                            <div className={styles.statValue}>₹900</div>
                                            <div className={styles.statLabel}>Revenue</div>
                                        </div>
                                        <div>
                                            <div className={styles.statValue}>1</div>
                                            <div className={styles.statLabel}>Appointments</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {renderRightContent()}
                        </>
                    ) : (
                        <div className={styles.tableCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                            <h2 style={{ color: '#555', fontWeight: '500' }}>{activeTab} and it is under development</h2>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerView;

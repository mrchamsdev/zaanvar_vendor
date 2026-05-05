
import React, { useState, useEffect } from "react";
import styles from "../../styles/sale/sales-invoice.module.css";
import { FiPrinter, FiShare2, FiMoreVertical, FiFilter, FiChevronLeft, FiChevronRight, FiCalendar, FiSearch } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import { useRouter } from "next/router";
import useStore from "../../components/state/useStore";
import { saleService } from "../../services/saleService";

import EmptyState from "../utilities/EmptyState";

const SalesReturnList = ({ onAddClick }) => {
    const router = useRouter();
    const { jwtToken } = useStore();
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [filterType, setFilterType] = useState("This Month");
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });

    const fetchReturns = async () => {
        if (!jwtToken) return;
        const branchId = router.query.branchId || 91;
        setLoading(true);
        const res = await saleService.getAllSalesReturns(jwtToken, branchId);
        if (res.status === "success") {
            setReturns(res.data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (router.isReady) {
            fetchReturns();
        }

        const handleRefresh = () => fetchReturns();
        window.addEventListener('refreshSalesReturnList', handleRefresh);
        return () => window.removeEventListener('refreshSalesReturnList', handleRefresh);
    }, [router.isReady, router.query.branchId, jwtToken]);

    const handleFilterChange = (type) => {
        setFilterType(type);
        setShowFilterDropdown(false);
    };

    const filteredReturns = returns.filter(r => {
        const name = `${r.customer?.firstName} ${r.customer?.lastName}`.toLowerCase();
        const ref = `SR-${r.customerReturnId}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || ref.includes(searchTerm.toLowerCase());
    });

    return (
        <div className={styles.container}>
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Filter by :</span>
                    <div className={styles.customSelectWrapper}>
                        <div 
                            className={styles.customSelectHeader}
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        >
                            <span>{filterType}</span>
                            <FiChevronRight style={{transform: showFilterDropdown ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s'}} />
                        </div>
                        {showFilterDropdown && (
                            <div className={styles.customSelectDropdown}>
                                {["This Month", "Last Month", "This Quarter", "This Year", "All", "Custom"].map(opt => (
                                    <div 
                                        key={opt} 
                                        className={`${styles.customSelectOption} ${filterType === opt ? styles.active : ''}`}
                                        onClick={() => handleFilterChange(opt)}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.filterGroup} style={{position: 'relative'}}>
                    <div className={styles.dateDisplay} onClick={() => setShowCustomPicker(!showCustomPicker)}>
                        <FiCalendar style={{marginRight: '8px', color: '#666'}} />
                        {new Date(dateRange.startDate).toLocaleDateString('en-GB')} To {new Date(dateRange.endDate).toLocaleDateString('en-GB')}
                    </div>
                </div>
            </div>

            <div className={styles.searchBar}>
                <FiSearch className={styles.searchIcon} />
                <input 
                    type="text" 
                    className={styles.searchInput} 
                    placeholder="Search products here" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className={styles.transactionsHeader}>
                <h2 className={styles.transactionsTitle}>Transactions</h2>
                <div className={styles.headerActions}>
                    <button className={styles.iconBtn} title="Export to Excel">
                        <FaFileExcel style={{color: '#217346'}} />
                    </button>
                    <button className={styles.iconBtn} title="Print">
                        <FiPrinter />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <tbody>
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            ) : filteredReturns.length === 0 ? (
                <EmptyState 
                    buttonText="Add Sales Return"
                    onAddClick={onAddClick}
                />
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>DATE <FiFilter className={styles.filterIcon} /></th>
                                <th>REF NO <FiFilter className={styles.filterIcon} /></th>
                                <th>CUSTOMER NAME <FiFilter className={styles.filterIcon} /></th>
                                <th>RECEIVED <FiFilter className={styles.filterIcon} /></th>
                                <th>BALANCE <FiFilter className={styles.filterIcon} /></th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReturns.map((r, idx) => (
                                <tr key={idx}>
                                    <td>{new Date(r.createdDate).toLocaleDateString('en-GB')}</td>
                                    <td>SR-{r.customerReturnId}</td>
                                    <td>{r.customer?.firstName} {r.customer?.lastName}</td>
                                    <td>{r.totalReturnAmount}</td>
                                    <td>0.00</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <FiShare2 className={styles.actionIcon} />
                                            <div style={{position: 'relative'}}>
                                                <FiMoreVertical className={styles.actionIcon} onClick={() => setActiveDropdown(activeDropdown === idx ? null : idx)} />
                                                {activeDropdown === idx && (
                                                    <div className={styles.dropdownMenu}>
                                                        <div className={styles.dropdownItem} onClick={() => {
                                                            router.push({ pathname: router.pathname, query: { ...router.query, edit: 'true', id: r.customerReturnId } }, undefined, { shallow: true });
                                                            setActiveDropdown(null);
                                                        }}>Edit</div>
                                                        <div className={styles.dropdownItem} onClick={() => {
                                                            router.push({ pathname: router.pathname, query: { ...router.query, view: 'true', id: r.customerReturnId } }, undefined, { shallow: true });
                                                            setActiveDropdown(null);
                                                        }}>View</div>
                                                        <div className={styles.dropdownItem}>Generate E-Invoice</div>
                                                        <div className={styles.dropdownItem}>Duplicate</div>
                                                        <div className={styles.dropdownItem}>Open PDF</div>
                                                        <div className={styles.dropdownItem}>Print</div>
                                                        <div className={styles.dropdownItem}>History</div>
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
        </div>
    );
};

export default SalesReturnList;

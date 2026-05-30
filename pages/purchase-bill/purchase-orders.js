import { toApiDateOnly } from "@/utilities/date-time-utils";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/purchase-bill/purchase-bill.module.css";
import { purchaseService } from "../../services/purchaseService";
import useDashboardData from "../../components/dashboard/useDashboardData";
import useStore from "../../components/state/useStore";
import PurchaseOrderManager from "../../components/purchase-bill/purchase-order-manager";
import EmptyState from "../../components/utilities/EmptyState";
import Loader from "../../components/utilities/Loader";
import { FiFilter, FiCheck, FiChevronRight, FiCalendar, FiChevronLeft, FiX, FiShare2 } from "react-icons/fi";
import ShareModal from "../../components/purchase-bill/ShareModal";

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

const CustomDateRangePicker = ({ startDate, endDate, onSelect, onClose, showInputs, isEmbedded }) => {
    const [viewDate, setViewDate] = useState(new Date(startDate || new Date()));
    const [selecting, setSelecting] = useState('start'); // 'start' or 'end'

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const handleDayClick = (day) => {
        const y = viewDate.getFullYear();
        const m = String(viewDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const clickedDate = `${y}-${m}-${d}`;

        if (selecting === 'start') {
            onSelect({ startDate: clickedDate, endDate: clickedDate });
            setSelecting('end');
        } else {
            if (new Date(clickedDate) < new Date(startDate)) {
                onSelect({ startDate: clickedDate, endDate: startDate });
            } else {
                onSelect({ startDate: startDate, endDate: clickedDate });
            }
            setSelecting('start');
        }
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const monthName = viewDate.toLocaleString('default', { month: 'long' });

    const isSelected = (day) => {
        const y = viewDate.getFullYear();
        const m = String(viewDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        return dateStr === startDate || dateStr === endDate;
    };

    const isInRange = (day) => {
        const y = viewDate.getFullYear();
        const m = String(viewDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        return dateStr > startDate && dateStr < endDate;
    };

    return (
        <div className={`${styles.pickerContainer} ${isEmbedded ? styles.embedded : ''}`}>
            {showInputs && (
                <div className={styles.pickerInputs}>
                    <div className={styles.pickerInput}>
                        <label>From</label>
                        <input type="text" value={startDate} readOnly />
                    </div>
                    <div className={styles.pickerInput}>
                        <label>To</label>
                        <input type="text" value={endDate || "To Date"} readOnly />
                    </div>
                </div>
            )}
            <div className={styles.calendarHeader}>
                <FiChevronLeft className={styles.navIcon} onClick={handlePrevMonth} />
                <span className={styles.monthLabel}>{monthName} {year}</span>
                <FiChevronRight className={styles.navIcon} onClick={handleNextMonth} />
            </div>
            <div className={styles.calendarGrid}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className={styles.weekday}>{d}</div>
                ))}
                {Array(startDay).fill(0).map((_, i) => <div key={`empty-${i}`} />)}
                {Array(days).fill(0).map((_, i) => {
                    const day = i + 1;
                    const selected = isSelected(day);
                    const inRange = isInRange(day);
                    const isStart = new Date(year, month, day).toISOString().split('T')[0] === startDate;
                    const isEnd = new Date(year, month, day).toISOString().split('T')[0] === endDate;

                    return (
                        <div
                            key={day}
                            className={`${styles.calendarDay} ${selected ? styles.selectedDay : ''} ${inRange ? styles.inRangeDay : ''} ${isStart ? styles.rangeStart : ''} ${isEnd ? styles.rangeEnd : ''}`}
                            onClick={() => handleDayClick(day)}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const GeneralFilterModal = ({ onClose, onApply, type, currentValue, currentMode, label }) => {
    const [mode, setMode] = useState(currentMode || 'Contains');
    const [value, setValue] = useState(currentValue !== undefined && currentValue !== null ? currentValue.toString() : '');
    const [showOptions, setShowOptions] = useState(false);
    const options = ['Contains', 'Exact Match'];

    const handleApply = () => {
        onApply(mode, value);
        onClose();
    };

    return (
        <div className={styles.dateFilterModal} style={{ textTransform: 'none' }}>
            {showOptions ? (
                <div className={styles.optionsList}>
                    {options.map(opt => (
                        <div
                            key={opt}
                            className={`${styles.optionItem} ${mode === opt ? styles.active : ''}`}
                            onClick={() => {
                                setMode(opt);
                                setShowOptions(false);
                            }}
                        >
                            {opt}
                            {mode === opt && <FiCheck />}
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <span className={styles.modalLabel}>Select Category</span>
                    <div className={styles.categorySelect} onClick={() => setShowOptions(true)}>
                        <span>{mode}</span>
                        <FiChevronRight style={{ transform: 'rotate(90deg)', color: '#666' }} />
                    </div>
                    <span className={styles.modalLabel}>{label}</span>
                    <input
                        type="text"
                        className={styles.dateInput}
                        placeholder={`Enter ${label}`}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />

                    <div className={styles.modalActions}>
                        <button className={styles.clearBtn} onClick={() => {
                            setValue('');
                            onApply(null, null);
                            onClose();
                        }}>Clear</button>
                        <button className={styles.applyBtn} onClick={handleApply}>Apply</button>
                    </div>
                </>
            )}
        </div>
    );
};

const DateFilterModal = ({ onClose, onApply, currentMode, currentDate }) => {
    const [mode, setMode] = useState(currentMode || 'Equal to');
    const [showOptions, setShowOptions] = useState(false);
    const [dates, setDates] = useState({
        single: currentDate?.single || toApiDateOnly(new Date()),
        from: currentDate?.from || '',
        to: currentDate?.to || ''
    });
    const [showCalendar, setShowCalendar] = useState(null); // 'single', 'from', 'to'

    const options = ['Equal to', 'Less than', 'Greater than', 'Range'];

    const handleApply = () => {
        onApply(mode, dates);
        onClose();
    };

    const formatDateForDisplay = (dateStr) => {
        if (!dateStr) return "DD/MM/YYYY";
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div className={styles.dateFilterModal} style={{ textTransform: 'none' }}>
            {showOptions ? (
                <div className={styles.optionsList}>
                    {options.map(opt => (
                        <div
                            key={opt}
                            className={`${styles.optionItem} ${mode === opt ? styles.active : ''}`}
                            onClick={() => {
                                setMode(opt);
                                setShowOptions(false);
                            }}
                        >
                            {opt}
                            {mode === opt && <FiCheck />}
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <span className={styles.modalLabel}>Select Category</span>
                    <div className={styles.categorySelect} onClick={() => setShowOptions(true)}>
                        <span>{mode}</span>
                        <FiChevronRight style={{ transform: 'rotate(90deg)', color: '#666' }} />
                    </div>

                    {mode === 'Range' ? (
                        <>
                            <div className={styles.dateInputContainer}>
                                <span className={styles.modalLabel}>From</span>
                                <div className={styles.dateInputWrapper} onClick={() => setShowCalendar('from')}>
                                    <div className={styles.dateInput}>
                                        {formatDateForDisplay(dates.from)}
                                    </div>
                                    <FiCalendar className={styles.calendarIconOverlay} />
                                </div>
                            </div>
                            <div className={styles.dateInputContainer}>
                                <span className={styles.modalLabel}>To</span>
                                <div className={styles.dateInputWrapper} onClick={() => setShowCalendar('to')}>
                                    <div className={styles.dateInput}>
                                        {formatDateForDisplay(dates.to)}
                                    </div>
                                    <FiCalendar className={styles.calendarIconOverlay} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.dateInputContainer}>
                            <span className={styles.modalLabel}>Select Date</span>
                            <div className={styles.dateInputWrapper} onClick={() => setShowCalendar('single')}>
                                <div className={styles.dateInput}>
                                    {formatDateForDisplay(dates.single)}
                                </div>
                                <FiCalendar className={styles.calendarIconOverlay} />
                            </div>
                        </div>
                    )}

                    {showCalendar && (
                        <div style={{ position: 'absolute', top: '0', left: '105%', zIndex: 3000, minWidth: '280px' }}>
                            <CustomDateRangePicker
                                startDate={showCalendar === 'single' ? dates.single : (showCalendar === 'from' ? dates.from : dates.to)}
                                endDate={showCalendar === 'single' ? dates.single : (showCalendar === 'from' ? dates.from : dates.to)}
                                showInputs={mode === 'Range'}
                                isEmbedded={false}
                                onSelect={(range) => {
                                    if (showCalendar === 'single') {
                                        setDates({ ...dates, single: range.startDate });
                                    } else if (showCalendar === 'from') {
                                        setDates({ ...dates, from: range.startDate });
                                    } else {
                                        setDates({ ...dates, to: range.startDate });
                                    }
                                    setShowCalendar(null);
                                }}
                                onClose={() => setShowCalendar(null)}
                            />
                        </div>
                    )}

                    <div className={styles.modalActions}>
                        <button className={styles.clearBtn} onClick={() => {
                            setDates({ single: '', from: '', to: '' });
                            onApply(null, null);
                            onClose();
                        }}>Clear</button>
                        <button className={styles.applyBtn} onClick={handleApply}>Apply</button>
                    </div>
                </>
            )}
        </div>
    );
};

const PurchaseOrdersPage = () => {
    const router = useRouter();

    const { jwtToken } = useStore();
    const { branches, branchId } = useDashboardData();

    const [loading, setLoading] = useState(false);
    const [purchaseRequests, setPurchaseRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [managerConfig, setManagerConfig] = useState(null); // { mode, id, initialData }
    const [isShareModalOpen, setIsShareModalOpen] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const [summary, setSummary] = useState(null);

    // Filter states
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const [openFilterCol, setOpenFilterCol] = useState(null); // 'orderNo', 'supplierName', etc.
    const [dateFilterMode, setDateFilterMode] = useState(null);
    const [dateFilterValues, setDateFilterValues] = useState(null);
    const [columnFilters, setColumnFilters] = useState({
        orderNo: { mode: 'Contains', value: '' },
        supplierName: { mode: 'Contains', value: '' },
        to: { mode: 'Contains', value: '' },
        orderValue: { mode: 'Contains', value: '' },
    });

    // Fetch Purchase Requests
    useEffect(() => {
        if (jwtToken && branchId) {
            fetchOrders();
        }
    }, [jwtToken, branchId]);

    useEffect(() => {
        if (router.isReady && router.query.openAdd === 'true') {
            let initialData = null;
            if (router.query.restockProductId) {
                initialData = {
                    branchId: router.query.restockBranchId,
                    supplierId: router.query.restockSupplierId,
                    returnTab: router.query.returnTab,
                    restockItem: {
                        productId: parseInt(router.query.restockProductId),
                        variantId: parseInt(router.query.restockVariantId)
                    }
                };
            }
            openOrder(null, "Add", initialData);
            // Clear query params
            const { openAdd, restockProductId, restockVariantId, restockSupplierId, restockBranchId, returnTab, ...restQuery } = router.query;
            router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
        }
    }, [router.isReady, router.query.openAdd]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await purchaseService.getPurchaseRequests(jwtToken, branchId);
            if (response.status === "success") {
                // If data contains both summary and list, or just a list
                const data = response.data || [];
                // Pull top-level summary fields (branchName, counts) from response directly
                const topLevel = {
                    branchName: response.branchName || data.branchName,
                    totalPurchaseRequests: response.totalPurchaseRequests ?? data.totalPurchaseRequests,
                    paidCount: response.paidCount ?? data.paidCount,
                    partiallyPaidCount: response.partiallyPaidCount ?? data.partiallyPaidCount,
                    unpaidCount: response.unpaidCount ?? data.unpaidCount,
                };
                if (Array.isArray(data)) {
                    setPurchaseRequests(data);
                    // Keep top-level summary if present
                    const hasTopLevelSummary = topLevel.totalPurchaseRequests != null;
                    setSummary(hasTopLevelSummary ? topLevel : null);
                } else if (data.orders) {
                    setPurchaseRequests(data.orders);
                    setSummary({ ...(data.summary || data), ...topLevel }); // Merge both
                } else {
                    // data itself may be the summary object
                    setSummary({ ...data, ...topLevel });
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

        // Global Search
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            data = data.filter(item =>
                String(item.productsPurchaseRqstID).toLowerCase().includes(s) ||
                item.supplier?.supplierName?.toLowerCase().includes(s)
            );
        }

        // Column Filters
        Object.keys(columnFilters).forEach(col => {
            const filter = columnFilters[col];
            if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
                data = data.filter(item => {
                    let itemVal = '';
                    if (col === 'orderNo') itemVal = String(item.productsPurchaseRqstID);
                    else if (col === 'supplierName') itemVal = item.supplier?.supplierName || '';
                    else if (col === 'to') itemVal = item.branchName || '';
                    else if (col === 'orderValue') itemVal = String(item.totalCost);

                    if (col === 'orderValue') {
                        const numTarget = parseFloat(itemVal);
                        const numFilter = parseFloat(filter.value);
                        const isNumTarget = !isNaN(numTarget);
                        const isNumFilter = !isNaN(numFilter);

                        if (isNumTarget && isNumFilter) {
                            if (filter.mode === 'Exact Match') {
                                return numTarget === numFilter;
                            } else {
                                const strTarget = numTarget.toString();
                                const strFilter = numFilter.toString();
                                return strTarget.includes(strFilter) || itemVal.toLowerCase().includes(filter.value.toLowerCase());
                            }
                        }
                    }

                    if (filter.mode === 'Exact Match') {
                        return itemVal.toLowerCase() === filter.value.toLowerCase();
                    } else {
                        return itemVal.toLowerCase().includes(filter.value.toLowerCase());
                    }
                });
            }
        });

        // Date Filter
        if (dateFilterMode && dateFilterValues) {
            data = data.filter(item => {
                const itemDate = new Date(item.createdDate).toISOString().split('T')[0];
                const { single, from, to } = dateFilterValues;

                if (dateFilterMode === 'Equal to') return itemDate === single;
                if (dateFilterMode === 'Less than') return itemDate < single;
                if (dateFilterMode === 'Greater than') return itemDate > single;
                if (dateFilterMode === 'Range') {
                    if (!from || !to) return true;
                    return itemDate >= from && itemDate <= to;
                }
                return true;
            });
        }

        return data;
    }, [purchaseRequests, searchTerm, columnFilters, dateFilterMode, dateFilterValues]);

    const stats = useMemo(() => {
        if (summary && summary.totalPurchaseRequests != null) {
            return {
                branchName: summary.branchName || null,
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
        return { branchName: null, total, paid, unpaid, partiallyPaid };
    }, [purchaseRequests, summary]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage]);

    const openOrder = (id = null, mode = "View", initialData = null) => {
        setManagerConfig({ mode, id, initialData });
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
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    const hasFiltersApplied = useMemo(() => {
        return !!(
            searchTerm ||
            dateFilterMode ||
            Object.values(columnFilters).some(f => f.value !== undefined && f.value !== null && f.value !== '')
        );
    }, [searchTerm, dateFilterMode, columnFilters]);



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
                        initialData={managerConfig.initialData}
                        totalOrders={stats.total}
                        onSave={() => {
                            if (managerConfig.initialData?.returnTab) {
                                router.push(`/inventory/stock-status?tab=${managerConfig.initialData.returnTab}`);
                            } else {
                                setManagerConfig(null);
                                fetchOrders();
                            }
                        }}
                        onClose={() => {
                            if (managerConfig.initialData?.returnTab) {
                                router.push(`/inventory/stock-status?tab=${managerConfig.initialData.returnTab}`);
                            } else {
                                setManagerConfig(null);
                                fetchOrders();
                            }
                        }}
                    />
                )}

                {/* Fixed Top Section */}
                <div className={styles.topSection}>
                    <div className={styles.statusTabsRow}>
                        <div className={styles.statusGroup}>
                            <span className={styles.statusLabel}>Overall Status :</span>
                            <div className={styles.statusBadge}>Total Purchase Orders: {String(stats.total).padStart(2, '0')}</div>
                            <div className={styles.statusBadge}>Total Paid : {String(stats.paid).padStart(2, '0')}</div>
                            <div className={styles.statusBadge}>Total Unpaid : {String(stats.unpaid).padStart(2, '0')}</div>
                            <div className={styles.statusBadge}>Partially Paid : {String(stats.partiallyPaid).padStart(2, '0')}</div>
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
                    <Loader message="Loading Purchase Orders..." />
                ) : (filteredData.length === 0 && !hasFiltersApplied) ? (
                    <EmptyState
                        buttonText="Add Purchase Order"
                        onAddClick={() => openOrder(null, "Add")}
                    />
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>
                                        ORDER DATE
                                        <FiFilter
                                            className={`${styles.filterIcon} ${dateFilterMode ? styles.filterIconActive : ''}`}
                                            onClick={() => { setIsDateFilterOpen(!isDateFilterOpen); setOpenFilterCol(null); }}
                                        />
                                        {isDateFilterOpen && (
                                            <DateFilterModal
                                                currentMode={dateFilterMode}
                                                currentDate={dateFilterValues}
                                                onClose={() => setIsDateFilterOpen(false)}
                                                onApply={(mode, values) => {
                                                    setDateFilterMode(mode);
                                                    setDateFilterValues(values);
                                                }}
                                            />
                                        )}
                                    </th>
                                    <th>
                                        ORDER NO
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.orderNo.value !== undefined && columnFilters.orderNo.value !== null && columnFilters.orderNo.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'orderNo' ? null : 'orderNo'); setIsDateFilterOpen(false); }}
                                        />
                                        {openFilterCol === 'orderNo' && (
                                            <GeneralFilterModal
                                                type="text"
                                                label="Order No"
                                                currentMode={columnFilters.orderNo.mode}
                                                currentValue={columnFilters.orderNo.value}
                                                onClose={() => setOpenFilterCol(null)}
                                                onApply={(mode, val) => setColumnFilters({ ...columnFilters, orderNo: { mode, value: val } })}
                                            />
                                        )}
                                    </th>
                                    <th>
                                        SUPPLIER NAME
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.supplierName.value !== undefined && columnFilters.supplierName.value !== null && columnFilters.supplierName.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'supplierName' ? null : 'supplierName'); setIsDateFilterOpen(false); }}
                                        />
                                        {openFilterCol === 'supplierName' && (
                                            <GeneralFilterModal
                                                type="text"
                                                label="Supplier Name"
                                                currentMode={columnFilters.supplierName.mode}
                                                currentValue={columnFilters.supplierName.value}
                                                onClose={() => setOpenFilterCol(null)}
                                                onApply={(mode, val) => setColumnFilters({ ...columnFilters, supplierName: { mode, value: val } })}
                                            />
                                        )}
                                    </th>
                                    <th>
                                        TO
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.to.value !== undefined && columnFilters.to.value !== null && columnFilters.to.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'to' ? null : 'to'); setIsDateFilterOpen(false); }}
                                        />
                                        {openFilterCol === 'to' && (
                                            <GeneralFilterModal
                                                type="text"
                                                label="Branch"
                                                currentMode={columnFilters.to.mode}
                                                currentValue={columnFilters.to.value}
                                                onClose={() => setOpenFilterCol(null)}
                                                onApply={(mode, val) => setColumnFilters({ ...columnFilters, to: { mode, value: val } })}
                                            />
                                        )}
                                    </th>
                                    <th>
                                        Order Value
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.orderValue.value !== undefined && columnFilters.orderValue.value !== null && columnFilters.orderValue.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'orderValue' ? null : 'orderValue'); setIsDateFilterOpen(false); }}
                                        />
                                        {openFilterCol === 'orderValue' && (
                                            <GeneralFilterModal
                                                type="text"
                                                label="Order Value"
                                                currentMode={columnFilters.orderValue.mode}
                                                currentValue={columnFilters.orderValue.value}
                                                onClose={() => setOpenFilterCol(null)}
                                                onApply={(mode, val) => setColumnFilters({ ...columnFilters, orderValue: { mode, value: val } })}
                                            />
                                        )}
                                    </th>
                                    <th>Purchase Order</th>
                                    <th>Invoice</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className={styles.noDataCell}>
                                            Applied filter has no data
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((item, idx) => (
                                        <tr key={item.productsPurchaseRqstID} onClick={() => openOrder(item.productsPurchaseRqstID, "View")} style={{ cursor: 'pointer' }}>
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
                                                    <span className={styles.statusSecondary}>{formatDate(item.orderDate || item.createdDate)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {["order placed", "cancel order", "cancel", "draft"].includes(item.orderStatus?.toLowerCase()) ? (
                                                    <div style={{ textAlign: 'center', width: '100%', color: '#ccc', fontWeight: '700', fontSize: '14px' }}>---</div>
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
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div className={styles.actions}>
                                                    <div style={{ position: 'relative' }}>
                                                        <FiShare2
                                                            className={styles.actionIcon}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTransaction(item);
                                                                setIsShareModalOpen(isShareModalOpen === `share-${item.productsPurchaseRqstID}` ? null : `share-${item.productsPurchaseRqstID}`);
                                                            }}
                                                        />
                                                        {isShareModalOpen === `share-${item.productsPurchaseRqstID}` && (
                                                            <ShareModal
                                                                isOpen={true}
                                                                onClose={() => setIsShareModalOpen(false)}
                                                                showBelow={idx < 2}
                                                                data={{
                                                                    ...item,
                                                                    suppliersTransactionId: `PO-${String(item.productsPurchaseRqstID).padStart(5, '0')}`,
                                                                    supplierId: item.supplier?.supplierId,
                                                                    supplierName: item.supplier?.supplierName,
                                                                    amount: item.totalCost,
                                                                    userTransactionDate: item.createdDate,
                                                                    branchId: item.branchId || branchId
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
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
                            <div style={{ display: 'flex', gap: 12 }}>
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

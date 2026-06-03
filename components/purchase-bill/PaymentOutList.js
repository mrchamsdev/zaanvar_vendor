import { toApiDateOnly, parseWallClockDate } from "@/utilities/date-time-utils";
import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { FiPrinter, FiShare2, FiMoreVertical, FiFilter, FiArrowUpRight, FiChevronLeft, FiChevronRight, FiCalendar, FiCheck, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import { useRouter } from "next/router";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import AddPaymentOut from "./AddPaymentOut";
import ShareModal from "./ShareModal";
import HistoryModal from "./HistoryModal";
import { VENDOR_API_URL } from "../../components/utilities/Constants";
import useDashboardData from "../dashboard/useDashboardData";
import EmptyState from "../utilities/EmptyState";
import Loader from "../utilities/Loader";

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
            if (onClose) onClose();
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
                    const isStart = toApiDateOnly(new Date(year, month, day)) === startDate;
                    const isEnd = toApiDateOnly(new Date(year, month, day)) === endDate;

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

    const paymentOptions = ['Cash', 'Cheque', 'UPI', 'Card', 'Bank'];
    const [selectedPayments, setSelectedPayments] = useState(Array.isArray(currentValue) ? currentValue : []);

    const handleApply = () => {
        if (type === 'paymentType') {
            onApply('Checklist', selectedPayments);
        } else {
            onApply(mode, value);
        }
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
                    {type === 'paymentType' ? (
                        <div className={styles.checklistContainer}>
                            {paymentOptions.map(opt => (
                                <div key={opt} className={styles.checklistItem}
                                    onClick={() => {
                                        if (selectedPayments.includes(opt)) {
                                            setSelectedPayments(selectedPayments.filter(p => p !== opt));
                                        } else {
                                            setSelectedPayments([...selectedPayments, opt]);
                                        }
                                    }}>
                                    <div className={`${styles.checkbox} ${selectedPayments.includes(opt) ? styles.checked : ''}`}>
                                        {selectedPayments.includes(opt) && <FiCheck />}
                                    </div>
                                    <span>{opt}</span>
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
                        </>
                    )}

                    <div className={styles.modalActions}>
                        <button className={styles.clearBtn} onClick={() => {
                            if (type === 'paymentType') setSelectedPayments([]);
                            else setValue('');
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
    const [showCalendar, setShowCalendar] = useState(null);

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

const PaymentOutList = ({ onAddClick }) => {
    const router = useRouter();
    const { jwtToken, userInfo } = useStore();
    const [transactions, setTransactions] = useState([]);

    const getDisplayPaymentType = (t) => {
        const types = [t.paymentType, ...(t.splitTransactions || []).map(st => st.paymentType)]
            .map(type => type || "Cash")
            .filter((value, index, self) => self.indexOf(value) === index);
        return types.join(" + ");
    };

    const getDisplayTotalAmount = (t) => {
        const mainAmount = parseFloat(t.amount || 0);
        const splitSum = (t.splitTransactions || []).reduce((sum, st) => sum + parseFloat(st.amount || 0), 0);
        return mainAmount + splitSum;
    };

    const [totals, setTotals] = useState(null);
    const [supplierTotals, setSupplierTotals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const getSupplierBalance = (supplierId) => {
        const supplierObj = supplierTotals.find(s => s.supplierId === supplierId);
        return supplierObj ? parseFloat(supplierObj.totalBalanceAmount || 0) : 0;
    };
    const getSupplierTotalBill = (supplierId) => {
        const supplierObj = supplierTotals.find(s => s.supplierId === supplierId);
        return supplierObj ? parseFloat(supplierObj.totalBillAmount || 0) : 0;
    };
    const [searchTerm, setSearchTerm] = useState("");
    const [isShareModalOpen, setIsShareModalOpen] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const { branches, branchId: defaultBranchId } = useDashboardData();
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [filterType, setFilterType] = useState("This Year");
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: toApiDateOnly(new Date(new Date().getFullYear(), 0, 1)),
        endDate: toApiDateOnly(new Date(new Date().getFullYear(), 11, 31))
    });

    // New multi-modal date filter state
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const [dateFilterMode, setDateFilterMode] = useState(null);
    const [dateFilterValues, setDateFilterValues] = useState(null);

    const [expandedRows, setExpandedRows] = useState({});
    const toggleRowExpand = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const [openFilterCol, setOpenFilterCol] = useState(null); // 'refNo', 'partyName', 'paymentType', 'total', 'paid', 'balance'
    const [columnFilters, setColumnFilters] = useState({
        refNo: { mode: 'Contains', value: '' },
        partyName: { mode: 'Contains', value: '' },
        paymentType: { mode: 'Checklist', value: [] },
        total: { mode: 'Contains', value: '' },
        paid: { mode: 'Contains', value: '' },
        balance: { mode: 'Contains', value: '' }
    });

    const hasFiltersApplied = useMemo(() => {
        return !!(
            searchTerm ||
            dateFilterMode ||
            Object.values(columnFilters).some(f => Array.isArray(f.value) ? f.value.length > 0 : (f.value !== undefined && f.value !== null && f.value !== ''))
        );
    }, [searchTerm, dateFilterMode, columnFilters]);

    useEffect(() => {
        if (router.query.branchId) {
            setSelectedBranchId(router.query.branchId);
        } else if (defaultBranchId && !selectedBranchId) {
            setSelectedBranchId(defaultBranchId);
        }
    }, [router.query.branchId, defaultBranchId]);

    useEffect(() => {
        if (router.query.add === 'true') {
            setIsAddModalOpen(true);
        } else {
            setIsAddModalOpen(false);
        }
    }, [router.query.add]);

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        const { add, ...query } = router.query;
        router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
    };

    const lastFetchedRef = React.useRef({ branchId: null, filterType: null, dateRange: null });

    const fetchTransactions = async (branchId) => {
        setLoading(true);
        try {
            let dateParams = {};
            if (filterType === "Custom") {
                dateParams = {
                    fromDate: dateRange.startDate,
                    toDate: dateRange.endDate
                };
            } else if (filterType !== "All") {
                const mapType = {
                    "This Month": "thisMonth",
                    "Last Month": "lastMonth",
                    "This Quarter": "thisQuarter",
                    "This Year": "thisYear"
                }[filterType];
                if (mapType) {
                    dateParams = { dateFilter: mapType };
                }
            }

            const res = await purchaseService.getBranchTransactions(jwtToken, branchId || selectedBranchId, dateParams);
            if (res.status === "success") {
                const newTransactions = res.data || [];
                setTransactions(newTransactions);
                setTotals(res.overallTotals || (Array.isArray(res.totals) ? res.totals[0] : (res.totals || null)));
                setSupplierTotals(res.totals || []);

                // If filterType is "All", update the dateRange based on the fetched transactions
                if (filterType === "All" && newTransactions.length > 0) {
                    const parsedDates = newTransactions.map(t => parseWallClockDate(t.userTransactionDate)).filter(Boolean);
                    if (parsedDates.length > 0) {
                        const start = new Date(Math.min(...parsedDates.map(d => d.getTime())));
                        const end = new Date(Math.max(...parsedDates.map(d => d.getTime())));
                        const newRange = {
                            startDate: toApiDateOnly(start),
                            endDate: toApiDateOnly(end)
                        };
                        // Update ref first so the useEffect doesn't trigger a duplicate fetch
                        lastFetchedRef.current = {
                            branchId: branchId || selectedBranchId,
                            filterType: "All",
                            dateRange: newRange
                        };
                        setDateRange(newRange);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedBranchId) {
            const isCustom = filterType === "Custom";
            const last = lastFetchedRef.current;
            const dateRangeChanged = last.dateRange?.startDate !== dateRange.startDate || last.dateRange?.endDate !== dateRange.endDate;

            if (selectedBranchId !== last.branchId || filterType !== last.filterType || (isCustom && dateRangeChanged)) {
                // Update ref
                lastFetchedRef.current = {
                    branchId: selectedBranchId,
                    filterType,
                    dateRange
                };
                fetchTransactions(selectedBranchId);
            }
        }
    }, [selectedBranchId, filterType, dateRange]);

    const handleBranchChange = (e) => {
        const branchId = e.target.value;
        setSelectedBranchId(branchId);
    };

    const handleFilterChange = (type) => {
        setFilterType(type);
        const now = new Date();
        let start, end;

        switch (type) {
            case "All":
                if (transactions && transactions.length > 0) {
                    const parsedDates = transactions.map(t => parseWallClockDate(t.userTransactionDate)).filter(Boolean);
                    if (parsedDates.length > 0) {
                        start = new Date(Math.min(...parsedDates.map(d => d.getTime())));
                        end = new Date(Math.max(...parsedDates.map(d => d.getTime())));
                    } else {
                        start = new Date(2000, 0, 1);
                        end = new Date(2100, 11, 31);
                    }
                } else {
                    start = new Date(2000, 0, 1);
                    end = new Date(2100, 11, 31);
                }
                break;
            case "This Month":
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case "Last Month":
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case "This Quarter":
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                break;
            case "This Year":
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
            case "Custom":
                setShowCustomPicker(true);
                return;
            default:
                return;
        }

        setDateRange({
            startDate: toApiDateOnly(start),
            endDate: toApiDateOnly(end)
        });
        setShowCustomPicker(false);
        // Clear multi-modal filter when top level filter changes
        setDateFilterMode(null);
        setDateFilterValues(null);
    };

    const filteredTransactions = transactions.filter(t => {
        const transDate = parseWallClockDate(t.userTransactionDate) || new Date();
        const start = parseWallClockDate(dateRange.startDate);
        const end = parseWallClockDate(dateRange.endDate);
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        let matchesDate = start && end ? (transDate >= start && transDate <= end) : true;

        if (dateFilterMode && dateFilterValues) {
            const single = parseWallClockDate(dateFilterValues.single);
            const from = parseWallClockDate(dateFilterValues.from);
            const to = parseWallClockDate(dateFilterValues.to);
            if (single) single.setHours(0, 0, 0, 0);
            if (from) from.setHours(0, 0, 0, 0);
            if (to) to.setHours(23, 59, 59, 999);
            const checkDate = parseWallClockDate(t.userTransactionDate) || new Date();
            checkDate.setHours(0, 0, 0, 0);

            if (dateFilterMode === 'Equal to' && single) matchesDate = checkDate.getTime() === single.getTime();
            else if (dateFilterMode === 'Less than' && single) matchesDate = checkDate < single;
            else if (dateFilterMode === 'Greater than' && single) matchesDate = checkDate > single;
            else if (dateFilterMode === 'Range' && from && to) matchesDate = checkDate >= from && checkDate <= to;
        }

        const matchesSearch = !searchTerm ||
            (t.transactionInfo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (String(t.suppliersTransactionId)).toLowerCase().includes(searchTerm.toLowerCase());

        let matchesColFilters = true;
        Object.keys(columnFilters).forEach(key => {
            const filter = columnFilters[key];
            if ((filter.value === undefined || filter.value === null || filter.value === '') || (Array.isArray(filter.value) && filter.value.length === 0)) return;

            if (key === 'paymentType' && filter.mode === 'Checklist') {
                const allTypes = [t.paymentType, ...(t.splitTransactions || []).map(st => st.paymentType)].map(type => type || "Cash");
                const hasMatch = allTypes.some(type => filter.value.includes(type));
                if (!hasMatch) matchesColFilters = false;
                return;
            }

            let targetValue = "";
            if (key === 'refNo') targetValue = String(t.suppliersTransactionId);
            else if (key === 'partyName') targetValue = String(t.supplierName || t.transactionInfo || "");
            else if (key === 'paymentType') targetValue = String(t.paymentType || "");
            else if (key === 'total') targetValue = String(getSupplierTotalBill(t.supplierId));
            else if (key === 'paid') targetValue = String(getDisplayTotalAmount(t));
            else if (key === 'balance') targetValue = String(t.totalBalanceAmount || 0);

            if (key === 'total' || key === 'paid' || key === 'balance') {
                const numTarget = parseFloat(targetValue);
                const numFilter = parseFloat(filter.value);
                const isNumTarget = !isNaN(numTarget);
                const isNumFilter = !isNaN(numFilter);

                if (isNumTarget && isNumFilter) {
                    if (filter.mode === 'Exact Match') {
                        if (numTarget !== numFilter) matchesColFilters = false;
                    } else { // Contains
                        const strTarget = numTarget.toString();
                        const strFilter = numFilter.toString();
                        if (!strTarget.includes(strFilter) && !targetValue.toLowerCase().includes(filter.value.toLowerCase())) {
                            matchesColFilters = false;
                        }
                    }
                } else {
                    if (filter.mode === 'Exact Match') {
                        if (targetValue.toLowerCase() !== filter.value.toLowerCase()) matchesColFilters = false;
                    } else {
                        if (!targetValue.toLowerCase().includes(filter.value.toLowerCase())) matchesColFilters = false;
                    }
                }
            } else {
                if (filter.mode === 'Exact Match') {
                    if (targetValue.toLowerCase() !== filter.value.toLowerCase()) matchesColFilters = false;
                } else {
                    if (!targetValue.toLowerCase().includes(filter.value.toLowerCase())) matchesColFilters = false;
                }
            }
        });

        return matchesDate && matchesSearch && matchesColFilters;
    }).sort((a, b) => new Date(b.createdDate || b.userTransactionDate) - new Date(a.createdDate || a.userTransactionDate));

    const exportToExcel = () => {
        const headers = ["DATE", "REF NO", "SUPPLIER NAME", "TOTAL", "PAID", "PAYMENT TYPE", "BALANCE AMOUNT"];
        const rows = [];
        
        filteredTransactions.forEach(t => {
            rows.push([
                `" ${new Date(t.userTransactionDate).toLocaleDateString('en-GB')}"`,
                `"${t.suppliersTransactionId}"`,
                `"${(t.supplierName || t.transactionInfo || "N/A").replace(/"/g, '""')}"`,
                `"${getSupplierTotalBill(t.supplierId)}"`,
                `"${getDisplayTotalAmount(t)}"`,
                `"${getDisplayPaymentType(t)}"`,
                `"${(t.splitTransactions && t.splitTransactions.length ? t.splitTransactions[t.splitTransactions.length - 1].totalBalanceAmount : t.totalBalanceAmount) || 0}"`
            ]);

            const splitsList = t.paymentMethods && t.paymentMethods.length > 0
                ? t.paymentMethods.map(pm => ({ paymentType: pm.paymentMethod || "Cash", amount: pm.amount || 0 }))
                : [
                    { paymentType: t.paymentMethod || t.paymentType || "Cash", amount: t.paidAmount || t.amount || 0 },
                    ...(t.splitTransactions || []).map(st => ({ paymentType: st.paymentMethod || st.paymentType || "Cash", amount: st.paidAmount || st.amount || 0 }))
                ];

            if (splitsList.length > 1) {
                splitsList.forEach(split => {
                    rows.push([
                        `""`,
                        `""`,
                        `""`,
                        `""`,
                        `"${split.amount}"`,
                        `"${split.paymentType}"`,
                        `""`
                    ]);
                });
            }
        });

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Purchase_Out_Report_${toApiDateOnly(new Date())}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.printOnlyTitle}>Payment Out History</h1>

            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Filter by :</span>
                    <div className={styles.customSelectWrapper}>
                        <div
                            className={styles.customSelectHeader}
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        >
                            <span>{filterType}</span>
                            <FiChevronRight style={{ transform: showFilterDropdown ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }} />
                        </div>
                        {showFilterDropdown && (
                            <div className={styles.customSelectDropdown}>
                                {["This Month", "Last Month", "This Quarter", "This Year", "All", "Custom"].map(opt => (
                                    <div
                                        key={opt}
                                        className={`${styles.customSelectOption} ${filterType === opt ? styles.active : ''}`}
                                        onClick={() => {
                                            handleFilterChange(opt);
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.filterGroup} style={{ position: 'relative' }}>
                    <div
                        className={styles.dateDisplay}
                        onClick={() => setShowCustomPicker(!showCustomPicker)}
                    >
                        <FiCalendar style={{ marginRight: '8px', color: '#666' }} />
                        {new Date(dateRange.startDate).toLocaleDateString('en-GB')} To {new Date(dateRange.endDate).toLocaleDateString('en-GB')}
                    </div>
                    {showCustomPicker && (
                        <div className={styles.customPickerWrapper}>
                            <CustomDateRangePicker
                                startDate={dateRange.startDate}
                                endDate={dateRange.endDate}
                                isEmbedded={true}
                                onSelect={(range) => {
                                    setDateRange(range);
                                    setFilterType("Custom");
                                }}
                                onClose={() => setShowCustomPicker(false)}
                            />
                        </div>
                    )}
                </div>
            </div>


            {transactions.length > 0 && (
                <div className={styles.summarySection}>
                    <div className={styles.mainSummaryCard}>
                        <div className={styles.summaryTop}>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Total Amount</span>
                                <span className={styles.summaryValue}>₹{Number(totals?.supplierTotalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className={styles.summaryStats}>
                                <span className={styles.percentText}>0% <FiArrowUpRight /></span>
                                <span className={styles.vsText}>vs Last month</span>
                            </div>
                        </div>
                        <div className={styles.summaryBottom}>
                            <div className={styles.bottomItem}>
                                <span className={styles.paidLabel}>Paid : </span>
                                <span className={styles.paidValue}>₹{Number(totals?.totalPaidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className={styles.bottomItem} style={{ marginLeft: 'auto' }}>
                                <span className={styles.paidLabel}>Balance : </span>
                                <span className={styles.paidValue}>₹{Number(totals?.totalBalanceAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.transactionsHeader}>
                <h2 className={styles.transactionsTitle}>Transactions</h2>
                <div className={styles.headerActions}>
                    <button className={styles.iconBtn} onClick={exportToExcel} title="Export to Excel">
                        <FaFileExcel style={{ color: '#217346' }} />
                    </button>
                    <button className={styles.iconBtn} onClick={handlePrint} title="Print Report">
                        <FiPrinter />
                    </button>
                </div>
            </div>

            {loading ? (
                <Loader message="Loading Payments..." />
            ) : transactions.length === 0 ? (
                <EmptyState
                    buttonText="Add Payment Out"
                    onAddClick={onAddClick}
                />
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>
                                    <div className={styles.thContent}>
                                        <span>DATE</span>
                                        <FiFilter
                                            className={`${styles.filterIcon} ${dateFilterMode ? styles.filterIconActive : ''}`}
                                            onClick={() => { setIsDateFilterOpen(!isDateFilterOpen); setOpenFilterCol(null); }}
                                        />
                                    </div>
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
                                    <div className={styles.thContent}>
                                        <span>REF NO</span>
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.refNo.value !== undefined && columnFilters.refNo.value !== null && columnFilters.refNo.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'refNo' ? null : 'refNo'); setIsDateFilterOpen(false); }}
                                        />
                                    </div>
                                    {openFilterCol === 'refNo' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Ref no"
                                            currentMode={columnFilters.refNo.mode}
                                            currentValue={columnFilters.refNo.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, refNo: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th>
                                    <div className={styles.thContent}>
                                        <span>SUPPLIER NAME</span>
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.partyName.value !== undefined && columnFilters.partyName.value !== null && columnFilters.partyName.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'partyName' ? null : 'partyName'); setIsDateFilterOpen(false); }}
                                        />
                                    </div>
                                    {openFilterCol === 'partyName' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Supplier Name"
                                            currentMode={columnFilters.partyName.mode}
                                            currentValue={columnFilters.partyName.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, partyName: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th>
                                    <div className={styles.thContent}>
                                        <span>TOTAL</span>
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.total.value !== undefined && columnFilters.total.value !== null && columnFilters.total.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'total' ? null : 'total'); setIsDateFilterOpen(false); }}
                                        />
                                    </div>
                                    {openFilterCol === 'total' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Total Amount"
                                            currentMode={columnFilters.total.mode}
                                            currentValue={columnFilters.total.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, total: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th>
                                    <div className={styles.thContent}>
                                        <span>PAID</span>
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.paid.value !== undefined && columnFilters.paid.value !== null && columnFilters.paid.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'paid' ? null : 'paid'); setIsDateFilterOpen(false); }}
                                        />
                                    </div>
                                    {openFilterCol === 'paid' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Paid"
                                            currentMode={columnFilters.paid.mode}
                                            currentValue={columnFilters.paid.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, paid: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th>
                                    <div className={styles.thContent}>
                                        <span>PAYMENT TYPE</span>
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.paymentType.value && columnFilters.paymentType.value.length > 0) ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'paymentType' ? null : 'paymentType'); setIsDateFilterOpen(false); }}
                                        />
                                    </div>
                                    {openFilterCol === 'paymentType' && (
                                        <GeneralFilterModal
                                            type="paymentType"
                                            label="Payment Type"
                                            currentMode={columnFilters.paymentType.mode}
                                            currentValue={columnFilters.paymentType.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, paymentType: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th>
                                    <div className={styles.thContent}>
                                        <span>BALANCE AMOUNT</span>
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.balance.value !== undefined && columnFilters.balance.value !== null && columnFilters.balance.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'balance' ? null : 'balance'); setIsDateFilterOpen(false); }}
                                        />
                                    </div>
                                    {openFilterCol === 'balance' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Balance Amount"
                                            currentMode={columnFilters.balance.mode}
                                            currentValue={columnFilters.balance.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, balance: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={styles.noDataCell}>
                                        The search you entered is not matching to any record
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t, idx) => {
                                    const splitsList = [
                                        { paymentType: t.paymentType || "Cash", amount: t.amount || 0 },
                                        ...(t.splitTransactions || []).map(st => ({ paymentType: st.paymentType || "Cash", amount: st.amount || 0 }))
                                    ];
                                    return (
                                        <React.Fragment key={t.suppliersTransactionId || idx}>
                                            <tr>
                                                <td>{new Date(t.userTransactionDate).toLocaleDateString('en-GB')}</td>
                                                <td>{t.suppliersTransactionId}</td>
                                                <td>{t.supplierName || t.transactionInfo || "N/A"}</td>
                                                <td>{Number(getSupplierTotalBill(t.supplierId) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td>{Number(getDisplayTotalAmount(t) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td>{getDisplayPaymentType(t)}</td>
                                                <td>{Number((t.splitTransactions && t.splitTransactions.length ? t.splitTransactions[t.splitTransactions.length - 1].totalBalanceAmount : t.totalBalanceAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td>
                                                    <div className={styles.actions}>
                                                        <div style={{ position: 'relative' }}>
                                                            <FiShare2
                                                                className={styles.actionIcon}
                                                                onClick={() => {
                                                                    setSelectedTransaction(t);
                                                                    setIsShareModalOpen(isShareModalOpen === `share-${idx}` ? null : `share-${idx}`);
                                                                }}
                                                            />
                                                            {isShareModalOpen === `share-${idx}` && (
                                                                <ShareModal
                                                                    isOpen={true}
                                                                    onClose={() => setIsShareModalOpen(false)}
                                                                    data={t}
                                                                    branchId={selectedBranchId || defaultBranchId}
                                                                />
                                                            )}
                                                        </div>
                                                        <div style={{ position: 'relative' }}>
                                                            <FiMoreVertical
                                                                className={styles.actionIcon}
                                                                onClick={() => setActiveDropdown(activeDropdown === idx ? null : idx)}
                                                            />
                                                            {activeDropdown === idx && (
                                                                <div className={styles.dropdownMenu}>
                                                                    <div className={styles.dropdownItem} onClick={() => {
                                                                        router.push(`/purchase-bill/add-payment-out?id=${t.suppliersTransactionId}&mode=view`);
                                                                        setActiveDropdown(null);
                                                                    }}>View</div>
                                                                    <div className={styles.dropdownItem} onClick={() => {
                                                                        router.push(`/purchase-bill/add-payment-out?id=${t.suppliersTransactionId}&mode=edit`);
                                                                        setActiveDropdown(null);
                                                                    }}>Edit</div>
                                                                    <div className={styles.dropdownItem} onClick={() => {
                                                                        window.open(`/purchase-bill/add-payment-out?id=${t.suppliersTransactionId}&mode=view&pdf=true`, '_blank');
                                                                        setActiveDropdown(null);
                                                                    }}>Open PDF</div>
                                                                    <div className={styles.dropdownItem} onClick={() => {
                                                                        setActiveDropdown(null);
                                                                        const printUrl = `/purchase-bill/add-payment-out?id=${t.suppliersTransactionId}&mode=view&pdf=true&print=true`;
                                                                        const iframe = document.createElement('iframe');
                                                                        iframe.style.position = 'fixed';
                                                                        iframe.style.width = '0';
                                                                        iframe.style.height = '0';
                                                                        iframe.style.border = '0';
                                                                        iframe.src = printUrl;
                                                                        document.body.appendChild(iframe);
                                                                        const cleanup = () => {
                                                                            window.removeEventListener('focus', cleanup);
                                                                            setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
                                                                        };
                                                                        window.addEventListener('focus', cleanup);
                                                                    }}>Print</div>
                                                                    <div className={styles.dropdownItem} onClick={() => {
                                                                        setSelectedTransaction(t);
                                                                        setIsHistoryModalOpen(true);
                                                                        setActiveDropdown(null);
                                                                    }}>View History</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {t.splitTransactions && t.splitTransactions.length > 0 && (
                                                            <div
                                                                className={styles.actionIcon}
                                                                onClick={() => toggleRowExpand(t.suppliersTransactionId)}
                                                                title="Show Split Payments"
                                                                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                                            >
                                                                {expandedRows[t.suppliersTransactionId] ? <FiChevronUp /> : <FiChevronDown />}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRows[t.suppliersTransactionId] && splitsList.map((split, sIdx) => (
                                                <tr key={`split-${sIdx}`} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                    <td>{Number(split.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td>{split.paymentType}</td>
                                                    <td></td>
                                                    <td></td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                }))}
                        </tbody>
                    </table>
                </div>
            )}

            {isAddModalOpen && (
                <AddPaymentOut
                    isOpen={isAddModalOpen}
                    onClose={handleCloseAddModal}
                    onRefresh={fetchTransactions}
                />
            )}

            {isHistoryModalOpen && (
                <HistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    data={selectedTransaction}
                    userInfo={userInfo}
                />
            )}
        </div>
    );
};

export default PaymentOutList;


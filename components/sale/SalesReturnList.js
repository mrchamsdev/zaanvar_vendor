import { toApiDateOnly, parseApiToLocal, parseWallClockDate } from "@/utilities/date-time-utils";

import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/sale/sales-invoice.module.css";
import { FiPrinter, FiShare2, FiMoreVertical, FiFilter, FiChevronLeft, FiChevronRight, FiCalendar, FiSearch, FiX } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import { useRouter } from "next/router";
import useStore from "../../components/state/useStore";
import { saleService } from "../../services/saleService";
import useDashboardData from "../dashboard/useDashboardData";
import ShareModal from "./ShareModal";

const CustomDateRangePicker = ({ startDate, endDate, onSelect, onClose, showInputs, isEmbedded }) => {
    const [viewDate, setViewDate] = useState(() => {
        const d = new Date(startDate);
        return (startDate && !isNaN(d.getTime())) ? d : new Date();
    });
    const [selecting, setSelecting] = useState('start');

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

    const isToday = (day) => {
        const now = new Date();
        const y = viewDate.getFullYear();
        const m = viewDate.getMonth();
        return day === now.getDate() && m === now.getMonth() && y === now.getFullYear();
    };

    return (
        <div className={`${styles.pickerContainer} ${isEmbedded ? styles.embedded : ''}`}>
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
                    const today = isToday(day);
                    return (
                        <div
                            key={day}
                            className={`${styles.calendarDay} ${selected ? styles.selectedDay : ''} ${inRange ? styles.inRangeDay : ''} ${today ? styles.today : ''}`}
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
                            {mode === opt && <FiChevronRight />}
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <span className={styles.modalLabel} style={{ fontSize: '11px', marginBottom: '6px' }}>Select Category</span>
                    <div className={styles.categorySelect} style={{ marginBottom: '12px', padding: '8px 10px', fontSize: '13px', minHeight: '34px' }} onClick={() => setShowOptions(true)}>
                        <span>{mode}</span>
                        <FiChevronRight style={{ transform: 'rotate(90deg)', color: '#666' }} />
                    </div>
                    <span className={styles.modalLabel} style={{ fontSize: '11px', marginBottom: '6px' }}>{label}</span>
                    <input
                        type="text"
                        className={styles.dateInput}
                        style={{ marginBottom: '12px', padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                        placeholder={`Enter ${label}`}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />

                    <div className={styles.modalActions} style={{ marginTop: '4px', gap: '8px' }}>
                        <button className={styles.clearBtn} style={{ padding: '8px', fontSize: '13px' }} onClick={() => {
                            setValue('');
                            onApply(null, null);
                            onClose();
                        }}>Clear</button>
                        <button className={styles.applyBtn} style={{ padding: '8px', fontSize: '13px' }} onClick={handleApply}>Apply</button>
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
                            {mode === opt && <FiChevronRight />}
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <span className={styles.modalLabel} style={{ fontSize: '11px', marginBottom: '6px' }}>Select Category</span>
                    <div className={styles.categorySelect} style={{ marginBottom: '12px', padding: '8px 10px', fontSize: '13px', minHeight: '34px' }} onClick={() => setShowOptions(true)}>
                        <span>{mode}</span>
                        <FiChevronRight style={{ transform: 'rotate(90deg)', color: '#666' }} />
                    </div>

                    {mode === 'Range' ? (
                        <>
                            <div className={styles.dateInputContainer} style={{ marginBottom: '10px' }}>
                                <span className={styles.modalLabel} style={{ fontSize: '11px', marginBottom: '4px' }}>From</span>
                                <div className={styles.dateInputWrapper} onClick={() => setShowCalendar('from')}>
                                    <div className={styles.dateInput} style={{ padding: '6px 10px', minHeight: '34px', fontSize: '12px' }}>
                                        {formatDateForDisplay(dates.from)}
                                    </div>
                                    <FiCalendar className={styles.calendarIconOverlay} style={{ fontSize: '14px', right: '10px' }} />
                                </div>
                            </div>
                            <div className={styles.dateInputContainer} style={{ marginBottom: '12px' }}>
                                <span className={styles.modalLabel} style={{ fontSize: '11px', marginBottom: '4px' }}>To</span>
                                <div className={styles.dateInputWrapper} onClick={() => setShowCalendar('to')}>
                                    <div className={styles.dateInput} style={{ padding: '6px 10px', minHeight: '34px', fontSize: '12px' }}>
                                        {formatDateForDisplay(dates.to)}
                                    </div>
                                    <FiCalendar className={styles.calendarIconOverlay} style={{ fontSize: '14px', right: '10px' }} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.dateInputContainer} style={{ marginBottom: '12px' }}>
                            <span className={styles.modalLabel} style={{ fontSize: '11px', marginBottom: '4px' }}>Select Date</span>
                            <div className={styles.dateInputWrapper} onClick={() => setShowCalendar('single')}>
                                <div className={styles.dateInput} style={{ padding: '6px 10px', minHeight: '34px', fontSize: '12px' }}>
                                    {formatDateForDisplay(dates.single)}
                                </div>
                                <FiCalendar className={styles.calendarIconOverlay} style={{ fontSize: '14px', right: '10px' }} />
                            </div>
                        </div>
                    )}

                    {showCalendar && (
                        <div style={{
                            position: 'absolute',
                            top: '0',
                            left: '105%',
                            zIndex: 3000,
                            minWidth: '280px'
                        }}>
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

                    <div className={styles.modalActions} style={{ marginTop: '4px', gap: '8px' }}>
                        <button className={styles.clearBtn} style={{ padding: '8px', fontSize: '13px' }} onClick={() => {
                            setDates({ single: '', from: '', to: '' });
                            onApply(null, null);
                            onClose();
                        }}>Clear</button>
                        <button className={styles.applyBtn} style={{ padding: '8px', fontSize: '13px' }} onClick={handleApply}>Apply</button>
                    </div>
                </>
            )}
        </div>
    );
};

import EmptyState from "../utilities/EmptyState";
import Loader from "../utilities/Loader";
import PrintInvoiceTemplate from "../shared/PrintInvoiceTemplate";

const SalesReturnList = ({ onAddClick }) => {
    const router = useRouter();
    const { jwtToken } = useStore();
    const [returns, setReturns] = useState([]);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const { branchId: defaultBranchId } = useDashboardData();
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [filterType, setFilterType] = useState("This Month");
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: toApiDateOnly(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
        endDate: toApiDateOnly(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
    });

    // Share modal state
    const [isShareModalOpen, setIsShareModalOpen] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // Multi-modal filter state
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const [dateFilterMode, setDateFilterMode] = useState(null);
    const [dateFilterValues, setDateFilterValues] = useState(null);

    const [openFilterCol, setOpenFilterCol] = useState(null); // 'refNo', 'customerName', 'received', 'balance'
    const [columnFilters, setColumnFilters] = useState({
        refNo: { mode: 'Contains', value: '' },
        billNo: { mode: 'Contains', value: '' },
        customerName: { mode: 'Contains', value: '' },
        received: { mode: 'Contains', value: '' },
        balance: { mode: 'Contains', value: '' }
    });

    const hasFiltersApplied = useMemo(() => {
        return !!(
            searchTerm ||
            dateFilterMode ||
            Object.values(columnFilters).some(f => f.value !== undefined && f.value !== null && f.value !== '')
        );
    }, [searchTerm, dateFilterMode, columnFilters]);

    useEffect(() => {
        if (router.query.branchId) {
            setSelectedBranchId(router.query.branchId);
        } else if (defaultBranchId && !selectedBranchId) {
            setSelectedBranchId(defaultBranchId);
        }
    }, [router.query.branchId, defaultBranchId]);

    const lastFetchedRef = React.useRef({ branchId: null, filterType: null, dateRange: null });

    const fetchReturns = async (branchId) => {
        if (!jwtToken || !branchId) return;
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

            const res = await saleService.getAllSalesReturns(jwtToken, branchId, dateParams);
            if (res.status === "success") {
                const newReturns = res.data || [];
                setReturns(newReturns);
                setTotals(res.overallTotals || null);

                if (filterType === "All" && newReturns.length > 0) {
                    const parsedDates = newReturns.map(r => parseWallClockDate(r.returnDate || r.createdDate)).filter(Boolean);
                    if (parsedDates.length > 0) {
                        const start = new Date(Math.min(...parsedDates.map(d => d.getTime())));
                        const end = new Date(Math.max(...parsedDates.map(d => d.getTime())));
                        const newRange = {
                            startDate: toApiDateOnly(start),
                            endDate: toApiDateOnly(end)
                        };
                        lastFetchedRef.current = {
                            branchId: branchId,
                            filterType: "All",
                            dateRange: newRange
                        };
                        setDateRange(newRange);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching sales returns:", error);
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
                lastFetchedRef.current = {
                    branchId: selectedBranchId,
                    filterType,
                    dateRange
                };
                fetchReturns(selectedBranchId);
            }
        }
    }, [selectedBranchId, filterType, dateRange]);

    useEffect(() => {
        const handleRefresh = () => {
            if (selectedBranchId) fetchReturns(selectedBranchId);
        };
        const handleClickOutside = (e) => {
            if (!e.target.closest(`.${styles.actions}`)) {
                setActiveDropdown(null);
            }
        };
        window.addEventListener('refreshSalesReturnList', handleRefresh);
        window.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('refreshSalesReturnList', handleRefresh);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedBranchId]);

    const handleFilterChange = (type) => {
        setFilterType(type);
        const now = new Date();
        let start, end;

        switch (type) {
            case "All":
                if (returns && returns.length > 0) {
                    const parsedDates = returns.map(r => parseWallClockDate(r.returnDate || r.createdDate)).filter(Boolean);
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
    };

    const filteredReturns = returns.filter(r => {
        const rDate = parseWallClockDate(r.returnDate || r.createdDate) || new Date();
        rDate.setHours(0, 0, 0, 0);

        let matchesDate = true;
        if (dateFilterMode) {
            if (dateFilterMode === 'Equal to' && dateFilterValues.single) {
                const target = parseWallClockDate(dateFilterValues.single);
                if (target) {
                    target.setHours(0, 0, 0, 0);
                    matchesDate = rDate.getTime() === target.getTime();
                } else {
                    matchesDate = false;
                }
            } else if (dateFilterMode === 'Less than' && dateFilterValues.single) {
                const target = parseWallClockDate(dateFilterValues.single);
                if (target) {
                    target.setHours(0, 0, 0, 0);
                    matchesDate = rDate.getTime() < target.getTime();
                } else {
                    matchesDate = false;
                }
            } else if (dateFilterMode === 'Greater than' && dateFilterValues.single) {
                const target = parseWallClockDate(dateFilterValues.single);
                if (target) {
                    target.setHours(0, 0, 0, 0);
                    matchesDate = rDate.getTime() > target.getTime();
                } else {
                    matchesDate = false;
                }
            } else if (dateFilterMode === 'Range' && dateFilterValues.from && dateFilterValues.to) {
                const start = parseWallClockDate(dateFilterValues.from);
                const end = parseWallClockDate(dateFilterValues.to);
                if (start && end) {
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    matchesDate = rDate >= start && rDate <= end;
                } else {
                    matchesDate = false;
                }
            }
        } else {
            const start = parseWallClockDate(dateRange.startDate);
            const end = parseWallClockDate(dateRange.endDate);
            if (start && end) {
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                matchesDate = rDate >= start && rDate <= end;
            } else {
                matchesDate = false;
            }
        }

        const customerName = r.customer ? `${r.customer.firstName} ${r.customer.lastName}`.trim() : "Walk-in Customer";
        const refNo = `SR-${r.customerReturnId}`;

        const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            refNo.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesColFilters = true;
        Object.keys(columnFilters).forEach(col => {
            const filter = columnFilters[col];
            if (filter.value === undefined || filter.value === null || filter.value === '') return;

            let targetVal = "";
            if (col === 'refNo') targetVal = refNo;
            if (col === 'billNo') targetVal = String(r.userOrderId || "");
            if (col === 'customerName') targetVal = customerName;
            if (col === 'received') targetVal = (r.totalReturnAmount || 0).toString();
            if (col === 'balance') targetVal = (r.dueAmount || 0).toString();

            if (col === 'received' || col === 'balance') {
                const numTarget = parseFloat(targetVal);
                const numFilter = parseFloat(filter.value);
                const isNumTarget = !isNaN(numTarget);
                const isNumFilter = !isNaN(numFilter);

                if (isNumTarget && isNumFilter) {
                    if (filter.mode === 'Exact Match') {
                        if (numTarget !== numFilter) matchesColFilters = false;
                    } else { // Contains
                        const strTarget = numTarget.toString();
                        const strFilter = numFilter.toString();
                        if (!strTarget.includes(strFilter) && !targetVal.toLowerCase().includes(filter.value.toLowerCase())) {
                            matchesColFilters = false;
                        }
                    }
                } else {
                    if (filter.mode === 'Exact Match') {
                        if (targetVal.toLowerCase() !== filter.value.toLowerCase()) matchesColFilters = false;
                    } else {
                        if (!targetVal.toLowerCase().includes(filter.value.toLowerCase())) matchesColFilters = false;
                    }
                }
            } else {
                if (filter.mode === 'Contains') {
                    if (!targetVal.toLowerCase().includes(filter.value.toLowerCase())) matchesColFilters = false;
                } else if (filter.mode === 'Exact Match') {
                    if (targetVal.toLowerCase() !== filter.value.toLowerCase()) matchesColFilters = false;
                }
            }
        });

        return matchesDate && matchesSearch && matchesColFilters;
    });

    const computedTotals = useMemo(() => {
        let totalReturnAmount = 0;
        let dueAmount = 0;
        filteredReturns.forEach(r => {
            totalReturnAmount += parseFloat(r.totalReturnAmount || 0);
            dueAmount += parseFloat(r.dueAmount || 0);
        });
        return {
            totalReturnAmount: totals?.totalReturnAmount || totals?.totalAmount || totalReturnAmount,
            dueAmount: totals?.dueAmount || totals?.totalBalance || dueAmount
        };
    }, [filteredReturns, totals]);

    const renderAppliedFilters = () => {
        const chips = [];

        if (dateFilterMode) {
            let label = `Date: ${dateFilterMode}`;
            if (dateFilterValues?.single) label += ` ${new Date(dateFilterValues.single).toLocaleDateString('en-GB')}`;
            if (dateFilterValues?.from) label += ` ${new Date(dateFilterValues.from).toLocaleDateString('en-GB')} - ${new Date(dateFilterValues.to).toLocaleDateString('en-GB')}`;

            chips.push({
                id: 'date',
                label,
                onRemove: () => {
                    setDateFilterMode(null);
                    setDateFilterValues(null);
                }
            });
        }

        Object.keys(columnFilters).forEach(col => {
            const filter = columnFilters[col];
            if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
                const labels = {
                    refNo: 'Return ID',
                    billNo: 'Bill No',
                    customerName: 'Customer',
                    received: 'Total Sale Return Amount',
                    balance: 'Total balance amount'
                };
                chips.push({
                    id: col,
                    label: `${labels[col] || col}: ${filter.mode} "${filter.value}"`,
                    onRemove: () => setColumnFilters({ ...columnFilters, [col]: { mode: 'Contains', value: '' } })
                });
            }
        });

        if (chips.length === 0) return null;

        return (
            <div className={styles.appliedFilters}>
                {chips.map(chip => (
                    <div key={chip.id} className={styles.filterChip}>
                        <span>{chip.label}</span>
                        <div className={chip.onRemove ? styles.removeChip : ''} onClick={chip.onRemove}>
                            <FiX />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const exportToExcel = () => {
        const headers = ["DATE", "BILL NO", "RETURN ID", "CUSTOMER NAME", "TOTAL SALE RETURN AMOUNT", "TOTAL BALANCE AMOUNT"];
        const rows = filteredReturns.map(r => [
            `" ${(parseApiToLocal(r.returnDate || r.createdDate) || new Date()).toLocaleDateString('en-GB')}"`,
            `"${r.userOrderId || ""}"`,
            `"SR-${r.customerReturnId}"`,
            `"${(r.customer ? r.customer.firstName + ' ' + r.customer.lastName : 'Walk-in Customer').replace(/"/g, '""')}"`,
            `"${r.totalReturnAmount || 0}"`,
            `"${r.dueAmount || '0.00'}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Sales_Return_Report_${toApiDateOnly(new Date())}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isPrintList = router.query.printList === 'true' || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('printList') === 'true');

    useEffect(() => {
        if (isPrintList && !loading) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isPrintList, loading]);

    const handlePrint = () => {
        const printUrl = `${window.location.pathname}?printList=true`;
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
    };

    if (isPrintList) {
        return (
            <PrintInvoiceTemplate
                title="Sales Return History"
                columns={[
                    { header: 'DATE', align: 'left', render: (item) => (parseApiToLocal(item.returnDate || item.createdDate) || new Date()).toLocaleDateString('en-GB') },
                    { header: 'BILL NO', accessor: 'userOrderId', align: 'left' },
                    { header: 'RETURN ID', render: (item) => `SR-${item.customerReturnId}`, align: 'left' },
                    { header: 'CUSTOMER NAME', render: (item) => item.customer ? `${item.customer.firstName} ${item.customer.lastName}`.trim() : 'Walk-in Customer', align: 'left' },
                    { header: 'TOTAL RETURN AMOUNT', align: 'right', render: (item) => Number(item.totalReturnAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                    { header: 'TOTAL BALANCE AMOUNT', align: 'right', render: (item) => Number(item.dueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                ]}
                items={filteredReturns}
                summary={[
                    { label: 'Total Return Amount', value: `₹${Number(totals?.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                    { label: 'Total Balance Amount', value: `₹${Number(totals?.totalBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, isTotal: true }
                ]}
            />
        );
    }

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
                                }}
                                onClose={() => setShowCustomPicker(false)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.searchBar}>
                <FiSearch className={styles.searchIcon} />
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search by Ref ID, Customer Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className={styles.transactionsHeader}>
                <h2 className={styles.transactionsTitle}>Transactions</h2>
                <div className={styles.headerActions}>
                    <button className={styles.iconBtn} onClick={exportToExcel} title="Export to Excel">
                        <FaFileExcel style={{ color: '#217346' }} />
                    </button>
                    <button className={styles.iconBtn} onClick={handlePrint} title="Print">
                        <FiPrinter />
                    </button>
                </div>
            </div>

            {loading ? (
                <Loader message="Loading Returns..." />
            ) : returns.length === 0 ? (
                <EmptyState
                    buttonText="Add Sales Return"
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
                                    BILL NO
                                    <FiFilter
                                        className={`${styles.filterIcon} ${(columnFilters.billNo.value !== undefined && columnFilters.billNo.value !== null && columnFilters.billNo.value !== '') ? styles.filterIconActive : ''}`}
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'billNo' ? null : 'billNo'); setIsDateFilterOpen(false); }}
                                    />
                                    {openFilterCol === 'billNo' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Bill No"
                                            currentMode={columnFilters.billNo.mode}
                                            currentValue={columnFilters.billNo.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, billNo: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th>
                                    <div className={styles.thContent}>
                                        <span>RETURN ID</span>
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.refNo.value !== undefined && columnFilters.refNo.value !== null && columnFilters.refNo.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'refNo' ? null : 'refNo'); setIsDateFilterOpen(false); }}
                                        />
                                    </div>
                                    {openFilterCol === 'refNo' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Return ID"
                                            currentMode={columnFilters.refNo.mode}
                                            currentValue={columnFilters.refNo.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, refNo: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th>
                                    <div className={styles.thContent}>
                                        <span>CUSTOMER NAME</span>
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.customerName.value !== undefined && columnFilters.customerName.value !== null && columnFilters.customerName.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'customerName' ? null : 'customerName'); setIsDateFilterOpen(false); }}
                                        />
                                    </div>
                                    {openFilterCol === 'customerName' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Customer Name"
                                            currentMode={columnFilters.customerName.mode}
                                            currentValue={columnFilters.customerName.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, customerName: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th>
                                    <div className={styles.thContent}>
                                        <span>TOTAL SALE RETURN AMOUNT</span>
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.received.value !== undefined && columnFilters.received.value !== null && columnFilters.received.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'received' ? null : 'received'); setIsDateFilterOpen(false); }}
                                        />
                                    </div>
                                    {openFilterCol === 'received' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Total Sale Return Amount"
                                            currentMode={columnFilters.received.mode}
                                            currentValue={columnFilters.received.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, received: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th>
                                    <div className={styles.thContent}>
                                        <span>TOTAL BALANCE AMOUNT</span>
                                        <FiFilter
                                            className={`${styles.filterIcon} ${(columnFilters.balance.value !== undefined && columnFilters.balance.value !== null && columnFilters.balance.value !== '') ? styles.filterIconActive : ''}`}
                                            onClick={() => { setOpenFilterCol(openFilterCol === 'balance' ? null : 'balance'); setIsDateFilterOpen(false); }}
                                        />
                                    </div>
                                    {openFilterCol === 'balance' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Total balance amount"
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
                            {filteredReturns.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className={styles.noDataCell}>
                                        The search you entered is not matching to any record
                                    </td>
                                </tr>
                            ) : (
                                filteredReturns.map((r, idx) => (
                                    <tr key={idx}>
                                        <td>{(parseApiToLocal(r.returnDate || r.createdDate) || new Date()).toLocaleDateString('en-GB')}</td>
                                        <td>{r.userOrderId || "-"}</td>
                                        <td>SR-{r.customerReturnId}</td>
                                        <td>{r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : `Walk-in Customer`}</td>
                                        <td>{Number(r.totalReturnAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td style={{ color: Number(r.dueAmount || 0) < 0 ? 'green' : 'red', fontWeight: '500' }}>
                                            {Number(r.dueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <div style={{ position: 'relative' }}>
                                                    <FiShare2
                                                        className={styles.actionIcon}
                                                        onClick={() => {
                                                            setSelectedTransaction(r);
                                                            setIsShareModalOpen(isShareModalOpen === `share-${idx}` ? null : `share-${idx}`);
                                                        }}
                                                    />
                                                    {isShareModalOpen === `share-${idx}` && (
                                                        <ShareModal
                                                            isOpen={true}
                                                            onClose={() => setIsShareModalOpen(false)}
                                                            data={r}
                                                            branchId={selectedBranchId || defaultBranchId}
                                                        />
                                                    )}
                                                </div>
                                                <div style={{ position: 'relative' }}>
                                                    <FiMoreVertical className={styles.actionIcon} onClick={() => setActiveDropdown(activeDropdown === idx ? null : idx)} />
                                                    {activeDropdown === idx && (
                                                        <div className={styles.dropdownMenu}>

                                                            <div className={styles.dropdownItem} onClick={() => {
                                                                router.push({ pathname: router.pathname, query: { ...router.query, view: 'true', id: r.customerReturnId } }, undefined, { shallow: true });
                                                                setActiveDropdown(null);
                                                            }}>View</div>

                                                            <div className={styles.dropdownItem} onClick={() => {
                                                                window.open(`${window.location.pathname}?view=true&id=${r.customerReturnId}&pdf=true`, '_blank');
                                                                setActiveDropdown(null);
                                                            }}>Open PDF</div>
                                                            <div className={styles.dropdownItem} onClick={() => {
                                                                const printUrl = `${window.location.pathname}?view=true&id=${r.customerReturnId}&print=true&pdf=true`;
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
                                                                setActiveDropdown(null);
                                                            }}>Print</div>

                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>
            )}

            {returns.length > 0 && (
                <div className={styles.bottomSummary}>
                    <div className={styles.summaryItem}>
                        Total Return Amount : Rs {Number(computedTotals.totalReturnAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={styles.summaryItem}>
                        Total Balance Amount : Rs {Number(computedTotals.dueAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesReturnList;

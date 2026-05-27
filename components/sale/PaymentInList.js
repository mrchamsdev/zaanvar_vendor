import { toApiDateOnly, parseApiToLocal } from "@/utilities/date-time-utils";

import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/sale/sales-invoice.module.css";
import { FiPrinter, FiShare2, FiMoreVertical, FiFilter, FiChevronLeft, FiChevronRight, FiCalendar, FiSearch, FiX, FiCheck, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import { useRouter } from "next/router";
import { saleService } from "../../services/saleService";
import useStore from "../../components/state/useStore";
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

    const paymentOptions = ['Cash', 'UPI', 'Card', 'Cheque', 'Bank'];
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

import EmptyState from "../utilities/EmptyState";
import Loader from "../utilities/Loader";

const PaymentInList = ({ onAddClick }) => {
    const router = useRouter();
    const { jwtToken } = useStore();
    const [payments, setPayments] = useState([]);
    const [totals, setTotals] = useState({ totalAmount: 0, paidAmount: 0, dueAmount: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});

    const toggleRowExpand = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getDisplayPaymentType = (p) => {
        if (p.paymentMethods && p.paymentMethods.length > 0) {
            const types = p.paymentMethods
                .map(pm => pm.paymentMethod || pm.paymentType || "Cash")
                .filter((value, index, self) => self.indexOf(value) === index);
            return types.join(" + ");
        }
        const types = [p.paymentMethod || p.paymentType, ...(p.splitTransactions || []).map(st => st.paymentMethod || st.paymentType)]
            .map(type => type || "Cash")
            .filter((value, index, self) => self.indexOf(value) === index);
        return types.join(" + ");
    };

    const getDisplayTotalAmount = (p) => {
        if (p.paymentMethods && p.paymentMethods.length > 0) {
            return p.paymentMethods.reduce((sum, pm) => sum + parseFloat(pm.amount || 0), 0);
        }
        const mainAmount = parseFloat(p.paidAmount || p.amount || p["paid amount"] || 0);
        const splitSum = (p.splitTransactions || []).reduce((sum, st) => sum + parseFloat(st.paidAmount || st.amount || st["paid amount"] || 0), 0);
        return mainAmount + splitSum;
    };

    const getDisplayBalanceAmount = (p) => {
        if (p.dueAmount !== undefined && p.dueAmount !== null) return p.dueAmount;
        if (p.splitTransactions && p.splitTransactions.length > 0) {
            const lastSplit = p.splitTransactions[p.splitTransactions.length - 1];
            return lastSplit.dueAmount || lastSplit["balance amount"] || lastSplit.balance || 0;
        }
        return p["balance amount"] || p.balance || 0;
    };

    const [customerTotals, setCustomerTotals] = useState([]);

    const getCustomerTotalAmount = (customerId) => {
        const custObj = customerTotals.find(c => c.vendorCustomerId === customerId);
        return custObj ? parseFloat(custObj.totalAmount || 0) : 0;
    };

    const getCustomerBalanceAmount = (customerId) => {
        const custObj = customerTotals.find(c => c.vendorCustomerId === customerId);
        return custObj ? parseFloat(custObj.dueAmount || 0) : 0;
    };

    const { branchId: defaultBranchId } = useDashboardData();
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [filterType, setFilterType] = useState("This Year");
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
    });

    // Share modal state
    const [isShareModalOpen, setIsShareModalOpen] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // Multi-modal filter state
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const [dateFilterMode, setDateFilterMode] = useState(null);
    const [dateFilterValues, setDateFilterValues] = useState(null);

    const [openFilterCol, setOpenFilterCol] = useState(null); // 'refNo', 'partyName', 'amount', 'paid', 'balance', 'paymentType'
    const [columnFilters, setColumnFilters] = useState({
        refNo: { mode: 'Contains', value: '' },
        partyName: { mode: 'Contains', value: '' },
        amount: { mode: 'Contains', value: '' },
        paid: { mode: 'Contains', value: '' },
        balance: { mode: 'Contains', value: '' },
        paymentType: { mode: 'Checklist', value: [] }
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
        const handleRefresh = () => {
            if (selectedBranchId) fetchPayments(selectedBranchId);
        };
        const handleClickOutside = (e) => {
            if (!e.target.closest(`.${styles.actions}`)) {
                setActiveDropdown(null);
            }
        };
        window.addEventListener('refreshPaymentList', handleRefresh);
        window.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('refreshPaymentList', handleRefresh);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedBranchId]);

    const fetchPayments = async (branchId) => {
        setLoading(true);
        try {
            const res = await saleService.getPayments(jwtToken, branchId);
            if (res.status === "success") {
                setPayments(res.data || []);
                setTotals(res.overallTotals || { totalAmount: 0, paidAmount: 0, dueAmount: 0 });
                setCustomerTotals(res.totals || []);
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedBranchId) {
            fetchPayments(selectedBranchId);
        }
    }, [selectedBranchId]);

    const handleFilterChange = (type) => {
        setFilterType(type);
        const now = new Date();
        let start, end;

        switch (type) {
            case "All":
                start = new Date(2000, 0, 1);
                end = new Date(2100, 11, 31);
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
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        });
        setShowCustomPicker(false);
        setDateFilterMode(null);
        setDateFilterValues(null);
    };

    const filteredPayments = payments.filter(p => {
        const pDate = parseApiToLocal(p.paymentDate || p.createdDate) || new Date();
        pDate.setHours(0, 0, 0, 0);

        let matchesDate = true;
        if (dateFilterMode) {
            if (dateFilterMode === 'Equal to' && dateFilterValues.single) {
                const target = new Date(dateFilterValues.single);
                target.setHours(0, 0, 0, 0);
                matchesDate = pDate.getTime() === target.getTime();
            } else if (dateFilterMode === 'Less than' && dateFilterValues.single) {
                const target = new Date(dateFilterValues.single);
                target.setHours(0, 0, 0, 0);
                matchesDate = pDate.getTime() < target.getTime();
            } else if (dateFilterMode === 'Greater than' && dateFilterValues.single) {
                const target = new Date(dateFilterValues.single);
                target.setHours(0, 0, 0, 0);
                matchesDate = pDate.getTime() > target.getTime();
            } else if (dateFilterMode === 'Range' && dateFilterValues.from && dateFilterValues.to) {
                const start = new Date(dateFilterValues.from);
                const end = new Date(dateFilterValues.to);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                matchesDate = pDate >= start && pDate <= end;
            }
        } else {
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = pDate >= start && pDate <= end;
        }

        const partyName = p.customer ? `${p.customer.firstName} ${p.customer.lastName}`.trim() : "N/A";
        const refNo = (p.userOrderId || "").toString();

        const matchesSearch = partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            refNo.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesColFilters = true;
        Object.keys(columnFilters).forEach(col => {
            const filter = columnFilters[col];
            if ((filter.value === undefined || filter.value === null || filter.value === '') || (Array.isArray(filter.value) && filter.value.length === 0)) return;

            if (col === 'paymentType' && filter.mode === 'Checklist') {
                const allTypes = (p.paymentMethods && p.paymentMethods.length > 0)
                    ? p.paymentMethods.map(pm => pm.paymentMethod || pm.paymentType || "Cash")
                    : [p.paymentMethod || p.paymentType || "Cash", ...(p.splitTransactions || []).map(st => st.paymentMethod || st.paymentType || "Cash")];
                const hasMatch = allTypes.some(type => filter.value.includes(type));
                if (!hasMatch) matchesColFilters = false;
                return;
            }

            let targetVal = "";
            if (col === 'refNo') targetVal = refNo;
            if (col === 'partyName') targetVal = partyName;
            if (col === 'amount') targetVal = getCustomerTotalAmount(p.vendorCustomerId).toString();
            if (col === 'paid') targetVal = getDisplayTotalAmount(p).toString();
            if (col === 'balance') targetVal = getCustomerBalanceAmount(p.vendorCustomerId).toString();

            if (col === 'amount' || col === 'paid' || col === 'balance') {
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
            const hasVal = Array.isArray(filter.value) ? filter.value.length > 0 : (filter.value !== undefined && filter.value !== null && filter.value !== '');
            if (hasVal) {
                const labels = {
                    refNo: 'Ref No',
                    partyName: 'Customer Name',
                    amount: 'Total',
                    paid: 'Paid',
                    balance: 'Balance',
                    paymentType: 'Payment Type'
                };
                chips.push({
                    id: col,
                    label: col === 'paymentType' 
                        ? `${labels[col]}: ${filter.value.join(', ')}`
                        : `${labels[col] || col}: ${filter.mode} "${filter.value}"`,
                    onRemove: () => setColumnFilters({ ...columnFilters, [col]: col === 'paymentType' ? { mode: 'Checklist', value: [] } : { mode: 'Contains', value: '' } })
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
        const headers = ["DATE", "REF NO", "CUSTOMER NAME", "TOTAL", "PAYMENT TYPE", "PAID", "BALANCE"];
        const rows = filteredPayments.map(p => [
            `" ${(parseApiToLocal(p.paymentDate || p.createdDate) || new Date()).toLocaleDateString('en-GB')}"`,
            `"${p.userOrderId || ""}"`,
            `"${(p.customer ? p.customer.firstName + ' ' + p.customer.lastName : 'N/A').replace(/"/g, '""')}"`,
            `"${getCustomerTotalAmount(p.vendorCustomerId)}"`,
            `"${getDisplayPaymentType(p)}"`,
            `"${getDisplayTotalAmount(p)}"`,
            `"${getCustomerBalanceAmount(p.vendorCustomerId)}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Payment_In_Report_${toApiDateOnly(new Date())}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                    placeholder="Search Customer Or Invoice Number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className={styles.summaryCard}>
                <div className={styles.summaryTop}>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>Total Amount</span>
                        <span className={styles.summaryValue}>₹{Number(totals.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className={styles.summaryTrend}>
                        <span className={styles.trendValue}>0% <FiSearch className={styles.trendIcon} style={{ transform: 'rotate(-45deg)' }} /></span>
                        <span className={styles.trendLabel}>vs Last month</span>
                    </div>
                </div>
                <div className={styles.summaryLine}></div>
                <div className={styles.summaryBottom}>
                    <div className={styles.summaryRowItem}>
                        <span className={styles.rowLabel}>Paid : </span>
                        <span className={styles.rowValue}>₹{Number(totals.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className={styles.summaryRowItem}>
                        <span className={styles.rowLabel}>Balance : </span>
                        <span className={styles.rowValue}>₹{Number(totals.dueAmount || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className={styles.transactionsHeader}>
                <h2 className={styles.transactionsTitle}>Transactions</h2>
                <div className={styles.headerActions}>
                    <button className={styles.iconBtn} onClick={exportToExcel} title="Export to Excel">
                        <FaFileExcel style={{ color: '#217346' }} />
                    </button>
                    <button className={styles.iconBtn} onClick={() => window.print()} title="Print">
                        <FiPrinter />
                    </button>
                </div>
            </div>

            {loading ? (
                <Loader message="Loading Payments..." />
            ) : payments.length === 0 ? (
                <EmptyState
                    buttonText="Add Payment In"
                    onAddClick={onAddClick}
                />
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ position: 'relative' }}>
                                    DATE
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
                                <th style={{ position: 'relative' }}>
                                    REF NO
                                    <FiFilter
                                        className={`${styles.filterIcon} ${(columnFilters.refNo.value !== undefined && columnFilters.refNo.value !== null && columnFilters.refNo.value !== '') ? styles.filterIconActive : ''}`}
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'refNo' ? null : 'refNo'); setIsDateFilterOpen(false); }}
                                    />
                                    {openFilterCol === 'refNo' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Ref No"
                                            currentMode={columnFilters.refNo.mode}
                                            currentValue={columnFilters.refNo.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, refNo: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th style={{ position: 'relative' }}>
                                    CUSTOMER NAME
                                    <FiFilter
                                        className={`${styles.filterIcon} ${(columnFilters.partyName.value !== undefined && columnFilters.partyName.value !== null && columnFilters.partyName.value !== '') ? styles.filterIconActive : ''}`}
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'partyName' ? null : 'partyName'); setIsDateFilterOpen(false); }}
                                    />
                                    {openFilterCol === 'partyName' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Customer Name"
                                            currentMode={columnFilters.partyName.mode}
                                            currentValue={columnFilters.partyName.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, partyName: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th style={{ position: 'relative' }}>
                                    TOTAL
                                    <FiFilter
                                        className={`${styles.filterIcon} ${(columnFilters.amount.value !== undefined && columnFilters.amount.value !== null && columnFilters.amount.value !== '') ? styles.filterIconActive : ''}`}
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'amount' ? null : 'amount'); setIsDateFilterOpen(false); }}
                                    />
                                    {openFilterCol === 'amount' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Total"
                                            currentMode={columnFilters.amount.mode}
                                            currentValue={columnFilters.amount.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({ ...columnFilters, amount: { mode, value: val } })}
                                        />
                                    )}
                                </th>
                                <th style={{ position: 'relative' }}>
                                    PAYMENT TYPE
                                    <FiFilter
                                        className={`${styles.filterIcon} ${(columnFilters.paymentType.value && columnFilters.paymentType.value.length > 0) ? styles.filterIconActive : ''}`}
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'paymentType' ? null : 'paymentType'); setIsDateFilterOpen(false); }}
                                    />
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
                                <th style={{ position: 'relative' }}>
                                    PAID
                                    <FiFilter
                                        className={`${styles.filterIcon} ${(columnFilters.paid.value !== undefined && columnFilters.paid.value !== null && columnFilters.paid.value !== '') ? styles.filterIconActive : ''}`}
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'paid' ? null : 'paid'); setIsDateFilterOpen(false); }}
                                    />
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
                                <th style={{ position: 'relative' }}>
                                    BALANCE
                                    <FiFilter
                                        className={`${styles.filterIcon} ${(columnFilters.balance.value !== undefined && columnFilters.balance.value !== null && columnFilters.balance.value !== '') ? styles.filterIconActive : ''}`}
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'balance' ? null : 'balance'); setIsDateFilterOpen(false); }}
                                    />
                                    {openFilterCol === 'balance' && (
                                        <GeneralFilterModal
                                            type="text"
                                            label="Balance"
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
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={styles.noDataCell}>
                                        This range data is not there
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((p, idx) => {
                                const splitsList = p.paymentMethods && p.paymentMethods.length > 0
                                    ? p.paymentMethods.map(pm => ({ paymentType: pm.paymentMethod || "Cash", amount: pm.amount || 0 }))
                                    : [
                                        { paymentType: p.paymentMethod || p.paymentType || "Cash", amount: p.paidAmount || p.amount || 0 },
                                        ...(p.splitTransactions || []).map(st => ({ paymentType: st.paymentMethod || st.paymentType || "Cash", amount: st.paidAmount || st.amount || 0 }))
                                    ];
                                return (
                                    <React.Fragment key={p.paymentId || idx}>
                                        <tr>
                                            <td>{(parseApiToLocal(p.paymentDate || p.createdDate) || new Date()).toLocaleDateString('en-GB')}</td>
                                            <td>{p.userOrderId}</td>
                                            <td>{p.customer ? `${p.customer.firstName} ${p.customer.lastName}` : `Customer #${p.vendorCustomerId}`}</td>
                                            <td>{Number(getCustomerTotalAmount(p.vendorCustomerId)).toLocaleString()}</td>
                                            <td>{getDisplayPaymentType(p)}</td>
                                            <td>{Number(getDisplayTotalAmount(p)).toLocaleString()}</td>
                                            <td>{Number(getCustomerBalanceAmount(p.vendorCustomerId)).toLocaleString()}</td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <div style={{ position: 'relative' }}>
                                                        <FiShare2 
                                                            className={styles.actionIcon} 
                                                            onClick={() => {
                                                                setSelectedTransaction(p);
                                                                setIsShareModalOpen(isShareModalOpen === `share-${idx}` ? null : `share-${idx}`);
                                                            }}
                                                        />
                                                        {isShareModalOpen === `share-${idx}` && (
                                                            <ShareModal
                                                                isOpen={true}
                                                                onClose={() => setIsShareModalOpen(false)}
                                                                data={p}
                                                                branchId={selectedBranchId || defaultBranchId}
                                                            />
                                                        )}
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <FiMoreVertical className={styles.actionIcon} onClick={() => setActiveDropdown(activeDropdown === idx ? null : idx)} />
                                                        {activeDropdown === idx && (
                                                            <div className={styles.dropdownMenu}>
                                                                <div className={styles.dropdownItem} onClick={() => { setActiveDropdown(null); router.push({ query: { ...router.query, view: 'true', id: p.paymentId } }); }}>View</div>
                                                                <div className={styles.dropdownItem} onClick={() => { setActiveDropdown(null); router.push({ query: { ...router.query, edit: 'true', id: p.paymentId } }); }}>Edit</div>
                                                                <div className={styles.dropdownItem} onClick={() => { setActiveDropdown(null); window.open(`${window.location.pathname}?view=true&id=${p.paymentId}&pdf=true`, '_blank'); }}>Open PDF</div>
                                                                <div className={styles.dropdownItem} onClick={() => { 
                                                                    setActiveDropdown(null); 
                                                                    const printUrl = `${window.location.pathname}?view=true&id=${p.paymentId}&print=true&pdf=true`;
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
                                                            </div>
                                                        )}
                                                    </div>
                                                    {((p.paymentMethods && p.paymentMethods.length > 1) || (p.splitTransactions && p.splitTransactions.length > 0)) && (
                                                        <div
                                                            className={styles.actionIcon}
                                                            onClick={() => toggleRowExpand(p.paymentId)}
                                                            title="Show Split Payments"
                                                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                                        >
                                                            {expandedRows[p.paymentId] ? <FiChevronUp /> : <FiChevronDown />}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRows[p.paymentId] && splitsList.map((split, sIdx) => (
                                            <tr key={`split-${sIdx}`} style={{ borderBottom: '1px solid #eee' }}>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td>{split.paymentType}</td>
                                                <td>{Number(split.amount).toLocaleString()}</td>
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
        </div>
    );
};

export default PaymentInList;

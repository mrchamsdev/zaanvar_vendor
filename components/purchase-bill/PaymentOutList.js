import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { FiPrinter, FiShare2, FiMoreVertical, FiFilter, FiArrowUpRight, FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import { useRouter } from "next/router";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import AddPaymentOut from "./AddPaymentOut";
import ShareModal from "./ShareModal";
import HistoryModal from "./HistoryModal";
import { VENDOR_API_URL } from "../../components/utilities/Constants";
import useDashboardData from "../dashboard/useDashboardData";

const CustomDateRangePicker = ({ startDate, endDate, onSelect, onClose, showInputs }) => {
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
        <div className={styles.pickerContainer}>
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
    const [value, setValue] = useState(currentValue || '');
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
        <div className={styles.dateFilterModal} style={{ textTransform: 'none', width: '240px', padding: '12px', top: '80%' }}>
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
                    {type === 'paymentType' ? (
                        <div className={styles.checklistContainer} style={{marginBottom: '12px'}}>
                            {paymentOptions.map(opt => (
                                <div key={opt} className={styles.checklistItem} style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer'}} 
                                     onClick={() => {
                                         if (selectedPayments.includes(opt)) {
                                             setSelectedPayments(selectedPayments.filter(p => p !== opt));
                                         } else {
                                             setSelectedPayments([...selectedPayments, opt]);
                                         }
                                     }}>
                                    <div style={{
                                        width: '18px', height: '18px', border: '1px solid #ddd', borderRadius: '4px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: selectedPayments.includes(opt) ? '#E93E64' : '#fff',
                                        borderColor: selectedPayments.includes(opt) ? '#E93E64' : '#ddd'
                                    }}>
                                        {selectedPayments.includes(opt) && <FiChevronRight style={{color: '#fff', fontSize: '12px', transform: 'rotate(0)'}} />}
                                    </div>
                                    <span style={{fontSize: '14px', color: '#333'}}>{opt}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <span className={styles.modalLabel} style={{fontSize: '11px', marginBottom: '6px'}}>Select Category</span>
                            <div className={styles.categorySelect} style={{marginBottom: '12px', padding: '8px 10px', fontSize: '13px', minHeight: '34px'}} onClick={() => setShowOptions(true)}>
                                <span>{mode}</span>
                                <FiChevronRight style={{transform: 'rotate(90deg)', color: '#666'}} />
                            </div>
                            <span className={styles.modalLabel} style={{fontSize: '11px', marginBottom: '6px'}}>{label}</span>
                            <input 
                                type="text" 
                                className={styles.dateInput} 
                                style={{marginBottom: '12px', padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box'}}
                                placeholder={`Enter ${label}`}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                            />
                        </>
                    )}

                    <div className={styles.modalActions} style={{marginTop: '4px', gap: '8px'}}>
                        <button className={styles.clearBtn} style={{padding: '8px', fontSize: '13px'}} onClick={() => {
                             if (type === 'paymentType') setSelectedPayments([]);
                             else setValue('');
                             onApply(null, null);
                             onClose();
                        }}>Clear</button>
                        <button className={styles.applyBtn} style={{padding: '8px', fontSize: '13px'}} onClick={handleApply}>Apply</button>
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
        single: currentDate?.single || new Date().toISOString().split('T')[0],
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
        <div className={styles.dateFilterModal} style={{ textTransform: 'none', width: '240px', padding: '12px', top: '80%' }}>
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
                    <span className={styles.modalLabel} style={{fontSize: '11px', marginBottom: '6px'}}>Select Category</span>
                    <div className={styles.categorySelect} style={{marginBottom: '12px', padding: '8px 10px', fontSize: '13px', minHeight: '34px'}} onClick={() => setShowOptions(true)}>
                        <span>{mode}</span>
                        <FiChevronRight style={{transform: 'rotate(90deg)', color: '#666'}} />
                    </div>

                    {mode === 'Range' ? (
                        <>
                            <div className={styles.dateInputContainer} style={{marginBottom: '10px'}}>
                                <span className={styles.modalLabel} style={{fontSize: '11px', marginBottom: '4px'}}>From</span>
                                <div className={styles.dateInputWrapper} onClick={() => setShowCalendar('from')}>
                                    <div className={styles.dateInput} style={{padding: '6px 10px', minHeight: '34px', fontSize: '12px'}}>
                                        {formatDateForDisplay(dates.from)}
                                    </div>
                                    <FiCalendar className={styles.calendarIconOverlay} style={{fontSize: '14px', right: '10px'}} />
                                </div>
                            </div>
                            <div className={styles.dateInputContainer} style={{marginBottom: '12px'}}>
                                <span className={styles.modalLabel} style={{fontSize: '11px', marginBottom: '4px'}}>To</span>
                                <div className={styles.dateInputWrapper} onClick={() => setShowCalendar('to')}>
                                    <div className={styles.dateInput} style={{padding: '6px 10px', minHeight: '34px', fontSize: '12px'}}>
                                        {formatDateForDisplay(dates.to)}
                                    </div>
                                    <FiCalendar className={styles.calendarIconOverlay} style={{fontSize: '14px', right: '10px'}} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.dateInputContainer} style={{marginBottom: '12px'}}>
                            <span className={styles.modalLabel} style={{fontSize: '11px', marginBottom: '4px'}}>Select Date</span>
                            <div className={styles.dateInputWrapper} onClick={() => setShowCalendar('single')}>
                                <div className={styles.dateInput} style={{padding: '6px 10px', minHeight: '34px', fontSize: '12px'}}>
                                    {formatDateForDisplay(dates.single)}
                                </div>
                                <FiCalendar className={styles.calendarIconOverlay} style={{fontSize: '14px', right: '10px'}} />
                            </div>
                        </div>
                    )}

                    {showCalendar && (
                        <div style={{position: 'absolute', top: '-40px', left: '105%', zIndex: 3000}}>
                            <CustomDateRangePicker 
                                startDate={showCalendar === 'single' ? dates.single : (showCalendar === 'from' ? dates.from : dates.to)}
                                endDate={showCalendar === 'single' ? dates.single : (showCalendar === 'from' ? dates.from : dates.to)}
                                showInputs={mode === 'Range'}
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

                    <div className={styles.modalActions} style={{marginTop: '4px', gap: '8px'}}>
                        <button className={styles.clearBtn} style={{padding: '8px', fontSize: '13px'}} onClick={() => {
                             setDates({single: '', from: '', to: ''});
                             onApply(null, null);
                             onClose();
                        }}>Clear</button>
                        <button className={styles.applyBtn} style={{padding: '8px', fontSize: '13px'}} onClick={handleApply}>Apply</button>
                    </div>
                </>
            )}
        </div>
    );
};

const PaymentOutList = () => {
    const router = useRouter();
    const { jwtToken, userInfo } = useStore();
    const [transactions, setTransactions] = useState([]);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const { branches, branchId: defaultBranchId } = useDashboardData();
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [filterType, setFilterType] = useState("This Month");
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    // New multi-modal date filter state
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const [dateFilterMode, setDateFilterMode] = useState(null);
    const [dateFilterValues, setDateFilterValues] = useState(null);

    const [openFilterCol, setOpenFilterCol] = useState(null); // 'refNo', 'partyName', 'paymentType', 'total', 'paid'
    const [columnFilters, setColumnFilters] = useState({
        refNo: { mode: 'Contains', value: '' },
        partyName: { mode: 'Contains', value: '' },
        paymentType: { mode: 'Checklist', value: [] },
        total: { mode: 'Contains', value: '' },
        paid: { mode: 'Contains', value: '' }
    });

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

    const fetchTransactions = async (branchId) => {
        setLoading(true);
        try {
            const res = await purchaseService.getBranchTransactions(jwtToken, branchId || selectedBranchId);
            if (res.status === "success") {
                setTransactions(res.data || []);
                setTotals(Array.isArray(res.totals) ? res.totals[0] : (res.totals || null));
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedBranchId) {
            fetchTransactions(selectedBranchId);
        }
    }, [selectedBranchId]);

    const handleBranchChange = (e) => {
        const branchId = e.target.value;
        setSelectedBranchId(branchId);
    };

    const handleFilterChange = (type) => {
        setFilterType(type);
        const now = new Date();
        let start, end;

        switch (type) {
            case "This Month":
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = now;
                break;
            case "Last Month":
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case "This Quarter":
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                end = now;
                break;
            case "This Year":
                start = new Date(now.getFullYear(), 0, 1);
                end = now;
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
        // Clear multi-modal filter when top level filter changes
        setDateFilterMode(null);
        setDateFilterValues(null);
    };

    const filteredTransactions = transactions.filter(t => {
        const transDate = new Date(t.userTransactionDate);
        transDate.setHours(0,0,0,0);
        
        let matchesDate = true;
        
        if (dateFilterMode) {
            if (dateFilterMode === 'Equal to' && dateFilterValues.single) {
                const target = new Date(dateFilterValues.single);
                target.setHours(0,0,0,0);
                matchesDate = transDate.getTime() === target.getTime();
            } else if (dateFilterMode === 'Less than' && dateFilterValues.single) {
                const target = new Date(dateFilterValues.single);
                target.setHours(0,0,0,0);
                matchesDate = transDate.getTime() < target.getTime();
            } else if (dateFilterMode === 'Greater than' && dateFilterValues.single) {
                const target = new Date(dateFilterValues.single);
                target.setHours(0,0,0,0);
                matchesDate = transDate.getTime() > target.getTime();
            } else if (dateFilterMode === 'Range' && dateFilterValues.from && dateFilterValues.to) {
                const start = new Date(dateFilterValues.from);
                const end = new Date(dateFilterValues.to);
                start.setHours(0,0,0,0);
                end.setHours(23,59,59,999);
                matchesDate = transDate >= start && transDate <= end;
            }
        } else {
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = transDate >= start && transDate <= end;
        }

        const matchesSearch = t.transactionInfo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             t.suppliersTransactionId?.toString().includes(searchTerm);
        
        let matchesColFilters = true;
        Object.keys(columnFilters).forEach(col => {
            const filter = columnFilters[col];
            if (!filter.value || (Array.isArray(filter.value) && filter.value.length === 0)) return;

            let targetVal = "";
            if (col === 'refNo') targetVal = t.suppliersTransactionId?.toString() || "";
            if (col === 'partyName') targetVal = t.transactionInfo?.toLowerCase() || "";
            if (col === 'paymentType') targetVal = t.paymentType || "";
            if (col === 'total') targetVal = totals?.supplierTotalAmount?.toString() || "";
            if (col === 'paid') targetVal = t.amount?.toString() || "";

            if (filter.mode === 'Contains') {
                if (!targetVal.toLowerCase().includes(filter.value.toLowerCase())) matchesColFilters = false;
            } else if (filter.mode === 'Exact Match') {
                if (targetVal.toLowerCase() !== filter.value.toLowerCase()) matchesColFilters = false;
            } else if (filter.mode === 'Checklist') {
                if (!filter.value.includes(targetVal)) matchesColFilters = false;
            }
        });

        return matchesDate && matchesSearch && matchesColFilters;
    });

    const exportToExcel = () => {
        const headers = ["DATE", "REF NO", "PARTY NAME", "PAYMENT TYPE", "TOTAL", "PAID"];
        const rows = filteredTransactions.map(t => [
            `"${new Date(t.userTransactionDate).toLocaleDateString('en-GB')}"`,
            `"${t.suppliersTransactionId}"`,
            `"${(t.transactionInfo || "N/A").replace(/"/g, '""')}"`,
            `"${t.paymentType || "N/A"}"`,
            `"${totals?.supplierTotalAmount || 0}"`,
            `"${t.amount}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Purchase_Out_Report_${new Date().toISOString().split('T')[0]}.csv`);
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
                    <select 
                        className={styles.select} 
                        style={{width: 'auto'}}
                        value={filterType}
                        onChange={(e) => handleFilterChange(e.target.value)}
                    >
                        {["This Month", "Last Month", "This Quarter", "This Year", "Custom"].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.filterGroup} style={{position: 'relative'}}>
                    <div 
                        className={styles.dateDisplay} 
                        onClick={() => setShowCustomPicker(!showCustomPicker)}
                    >
                        <FiCalendar style={{marginRight: '8px', color: '#666'}} />
                        {new Date(dateRange.startDate).toLocaleDateString('en-GB')} To {new Date(dateRange.endDate).toLocaleDateString('en-GB')}
                    </div>
                    {showCustomPicker && (
                        <div className={styles.customPickerWrapper}>
                            <CustomDateRangePicker 
                                startDate={dateRange.startDate}
                                endDate={dateRange.endDate}
                                onSelect={(range) => {
                                    setDateRange(range);
                                }}
                                onClose={() => setShowCustomPicker(false)}
                            />
                        </div>
                    )}
                </div>
            </div>


            <div className={styles.summarySection}>
                <div className={styles.mainSummaryCard}>
                    <div className={styles.summaryTop}>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Total Amount</span>
                            <span className={styles.summaryValue}>₹{Number(totals?.supplierTotalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className={styles.summaryStats}>
                            <span className={styles.percentText}>0% <FiArrowUpRight /></span>
                            <span className={styles.vsText}>vs Last month</span>
                        </div>
                    </div>
                    <div className={styles.summaryBottom}>
                        <div className={styles.bottomItem}>
                            <span className={styles.paidLabel}>Paid : </span>
                            <span className={styles.paidValue}>₹{Number(totals?.totalPaidAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className={styles.bottomItem} style={{marginLeft: 'auto'}}>
                            <span className={styles.paidLabel}>Balance : </span>
                            <span className={styles.paidValue}>₹{Number(totals?.totalBalanceAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.transactionsHeader}>
                <h2 className={styles.transactionsTitle}>Transactions</h2>
                <div className={styles.headerActions}>
                    <button className={styles.iconBtn} onClick={exportToExcel} title="Export to Excel">
                        <FaFileExcel style={{color: '#217346'}} />
                    </button>
                    <button className={styles.iconBtn} onClick={handlePrint} title="Print Report">
                        <FiPrinter />
                    </button>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{position: 'relative'}}>
                                DATE 
                                <FiFilter 
                                    className={styles.filterIcon} 
                                    onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
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
                            <th style={{position: 'relative'}}>
                                REF NO 
                                <FiFilter 
                                    className={styles.filterIcon} 
                                    onClick={() => setOpenFilterCol(openFilterCol === 'refNo' ? null : 'refNo')}
                                />
                                {openFilterCol === 'refNo' && (
                                    <GeneralFilterModal 
                                        type="text"
                                        label="Ref no"
                                        currentMode={columnFilters.refNo.mode}
                                        currentValue={columnFilters.refNo.value}
                                        onClose={() => setOpenFilterCol(null)}
                                        onApply={(mode, val) => setColumnFilters({...columnFilters, refNo: {mode, value: val}})}
                                    />
                                )}
                            </th>
                            <th style={{position: 'relative'}}>
                                PARTY NAME 
                                <FiFilter 
                                    className={styles.filterIcon} 
                                    onClick={() => setOpenFilterCol(openFilterCol === 'partyName' ? null : 'partyName')}
                                />
                                {openFilterCol === 'partyName' && (
                                    <GeneralFilterModal 
                                        type="text"
                                        label="Party Name"
                                        currentMode={columnFilters.partyName.mode}
                                        currentValue={columnFilters.partyName.value}
                                        onClose={() => setOpenFilterCol(null)}
                                        onApply={(mode, val) => setColumnFilters({...columnFilters, partyName: {mode, value: val}})}
                                    />
                                )}
                            </th>
                            <th style={{position: 'relative'}}>
                                PAYMENT TYPE 
                                <FiFilter 
                                    className={styles.filterIcon} 
                                    onClick={() => setOpenFilterCol(openFilterCol === 'paymentType' ? null : 'paymentType')}
                                />
                                {openFilterCol === 'paymentType' && (
                                    <GeneralFilterModal 
                                        type="paymentType"
                                        label="Payment Type"
                                        currentMode={columnFilters.paymentType.mode}
                                        currentValue={columnFilters.paymentType.value}
                                        onClose={() => setOpenFilterCol(null)}
                                        onApply={(mode, val) => setColumnFilters({...columnFilters, paymentType: {mode, value: val}})}
                                    />
                                )}
                            </th>
                            <th style={{position: 'relative'}}>
                                TOTAL 
                                <FiFilter 
                                    className={styles.filterIcon} 
                                    onClick={() => setOpenFilterCol(openFilterCol === 'total' ? null : 'total')}
                                />
                                {openFilterCol === 'total' && (
                                    <GeneralFilterModal 
                                        type="text"
                                        label="Total Amount"
                                        currentMode={columnFilters.total.mode}
                                        currentValue={columnFilters.total.value}
                                        onClose={() => setOpenFilterCol(null)}
                                        onApply={(mode, val) => setColumnFilters({...columnFilters, total: {mode, value: val}})}
                                    />
                                )}
                            </th>
                            <th style={{position: 'relative'}}>
                                PAID 
                                <FiFilter 
                                    className={styles.filterIcon} 
                                    onClick={() => setOpenFilterCol(openFilterCol === 'paid' ? null : 'paid')}
                                />
                                {openFilterCol === 'paid' && (
                                    <GeneralFilterModal 
                                        type="text"
                                        label="Paid"
                                        currentMode={columnFilters.paid.mode}
                                        currentValue={columnFilters.paid.value}
                                        onClose={() => setOpenFilterCol(null)}
                                        onApply={(mode, val) => setColumnFilters({...columnFilters, paid: {mode, value: val}})}
                                    />
                                )}
                            </th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map((t, idx) => (
                            <tr key={idx}>
                                <td>{new Date(t.userTransactionDate).toLocaleDateString('en-GB')}</td>
                                <td>{t.suppliersTransactionId}</td>
                                <td>{t.transactionInfo || "N/A"}</td>
                                <td>{t.paymentType || "N/A"}</td>
                                <td>{Number(totals?.supplierTotalAmount || 0).toLocaleString()}</td>
                                <td>{Number(t.amount).toLocaleString()}</td>
                                <td>
                                    <div className={styles.actions}>
                                        <FiShare2 
                                            className={styles.actionIcon} 
                                            onClick={() => {
                                                setSelectedTransaction(t);
                                                setIsShareModalOpen(true);
                                            }}
                                        />
                                        <div style={{position: 'relative'}}>
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
                                                        window.open(`/purchase-bill/print-receipt?id=${t.suppliersTransactionId}`, '_blank');
                                                        setActiveDropdown(null);
                                                    }}>Open PDF</div>
                                                    <div className={styles.dropdownItem} onClick={() => {
                                                        window.open(`/purchase-bill/print-receipt?id=${t.suppliersTransactionId}&autoPrint=true`, '_blank');
                                                        setActiveDropdown(null);
                                                    }}>Print</div>
                                                    <div className={styles.dropdownItem} onClick={() => {
                                                        setSelectedTransaction(t);
                                                        setIsHistoryModalOpen(true);
                                                        setActiveDropdown(null);
                                                    }}>View History</div>
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

            {isAddModalOpen && (
                <AddPaymentOut 
                    isOpen={isAddModalOpen} 
                    onClose={handleCloseAddModal} 
                    onRefresh={fetchTransactions}
                />
            )}

            {isShareModalOpen && (
                <ShareModal 
                    isOpen={isShareModalOpen} 
                    onClose={() => setIsShareModalOpen(false)} 
                    data={selectedTransaction}
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

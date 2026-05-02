import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/purchase-return.module.css";
import { FiPrinter, FiShare2, FiMoreVertical, FiFilter, FiArrowUpRight, FiChevronLeft, FiChevronRight, FiCalendar, FiSearch } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import { useRouter } from "next/router";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import AddPaymentOut from "./AddPaymentOut";
import ShareModal from "./ShareModal";
import HistoryModal from "./HistoryModal";
import useDashboardData from "../dashboard/useDashboardData";

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
    const [value, setValue] = useState(currentValue || '');
    const [showOptions, setShowOptions] = useState(false);
    const options = ['Contains', 'Exact Match'];

    const handleApply = () => {
        onApply(mode, value);
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

                    <div className={styles.modalActions} style={{marginTop: '4px', gap: '8px'}}>
                        <button className={styles.clearBtn} style={{padding: '8px', fontSize: '13px'}} onClick={() => {
                             setValue('');
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
                                isEmbedded={true}
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

const PurchaseReturnList = () => {
    const router = useRouter();
    const { jwtToken, userInfo } = useStore();
    const [returns, setReturns] = useState([]);
    const [totals, setTotals] = useState({ totalReceived: 0, totalBalance: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const { branches, branchId: defaultBranchId } = useDashboardData();
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [filterType, setFilterType] = useState("This Year");
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
    });

    // New multi-modal date filter state
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const [dateFilterMode, setDateFilterMode] = useState(null);
    const [dateFilterValues, setDateFilterValues] = useState(null);

    const [isShareModalOpen, setIsShareModalOpen] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const [openFilterCol, setOpenFilterCol] = useState(null); // 'refNo', 'supplierName', 'received', 'balance'
    const [columnFilters, setColumnFilters] = useState({
        refNo: { mode: 'Contains', value: '' },
        supplierName: { mode: 'Contains', value: '' },
        received: { mode: 'Contains', value: '' },
        balance: { mode: 'Contains', value: '' }
    });

    useEffect(() => {
        if (router.query.branchId) {
            setSelectedBranchId(router.query.branchId);
        } else if (defaultBranchId && !selectedBranchId) {
            setSelectedBranchId(defaultBranchId);
        }
    }, [router.query.branchId, defaultBranchId]);

    const fetchReturns = async (branchId) => {
        if (!branchId) return;
        setLoading(true);
        try {
            const res = await purchaseService.getBranchReturns(jwtToken, branchId);
            if (res.status === "success") {
                const data = res.data || [];
                setReturns(data);
                // Calculate totals if not provided by API
                if (res.totals) {
                    setTotals(Array.isArray(res.totals) ? res.totals[0] : res.totals);
                } else {
                    const totalAmt = data.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);
                    const totalRec = data.reduce((acc, curr) => acc + Number(curr.received || 0), 0);
                    const totalBal = data.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
                    setTotals({ totalAmount: totalAmt, totalReceived: totalRec, totalBalance: totalBal });
                }
            }
        } catch (error) {
            console.error("Error fetching returns:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedBranchId) {
            fetchReturns(selectedBranchId);
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
        // Clear multi-modal filter when top level filter changes
        setDateFilterMode(null);
        setDateFilterValues(null);
    };

    const filteredReturns = returns.filter(r => {
        const transDate = new Date(r.createdDate);
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

        const matchesSearch = (r.supplierName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                             r.returnProductsId?.toString().includes(searchTerm) ||
                             r.productsBillId?.toString().includes(searchTerm);
        
        let matchesColFilters = true;
        Object.keys(columnFilters).forEach(col => {
            const filter = columnFilters[col];
            if (!filter.value) return;

            let targetVal = "";
            if (col === 'refNo') targetVal = r.returnProductsId?.toString() || "";
            if (col === 'supplierName') targetVal = r.supplierName?.toLowerCase() || "";
            if (col === 'received') targetVal = r.received?.toString() || "";
            if (col === 'balance') targetVal = r.balance?.toString() || "";

            if (filter.mode === 'Contains') {
                if (!targetVal.toLowerCase().includes(filter.value.toLowerCase())) matchesColFilters = false;
            } else if (filter.mode === 'Exact Match') {
                if (targetVal.toLowerCase() !== filter.value.toLowerCase()) matchesColFilters = false;
            }
        });

        return matchesDate && matchesSearch && matchesColFilters;
    });

    const exportToExcel = () => {
        const headers = ["DATE", "REF NO", "SUPPLIER NAME", "RECEIVED", "BALANCE"];
        const rows = filteredReturns.map(r => [
            `"${new Date(r.createdDate).toLocaleDateString('en-GB')}"`,
            `"${r.returnProductsId || '000'}"`,
            `"${(r.supplierName || "N/A").replace(/"/g, '""')}"`,
            `"${r.totalAmount || 0}"`,
            `"0"`
        ]);

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Purchase_Return_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.printOnlyTitle}>Purchase Return History</h1>
            
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
                    placeholder="Search products here" 
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                                SUPPLIER NAME 
                                <FiFilter 
                                    className={styles.filterIcon} 
                                    onClick={() => setOpenFilterCol(openFilterCol === 'supplierName' ? null : 'supplierName')}
                                />
                                {openFilterCol === 'supplierName' && (
                                    <GeneralFilterModal 
                                        type="text"
                                        label="Supplier Name"
                                        currentMode={columnFilters.supplierName.mode}
                                        currentValue={columnFilters.supplierName.value}
                                        onClose={() => setOpenFilterCol(null)}
                                        onApply={(mode, val) => setColumnFilters({...columnFilters, supplierName: {mode, value: val}})}
                                    />
                                )}
                            </th>
                            <th style={{position: 'relative'}}>
                                RECEIVED 
                                <FiFilter 
                                    className={styles.filterIcon} 
                                    onClick={() => setOpenFilterCol(openFilterCol === 'received' ? null : 'received')}
                                />
                                {openFilterCol === 'received' && (
                                    <GeneralFilterModal 
                                        type="text"
                                        label="Received"
                                        currentMode={columnFilters.received.mode}
                                        currentValue={columnFilters.received.value}
                                        onClose={() => setOpenFilterCol(null)}
                                        onApply={(mode, val) => setColumnFilters({...columnFilters, received: {mode, value: val}})}
                                    />
                                )}
                            </th>
                            <th style={{position: 'relative'}}>
                                BALANCE 
                                <FiFilter 
                                    className={styles.filterIcon} 
                                    onClick={() => setOpenFilterCol(openFilterCol === 'balance' ? null : 'balance')}
                                />
                                {openFilterCol === 'balance' && (
                                    <GeneralFilterModal 
                                        type="text"
                                        label="Balance"
                                        currentMode={columnFilters.balance.mode}
                                        currentValue={columnFilters.balance.value}
                                        onClose={() => setOpenFilterCol(null)}
                                        onApply={(mode, val) => setColumnFilters({...columnFilters, balance: {mode, value: val}})}
                                    />
                                )}
                            </th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReturns.map((r, idx) => (
                            <tr key={idx}>
                                <td>{new Date(r.createdDate).toLocaleDateString('en-GB')}</td>
                                <td style={{ fontWeight: '600', color: '#333' }}>{r.returnProductsId}</td>
                                <td>{r.supplierName || "N/A"}</td>
                                <td style={{ fontWeight: '600' }}>{Number(r.received || 0).toLocaleString()}</td>
                                <td>{Number(r.balance || 0).toLocaleString()}</td>
                                <td>
                                    <div className={styles.actions}>
                                         <div style={{position: 'relative'}}>
                                            <FiShare2 
                                                className={styles.actionIcon} 
                                                onClick={() => {
                                                    setSelectedReturn(r);
                                                    setIsShareModalOpen(isShareModalOpen === `share-${idx}` ? null : `share-${idx}`);
                                                }}
                                            />
                                            {isShareModalOpen === `share-${idx}` && (
                                                <ShareModal 
                                                    isOpen={true}
                                                    onClose={() => setIsShareModalOpen(false)}
                                                    data={r}
                                                />
                                            )}
                                        </div>
                                        <div style={{position: 'relative'}}>
                                            <FiMoreVertical 
                                                className={styles.actionIcon} 
                                                onClick={() => setActiveDropdown(activeDropdown === idx ? null : idx)}
                                            />
                                             {activeDropdown === idx && (
                                                <div className={styles.dropdownMenu}>
                                                    <div className={styles.dropdownItem} onClick={() => {
                                                        router.push({ pathname: router.pathname, query: { ...router.query, view: 'true', id: r.returnProductsId } }, undefined, { shallow: true });
                                                        setActiveDropdown(null);
                                                    }}>View</div>
                                                    <div className={styles.dropdownItem} onClick={() => {
                                                        router.push({ pathname: router.pathname, query: { ...router.query, edit: 'true', id: r.returnProductsId } }, undefined, { shallow: true });
                                                        setActiveDropdown(null);
                                                    }}>Edit</div>
                                                    <div className={styles.dropdownItem} onClick={() => {
                                                        window.open(`/purchase-bill/print-return-receipt?id=${r.returnProductsId}`, '_blank');
                                                        setActiveDropdown(null);
                                                    }}>Open PDF</div>
                                                    <div className={styles.dropdownItem} onClick={() => {
                                                        window.open(`/purchase-bill/print-return-receipt?id=${r.returnProductsId}&autoPrint=true`, '_blank');
                                                        setActiveDropdown(null);
                                                    }}>Print</div>
                                                    <div className={styles.dropdownItem} onClick={() => {
                                                        setSelectedReturn(r);
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

            <div className={styles.bottomSummary}>
                <div className={styles.summaryItem}>
                    Total Amount : Rs {Number(totals?.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className={styles.summaryItem}>
                    Received : Rs {Number(totals?.totalReceived || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className={styles.summaryItem}>
                    Balance : Rs {Number(totals?.totalBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>

            {isHistoryModalOpen && (
                <HistoryModal 
                    isOpen={isHistoryModalOpen} 
                    onClose={() => setIsHistoryModalOpen(false)} 
                    data={selectedReturn}
                    userInfo={userInfo}
                />
            )}
        </div>
    );
};

export default PurchaseReturnList;


import React, { useState, useEffect } from "react";
import styles from "../../styles/sale/sales-invoice.module.css";
import { FiPrinter, FiShare2, FiMoreVertical, FiFilter, FiChevronLeft, FiChevronRight, FiCalendar, FiSearch, FiX, FiCheck } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import { useRouter } from "next/router";
import { saleService } from "../../services/saleService";
import useStore from "../../components/state/useStore";
import useDashboardData from "../dashboard/useDashboardData";

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
    const [value, setValue] = useState(currentValue || '');
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
                        <FiChevronRight style={{transform: 'rotate(90deg)', color: '#666'}} />
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
                        <FiChevronRight style={{transform: 'rotate(90deg)', color: '#666'}} />
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
                             setDates({single: '', from: '', to: ''});
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

const SalesInvoiceList = ({ onAddClick }) => {
    const router = useRouter();
    const { jwtToken } = useStore();
    const [invoices, setInvoices] = useState([]);
    const [totals, setTotals] = useState({ totalAmount: 0, paid: 0, balance: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const { branchId: defaultBranchId } = useDashboardData();
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [filterType, setFilterType] = useState("This Year");
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
    });

    // Multi-modal filter state
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const [dateFilterMode, setDateFilterMode] = useState(null);
    const [dateFilterValues, setDateFilterValues] = useState(null);

    const [openFilterCol, setOpenFilterCol] = useState(null); // 'invoiceNo', 'partyName', 'amount', 'paid', 'balance'
    const [columnFilters, setColumnFilters] = useState({
        invoiceNo: { mode: 'Contains', value: '' },
        partyName: { mode: 'Contains', value: '' },
        amount: { mode: 'Contains', value: '' },
        paid: { mode: 'Contains', value: '' },
        balance: { mode: 'Contains', value: '' }
    });

    useEffect(() => {
        if (router.query.branchId) {
            setSelectedBranchId(router.query.branchId);
        } else if (defaultBranchId && !selectedBranchId) {
            setSelectedBranchId(defaultBranchId);
        }
    }, [router.query.branchId, defaultBranchId]);

    const fetchInvoices = async (branchId) => {
        if (!branchId) return;
        setLoading(true);
        try {
            const res = await saleService.getSalesInvoices(jwtToken, branchId);
            if (res.status === "success") {
                setInvoices(res.data || []);
                setTotals({
                    totalAmount: res.overallTotals?.totalAmount || 0,
                    paid: res.overallTotals?.paidAmount || 0,
                    balance: res.overallTotals?.dueAmount || 0
                });
            }
        } catch (error) {
            console.error("Error fetching sales invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedBranchId) {
            fetchInvoices(selectedBranchId);
        }
    }, [selectedBranchId]);

    useEffect(() => {
        const handleRefresh = () => {
            if (selectedBranchId) fetchInvoices(selectedBranchId);
        };
        const handleClickOutside = (e) => {
            if (!e.target.closest(`.${styles.actions}`)) {
                setActiveDropdown(null);
            }
        };
        window.addEventListener('refreshSalesList', handleRefresh);
        window.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('refreshSalesList', handleRefresh);
            window.removeEventListener('mousedown', handleClickOutside);
        };
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
    };

    const filteredInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.createdDate);
        invDate.setHours(0,0,0,0);

        let matchesDate = true;
        if (dateFilterMode) {
            if (dateFilterMode === 'Equal to' && dateFilterValues.single) {
                const target = new Date(dateFilterValues.single);
                target.setHours(0,0,0,0);
                matchesDate = invDate.getTime() === target.getTime();
            } else if (dateFilterMode === 'Less than' && dateFilterValues.single) {
                const target = new Date(dateFilterValues.single);
                target.setHours(0,0,0,0);
                matchesDate = invDate.getTime() < target.getTime();
            } else if (dateFilterMode === 'Greater than' && dateFilterValues.single) {
                const target = new Date(dateFilterValues.single);
                target.setHours(0,0,0,0);
                matchesDate = invDate.getTime() > target.getTime();
            } else if (dateFilterMode === 'Range' && dateFilterValues.from && dateFilterValues.to) {
                const start = new Date(dateFilterValues.from);
                const end = new Date(dateFilterValues.to);
                start.setHours(0,0,0,0);
                end.setHours(23,59,59,999);
                matchesDate = invDate >= start && invDate <= end;
            }
        } else {
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = invDate >= start && invDate <= end;
        }

        const partyName = inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}`.trim() : (inv.partyName || "Walk-in Customer");
        const invoiceNo = (inv.userOrderId || inv.invoiceNumber || "").toString();

        const matchesSearch = partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesColFilters = true;
        Object.keys(columnFilters).forEach(col => {
            const filter = columnFilters[col];
            if (!filter.value) return;

            let targetVal = "";
            if (col === 'invoiceNo') targetVal = invoiceNo;
            if (col === 'partyName') targetVal = partyName;
            if (col === 'amount') targetVal = (inv.totalAmount || 0).toString();
            if (col === 'paid') targetVal = (inv.paidAmount || 0).toString();
            if (col === 'balance') targetVal = (inv.dueAmount || 0).toString();

            if (filter.mode === 'Contains') {
                if (!targetVal.toLowerCase().includes(filter.value.toLowerCase())) matchesColFilters = false;
            } else if (filter.mode === 'Exact Match') {
                if (targetVal.toLowerCase() !== filter.value.toLowerCase()) matchesColFilters = false;
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
            if (filter.value) {
                const labels = {
                    invoiceNo: 'Invoice No',
                    partyName: 'Customer Name',
                    amount: 'Amount',
                    paid: 'Paid',
                    balance: 'Balance'
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
        const headers = ["DATE", "INVOICE NO", "CUSTOMER NAME", "AMOUNT", "PAID", "BALANCE"];
        const rows = filteredInvoices.map(inv => [
            `"${new Date(inv.createdDate).toLocaleDateString('en-GB')}"`,
            `"${inv.userOrderId || inv.invoiceNumber || ''}"`,
            `"${(inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}`.trim() : (inv.partyName || "Walk-in Customer")).replace(/"/g, '""')}"`,
            `"${inv.totalAmount || 0}"`,
            `"${inv.paidAmount || 0}"`,
            `"${inv.dueAmount || 0}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Sales_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
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
                        <div className={styles.customSelectHeader} onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
                            <span>{filterType}</span>
                            <FiChevronRight style={{transform: showFilterDropdown ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s'}} />
                        </div>
                        {showFilterDropdown && (
                            <div className={styles.customSelectDropdown}>
                                {["This Month", "Last Month", "This Quarter", "This Year", "All", "Custom"].map(opt => (
                                    <div key={opt} className={`${styles.customSelectOption} ${filterType === opt ? styles.active : ''}`}
                                        onClick={() => { handleFilterChange(opt); setShowFilterDropdown(false); }}>
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
                    {showCustomPicker && (
                        <div className={styles.customPickerWrapper}>
                            <CustomDateRangePicker 
                                startDate={dateRange.startDate}
                                endDate={dateRange.endDate}
                                isEmbedded={true}
                                onSelect={(range) => setDateRange(range)}
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
                    placeholder="Search customer or invoice number" 
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className={styles.summaryCard}>
                <div className={styles.summaryTop}>
                    <div className={styles.summaryInfo}>
                        <div className={styles.summaryLabel}>Total Amount</div>
                        <div className={styles.summaryValue}>₹{Number(totals.totalAmount || 0).toLocaleString()}</div>
                    </div>
                    <div className={styles.summaryTrend}>
                        <div className={styles.trendValue}>0% <span className={styles.trendIcon}>↗</span></div>
                        <div className={styles.trendLabel}>vs Last month</div>
                    </div>
                </div>
                
                <div className={styles.summaryLine}></div>
                
                <div className={styles.summaryBottom}>
                    <div className={styles.summaryRowItem}>
                        <span className={styles.rowLabel}>Paid :</span>
                        <span className={styles.rowValue}>₹{Number(totals.paid || 0).toLocaleString()}</span>
                    </div>
                    <div className={styles.summaryRowItem}>
                        <span className={styles.rowLabel}>Balance :</span>
                        <span className={styles.rowValue}>₹{Number(totals.balance || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {renderAppliedFilters()}

            <div className={styles.transactionsHeader}>
                <h2 className={styles.transactionsTitle}>Transactions</h2>
                <div className={styles.headerActions}>
                    <button className={styles.iconBtn} onClick={exportToExcel} title="Export to Excel">
                        <FaFileExcel style={{color: '#217346'}} />
                    </button>
                    <button className={styles.iconBtn} onClick={() => window.print()} title="Print">
                        <FiPrinter />
                    </button>
                </div>
            </div>

            {loading ? (
                <Loader message="Loading Invoices..." />
            ) : filteredInvoices.length === 0 ? (
                <EmptyState 
                    buttonText="Add Sale Invoice"
                    onAddClick={onAddClick}
                />
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{position: 'relative'}}>
                                    DATE 
                                    <FiFilter 
                                        className={styles.filterIcon} 
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
                                <th style={{position: 'relative'}}>
                                    INVOICE NO 
                                    <FiFilter 
                                        className={styles.filterIcon} 
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'invoiceNo' ? null : 'invoiceNo'); setIsDateFilterOpen(false); }}
                                    />
                                    {openFilterCol === 'invoiceNo' && (
                                        <GeneralFilterModal 
                                            type="text"
                                            label="Invoice No"
                                            currentMode={columnFilters.invoiceNo.mode}
                                            currentValue={columnFilters.invoiceNo.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({...columnFilters, invoiceNo: {mode, value: val}})}
                                        />
                                    )}
                                </th>
                                <th style={{position: 'relative'}}>
                                    CUSTOMER NAME 
                                    <FiFilter 
                                        className={styles.filterIcon} 
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'partyName' ? null : 'partyName'); setIsDateFilterOpen(false); }}
                                    />
                                    {openFilterCol === 'partyName' && (
                                        <GeneralFilterModal 
                                            type="text"
                                            label="Customer Name"
                                            currentMode={columnFilters.partyName.mode}
                                            currentValue={columnFilters.partyName.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({...columnFilters, partyName: {mode, value: val}})}
                                        />
                                    )}
                                </th>
                                <th style={{position: 'relative'}}>
                                    AMOUNT 
                                    <FiFilter 
                                        className={styles.filterIcon} 
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'amount' ? null : 'amount'); setIsDateFilterOpen(false); }}
                                    />
                                    {openFilterCol === 'amount' && (
                                        <GeneralFilterModal 
                                            type="text"
                                            label="Amount"
                                            currentMode={columnFilters.amount.mode}
                                            currentValue={columnFilters.amount.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({...columnFilters, amount: {mode, value: val}})}
                                        />
                                    )}
                                </th>
                                <th style={{position: 'relative'}}>
                                    PAID 
                                    <FiFilter 
                                        className={styles.filterIcon} 
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'paid' ? null : 'paid'); setIsDateFilterOpen(false); }}
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
                                <th style={{position: 'relative'}}>
                                    BALANCE 
                                    <FiFilter 
                                        className={styles.filterIcon} 
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'balance' ? null : 'balance'); setIsDateFilterOpen(false); }}
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
                            {filteredInvoices.map((inv, idx) => {
                                const partyName = inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}`.trim() : (inv.partyName || "Walk-in Customer");
                                return (
                                    <tr key={inv.userOrderId || idx}>
                                        <td>{new Date(inv.createdDate).toLocaleDateString('en-GB')}</td>
                                        <td style={{ fontWeight: '600' }}>{inv.userOrderId}</td>
                                        <td>{partyName}</td>
                                        <td style={{ fontWeight: '600' }}>{Number(inv.totalAmount || 0).toLocaleString()}</td>
                                        <td>{Number(inv.paidAmount || 0).toLocaleString()}</td>
                                        <td>{Number(inv.dueAmount || 0).toLocaleString()}</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <FiShare2 className={styles.actionIcon} />
                                                <div style={{position: 'relative'}}>
                                                    <FiMoreVertical className={styles.actionIcon} onClick={() => setActiveDropdown(activeDropdown === idx ? null : idx)} />
                                                    {activeDropdown === idx && (
                                                        <div className={styles.dropdownMenu}>
                                                            <div className={styles.dropdownItem} onClick={() => { setActiveDropdown(null); router.push({ query: { ...router.query, view: 'true', id: inv.userOrderId } }); }}>View</div>
                                                            <div className={styles.dropdownItem} onClick={() => { setActiveDropdown(null); router.push({ query: { ...router.query, edit: 'true', id: inv.userOrderId } }); }}>Edit</div>
                                                            <div className={styles.dropdownItem} onClick={() => { setActiveDropdown(null); router.push({ query: { ...router.query, view: 'true', id: inv.userOrderId } }); }}>Open PDF</div>
                                                            <div className={styles.dropdownItem} onClick={() => { setActiveDropdown(null); router.push({ query: { ...router.query, view: 'true', id: inv.userOrderId, print: 'true' } }); }}>Print</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SalesInvoiceList;

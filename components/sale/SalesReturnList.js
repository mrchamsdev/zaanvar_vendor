
import React, { useState, useEffect } from "react";
import styles from "../../styles/sale/sales-invoice.module.css";
import { FiPrinter, FiShare2, FiMoreVertical, FiFilter, FiChevronLeft, FiChevronRight, FiCalendar, FiSearch, FiX } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import { useRouter } from "next/router";
import useStore from "../../components/state/useStore";
import { saleService } from "../../services/saleService";
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

import EmptyState from "../utilities/EmptyState";

const SalesReturnList = ({ onAddClick }) => {
    const router = useRouter();
    const { jwtToken } = useStore();
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const { branchId: defaultBranchId } = useDashboardData();
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [filterType, setFilterType] = useState("This Month");
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });

    // Multi-modal filter state
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const [dateFilterMode, setDateFilterMode] = useState(null);
    const [dateFilterValues, setDateFilterValues] = useState(null);

    const [openFilterCol, setOpenFilterCol] = useState(null); // 'refNo', 'customerName', 'received', 'balance'
    const [columnFilters, setColumnFilters] = useState({
        refNo: { mode: 'Contains', value: '' },
        customerName: { mode: 'Contains', value: '' },
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
        if (!jwtToken || !branchId) return;
        setLoading(true);
        try {
            const res = await saleService.getAllSalesReturns(jwtToken, branchId);
            if (res.status === "success") {
                setReturns(res.data || []);
            }
        } catch (error) {
            console.error("Error fetching sales returns:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedBranchId) {
            fetchReturns(selectedBranchId);
        }
    }, [selectedBranchId]);

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

    const filteredReturns = returns.filter(r => {
        const rDate = new Date(r.createdDate);
        rDate.setHours(0,0,0,0);

        let matchesDate = true;
        if (dateFilterMode) {
            if (dateFilterMode === 'Equal to' && dateFilterValues.single) {
                const target = new Date(dateFilterValues.single);
                target.setHours(0,0,0,0);
                matchesDate = rDate.getTime() === target.getTime();
            } else if (dateFilterMode === 'Less than' && dateFilterValues.single) {
                const target = new Date(dateFilterValues.single);
                target.setHours(0,0,0,0);
                matchesDate = rDate.getTime() < target.getTime();
            } else if (dateFilterMode === 'Greater than' && dateFilterValues.single) {
                const target = new Date(dateFilterValues.single);
                target.setHours(0,0,0,0);
                matchesDate = rDate.getTime() > target.getTime();
            } else if (dateFilterMode === 'Range' && dateFilterValues.from && dateFilterValues.to) {
                const start = new Date(dateFilterValues.from);
                const end = new Date(dateFilterValues.to);
                start.setHours(0,0,0,0);
                end.setHours(23,59,59,999);
                matchesDate = rDate >= start && rDate <= end;
            }
        } else {
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = rDate >= start && rDate <= end;
        }

        const customerName = r.customer ? `${r.customer.firstName} ${r.customer.lastName}`.trim() : "Walk-in Customer";
        const refNo = `SR-${r.customerReturnId}`;

        const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             refNo.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesColFilters = true;
        Object.keys(columnFilters).forEach(col => {
            const filter = columnFilters[col];
            if (!filter.value) return;

            let targetVal = "";
            if (col === 'refNo') targetVal = refNo;
            if (col === 'customerName') targetVal = customerName;
            if (col === 'received') targetVal = (r.totalReturnAmount || 0).toString();
            if (col === 'balance') targetVal = "0.00";

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
                    refNo: 'Ref No',
                    customerName: 'Customer',
                    received: 'Received',
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
        const headers = ["DATE", "REF NO", "CUSTOMER NAME", "RECEIVED", "BALANCE"];
        const rows = filteredReturns.map(r => [
            `"${new Date(r.createdDate).toLocaleDateString('en-GB')}"`,
            `"SR-${r.customerReturnId}"`,
            `"${(r.customer ? r.customer.firstName + ' ' + r.customer.lastName : 'Walk-in Customer').replace(/"/g, '""')}"`,
            `"${r.totalReturnAmount}"`,
            `"0.00"`
        ]);

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Sales_Return_Report_${new Date().toISOString().split('T')[0]}.csv`);
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
                    className={styles.searchInput} 
                    placeholder="Search products here" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                                    REF NO 
                                    <FiFilter 
                                        className={styles.filterIcon} 
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'refNo' ? null : 'refNo'); setIsDateFilterOpen(false); }}
                                    />
                                    {openFilterCol === 'refNo' && (
                                        <GeneralFilterModal 
                                            type="text"
                                            label="Ref No"
                                            currentMode={columnFilters.refNo.mode}
                                            currentValue={columnFilters.refNo.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({...columnFilters, refNo: {mode, value: val}})}
                                        />
                                    )}
                                </th>
                                <th style={{position: 'relative'}}>
                                    CUSTOMER NAME 
                                    <FiFilter 
                                        className={styles.filterIcon} 
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'customerName' ? null : 'customerName'); setIsDateFilterOpen(false); }}
                                    />
                                    {openFilterCol === 'customerName' && (
                                        <GeneralFilterModal 
                                            type="text"
                                            label="Customer Name"
                                            currentMode={columnFilters.customerName.mode}
                                            currentValue={columnFilters.customerName.value}
                                            onClose={() => setOpenFilterCol(null)}
                                            onApply={(mode, val) => setColumnFilters({...columnFilters, customerName: {mode, value: val}})}
                                        />
                                    )}
                                </th>
                                <th style={{position: 'relative'}}>
                                    RECEIVED 
                                    <FiFilter 
                                        className={styles.filterIcon} 
                                        onClick={() => { setOpenFilterCol(openFilterCol === 'received' ? null : 'received'); setIsDateFilterOpen(false); }}
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
                            {filteredReturns.map((r, idx) => (
                                <tr key={idx}>
                                    <td>{new Date(r.createdDate).toLocaleDateString('en-GB')}</td>
                                    <td>SR-{r.customerReturnId}</td>
                                    <td>{r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : `Walk-in Customer`}</td>
                                    <td>{Number(r.totalReturnAmount || 0).toLocaleString()}</td>
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

import React, { useState, useRef, useEffect } from "react";
import styles from "../../styles/grooming/bookingsList.module.css";

// SVG Icons
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconProducts = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconTable = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h18v18H3z" />
    <path d="M21 9H3M21 15H3M12 3v18" />
  </svg>
);

const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconWhatsApp = () => (
  <svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </svg>
);

const IconThreeDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const mockMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();
const mockYear = new Date().getFullYear();

// Mock data matching the new screenshot exactly
const INITIAL_BOOKINGS = [
  {
    id: "00000",
    date: `05 ${mockMonth} ${mockYear}`,
    time: "11:00 AM - 12:15 PM",
    status: "UPCOMING",
    customerName: "HARIKA",
    contact: "+91 9874561230",
    petName: "CHIKU",
    petBreed: "AKITA",
    service: "Bath Package",
    hasExtraService: false,
    groomer: "MOHIT",
    amount: "₹ 98",
    paymentStatus: "Paid (online)",
    serviceStatus: "SKIPPED",
    createdOn: "18 APR 2026, 4:30PM",
    type: "In House Grooming"
  },
  {
    id: "00001",
    date: `18 ${mockMonth} ${mockYear}`,
    time: "11:00 AM - 12:15 PM",
    status: "COMPLETED",
    customerName: "PRIYA SINGARAM",
    contact: "+91 9874561230",
    petName: "CHIKU",
    petBreed: "AKITA",
    service: "Full Grooming Package + Styling",
    hasExtraService: true,
    groomer: "RAVI",
    amount: "₹ 900",
    paymentStatus: "Pending",
    serviceStatus: "SKIPPED",
    createdOn: "18 APR 2026, 4:30PM",
    type: "Mobile Grooming"
  },
  {
    id: "00002",
    date: `18 ${mockMonth} ${mockYear}`,
    time: "11:00 AM - 12:15 PM",
    status: "UNASSIGNED",
    customerName: "PALLAVI",
    contact: "+91 9874561230",
    petName: "CHIKU",
    petBreed: "AKITA",
    service: "Bath Package",
    hasExtraService: false,
    groomer: "TEJA",
    amount: "₹ 850",
    paymentStatus: "Unpaid",
    serviceStatus: "SKIPPED",
    createdOn: "18 APR 2026, 4:30PM",
    type: "In Store Grooming"
  },
  {
    id: "00003",
    date: `24 ${mockMonth} ${mockYear}`,
    time: "11:00 AM - 12:15 PM",
    status: "CANCELED",
    customerName: "RIYA",
    contact: "+91 9874561230",
    petName: "CHIKU",
    petBreed: "AKITA",
    service: "Full Grooming Package + Styling",
    hasExtraService: false,
    groomer: "----",
    amount: "₹ 1000",
    paymentStatus: "Partially paid",
    serviceStatus: "SKIPPED",
    createdOn: "18 APR 2026, 4:30PM",
    type: "In House Grooming"
  }
];

export default function BookingsList({ onViewDetails }) {
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("Select Branch");

  // Filters State
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGroomer, setFilterGroomer] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Active Modes
  const [viewPeriod, setViewPeriod] = useState("Month"); // Day, Week, Month
  const [viewMode, setViewMode] = useState("Table"); // Calendar, Table
  const [selectedDate, setSelectedDate] = useState(new Date()); // currently viewed date

  // Navigate selected date by period
  const navigateDate = (dir) => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      if (viewPeriod === "Day") d.setDate(d.getDate() + dir);
      if (viewPeriod === "Week") d.setDate(d.getDate() + dir * 7);
      if (viewPeriod === "Month") d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  // Format date display label
  const formatDateDisplay = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (viewPeriod === "Day") {
      return `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
    if (viewPeriod === "Month") {
      return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
    // Week: show range
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
  };

  // Actions Dropdowns
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const handleThreeDotClick = (e, booking) => {
    e.stopPropagation();
    if (activeMenuId === booking.id) {
      setActiveMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 210; // matches max-height of scrollable menu
      const viewportHeight = window.innerHeight;

      // Check if menu would go below the visible screen
      const openUpward = (rect.bottom + menuHeight) > viewportHeight;

      setMenuPosition({
        top: openUpward ? (rect.top - menuHeight) : (rect.bottom + 4),
        left: rect.right - 190
      });
      setSelectedBooking(booking);
      setActiveMenuId(booking.id);
    }
  };

  // Modals
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [showAssignGroomer, setShowAssignGroomer] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showAdvancedPaymentModal, setShowAdvancedPaymentModal] = useState(false);
  
  const [selectedBooking, setSelectedBooking] = useState(null);

  const filterRef = useRef(null);

  // Handle outside click to close menus
  useEffect(() => {
    function handleOutsideClick(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterDropdownOpen(false);
      }
      if (!event.target.closest(`.${styles.actionsCell}`) && !event.target.closest(`.${styles.threeDotMenuAbsolute}`)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter Bookings based on tags and search
  const filteredBookings = bookings.filter((b) => {
    if (filterType && b.type !== filterType) return false;
    if (filterStatus && b.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (filterGroomer && b.groomer !== filterGroomer) return false;
    if (filterPayment && b.paymentStatus.toLowerCase() !== filterPayment.toLowerCase()) return false;

    // Search term filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        b.customerName.toLowerCase().includes(search) ||
        b.petName.toLowerCase().includes(search) ||
        b.id.includes(search) ||
        b.contact.includes(search)
      );
    }
    return true;
  });

  const handleActionClick = (action, booking) => {
    setSelectedBooking(booking);
    if (action === "Check-In") {
      setShowCheckInModal(true);
    } else if (action === "Check-Out") {
      setShowCheckOutModal(true);
    } else if (action === "Assign Groomer") {
      setShowAppointmentDetails(true);
    } else if (action === "Approve") {
      setShowApproveModal(true);
    } else if (action === "Cancel") {
      setShowCancelModal(true);
    } else if (action === "Reschedule") {
      setShowRescheduleModal(true);
    } else if (action === "Update Payment status") {
      setShowAdvancedPaymentModal(true);
    } else if (action === "View Details") {
      if (onViewDetails) onViewDetails(booking);
    } else if (action === "Edit") {
      setShowAppointmentDetails(true); // Assuming Edit opens details
    } else {
      alert(`Action "${action}" triggered for Booking #${booking.id}`);
    }
    setActiveMenuId(null);
  };

  const getPaymentStatusClass = (status) => {
    const s = status.toLowerCase();
    if (s.includes("paid (online)") || s === "paid") {
      return styles.paymentPaid;
    } else if (s === "pending") {
      return styles.paymentPending;
    } else if (s === "unpaid") {
      return styles.paymentUnpaid;
    } else if (s.includes("partially")) {
      return styles.paymentPartially;
    }
    return "";
  };

  return (
    <div className={styles.container}>

      {/* Date Navigation & Period/Mode Toggle Row */}
      <div className={styles.navRow}>
        <div className={styles.dateNav}>
          <button className={styles.navArrowBtn} onClick={() => navigateDate(-1)}>
            <IconChevronLeft />
          </button>
          <button className={styles.navArrowBtn} onClick={() => navigateDate(1)}>
            <IconChevronRight />
          </button>
          <button className={styles.todayBtn} onClick={() => setSelectedDate(new Date())}>Today</button>
          <div className={styles.dateDisplay}>{formatDateDisplay()}</div>
        </div>

        <div className={styles.viewToggleGroup}>
          <div className={styles.periodToggle}>
            {["Day", "Week", "Month"].map((p) => (
              <button
                key={p}
                className={`${styles.periodBtn} ${viewPeriod === p ? styles.periodBtnActive : ""}`}
                onClick={() => setViewPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${viewMode === "Calendar" ? styles.modeBtnActive : ""}`}
              onClick={() => setViewMode("Calendar")}
            >
              <IconCalendar /> Calendar
            </button>
            <button
              className={`${styles.modeBtn} ${viewMode === "Table" ? styles.modeBtnActive : ""}`}
              onClick={() => setViewMode("Table")}
            >
              <IconTable /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className={styles.filterSearchRow}>
        <div className={styles.filterSection} ref={filterRef}>
          <button
            className={`${styles.filterTriggerBtn} ${filterDropdownOpen ? styles.filterTriggerBtnActive : ""}`}
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
          >
            <IconFilter /> Filters
          </button>

          {/* Selected Filter Badges */}
          {filterType && (
            <span className={styles.filterBadge} onClick={() => setFilterType("")}>
              {filterType} <span className={styles.filterBadgeRemove}>×</span>
            </span>
          )}
          {filterStatus && (
            <span className={styles.filterBadge} onClick={() => setFilterStatus("")}>
              {filterStatus} <span className={styles.filterBadgeRemove}>×</span>
            </span>
          )}
          {filterPayment && (
            <span className={styles.filterBadge} onClick={() => setFilterPayment("")}>
              {filterPayment} <span className={styles.filterBadgeRemove}>×</span>
            </span>
          )}

          {/* Dropdown Filters Panel */}
          {filterDropdownOpen && (
            <div className={styles.filterDropdownPopup}>
              <div className={styles.filterGroupTitle}>Booking Type</div>
              {[
                "Mobile Grooming",
                "In House Grooming",
                "In Store Grooming"
              ].map((t) => (
                <div key={t} className={styles.filterOption} onClick={() => setFilterType(t)}>
                  <div className={`${styles.radioCircle} ${filterType === t ? styles.radioCircleSelected : ""}`}>
                    {filterType === t && <div className={styles.bulletSelected} />}
                  </div>
                  {t}
                </div>
              ))}

              <div className={styles.filterGroupTitle}>Booking Status</div>
              {[
                "Upcoming",
                "pending",
                "Canceled",
                "Check-In",
                "Completed",
                "Not Started",
                "In Progress",
                "Confirmed"
              ].map((s) => (
                <div key={s} className={styles.filterOption} onClick={() => setFilterStatus(s)}>
                  <div className={`${styles.radioCircle} ${filterStatus === s ? styles.radioCircleSelected : ""}`}>
                    {filterStatus === s && <div className={styles.bulletSelected} />}
                  </div>
                  {s}
                </div>
              ))}

              <div className={styles.filterGroupTitle}>Groomers List</div>
              {[
                "Groomer 1",
                "Groomer 2",
                "Groomer 3",
                "Groomer 4"
              ].map((g) => (
                <div key={g} className={styles.filterOption} onClick={() => setFilterGroomer(g)}>
                  <div className={`${styles.radioCircle} ${filterGroomer === g ? styles.radioCircleSelected : ""}`}>
                    {filterGroomer === g && <div className={styles.bulletSelected} />}
                  </div>
                  {g}
                </div>
              ))}

              <div className={styles.filterGroupTitle}>Payment Status</div>
              {[
                "Paid",
                "Unpaid",
                "Pending",
                "Partially paid"
              ].map((p) => (
                <div key={p} className={styles.filterOption} onClick={() => setFilterPayment(p)}>
                  <div className={`${styles.radioCircle} ${filterPayment === p ? styles.radioCircleSelected : ""}`}>
                    {filterPayment === p && <div className={styles.bulletSelected} />}
                  </div>
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search bookings here"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className={styles.searchIcon}><IconSearch /></span>
        </div>
      </div>

      {/* ── CALENDAR VIEW ── */}
      {viewMode === "Calendar" && (
        <div className={styles.calendarArea}>
          {/* ── MONTH VIEW ── */}
          {viewPeriod === "Month" && (
            <CalendarMonthView
              bookings={filteredBookings}
              selectedDate={selectedDate}
              onDayClick={(d) => { setSelectedDate(d); setViewPeriod("Day"); }}
            />
          )}
          {/* ── WEEK VIEW ── */}
          {viewPeriod === "Week" && (
            <CalendarWeekView
              bookings={filteredBookings}
              selectedDate={selectedDate}
              onDayClick={(d) => { setSelectedDate(d); setViewPeriod("Day"); }}
            />
          )}
          {/* ── DAY VIEW ── */}
          {viewPeriod === "Day" && (
            <CalendarDayView
              bookings={filteredBookings}
              selectedDate={selectedDate}
            />
          )}
        </div>
      )}

      {/* Bookings Table with scrollable and sticky action column */}
      {viewMode === "Table" && (
        <div className={styles.tableWrapper}>
          <div className={styles.tableInner}>
            <table className={styles.bookingsTable}>
              <thead>
                <tr>
                  <th className={styles.colBookingId}>Booking ID</th>
                  <th className={styles.colDate}>Date</th>
                  <th className={styles.colTime}>Time</th>
                  <th className={styles.colStatus}>Status</th>
                  <th className={styles.colCustomer}>Customer Name</th>
                  <th className={styles.colContact}>Contact</th>
                  <th className={styles.colPet}>Pet</th>
                  <th className={styles.colService}>Service</th>
                  <th className={styles.colGroomer}>Groomer</th>
                  <th className={styles.colAmount}>Amount</th>
                  <th className={styles.colPaymentStatus}>Payment Status</th>
                  <th className={styles.colServiceStatus}>Service</th>
                  <th className={styles.colCreatedOn}>Created On</th>
                  <th className={`${styles.stickyActionsHeader} ${styles.colStickyActions}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b, idx) => (
                  <tr
                    key={b.id}
                    className={activeMenuId === b.id ? styles.activeRow : ""}
                  >
                    <td className={styles.idCell}>{b.id}</td>
                    <td className={styles.dateCell}>{b.date}</td>
                    <td className={styles.timeCell}>{b.time}</td>
                    <td>
                      <span
                        className={
                          b.status === "UPCOMING"
                            ? styles.statusUpcoming
                            : b.status === "COMPLETED"
                              ? styles.statusCompleted
                              : b.status === "UNASSIGNED"
                                ? styles.statusUnassigned
                                : styles.statusCanceled
                        }
                      >
                        ● {b.status}
                      </span>
                    </td>
                    <td className={styles.customerName}>{b.customerName}</td>
                    <td className={styles.contactCell}>{b.contact}</td>
                    <td>
                      <div className={styles.petName}>{b.petName}</div>
                      <div className={styles.petBreed}>{b.petBreed}</div>
                    </td>
                    <td>
                      <div className={styles.serviceWrapper}>
                        <button className={styles.serviceBtn}>{b.service}</button>
                        {b.hasExtraService && (
                          <span className={styles.extraServiceBadge}>1+</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.groomerCell}>{b.groomer}</td>
                    <td className={styles.amountCell}>{b.amount}</td>
                    <td className={getPaymentStatusClass(b.paymentStatus)}>{b.paymentStatus}</td>
                    <td>
                      <span className={styles.serviceStatusBadge}>{b.serviceStatus}</span>
                    </td>
                    <td className={styles.createdOnCell}>{b.createdOn}</td>
                    <td className={`${styles.stickyActionsCell} ${activeMenuId === b.id ? styles.activeActionsCell : ""}`}>
                      <div className={styles.actionsCell}>
                        {/* Call */}
                        <button className={styles.actionIconBtn} onClick={() => alert(`Calling ${b.customerName}...`)}>
                          <IconPhone />
                        </button>
                        {/* Eye */}
                        <button className={styles.actionIconBtn} onClick={() => handleActionClick("Check-In", b)}>
                          <IconEye />
                        </button>
                        {/* WhatsApp */}
                        <button className={styles.actionIconBtn} onClick={() => alert(`Opening WhatsApp chat with ${b.customerName}...`)}>
                          <IconWhatsApp />
                        </button>
                        {/* Three-dots menu */}
                        <button
                          className={styles.threeDotBtn}
                          onClick={(e) => handleThreeDotClick(e, b)}
                        >
                          <IconThreeDots />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Check-IN Modal */}
      {showCheckInModal && selectedBooking && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBody}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Booking Details</h3>
              <button className={styles.closeBtn} onClick={() => setShowCheckInModal(false)}>
                <IconClose />
              </button>
            </div>

            <div className={styles.customerProfileRow}>
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                alt="Eleanor Avatar"
                className={styles.profileAvatar}
              />
              <div className={styles.profileDetails}>
                <span className={styles.profileName}>Eleanor Shellstrop</span>
                <span className={styles.profileSubtitle}>
                  🐾 In-house Grooming: Teddy (Golden Retriever)
                </span>
              </div>
            </div>

            <div className={styles.inputsGrid}>
              <div className={styles.modalField}>
                <div className={styles.fieldVal}>Oct 25, 2023</div>
                <div className={styles.fieldLabel}>08:00 AM — 05:00 PM</div>
              </div>
              <div className={styles.modalField}>
                <div className={styles.fieldVal}>Phani</div>
                <div className={styles.fieldLabel}>Assigned Groomer</div>
              </div>
              <div className={`${styles.modalField} ${styles.modalFieldActive}`}>
                <div className={styles.fieldVal}>Oct 26, 2023</div>
                <div className={styles.fieldLabel}>Check-IN Date</div>
              </div>
              <div className={`${styles.modalField} ${styles.modalFieldActive}`}>
                <div className={styles.fieldVal}>02:45PM</div>
                <div className={styles.fieldLabel}>Check-IN Time</div>
              </div>
            </div>

            <button
              className={styles.modalConfirmBtn}
              onClick={() => {
                setBookings(
                  bookings.map((item) =>
                    item.id === selectedBooking.id
                      ? { ...item, status: "IN PROGRESS" }
                      : item
                  )
                );
                setShowCheckInModal(false);
              }}
            >
              Confirm Check-IN
            </button>
          </div>
        </div>
      )}

      {/* Confirm Check-out Modal */}
      {showCheckOutModal && selectedBooking && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBody}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Booking Details</h3>
              <button className={styles.closeBtn} onClick={() => setShowCheckOutModal(false)}>
                <IconClose />
              </button>
            </div>

            <div className={styles.customerProfileRow}>
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                alt="Pet"
                className={styles.profileImg}
              />
              <div className={styles.customerProfileInfo}>
                <div className={styles.customerName}>Max(India Spitz)</div>
                <div className={styles.customerPhone}>Deepak : (9347992753)</div>
              </div>
            </div>

            <div className={styles.inputsGrid}>
              <div className={styles.modalField}>
                <div className={styles.fieldVal}>Oct 25, 2023</div>
                <div className={styles.fieldLabel}>08:00 AM — 05:00 PM</div>
              </div>
              <div className={styles.modalField}>
                <div className={styles.fieldVal}>Phani</div>
                <div className={styles.fieldLabel}>Assigned Groomer</div>
              </div>
              <div className={`${styles.modalField} ${styles.modalFieldActive}`}>
                <div className={styles.fieldVal}>Oct 26, 2023</div>
                <div className={styles.fieldLabel}>Check-Out Date</div>
              </div>
              <div className={`${styles.modalField} ${styles.modalFieldActive}`}>
                <div className={styles.fieldVal}>02:45PM</div>
                <div className={styles.fieldLabel}>Check-Out Time</div>
              </div>
            </div>

            <button
              className={styles.modalConfirmBtn}
              onClick={() => {
                setBookings(
                  bookings.map((item) =>
                    item.id === selectedBooking.id
                      ? { ...item, status: "COMPLETED" }
                      : item
                  )
                );
                setShowCheckOutModal(false);
              }}
            >
              Confirm Check-out
            </button>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showAppointmentDetails && selectedBooking && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBody}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Appointment Details</h3>
              <button className={styles.closeBtn} onClick={() => setShowAppointmentDetails(false)}><IconClose /></button>
            </div>
            <div className={styles.detailsHeader}>
              <div className={styles.detailsPetName}>{selectedBooking.petName} ({selectedBooking.petBreed})</div>
              <div className={styles.detailsService}>{selectedBooking.service}</div>
              <div className={styles.detailsTime}>{selectedBooking.date}, {selectedBooking.time}</div>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsRowIcon}><IconUser /></span>
              <span><b>{selectedBooking.groomer}</b> ({selectedBooking.contact})</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsRowIcon}><IconProducts /></span>
              <span><b>{selectedBooking.amount}</b> to be collected</span>
            </div>
            <span className={styles.advancePaymentLink} onClick={() => { setShowAppointmentDetails(false); setShowAdvancedPaymentModal(true); }}>+ Add Advance Payment</span>
            <div className={styles.modalActionsRow}>
              <button className={styles.btnOutlinePink} onClick={() => setShowAppointmentDetails(false)}>Cancel</button>
              <button className={styles.btnSolidPink} onClick={() => { setShowAppointmentDetails(false); setShowAssignGroomer(true); }}>Assign Groomer</button>
            </div>
            <button className={styles.btnOutlinePink + ' ' + styles.btnFullWidth} onClick={() => alert("Go to invoice")}>Go to Invoice</button>
          </div>
        </div>
      )}

      {/* Assign Groomer Modal */}
      {showAssignGroomer && selectedBooking && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBody}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Assign Groomer</h3>
              <button className={styles.closeBtn} onClick={() => setShowAssignGroomer(false)}><IconClose /></button>
            </div>
            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date</label>
                <input type="text" className={styles.formInput} value={selectedBooking.date} readOnly />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Time</label>
                <select className={styles.formInput}>
                  <option>{selectedBooking.time.split('-')[0].trim()}</option>
                  <option>09:00 AM</option>
                </select>
              </div>
            </div>
            <div className={styles.modalSectionTitle}>Available Groomer(s)</div>
            <div className={styles.radioCardGrid}>
              <label className={`${styles.radioCard} ${styles.radioCardSelected}`}>
                <div className={styles.radioPinkDot}>P</div>
                Dr. Phani
              </label>
              <label className={styles.radioCard}>
                <div className={styles.radioPinkDot}>R</div>
                Ravi
              </label>
            </div>
            <div className={styles.modalActionsRow}>
              <button className={styles.btnOutlinePink} onClick={() => setShowAssignGroomer(false)}>Cancel</button>
              <button className={styles.btnSolidPink} onClick={() => setShowAssignGroomer(false)}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedBooking && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBody}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Do you want to Approve this appointment?</h3>
              <button className={styles.closeBtn} onClick={() => setShowApproveModal(false)}><IconClose /></button>
            </div>
            <p className={styles.modalSubtitle}>Please confirm if you want to <span style={{color: '#e9315d'}}>Approve</span> this appointment? This action will notify the customer and update your records accordingly.</p>
            <div className={styles.modalActionsRow}>
              <button className={styles.btnOutlinePink} onClick={() => setShowApproveModal(false)}>Close</button>
              <button className={styles.btnSolidPink} onClick={() => setShowApproveModal(false)}>Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedBooking && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBody}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Do you want to cancel this appointment?</h3>
              <button className={styles.closeBtn} onClick={() => setShowCancelModal(false)}><IconClose /></button>
            </div>
            <p className={styles.modalSubtitle}>Please confirm if you want to cancel this appointment? This action will notify the customer and update your records accordingly.</p>
            <div className={styles.modalActionsRow}>
              <button className={styles.btnOutlinePink} onClick={() => setShowCancelModal(false)}>Close</button>
              <button className={styles.btnSolidPink} onClick={() => setShowCancelModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedBooking && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBody}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Reschedule Appointment</h3>
              <button className={styles.closeBtn} onClick={() => setShowRescheduleModal(false)}><IconClose /></button>
            </div>
            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date</label>
                <input type="text" className={styles.formInput} defaultValue={selectedBooking.date} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Time</label>
                <select className={styles.formInput}>
                  <option>{selectedBooking.time.split('-')[0].trim()}</option>
                </select>
              </div>
            </div>
            <div className={styles.formGroup} style={{marginBottom: 16}}>
              <label className={styles.formLabel}>Reminder for</label>
              <div><span className={styles.badgePink}><div className={styles.radioPinkDot}>M</div> Mohit</span></div>
            </div>
            <div className={styles.modalSectionTitle}>Available Groomers</div>
            <div className={styles.radioCardGrid}>
              <label className={`${styles.radioCard} ${styles.radioCardSelected}`}>
                <div className={styles.radioPinkDot}>P</div>
                Dr. Phani
              </label>
              <label className={styles.radioCard}>
                <div className={styles.radioPinkDot}>R</div>
                Ravi
              </label>
            </div>
            <div className={styles.modalActionsRow}>
              <button className={styles.btnOutlinePink} onClick={() => setShowRescheduleModal(false)}>Cancel</button>
              <button className={styles.btnSolidPink} onClick={() => setShowRescheduleModal(false)}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Payment Modal */}
      {showAdvancedPaymentModal && selectedBooking && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBody}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Advanced Payment</h3>
              <button className={styles.closeBtn} onClick={() => setShowAdvancedPaymentModal(false)}><IconClose /></button>
            </div>
            <div className={styles.paymentRadioRow}>
              <div className={styles.radioCircleEmpty}></div>
              <span>Full Amount : {selectedBooking.amount}</span>
            </div>
            <div className={styles.paymentRadioRow}>
              <div className={styles.radioCircleFilled}></div>
              <span>Partial Amount</span>
            </div>
            <div className={styles.formGroup} style={{marginBottom: 16}}>
              <label className={styles.formLabel}>Date</label>
              <input type="text" className={styles.formInput} placeholder="₹ Enter amount" />
            </div>
            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Payment date</label>
                <input type="text" className={styles.formInput} defaultValue={selectedBooking.date} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mode of payment</label>
                <select className={styles.formInput}>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>UPI</option>
                </select>
              </div>
            </div>
            <div className={styles.modalActionsRow}>
              <button className={styles.btnOutlinePink} onClick={() => setShowAdvancedPaymentModal(false)}>Cancel</button>
              <button className={styles.btnSolidPink} onClick={() => setShowAdvancedPaymentModal(false)}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Options List rendered with fixed position to stay on screen */}
      {activeMenuId && selectedBooking && (
        <div
          className={styles.threeDotMenuAbsolute}
          style={{
            position: "fixed",
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`
          }}
        >
          {[
            "View Details",
            "Edit",
            "Reschedule",
            "Cancel",
            "Check-In",
            "Check-Out",
            "Print",
            "Assign Groomer",
            "Approve",
            "Update Payment status",
            "Generate Invoice"
          ].map((action) => (
            <button
              key={action}
              className={styles.menuItem}
              onClick={() => handleActionClick(action, selectedBooking)}
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
 * CALENDAR MONTH VIEW
 * ═══════════════════════════════════════════════ */
const CHIP_COLORS = [
  { bg: "#fce8ef", text: "#e9315d", border: "#f7c0d0" },
  { bg: "#fff3cd", text: "#c47f00", border: "#ffe8a1" },
  { bg: "#e8f5e9", text: "#2e7d32", border: "#c8e6c9" },
  { bg: "#e8eaf6", text: "#3949ab", border: "#c5cae9" },
  { bg: "#fce4ec", text: "#c2185b", border: "#f8bbd0" },
];

function getChipColor(idx) {
  return CHIP_COLORS[idx % CHIP_COLORS.length];
}

// Parse "DD MMM YYYY" like "04 MAY 2026" → Date
function parseBookingDate(str) {
  const months = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
  const parts = str.trim().split(" ");
  if (parts.length < 3) return null;
  return new Date(parseInt(parts[2]), months[parts[1].toUpperCase()], parseInt(parts[0]));
}

function CalendarMonthView({ bookings, selectedDate = new Date(), onDayClick }) {
  const today = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  // build grid cells: prev overflow + current + next overflow
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false });
  }

  const bookingsByDay = {};
  bookings.forEach((b, idx) => {
    const d = parseBookingDate(b.date);
    if (d && d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      if (!bookingsByDay[key]) bookingsByDay[key] = [];
      bookingsByDay[key].push({ ...b, _idx: idx });
    }
  });

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className={styles.monthGrid}>
      <div className={styles.monthDayHeaders}>
        {dayNames.map(d => <div key={d} className={styles.monthDayHeader}>{d}</div>)}
      </div>
      <div className={styles.monthCells}>
        {cells.map((cell, ci) => {
          const chips = cell.current ? (bookingsByDay[cell.day] || []) : [];
          const isToday = cell.current && cell.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <div
              key={ci}
              className={`${styles.monthCell} ${!cell.current ? styles.monthCellOtherMonth : ""} ${isToday ? styles.monthCellToday : ""}`}
              onClick={() => {
                if (cell.current && onDayClick) {
                  onDayClick(new Date(year, month, cell.day));
                }
              }}
              style={{ cursor: cell.current ? 'pointer' : 'default' }}
            >
              <div className={styles.monthCellDay}>{cell.day}</div>
              {chips.slice(0, 3).map((b, bi) => {
                const color = getChipColor(b._idx);
                return (
                  <div key={b.id + bi} className={styles.calChip} style={{ background: color.bg, color: color.text, borderLeft: `3px solid ${color.text}` }}>
                    <span className={styles.calChipName}>{b.petName || b.customerName}</span>
                    <span className={styles.calChipType}>{b.type}</span>
                  </div>
                );
              })}
              {chips.length > 3 && <div className={styles.calChipMore}>+{chips.length - 3} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
 * CALENDAR WEEK VIEW
 * ═══════════════════════════════════════════════ */
const HOURS = [
  "All Day", "01 AM", "02 AM", "03 AM", "04 AM", "05 AM", "06 AM", "07 AM", "08 AM", "09 AM", "10 AM", "11 AM",
  "12 PM", "01 PM", "02 PM", "03 PM", "04 PM", "05 PM", "06 PM", "07 PM", "08 PM", "09 PM", "10 PM", "11 PM", "12 AM"
];

// Static week events matching the screenshot
const WEEK_EVENTS = [
  { day: 1, hour: 7, petName: "Phani", type: "In house Grooming", colorIdx: 0 },
  { day: 6, hour: 7, petName: "Phani", type: "In house Grooming", colorIdx: 1 },
  { day: 3, hour: 13, petName: "Phani", type: "In house Grooming", colorIdx: 2 },
  { day: 4, hour: 16, petName: "Phani", type: "In house Grooming", colorIdx: 3 },
  { day: 1, hour: 19, petName: "Phani", type: "In house Grooming", colorIdx: 4 },
  { day: 3, hour: 21, petName: "Phani", type: "In house Grooming", colorIdx: 0 },
];

function CalendarWeekView({ bookings }) {
  const today = new Date();
  // get start of week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className={styles.weekView}>
      {/* Header */}
      <div className={styles.weekHeader}>
        <div className={styles.weekTimeGutter} />
        {days.map((d, i) => (
          <div key={i} className={`${styles.weekDayHeader} ${d.toDateString() === today.toDateString() ? styles.weekDayHeaderToday : ""}`}>
            <div className={styles.weekDayNum}>{String(d.getDate()).padStart(2, "0")}</div>
            <div className={styles.weekDayName}>{dayLabels[i]}</div>
          </div>
        ))}
      </div>
      {/* Rows */}
      <div className={styles.weekBody}>
        {HOURS.map((h, hi) => (
          <div key={hi} className={styles.weekRow}>
            <div className={styles.weekTimeLabel}>{h}</div>
            {days.map((d, di) => {
              const events = WEEK_EVENTS.filter(e => e.day === di && e.hour === hi);
              return (
                <div key={di} className={styles.weekCell}>
                  {events.map((ev, ei) => {
                    const color = getChipColor(ev.colorIdx);
                    return (
                      <div key={ei} className={styles.calChip} style={{ background: color.bg, color: color.text, borderLeft: `3px solid ${color.text}` }}>
                        <span className={styles.calChipName}>{ev.petName}</span>
                        <span className={styles.calChipType}>{ev.type}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
 * CALENDAR DAY VIEW
 * ═══════════════════════════════════════════════ */
const GROOMERS = ["Groomer 0", "Groomer 1", "Groomer 2", "Groomer 3", "Groomer 4"];

const DAY_EVENTS = [
  { groomer: 0, hour: 1, petName: "Phani", type: "In house Grooming", colorIdx: 4 },
  { groomer: 0, hour: 3, petName: "Phani", type: "In house Grooming", colorIdx: 3 },
  { groomer: 1, hour: 5, petName: "Phani", type: "In house Grooming", colorIdx: 2 },
  { groomer: 0, hour: 7, petName: "Phani", type: "In house Grooming", colorIdx: 1 },
  { groomer: 2, hour: 3, petName: "Phani", type: "In house Grooming", colorIdx: 0 },
  { groomer: 3, hour: 5, petName: "Phani", type: "In house Grooming", colorIdx: 2 },
  { groomer: 3, hour: 1, petName: "Phani", type: "In house Grooming", colorIdx: 3 },
  { groomer: 1, hour: 11, petName: "Phani", type: "In house Grooming", colorIdx: 4 },
  { groomer: 4, hour: 11, petName: "Phani", type: "In house Grooming ng", colorIdx: 0 },
  { groomer: 0, hour: 13, petName: "Phani", type: "In house Grooming", colorIdx: 1 },
  { groomer: 3, hour: 22, petName: "Phani", type: "In house Grooming", colorIdx: 2 },
];

function CalendarDayView({ bookings }) {
  const today = new Date();

  return (
    <div className={styles.weekView}>
      {/* Header */}
      <div className={styles.weekHeader}>
        <div className={styles.weekTimeGutter} />
        {GROOMERS.map((g, i) => (
          <div key={i} className={styles.weekDayHeader}>
            <div className={styles.weekDayName} style={{ fontWeight: 600 }}>{g}</div>
          </div>
        ))}
      </div>
      {/* Rows */}
      <div className={styles.weekBody}>
        {HOURS.map((h, hi) => (
          <div key={hi} className={styles.weekRow}>
            <div className={styles.weekTimeLabel}>{h}</div>
            {GROOMERS.map((g, gi) => {
              const events = DAY_EVENTS.filter(e => e.groomer === gi && e.hour === hi);
              return (
                <div key={gi} className={styles.weekCell}>
                  {events.map((ev, ei) => {
                    const color = getChipColor(ev.colorIdx);
                    return (
                      <div key={ei} className={styles.calChip} style={{ background: color.bg, color: color.text, borderLeft: `3px solid ${color.text}` }}>
                        <span className={styles.calChipName}>{ev.petName}</span>
                        <span className={styles.calChipType}>{ev.type}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

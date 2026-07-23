import React, { useState, useRef, useEffect } from "react";
import styles from "../../styles/grooming/bookingsList.module.css";
import useStore from "../state/useStore";
import { VENDOR_API_URL } from "../utilities/Constants";

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

export default function BookingsList({ onViewDetails, onEdit, serviceType = "Grooming" }) {
  const { jwtToken, selectedBranchId, userInfo } = useStore();
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("Select Branch");

  const [branchStaff, setBranchStaff] = useState([]);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleGroomerId, setRescheduleGroomerId] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleSlotId, setRescheduleSlotId] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);

  const transformBookingsData = (rawBookings, currentServices = [], targetServiceType = "Grooming") => {
    if (!Array.isArray(rawBookings)) return [];
    return rawBookings.map(b => {
      const isDaycareType = targetServiceType === "Day Care" || (Array.isArray(b.serviceType) && b.serviceType.includes("Day Care"));
      
      const dcApp = b.daycareAppointments?.[0] || {};
      const dcDateObj = dcApp.dates?.[0] || {};
      
      const appointment = b.appointments?.[0] || {};
      const groomerObj = appointment.groomer || {};
      const customerObj = b.customer || {};

      let rawAppointmentDate = isDaycareType ? (dcDateObj.date || appointment.appointmentDate) : appointment.appointmentDate;

      let formattedDate = "";
      if (rawAppointmentDate) {
        const d = new Date(rawAppointmentDate);
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        formattedDate = `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }

      const formatTime = (timeStr) => {
        if (!timeStr) return "";
        const [h, m] = timeStr.split(':');
        const hours = parseInt(h);
        const displayH = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${String(displayH).padStart(2, '0')}:${m} ${ampm}`;
      };

      const checkInTimeRaw = dcDateObj.checkInTime || appointment.startTime || "09:00:00";
      const checkOutTimeRaw = dcDateObj.checkOutTime || appointment.endTime || "18:00:00";

      const formatDateTimeShort = (dateStr, timeStr) => {
        if (!dateStr) return "----";
        const d = new Date(dateStr);
        const monthShorts = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthShorts[d.getMonth()];
        const day = String(d.getDate()).padStart(2, '0');
        const [h, m] = (timeStr || "00:00").split(':');
        return `${month} ${day}, ${h}:${m}`;
      };

      const checkInFormatted = formatDateTimeShort(rawAppointmentDate, checkInTimeRaw);
      const checkOutFormatted = formatDateTimeShort(rawAppointmentDate, checkOutTimeRaw);

      let petNamesList = [];
      if (isDaycareType && dcApp.pets && Array.isArray(dcApp.pets)) {
        petNamesList = dcApp.pets.map(p => p.petProfile?.petName || p.petName).filter(Boolean);
      }
      if (petNamesList.length === 0 && b.appointments && Array.isArray(b.appointments)) {
        b.appointments.forEach(app => {
          if (app.pets && Array.isArray(app.pets)) {
            app.pets.forEach(p => {
              const name = p.petProfile?.petName || p.petName;
              if (name && !petNamesList.includes(name)) petNamesList.push(name);
            });
          }
        });
      }
      const petNameDisplay = petNamesList.length > 0 ? petNamesList.join(", ") : (appointment.pets?.[0]?.petName || "----");

      const petObj = appointment.pets?.[0] || {};
      const petProfile = petObj.petProfile || {};
      const petBreed = petProfile.breed || petObj.breed || "----";

      const servicesList = [];
      if (b.appointments && Array.isArray(b.appointments)) {
        b.appointments.forEach(app => {
          if (app.pets && Array.isArray(app.pets)) {
            app.pets.forEach(pet => {
              if (pet.services && Array.isArray(pet.services)) {
                pet.services.forEach(srv => {
                  if (srv.serviceNames && Array.isArray(srv.serviceNames) && srv.serviceNames.length > 0) {
                    srv.serviceNames.forEach(name => {
                      if (name && !servicesList.includes(name)) servicesList.push(name);
                    });
                  } else if (srv.selectedServices && Array.isArray(srv.selectedServices)) {
                    srv.selectedServices.forEach(sId => {
                      const listToUse = currentServices.length > 0 ? currentServices : availableServices;
                      const found = listToUse.find(s => s.id === sId);
                      const name = found ? (Array.isArray(found.serviceName) ? found.serviceName[0] : found.serviceName) : null;
                      if (name && !servicesList.includes(name)) servicesList.push(name);
                    });
                  }
                });
              }
            });
          }
        });
      }

      const startHour = checkInTimeRaw ? parseInt(checkInTimeRaw.split(':')[0]) : 9;

      return {
        id: `BK-${String(b.bookingID).padStart(4, '0')}`,
        rawId: b.bookingID,
        appointmentId: dcApp.appointmentID || appointment.appointmentID,
        date: formattedDate || "----",
        time: `${formatTime(checkInTimeRaw)} - ${formatTime(checkOutTimeRaw)}`,
        checkIn: checkInFormatted,
        checkOut: checkOutFormatted,
        bookingStatus: b.bookingStatus || b.status || "",
        status: (b.bookingStatus || b.status || "Pending").replace(/_/g, ' ').toUpperCase(),
        customerName: ((customerObj.firstName || "") + " " + (customerObj.lastName || "")).trim() || "----",
        contact: customerObj.phoneNumber ? `+91 ${customerObj.phoneNumber}` : "----",
        petName: petNameDisplay,
        petBreed,
        service: isDaycareType ? "Daycare" : (Array.isArray(b.serviceType) ? b.serviceType.join(", ") : (b.serviceType || "Grooming")),
        hasExtraService: b.isMultiPet || false,
        groomer: groomerObj.firstName ? ((groomerObj.firstName || "") + " " + (groomerObj.lastName || "")).trim() : "Unassigned",
        groomerId: appointment.groomerID || groomerObj.groomerID || groomerObj.userId,
        rawDate: rawAppointmentDate,
        slotId: appointment.slotId || appointment.slotID,
        startTime: checkInTimeRaw,
        endTime: checkOutTimeRaw,
        amount: `₹ ${Math.round(parseFloat(b.totalAmount || 0))}`,
        paymentStatus: b.paymentStatus || "Unpaid",
        serviceStatus: dcApp.status || appointment.status || "----",
        servicesList,
        startHour,
        createdOn: b.createdAt ? new Date(b.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '') : "----",
        type: b.bookingMode === "AtStore" ? "In Store" : "Online"
      };
    });
  };

  useEffect(() => {
    const activeBranchId = selectedBranchId || userInfo?.branchId || (Array.isArray(userInfo?.branchIds) ? userInfo.branchIds[0] : null) || 90;
    if (activeBranchId) {
      // First fetch offerings (services list) to allow ID-to-name mapping
      fetch(`${VENDOR_API_URL}vendor/grooming-booking/offerings/${activeBranchId}?type=services`, {
        headers: {
          "Authorization": `Bearer ${jwtToken}`
        }
      })
        .then(res => res.json())
        .then(offRes => {
          const services = offRes.status === "success" && offRes.data?.services ? offRes.data.services : [];
          setAvailableServices(services);
          
          const apiServiceType = (serviceType === "Day Care" || serviceType === "Daycare") ? "Day Care" : "Grooming";
          // Then fetch bookings for specified serviceType
          return fetch(`${VENDOR_API_URL}vendor/grooming-booking/bookings?branchId=${activeBranchId}&serviceType=${encodeURIComponent(apiServiceType)}`, {
            headers: {
              "Authorization": `Bearer ${jwtToken}`
            }
          })
            .then(res => res.json())
            .then(data => {
              if (data.status === "success" && data.data) {
                setBookings(transformBookingsData(data.data, services, serviceType));
              }
            });
        })
        .catch(err => console.error("Error fetching bookings/offerings:", err));
    }
  }, [selectedBranchId, userInfo, jwtToken, serviceType]);

  useEffect(() => {
    if (selectedBranchId && jwtToken) {
      fetch(`${VENDOR_API_URL}vendor-users/branch-staff?branchId=${selectedBranchId}`, {
        headers: {
          "Authorization": `Bearer ${jwtToken}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === "success" && data.data) {
            const groomers = data.data.filter(s => s.role?.toLowerCase() === 'groomer');
            setBranchStaff(groomers);
          }
        })
        .catch(err => console.error("Error fetching branch staff:", err));
    }
  }, [selectedBranchId, jwtToken]);

  useEffect(() => {
    if (rescheduleDate && rescheduleGroomerId && selectedBranchId && jwtToken) {
      setLoadingSlots(true);
      fetch(`${VENDOR_API_URL}vendor/grooming-booking/slots/branch/${selectedBranchId}?date=${rescheduleDate}&groomerID=${rescheduleGroomerId}`, {
        headers: {
          "Authorization": `Bearer ${jwtToken}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === "success" && data.data) {
            setRescheduleSlots(Array.isArray(data.data) ? data.data : (data.data.slots || []));
          } else {
            setRescheduleSlots([]);
          }
          setLoadingSlots(false);
        })
        .catch(err => {
          console.error("Error fetching reschedule slots:", err);
          setRescheduleSlots([]);
          setLoadingSlots(false);
        });
    } else {
      setRescheduleSlots([]);
    }
  }, [rescheduleDate, rescheduleGroomerId, selectedBranchId, jwtToken]);

  useEffect(() => {
    if (rescheduleDate && rescheduleGroomerId && branchStaff.length > 0) {
      const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const [year, month, day] = rescheduleDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayName = daysOfWeek[dateObj.getDay()];
      
      const currentGroomer = branchStaff.find(staff => String(staff.userId) === String(rescheduleGroomerId));
      if (currentGroomer && currentGroomer.weekOffDay) {
        const offDays = currentGroomer.weekOffDay.split(',').map(d => d.trim().toUpperCase());
        if (offDays.includes(dayName)) {
          setRescheduleGroomerId("");
        }
      }
    }
  }, [rescheduleDate, rescheduleGroomerId, branchStaff]);

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  let selectedDayName = "";
  if (rescheduleDate) {
    const [year, month, day] = rescheduleDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    selectedDayName = daysOfWeek[dateObj.getDay()];
  }

  const availableRescheduleGroomers = branchStaff.filter(staff => {
    if (selectedDayName && staff.weekOffDay) {
      const offDays = staff.weekOffDay.split(',').map(d => d.trim().toUpperCase());
      if (offDays.includes(selectedDayName)) {
        return false;
      }
    }
    return true;
  });

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

  // Services Popup
  const [activeServicesPopupId, setActiveServicesPopupId] = useState(null);
  const [servicesPopupPosition, setServicesPopupPosition] = useState({ top: 0, left: 0 });

  const handlePlusClick = (e, booking) => {
    e.stopPropagation();
    if (activeServicesPopupId === booking.id) {
      setActiveServicesPopupId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const popupHeight = 150; // approximate height
      const viewportHeight = window.innerHeight;

      // Check if popup would go below the visible screen
      const openUpward = (rect.bottom + popupHeight) > viewportHeight;

      setServicesPopupPosition({
        top: openUpward ? (rect.top - popupHeight - 8) : (rect.bottom + 4),
        left: rect.left - 100 // adjust left to center/align
      });
      setSelectedBooking(booking);
      setActiveServicesPopupId(booking.id);
    }
  };

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
  const [cancellationReason, setCancellationReason] = useState("Customer requested cancellation via phone");
  const [approveReason, setApproveReason] = useState("Approved by manager");
  const [checkoutNotes, setCheckoutNotes] = useState("Grooming done, pet was happy.");

  const handleCancelBooking = async () => {
    try {
      const bookingId = selectedBooking.rawId || selectedBooking.id;
      const userId = userInfo?.id || userInfo?._id || userInfo?.userId || userInfo?.vendorId;

      const response = await fetch(`${VENDOR_API_URL}vendor/grooming-booking/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          cancellationReason: cancellationReason,
          cancelledBy: userId
        })
      });

      const resData = await response.json();
      if (resData.status === "success") {
        if (selectedBranchId) {
          const fetchUrl = `${VENDOR_API_URL}vendor/grooming-booking/bookings?branchId=${selectedBranchId}`;
          const listRes = await fetch(fetchUrl, {
            headers: {
              "Authorization": `Bearer ${jwtToken}`
            }
          });
          const listData = await listRes.json();
          if (listData.status === "success" && listData.data) {
            setBookings(transformBookingsData(listData.data));
          }
        }
        setShowCancelModal(false);
      } else {
        alert(resData.message || "Failed to cancel the booking.");
      }
    } catch (err) {
      console.error("Error canceling booking:", err);
      alert("Error canceling booking. Please try again.");
    }
  };

  const handleApproveBooking = async () => {
    try {
      const bookingId = selectedBooking.rawId || selectedBooking.id;
      const userId = userInfo?.id || userInfo?._id || userInfo?.userId || userInfo?.vendorId;

      const response = await fetch(`${VENDOR_API_URL}vendor/grooming-booking/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          status: "Confirmed",
          reason: approveReason,
          changedBy: userId
        })
      });

      const resData = await response.json();
      if (resData.status === "success") {
        if (selectedBranchId) {
          const fetchUrl = `${VENDOR_API_URL}vendor/grooming-booking/bookings?branchId=${selectedBranchId}`;
          const listRes = await fetch(fetchUrl, {
            headers: {
              "Authorization": `Bearer ${jwtToken}`
            }
          });
          const listData = await listRes.json();
          if (listData.status === "success" && listData.data) {
            setBookings(transformBookingsData(listData.data));
          }
        }
        setShowApproveModal(false);
      } else {
        alert(resData.message || "Failed to approve the booking.");
      }
    } catch (err) {
      console.error("Error approving booking:", err);
      alert("Error approving booking. Please try again.");
    }
  };

  const handleCheckInBooking = async () => {
    try {
      const appointmentId = selectedBooking?.appointmentId;
      if (!appointmentId) {
        alert("Appointment ID not found.");
        return;
      }
      const userId = userInfo?.id || userInfo?._id || userInfo?.userId || userInfo?.vendorId || 1;
      
      const response = await fetch(`${VENDOR_API_URL}vendor/grooming-booking/appointments/${appointmentId}/checkin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          checkinBy: userId
        })
      });
      
      const resData = await response.json();
      if (resData.status === "success") {
        if (selectedBranchId) {
          const fetchUrl = `${VENDOR_API_URL}vendor/grooming-booking/bookings?branchId=${selectedBranchId}`;
          const listRes = await fetch(fetchUrl, {
            headers: {
              "Authorization": `Bearer ${jwtToken}`
            }
          });
          const listData = await listRes.json();
          if (listData.status === "success" && listData.data) {
            setBookings(transformBookingsData(listData.data));
          }
        }
        setShowCheckInModal(false);
      } else {
        alert(resData.message || "Failed to check-in appointment.");
      }
    } catch (err) {
      console.error("Error checking in booking:", err);
      alert("Error checking in booking. Please try again.");
    }
  };

  const handleCheckOutBooking = async () => {
    try {
      const appointmentId = selectedBooking?.appointmentId;
      if (!appointmentId) {
        alert("Appointment ID not found.");
        return;
      }
      const userId = userInfo?.id || userInfo?._id || userInfo?.userId || userInfo?.vendorId || 1;
      
      const response = await fetch(`${VENDOR_API_URL}vendor/grooming-booking/appointments/${appointmentId}/checkout`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          checkoutBy: userId,
          completionNotes: checkoutNotes
        })
      });
      
      const resData = await response.json();
      if (resData.status === "success") {
        if (selectedBranchId) {
          const fetchUrl = `${VENDOR_API_URL}vendor/grooming-booking/bookings?branchId=${selectedBranchId}`;
          const listRes = await fetch(fetchUrl, {
            headers: {
              "Authorization": `Bearer ${jwtToken}`
            }
          });
          const listData = await listRes.json();
          if (listData.status === "success" && listData.data) {
            setBookings(transformBookingsData(listData.data));
          }
        }
        setShowCheckOutModal(false);
      } else {
        alert(resData.message || "Failed to check-out appointment.");
      }
    } catch (err) {
      console.error("Error checking out booking:", err);
      alert("Error checking out booking. Please try again.");
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleDate) {
      alert("Date is a required field.");
      return;
    }
    if (!rescheduleSlotId) {
      alert("Time Slot is a required field.");
      return;
    }
    try {
      const bookingId = selectedBooking.rawId || selectedBooking.id;
      
      const getRes = await fetch(`${VENDOR_API_URL}vendor/grooming-booking/bookings/${bookingId}`, {
        headers: {
          "Authorization": `Bearer ${jwtToken}`
        }
      });
      const getData = await getRes.json();
      if (getData.status !== "success" || !getData.data) {
        alert("Failed to fetch booking details for rescheduling.");
        return;
      }
      
      const fullBooking = getData.data;
      
      const payload = {
        notes: fullBooking.notes || "",
        subTotal: parseFloat(fullBooking.subTotal) || 0,
        discountAmount: parseFloat(fullBooking.discountAmount) || 0,
        taxAmount: parseFloat(fullBooking.taxAmount) || 0,
        totalAmount: parseFloat(fullBooking.totalAmount) || 0,
        paidAmount: parseFloat(fullBooking.paidAmount) || 0,
        dueAmount: parseFloat(fullBooking.dueAmount) || 0,
        paymentStatus: fullBooking.paymentStatus || "Unpaid",
        appointment: {
          slotId: rescheduleSlotId ? parseInt(rescheduleSlotId) : fullBooking.appointments?.[0]?.slotId,
          groomerID: parseInt(rescheduleGroomerId),
          appointmentDate: rescheduleDate,
          startTime: rescheduleTime || fullBooking.appointments?.[0]?.startTime,
          endTime: rescheduleEndTime || fullBooking.appointments?.[0]?.endTime,
          agreementType: "None"
        },
        pets: (fullBooking.appointments?.[0]?.pets || fullBooking.pets || []).map((pet, idx) => {
          const petServices = pet.services?.selectedServices || (pet.services?.[0]?.selectedServices || []);
          const petBasePrice = parseFloat(pet.services?.price || (pet.services?.[0]?.price || 0));
          return {
            customerPetId: pet.customerPetId || pet.petId || pet.id,
            groomerID: parseInt(rescheduleGroomerId),
            slotId: rescheduleSlotId ? parseInt(rescheduleSlotId) : fullBooking.appointments?.[0]?.slotId,
            petConditionNotes: pet.petConditionNotes || "None",
            durationMinutes: pet.durationMinutes || 60,
            bufferMinutes: pet.bufferMinutes || 0,
            sequenceOrder: pet.sequenceOrder || idx + 1,
            petStatus: pet.petStatus || "Waiting",
            services: {
              serviceType: pet.services?.serviceType || (pet.services?.[0]?.serviceType || "Individual"),
              selectedServices: petServices,
              selectedPackage: pet.services?.selectedPackage || (pet.services?.[0]?.selectedPackage || null),
              selectedSubscription: null,
              addOns: [],
              basePrice: petBasePrice,
              discountAmount: 0,
              price: petBasePrice
            }
          };
        })
      };
      
      const putRes = await fetch(`${VENDOR_API_URL}vendor/grooming-booking/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify(payload)
      });
      
      const putData = await putRes.json();
      if (putData.status === "success") {
        if (selectedBranchId) {
          const fetchUrl = `${VENDOR_API_URL}vendor/grooming-booking/bookings?branchId=${selectedBranchId}`;
          const listRes = await fetch(fetchUrl, {
            headers: {
              "Authorization": `Bearer ${jwtToken}`
            }
          });
          const listData = await listRes.json();
          if (listData.status === "success" && listData.data) {
            setBookings(transformBookingsData(listData.data));
          }
        }
        setShowRescheduleModal(false);
      } else {
        alert(putData.message || "Failed to reschedule booking.");
      }
    } catch (err) {
      console.error("Error rescheduling booking:", err);
      alert("Error rescheduling booking. Please try again.");
    }
  };

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
      if (!event.target.closest(`.${styles.serviceWrapper}`) && !event.target.closest(`.${styles.servicesPopupAbsolute}`)) {
        setActiveServicesPopupId(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const isAnyModalOpen =
      showCheckInModal ||
      showCheckOutModal ||
      showAppointmentDetails ||
      showAssignGroomer ||
      showApproveModal ||
      showCancelModal ||
      showRescheduleModal ||
      showAdvancedPaymentModal;

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [
    showCheckInModal,
    showCheckOutModal,
    showAppointmentDetails,
    showAssignGroomer,
    showApproveModal,
    showCancelModal,
    showRescheduleModal,
    showAdvancedPaymentModal
  ]);

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
      setCheckoutNotes("Grooming done, pet was happy.");
      setShowCheckOutModal(true);
    } else if (action === "Assign Groomer") {
      setShowAppointmentDetails(true);
    } else if (action === "Approve") {
      setApproveReason("Approved by manager");
      setShowApproveModal(true);
    } else if (action === "Cancel") {
      setCancellationReason("Customer requested cancellation via phone");
      setShowCancelModal(true);
    } else if (action === "Reschedule") {
      setRescheduleDate(booking.rawDate || "");
      setRescheduleGroomerId(booking.groomerId || "");
      setRescheduleSlotId("");
      setRescheduleTime("");
      setRescheduleEndTime("");
      setRescheduleSlots([]);
      setShowRescheduleModal(true);
    } else if (action === "Update Payment status") {
      setShowAdvancedPaymentModal(true);
    } else if (action === "View Details") {
      if (onViewDetails) onViewDetails(booking);
    } else if (action === "Edit") {
      if (onEdit) onEdit(booking);
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
              isDaycare={serviceType === "Day Care"}
            />
          )}
        </div>
      )}

      {/* Bookings Table with scrollable and sticky action column */}
      {viewMode === "Table" && (
        <div className={styles.tableWrapper}>
          <div className={styles.tableInner}>
            <table className={styles.bookingsTable}>
              {serviceType === "Day Care" ? (
                <thead>
                  <tr>
                    <th className={styles.colBookingId}>BOOKING ID</th>
                    <th className={styles.colPet}>Pet Name</th>
                    <th className={styles.colCustomer}>Owner</th>
                    <th className={styles.colService}>Service</th>
                    <th className={styles.colDate}>Check-In</th>
                    <th className={styles.colDate}>Check-Out</th>
                    <th className={styles.colStatus}>Status</th>
                    <th className={`${styles.stickyActionsHeader} ${styles.colStickyActions}`}>ACTIONS</th>
                  </tr>
                </thead>
              ) : (
                <thead>
                  <tr>
                    <th className={styles.colBookingId}>Booking ID</th>
                    <th className={styles.colDate}>Date</th>
                    <th className={styles.colTime}>Time</th>
                    <th className={styles.colStatus}>Status</th>
                    <th className={styles.colCustomer}>Customer Name</th>
                    <th className={styles.colContact}>Contact</th>
                    <th className={styles.colPet}>Pet</th>
                    <th className={styles.colService}>Services</th>
                    <th className={styles.colGroomer}>Groomer</th>
                    <th className={styles.colAmount}>Amount</th>
                    <th className={styles.colPaymentStatus}>Payment Status</th>
                    <th className={styles.colCreatedOn}>Created On</th>
                    <th className={`${styles.stickyActionsHeader} ${styles.colStickyActions}`}>Actions</th>
                  </tr>
                </thead>
              )}
              <tbody>
                {filteredBookings.map((b, idx) => (
                  serviceType === "Day Care" ? (
                    <tr key={b.id} className={activeMenuId === b.id ? styles.activeRow : ""}>
                      <td className={styles.idCell} style={{ fontWeight: 600 }}>{b.id}</td>
                      <td className={styles.petName} style={{ fontWeight: 600 }}>{b.petName}</td>
                      <td className={styles.customerName} style={{ fontWeight: 600 }}>{b.customerName}</td>
                      <td><span className={styles.serviceBadgePink}>{b.service}</span></td>
                      <td>{b.checkIn}</td>
                      <td>{b.checkOut}</td>
                      <td>
                        {(() => {
                          const s = (b.status || "").toUpperCase();
                          if (s.includes("CHECKED") || s.includes("CHECK-IN")) {
                            return <span className={styles.statusPillCheckedIn}>Checked-IN</span>;
                          }
                          if (s.includes("CONFIRM") || s === "UPCOMING" || s === "TODAY" || s === "BOOKED") {
                            return <span className={styles.statusPillConfirmed}>Confirmed</span>;
                          }
                          if (s.includes("COMPLETE")) {
                            return <span className={styles.statusPillCompleted}>Completed</span>;
                          }
                          if (s.includes("CANCEL")) {
                            return <span className={styles.statusPillCancel}>Cancel</span>;
                          }
                          return <span className={styles.statusPillConfirmed}>{b.status}</span>;
                        })()}
                      </td>
                      <td className={`${styles.stickyActionsCell} ${activeMenuId === b.id ? styles.activeActionsCell : ""}`}>
                        <div className={styles.actionsCell} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button className={styles.actionIconBtn} onClick={() => onEdit(b)} title="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                          </button>
                          <button className={styles.actionIconBtn} onClick={() => handleActionClick("View Details", b)} title="View">
                            <IconEye />
                          </button>
                          <button className={styles.threeDotBtn} onClick={(e) => handleThreeDotClick(e, b)} title="More">
                            <IconThreeDots />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={b.id}
                      className={activeMenuId === b.id ? styles.activeRow : ""}
                    >
                      <td className={styles.idCell}>{b.id}</td>
                      <td className={styles.dateCell}>{b.date}</td>
                      <td className={styles.timeCell}>{b.time}</td>
                      <td>
                        <span
                          className={(() => {
                            const s = (b.status || "").toUpperCase();
                            if (s === "TODAY") return styles.statusToday;
                            if (s === "RESCHEDULED" || s === "RESCHEDULE") return styles.statusRescheduled;
                            if (s === "CANCELED" || s === "CANCELLED") return styles.statusCanceled;
                            if (s === "COMPLETED") return styles.statusCompleted;
                            if (s === "ONGOING" || s === "IN PROGRESS" || s === "IN_PROGRESS") return styles.statusOngoing;
                            if (s === "UNASSIGNED") return styles.statusUnassigned;
                            return styles.statusUpcoming;
                          })()}
                        >
                          {b.status}
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
                          {b.servicesList && b.servicesList.length > 0 ? (
                            <>
                              <span className={styles.serviceBadgePink}>{b.servicesList[0]}</span>
                              {b.servicesList.length > 1 && (
                                <span
                                  className={styles.extraServiceCountBadge}
                                  onClick={(e) => handlePlusClick(e, b)}
                                >
                                  +{b.servicesList.length - 1}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className={styles.serviceBadgePink}>{b.service || "----"}</span>
                          )}
                        </div>
                      </td>
                      <td className={styles.groomerCell}>{b.groomer}</td>
                      <td className={styles.amountCell}>{b.amount}</td>
                      <td className={getPaymentStatusClass(b.paymentStatus)}>{b.paymentStatus}</td>
                      <td className={styles.createdOnCell}>{b.createdOn}</td>
                      <td className={`${styles.stickyActionsCell} ${activeMenuId === b.id ? styles.activeActionsCell : ""}`}>
                        <div className={styles.actionsCell}>
                          {/* Call */}
                          <button className={styles.actionIconBtn} onClick={() => alert(`Calling ${b.customerName}...`)}>
                            <IconPhone />
                          </button>
                          {/* Eye */}
                          <button className={styles.actionIconBtn} onClick={() => handleActionClick("View Details", b)}>
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
                  )
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
                alt="Avatar"
                className={styles.profileAvatar}
              />
              <div className={styles.profileDetails}>
                <span className={styles.profileName}>{selectedBooking.customerName}</span>
                <span className={styles.profileSubtitle}>
                  🐾 {selectedBooking.type}: {selectedBooking.petName} ({selectedBooking.petBreed})
                </span>
              </div>
            </div>

            <div className={styles.inputsGrid}>
              <div className={styles.modalField}>
                <div className={styles.fieldVal}>{selectedBooking.date}</div>
                <div className={styles.fieldLabel}>{selectedBooking.time}</div>
              </div>
              <div className={styles.modalField}>
                <div className={styles.fieldVal}>{selectedBooking.groomer}</div>
                <div className={styles.fieldLabel}>Assigned Groomer</div>
              </div>
              <div className={`${styles.modalField} ${styles.modalFieldActive}`}>
                <div className={styles.fieldVal}>{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div className={styles.fieldLabel}>Check-IN Date</div>
              </div>
              <div className={`${styles.modalField} ${styles.modalFieldActive}`}>
                <div className={styles.fieldVal}>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).replace(' ', '')}</div>
                <div className={styles.fieldLabel}>Check-IN Time</div>
              </div>
            </div>

            <button
              className={styles.modalConfirmBtn}
              onClick={handleCheckInBooking}
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
                <div className={styles.customerName}>{selectedBooking.petName} ({selectedBooking.petBreed})</div>
                <div className={styles.customerPhone}>{selectedBooking.customerName} : ({selectedBooking.contact})</div>
              </div>
            </div>

            <div className={styles.inputsGrid}>
              <div className={styles.modalField}>
                <div className={styles.fieldVal}>{selectedBooking.date}</div>
                <div className={styles.fieldLabel}>{selectedBooking.time}</div>
              </div>
              <div className={styles.modalField}>
                <div className={styles.fieldVal}>{selectedBooking.groomer}</div>
                <div className={styles.fieldLabel}>Assigned Groomer</div>
              </div>
              <div className={`${styles.modalField} ${styles.modalFieldActive}`}>
                <div className={styles.fieldVal}>{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div className={styles.fieldLabel}>Check-Out Date</div>
              </div>
              <div className={`${styles.modalField} ${styles.modalFieldActive}`}>
                <div className={styles.fieldVal}>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).replace(' ', '')}</div>
                <div className={styles.fieldLabel}>Check-Out Time</div>
              </div>
            </div>

            <div className={styles.notesContainer}>
              <label className={styles.notesLabel}>Completion Notes</label>
              <textarea
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder="Enter completion notes..."
                className={styles.notesTextarea}
              />
            </div>

            <button
              className={styles.modalConfirmBtn}
              onClick={handleCheckOutBooking}
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
            <p className={styles.modalSubtitle}>Please confirm if you want to <span style={{ color: '#e9315d' }}>Approve</span> this appointment? This action will notify the customer and update your records accordingly.</p>
            
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Approval Reason</label>
              <textarea
                value={approveReason}
                onChange={(e) => setApproveReason(e.target.value)}
                placeholder="Enter approval reason..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div className={styles.modalActionsRow}>
              <button className={styles.btnOutlinePink} onClick={() => setShowApproveModal(false)}>Close</button>
              <button className={styles.btnSolidPink} onClick={handleApproveBooking}>Approve</button>
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

            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Cancellation Reason</label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div className={styles.modalActionsRow}>
              <button className={styles.btnOutlinePink} onClick={() => setShowCancelModal(false)}>Close</button>
              <button className={styles.btnSolidPink} onClick={handleCancelBooking}>Cancel</button>
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
                <label className={styles.formLabel}>Date <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="date" 
                  className={styles.formInput} 
                  value={rescheduleDate} 
                  required
                  min={(() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  })()}
                  onChange={(e) => {
                    const val = e.target.value;
                    const todayStr = (() => {
                      const d = new Date();
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    })();
                    if (val && val < todayStr) {
                      toast.error("Past dates are not allowed for appointment date");
                      return;
                    }
                    setRescheduleDate(val);
                  }} 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Time <span style={{ color: 'red' }}>*</span></label>
                <select 
                  className={styles.formInput}
                  value={rescheduleSlotId}
                  required
                  onChange={(e) => {
                    const slotId = e.target.value;
                    setRescheduleSlotId(slotId);
                    const slot = rescheduleSlots.find(s => String(s.slotID) === String(slotId));
                    if (slot) {
                      setRescheduleTime(slot.startTime);
                      setRescheduleEndTime(slot.endTime);
                    } else {
                      setRescheduleTime("");
                      setRescheduleEndTime("");
                    }
                  }}
                >
                  {loadingSlots ? (
                    <option value="">Loading slots...</option>
                  ) : (
                    <>
                      <option value="">Select Time Slot</option>
                      {rescheduleSlots
                        .filter(slot => slot.status !== 'Full')
                        .map(slot => {
                          const [h, m] = slot.startTime.split(':');
                          const isPM = parseInt(h) >= 12;
                          const displayH = (parseInt(h) % 12) || 12;
                          const formattedTime = `${String(displayH).padStart(2, '0')}:${m} ${isPM ? 'PM' : 'AM'}`;
                          return (
                            <option key={slot.slotID} value={slot.slotID}>
                              {formattedTime}
                            </option>
                          );
                        })}
                    </>
                  )}
                </select>
              </div>
            </div>
            <div className={styles.formGroup} style={{ marginBottom: 16 }}>
              <label className={styles.formLabel}>Reminder for</label>
              <div>
                <span className={styles.badgePink}>
                  <div className={styles.radioPinkDot}>
                    {(selectedBooking.groomer || "U")[0].toUpperCase()}
                  </div>{" "}
                  {selectedBooking.groomer || "Unassigned"}
                </span>
              </div>
            </div>
            <div className={styles.modalSectionTitle}>Available Groomers</div>
            <div className={styles.radioCardGrid}>
              {availableRescheduleGroomers.map((staff) => {
                const name = staff.staffName || staff.name || "Groomer";
                const isActive = String(rescheduleGroomerId) === String(staff.userId);
                return (
                  <label 
                    key={staff.userId} 
                    className={`${styles.radioCard} ${isActive ? styles.radioCardSelected : ""}`}
                    onClick={() => setRescheduleGroomerId(staff.userId)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.radioPinkDot}>
                      {name[0].toUpperCase()}
                    </div>
                    {name}
                  </label>
                );
              })}
              {availableRescheduleGroomers.length === 0 && (
                <div style={{ fontSize: '0.85rem', color: '#888', padding: '0.5rem 0' }}>
                  No groomers available for this date.
                </div>
              )}
            </div>
            <div className={styles.modalActionsRow}>
              <button className={styles.btnOutlinePink} onClick={() => setShowRescheduleModal(false)}>Cancel</button>
              <button className={styles.btnSolidPink} onClick={handleConfirmReschedule}>Confirm</button>
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
            <div className={styles.formGroup} style={{ marginBottom: 16 }}>
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
            "Edit",
            "Reschedule",
            "Cancel",
            "Check-In",
            "Check-Out",
            "Print",
            // "Assign Groomer",
            "Update Payment status",
            "Generate Invoice"
          ].filter((action) => {
            const bookingStatusUpper = selectedBooking.bookingStatus?.toUpperCase() || selectedBooking.status?.toUpperCase();
            
            // If completed, hide reschedule, cancel, approve, check-in, check-out, and edit
            if (bookingStatusUpper === "COMPLETED") {
              if (["Reschedule", "Cancel", "Approve", "Check-In", "Check-Out", "Edit"].includes(action)) {
                return false;
              }
            }
            
            // If in progress, hide reschedule, cancel, approve, check-in, and edit
            if (bookingStatusUpper === "IN_PROGRESS" || bookingStatusUpper === "IN PROGRESS") {
              if (["Reschedule", "Cancel", "Approve", "Check-In", "Edit"].includes(action)) {
                return false;
              }
            }

            if (action === "Check-In") {
              return selectedBooking.bookingStatus?.toUpperCase() === "TODAY";
            }
            if (action === "Check-Out") {
              const statusUpper = selectedBooking.status?.toUpperCase();
              const bookingStatusUpperVal = selectedBooking.bookingStatus?.toUpperCase();
              return (
                statusUpper === "CHECK-IN" ||
                statusUpper === "CHECK IN" ||
                statusUpper === "IN PROGRESS" ||
                statusUpper === "IN_PROGRESS" ||
                bookingStatusUpperVal === "CHECK-IN" ||
                bookingStatusUpperVal === "CHECK IN" ||
                bookingStatusUpperVal === "IN PROGRESS" ||
                bookingStatusUpperVal === "IN_PROGRESS"
              );
            }
            return true;
          }).map((action) => (
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

      {/* Services List Popup rendered with fixed position */}
      {activeServicesPopupId && selectedBooking && (
        <div
          className={styles.servicesPopupAbsolute}
          style={{
            position: "fixed",
            top: `${servicesPopupPosition.top}px`,
            left: `${servicesPopupPosition.left}px`
          }}
        >
          <div className={styles.servicesPopupTitle}>Service Names</div>
          <div className={styles.servicesPopupList}>
            {selectedBooking.servicesList?.map((srvName, idx) => (
              <div key={idx} className={styles.servicesPopupItem}>
                {srvName}
              </div>
            ))}
          </div>
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

function CalendarWeekView({ bookings, selectedDate = new Date(), onDayClick }) {
  const today = new Date();
  // get start of week (Sunday) relative to selectedDate
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Parse and group bookings by dayIndex and hourIndex
  const bookingsByDayAndHour = {};
  bookings.forEach((b, idx) => {
    const d = parseBookingDate(b.date);
    if (d) {
      const dayIndex = days.findIndex(day =>
        day.getDate() === d.getDate() &&
        day.getMonth() === d.getMonth() &&
        day.getFullYear() === d.getFullYear()
      );
      if (dayIndex !== -1) {
        const hourIndex = b.startHour !== undefined ? (b.startHour === 0 ? 24 : b.startHour) : 11;
        const key = `${dayIndex}-${hourIndex}`;
        if (!bookingsByDayAndHour[key]) bookingsByDayAndHour[key] = [];
        bookingsByDayAndHour[key].push({ ...b, _idx: idx });
      }
    }
  });

  return (
    <div className={styles.weekView}>
      {/* Header */}
      <div className={styles.weekHeader}>
        <div className={styles.weekTimeGutter} />
        {days.map((d, i) => (
          <div
            key={i}
            className={`${styles.weekDayHeader} ${d.toDateString() === today.toDateString() ? styles.weekDayHeaderToday : ""}`}
            onClick={() => onDayClick && onDayClick(d)}
            style={{ cursor: 'pointer' }}
          >
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
              const events = bookingsByDayAndHour[`${di}-${hi}`] || [];
              return (
                <div key={di} className={styles.weekCell}>
                  {events.map((ev, ei) => {
                    const color = getChipColor(ev._idx || 0);
                    return (
                      <div key={ei} className={styles.calChip} style={{ background: color.bg, color: color.text, borderLeft: `3px solid ${color.text}` }}>
                        <span className={styles.calChipName}>{ev.petName || ev.customerName}</span>
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
function CalendarDayView({ bookings, selectedDate = new Date(), isDaycare = false }) {
  const today = new Date();

  // get bookings for the selectedDate
  const dayBookings = bookings.filter(b => {
    const d = parseBookingDate(b.date || b.rawDate);
    return d &&
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear();
  });

  const columns = isDaycare ? ["Schedule"] : (() => {
    const uniqueGroomers = [];
    dayBookings.forEach(b => {
      const groomerName = b.groomer || "Unassigned";
      if (!uniqueGroomers.includes(groomerName)) {
        uniqueGroomers.push(groomerName);
      }
    });
    if (uniqueGroomers.length === 0) uniqueGroomers.push("Unassigned");
    return uniqueGroomers;
  })();

  // Group bookings by column name and hour index
  const bookingsByColAndHour = {};
  dayBookings.forEach((b, idx) => {
    const colName = isDaycare ? "Schedule" : (b.groomer || "Unassigned");
    const hourIndex = b.startHour !== undefined ? (b.startHour === 0 ? 24 : b.startHour) : 11;
    const key = `${colName}-${hourIndex}`;
    if (!bookingsByColAndHour[key]) bookingsByColAndHour[key] = [];
    bookingsByColAndHour[key].push({ ...b, _idx: idx });
  });

  return (
    <div className={styles.weekView}>
      {/* Header */}
      <div className={styles.weekHeader}>
        <div className={styles.weekTimeGutter} />
        {columns.map((g, i) => (
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
            {columns.map((g, gi) => {
              const events = bookingsByColAndHour[`${g}-${hi}`] || [];
              return (
                <div key={gi} className={styles.weekCell}>
                  {events.map((ev, ei) => {
                    const color = getChipColor(ev._idx || 0);
                    return (
                      <div key={ei} className={styles.calChip} style={{ background: color.bg, color: color.text, borderLeft: `3px solid ${color.text}` }}>
                        <span className={styles.calChipName}>{ev.petName || ev.customerName}</span>
                        <span className={styles.calChipType}>{ev.service || ev.type}</span>
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

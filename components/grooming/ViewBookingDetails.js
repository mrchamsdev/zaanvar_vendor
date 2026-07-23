import React, { useState, useRef, useEffect } from "react";
import styles from "../../styles/grooming/addBooking.module.css";
import Image from "next/image";
import useStore from "../state/useStore";
import { VENDOR_API_URL } from "../utilities/Constants";
import useCurrencySymbol from "../utilities/useCurrencySymbol";

const menuActions = [
  "Edit", "Reschedule", "Cancel", "Check-In", "Check-Out", 
  "Print", // "Assign Groomer", 
  "Update Payment status", "Generate Invoice"
];

const ViewBookingDetails = ({ bookingId, onClose }) => {
  const currencySymbol = useCurrencySymbol();
  const { jwtToken } = useStore();
  const [bookingData, setBookingData] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Booking Details by Id
  useEffect(() => {
    if (bookingId) {
      setLoading(true);
      fetch(`${VENDOR_API_URL}vendor/grooming-booking/bookings/${bookingId}`, {
        headers: {
          "Authorization": `Bearer ${jwtToken}`
        }
      })
        .then(res => res.json())
        .then(res => {
          if (res.status === "success" && res.data) {
            setBookingData(res.data);
            // Fetch available offerings for service mapping using branchId
            fetch(`${VENDOR_API_URL}vendor/grooming-booking/offerings/${res.data.branchId}?type=services`)
              .then(offRes => offRes.json())
              .then(offData => {
                if (offData.status === "success" && offData.data?.services) {
                  setAvailableServices(offData.data.services);
                }
                setLoading(false);
              })
              .catch(err => {
                console.error("Error fetching services", err);
                setLoading(false);
              });
          } else {
            setLoading(false);
          }
        })
        .catch(err => {
          console.error("Error fetching booking details", err);
          setLoading(false);
        });
    }
  }, [bookingId, jwtToken]);

  const getServiceName = (item) => {
    if (!item) return "N/A";
    if (typeof item === "object" && item !== null) {
      if (item.name) return String(item.name);
      if (item.serviceName) return Array.isArray(item.serviceName) ? item.serviceName.join(", ") : String(item.serviceName);
      if (item.id) {
        const found = availableServices.find(s => String(s.id) === String(item.id));
        if (found) return Array.isArray(found.serviceName) ? found.serviceName.join(", ") : String(found.serviceName);
        return String(item.id);
      }
    }
    const sId = String(item);
    const service = availableServices.find(s => String(s.id) === sId || s.serviceName === sId || s.name === sId);
    if (service) {
      return Array.isArray(service.serviceName) ? service.serviceName.join(", ") : String(service.serviceName);
    }
    return sId;
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ color: '#e9315d', fontWeight: 'bold' }}>Loading details...</div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ color: '#e9315d', fontWeight: 'bold' }}>Booking details not found.</div>
        <button onClick={onClose} style={{ marginLeft: '1rem', padding: '0.5rem 1rem', background: '#e9315d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
      </div>
    );
  }

  const { customer, appointments, subTotal, discountAmount, taxAmount, totalAmount, paidAmount, dueAmount, paymentStatus, status, notes } = bookingData;
  
  // Format dates for display
  const getFormattedDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const mainAppointmentDate = appointments?.[0]?.appointmentDate ? getFormattedDate(appointments[0].appointmentDate) : "";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>View Details</h2>
        <div className={styles.controls}>
          <button className={styles.iconBtn}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg></button>
          <button className={styles.iconBtn}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></button>
          <button className={styles.iconBtn} onClick={onClose}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
        </div>
      </header>

      <div className={styles.content}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className={styles.title} style={{ fontSize: '1.1rem' }}>Booking Details</h3>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button className={styles.iconBtn} onClick={() => setShowMenu(!showMenu)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {showMenu && (
              <div className={styles.menuDropdown}>
                {menuActions.map(action => (
                  <div key={action} className={styles.menuItem} onClick={() => setShowMenu(false)}>
                    {action}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.summaryCard} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 className={styles.summaryTitle}>Customer Details</h4>
              <div className={styles.summaryRow} style={{ justifyContent: 'flex-start', gap: '2rem' }}>
                <span className={styles.summaryLabel}>Customer Name</span>
                <span className={styles.summaryValue}>{customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : "Guest"}</span>
              </div>
              <div className={styles.summaryRow} style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                <span className={styles.summaryLabel}>Customer Phone Number</span>
                <span className={styles.summaryValue}>{customer?.phoneNumber || "N/A"}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <span className={paymentStatus === "Paid" ? styles.badgeCheckedIn : styles.badgePending}>
                  {paymentStatus === "Paid" ? "Paid" : "Payment Pending"}
                </span>
                {paymentStatus !== "Paid" && (
                  <span className={styles.badgeDue}>Due: ₹ {Math.round(parseFloat(dueAmount) || 0)}</span>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <span className={status === "COMPLETED" ? styles.badgeCheckedIn : styles.badgePending}>
                  {status ? status.replace(/_/g, ' ') : ""}
                </span>
                <span className={styles.badgeDue}>{mainAppointmentDate || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          {(() => {
            const formatTime = (timeStr) => {
              if (!timeStr) return "";
              const [h, m] = timeStr.split(':');
              const hours = parseInt(h);
              const displayH = hours % 12 || 12;
              const ampm = hours >= 12 ? 'PM' : 'AM';
              return `${String(displayH).padStart(2, '0')}:${m} ${ampm}`;
            };

            const cards = [];

            (bookingData.appointments || []).forEach((app, appIdx) => {
              (app.pets || []).forEach((pet, petIdx) => {
                cards.push({
                  id: `g-${appIdx}-${petIdx}`,
                  app,
                  pet,
                  petProfile: pet.petProfile || {},
                  srv: pet.services?.[0] || {},
                  groomer: app.groomer || {},
                  serviceCat: "Grooming",
                  formattedDate: getFormattedDate(app.appointmentDate),
                  timeRange: app.startTime && app.endTime ? `${formatTime(app.startTime)} — ${formatTime(app.endTime)}` : (app.appointmentTime || "N/A")
                });
              });
            });

            (bookingData.daycareAppointments || []).forEach((app, appIdx) => {
              const dcDateObj = app.dates?.[0] || {};
              const formattedDate = getFormattedDate(dcDateObj.date || app.createdAt);
              const checkin12 = formatTime(dcDateObj.checkInTime);
              const checkout12 = formatTime(dcDateObj.checkOutTime);

              (app.pets || []).forEach((pObj, petIdx) => {
                const petProfile = pObj.petProfile || pObj;
                cards.push({
                  id: `dc-${appIdx}-${petIdx}`,
                  app: {
                    ...app,
                    checkinTime: checkin12 || "10:00 AM",
                    checkoutTime: checkout12 || "06:00 PM",
                    assignedRoom: dcDateObj.assignedRoom || "N/A",
                    roomRate: dcDateObj.roomRate || "0",
                    foodProviding: app.foodProviding ? "Yes" : "No"
                  },
                  pet: pObj,
                  petProfile,
                  srv: {
                    price: dcDateObj.roomRate || bookingData.subTotal
                  },
                  groomer: {},
                  serviceCat: "Day Care",
                  formattedDate,
                  timeRange: `${checkin12 || "10:00 AM"} — ${checkout12 || "06:00 PM"}`
                });
              });
            });

            (bookingData.clinicAppointments || []).forEach((app, appIdx) => {
              (app.pets || []).forEach((pet, petIdx) => {
                cards.push({
                  id: `c-${appIdx}-${petIdx}`,
                  app,
                  pet,
                  petProfile: pet.petProfile || {},
                  srv: pet.services?.[0] || {},
                  groomer: app.doctor || app.groomer || {},
                  serviceCat: "Clinic",
                  formattedDate: getFormattedDate(app.appointmentDate),
                  timeRange: app.appointmentTime || "N/A"
                });
              });
            });

            return cards.map(({ id, app, pet, petProfile, srv, groomer, serviceCat, formattedDate, timeRange }) => (
              <div key={id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className={styles.summaryCard} style={{ height: '100%' }}>
                    <h4 className={styles.summaryTitle}>Pet Details</h4>
                    <div className={styles.petAvatarWrapper}>
                      <Image src={petProfile.photo || "https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png"} unoptimized width={40} height={40} alt="Pet" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                      <span className={styles.summaryValue}>{(petProfile.petName || pet.petName || 'Unnamed').toUpperCase()} ({petProfile.breed || 'N/A'})</span>
                    </div>
                  </div>

                  {serviceCat === "Clinic" ? (
                    <div className={styles.summaryCard} style={{ height: '100%' }}>
                      <h4 className={styles.summaryTitle}>Clinic Details</h4>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{formattedDate || "N/A"}</span></div>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Time</span><span className={styles.summaryValue}>{app.appointmentTime || "9:00 AM"}</span></div>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Booking Type</span><span className={styles.summaryValue}>{app.bookingType || "In-Store"}</span></div>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Type of Consultation</span><span className={styles.summaryValue}>{app.consultationReason || "General Checkup"}</span></div>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Doctor</span><span className={styles.summaryValue}>{groomer.firstName ? `${groomer.firstName} ${groomer.lastName || ""}`.trim() : "Unassigned"}</span></div>
                    </div>
                  ) : (serviceCat === "Day Care" || serviceCat === "Daycare") ? (
                    <div className={styles.summaryCard} style={{ height: '100%' }}>
                      <h4 className={styles.summaryTitle}>Daycare Details</h4>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{formattedDate || "N/A"}</span></div>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Check In / Check Out</span><span className={styles.summaryValue}>{`${app.checkinTime || "07:00 AM"} - ${app.checkoutTime || "05:00 PM"}`}</span></div>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Room</span><span className={styles.summaryValue}>{app.assignedRoom || "N/A"}</span></div>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Food Providing</span><span className={styles.summaryValue}>{app.foodProviding || "No"}</span></div>
                      {(bookingData.addons || []).length > 0 && (
                        <div className={styles.summaryRow}>
                          <span className={styles.summaryLabel}>Addons</span>
                          <span className={styles.summaryValue}>
                            {bookingData.addons.map(a => a.addonName || a.name || a.addonServiceType).filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.summaryCard} style={{ height: '100%' }}>
                      <h4 className={styles.summaryTitle}>Grooming Details</h4>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{formattedDate || "N/A"}</span></div>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Time</span><span className={styles.summaryValue}>{timeRange}</span></div>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Booking Type</span><span className={styles.summaryValue}>{bookingData.bookingMode === "AtStore" ? "At Store" : (bookingData.bookingMode || "At Store")}</span></div>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Type</span><span className={styles.summaryValue}>{bookingData.serviceType || "Grooming"}</span></div>
                      <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Groomer</span><span className={styles.summaryValue}>{groomer.firstName ? `${groomer.firstName} ${groomer.lastName || ""}`.trim() : "Unassigned"}</span></div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className={styles.summaryCard} style={{ height: '100%' }}>
                    <h4 className={styles.summaryTitle}>
                      {serviceCat === "Clinic" ? "Clinic Cost Details" : ((serviceCat === "Day Care" || serviceCat === "Daycare") ? "Daycare Cost Details" : "Grooming Cost Details")}
                    </h4>
                    {srv.selectedServices?.length > 0 ? (
                      srv.selectedServices.map((sItem, sIdx) => {
                        const keyStr = typeof sItem === "object" && sItem !== null ? (sItem.id || sItem.name || sIdx) : String(sItem);
                        const itemPrice = typeof sItem === "object" && sItem !== null && sItem.price !== undefined ? Number(sItem.price) : (Number(srv.price) || 0);
                        return (
                          <div key={keyStr} className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>{getServiceName(sItem)}</span>
                            <span className={styles.summaryValue}>{currencySymbol} {Math.round(itemPrice)}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>{serviceCat === "Clinic" ? "Consultation Fee" : (serviceCat === "Day Care" ? "Room Rate" : "Service Fee")}</span>
                        <span className={styles.summaryValue}>{currencySymbol} {Math.round(parseFloat(srv.price || app.roomRate || app.totalAmount || bookingData.subTotal || bookingData.totalAmount) || 0)}</span>
                      </div>
                    )}
                    {(serviceCat === "Day Care" || serviceCat === "Daycare") && (bookingData.addons || []).length > 0 && (
                      bookingData.addons.map((addonItem, addIdx) => (
                        <div key={`addon-${addonItem.id || addIdx}`} className={styles.summaryRow}>
                          <span className={styles.summaryLabel}>{addonItem.addonName || addonItem.name || addonItem.addonServiceType}</span>
                          <span className={styles.summaryValue}>{currencySymbol} {Math.round(parseFloat(addonItem.price) || 0)}</span>
                        </div>
                      ))
                    )}
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Total Amount</span>
                      <span className={styles.summaryValue}>{currencySymbol} {Math.round(parseFloat(bookingData.totalAmount || bookingData.subTotal || srv.price || app.totalAmount) || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>

        {notes && (
          <div className={styles.summaryCard} style={{ marginBottom: '1.5rem' }}>
            <h4 className={styles.summaryTitle}>Special Notes</h4>
            <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.4' }}>{notes}</div>
          </div>
        )}

        <div className={styles.summaryGrid} style={{ alignItems: 'flex-start' }}>
          <div className={styles.paymentSection}>
            <h4 className={styles.summaryTitle} style={{ fontSize: '0.85rem', color: '#666' }}>Payment Details</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Payment Type</label>
                <select className={styles.select} disabled>
                  <option>Cash</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Paid Amount</label>
                <input type="text" className={styles.input} readOnly value={`₹ ${Math.round(parseFloat(paidAmount) || 0)}`} />
              </div>
            </div>
          </div>

          <div className={styles.costBreakdownSection}>
            <h4 className={styles.summaryTitle}>Cost Break Down details</h4>
            
            <div className={styles.costRow}>
              <span className={styles.costLabel}>Total</span>
              <strong>₹ {Math.round(parseFloat(subTotal) || 0)}</strong>
            </div>

            <div className={styles.costRow}>
              <span className={styles.costLabel}>Whole Tax Details</span>
              <strong>₹ {Math.round(parseFloat(taxAmount) || 0)}</strong>
            </div>

            <div className={styles.costRow}>
              <span className={styles.costLabel}>Whole Discount Details</span>
              <strong>₹ {Math.round(parseFloat(discountAmount) || 0)}</strong>
            </div>
            
            <div className={styles.costRow}>
              <span className={styles.costLabel} style={{ color: '#6c757d' }}>After Tax & Discount Total Amount</span>
              <strong>₹ {Math.round(parseFloat(totalAmount) || 0)}</strong>
            </div>

            <h4 className={styles.summaryTitle} style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Advanced Payment Details</h4>
            <div className={styles.costRow}>
              <span className={styles.costLabel} style={{ color: '#6c757d' }}>Advanced Payment</span>
              <strong>₹ {Math.round(parseFloat(paidAmount) || 0)}</strong>
            </div>

            <div className={styles.totalPending}>
              <span>Total Pending Amount</span>
              <span>₹ {Math.round(parseFloat(dueAmount) || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBookingDetails;

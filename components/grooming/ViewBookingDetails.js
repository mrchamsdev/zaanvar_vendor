import React, { useState, useRef, useEffect } from "react";
import styles from "../../styles/grooming/addBooking.module.css";
import Image from "next/image";
import useStore from "../state/useStore";
import { VENDOR_API_URL } from "../utilities/Constants";
import useCurrencySymbol from "../utilities/useCurrencySymbol";
import { useRouter } from "next/router";

const menuActions = [
  "Edit", "Reschedule", "Cancel", "Check-In", "Check-Out",
  "Print",
  "Update Payment status", "Generate Invoice"
];

const ViewBookingDetails = ({ bookingId, onClose }) => {
  const router = useRouter();
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
        .then(async res => {
          if (res.status === "success" && res.data) {
            let mainBooking = res.data;

            // Check if there are other booking IDs in appointments/daycare/clinic (e.g. split bookings)
            const otherBookingIds = new Set();
            (mainBooking.appointments || []).forEach(app => {
              if (app.bookingId && String(app.bookingId) !== String(bookingId)) {
                otherBookingIds.add(app.bookingId);
              }
            });
            (mainBooking.daycareAppointments || []).forEach(app => {
              if (app.bookingId && String(app.bookingId) !== String(bookingId)) {
                otherBookingIds.add(app.bookingId);
              }
            });
            (mainBooking.clinicAppointments || []).forEach(app => {
              if (app.bookingId && String(app.bookingId) !== String(bookingId)) {
                otherBookingIds.add(app.bookingId);
              }
            });

            if (otherBookingIds.size > 0) {
              const fetchPromises = Array.from(otherBookingIds).map(id =>
                fetch(`${VENDOR_API_URL}vendor/grooming-booking/bookings/${id}`, {
                  headers: { "Authorization": `Bearer ${jwtToken}` }
                }).then(r => r.json()).catch(() => null)
              );
              const otherResults = await Promise.all(fetchPromises);
              otherResults.forEach(otherRes => {
                if (otherRes && otherRes.status === "success" && otherRes.data) {
                  const ob = otherRes.data;
                  if (ob.appointments) {
                    mainBooking.appointments = [
                      ...(mainBooking.appointments || []),
                      ...ob.appointments
                    ];
                  }
                  if (ob.daycareAppointments) {
                    mainBooking.daycareAppointments = [
                      ...(mainBooking.daycareAppointments || []),
                      ...ob.daycareAppointments
                    ];
                  }
                  if (ob.clinicAppointments) {
                    mainBooking.clinicAppointments = [
                      ...(mainBooking.clinicAppointments || []),
                      ...ob.clinicAppointments
                    ];
                  }
                }
              });

              // De-duplicate appointments
              if (mainBooking.appointments) {
                const seen = new Set();
                mainBooking.appointments = mainBooking.appointments.filter(app => {
                  if (seen.has(app.appointmentID)) return false;
                  seen.add(app.appointmentID);
                  return true;
                });
              }
              if (mainBooking.daycareAppointments) {
                const seen = new Set();
                mainBooking.daycareAppointments = mainBooking.daycareAppointments.filter(app => {
                  if (seen.has(app.appointmentID)) return false;
                  seen.add(app.appointmentID);
                  return true;
                });
              }
              if (mainBooking.clinicAppointments) {
                const seen = new Set();
                mainBooking.clinicAppointments = mainBooking.clinicAppointments.filter(app => {
                  if (seen.has(app.appointmentID)) return false;
                  seen.add(app.appointmentID);
                  return true;
                });
              }
            }

            setBookingData(mainBooking);

            // Fetch available offerings for service mapping using branchId
            fetch(`${VENDOR_API_URL}vendor/grooming-booking/offerings/${mainBooking.branchId}?type=services`)
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

  const { customer, subTotal, discountAmount, taxAmount, totalAmount, paidAmount, dueAmount, paymentStatus, status, notes } = bookingData;

  // Format dates for display
  const getFormattedDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
    const [h, m] = timeStr.split(':');
    const hours = parseInt(h);
    const displayH = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${String(displayH).padStart(2, '0')}:${m} ${ampm}`;
  };

  const mainAppointmentDate = bookingData.appointments?.[0]?.appointmentDate ? getFormattedDate(bookingData.appointments[0].appointmentDate) : "";

  // Extract unique pets from all appointments in bookingData
  const fetchedPets = [];
  const addUniquePet = (pet) => {
    const petProfile = pet.petProfile || {};
    const petId = pet.customerPetId || petProfile.petId || petProfile.id || pet.id;
    if (!petId) return;
    if (!fetchedPets.some(p => p.id === petId)) {
      fetchedPets.push({
        id: petId,
        petName: petProfile.petName || pet.petName || "Unnamed",
        breed: petProfile.breed || "N/A",
        photo: petProfile.photo
      });
    }
  };

  (bookingData.appointments || []).forEach(app => {
    (app.pets || []).forEach(pet => addUniquePet(pet));
  });
  (bookingData.daycareAppointments || []).forEach(app => {
    (app.pets || []).forEach(pet => addUniquePet(pet));
  });
  (bookingData.clinicAppointments || []).forEach(app => {
    (app.pets || []).forEach(pet => addUniquePet(pet));
  });

  // If no pets are nested in appointments, fall back to root pets array
  if (fetchedPets.length === 0 && Array.isArray(bookingData.pets)) {
    bookingData.pets.forEach(pet => {
      const petId = pet.id || pet.customerPetId || pet.petId;
      fetchedPets.push({
        id: petId || "temp",
        petName: pet.petName || "Unnamed",
        breed: pet.breed || "N/A",
        photo: pet.photo
      });
    });
  }

  const petsList = fetchedPets;

  const petSummaryList = petsList.map((pet, idx) => {
    const petId = pet.id;
    const petName = pet.petName;

    // Find grooming appointment for this pet
    let petGroomingApp = null;
    let petGroomingInfo = null;
    (bookingData.appointments || []).forEach(app => {
      const foundPet = (app.pets || []).find(p => {
        const pId = p.customerPetId || p.petProfile?.petId || p.petProfile?.id || p.id;
        return (pId && pId === petId) || p.petName === petName || p.petProfile?.petName === petName;
      });
      if (foundPet) {
        petGroomingApp = app;
        petGroomingInfo = foundPet;
      }
    });

    // Find daycare appointment for this pet
    let petDaycareApp = null;
    let petDaycareInfo = null;
    let dcDateObj = {};
    (bookingData.daycareAppointments || []).forEach(app => {
      const foundPet = (app.pets || []).find(p => {
        const pId = p.customerPetId || p.petProfile?.petId || p.petProfile?.id || p.id;
        return (pId && pId === petId) || p.petName === petName || p.petProfile?.petName === petName || p.petNameDisplay === petName;
      });
      if (foundPet) {
        petDaycareApp = app;
        petDaycareInfo = foundPet;
        dcDateObj = app.dates?.[0] || {};
      }
    });

    // Find clinic appointment for this pet
    let petClinicApp = null;
    let petClinicInfo = null;
    (bookingData.clinicAppointments || []).forEach(app => {
      const foundPet = (app.pets || []).find(p => {
        const pId = p.customerPetId || p.petProfile?.petId || p.petProfile?.id || p.id;
        return (pId && pId === petId) || p.petName === petName || p.petProfile?.petName === petName;
      });
      if (foundPet) {
        petClinicApp = app;
        petClinicInfo = foundPet;
      }
    });

    const serviceTypes = [];
    if (petGroomingApp) serviceTypes.push("Grooming");
    if (petClinicApp) serviceTypes.push("Clinic");
    if (petDaycareApp) serviceTypes.push("Day Care");

    let petGroomingTotal = 0;
    const groomingServices = [];
    if (petGroomingInfo) {
      const servicesArray = Array.isArray(petGroomingInfo.services) ? petGroomingInfo.services : [];
      const firstSrv = servicesArray[0] || petGroomingInfo.services || {};

      if (firstSrv.selectedServices && Array.isArray(firstSrv.selectedServices)) {
        firstSrv.selectedServices.forEach(sItem => {
          const price = Number(sItem.price) || 0;
          groomingServices.push({
            serviceName: sItem.name || sItem.serviceName || getServiceName(sItem),
            price
          });
          petGroomingTotal += price;
        });
      } else if (petGroomingInfo.services?.selectedServices && Array.isArray(petGroomingInfo.services.selectedServices)) {
        petGroomingInfo.services.selectedServices.forEach(sItem => {
          const price = Number(sItem.price) || 0;
          groomingServices.push({
            serviceName: sItem.name || sItem.serviceName || getServiceName(sItem),
            price
          });
          petGroomingTotal += price;
        });
      } else if (servicesArray.length > 0) {
        servicesArray.forEach(srv => {
          const price = Number(srv.price) || 0;
          groomingServices.push({
            serviceName: srv.serviceName || srv.name || getServiceName(srv),
            price
          });
          petGroomingTotal += price;
        });
      }
    }

    let petClinicTotal = 0;
    const clinicServices = [];
    if (petClinicInfo) {
      const srv = Array.isArray(petClinicInfo.services) ? (petClinicInfo.services[0] || {}) : (petClinicInfo.services || {});
      const price = Number(srv.price) || 500;
      clinicServices.push({
        serviceName: petClinicApp.consultationReason || "General Checkup",
        price
      });
      petClinicTotal += price;
    }

    let daycareRoomPrice = 0;
    let daycareAddonPrice = 0;
    let petDaycareTotal = 0;
    if (petDaycareApp) {
      daycareRoomPrice = Number(dcDateObj.roomRate) || 0;
      daycareAddonPrice = (petDaycareApp.addons || []).reduce((sum, addonItem) => {
        const addonName = addonItem.addonName || addonItem.name || addonItem.addonServiceType;
        const service = availableServices.find(s =>
          String(s.id) === String(addonItem.id || addonItem.serviceId) ||
          s.serviceName === addonName ||
          s.name === addonName
        );
        const price = service ?
          Number(service.discountPrice !== undefined && service.discountPrice !== null ? service.discountPrice : service.price) :
          Number(addonItem.price || 0);
        return sum + price;
      }, 0);
      petDaycareTotal = daycareRoomPrice + daycareAddonPrice;
    }

    const petTotal = petGroomingTotal + petClinicTotal + petDaycareTotal;

    return {
      pet,
      serviceTypes,
      petGroomingApp,
      petGroomingInfo,
      groomingServices,
      petGroomingTotal,
      petClinicApp,
      petClinicInfo,
      clinicServices,
      petClinicTotal,
      petDaycareApp,
      petDaycareInfo,
      dcDateObj,
      daycareRoomPrice,
      daycareAddonPrice,
      petDaycareTotal,
      petTotal
    };
  });

  const computedSubTotal = petSummaryList.reduce((sum, item) => sum + item.petTotal, 0);
  const displaySubTotal = computedSubTotal || parseFloat(subTotal) || 0;
  const displayTaxAmount = parseFloat(taxAmount) || 0;
  const displayDiscountAmount = parseFloat(discountAmount) || 0;
  const displayTotalAmount = computedSubTotal ? (computedSubTotal + displayTaxAmount - displayDiscountAmount) : ((parseFloat(totalAmount) || 0) || (displaySubTotal + displayTaxAmount - displayDiscountAmount));
  const displayPaidAmount = parseFloat(paidAmount) || 0;
  const displayDueAmount = Math.max(0, displayTotalAmount - displayPaidAmount);

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
            {showMenu && (() => {
              const bookingStatusUpper = bookingData.bookingStatus?.toUpperCase() || bookingData.status?.toUpperCase();
              const statusUpper = bookingData.status?.toUpperCase();

              const filteredMenuActions = menuActions.filter(action => {
                // If completed, hide reschedule, cancel, check-in, check-out, and edit
                if (bookingStatusUpper === "COMPLETED") {
                  if (["Reschedule", "Cancel", "Check-In", "Check-Out", "Edit"].includes(action)) {
                    return false;
                  }
                }

                // If in progress, hide reschedule, cancel, check-in, and edit
                if (bookingStatusUpper === "IN_PROGRESS" || bookingStatusUpper === "IN PROGRESS") {
                  if (["Reschedule", "Cancel", "Check-In", "Edit"].includes(action)) {
                    return false;
                  }
                }

                if (action === "Check-In") {
                  return bookingStatusUpper === "TODAY";
                }
                if (action === "Check-Out") {
                  return (
                    statusUpper === "CHECK-IN" ||
                    statusUpper === "CHECK IN" ||
                    statusUpper === "IN PROGRESS" ||
                    statusUpper === "IN_PROGRESS" ||
                    bookingStatusUpper === "CHECK-IN" ||
                    bookingStatusUpper === "CHECK IN" ||
                    bookingStatusUpper === "IN PROGRESS" ||
                    bookingStatusUpper === "IN_PROGRESS"
                  );
                }
                return true;
              });

              return (
                <div className={styles.menuDropdown}>
                  {filteredMenuActions.map(action => (
                    <div
                      key={action}
                      className={styles.menuItem}
                      onClick={() => {
                        setShowMenu(false);
                        if (action === "Edit") {
                          router.push({
                            pathname: router.pathname,
                            query: { ...router.query, edit: "true", view: undefined, bookingId: bookingId }
                          });
                          if (onClose) onClose();
                        }
                      }}
                    >
                      {action}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Top Container */}
        <div style={{ border: '1px solid #eaeaea', borderRadius: '12px', padding: '1.5rem', backgroundColor: '#fff', marginBottom: '2rem' }}>
          {/* Customer Details Top Card */}
          <div className={styles.summaryCard} style={{ marginBottom: '1.5rem', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 className={styles.summaryTitle}>Customer Details</h4>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Customer Name</span>
                  <span className={styles.summaryValue}>
                    {customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : "Guest"}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Customer Phone Number</span>
                  <span className={styles.summaryValue}>
                    {customer?.phoneNumber || "N/A"}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <span className={paymentStatus === "Paid" ? styles.badgeCheckedIn : styles.badgePending}>
                    {paymentStatus === "Paid" ? "Paid" : "Payment Pending"}
                  </span>
                  {paymentStatus !== "Paid" && (
                    <span className={styles.badgeDue}>Due: ₹ {Math.round(displayDueAmount)}</span>
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

          {/* 2-Column Grid for Pet One and Pet Two Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
            {petSummaryList.map((item, idx) => {
              const {
                pet,
                serviceTypes,
                petGroomingApp,
                groomingServices,
                petGroomingTotal,
                petClinicApp,
                clinicServices,
                petClinicTotal,
                petDaycareApp,
                dcDateObj,
                daycareRoomPrice,
                daycareAddonPrice,
                petDaycareTotal
              } = item;

              const labelPrefix = idx === 0 ? "One" : "Two";

              // Find groomer and doctor names
              const groomerName = petGroomingApp?.groomer ? (petGroomingApp.groomer.staffName || `${petGroomingApp.groomer.firstName || ""} ${petGroomingApp.groomer.lastName || ""}`.trim()) : "Unassigned";
              const doctorName = petClinicApp?.doctor ? (petClinicApp.doctor.staffName || `${petClinicApp.doctor.firstName || ""} ${petClinicApp.doctor.lastName || ""}`.trim()) : "Unassigned";

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className={styles.summaryCard}>
                    <h4 className={styles.summaryTitle}>Pet {labelPrefix} Details</h4>
                    <div className={styles.petAvatarWrapper}>
                      <Image src={pet.photo || "https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png"} unoptimized width={40} height={40} alt="Pet" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                      <span className={styles.summaryValue}>{(pet.petName || pet.name || 'Unnamed').toUpperCase()} ({pet.breed || 'N/A'})</span>
                    </div>
                  </div>

                  {/* Grooming Block */}
                  {serviceTypes.includes("Grooming") && (
                    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5' }}></span>
                        Grooming Service
                      </div>
                      <div className={styles.summaryCard}>
                        <h4 className={styles.summaryTitle}>Grooming Details</h4>
                        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{getFormattedDate(petGroomingApp.appointmentDate)}</span></div>
                        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Time</span><span className={styles.summaryValue}>{petGroomingApp.startTime && petGroomingApp.endTime ? `${formatTime(petGroomingApp.startTime)} - ${formatTime(petGroomingApp.endTime)}` : "9:00 AM"}</span></div>
                        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Booking Type</span><span className={styles.summaryValue}>{bookingData.bookingMode === "AtStore" ? "At Store" : (bookingData.bookingMode || "At Store")}</span></div>
                        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Type</span><span className={styles.summaryValue}>{bookingData.serviceType || "Grooming"}</span></div>
                        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Groomer</span><span className={styles.summaryValue}>{groomerName}</span></div>
                      </div>
                      <div className={styles.summaryCard}>
                        <h4 className={styles.summaryTitle}>Grooming Cost Details</h4>
                        {groomingServices.map((gItem, gIdx) => (
                          <div key={gIdx} className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>{gItem.serviceName}</span>
                            <span className={styles.summaryValue}>{currencySymbol} {Math.round(gItem.price)}</span>
                          </div>
                        ))}
                        <div className={styles.summaryRow}>
                          <span className={styles.summaryLabel}>Total Amount</span>
                          <span className={styles.summaryValue}>{currencySymbol} {Math.round(petGroomingTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Daycare Block */}
                  {serviceTypes.includes("Day Care") && (() => {
                    const daycareAddonNames = (petDaycareApp.addons || []).map(a => a.addonName || a.name || a.addonServiceType).filter(Boolean);

                    return (
                      <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0891b2' }}></span>
                          Daycare Service
                        </div>
                        <div className={styles.summaryCard}>
                          <h4 className={styles.summaryTitle}>Daycare Details</h4>
                          <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{getFormattedDate(dcDateObj.date)}</span></div>
                          <div className={styles.summaryRow}><span className={styles.summaryLabel}>Check In / Check Out Time</span><span className={styles.summaryValue}>{`${formatTime(dcDateObj.checkInTime) || "07:00 AM"} - ${formatTime(dcDateObj.checkOutTime) || "05:00 PM"}`}</span></div>
                        </div>
                        <div className={styles.summaryCard}>
                          <h4 className={styles.summaryTitle}>Room Allocation Details</h4>
                          <div className={styles.summaryRow}><span className={styles.summaryLabel}>Food Providing</span><span className={styles.summaryValue}>{petDaycareApp.foodProviding || "No"}</span></div>
                          <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Room</span><span className={styles.summaryValue}>{dcDateObj.assignedRoom || "N/A"}</span></div>
                          <div className={styles.summaryRow}><span className={styles.summaryLabel}>Room Rate</span><span className={styles.summaryValue}>{currencySymbol} {Math.round(daycareRoomPrice)}</span></div>
                        </div>

                        {daycareAddonNames.length > 0 && (
                          <div className={styles.summaryCard}>
                            <h4 className={styles.summaryTitle}>Addon's</h4>
                            <div className={styles.summaryRow}>
                              <span className={styles.summaryLabel}>Service Type</span>
                              <span className={styles.summaryValue}>Daycare</span>
                            </div>
                            <div className={styles.summaryRow}>
                              <span className={styles.summaryLabel}>Addon's</span>
                              <span className={styles.summaryValue}>
                                {daycareAddonNames.join(", ")}
                              </span>
                            </div>
                            <div className={styles.summaryRow}>
                              <span className={styles.summaryLabel}>Quantity</span>
                              <span className={styles.summaryValue}>
                                {String(daycareAddonNames.length).padStart(2, "0")}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className={styles.summaryCard}>
                          <h4 className={styles.summaryTitle}>Daycare Cost Details</h4>
                          <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Room Rate</span>
                            <span className={styles.summaryValue}>{currencySymbol} {Math.round(daycareRoomPrice)}</span>
                          </div>
                          <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Food</span>
                            <span className={styles.summaryValue}>{currencySymbol} 0</span>
                          </div>
                          <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Addon's</span>
                            <span className={styles.summaryValue}>{currencySymbol} {Math.round(daycareAddonPrice)}</span>
                          </div>
                          <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Total Amount</span>
                            <span className={styles.summaryValue}>{currencySymbol} {Math.round(petDaycareTotal)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Clinic Block */}
                  {serviceTypes.includes("Clinic") && (
                    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }}></span>
                        Clinic Service
                      </div>
                      <div className={styles.summaryCard}>
                        <h4 className={styles.summaryTitle}>Clinic Details</h4>
                        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{getFormattedDate(petClinicApp.appointmentDate)}</span></div>
                        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Time</span><span className={styles.summaryValue}>{petClinicApp.appointmentTime || "9:00 AM"}</span></div>
                        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Booking Type</span><span className={styles.summaryValue}>{petClinicApp.bookingType || "In-Store"}</span></div>
                        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Type of Consultation</span><span className={styles.summaryValue}>{petClinicApp.consultationReason || "General Checkup"}</span></div>
                        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Doctor</span><span className={styles.summaryValue}>{doctorName}</span></div>
                      </div>
                      <div className={styles.summaryCard}>
                        <h4 className={styles.summaryTitle}>Clinic Cost Details</h4>
                        {clinicServices.map((cItem, cIdx) => (
                          <div key={cIdx} className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>{cItem.serviceName}</span>
                            <span className={styles.summaryValue}>{currencySymbol} {Math.round(cItem.price)}</span>
                          </div>
                        ))}
                        <div className={styles.summaryRow}>
                          <span className={styles.summaryLabel}>Total Amount</span>
                          <span className={styles.summaryValue}>{currencySymbol} {Math.round(petClinicTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
                <input type="text" className={styles.input} readOnly value={`₹ ${Math.round(displayPaidAmount)}`} />
              </div>
            </div>
          </div>

          <div className={styles.costBreakdownSection}>
            <h4 className={styles.summaryTitle}>Cost Break Down details</h4>

            <div className={styles.costRow}>
              <span className={styles.costLabel}>Total</span>
              <strong>₹ {Math.round(displaySubTotal)}</strong>
            </div>

            <div className={styles.costRow}>
              <span className={styles.costLabel}>Whole Tax Details</span>
              <strong>₹ {Math.round(displayTaxAmount)}</strong>
            </div>

            <div className={styles.costRow}>
              <span className={styles.costLabel}>Whole Discount Details</span>
              <strong>₹ {Math.round(displayDiscountAmount)}</strong>
            </div>

            <div className={styles.costRow}>
              <span className={styles.costLabel} style={{ color: '#6c757d' }}>After Tax & Discount Total Amount</span>
              <strong>₹ {Math.round(displayTotalAmount)}</strong>
            </div>

            <h4 className={styles.summaryTitle} style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Advanced Payment Details</h4>
            <div className={styles.costRow}>
              <span className={styles.costLabel} style={{ color: '#6c757d' }}>Advanced Payment</span>
              <strong>₹ {Math.round(displayPaidAmount)}</strong>
            </div>

            <div className={styles.totalPending}>
              <span>Total Pending Amount</span>
              <span>₹ {Math.round(displayDueAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBookingDetails;

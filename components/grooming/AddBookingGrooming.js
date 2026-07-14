import React, { useState, useEffect } from "react";
import styles from "../../styles/grooming/addBooking.module.css";
import { toast } from "sonner";
import Image from "next/image";
import { customerService } from "../../services/customerService";
import useStore from "../state/useStore";
import { VENDOR_API_URL } from "../utilities/Constants";
import MultiSelectDropdown from "../MultiSelectDropdown";

// Removed mockCustomers, using dynamic fetching

const mockGroomers = Array(10).fill({
  id: "g1",
  name: "Mahendra ray",
  avatar: "https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png"
}).map((g, i) => ({ ...g, id: `g${i}` }));

const timeSlots = [
  "01:30 AM", "02:30 AM", "03:30 AM", "04:30 AM", "05:30 AM",
  "06:30 AM", "07:30 AM", "08:30 AM", "09:30 AM", "10:30 AM",
  "11:30 AM", "12:30 PM", "01:30 PM", "02:30 PM", "03:30 PM",
  "04:30 PM", "05:30 PM", "06:30 PM", "07:30 PM", "08:30 PM"
];

const AddBookingGrooming = ({ bookingId, onClose }) => {
  const [activeTab, setActiveTab] = useState("Basic Details");
  const [bookingDetails, setBookingDetails] = useState(null);
  const [customerType, setCustomerType] = useState("Existed"); // 'Existed' or 'New'
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { jwtToken, selectedBranchId } = useStore();
  const [customers, setCustomers] = useState([]);
  const [selectedPets, setSelectedPets] = useState([]);
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [newPetImagePreview, setNewPetImagePreview] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [groomersList, setGroomersList] = useState([]);

  useEffect(() => {
    if (selectedBranchId) {
      fetch(`${VENDOR_API_URL}vendor/grooming-booking/offerings/${selectedBranchId}?type=services`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "success" && data.data && data.data.services) {
            setAvailableServices(data.data.services.filter(s => s.id));
          }
        })
        .catch(err => console.error("Error fetching services:", err));

      fetch(`${VENDOR_API_URL}vendor/grooming-booking/offerings/${selectedBranchId}?type=packages`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "success" && data.data && data.data.packages) {
            setAvailablePackages(data.data.packages.filter(p => p.id));
          }
        })
        .catch(err => console.error("Error fetching packages:", err));

      fetch(`${VENDOR_API_URL}vendor-users/branch-staff?branchId=${selectedBranchId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "success" && data.data) {
            setGroomersList(data.data.filter(staff => staff.role && staff.role.toLowerCase() === 'groomer'));
          }
        })
        .catch(err => console.error("Error fetching staff:", err));
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (jwtToken) {
      customerService.getCustomers(jwtToken, selectedBranchId).then(res => {
        if (res && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.customers || res.data.content || []);
          setCustomers(list);
        }
      });
    }
  }, [jwtToken, selectedBranchId]);

  // Fetch Booking details if editing
  useEffect(() => {
    if (bookingId && jwtToken) {
      fetch(`${VENDOR_API_URL}vendor/grooming-booking/bookings/${bookingId}`, {
        headers: {
          "Authorization": `Bearer ${jwtToken}`
        }
      })
        .then(res => res.json())
        .then(res => {
          if (res.status === "success" && res.data) {
            setBookingDetails(res.data);
          }
        })
        .catch(err => console.error("Error loading booking details for edit:", err));
    }
  }, [bookingId, jwtToken]);

  // Match customer with full pet details once both bookingDetails and customer list are ready
  useEffect(() => {
    if (bookingDetails && customers.length > 0) {
      const b = bookingDetails;
      
      // Find customer in list to get the pets array
      const matchedCustomer = customers.find(c => (c.id == b.customerId || c.vendorCustomerId == b.customerId));
      if (matchedCustomer) {
        setSelectedCustomer(matchedCustomer);
        setCustomerType("Existed");
      } else if (b.customer) {
        setSelectedCustomer({
          id: b.customer.vendorCustomerId || b.customerId,
          vendorCustomerId: b.customer.vendorCustomerId,
          customerId: b.customer.vendorCustomerId,
          firstName: b.customer.firstName,
          lastName: b.customer.lastName,
          phoneNumber: b.customer.phoneNumber,
          pets: b.customer.pets || []
        });
        setCustomerType("Existed");
      }

      const fetchedPets = [];
      const details = {};
      b.appointments?.forEach(app => {
        app.pets?.forEach(pet => {
          const petProfile = pet.petProfile || {};
          const pId = pet.customerPetId || petProfile.petId;
          fetchedPets.push({
            id: pId,
            vendorCustomerPetId: pId,
            petId: pId,
            petName: petProfile.petName || pet.petName || "Unnamed",
            breed: petProfile.breed || "N/A",
            photo: petProfile.photo
          });
          const srv = pet.services?.[0] || {};
          const hours = Math.floor((pet.durationMinutes || 60) / 60);
          const minutes = (pet.durationMinutes || 60) % 60;
          
          const formatTime = (timeStr) => {
            if (!timeStr) return "";
            const [h, m] = timeStr.split(':');
            const hr = parseInt(h);
            const ampm = hr >= 12 ? "PM" : "AM";
            const hr12 = hr % 12 || 12;
            return `${String(hr12).padStart(2, '0')}:${m} ${ampm}`;
          };
          const displaySlotTime = app.startTime && app.endTime ? `${formatTime(app.startTime)} - ${formatTime(app.endTime)}` : "";

          details[pId] = {
            groomingType: srv.serviceType === "Package" ? "Package" : (srv.serviceType === "Subscription" ? "Subscription" : "Services"),
            selectedPackage: srv.selectedPackage || "",
            serviceType: srv.serviceType || "Individual",
            selectedServices: srv.selectedServices || [],
            assignedGroomer: app.groomerID || "",
            appointmentDate: app.appointmentDate || "",
            selectedSlotId: app.slotId || "",
            selectedTime: displaySlotTime,
            startTime: app.startTime || "",
            endTime: app.endTime || "",
            unassigned: app.isUnassigned || false,
            hours: String(hours),
            minutes: String(minutes),
            bufferTime: String(pet.bufferMinutes !== undefined && pet.bufferMinutes !== null ? pet.bufferMinutes : 0),
            petConditionNotes: pet.petConditionNotes || "Mild skin allergies."
          };
        });
      });
      setSelectedPets(fetchedPets);
      setPetServiceDetails(details);

      setTaxToggled(parseFloat(b.taxAmount) > 0);
      if (parseFloat(b.subTotal) > 0) {
        setTaxPercentInput(String(Math.round(parseFloat(b.taxAmount) / parseFloat(b.subTotal) * 100)));
        setDiscountPercentInput(String(Math.round(parseFloat(b.discountAmount) / parseFloat(b.subTotal) * 100)));
      }
      setDiscountToggled(parseFloat(b.discountAmount) > 0);
      setPaidAmount(String(Math.round(parseFloat(b.paidAmount))));
      setRoundOffToggled(true);
    }
  }, [bookingDetails, customers]);

  // Service Details State (mapping pet index/id to state object)
  const [petServiceDetails, setPetServiceDetails] = useState({});
  const [petSlotsData, setPetSlotsData] = useState({});

  const [taxToggled, setTaxToggled] = useState(false);
  const [discountToggled, setDiscountToggled] = useState(false);
  const [taxPercentInput, setTaxPercentInput] = useState("0");
  const [discountPercentInput, setDiscountPercentInput] = useState("0");
  const [roundOffToggled, setRoundOffToggled] = useState(false);
  const [paidAmount, setPaidAmount] = useState("0");

  const getSelectedServicesWithDetails = () => {
    const list = [];
    selectedPets.forEach((pet, idx) => {
      const petId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
      const petState = petServiceDetails[petId];
      if (petState) {
        if (petState.groomingType === "Package" && petState.selectedPackage) {
          const pkg = availablePackages.find(p => p.id === petState.selectedPackage);
          if (pkg) {
            list.push({
              id: pkg.id,
              petName: pet.petName,
              serviceName: pkg.serviceName || pkg.packageName || "Package",
              price: Number(pkg.discountPrice !== undefined && pkg.discountPrice !== null ? pkg.discountPrice : pkg.price) || 0,
              discountPercentage: Number(pkg.discountPercentage) || 0,
              discountPrice: Number(pkg.discountPrice) || 0,
              taxPercentage: Number(pkg.taxPercentage) || Number(pkg.tax) || 0
            });
          }
        }
        if (petState.selectedServices) {
          petState.selectedServices.forEach(sId => {
            const service = availableServices.find(s => s.id === sId);
            if (service) {
              const pkg = petState.selectedPackage ? availablePackages.find(p => p.id === petState.selectedPackage) : null;
              const isIncludedInPkg = pkg && pkg.services?.filter(Boolean).includes(sId);
              list.push({
                id: service.id,
                petName: pet.petName,
                serviceName: Array.isArray(service.serviceName) ? service.serviceName.join(", ") : service.serviceName,
                price: isIncludedInPkg ? 0 : (Number(service.price) || 0),
                isIncludedInPkg: !!isIncludedInPkg,
                discountPercentage: isIncludedInPkg ? 0 : (Number(service.discountPercentage) || 0),
                discountPrice: isIncludedInPkg ? 0 : (Number(service.discountPrice) || 0),
                taxPercentage: isIncludedInPkg ? 0 : (Number(service.taxPercentage) || Number(service.tax) || 0)
              });
            }
          });
        }
      }
    });
    return list;
  };

  const handlePackageChange = (petId, packageId) => {
    const pkg = availablePackages.find(p => p.id === packageId);
    let calculatedHours = "";
    let calculatedMinutes = "";
    if (pkg && pkg.duration) {
      calculatedHours = String(Math.floor(Number(pkg.duration) / 60));
      calculatedMinutes = String(Number(pkg.duration) % 60);
    }
    setPetServiceDetails(prev => {
      const currentState = prev[petId] || {
        assignedGroomer: "",
        unassigned: false,
        selectedTime: "",
        groomingType: "Package",
        selectedServices: [],
        serviceType: [],
        hours: "",
        minutes: "",
        bufferTime: ""
      };
      return {
        ...prev,
        [petId]: {
          ...currentState,
          selectedPackage: packageId,
          selectedServices: pkg?.services?.filter(Boolean) || currentState.selectedServices || [],
          hours: calculatedHours || currentState.hours || "",
          minutes: calculatedMinutes || currentState.minutes || ""
        }
      };
    });
  };

  const convertTimeTo24h = (timeStr) => {
    if (!timeStr) return "10:00:00";
    const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return timeStr;
    let [_, h, m, meridiem] = match;
    let hours = parseInt(h);
    if (meridiem.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${m}:00`;
  };

  useEffect(() => {
    const services = getSelectedServicesWithDetails();
    if (services.length > 0) {
      if (taxToggled) {
        const serviceTax = services.find(s => s.taxPercentage > 0)?.taxPercentage || 0;
        setTaxPercentInput(String(serviceTax));
      } else {
        setTaxPercentInput("0");
      }
      if (discountToggled) {
        const serviceDiscount = services.find(s => s.discountPercentage > 0)?.discountPercentage || 0;
        setDiscountPercentInput(String(serviceDiscount));
      } else {
        setDiscountPercentInput("0");
      }
    }
  }, [taxToggled, discountToggled, petServiceDetails, selectedPets, availableServices]);


  useEffect(() => {
    selectedPets.forEach((pet, idx) => {
      const petId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
      const petState = petServiceDetails[petId];
      if (petState && petState.appointmentDate && petState.assignedGroomer && !petState.unassigned) {
        const cacheKey = `${petState.appointmentDate}_${petState.assignedGroomer}`;
        if (!petSlotsData[petId] || petSlotsData[petId].cacheKey !== cacheKey) {
          fetch(`${VENDOR_API_URL}vendor/grooming-booking/slots/branch/${selectedBranchId}?date=${petState.appointmentDate}&groomerID=${petState.assignedGroomer}`)
            .then(res => res.json())
            .then(data => {
              if (data.status === "success" && data.data) {
                setPetSlotsData(prev => ({
                  ...prev,
                  [petId]: { cacheKey, slots: data.data }
                }));
              }
            })
            .catch(err => console.error("Error fetching slots", err));
        }
      }
    });
  }, [petServiceDetails, selectedPets, selectedBranchId, petSlotsData]);

  const getPetState = (petId) => {
    return petServiceDetails[petId] || {
      assignedGroomer: "",
      unassigned: false,
      selectedTime: "",
      groomingType: "Services",
      selectedServices: [],
      hours: "",
      minutes: "",
      bufferTime: "",
      appointmentDate: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })()
    };
  };

  const updatePetState = (petId, field, value) => {
    setPetServiceDetails(prev => {
      const currentState = prev[petId] || {
        assignedGroomer: "",
        unassigned: false,
        selectedTime: "",
        groomingType: "Services",
        selectedServices: [],
        serviceType: [],
        hours: "",
        minutes: "",
        bufferTime: "0",
        appointmentDate: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })()
      };
      return {
        ...prev,
        [petId]: {
          ...currentState,
          [field]: value
        }
      };
    });
  };

  const handleServicesChange = (petId, ids) => {
    const selectedServicesData = availableServices.filter(s => ids.includes(s.id));
    const totalDuration = selectedServicesData.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    
    const calculatedHours = Math.floor(totalDuration / 60);
    const calculatedMinutes = totalDuration % 60;
    
    const hasApiBufferTime = selectedServicesData.some(s => s.bufferTime !== undefined && s.bufferTime !== null && s.bufferTime !== "");
    const apiBufferTime = hasApiBufferTime ? selectedServicesData.reduce((sum, s) => sum + (Number(s.bufferTime) || 0), 0) : "";

    setPetServiceDetails(prev => {
      const currentState = prev[petId] || {
        assignedGroomer: "",
        unassigned: false,
        selectedTime: "",
        groomingType: "Services",
        selectedServices: [],
        serviceType: [],
        hours: "",
        minutes: "",
        bufferTime: ""
      };
      
      return {
        ...prev,
        [petId]: {
          ...currentState,
          selectedServices: ids,
          hours: totalDuration > 0 ? calculatedHours : "",
          minutes: totalDuration > 0 ? calculatedMinutes : "",
          bufferTime: hasApiBufferTime ? apiBufferTime : (currentState.bufferTime || "0")
        }
      };
    });
  };

  const handleNext = async () => {
    if (activeTab === "Basic Details") {
      setActiveTab("Service Details");
    } else if (activeTab === "Service Details") {
      setActiveTab("Service Agreement");
    } else if (activeTab === "Service Agreement") {
      try {
        const firstPetId = selectedPets[0]?.id || selectedPets[0]?.vendorCustomerPetId || selectedPets[0]?.petId || 0;
        const firstPetState = petServiceDetails[firstPetId] || {};
        
        const selectedServicesList = getSelectedServicesWithDetails();
        const baseTotal = selectedServicesList.reduce((sum, item) => sum + item.price, 0);

        const taxPercent = taxToggled ? (parseFloat(taxPercentInput) || 0) : 0;
        const taxAmount = Math.round(baseTotal * taxPercent / 100);
        const afterTaxTotal = baseTotal + taxAmount;

        const discountPercent = discountToggled ? (parseFloat(discountPercentInput) || 0) : 0;
        const discountAmount = Math.round(afterTaxTotal * discountPercent / 100);
        const unroundedTotal = afterTaxTotal - discountAmount;

        const finalTotal = roundOffToggled ? Math.round(unroundedTotal) : unroundedTotal;
        const parsedPaidAmount = parseFloat(paidAmount) || 0;

        const payload = {
          customerId: selectedCustomer?.id || selectedCustomer?.vendorCustomerId || selectedCustomer?.customerId || 10,
          branchId: parseInt(selectedBranchId),
          serviceType: "Grooming",
          bookingSource: "Walk-in",
          bookingMode: firstPetState.bookingMode || "AtStore",
          notes: firstPetState.notes || "Special care needed around ears.",
          createdBy: 1,
          appointment: {
            slotId: firstPetState.selectedSlotId || 25,
            groomerID: firstPetState.assignedGroomer ? parseInt(firstPetState.assignedGroomer) : 5,
            appointmentDate: firstPetState.appointmentDate,
            startTime: firstPetState.startTime || "10:00:00",
            endTime: firstPetState.endTime || "11:00:00",
            agreementType: "None"
          },
          pets: selectedPets.map((pet, idx) => {
            const petId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
            const petState = petServiceDetails[petId] || {};
            const petServices = petState.selectedServices || [];
            const servicesWithDetails = getSelectedServicesWithDetails().filter(s => 
              petServices.includes(s.id) || (petState.selectedPackage && s.id === petState.selectedPackage)
            );
            const petBasePrice = servicesWithDetails.reduce((sum, s) => sum + s.price, 0);
            
            return {
              customerPetId: pet.id || pet.vendorCustomerPetId || pet.petId || 12,
              groomerID: petState.assignedGroomer ? parseInt(petState.assignedGroomer) : 5,
              slotId: petState.selectedSlotId || 25,
              petConditionNotes: petState.petConditionNotes || "Mild skin allergies.",
              durationMinutes: (parseInt(petState.hours) * 60 + parseInt(petState.minutes)) || 60,
              bufferMinutes: petState.bufferTime !== undefined && petState.bufferTime !== null && petState.bufferTime !== "" ? parseInt(petState.bufferTime) : 0,
              sequenceOrder: idx + 1,
              services: {
                serviceType: petState.groomingType === "Package" ? "Package" : (petState.groomingType === "Subscription" ? "Subscription" : "Individual"),
                selectedServices: petServices,
                selectedPackage: petState.groomingType === "Package" || petState.groomingType === "Subscription" ? petState.selectedPackage || null : null,
                selectedSubscription: null,
                addOns: [],
                basePrice: petBasePrice,
                discountAmount: 0,
                price: petBasePrice
              }
            };
          }),
          subTotal: baseTotal,
          discountAmount: discountAmount,
          taxAmount: taxAmount,
          totalAmount: finalTotal,
          paidAmount: parsedPaidAmount,
          paymentMethod: "Cash"
        };

        const url = bookingId 
          ? `${VENDOR_API_URL}vendor/grooming-booking/bookings/${bookingId}` 
          : `${VENDOR_API_URL}vendor/grooming-booking/bookings`;
        const method = bookingId ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwtToken}`
          },
          body: JSON.stringify(payload)
        });
        const resData = await response.json();
        if (resData.status === "success" || resData.message === "success") {
          toast.success(bookingId ? "Booking updated successfully!" : "Booking created successfully!");
          onClose();
        } else {
          toast.error("Failed to save booking: " + (resData.message || "Unknown error"));
        }
      } catch (err) {
        console.error("Error creating booking:", err);
        toast.error("Error creating booking. Please try again.");
      }
    }
  };

  const handleBack = () => {
    if (activeTab === "Service Agreement") setActiveTab("Service Details");
    else if (activeTab === "Service Details") setActiveTab("Basic Details");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Book a slot</h2>
        <div className={styles.controls}>
          <button className={styles.iconBtn}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg></button>
          <button className={styles.iconBtn}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></button>
          <button className={styles.iconBtn} onClick={onClose}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
        </div>
      </header>

      <div className={styles.tabs}>
        {["Basic Details", "Service Details", "Service Agreement"].map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === "Basic Details" && (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h3 className={styles.sectionTitle}>Customer Details</h3>
              <div className={styles.card}>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="customerType" value="Existed" className={styles.radioInput} checked={customerType === "Existed"} onChange={() => setCustomerType("Existed")} />
                    Existed Customer
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="customerType" value="New" className={styles.radioInput} checked={customerType === "New"} onChange={() => setCustomerType("New")} />
                    New Customer
                  </label>
                </div>

                {customerType === "Existed" ? (
                  <>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Customer Name</label>
                        <div className={styles.dropdownWrapper}>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Search or choose customer..."
                            value={showCustomerDropdown ? customerSearchText : (selectedCustomer ? (selectedCustomer.firstName + ' ' + (selectedCustomer.lastName || '')).trim() || selectedCustomer.vendorCustomerName || selectedCustomer.name : "")}
                            onClick={() => setShowCustomerDropdown(true)}
                            onChange={(e) => {
                              setCustomerSearchText(e.target.value);
                              setShowCustomerDropdown(true);
                            }}
                          />
                          {showCustomerDropdown && (
                            <div className={styles.customerDropdown}>
                              {customers
                                .filter(c => {
                                  const name = ((c.firstName || '') + ' ' + (c.lastName || '')).toLowerCase();
                                  const phone = (c.phoneNumber || c.phone || '').toLowerCase();
                                  const search = customerSearchText.toLowerCase();
                                  return name.includes(search) || phone.includes(search);
                                })
                                .map(c => (
                                  <div
                                    key={c.id || c.vendorCustomerId}
                                    className={styles.customerItem}
                                    onClick={() => {
                                      setSelectedCustomer(c);
                                      setCustomerSearchText("");
                                      setShowCustomerDropdown(false);
                                    }}
                                  >
                                    <span>{(c.firstName + ' ' + (c.lastName || '')).trim() || c.vendorCustomerName || c.name}</span>
                                    <span style={{ color: '#666' }}>{c.phoneNumber || c.phone}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>
                          Pet Name {selectedCustomer && `(${(selectedCustomer.pets || selectedCustomer.customerPets || []).length})`}
                        </label>
                        <select
                          className={styles.select}
                          value=""
                          onChange={(e) => {
                            const petId = e.target.value;
                            if (petId) {
                              const petsList = selectedCustomer.pets || selectedCustomer.customerPets || [];
                              const pet = petsList.find(p => (p.id == petId || p.vendorCustomerPetId == petId || p.petId == petId));
                              if (pet && !selectedPets.find(sp => (sp.id || sp.vendorCustomerPetId || sp.petId) === (pet.id || pet.vendorCustomerPetId || pet.petId))) {
                                setSelectedPets([...selectedPets, pet]);
                              }
                            }
                          }}
                        >
                          <option value="">
                            {selectedPets.length > 0
                              ? selectedPets.map(pet => pet.petName || pet.name || 'Unnamed Pet').join(", ")
                              : "Choose here"}
                          </option>
                          {selectedCustomer && (selectedCustomer.pets || selectedCustomer.customerPets || []).map(pet => (
                            <option key={pet.id || pet.vendorCustomerPetId || pet.petId} value={pet.id || pet.vendorCustomerPetId || pet.petId}>
                              {pet.petName || pet.name || 'Unnamed Pet'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>First Name</label>
                      <input type="text" className={styles.input} placeholder="Enter your first name here" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Last Name</label>
                      <input type="text" className={styles.input} placeholder="Enter your last name here" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Gender</label>
                      <select className={styles.select}>
                        <option value="">Select Your Gender here</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Mobile Number</label>
                      <input type="text" className={styles.input} placeholder="Enter your number here" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email Id <span style={{ fontSize: '0.75rem', color: '#888' }}>(optional)</span></label>
                      <input type="email" className={styles.input} placeholder="Enter your id here" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Pets Section (Always visible for existed customers, or if we want it generally) */}
            {customerType === "Existed" && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 className={styles.sectionTitle}>
                  Selected pets
                  <span
                    style={{ color: '#ff4757', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                    onClick={() => setShowAddPetModal(true)}
                  >
                    ADD PET
                  </span>
                </h3>
                {selectedPets.length > 0 ? (
                  <div className={styles.card}>
                    <div className={styles.selectedPetsList}>
                      {selectedPets.map((pet, idx) => (
                        <div key={pet.id || pet.vendorCustomerPetId || pet.petId || idx} className={styles.petPill}>
                          {pet.petPhoto || pet.photo ? (
                            <img src={pet.petPhoto || pet.photo} alt="pet" className={styles.petPillImage} />
                          ) : (
                            <div className={styles.petPillPlaceholder}></div>
                          )}
                          <span className={styles.petPillName}>{(pet.petName || pet.name || 'Unknown').toUpperCase()}</span>
                          <button className={styles.petPillRemove} onClick={() => setSelectedPets(selectedPets.filter(sp => sp !== pet))}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.card} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', color: '#888' }}>
                    No pets selected
                  </div>
                )}
              </div>
            )}

            {/* Pet Details - Inline Form instead of Modal */}
            {(showAddPetModal || customerType === "New") && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 className={styles.sectionTitle}>
                  Pet Details
                  {customerType === "Existed" && (
                    <button className={styles.iconBtn} onClick={() => setShowAddPetModal(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  )}
                </h3>
                <div className={styles.card}>
                  <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div
                      style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: '#f5f5f5', border: '1px dashed #ccc',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        overflow: 'hidden', cursor: 'pointer', position: 'relative'
                      }}
                      onClick={() => document.getElementById('petImageInput').click()}
                    >
                      {newPetImagePreview ? (
                        <img src={newPetImagePreview} alt="Pet Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '24px', color: '#aaa' }}>+</span>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        id="petImageInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setNewPetImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      <label htmlFor="petImageInput" style={{ color: '#ff4757', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'underline' }}>
                        Upload Pet Photo
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Name</label>
                      <input type="text" className={styles.input} placeholder="Enter your pet name here" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Breed</label>
                      <select className={styles.select}>
                        <option value="">Choose your pet Breed here</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Type</label>
                      <select className={styles.select}>
                        <option value="">Choose your pet Type here</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Gender</label>
                      <select className={styles.select}>
                        <option value="">Choose your pet Gender here</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Age</label>
                      <select className={styles.select}>
                        <option value="">Choose your pet Age here</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Size</label>
                      <select className={styles.select}>
                        <option value="">Choose your pet Size here</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "Service Details" && (
          <>
            {selectedPets.length === 0 ? (
              <div className={styles.card} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                Please select at least one pet from the Basic Details tab first.
              </div>
            ) : (
              selectedPets.map((pet, idx) => {
                const petId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
                const petState = getPetState(petId);
                const petSelectedServicesData = availableServices.filter(s => petState.selectedServices?.includes(s.id));
                const petHasApiBufferTime = petSelectedServicesData.some(s => s.bufferTime !== undefined && s.bufferTime !== null && s.bufferTime !== "");
                const petApiBufferTime = petHasApiBufferTime ? petSelectedServicesData.reduce((sum, s) => sum + (Number(s.bufferTime) || 0), 0) : 0;
                const isFirst = idx === 0;

                return (
                  <div key={petId} style={{ marginBottom: '3rem' }}>
                    <h3 className={styles.sectionTitle}>
                      {(pet.petName || pet.name || 'Unnamed Pet').toUpperCase()} Booking Details
                    </h3>
                    <div className={styles.card}>
                      <div className={styles.formGroup} style={{ maxWidth: '400px', marginBottom: '2rem' }}>
                        {/* <label className={styles.label}>Service Type</label> */}
                        <MultiSelectDropdown
                          heading="Service Type"
                          listItems={[
                            { id: "Grooming", name: "Grooming" },
                            { id: "Day Care", name: "Day Care" },
                            { id: "Clinic", name: "Clinic" }
                          ]}
                          selectedIds={petState.serviceType || []}
                          setSelectedIds={(ids) => updatePetState(petId, 'serviceType', ids)}
                        />
                      </div>

                      <h3 className={`${styles.sectionTitle} ${styles.sectionTitleRed}`}>
                        Grooming Details
                        <button className={styles.iconBtn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                      </h3>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label className={styles.label} style={{ display: 'block', marginBottom: '1rem' }}>Assigned Groomer for the service</label>
                        <div className={styles.groomerGrid}>
                          {groomersList.length > 0 ? groomersList.map(g => (
                            <div
                              key={g.userId}
                              className={`${styles.groomerChip} ${petState.assignedGroomer === g.userId && !petState.unassigned ? styles.groomerChipActive : ""}`}
                              onClick={() => {
                                updatePetState(petId, 'assignedGroomer', g.userId);
                                updatePetState(petId, 'unassigned', false);
                              }}
                            >
                              <Image src="https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png" width={32} height={32} className={styles.avatar} alt="Avatar" />
                              {g.staffName}
                            </div>
                          )) : <div style={{ color: '#888', fontSize: '14px', fontStyle: 'italic' }}>No groomers found for this branch.</div>}
                        </div>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" checked={petState.unassigned} onChange={(e) => updatePetState(petId, 'unassigned', e.target.checked)} />
                          Mark it as unassigned
                        </label>
                      </div>

                      <div className={styles.formGrid} style={{ marginBottom: '2rem' }}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Booking Type</label>
                          <select className={styles.select}>
                            <option value="In House Grooming">In House Grooming</option>
                            <option value="In Store Grooming">In Store Grooming</option>
                            <option value="Mobile Grooming">Mobile Grooming</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Appointment Date</label>
                          <input 
                            type="date" 
                            className={styles.input} 
                            value={petState.appointmentDate || ""}
                            min={(() => {
                              const d = new Date();
                              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                            })()}
                            max={(() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 6);
                              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                            })()}
                            onChange={(e) => updatePetState(petId, 'appointmentDate', e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: '2rem' }}>
                        <label className={styles.label} style={{ display: 'block', marginBottom: '1rem' }}>Select Appointment Time Slots</label>
                        <div className={styles.timeGrid}>
                          {petSlotsData[petId]?.slots ? (
                            petSlotsData[petId].slots.map(slot => {
                              const [h, m] = slot.startTime.split(':');
                              const isPM = parseInt(h) >= 12;
                              const displayH = (parseInt(h) % 12) || 12;
                              const formattedTime = `${String(displayH).padStart(2, '0')}:${m} ${isPM ? 'PM' : 'AM'}`;
                              const isFull = slot.status === 'Full';
                              return (
                                <button
                                  key={slot.slotID}
                                  className={`${styles.timeBtn} ${petState.selectedTime === formattedTime ? styles.timeBtnActive : ""}`}
                                  style={isFull ? { borderColor: 'red', color: 'red', background: '#ffe6e6', cursor: 'not-allowed' } : {}}
                                  disabled={isFull}
                                  onClick={() => {
                                    if (!isFull) {
                                      updatePetState(petId, 'selectedTime', formattedTime);
                                      updatePetState(petId, 'selectedSlotId', slot.slotID);
                                      updatePetState(petId, 'startTime', slot.startTime);
                                      updatePetState(petId, 'endTime', slot.endTime);
                                    }
                                  }}
                                >
                                  {formattedTime}
                                </button>
                              );
                            })
                          ) : (
                            timeSlots.map(time => (
                              <button
                                key={time}
                                className={`${styles.timeBtn} ${petState.selectedTime === time ? styles.timeBtnActive : ""}`}
                                onClick={() => {
                                  updatePetState(petId, 'selectedTime', time);
                                  const startTime = convertTimeTo24h(time);
                                  const [h, m, s] = startTime.split(':');
                                  let endHours = (parseInt(h) + 1) % 24;
                                  const endTime = `${String(endHours).padStart(2, '0')}:${m}:${s}`;
                                  updatePetState(petId, 'startTime', startTime);
                                  updatePetState(petId, 'endTime', endTime);
                                }}
                              >
                                {time}
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <div style={{ marginBottom: '2rem' }}>
                        <label className={styles.label} style={{ display: 'block', marginBottom: '1rem' }}>Grooming Type</label>
                        <div className={styles.radioGroup}>
                          <label className={styles.radioLabel}>
                            <input type="radio" name={`groomingType-${petId}`} value="Services" className={styles.radioInput} checked={petState.groomingType === "Services"} onChange={() => updatePetState(petId, 'groomingType', "Services")} />
                            Services
                          </label>
                          <label className={styles.radioLabel}>
                            <input type="radio" name={`groomingType-${petId}`} value="Package" className={styles.radioInput} checked={petState.groomingType === "Package"} onChange={() => updatePetState(petId, 'groomingType', "Package")} />
                            Package
                          </label>
                          <label className={styles.radioLabel}>
                            <input type="radio" name={`groomingType-${petId}`} value="Subscription" className={styles.radioInput} checked={petState.groomingType === "Subscription"} onChange={() => updatePetState(petId, 'groomingType', "Subscription")} />
                            Subscription
                          </label>
                        </div>

                        {petState.groomingType === "Services" && (
                          <div className={styles.formGroup} style={{ maxWidth: '650px' }}>
                            <label className={styles.label}>Grooming Services <span style={{ color: '#888', fontSize: '0.75rem' }}>(Multiple Selections)</span></label>
                            <MultiSelectDropdown
                              heading="Choose your services here"
                              listItems={availableServices.map(s => ({ id: s.id, name: Array.isArray(s.serviceName) ? s.serviceName.join(", ") : s.serviceName }))}
                              selectedIds={petState.selectedServices || []}
                              setSelectedIds={(ids) => handleServicesChange(petId, ids)}
                            />
                          </div>
                        )}
                        {petState.groomingType === "Package" && (
                          <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Grooming Packages</label>
                              <select 
                                className={styles.select}
                                value={petState.selectedPackage || ""}
                                onChange={(e) => handlePackageChange(petId, e.target.value)}
                              >
                                <option value="">Choose here</option>
                                {availablePackages.map(pkg => (
                                  <option key={pkg.id} value={pkg.id}>
                                    {pkg.serviceName || pkg.packageName} (₹ {pkg.discountPrice !== undefined && pkg.discountPrice !== null ? pkg.discountPrice : pkg.price})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <MultiSelectDropdown
                                heading="Choose your services here"
                                listItems={availableServices.map(s => ({ id: s.id, name: Array.isArray(s.serviceName) ? s.serviceName.join(", ") : s.serviceName }))}
                                selectedIds={petState.selectedServices || []}
                                setSelectedIds={(ids) => handleServicesChange(petId, ids)}
                              />
                            </div>
                          </div>
                        )}
                        {petState.groomingType === "Subscription" && (
                          <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Grooming Packages</label>
                              <select 
                                className={styles.select}
                                value={petState.selectedPackage || ""}
                                onChange={(e) => handlePackageChange(petId, e.target.value)}
                              >
                                <option value="">Choose here</option>
                                {availablePackages.map(pkg => (
                                  <option key={pkg.id} value={pkg.id}>
                                    {pkg.serviceName || pkg.packageName} (₹ {pkg.discountPrice !== undefined && pkg.discountPrice !== null ? pkg.discountPrice : pkg.price})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <MultiSelectDropdown
                                heading="Choose your services here"
                                listItems={availableServices.map(s => ({ id: s.id, name: Array.isArray(s.serviceName) ? s.serviceName.join(", ") : s.serviceName }))}
                                selectedIds={petState.selectedServices || []}
                                setSelectedIds={(ids) => handleServicesChange(petId, ids)}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className={styles.label} style={{ display: 'block', marginBottom: '1rem', fontSize: '16px', fontWeight: '600', color: '#666' }}>Time taken for appointment</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'flex-start', gap: '2rem' }}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Hours</label>
                            <select
                              className={styles.select}
                              value={petState.hours !== undefined && petState.hours !== null ? petState.hours : ""}
                              onChange={(e) => updatePetState(petId, 'hours', e.target.value)}
                            >
                              <option value="">Choose Hours here</option>
                              {Array.from({ length: 15 }, (_, i) => (
                                <option key={`h-${i}`} value={i}>{String(i).padStart(2, "0")} hr</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Minutes</label>
                            <select
                              className={styles.select}
                              value={petState.minutes !== undefined && petState.minutes !== null ? petState.minutes : ""}
                              onChange={(e) => updatePetState(petId, 'minutes', e.target.value)}
                            >
                              <option value="">Choose Mins here</option>
                              {Array.from({ length: 60 }, (_, i) => i).map(m => (
                                <option key={`m-${m}`} value={m}>{String(m).padStart(2, "0")} minutes</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Add Buffer for extra time required</label>
                            {petHasApiBufferTime ? (
                              <input
                                type="text"
                                className={styles.input}
                                value={`${petApiBufferTime} minutes`}
                                readOnly
                                style={{ backgroundColor: '#f5f6fa', cursor: 'not-allowed' }}
                              />
                            ) : (
                              <input
                                type="text"
                                className={styles.input}
                                placeholder="Enter Mins here"
                                value={petState.bufferTime || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (/^\d*$/.test(val)) {
                                    updatePetState(petId, 'bufferTime', val);
                                  }
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === "Service Agreement" && (() => {
          const selectedServicesList = getSelectedServicesWithDetails();
          const baseTotal = selectedServicesList.reduce((sum, item) => sum + item.price, 0);

          const taxPercent = taxToggled ? (parseFloat(taxPercentInput) || 0) : 0;
          const taxAmount = Math.round(baseTotal * taxPercent / 100);
          const afterTaxTotal = baseTotal + taxAmount;

          const discountPercent = discountToggled ? (parseFloat(discountPercentInput) || 0) : 0;
          const discountAmount = Math.round(afterTaxTotal * discountPercent / 100);
          const unroundedTotal = afterTaxTotal - discountAmount;

          const finalTotal = roundOffToggled ? Math.round(unroundedTotal) : unroundedTotal;
          const roundOffValue = (finalTotal - unroundedTotal).toFixed(2);
          const parsedPaidAmount = parseFloat(paidAmount) || 0;
          const pendingAmount = Math.max(0, finalTotal - parsedPaidAmount);

          const firstPetId = selectedPets[0]?.id || selectedPets[0]?.vendorCustomerPetId || selectedPets[0]?.petId || 0;
          const firstPetState = petServiceDetails[firstPetId] || {};
          const firstGroomer = groomersList.find(g => g.userId === firstPetState.assignedGroomer);

          return (
            <div>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <h4 className={styles.summaryTitle}>Customer Details</h4>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Customer Name</span>
                    <span className={styles.summaryValue}>{selectedCustomer ? ((selectedCustomer.firstName || "") + " " + (selectedCustomer.lastName || "")).trim() : "Phani Araja"}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Customer Phone Number</span>
                    <span className={styles.summaryValue}>{selectedCustomer?.phoneNumber || "+91 9347992753"}</span>
                  </div>
                </div>

                {selectedPets.length > 0 ? selectedPets.map((pet, idx) => (
                  <div key={idx} className={styles.summaryCard}>
                    <h4 className={styles.summaryTitle}>Pet {idx + 1} Details</h4>
                    <div className={styles.petAvatarWrapper}>
                      <Image src={pet.photo || "https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png"} width={40} height={40} alt="Pet" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                      <span className={styles.summaryValue}>{(pet.petName || 'Unnamed').toUpperCase()}</span>
                    </div>
                  </div>
                )) : (
                  <div className={styles.summaryCard}>
                    <h4 className={styles.summaryTitle}>Pet One Details</h4>
                    <div className={styles.petAvatarWrapper}>
                      <Image src="https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png" width={40} height={40} alt="Pet" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                      <span className={styles.summaryValue}>VICTORIA</span>
                    </div>
                  </div>
                )}

                <div className={styles.summaryCard}>
                  <h4 className={styles.summaryTitle}>Grooming Details</h4>
                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{firstPetState.appointmentDate || "22/05/2026"}</span></div>
                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Time</span><span className={styles.summaryValue}>{firstPetState.selectedTime || "9:00 AM"}</span></div>
                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Booking Type</span><span className={styles.summaryValue}>{firstPetState.bookingMode || "In House Grooming"}</span></div>
                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Type</span><span className={styles.summaryValue}>Service</span></div>
                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Groomer</span><span className={styles.summaryValue}>{firstGroomer ? firstGroomer.staffName : "Unassigned"}</span></div>
                </div>

                <div className={styles.summaryCard}>
                  <h4 className={styles.summaryTitle}>Grooming Cost Details</h4>
                  {selectedServicesList.map((item, idx) => (
                    <div key={idx} className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>{item.serviceName}</span>
                      <span className={styles.summaryValue}>{item.isIncludedInPkg ? "" : `₹ ${item.price}`}</span>
                    </div>
                  ))}
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Total Amount</span>
                    <span className={styles.summaryValue}>₹ {baseTotal}</span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryGrid} style={{ alignItems: 'flex-start' }}>
                <div className={styles.paymentSection}>
                  <h4 className={styles.summaryTitle} style={{ fontSize: '0.85rem', color: '#666' }}>Payment Details</h4>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Payment Type</label>
                      <select className={styles.select}>
                        <option>Cash</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Paid Amount</label>
                      <input 
                        type="number" 
                        className={styles.input} 
                        value={paidAmount} 
                        onChange={(e) => setPaidAmount(e.target.value)} 
                      />
                    </div>
                  </div>
                  <button className={styles.addPetBtn} style={{ alignSelf: 'flex-start', marginTop: '1rem', fontSize: '0.75rem' }}>+ADD ANOTHER PAYMENT</button>
                </div>

                <div className={styles.costBreakdownSection}>
                  <h4 className={styles.summaryTitle}>Cost Break Down details</h4>

                  <div className={styles.costRow}>
                    <span className={styles.costLabel}>Total</span>
                    <strong>₹ {baseTotal}</strong>
                  </div>

                  <div className={styles.costRow}>
                    <span className={styles.costLabel}>Whole Tax Details</span>
                    <div className={styles.toggleWrapper}>
                      <input 
                        type="checkbox" 
                        className={styles.toggle} 
                        checked={taxToggled} 
                        onChange={(e) => setTaxToggled(e.target.checked)} 
                      />
                    </div>
                  </div>

                  <div className={styles.costRow}>
                    <span className={styles.costLabel} style={{ color: '#6c757d' }}>Tax in % percentage</span>
                    <input 
                      type="text" 
                      className={styles.costInput} 
                      value={taxPercentInput + "%"} 
                      onChange={(e) => {
                        const val = e.target.value.replace('%', '');
                        if (/^\d*$/.test(val)) setTaxPercentInput(val);
                      }} 
                    />
                  </div>

                  <div className={styles.costRow}>
                    <span className={styles.costLabel} style={{ color: '#6c757d' }}>After Tax Total Amount</span>
                    <strong>₹ {afterTaxTotal}</strong>
                  </div>

                  <div className={styles.costRow}>
                    <span className={styles.costLabel}>Whole Discount Details</span>
                    <div className={styles.toggleWrapper}>
                      <input 
                        type="checkbox" 
                        className={styles.toggle} 
                        checked={discountToggled} 
                        onChange={(e) => setDiscountToggled(e.target.checked)} 
                      />
                    </div>
                  </div>

                  <div className={styles.costRow}>
                    <span className={styles.costLabel} style={{ color: '#6c757d' }}>Discount in % percentage</span>
                    <input 
                      type="text" 
                      className={styles.costInput} 
                      value={discountPercentInput + "%"} 
                      onChange={(e) => {
                        const val = e.target.value.replace('%', '');
                        if (/^\d*$/.test(val)) setDiscountPercentInput(val);
                      }} 
                    />
                  </div>

                  <div className={styles.costRow}>
                    <span className={styles.costLabel} style={{ color: '#6c757d' }}>After Tax & Discount Total Amount</span>
                    <strong>₹ {finalTotal}</strong>
                  </div>

                  <div className={styles.costRow}>
                    <span className={styles.costLabel} style={{ color: '#6c757d' }}>Round Off</span>
                    <div className={styles.toggleWrapper}>
                      <input 
                        type="checkbox" 
                        className={styles.checkboxInput} 
                        checked={roundOffToggled} 
                        onChange={(e) => setRoundOffToggled(e.target.checked)} 
                      />
                      <input 
                        type="text" 
                        className={styles.costInput} 
                        value={roundOffValue} 
                        readOnly 
                        style={{ marginLeft: '1rem' }} 
                      />
                    </div>
                  </div>

                  <h4 className={styles.summaryTitle} style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Advanced Payment Details</h4>
                  <div className={styles.costRow}>
                    <span className={styles.costLabel} style={{ color: '#6c757d' }}>Advanced Payment</span>
                    <strong>₹ {parsedPaidAmount}</strong>
                  </div>

                  <div className={styles.totalPending}>
                    <span>Total Pending Amount</span>
                    <span>₹ {pendingAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className={styles.footer}>
        <button className={styles.btnSecondary} onClick={handleBack} disabled={activeTab === "Basic Details"}>
          Back
        </button>
        <button className={styles.btnPrimary} onClick={handleNext}>
          {activeTab === "Service Agreement" ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default AddBookingGrooming;

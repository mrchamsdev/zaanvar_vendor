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
  const [doctorsList, setDoctorsList] = useState([]);
  const [newCustomerDetails, setNewCustomerDetails] = useState({ firstName: '', lastName: '', gender: '', mobileNumber: '', email: '' });
  const [newPetDetails, setNewPetDetails] = useState({ petName: '', breed: '', petType: '', petGender: '', age: '', size: '', ageType: 'approx', years: '', months: '', dateOfBirth: '' });
  const [newPetImageFile, setNewPetImageFile] = useState(null);
  const [isSavingPet, setIsSavingPet] = useState(false);

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
            setDoctorsList(data.data.filter(staff => staff.role && staff.role.toLowerCase() === 'doctor'));
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

      const registerPetDetails = (pet, app, type) => {
        const petProfile = pet.petProfile || {};
        const pId = pet.customerPetId || petProfile.petId;

        // Add to fetched pets if not already present
        if (!fetchedPets.some(p => p.id === pId)) {
          fetchedPets.push({
            id: pId,
            vendorCustomerPetId: pId,
            petId: pId,
            petName: petProfile.petName || pet.petName || "Unnamed",
            breed: petProfile.breed || "N/A",
            photo: petProfile.photo
          });
        }

        if (!details[pId]) {
          details[pId] = {
            serviceType: [],
            hours: "1",
            minutes: "0",
            bufferTime: "0"
          };
        }

        // Add service category type
        if (!details[pId].serviceType.includes(type)) {
          details[pId].serviceType.push(type);
        }

        // Populate specific fields based on service type
        if (type === "Grooming") {
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

          Object.assign(details[pId], {
            groomingType: srv.serviceType === "Package" ? "Package" : (srv.serviceType === "Subscription" ? "Subscription" : "Services"),
            selectedPackage: srv.selectedPackage || "",
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
          });
        } else if (type === "Clinic") {
          Object.assign(details[pId], {
            clinicConsultationType: app.consultationType || "First Consultation",
            clinicAppointmentDate: app.appointmentDate || "",
            clinicAppointmentTime: app.appointmentTime || "",
            clinicBookingType: app.bookingType || "Online",
            clinicConsultationReason: app.consultationReason || "Vaccination",
            clinicHours: String(Math.floor((app.durationMinutes || 30) / 60)),
            clinicMinutes: String((app.durationMinutes || 30) % 60),
            clinicBuffer: String(app.bufferMinutes || "0"),
            clinicDoctor: app.doctorId || app.doctorID || "",
            clinicSymptoms: app.symptoms || ""
          });
        } else if (type === "Day Care") {
          Object.assign(details[pId], {
            daycareDate: app.appointmentDate || "",
            daycareCheckin: app.checkinTime || "00:00",
            daycareCheckout: app.checkoutTime || "00:00",
            daycareFood: app.foodProviding || "",
            daycareRoom: app.assignedRoom || "",
            daycareRate: String(app.roomRate || ""),
            daycareAddonServiceType: app.addonServiceType || "",
            daycareAddonName: app.addonName || "",
            daycareAddonQty: String(app.addonQty || "")
          });
        }
      };

      b.appointments?.forEach(app => {
        app.pets?.forEach(pet => registerPetDetails(pet, app, "Grooming"));
      });
      b.clinicAppointments?.forEach(app => {
        app.pets?.forEach(pet => registerPetDetails(pet, app, "Clinic"));
      });
      b.daycareAppointments?.forEach(app => {
        app.pets?.forEach(pet => registerPetDetails(pet, app, "Day Care"));
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
      if (customerType === "New") {
        if (!newCustomerDetails.firstName || !newCustomerDetails.mobileNumber) {
          toast.error("Please enter Customer First Name and Mobile Number");
          return;
        }
        if (!newPetDetails.petName) {
          toast.error("Please enter Pet Name");
          return;
        }
        const existingLocalId = selectedPets.find(p => p.isNewLocally)?.id;
        const tempPetId = existingLocalId || ("temp_" + Date.now());
        const localPet = {
          id: tempPetId,
          petName: newPetDetails.petName,
          breed: newPetDetails.breed,
          petType: newPetDetails.petType,
          gender: newPetDetails.petGender,
          size: newPetDetails.size,
          age: newPetDetails.age,
          photo: newPetImagePreview,
          isNewLocally: true,
          rawDetails: { ...newPetDetails }
        };
        setSelectedPets([localPet]);
      } else {
        if (!selectedCustomer) {
          toast.error("Please select an existed customer");
          return;
        }
        if (selectedPets.length === 0) {
          if (newPetDetails.petName) {
            const tempPetId = "temp_" + Date.now();
            const localPet = {
              id: tempPetId,
              petName: newPetDetails.petName,
              breed: newPetDetails.breed,
              petType: newPetDetails.petType,
              gender: newPetDetails.petGender,
              size: newPetDetails.size,
              age: newPetDetails.age,
              photo: newPetImagePreview,
              isNewLocally: true,
              rawDetails: { ...newPetDetails }
            };
            setSelectedPets([localPet]);
          } else {
            toast.error("Please select at least one pet");
            return;
          }
        }
      }
      setActiveTab("Service Details");
    } else if (activeTab === "Service Details") {
      const invalidPet = selectedPets.find((pet, idx) => {
        const pId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
        const pState = petServiceDetails[pId] || {};
        const isGrooming = !pState.serviceType || pState.serviceType.length === 0 || pState.serviceType.includes("Grooming");
        if (!isGrooming) return false;
        if (!pState.selectedSlotId) return true;
        const slots = petSlotsData[pId]?.slots || [];
        const slot = slots.find(s => String(s.slotID) === String(pState.selectedSlotId));
        if (slot && slot.status === 'Full') return true;
        return false;
      });
      if (invalidPet) {
        toast.error("Please select an available (non-full) appointment time slot.");
        return;
      }
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

        const dueAmount = Math.max(0, finalTotal - parsedPaidAmount);
        const paymentStatus = parsedPaidAmount >= finalTotal ? "Paid" : "Unpaid";


        const actualCustomerId = selectedCustomer?.id || selectedCustomer?.vendorCustomerId || selectedCustomer?.customerId;
        const finalSelectedPets = [...selectedPets];

        const activeServiceTypes = Array.from(new Set(
          finalSelectedPets.flatMap((pet, idx) => {
            const pId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
            const pState = petServiceDetails[pId] || {};
            return (pState.serviceType && pState.serviceType.length > 0) ? pState.serviceType : ["Grooming"];
          })
        ));

        const buildGroomingPetEntry = (pet, idx) => {
          const petId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
          const petState = petServiceDetails[petId] || {};
          const rawServices = petState.selectedServices || [];
          const petServices = rawServices.map(id => isNaN(Number(id)) ? id : Number(id));

          const servicesWithDetails = availableServices.filter(s =>
            petServices.some(id => String(id) === String(s.id))
          );

          const selectedServicesObjects = servicesWithDetails.map(s => ({
            id: isNaN(Number(s.id)) ? s.id : Number(s.id),
            name: Array.isArray(s.serviceName) ? s.serviceName.join(", ") : (s.serviceName || s.name || ""),
            price: Number(s.price) || 0
          }));

          const petBasePrice = servicesWithDetails.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

          const petEntry = {
            petName: pet.petName || pet.rawDetails?.petName || "",
            petType: pet.petType || pet.rawDetails?.petType || "Dog",
            breed: pet.breed || pet.rawDetails?.breed || "",
            gender: pet.gender || pet.petGender || pet.rawDetails?.petGender || "Male",
            petSize: pet.size || pet.rawDetails?.size || "Medium",
            approximateAge: pet.approximateAge || pet.age || pet.rawDetails?.age || "1Y 0M",
            services: {
              serviceType: petState.groomingType === "Package" ? "Package" : "Individual",
              selectedServices: selectedServicesObjects,
              basePrice: petBasePrice,
              discountAmount: 0.00,
              price: petBasePrice
            }
          };
          if (!pet.isNewLocally && petId && !String(petId).startsWith("temp_")) {
            petEntry.customerPetId = petId;
          }
          return petEntry;
        };

        const buildClinicEntries = () => {
          const entries = [];
          finalSelectedPets.forEach((pet, idx) => {
            const petId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
            const petState = petServiceDetails[petId] || {};
            if (petState.serviceType && petState.serviceType.includes("Clinic")) {
              entries.push({
                petName: pet.petName || pet.rawDetails?.petName || "",
                petType: pet.petType || pet.rawDetails?.petType || "Dog",
                breed: pet.breed || pet.rawDetails?.breed || "",
                gender: pet.gender || pet.petGender || pet.rawDetails?.petGender || "Male",
                approximateAge: pet.approximateAge || pet.age || pet.rawDetails?.age || "1Y 0M",
                doctorId: petState.clinicDoctor ? parseInt(petState.clinicDoctor) : 3,
                consultationType: petState.clinicConsultationType || "New Consultation",
                consultationCategory: petState.clinicConsultationReason || "General Checkup",
                appointmentDate: petState.clinicAppointmentDate || firstPetState.appointmentDate || "2026-07-22",
                startTime: petState.clinicAppointmentTime || "10:30:00",
                endTime: "11:00:00",
                symptoms: petState.clinicSymptoms || "Routine checkup",
                services: [
                  { id: 10, name: "General Checkup Fee", price: 400.00 }
                ]
              });
            }
          });
          return entries;
        };

        const buildDaycareObject = () => {
          const daycarePets = finalSelectedPets.filter((pet, idx) => {
            const petId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
            const petState = petServiceDetails[petId] || {};
            return petState.serviceType && petState.serviceType.includes("Day Care");
          });
          if (daycarePets.length === 0) return undefined;

          const petNames = daycarePets.map(p => p.petName || p.rawDetails?.petName || "");
          const firstDaycareState = petServiceDetails[daycarePets[0].id || daycarePets[0].vendorCustomerPetId || daycarePets[0].petId || 0] || {};

          return {
            foodProviding: firstDaycareState.daycareFood === "Yes" || true,
            instructions: "Daycare stay for pets",
            pets: petNames,
            dates: [
              {
                date: firstDaycareState.daycareDate || firstPetState.appointmentDate || "2026-07-22",
                checkInTime: firstDaycareState.daycareCheckin || "11:00:00",
                checkOutTime: firstDaycareState.daycareCheckout || "18:00:00",
                assignedRoom: firstDaycareState.daycareRoom || "Standard Room 01",
                roomRate: parseFloat(firstDaycareState.daycareRate) || 1500.00
              }
            ],
            addons: []
          };
        };

        let payload;
        if (bookingId) {
          payload = {
            status: "Booked",
            paymentStatus: paymentStatus,
            grooming: [{
              slotId: parseInt(firstPetState.selectedSlotId),
              groomerID: firstPetState.assignedGroomer ? parseInt(firstPetState.assignedGroomer) : 145,
              appointmentDate: firstPetState.appointmentDate,
              startTime: firstPetState.startTime || "09:00:00",
              endTime: firstPetState.endTime || "10:00:00",
              agreementType: "Grooming",
              pets: finalSelectedPets.map((pet, idx) => buildGroomingPetEntry(pet, idx))
            }],
            subTotal: baseTotal,
            discountAmount: discountAmount,
            taxAmount: taxAmount,
            totalAmount: finalTotal,
            paidAmount: parsedPaidAmount,
            paymentMethod: "Cash"
          };
        } else {
          payload = {
            branchId: parseInt(selectedBranchId),
            serviceType: activeServiceTypes,
            bookingSource: "Walk-in",
            bookingMode: firstPetState.bookingMode || "AtStore",
            notes: firstPetState.notes || "Booking appointment",
            createdBy: 1,
            subTotal: baseTotal,
            discountAmount: discountAmount,
            taxAmount: taxAmount,
            totalAmount: finalTotal,
            paidAmount: parsedPaidAmount,
            paymentMethod: "Cash"
          };

          if (customerType === "New") {
            payload.customer = {
              firstName: newCustomerDetails.firstName,
              lastName: newCustomerDetails.lastName,
              phoneNumber: newCustomerDetails.mobileNumber,
              email: newCustomerDetails.email,
              gender: newCustomerDetails.gender || "Male"
            };
          } else {
            payload.customerId = actualCustomerId;
          }

          if (activeServiceTypes.includes("Grooming")) {
            payload.grooming = [{
              slotId: parseInt(firstPetState.selectedSlotId),
              groomerID: firstPetState.assignedGroomer ? parseInt(firstPetState.assignedGroomer) : 145,
              appointmentDate: firstPetState.appointmentDate,
              startTime: firstPetState.startTime || "09:00:00",
              endTime: firstPetState.endTime || "10:00:00",
              agreementType: "Grooming",
              pets: finalSelectedPets.map((pet, idx) => buildGroomingPetEntry(pet, idx))
            }];
          }

          const clinicEntries = buildClinicEntries();
          if (clinicEntries.length > 0) {
            payload.clinic = clinicEntries;
          }

          const daycareObj = buildDaycareObject();
          if (daycareObj) {
            payload.daycare = daycareObj;
          }
        }

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
                    <input
                      type="radio"
                      name="customerType"
                      value="Existed"
                      className={styles.radioInput}
                      checked={customerType === "Existed"}
                      onChange={() => {
                        setCustomerType("Existed");
                        setSelectedPets([]);
                      }}
                    />
                    Existed Customer
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="customerType"
                      value="New"
                      className={styles.radioInput}
                      checked={customerType === "New"}
                      onChange={() => {
                        setCustomerType("New");
                        setSelectedCustomer(null);
                        setSelectedPets([]);
                      }}
                    />
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
                      <input type="text" className={styles.input} placeholder="Enter your first name here" value={newCustomerDetails.firstName} onChange={e => setNewCustomerDetails({...newCustomerDetails, firstName: e.target.value})} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Last Name</label>
                      <input type="text" className={styles.input} placeholder="Enter your last name here" value={newCustomerDetails.lastName} onChange={e => setNewCustomerDetails({...newCustomerDetails, lastName: e.target.value})} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Gender</label>
                      <select className={styles.select} value={newCustomerDetails.gender || ""} onChange={e => setNewCustomerDetails({...newCustomerDetails, gender: e.target.value})}>
                        <option value="">Select Your Gender here</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Mobile Number</label>
                      <input type="text" className={styles.input} placeholder="Enter your number here" value={newCustomerDetails.mobileNumber} onChange={e => setNewCustomerDetails({...newCustomerDetails, mobileNumber: e.target.value})} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email Id <span style={{ fontSize: '0.75rem', color: '#888' }}>(optional)</span></label>
                      <input type="email" className={styles.input} placeholder="Enter your id here" value={newCustomerDetails.email} onChange={e => setNewCustomerDetails({...newCustomerDetails, email: e.target.value})} />
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
                          <button className={styles.petPillRemove} onClick={() => setSelectedPets(selectedPets.filter(sp => sp !== pet))}>Ãƒâ€”</button>
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
                      <input type="text" className={styles.input} placeholder="Enter pet name" value={newPetDetails.petName} onChange={e => setNewPetDetails({...newPetDetails, petName: e.target.value})} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Type</label>
                      <select className={styles.select} value={newPetDetails.petType} onChange={e => setNewPetDetails({...newPetDetails, petType: e.target.value, breed: ''})}>
                        <option value="">Choose pet type</option>
                        <option value="Dog">Dog</option>
                        <option value="Cat">Cat</option>
                        <option value="Bird">Birds</option>
                        <option value="Fish">Fish</option>
                        <option value="Small Pet">Small Pets</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Breed</label>
                      <select className={styles.select} value={newPetDetails.breed} onChange={e => setNewPetDetails({...newPetDetails, breed: e.target.value})}>
                        <option value="">Choose pet breed</option>
                        {newPetDetails.petType === 'Dog' && (<>
                          <option value="Golden Retriever">Golden Retriever</option>
                          <option value="German Shepherd">German Shepherd</option>
                          <option value="Labrador">Labrador</option>
                          <option value="Poodle">Poodle</option>
                          <option value="Bulldog">Bulldog</option>
                        </>)}
                        {newPetDetails.petType === 'Cat' && (<>
                          <option value="Persian">Persian</option>
                          <option value="Siamese">Siamese</option>
                          <option value="Maine Coon">Maine Coon</option>
                          <option value="Bengal">Bengal</option>
                          <option value="Ragdoll">Ragdoll</option>
                        </>)}
                        {newPetDetails.petType === 'Bird' && (<>
                          <option value="Parrot">Parrot</option>
                          <option value="Cockatiel">Cockatiel</option>
                          <option value="Budgerigar">Budgerigar</option>
                          <option value="Lovebird">Lovebird</option>
                          <option value="Finch">Finch</option>
                        </>)}
                        {newPetDetails.petType === 'Fish' && (<>
                          <option value="Goldfish">Goldfish</option>
                          <option value="Betta">Betta</option>
                          <option value="Guppy">Guppy</option>
                          <option value="Molly">Molly</option>
                          <option value="Angelfish">Angelfish</option>
                        </>)}
                        {newPetDetails.petType === 'Small Pet' && (<>
                          <option value="Rabbit">Rabbit</option>
                          <option value="Guinea Pig">Guinea Pig</option>
                          <option value="Hamster">Hamster</option>
                          <option value="Ferret">Ferret</option>
                          <option value="Chinchilla">Chinchilla</option>
                        </>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Gender</label>
                      <select className={styles.select} value={newPetDetails.petGender} onChange={e => setNewPetDetails({...newPetDetails, petGender: e.target.value})}>
                        <option value="">Choose pet gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Size</label>
                      <select className={styles.select} value={newPetDetails.size} onChange={e => setNewPetDetails({...newPetDetails, size: e.target.value})}>
                        <option value="">Choose pet size</option>
                        <option value="Toy">Toy</option>
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                        <option value="Giant">Giant</option>
                      </select>
                    </div>
                  </div>

                  {/* Pet Age - Approximate or Exact */}
                  <div style={{ marginTop: '1.25rem', marginBottom: '0.5rem' }}>
                    <label className={styles.label} style={{ display: 'block', marginBottom: '0.75rem' }}>Pet Age</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                        <input type="radio" checked={newPetDetails.ageType === 'approx'} onChange={() => setNewPetDetails({...newPetDetails, ageType: 'approx'})} />
                        Approximate Age
                      </label>
                      {newPetDetails.ageType === 'approx' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                          <div>
                            <label className={styles.label}>Years</label>
                            <input type="number" min="0" className={styles.input} placeholder="0" value={newPetDetails.years} onChange={e => setNewPetDetails({...newPetDetails, years: e.target.value, age: `${e.target.value || 0}Y ${newPetDetails.months || 0}M`})} />
                          </div>
                          <div>
                            <label className={styles.label}>Months</label>
                            <input type="number" min="0" max="11" className={styles.input} placeholder="0" value={newPetDetails.months} onChange={e => setNewPetDetails({...newPetDetails, months: e.target.value, age: `${newPetDetails.years || 0}Y ${e.target.value || 0}M`})} />
                          </div>
                        </div>
                      )}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                        <input type="radio" checked={newPetDetails.ageType === 'exact'} onChange={() => setNewPetDetails({...newPetDetails, ageType: 'exact'})} />
                        Exact Age
                      </label>
                      {newPetDetails.ageType === 'exact' && (
                        <div style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', maxWidth: '300px' }}>
                          <label className={styles.label}>Date of Birth</label>
                          <input type="date" className={styles.input} value={newPetDetails.dateOfBirth} onChange={e => setNewPetDetails({...newPetDetails, dateOfBirth: e.target.value, age: e.target.value})} />
                        </div>
                      )}
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

                      {(!petState.serviceType || petState.serviceType.length === 0 || petState.serviceType.includes("Grooming")) && (
                        <div>
                          <h3 className={`${styles.sectionTitle} ${styles.sectionTitleRed}`}>
                            Grooming Details
                            <button
                              className={styles.iconBtn}
                              onClick={() => {
                                const currentTypes = petState.serviceType || [];
                                updatePetState(petId, 'serviceType', currentTypes.filter(t => t !== "Grooming"));
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
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

                                  // Check if selected by another pet in this session
                                  const isOccupiedByOther = selectedPets.some((otherPet, otherIdx) => {
                                    const otherPetId = otherPet.id || otherPet.vendorCustomerPetId || otherPet.petId || otherIdx;
                                    if (otherPetId === petId) return false;
                                    const otherState = petServiceDetails[otherPetId];
                                    if (!otherState) return false;
                                    return otherState.appointmentDate === petState.appointmentDate &&
                                      String(otherState.assignedGroomer) === String(petState.assignedGroomer) &&
                                      !otherState.unassigned &&
                                      (slot.slotID && otherState.selectedSlotId ? String(otherState.selectedSlotId) === String(slot.slotID) : otherState.startTime === slot.startTime);
                                  });

                                  let buttonStyle = {};
                                  if (isFull) {
                                    buttonStyle = { borderColor: 'red', color: 'red', background: '#ffe6e6', cursor: 'not-allowed' };
                                  } else if (isOccupiedByOther) {
                                    buttonStyle = { borderColor: '#dcdcdc', color: '#888', background: '#f0f0f0', cursor: 'not-allowed' };
                                  }

                                  return (
                                    <button
                                      key={slot.slotID}
                                      className={`${styles.timeBtn} ${petState.selectedTime === formattedTime ? styles.timeBtnActive : ""}`}
                                      style={buttonStyle}
                                      disabled={isFull || isOccupiedByOther}
                                      onClick={() => {
                                        if (!isFull && !isOccupiedByOther) {
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
                                timeSlots.map(time => {
                                  const startTime = convertTimeTo24h(time);

                                  // Check if selected by another pet in this session
                                  const isOccupiedByOther = selectedPets.some((otherPet, otherIdx) => {
                                    const otherPetId = otherPet.id || otherPet.vendorCustomerPetId || otherPet.petId || otherIdx;
                                    if (otherPetId === petId) return false;
                                    const otherState = petServiceDetails[otherPetId];
                                    if (!otherState) return false;
                                    return otherState.appointmentDate === petState.appointmentDate &&
                                      String(otherState.assignedGroomer) === String(petState.assignedGroomer) &&
                                      !otherState.unassigned &&
                                      otherState.startTime === startTime;
                                  });

                                  let buttonStyle = {};
                                  if (isOccupiedByOther) {
                                    buttonStyle = { borderColor: '#dcdcdc', color: '#888', background: '#f0f0f0', cursor: 'not-allowed' };
                                  }

                                  return (
                                    <button
                                      key={time}
                                      className={`${styles.timeBtn} ${petState.selectedTime === time ? styles.timeBtnActive : ""}`}
                                      style={buttonStyle}
                                      disabled={isOccupiedByOther}
                                      onClick={() => {
                                        if (!isOccupiedByOther) {
                                          updatePetState(petId, 'selectedTime', time);
                                          const [h, m, s] = startTime.split(':');
                                          let endHours = (parseInt(h) + 1) % 24;
                                          const endTime = `${String(endHours).padStart(2, '0')}:${m}:${s}`;
                                          updatePetState(petId, 'startTime', startTime);
                                          updatePetState(petId, 'endTime', endTime);
                                        }
                                      }}
                                    >
                                      {time}
                                    </button>
                                  );
                                })
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
                                        {pkg.serviceName || pkg.packageName} (Ã¢â€šÂ¹ {pkg.discountPrice !== undefined && pkg.discountPrice !== null ? pkg.discountPrice : pkg.price})
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
                                        {pkg.serviceName || pkg.packageName} (Ã¢â€šÂ¹ {pkg.discountPrice !== undefined && pkg.discountPrice !== null ? pkg.discountPrice : pkg.price})
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
                      )}

                      {/* Ã¢â€â‚¬Ã¢â€â‚¬ CLINIC DETAILS Ã¢â€â‚¬Ã¢â€â‚¬ */}
                      {petState.serviceType?.includes("Clinic") && (
                        <div style={{ marginTop: '2rem', borderTop: '1px solid #eaeaea', paddingTop: '2rem' }}>
                          <h3 className={`${styles.sectionTitle} ${styles.sectionTitleRed}`}>
                            Clinic Details
                            <button
                              className={styles.iconBtn}
                              onClick={() => {
                                const currentTypes = petState.serviceType || [];
                                updatePetState(petId, 'serviceType', currentTypes.filter(t => t !== "Clinic"));
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </h3>

                          <div className={styles.radioGroup} style={{ marginBottom: '1.5rem' }}>
                            <label className={styles.radioLabel}>
                              <input
                                type="radio"
                                name={`clinicConsultationType-${petId}`}
                                value="First Consultation"
                                className={styles.radioInput}
                                checked={(petState.clinicConsultationType || "First Consultation") === "First Consultation"}
                                onChange={(e) => updatePetState(petId, 'clinicConsultationType', e.target.value)}
                              />
                              First Consultation
                            </label>
                            <label className={styles.radioLabel}>
                              <input
                                type="radio"
                                name={`clinicConsultationType-${petId}`}
                                value="Followup Consultation"
                                className={styles.radioInput}
                                checked={petState.clinicConsultationType === "Followup Consultation"}
                                onChange={(e) => updatePetState(petId, 'clinicConsultationType', e.target.value)}
                              />
                              Followup Consultation
                            </label>
                          </div>

                          <div className={styles.formGrid} style={{ marginBottom: '1.5rem' }}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Appointment Date</label>
                              <input
                                type="date"
                                className={styles.input}
                                value={petState.clinicAppointmentDate || ""}
                                onChange={(e) => updatePetState(petId, 'clinicAppointmentDate', e.target.value)}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Appointment Time</label>
                              <select
                                className={styles.select}
                                value={petState.clinicAppointmentTime || ""}
                                onChange={(e) => updatePetState(petId, 'clinicAppointmentTime', e.target.value)}
                              >
                                <option value="">Select the Time</option>
                                <option value="09:00 AM">09:00 AM</option>
                                <option value="10:00 AM">10:00 AM</option>
                                <option value="11:00 AM">11:00 AM</option>
                                <option value="12:00 PM">12:00 PM</option>
                                <option value="01:00 PM">01:00 PM</option>
                                <option value="02:00 PM">02:00 PM</option>
                                <option value="03:00 PM">03:00 PM</option>
                                <option value="04:00 PM">04:00 PM</option>
                                <option value="05:00 PM">05:00 PM</option>
                              </select>
                            </div>
                          </div>

                          <div className={styles.formGrid} style={{ marginBottom: '1.5rem' }}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Booking Type</label>
                              <select
                                className={styles.select}
                                value={petState.clinicBookingType || ""}
                                onChange={(e) => updatePetState(petId, 'clinicBookingType', e.target.value)}
                              >
                                <option value="Online">Online</option>
                                <option value="In-Store">In-Store</option>
                                <option value="Home-visit">Home-visit</option>
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Type of consultation</label>
                              <select
                                className={styles.select}
                                value={petState.clinicConsultationReason || ""}
                                onChange={(e) => updatePetState(petId, 'clinicConsultationReason', e.target.value)}
                              >
                                <option value="Vaccination">Vaccination</option>
                                <option value="General Checkup">General Checkup</option>
                                <option value="Deworming">Deworming</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ marginBottom: '1.5rem' }}>
                            <h4 className={styles.label} style={{ display: 'block', marginBottom: '1rem', fontSize: '16px', fontWeight: '600', color: '#666' }}>Time taken for appointment</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'flex-start', gap: '2rem' }}>
                              <div className={styles.formGroup}>
                                <label className={styles.label}>Hours</label>
                                <select
                                  className={styles.select}
                                  value={petState.clinicHours || ""}
                                  onChange={(e) => updatePetState(petId, 'clinicHours', e.target.value)}
                                >
                                  <option value="">Choose Hours here</option>
                                  {Array.from({ length: 15 }, (_, i) => (
                                    <option key={`ch-${i}`} value={i}>{String(i).padStart(2, "0")} hr</option>
                                  ))}
                                </select>
                              </div>
                              <div className={styles.formGroup}>
                                <label className={styles.label}>Minutes</label>
                                <select
                                  className={styles.select}
                                  value={petState.clinicMinutes || ""}
                                  onChange={(e) => updatePetState(petId, 'clinicMinutes', e.target.value)}
                                >
                                  <option value="">Choose Mins here</option>
                                  {Array.from({ length: 60 }, (_, i) => i).map(m => (
                                    <option key={`cm-${m}`} value={m}>{String(m).padStart(2, "0")} minutes</option>
                                  ))}
                                </select>
                              </div>
                              <div className={styles.formGroup}>
                                <label className={styles.label}>Add Buffer for extra time required</label>
                                <select
                                  className={styles.select}
                                  value={petState.clinicBuffer || ""}
                                  onChange={(e) => updatePetState(petId, 'clinicBuffer', e.target.value)}
                                >
                                  <option value="">Choose Buffer here</option>
                                  <option value="15">15 minutes</option>
                                  <option value="30">30 minutes</option>
                                  <option value="45">45 minutes</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Doctor <span style={{ color: '#888', fontSize: '0.75rem' }}>(optional)</span></label>
                              <select
                                className={styles.select}
                                value={petState.clinicDoctor || ""}
                                onChange={(e) => updatePetState(petId, 'clinicDoctor', e.target.value)}
                              >
                                <option value="">Select Doctor</option>
                                {doctorsList.map(doc => (
                                  <option key={doc.userId} value={doc.userId}>
                                    {doc.staffName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Symptoms / Problems <span style={{ color: '#888', fontSize: '0.75rem' }}>(optional)</span></label>
                              <input
                                type="text"
                                className={styles.input}
                                placeholder="Type here..."
                                value={petState.clinicSymptoms || ""}
                                onChange={(e) => updatePetState(petId, 'clinicSymptoms', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Ã¢â€â‚¬Ã¢â€â‚¬ DAYCARE DETAILS Ã¢â€â‚¬Ã¢â€â‚¬ */}
                      {petState.serviceType?.includes("Day Care") && (
                        <div style={{ marginTop: '2rem', borderTop: '1px solid #eaeaea', paddingTop: '2rem' }}>
                          <h3 className={`${styles.sectionTitle} ${styles.sectionTitleRed}`}>
                            Daycare Details
                            <button
                              className={styles.iconBtn}
                              onClick={() => {
                                const currentTypes = petState.serviceType || [];
                                updatePetState(petId, 'serviceType', currentTypes.filter(t => t !== "Day Care"));
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </h3>

                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Appointment Date</label>
                              <input
                                type="date"
                                className={styles.input}
                                value={petState.daycareDate || ""}
                                onChange={(e) => updatePetState(petId, 'daycareDate', e.target.value)}
                              />
                            </div>
                             <div className={styles.formGroup}>
                              <label className={styles.label}>Check In Time</label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                  className={styles.select}
                                  value={(petState.daycareCheckin || "07:00 AM").split(" ")[0] || "07:00"}
                                  onChange={(e) => {
                                    const period = (petState.daycareCheckin || "07:00 AM").split(" ")[1] || "AM";
                                    updatePetState(petId, 'daycareCheckin', `${e.target.value} ${period}`);
                                  }}
                                >
                                  {["01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00"].map(h => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                                <select
                                  className={styles.select}
                                  value={(petState.daycareCheckin || "07:00 AM").split(" ")[1] || "AM"}
                                  onChange={(e) => {
                                    const hour = (petState.daycareCheckin || "07:00 AM").split(" ")[0] || "07:00";
                                    updatePetState(petId, 'daycareCheckin', `${hour} ${e.target.value}`);
                                  }}
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Check Out Time</label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                  className={styles.select}
                                  value={(petState.daycareCheckout || "05:00 PM").split(" ")[0] || "05:00"}
                                  onChange={(e) => {
                                    const period = (petState.daycareCheckout || "05:00 PM").split(" ")[1] || "PM";
                                    updatePetState(petId, 'daycareCheckout', `${e.target.value} ${period}`);
                                  }}
                                >
                                  {["01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00"].map(h => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                                <select
                                  className={styles.select}
                                  value={(petState.daycareCheckout || "05:00 PM").split(" ")[1] || "PM"}
                                  onChange={(e) => {
                                    const hour = (petState.daycareCheckout || "05:00 PM").split(" ")[0] || "05:00";
                                    updatePetState(petId, 'daycareCheckout', `${hour} ${e.target.value}`);
                                  }}
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div style={{ color: '#e9315d', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', marginBottom: '2rem', textDecoration: 'underline' }}>+ Add more</div>

                          <h4 className={styles.label} style={{ display: 'block', marginBottom: '1rem', fontSize: '15px', fontWeight: '600', color: '#555' }}>Room Allocation</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', gap: '1.5rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Food Providing</label>
                              <select
                                className={styles.select}
                                value={petState.daycareFood || ""}
                                onChange={(e) => updatePetState(petId, 'daycareFood', e.target.value)}
                              >
                                <option value="">Select food</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Assigned Room</label>
                              <select
                                className={styles.select}
                                value={petState.daycareRoom || ""}
                                onChange={(e) => updatePetState(petId, 'daycareRoom', e.target.value)}
                              >
                                <option value="">Select here</option>
                                <option value="Room A">Room A</option>
                                <option value="Room B">Room B</option>
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Room Rate</label>
                              <select
                                className={styles.select}
                                value={petState.daycareRate || ""}
                                onChange={(e) => updatePetState(petId, 'daycareRate', e.target.value)}
                              >
                                <option value="">Select rate</option>
                                <option value="500">Ã¢â€šÂ¹ 500 / day</option>
                                <option value="1000">Ã¢â€šÂ¹ 1000 / day</option>
                              </select>
                            </div>
                            <button
                              className={styles.iconBtn}
                              style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>

                          <h4 className={styles.label} style={{ display: 'block', marginBottom: '1rem', fontSize: '15px', fontWeight: '600', color: '#555' }}>Addon's</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', gap: '1.5rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Service Type</label>
                              <select
                                className={styles.select}
                                value={petState.daycareAddonServiceType || ""}
                                onChange={(e) => updatePetState(petId, 'daycareAddonServiceType', e.target.value)}
                              >
                                <option value="">Select here</option>
                                <option value="Grooming">Grooming</option>
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Addon's</label>
                              <select
                                className={styles.select}
                                value={petState.daycareAddonName || ""}
                                onChange={(e) => updatePetState(petId, 'daycareAddonName', e.target.value)}
                              >
                                <option value="">Select here</option>
                                <option value="Nail Trim">Nail Trim</option>
                                <option value="Bath">Bath</option>
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Quantity</label>
                              <select
                                className={styles.select}
                                value={petState.daycareAddonQty || ""}
                                onChange={(e) => updatePetState(petId, 'daycareAddonQty', e.target.value)}
                              >
                                <option value="">Select quantity</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                              </select>
                            </div>
                            <button
                              className={styles.iconBtn}
                              style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                          <div style={{ color: '#e9315d', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1.5rem', textDecoration: 'underline' }}>+ Add more</div>
                        </div>
                      )}
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
                    <span className={styles.summaryValue}>
                      {customerType === "New"
                        ? `${newCustomerDetails.firstName || ""} ${newCustomerDetails.lastName || ""}`.trim() || "New Customer"
                        : (selectedCustomer ? `${selectedCustomer.firstName || ""} ${selectedCustomer.lastName || ""}`.trim() || selectedCustomer.vendorCustomerName || selectedCustomer.name || "Customer" : "Customer")}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Customer Phone Number</span>
                    <span className={styles.summaryValue}>
                      {customerType === "New"
                        ? (newCustomerDetails.mobileNumber || "N/A")
                        : (selectedCustomer?.phoneNumber || selectedCustomer?.phone || "N/A")}
                    </span>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                  <div className={styles.summaryCard}>
                    <h4 className={styles.summaryTitle}>Grooming Cost Details</h4>
                    {selectedServicesList.map((item, idx) => (
                      <div key={idx} className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>{item.serviceName}</span>
                        <span className={styles.summaryValue}>{item.isIncludedInPkg ? "" : `Ã¢â€šÂ¹ ${item.price}`}</span>
                      </div>
                    ))}
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Total Amount</span>
                      <span className={styles.summaryValue}>Ã¢â€šÂ¹ {baseTotal}</span>
                    </div>
                  </div>

                  <div className={styles.costBreakdownSection}>
                    <h4 className={styles.summaryTitle}>Cost Break Down details</h4>

                    <div className={styles.costRow}>
                      <span className={styles.costLabel}>Total</span>
                      <strong>Ã¢â€šÂ¹ {baseTotal}</strong>
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
                      <strong>Ã¢â€šÂ¹ {afterTaxTotal}</strong>
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
                      <strong>Ã¢â€šÂ¹ {finalTotal}</strong>
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
                      <strong>Ã¢â€šÂ¹ {parsedPaidAmount}</strong>
                    </div>

                    <div className={styles.totalPending}>
                      <span>Total Pending Amount</span>
                      <span>Ã¢â€šÂ¹ {pendingAmount}</span>
                    </div>
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

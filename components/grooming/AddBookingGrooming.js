import React, { useState, useEffect } from "react";
import styles from "../../styles/grooming/addBooking.module.css";
import { toast } from "sonner";
import Image from "next/image";
import { customerService } from "../../services/customerService";
import useStore from "../state/useStore";
import { VENDOR_API_URL } from "../utilities/Constants";
import MultiSelectDropdown from "../MultiSelectDropdown";
import { getSettings } from "../../services/settingsService";
import useCurrencySymbol from "../utilities/useCurrencySymbol";
import { useRouter } from "next/router";

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
  const router = useRouter();
  const currencySymbol = useCurrencySymbol();
  const [activeTab, setActiveTab] = useState("Basic Details");
  const [bookingDetails, setBookingDetails] = useState(null);
  const [customerType, setCustomerType] = useState("Existed"); // 'Existed' or 'New'
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { jwtToken, selectedBranchId, userInfo } = useStore();
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
  const [configuredRooms, setConfiguredRooms] = useState([]);

  useEffect(() => {
    if (selectedBranchId) {
      const headers = jwtToken ? { "Authorization": `Bearer ${jwtToken}` } : {};

      fetch(`${VENDOR_API_URL}vendor/grooming-booking/offerings/${selectedBranchId}?type=services`, { headers })
        .then(res => res.json())
        .then(data => {
          const list = data.data?.services || (Array.isArray(data.data) ? data.data : (data.services || []));
          if (list && list.length > 0) {
            setAvailableServices(list.map((s, idx) => {
              const nameStr = Array.isArray(s.serviceName) ? s.serviceName.join(", ") : (s.serviceName || s.name || s.otherServiceName || `Service ${idx + 1}`);
              return {
                ...s,
                id: String(s.id || s._id || s.serviceId || nameStr),
                serviceName: nameStr,
                price: Number(s.price || s.priceMin || s.priceMax) || 0
              };
            }));
          } else {
            setAvailableServices([]);
          }
        })
        .catch(err => console.error("Error fetching services:", err));

      fetch(`${VENDOR_API_URL}vendor/grooming-booking/offerings/${selectedBranchId}?type=packages`, { headers })
        .then(res => res.json())
        .then(data => {
          const list = data.data?.packages || (Array.isArray(data.data) ? data.data : (data.packages || []));
          if (list && list.length > 0) {
            setAvailablePackages(list.map((p, idx) => ({
              ...p,
              id: String(p.id || p._id || p.packageId || p.packageName || p.name || `pkg_${idx}`)
            })));
          } else {
            setAvailablePackages([]);
          }
        })
        .catch(err => console.error("Error fetching packages:", err));

      fetch(`${VENDOR_API_URL}vendor-users/branch-staff?branchId=${selectedBranchId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "success" && data.data) {
            setGroomersList(data.data.filter(staff => staff.role && staff.role.toLowerCase().startsWith('groomer')));
            setDoctorsList(data.data.filter(staff => staff.role && staff.role.toLowerCase().startsWith('doctor')));
          }
        })
        .catch(err => console.error("Error fetching staff:", err));

      if (jwtToken) {
        getSettings(jwtToken, selectedBranchId)
          .then(res => {
            const settingsData = res?.data?.settings || res?.settings || {};
            const daycareRooms = settingsData?.roomsAndCapacity?.daycare?.rooms || [];
            setConfiguredRooms(daycareRooms);
          })
          .catch(err => console.error("Error fetching settings rooms:", err));
      }
    }
  }, [selectedBranchId, jwtToken]);

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

            setBookingDetails(mainBooking);
          }
        })
        .catch(err => console.error("Error loading booking details for edit:", err));
    }
  }, [bookingId, jwtToken]);

  // Match customer with full pet details once both bookingDetails and customer list are ready
  useEffect(() => {
    if (bookingDetails && customers.length > 0) {
      const b = bookingDetails;

      // Extract all selected services from the booking details to populate them in availableServices if they are missing
      const bookingServices = [];
      const addService = (s) => {
        if (!s || !s.id) return;
        const nameStr = s.name || s.serviceName || s.otherServiceName || "Service";
        if (!bookingServices.some(x => String(x.id) === String(s.id))) {
          bookingServices.push({
            id: String(s.id),
            serviceName: nameStr,
            price: Number(s.price) || 0
          });
        }
      };

      (b.appointments || []).forEach(app => {
        (app.pets || []).forEach(pet => {
          const servicesArray = Array.isArray(pet.services) ? pet.services : [];
          servicesArray.forEach(srvItem => {
            if (srvItem.selectedServices && Array.isArray(srvItem.selectedServices)) {
              srvItem.selectedServices.forEach(s => addService(s));
            } else if (srvItem.id) {
              addService(srvItem);
            }
          });
        });
      });

      if (bookingServices.length > 0) {
        setAvailableServices(prev => {
          const updated = [...prev];
          bookingServices.forEach(bs => {
            if (!updated.some(x => String(x.id) === String(bs.id))) {
              updated.push(bs);
            }
          });
          return updated;
        });
      }

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
        const pId = pet.customerPetId || petProfile.petId || petProfile.id || pet.id;
        if (!pId) return;

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
          const hours = Math.floor((pet.durationMinutes || 60) / 60);
          const minutes = (pet.durationMinutes || 60) % 60;

          const formatTime = (timeStr) => {
            if (!timeStr) return "";
            const parts = timeStr.split(':');
            const hr = parseInt(parts[0]);
            const ampm = hr >= 12 ? "PM" : "AM";
            const hr12 = hr % 12 || 12;
            return `${String(hr12).padStart(2, '0')}:${parts[1] || "00"} ${ampm}`;
          };
          const existingBuffer = details[pId].bufferTime;
          const newBuffer = (pet.bufferMinutes !== undefined && pet.bufferMinutes !== null && Number(pet.bufferMinutes) > 0)
            ? String(pet.bufferMinutes)
            : (existingBuffer && existingBuffer !== "0" ? existingBuffer : "0");
          const displaySlotTime = app.startTime && app.endTime ? `${formatTime(app.startTime)} - ${formatTime(app.endTime)}` : "";

          // Robust parsing of flat/nested services
          let selectedServicesIds = [];
          let groomingType = "Services";
          let selectedPackage = "";

          const servicesArray = Array.isArray(pet.services) ? pet.services : [];
          const firstSrv = servicesArray[0] || pet.services || {};

          if (firstSrv.selectedServices && Array.isArray(firstSrv.selectedServices)) {
            // Nested structure
            selectedServicesIds = firstSrv.selectedServices.map(s => typeof s === 'object' && s !== null ? String(s.id || s.serviceId || s.name) : String(s));
            if (firstSrv.serviceType === "Package" || firstSrv.selectedPackage) {
              groomingType = "Package";
              selectedPackage = firstSrv.selectedPackage || firstSrv.id || firstSrv.serviceId || "";
            }
          } else if (pet.services?.selectedServices && Array.isArray(pet.services.selectedServices)) {
            // Root-nested structure
            selectedServicesIds = pet.services.selectedServices.map(s => typeof s === 'object' && s !== null ? String(s.id || s.serviceId || s.name) : String(s));
            if (pet.services.serviceType === "Package" || pet.services.selectedPackage) {
              groomingType = "Package";
              selectedPackage = pet.services.selectedPackage || "";
            }
          } else {
            // Flat array structure
            selectedServicesIds = servicesArray.map(s => String(s.id || s.serviceId || s.name));
            const pkgSrv = servicesArray.find(s => s.serviceType === "Package" || s.type === "Package" || s.selectedPackage);
            if (pkgSrv) {
              groomingType = "Package";
              selectedPackage = pkgSrv.selectedPackage || pkgSrv.id || pkgSrv.serviceId || "";
            }
          }

          Object.assign(details[pId], {
            groomingType,
            selectedPackage,
            selectedServices: selectedServicesIds,
            assignedGroomer: app.groomerID || "",
            appointmentDate: app.appointmentDate || "",
            selectedSlotId: app.slotId || "",
            selectedTime: displaySlotTime,
            startTime: app.startTime || "",
            endTime: app.endTime || "",
            unassigned: app.isUnassigned || false,
            hours: String(hours),
            minutes: String(minutes),
            bufferTime: newBuffer,
            petConditionNotes: pet.petConditionNotes || "Mild skin allergies."
          });
        } else if (type === "Clinic") {
          const formatTime = (timeStr) => {
            if (!timeStr) return "";
            const parts = timeStr.split(':');
            const hr = parseInt(parts[0]);
            const ampm = hr >= 12 ? "PM" : "AM";
            const hr12 = hr % 12 || 12;
            return `${String(hr12).padStart(2, '0')}:${parts[1] || "00"} ${ampm}`;
          };
          const displayClinicSlotTime = app.startTime && app.endTime ? `${formatTime(app.startTime)} - ${formatTime(app.endTime)}` : (app.appointmentTime || "");

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
            clinicSymptoms: app.symptoms || "",
            clinicSelectedTime: displayClinicSlotTime,
            clinicStartTime: app.startTime || app.appointmentTime || "",
            clinicEndTime: app.endTime || "",
            clinicSelectedSlotId: app.slotId || "",
            clinicUnassigned: app.isUnassigned || false
          });
        } else if (type === "Day Care") {
          const dcDateObj = app.dates?.[0] || {};
          const format12Time = (timeStr) => {
            if (!timeStr) return "09:00 AM";
            const parts = timeStr.split(":");
            let hr = parseInt(parts[0]);
            const ampm = hr >= 12 ? "PM" : "AM";
            hr = hr % 12 || 12;
            return `${String(hr).padStart(2, "0")}:${parts[1] || "00"} ${ampm}`;
          };

          const checkin12 = format12Time(dcDateObj.checkInTime || app.checkinTime);
          const checkout12 = format12Time(dcDateObj.checkOutTime || app.checkoutTime);
          const isFoodYes = app.foodProviding === true || app.foodProviding === "Yes" || app.foodProviding === "true";
          const fetchedAddonNames = (b.addons || []).map(a => a.addonName || a.name || a.addonServiceType).filter(Boolean);

          Object.assign(details[pId], {
            daycareDate: dcDateObj.date || app.appointmentDate || "",
            daycareCheckin: checkin12,
            daycareCheckout: checkout12,
            daycareFood: isFoodYes ? "Yes" : "No",
            daycareRoom: dcDateObj.assignedRoom || app.assignedRoom || "",
            daycareRate: String(dcDateObj.roomRate || app.roomRate || ""),
            daycareAddonServiceType: app.addonServiceType || "Daycare",
            daycareAddonName: app.addonName || "",
            daycareAddonSelected: fetchedAddonNames.length > 0 ? fetchedAddonNames : (app.addonName ? [app.addonName] : []),
            daycareAddonQty: String(fetchedAddonNames.length || app.addonQty || "0")
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
      }
      setDiscountPercentInput(b.discountAmount ? String(Math.round(parseFloat(b.discountAmount))) : "");
      setDiscountToggled(parseFloat(b.discountAmount) > 0);
      setPaidAmount(String(Math.round(parseFloat(b.paidAmount))));
      setRoundOffToggled(true);
    }
  }, [bookingDetails, customers]);

  // Service Details State (mapping pet index/id to state object)
  const [petServiceDetails, setPetServiceDetails] = useState({});
  const [petSlotsData, setPetSlotsData] = useState({});
  const [petClinicSlotsData, setPetClinicSlotsData] = useState({});

  const [taxToggled, setTaxToggled] = useState(false);
  const [discountToggled, setDiscountToggled] = useState(false);
  const [taxPercentInput, setTaxPercentInput] = useState("0");
  const [discountPercentInput, setDiscountPercentInput] = useState("");
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

  const handleServicesChange = (petId, serviceIds) => {
    const ids = serviceIds || [];
    const selectedServicesData = availableServices.filter(s =>
      ids.some(id => String(id) === String(s.id || s._id || s.serviceId || s.serviceName))
    );

    let totalDuration = selectedServicesData.reduce((sum, s) => {
      const d = Number(s.duration || s.durationMinutes || s.timeTaken || 60) || 60;
      return sum + d;
    }, 0);

    if (totalDuration === 0 && ids.length > 0) {
      totalDuration = ids.length * 60;
    }

    const calculatedHours = ids.length > 0 ? String(Math.floor(totalDuration / 60)) : "";
    const calculatedMinutes = ids.length > 0 ? String(totalDuration % 60) : "";

    const hasApiBufferTime = selectedServicesData.some(s => s.bufferTime !== undefined && s.bufferTime !== null && s.bufferTime !== "");
    const apiBufferTime = hasApiBufferTime ? String(selectedServicesData.reduce((sum, s) => sum + (Number(s.bufferTime) || 0), 0)) : "";

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
          hours: calculatedHours,
          minutes: calculatedMinutes,
          bufferTime: hasApiBufferTime ? apiBufferTime : (currentState.bufferTime || "0")
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
    if (availableServices.length > 0 && selectedPets.length > 0) {
      setPetServiceDetails(prev => {
        let updated = false;
        const nextState = { ...prev };
        selectedPets.forEach((pet, idx) => {
          const petId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
          const petState = nextState[petId];
          if (petState && petState.selectedServices && petState.selectedServices.length > 0) {
            const selectedServicesData = availableServices.filter(s =>
              petState.selectedServices.some(id => String(id) === String(s.id || s._id || s.serviceId || s.serviceName))
            );
            if (selectedServicesData.length > 0) {
              let totalDuration = selectedServicesData.reduce((sum, s) => {
                const d = Number(s.duration || s.durationMinutes || s.timeTaken || 60) || 60;
                return sum + d;
              }, 0);
              const calculatedHours = String(Math.floor(totalDuration / 60));
              const calculatedMinutes = String(totalDuration % 60);
              const calculatedServiceBuffer = String(selectedServicesData.reduce((sum, s) => sum + (Number(s.bufferTime) || Number(s.bufferMinutes) || 0), 0));
              const finalBuffer = (petState.bufferTime && petState.bufferTime !== "0") ? petState.bufferTime : calculatedServiceBuffer;

              if (petState.hours !== calculatedHours || petState.minutes !== calculatedMinutes || petState.bufferTime !== finalBuffer) {
                nextState[petId] = {
                  ...petState,
                  hours: calculatedHours,
                  minutes: calculatedMinutes,
                  bufferTime: finalBuffer
                };
                updated = true;
              }
            }
          }
        });
        return updated ? nextState : prev;
      });
    }
  }, [availableServices, selectedPets]);


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

  useEffect(() => {
    selectedPets.forEach((pet, idx) => {
      const petId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
      const petState = petServiceDetails[petId];
      if (petState && petState.clinicAppointmentDate && petState.clinicDoctor && !petState.clinicUnassigned) {
        const cacheKey = `${petState.clinicAppointmentDate}_${petState.clinicDoctor}`;
        if (!petClinicSlotsData[petId] || petClinicSlotsData[petId].cacheKey !== cacheKey) {
          fetch(`${VENDOR_API_URL}branch-clinics/slots/branch/${selectedBranchId}?date=${petState.clinicAppointmentDate}&doctorId=${petState.clinicDoctor}`, {
            headers: {
              "Authorization": `Bearer ${jwtToken}`
            }
          })
            .then(res => res.json())
            .then(data => {
              if (data.status === "success" && data.data) {
                setPetClinicSlotsData(prev => ({
                  ...prev,
                  [petId]: { cacheKey, slots: data.data }
                }));
              }
            })
            .catch(err => console.error("Error fetching clinic slots", err));
        }
      }
    });
  }, [petServiceDetails, selectedPets, selectedBranchId, petClinicSlotsData, jwtToken]);

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
      })(),
      clinicBookingType: "In-Store",
      clinicAppointmentDate: (() => {
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
        })(),
        clinicBookingType: "In-Store",
        clinicAppointmentDate: (() => {
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
        if (!pState.selectedSlotId && !pState.startTime && !pState.selectedTime) return true;
        const slots = petSlotsData[pId]?.slots || [];
        const slot = slots.find(s =>
          (pState.selectedSlotId && String(s.slotID) === String(pState.selectedSlotId)) ||
          (pState.startTime && s.startTime && s.startTime.substring(0, 5) === pState.startTime.substring(0, 5))
        );
        const isOwnSlot = (slot && pState.selectedSlotId && String(slot.slotID) === String(pState.selectedSlotId)) ||
          (slot && pState.startTime && slot.startTime && slot.startTime.substring(0, 5) === pState.startTime.substring(0, 5)) ||
          !!bookingDetails;
        if (slot && slot.status === 'Full' && !isOwnSlot) return true;
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
          const durationInMinutes = (parseInt(petState.hours || 0) * 60) + parseInt(petState.minutes || 0);
          const bufferInMinutes = parseInt(petState.bufferTime || 0);

          const petEntry = {
            petName: pet.petName || pet.rawDetails?.petName || "",
            petType: pet.petType || pet.rawDetails?.petType || "Dog",
            breed: pet.breed || pet.rawDetails?.breed || "",
            gender: pet.gender || pet.petGender || pet.rawDetails?.petGender || "Male",
            petSize: pet.size || pet.rawDetails?.size || "Medium",
            approximateAge: pet.approximateAge || pet.age || pet.rawDetails?.age || "1Y 0M",
            durationMinutes: durationInMinutes > 0 ? durationInMinutes : 60,
            bufferMinutes: bufferInMinutes,
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
                isUnassigned: petState.clinicUnassigned || false,
                slotId: petState.clinicSelectedSlotId ? parseInt(petState.clinicSelectedSlotId) : undefined,
                consultationType: petState.clinicConsultationType || "New Consultation",
                consultationCategory: petState.clinicConsultationReason || "General Checkup",
                appointmentDate: petState.clinicAppointmentDate || firstPetState.appointmentDate || "2026-07-22",
                startTime: petState.clinicStartTime || petState.clinicAppointmentTime || "10:30:00",
                endTime: petState.clinicEndTime || "11:00:00",
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
            return petState.serviceType && (petState.serviceType.includes("Day Care") || petState.serviceType.includes("DayCare"));
          });
          if (daycarePets.length === 0) return undefined;

          const petNames = daycarePets.map(p => p.petName || p.rawDetails?.petName || "");
          const firstDaycareState = petServiceDetails[daycarePets[0].id || daycarePets[0].vendorCustomerPetId || daycarePets[0].petId || 0] || {};

          const format24 = (timeStr) => {
            if (!timeStr) return "09:00:00";
            if (timeStr.includes("AM") || timeStr.includes("PM")) {
              return convertTimeTo24h(timeStr);
            }
            return timeStr;
          };

          const datesArray = [
            {
              date: firstDaycareState.daycareDate || firstPetState.appointmentDate || getTodayDateString(),
              checkInTime: format24(firstDaycareState.daycareCheckin || "09:00 AM"),
              checkOutTime: format24(firstDaycareState.daycareCheckout || "06:00 PM"),
              assignedRoom: firstDaycareState.daycareRoom || "Standard Room 01",
              roomRate: parseFloat(firstDaycareState.daycareRate) || 1500.00
            }
          ];

          const addonsArray = [];
          daycarePets.forEach(pet => {
            const pId = pet.id || pet.vendorCustomerPetId || pet.petId;
            const pState = petServiceDetails[pId] || {};
            const selectedAddonIds = pState.daycareAddonSelected || [];
            selectedAddonIds.forEach(id => {
              const foundSrv = availableServices.find(s => String(s.id) === String(id));
              const addonName = foundSrv ? (Array.isArray(foundSrv.serviceName) ? foundSrv.serviceName.join(", ") : (foundSrv.serviceName || foundSrv.name)) : String(id);
              const addonPrice = foundSrv ? (Number(foundSrv.price) || 0) : 250;
              const addonCat = foundSrv ? (foundSrv.category || foundSrv.serviceCategory || foundSrv.type || "") : "";
              addonsArray.push({
                serviceType: addonCat.toLowerCase().includes("grooming") ? "Grooming" : "DayCare",
                addonName: addonName,
                price: addonPrice,
                quantity: 1
              });
            });
          });

          const isFoodProvided = firstDaycareState.daycareFood === "Yes" || firstDaycareState.daycareFood === true;

          return {
            foodProviding: isFoodProvided,
            instructions: firstDaycareState.instructions || "Daycare stay for pets",
            pets: petNames,
            dates: datesArray,
            addons: addonsArray
          };
        };

        const buildGroomingEntries = () => {
          const entries = [];
          finalSelectedPets.forEach((pet, idx) => {
            const petId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
            const petState = petServiceDetails[petId] || {};
            const isGrooming = !petState.serviceType || petState.serviceType.length === 0 || petState.serviceType.includes("Grooming");

            if (isGrooming) {
              const petEntry = buildGroomingPetEntry(pet, idx);
              entries.push({
                slotId: petState.selectedSlotId ? parseInt(petState.selectedSlotId) : undefined,
                groomerID: petState.assignedGroomer ? parseInt(petState.assignedGroomer) : 145,
                appointmentDate: petState.appointmentDate || getTodayDateString(),
                startTime: petState.startTime || "09:00:00",
                endTime: petState.endTime || "10:00:00",
                agreementType: "Grooming",
                pets: [petEntry]
              });
            }
          });
          return entries;
        };

        const clinicEntries = buildClinicEntries();
        const daycareObj = buildDaycareObject();
        const groomingEntries = buildGroomingEntries();

        const formattedServiceType = (() => {
          const types = activeServiceTypes.map(t => (t === "Day Care" || t === "DayCare") ? "DayCare" : t);
          return types.length === 1 ? types[0] : types;
        })();

        const petsArray = finalSelectedPets.map(pet => ({
          petName: pet.petName || pet.rawDetails?.petName || "",
          petType: pet.petType || pet.rawDetails?.petType || "Dog",
          breed: pet.breed || pet.rawDetails?.breed || "",
          gender: pet.gender || pet.petGender || pet.rawDetails?.petGender || "Male",
          petSize: pet.size || pet.rawDetails?.size || "Medium",
          approximateAge: pet.approximateAge || pet.age || pet.rawDetails?.age || "1Y 0M",
          ...(pet.id && !String(pet.id).startsWith("temp_") ? { customerPetId: pet.id } : {})
        }));

        let payload;
        if (bookingId) {
          payload = {
            status: "Booked",
            paymentStatus: paymentStatus,
            grooming: groomingEntries,
            subTotal: baseTotal,
            discountAmount: discountAmount,
            taxAmount: taxAmount,
            totalAmount: finalTotal,
            paidAmount: parsedPaidAmount,
            paymentMethod: "Cash"
          };
          if (clinicEntries.length > 0) payload.clinic = clinicEntries;
          if (daycareObj) payload.daycare = daycareObj;
        } else {
          payload = {
            branchId: parseInt(selectedBranchId),
            serviceType: formattedServiceType,
            bookingSource: "Walk-in",
            bookingMode: firstPetState.bookingMode || "AtStore",
            notes: firstPetState.notes || "Booking appointment",
            createdBy: userInfo?.userId || userInfo?.id || userInfo?._id || 1,
            pets: petsArray,
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

          if (groomingEntries.length > 0) {
            payload.grooming = groomingEntries;
          }

          if (clinicEntries.length > 0) {
            payload.clinic = clinicEntries;
          }

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
                        {(() => {
                          const petsList = selectedCustomer ? (selectedCustomer.pets || selectedCustomer.customerPets || []) : [];
                          const listItems = petsList.map(pet => ({
                            id: String(pet.id || pet.vendorCustomerPetId || pet.petId),
                            name: pet.petName || pet.name || 'Unnamed Pet'
                          }));
                          const selectedIds = selectedPets.map(pet => String(pet.id || pet.vendorCustomerPetId || pet.petId));
                          const handlePetSelectionChange = (ids) => {
                            const matchedBackendPets = petsList.filter(pet => {
                              const petId = String(pet.id || pet.vendorCustomerPetId || pet.petId);
                              return ids.includes(petId);
                            });
                            const localPets = selectedPets.filter(pet => pet.isNewLocally);
                            setSelectedPets([...matchedBackendPets, ...localPets]);
                          };
                          return (
                            <MultiSelectDropdown
                              heading=""
                              listItems={listItems}
                              selectedIds={selectedIds}
                              setSelectedIds={handlePetSelectionChange}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>First Name</label>
                      <input type="text" className={styles.input} placeholder="Enter your first name here" value={newCustomerDetails.firstName} onChange={e => setNewCustomerDetails({ ...newCustomerDetails, firstName: e.target.value })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Last Name</label>
                      <input type="text" className={styles.input} placeholder="Enter your last name here" value={newCustomerDetails.lastName} onChange={e => setNewCustomerDetails({ ...newCustomerDetails, lastName: e.target.value })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Gender</label>
                      <select className={styles.select} value={newCustomerDetails.gender || ""} onChange={e => setNewCustomerDetails({ ...newCustomerDetails, gender: e.target.value })}>
                        <option value="">Select Your Gender here</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Mobile Number</label>
                      <input type="text" className={styles.input} placeholder="Enter your number here" value={newCustomerDetails.mobileNumber} onChange={e => setNewCustomerDetails({ ...newCustomerDetails, mobileNumber: e.target.value })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email Id <span style={{ fontSize: '0.75rem', color: '#888' }}>(optional)</span></label>
                      <input type="email" className={styles.input} placeholder="Enter your id here" value={newCustomerDetails.email} onChange={e => setNewCustomerDetails({ ...newCustomerDetails, email: e.target.value })} />
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
                          <button className={styles.petPillRemove} onClick={() => setSelectedPets(selectedPets.filter(sp => sp !== pet))}>{"\u00D7"}</button>
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
                      <input type="text" className={styles.input} placeholder="Enter pet name" value={newPetDetails.petName} onChange={e => setNewPetDetails({ ...newPetDetails, petName: e.target.value })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Type</label>
                      <select className={styles.select} value={newPetDetails.petType} onChange={e => setNewPetDetails({ ...newPetDetails, petType: e.target.value, breed: '' })}>
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
                      <select className={styles.select} value={newPetDetails.breed} onChange={e => setNewPetDetails({ ...newPetDetails, breed: e.target.value })}>
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
                      <select className={styles.select} value={newPetDetails.petGender} onChange={e => setNewPetDetails({ ...newPetDetails, petGender: e.target.value })}>
                        <option value="">Choose pet gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Size</label>
                      <select className={styles.select} value={newPetDetails.size} onChange={e => setNewPetDetails({ ...newPetDetails, size: e.target.value })}>
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
                        <input type="radio" checked={newPetDetails.ageType === 'approx'} onChange={() => setNewPetDetails({ ...newPetDetails, ageType: 'approx' })} />
                        Approximate Age
                      </label>
                      {newPetDetails.ageType === 'approx' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                          <div>
                            <label className={styles.label}>Years</label>
                            <input type="number" min="0" className={styles.input} placeholder="0" value={newPetDetails.years} onChange={e => setNewPetDetails({ ...newPetDetails, years: e.target.value, age: `${e.target.value || 0}Y ${newPetDetails.months || 0}M` })} />
                          </div>
                          <div>
                            <label className={styles.label}>Months</label>
                            <input type="number" min="0" max="11" className={styles.input} placeholder="0" value={newPetDetails.months} onChange={e => setNewPetDetails({ ...newPetDetails, months: e.target.value, age: `${newPetDetails.years || 0}Y ${e.target.value || 0}M` })} />
                          </div>
                        </div>
                      )}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                        <input type="radio" checked={newPetDetails.ageType === 'exact'} onChange={() => setNewPetDetails({ ...newPetDetails, ageType: 'exact' })} />
                        Exact Age
                      </label>
                      {newPetDetails.ageType === 'exact' && (
                        <div style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', maxWidth: '300px' }}>
                          <label className={styles.label}>Date of Birth</label>
                          <input type="date" className={styles.input} value={newPetDetails.dateOfBirth} onChange={e => setNewPetDetails({ ...newPetDetails, dateOfBirth: e.target.value, age: e.target.value })} />
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
                                  <Image src="https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png" unoptimized width={32} height={32} className={styles.avatar} alt="Avatar" />
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
                                  updatePetState(petId, 'appointmentDate', val);
                                }}
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

                                  const isOwnBookedSlot = (slot.slotID && petState.selectedSlotId && String(slot.slotID) === String(petState.selectedSlotId)) ||
                                    (petState.startTime && slot.startTime && petState.startTime.substring(0, 5) === slot.startTime.substring(0, 5)) ||
                                    (petState.selectedTime && formattedTime && petState.selectedTime === formattedTime);
                                  const isFull = (slot.status === 'Full' || slot.bookedCount >= slot.capacity) && !isOwnBookedSlot;
                                  const isSelected = isOwnBookedSlot;

                                  // Check if selected by another pet in this session
                                  const isOccupiedByOther = selectedPets.some((otherPet, otherIdx) => {
                                    const otherPetId = otherPet.id || otherPet.vendorCustomerPetId || otherPet.petId || otherIdx;
                                    if (String(otherPetId) === String(petId)) return false;
                                    const otherState = petServiceDetails[otherPetId] || petServiceDetails[String(otherPetId)] || petServiceDetails[otherIdx];
                                    if (!otherState) return false;
                                    return otherState.appointmentDate === petState.appointmentDate &&
                                      String(otherState.assignedGroomer) === String(petState.assignedGroomer) &&
                                      !otherState.unassigned &&
                                      (
                                        (slot.slotID && otherState.selectedSlotId ? String(otherState.selectedSlotId) === String(slot.slotID) : false) ||
                                        (otherState.startTime && slot.startTime ? otherState.startTime.substring(0, 5) === slot.startTime.substring(0, 5) : false) ||
                                        (otherState.selectedTime && formattedTime ? otherState.selectedTime === formattedTime : false)
                                      );
                                  });

                                  let buttonStyle = {};
                                  if (!isSelected && (isFull || isOccupiedByOther)) {
                                    buttonStyle = { borderColor: '#d1d5db', color: '#6b7280', backgroundColor: '#e5e7eb', cursor: 'not-allowed' };
                                  }

                                  return (
                                    <button
                                      key={slot.slotID}
                                      className={`${styles.timeBtn} ${isSelected ? styles.timeBtnActive : ""}`}
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
                                    if (String(otherPetId) === String(petId)) return false;
                                    const otherState = petServiceDetails[otherPetId] || petServiceDetails[String(otherPetId)] || petServiceDetails[otherIdx];
                                    if (!otherState) return false;
                                    return otherState.appointmentDate === petState.appointmentDate &&
                                      String(otherState.assignedGroomer) === String(petState.assignedGroomer) &&
                                      !otherState.unassigned &&
                                      (otherState.startTime === startTime || otherState.selectedTime === time);
                                  });

                                  const isSelected = petState.selectedTime === time || (petState.startTime && startTime && petState.startTime.substring(0, 5) === startTime.substring(0, 5));

                                  let buttonStyle = {};
                                  if (!isSelected && isOccupiedByOther) {
                                    buttonStyle = { borderColor: '#d1d5db', color: '#6b7280', backgroundColor: '#e5e7eb', cursor: 'not-allowed' };
                                  }

                                  return (
                                    <button
                                      key={time}
                                      className={`${styles.timeBtn} ${isSelected ? styles.timeBtnActive : ""}`}
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

                            {(() => {
                              const groomingServicesList = availableServices.filter(s => {
                                const cat = (s.category || s.serviceCategory || s.type || "").toLowerCase();
                                return !cat || cat === "grooming" || cat === "grooming services";
                              });

                              const servicesForDropdown = groomingServicesList.map(s => {
                                const nameStr = Array.isArray(s.serviceName) ? s.serviceName.join(", ") : (s.serviceName || s.name || "Service");
                                return {
                                  id: String(s.id || s._id || s.serviceId || nameStr),
                                  name: nameStr
                                };
                              });

                              const packagesForDropdown = availablePackages;

                              return (
                                <>
                                  {petState.groomingType === "Services" && (
                                    <div className={styles.formGroup} style={{ maxWidth: '650px' }}>
                                      <label className={styles.label}>Grooming Services <span style={{ color: '#888', fontSize: '0.75rem' }}>(Multiple Selections)</span></label>
                                      <MultiSelectDropdown
                                        heading="Choose your services here"
                                        listItems={servicesForDropdown}
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
                                          {packagesForDropdown.map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>
                                              {pkg.serviceName || pkg.packageName} ({currencySymbol} {pkg.discountPrice !== undefined && pkg.discountPrice !== null ? pkg.discountPrice : pkg.price})
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className={styles.formGroup}>
                                        <MultiSelectDropdown
                                          heading="Choose your services here"
                                          listItems={servicesForDropdown}
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
                                          {packagesForDropdown.map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>
                                              {pkg.serviceName || pkg.packageName} ({currencySymbol} {pkg.discountPrice !== undefined && pkg.discountPrice !== null ? pkg.discountPrice : pkg.price})
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className={styles.formGroup}>
                                        <MultiSelectDropdown
                                          heading="Choose your services here"
                                          listItems={servicesForDropdown}
                                          selectedIds={petState.selectedServices || []}
                                          setSelectedIds={(ids) => handleServicesChange(petId, ids)}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
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
                                <input
                                  type="text"
                                  className={styles.input}
                                  placeholder="Enter Mins here"
                                  value={petState.bufferTime !== undefined && petState.bufferTime !== null ? String(petState.bufferTime) : ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) {
                                      updatePetState(petId, 'bufferTime', val);
                                    }
                                  }}
                                />
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
                              <label className={styles.label}>Booking Type</label>
                              <select
                                className={styles.select}
                                value={petState.clinicBookingType || "In-Store"}
                                onChange={(e) => updatePetState(petId, 'clinicBookingType', e.target.value)}
                              >
                                {/* <option value="Online">Online</option> */}
                                <option value="In-Store">In-Store</option>
                                <option value="Home-visit">Home-visit</option>
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Appointment Date</label>
                              <input
                                type="date"
                                className={styles.input}
                                value={petState.clinicAppointmentDate || ""}
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
                                  updatePetState(petId, 'clinicAppointmentDate', val);
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ marginBottom: '1.5rem' }}>
                            <label className={styles.label} style={{ display: 'block', marginBottom: '1rem' }}>Assigned Doctor for the service</label>
                            <div className={styles.groomerGrid}>
                              {doctorsList.length > 0 ? doctorsList.map(d => (
                                <div
                                  key={d.userId}
                                  className={`${styles.groomerChip} ${petState.clinicDoctor === d.userId && !petState.clinicUnassigned ? styles.groomerChipActive : ""}`}
                                  onClick={() => {
                                    updatePetState(petId, 'clinicDoctor', d.userId);
                                    updatePetState(petId, 'clinicUnassigned', false);
                                  }}
                                >
                                  <Image src="https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png" unoptimized width={32} height={32} className={styles.avatar} alt="Avatar" />
                                  {d.staffName}
                                </div>
                              )) : <div style={{ color: '#888', fontSize: '14px', fontStyle: 'italic' }}>No doctors found for this branch.</div>}
                            </div>
                            <label className={styles.checkboxLabel}>
                              <input type="checkbox" checked={petState.clinicUnassigned || false} onChange={(e) => updatePetState(petId, 'clinicUnassigned', e.target.checked)} />
                              Mark it as unassigned
                            </label>
                          </div>

                          <div style={{ marginBottom: '2rem' }}>
                            <label className={styles.label} style={{ display: 'block', marginBottom: '1rem' }}>Select Appointment Time Slots</label>
                            {(() => {
                              const selectedDoc = doctorsList.find(d => String(d.userId) === String(petState.clinicDoctor));
                              const docName = selectedDoc ? selectedDoc.staffName : "Selected Doctor";

                              if (petClinicSlotsData[petId]?.slots) {
                                const slots = petClinicSlotsData[petId].slots;

                                if (slots.length === 0) {
                                  return (
                                    <div style={{ color: '#e9315d', fontWeight: '600', padding: '1rem', border: '1px dashed #e9315d', borderRadius: '8px', backgroundColor: '#fff5f7' }}>
                                      Doctor {docName} is not available on selected date
                                    </div>
                                  );
                                }

                                const allBooked = slots.every(slot => {
                                  const isOwnBookedSlot = (slot.slotID && petState.clinicSelectedSlotId && String(slot.slotID) === String(petState.clinicSelectedSlotId)) ||
                                    (petState.clinicStartTime && slot.startTime && petState.clinicStartTime.substring(0, 5) === slot.startTime.substring(0, 5)) ||
                                    (petState.clinicSelectedTime && slot.startTime && petState.clinicSelectedTime.includes(slot.startTime.substring(0, 5)));
                                  return (slot.status === 'Full' || slot.bookedCount >= slot.capacity) && !isOwnBookedSlot;
                                });

                                if (allBooked) {
                                  return (
                                    <div style={{ color: '#e9315d', fontWeight: '600', padding: '1rem', border: '1px dashed #e9315d', borderRadius: '8px', backgroundColor: '#fff5f7' }}>
                                      All slots are booked on selected date for {docName}. Please change the date
                                    </div>
                                  );
                                }

                                return (
                                  <div className={styles.timeGrid}>
                                    {slots.map(slot => {
                                      const [h, m] = slot.startTime.split(':');
                                      const isPM = parseInt(h) >= 12;
                                      const displayH = (parseInt(h) % 12) || 12;
                                      const formattedTime = `${String(displayH).padStart(2, '0')}:${m} ${isPM ? 'PM' : 'AM'}`;

                                      const isOwnBookedSlot = (slot.slotID && petState.clinicSelectedSlotId && String(slot.slotID) === String(petState.clinicSelectedSlotId)) ||
                                        (petState.clinicStartTime && slot.startTime && petState.clinicStartTime.substring(0, 5) === slot.startTime.substring(0, 5)) ||
                                        (petState.clinicSelectedTime && formattedTime && petState.clinicSelectedTime === formattedTime);
                                      const isFull = (slot.status === 'Full' || slot.bookedCount >= slot.capacity) && !isOwnBookedSlot;
                                      const isSelected = isOwnBookedSlot;

                                      const isOccupiedByOther = selectedPets.some((otherPet, otherIdx) => {
                                        const otherPetId = otherPet.id || otherPet.vendorCustomerPetId || otherPet.petId || otherIdx;
                                        if (String(otherPetId) === String(petId)) return false;
                                        const otherState = petServiceDetails[otherPetId] || petServiceDetails[String(otherPetId)] || petServiceDetails[otherIdx];
                                        if (!otherState) return false;
                                        return otherState.clinicAppointmentDate === petState.clinicAppointmentDate &&
                                          String(otherState.clinicDoctor) === String(petState.clinicDoctor) &&
                                          !otherState.clinicUnassigned &&
                                          (
                                            (slot.slotID && otherState.clinicSelectedSlotId ? String(otherState.clinicSelectedSlotId) === String(slot.slotID) : false) ||
                                            (otherState.clinicStartTime && slot.startTime ? otherState.clinicStartTime.substring(0, 5) === slot.startTime.substring(0, 5) : false) ||
                                            (otherState.clinicSelectedTime && formattedTime ? otherState.clinicSelectedTime === formattedTime : false)
                                          );
                                      });

                                      let buttonStyle = {};
                                      if (!isSelected && (isFull || isOccupiedByOther)) {
                                        buttonStyle = { borderColor: '#d1d5db', color: '#6b7280', backgroundColor: '#e5e7eb', cursor: 'not-allowed' };
                                      }

                                      return (
                                        <button
                                          key={slot.slotID}
                                          className={`${styles.timeBtn} ${isSelected ? styles.timeBtnActive : ""}`}
                                          style={buttonStyle}
                                          disabled={isFull || isOccupiedByOther}
                                          onClick={() => {
                                            if (!isFull && !isOccupiedByOther) {
                                              updatePetState(petId, 'clinicSelectedTime', formattedTime);
                                              updatePetState(petId, 'clinicSelectedSlotId', slot.slotID);
                                              updatePetState(petId, 'clinicStartTime', slot.startTime);
                                              updatePetState(petId, 'clinicEndTime', slot.endTime);
                                            }
                                          }}
                                        >
                                          {formattedTime}
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              }

                              // Fallback / Initial State: Show static slot list (or date prompt)
                              if (!petState.clinicAppointmentDate || !petState.clinicDoctor || petState.clinicUnassigned) {
                                return (
                                  <div style={{ color: '#888', fontStyle: 'italic', fontSize: '14px', padding: '0.5rem' }}>
                                    Please select a Doctor and Appointment Date to view available slots.
                                  </div>
                                );
                              }

                              return (
                                <div className={styles.timeGrid}>
                                  {timeSlots.map(time => {
                                    const startTime = convertTimeTo24h(time);

                                    const isOccupiedByOther = selectedPets.some((otherPet, otherIdx) => {
                                      const otherPetId = otherPet.id || otherPet.vendorCustomerPetId || otherPet.petId || otherIdx;
                                      if (String(otherPetId) === String(petId)) return false;
                                      const otherState = petServiceDetails[otherPetId] || petServiceDetails[String(otherPetId)] || petServiceDetails[otherIdx];
                                      if (!otherState) return false;
                                      return otherState.clinicAppointmentDate === petState.clinicAppointmentDate &&
                                        String(otherState.clinicDoctor) === String(petState.clinicDoctor) &&
                                        !otherState.clinicUnassigned &&
                                        (otherState.clinicStartTime === startTime || otherState.clinicSelectedTime === time);
                                    });

                                    const isSelected = petState.clinicSelectedTime === time || petState.clinicStartTime === startTime;

                                    let buttonStyle = {};
                                    if (!isSelected && isOccupiedByOther) {
                                      buttonStyle = { borderColor: '#d1d5db', color: '#6b7280', backgroundColor: '#e5e7eb', cursor: 'not-allowed' };
                                    }

                                    return (
                                      <button
                                        key={time}
                                        className={`${styles.timeBtn} ${isSelected ? styles.timeBtnActive : ""}`}
                                        style={buttonStyle}
                                        disabled={isOccupiedByOther}
                                        onClick={() => {
                                          if (!isOccupiedByOther) {
                                            updatePetState(petId, 'clinicSelectedTime', time);
                                            updatePetState(petId, 'clinicStartTime', startTime);
                                            const [h, m] = startTime.split(':');
                                            let endM = parseInt(m) + 30;
                                            let endH = parseInt(h);
                                            if (endM >= 60) {
                                              endM -= 60;
                                              endH += 1;
                                            }
                                            const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
                                            updatePetState(petId, 'clinicEndTime', endTime);
                                          }
                                        }}
                                      >
                                        {time}
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>

                          <div className={styles.formGrid} style={{ marginBottom: '1.5rem' }}>
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
                                  updatePetState(petId, 'daycareDate', val);
                                }}
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

                          {(() => {
                            const daycareConfiguredRooms = configuredRooms.length > 0
                              ? configuredRooms
                              : (useStore.getState()?.vendorSettings?.roomsAndCapacity?.daycare?.rooms || []);

                            return (
                              <>
                                <h4 className={styles.label} style={{ display: 'block', marginBottom: '1rem', fontSize: '15px', fontWeight: '600', color: '#555' }}>Room Allocation</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', gap: '1.5rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
                                  <div className={styles.formGroup}>
                                    <label className={styles.label}>Assigned Room</label>
                                    {daycareConfiguredRooms.length > 0 ? (
                                      <select
                                        className={styles.select}
                                        value={petState.daycareRoom || ""}
                                        onChange={(e) => {
                                          const selectedRoomName = e.target.value;
                                          updatePetState(petId, 'daycareRoom', selectedRoomName);

                                          const matchedRoom = daycareConfiguredRooms.find(
                                            r => (r.roomName || r.name) === selectedRoomName
                                          );

                                          if (matchedRoom) {
                                            const isFoodYes = matchedRoom.foodProvided === true || matchedRoom.foodProvided === "Yes" || matchedRoom.foodProvided === "true";
                                            updatePetState(petId, 'daycareFood', isFoodYes ? "Yes" : "No");

                                            if (matchedRoom.price !== undefined && matchedRoom.price !== null) {
                                              updatePetState(petId, 'daycareRate', String(matchedRoom.price));
                                            }
                                          }
                                        }}
                                      >
                                        <option value="">Select here</option>
                                        {daycareConfiguredRooms.map((r, idx) => {
                                          const roomLabel = r.roomName || r.name || `Room ${idx + 1}`;
                                          return (
                                            <option key={r.id || idx} value={roomLabel}>
                                              {roomLabel}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    ) : (
                                      <button
                                        type="button"
                                        style={{
                                          height: '42px',
                                          border: '1px dashed #e9315d',
                                          borderRadius: '6px',
                                          color: '#e9315d',
                                          background: 'none',
                                          padding: '0 1rem',
                                          cursor: 'pointer',
                                          fontWeight: '600',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '100%'
                                        }}
                                        onClick={() => {
                                          router.push("/vendor-settings?tab=RoomsCapacity&addRoom=true");
                                        }}
                                      >
                                        + Add Room
                                      </button>
                                    )}
                                  </div>
                                  <div className={styles.formGroup}>
                                    <label className={styles.label}>Food Providing</label>
                                    <select
                                      className={styles.select}
                                      value={petState.daycareFood || ""}
                                      disabled
                                      style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed', color: '#333' }}
                                    >
                                      <option value="">Select food</option>
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                    </select>
                                  </div>
                                  <div className={styles.formGroup}>
                                    <label className={styles.label}>Room Rate</label>
                                    <input
                                      type="text"
                                      className={styles.input}
                                      placeholder="Enter rate"
                                      value={petState.daycareRate || ""}
                                      onChange={(e) => updatePetState(petId, 'daycareRate', e.target.value)}
                                    />
                                  </div>
                                  <button
                                    className={styles.iconBtn}
                                    style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path></svg>
                                  </button>
                                </div>
                              </>
                            );
                          })()}

                          <h4 className={styles.label} style={{ display: 'block', marginBottom: '1rem', fontSize: '15px', fontWeight: '600', color: '#555' }}>Addon's</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', gap: '1.5rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Service Type</label>
                              <select
                                className={styles.select}
                                value="Daycare"
                                onChange={(e) => {
                                  updatePetState(petId, 'daycareAddonServiceType', "Daycare");
                                }}
                              >
                                <option value="Daycare">Daycare</option>
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              {(() => {
                                const daycareCategoryServices = availableServices.filter(s => {
                                  const cat = (s.category || s.serviceCategory || s.type || "").toLowerCase();
                                  return cat === "daycare" || cat === "day care";
                                });
                                const baseList = daycareCategoryServices.map(s => {
                                   const nameStr = s.serviceName || s.name || "";
                                   return { id: nameStr || String(s.id), name: nameStr };
                                 });

                                const selectedAddonNames = petState.daycareAddonSelected || [];
                                const extraAddonItems = selectedAddonNames.map(n => ({ id: n, name: n }));

                                const addonListItems = [...baseList];
                                extraAddonItems.forEach(item => {
                                  if (!addonListItems.some(x => String(x.id) === String(item.id))) {
                                    addonListItems.push(item);
                                  }
                                });

                                return (
                                  <MultiSelectDropdown
                                    heading="Addon's"
                                    listItems={addonListItems}
                                    selectedIds={petState.daycareAddonSelected || []}
                                    setSelectedIds={(ids) => {
                                      updatePetState(petId, 'daycareAddonSelected', ids);
                                      updatePetState(petId, 'daycareAddonQty', String(ids.length));
                                    }}
                                  />
                                );
                              })()}
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Quantity</label>
                              <input
                                type="text"
                                className={styles.input}
                                value={String((petState.daycareAddonSelected || []).length)}
                                readOnly
                                style={{ backgroundColor: '#f9fafb', cursor: 'default', textAlign: 'center' }}
                              />
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
          const getTodayDateString = () => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          };

          let baseTotal = 0;

          const petSummaryList = (selectedPets.length > 0 ? selectedPets : [{ petName: 'VICTORIA' }]).map((pet, idx) => {
            const petId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
            const petState = petServiceDetails[petId] || {};
            const serviceTypes = (petState.serviceType && petState.serviceType.length > 0) ? petState.serviceType : ["Grooming"];

            let petGroomingTotal = 0;
            let petClinicTotal = 0;
            let petDaycareTotal = 0;

            const groomingServices = [];
            if (serviceTypes.includes("Grooming")) {
              if (petState.groomingType === "Package" && petState.selectedPackage) {
                const pkg = availablePackages.find(p => p.id === petState.selectedPackage);
                if (pkg) {
                  const price = Number(pkg.discountPrice !== undefined && pkg.discountPrice !== null ? pkg.discountPrice : pkg.price) || 0;
                  groomingServices.push({ serviceName: pkg.serviceName || pkg.packageName || "Package", price });
                  petGroomingTotal += price;
                }
              }
              if (petState.selectedServices) {
                petState.selectedServices.forEach(sId => {
                  const service = availableServices.find(s => s.id === sId);
                  if (service) {
                    const pkg = petState.selectedPackage ? availablePackages.find(p => p.id === petState.selectedPackage) : null;
                    const isIncludedInPkg = pkg && pkg.services?.filter(Boolean).includes(sId);
                    const price = isIncludedInPkg ? 0 : (Number(service.price) || 0);
                    groomingServices.push({ serviceName: Array.isArray(service.serviceName) ? service.serviceName.join(", ") : service.serviceName, price, isIncludedInPkg });
                    petGroomingTotal += price;
                  }
                });
              }
            }

            const clinicServices = [];
            if (serviceTypes.includes("Clinic")) {
              clinicServices.push({ serviceName: petState.clinicConsultationReason || "General Checkup", price: 500 });
              petClinicTotal += 500;
            }

            let daycareRoomPrice = 0;
            let daycareAddonPrice = 0;
            if (serviceTypes.includes("Day Care")) {
              daycareRoomPrice = Number(petState.daycareRate) || 0;
              daycareAddonPrice = (petState.daycareAddonSelected || []).reduce((sum, id) => {
                const service = availableServices.find(s => String(s.id) === String(id) || s.serviceName === id || s.name === id);
                const price = service ? Number(service.discountPrice !== undefined && service.discountPrice !== null ? service.discountPrice : service.price) : 0;
                return sum + (isNaN(price) ? 0 : price);
              }, 0);
              petDaycareTotal = daycareRoomPrice + daycareAddonPrice;
            }

            const petTotal = petGroomingTotal + petClinicTotal + petDaycareTotal;
            baseTotal += petTotal;

            return {
              pet,
              petId,
              petState,
              serviceTypes,
              groomingServices,
              petGroomingTotal,
              clinicServices,
              petClinicTotal,
              daycareRoomPrice,
              daycareAddonPrice,
              petDaycareTotal,
              petTotal
            };
          });

          const taxPercent = taxToggled ? (parseFloat(taxPercentInput) || 0) : 0;
          const taxAmount = Math.round(baseTotal * taxPercent / 100);
          const afterTaxTotal = baseTotal + taxAmount;

          const discountAmount = discountToggled ? (parseFloat(discountPercentInput) || 0) : 0;
          const unroundedTotal = Math.max(0, afterTaxTotal - discountAmount);

          const finalTotal = roundOffToggled ? Math.round(unroundedTotal) : unroundedTotal;
          const roundOffValue = (finalTotal - unroundedTotal).toFixed(2);
          const parsedPaidAmount = parseFloat(paidAmount) || 0;
          const pendingAmount = Math.max(0, finalTotal - parsedPaidAmount);

          return (
            <div>
              {/* Top Container */}
              <div style={{ border: '1px solid #eaeaea', borderRadius: '12px', padding: '1.5rem', backgroundColor: '#fff', marginBottom: '2rem' }}>
                {/* Customer Details Top Card */}
                <div className={styles.summaryCard} style={{ marginBottom: '1.5rem', width: '100%' }}>
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

                {/* 2-Column Grid for Pet One and Pet Two Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
                  {/* Column 1: Pet One Details & Services & Costs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {petSummaryList[0] && (() => {
                      const item = petSummaryList[0];
                      const { pet, petState, serviceTypes } = item;
                      const firstGroomer = groomersList.find(g => g.userId === petState.assignedGroomer);
                      const firstDoctor = doctorsList.find(d => d.userId === petState.clinicDoctor);

                      return (
                        <>
                          <div className={styles.summaryCard}>
                            <h4 className={styles.summaryTitle}>Pet One Details</h4>
                            <div className={styles.petAvatarWrapper}>
                              <Image src={pet.photo || "https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png"} width={40} height={40} alt="Pet" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                              <span className={styles.summaryValue}>{(pet.petName || 'Unnamed').toUpperCase()}</span>
                            </div>
                          </div>

                          {/* Grooming Block: Wrapped in a distinct bordered container */}
                          {serviceTypes.includes("Grooming") && (
                            <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                              <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5' }}></span>
                                Grooming Service
                              </div>
                              <div className={styles.summaryCard}>
                                <h4 className={styles.summaryTitle}>Grooming Details</h4>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{petState.appointmentDate || getTodayDateString()}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Time</span><span className={styles.summaryValue}>{petState.selectedTime || "9:00 AM"}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Booking Type</span><span className={styles.summaryValue}>{petState.bookingMode || "In House Grooming"}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Type</span><span className={styles.summaryValue}>{petState.groomingType === "Package" ? "Package" : "Service"}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Groomer</span><span className={styles.summaryValue}>{firstGroomer ? firstGroomer.staffName : "Unassigned"}</span></div>
                              </div>
                              <div className={styles.summaryCard}>
                                <h4 className={styles.summaryTitle}>Grooming Cost Details</h4>
                                {item.groomingServices.map((gItem, gIdx) => (
                                  <div key={gIdx} className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>{gItem.serviceName}</span>
                                    <span className={styles.summaryValue}>{gItem.isIncludedInPkg ? "" : `${currencySymbol} ${gItem.price}`}</span>
                                  </div>
                                ))}
                                <div className={styles.summaryRow}>
                                  <span className={styles.summaryLabel}>Total Amount</span>
                                  <span className={styles.summaryValue}>{currencySymbol} {item.petGroomingTotal}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Daycare Block: Wrapped in a distinct bordered container */}
                          {serviceTypes.includes("Day Care") && (() => {
                            const daycareAddonNames = (petState.daycareAddonSelected || []).map(id => {
                              const found = availableServices.find(s => String(s.id) === String(id) || s.serviceName === id || s.name === id);
                              return found ? (found.serviceName || found.name) : id;
                            });

                            return (
                              <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0891b2' }}></span>
                                  Daycare Service
                                </div>
                                <div className={styles.summaryCard}>
                                  <h4 className={styles.summaryTitle}>Daycare Details</h4>
                                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{petState.daycareDate || getTodayDateString()}</span></div>
                                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Check In / Check Out Time</span><span className={styles.summaryValue}>{`${petState.daycareCheckin || "07:00 AM"} - ${petState.daycareCheckout || "05:00 PM"}`}</span></div>
                                </div>
                                <div className={styles.summaryCard}>
                                  <h4 className={styles.summaryTitle}>Room Allocation Details</h4>
                                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Food Providing</span><span className={styles.summaryValue}>{petState.daycareFood || "No"}</span></div>
                                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Room</span><span className={styles.summaryValue}>{petState.daycareRoom || "N/A"}</span></div>
                                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Room Rate</span><span className={styles.summaryValue}>{currencySymbol} {petState.daycareRate || "0"}</span></div>
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
                                    <span className={styles.summaryValue}>{currencySymbol} {item.daycareRoomPrice}</span>
                                  </div>
                                  <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Food</span>
                                    <span className={styles.summaryValue}>{currencySymbol} 0</span>
                                  </div>
                                  <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Addon's</span>
                                    <span className={styles.summaryValue}>{currencySymbol} {item.daycareAddonPrice}</span>
                                  </div>
                                  <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Total Amount</span>
                                    <span className={styles.summaryValue}>{currencySymbol} {item.petDaycareTotal}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Clinic Block: Wrapped in a distinct bordered container */}
                          {serviceTypes.includes("Clinic") && (
                            <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                              <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }}></span>
                                Clinic Service
                              </div>
                              <div className={styles.summaryCard}>
                                <h4 className={styles.summaryTitle}>Clinic Details</h4>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{petState.clinicAppointmentDate || getTodayDateString()}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Time</span><span className={styles.summaryValue}>{petState.clinicAppointmentTime || "9:00 AM"}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Booking Type</span><span className={styles.summaryValue}>{petState.clinicBookingType || "In-Store"}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Type of Consultation</span><span className={styles.summaryValue}>{petState.clinicConsultationReason || "General Checkup"}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Doctor</span><span className={styles.summaryValue}>{firstDoctor ? firstDoctor.staffName : "Unassigned"}</span></div>
                              </div>
                              <div className={styles.summaryCard}>
                                <h4 className={styles.summaryTitle}>Clinic Cost Details</h4>
                                {item.clinicServices.map((cItem, cIdx) => (
                                  <div key={cIdx} className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>{cItem.serviceName}</span>
                                    <span className={styles.summaryValue}>{currencySymbol} {cItem.price}</span>
                                  </div>
                                ))}
                                <div className={styles.summaryRow}>
                                  <span className={styles.summaryLabel}>Total Amount</span>
                                  <span className={styles.summaryValue}>{currencySymbol} {item.petClinicTotal}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Column 2: Pet Two Details & Services & Costs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {petSummaryList[1] && (() => {
                      const item = petSummaryList[1];
                      const { pet, petState, serviceTypes } = item;
                      const firstGroomer = groomersList.find(g => g.userId === petState.assignedGroomer);
                      const firstDoctor = doctorsList.find(d => d.userId === petState.clinicDoctor);

                      return (
                        <>
                          <div className={styles.summaryCard}>
                            <h4 className={styles.summaryTitle}>Pet Two Details</h4>
                            <div className={styles.petAvatarWrapper}>
                              <Image src={pet.photo || "https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png"} width={40} height={40} alt="Pet" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                              <span className={styles.summaryValue}>{(pet.petName || 'Unnamed').toUpperCase()}</span>
                            </div>
                          </div>

                          {/* Grooming Block: Wrapped in a distinct bordered container */}
                          {serviceTypes.includes("Grooming") && (
                            <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                              <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5' }}></span>
                                Grooming Service
                              </div>
                              <div className={styles.summaryCard}>
                                <h4 className={styles.summaryTitle}>Grooming Details</h4>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{petState.appointmentDate || getTodayDateString()}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Time</span><span className={styles.summaryValue}>{petState.selectedTime || "9:00 AM"}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Booking Type</span><span className={styles.summaryValue}>{petState.bookingMode || "In House Grooming"}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Type</span><span className={styles.summaryValue}>{petState.groomingType === "Package" ? "Package" : "Service"}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Groomer</span><span className={styles.summaryValue}>{firstGroomer ? firstGroomer.staffName : "Unassigned"}</span></div>
                              </div>
                              <div className={styles.summaryCard}>
                                <h4 className={styles.summaryTitle}>Grooming Cost Details</h4>
                                {item.groomingServices.map((gItem, gIdx) => (
                                  <div key={gIdx} className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>{gItem.serviceName}</span>
                                    <span className={styles.summaryValue}>{gItem.isIncludedInPkg ? "" : `${currencySymbol} ${gItem.price}`}</span>
                                  </div>
                                ))}
                                <div className={styles.summaryRow}>
                                  <span className={styles.summaryLabel}>Total Amount</span>
                                  <span className={styles.summaryValue}>{currencySymbol} {item.petGroomingTotal}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Daycare Block: Wrapped in a distinct bordered container */}
                          {serviceTypes.includes("Day Care") && (() => {
                            const daycareAddonNames = (petState.daycareAddonSelected || []).map(id => {
                              const found = availableServices.find(s => String(s.id) === String(id) || s.serviceName === id || s.name === id);
                              return found ? (found.serviceName || found.name) : id;
                            });

                            return (
                              <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0891b2' }}></span>
                                  Daycare Service
                                </div>
                                <div className={styles.summaryCard}>
                                  <h4 className={styles.summaryTitle}>Daycare Details</h4>
                                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{petState.daycareDate || getTodayDateString()}</span></div>
                                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Check In / Check Out Time</span><span className={styles.summaryValue}>{`${petState.daycareCheckin || "07:00 AM"} - ${petState.daycareCheckout || "05:00 PM"}`}</span></div>
                                </div>
                                <div className={styles.summaryCard}>
                                  <h4 className={styles.summaryTitle}>Room Allocation Details</h4>
                                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Food Providing</span><span className={styles.summaryValue}>{petState.daycareFood || "No"}</span></div>
                                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Room</span><span className={styles.summaryValue}>{petState.daycareRoom || "N/A"}</span></div>
                                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>Room Rate</span><span className={styles.summaryValue}>{currencySymbol} {petState.daycareRate || "0"}</span></div>
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
                                    <span className={styles.summaryValue}>{currencySymbol} {item.daycareRoomPrice}</span>
                                  </div>
                                  <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Food</span>
                                    <span className={styles.summaryValue}>{currencySymbol} 0</span>
                                  </div>
                                  <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Addon's</span>
                                    <span className={styles.summaryValue}>{currencySymbol} {item.daycareAddonPrice}</span>
                                  </div>
                                  <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Total Amount</span>
                                    <span className={styles.summaryValue}>{currencySymbol} {item.petDaycareTotal}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Clinic Block: Wrapped in a distinct bordered container */}
                          {serviceTypes.includes("Clinic") && (
                            <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                              <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }}></span>
                                Clinic Service
                              </div>
                              <div className={styles.summaryCard}>
                                <h4 className={styles.summaryTitle}>Clinic Details</h4>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>{petState.clinicAppointmentDate || getTodayDateString()}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Time</span><span className={styles.summaryValue}>{petState.clinicAppointmentTime || "9:00 AM"}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Booking Type</span><span className={styles.summaryValue}>{petState.clinicBookingType || "In-Store"}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Type of Consultation</span><span className={styles.summaryValue}>{petState.clinicConsultationReason || "General Checkup"}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Doctor</span><span className={styles.summaryValue}>{firstDoctor ? firstDoctor.staffName : "Unassigned"}</span></div>
                              </div>
                              <div className={styles.summaryCard}>
                                <h4 className={styles.summaryTitle}>Clinic Cost Details</h4>
                                {item.clinicServices.map((cItem, cIdx) => (
                                  <div key={cIdx} className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>{cItem.serviceName}</span>
                                    <span className={styles.summaryValue}>{currencySymbol} {cItem.price}</span>
                                  </div>
                                ))}
                                <div className={styles.summaryRow}>
                                  <span className={styles.summaryLabel}>Total Amount</span>
                                  <span className={styles.summaryValue}>{currencySymbol} {item.petClinicTotal}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Bottom Container */}
              <div style={{ border: '1px solid #eaeaea', borderRadius: '12px', padding: '1.5rem', backgroundColor: '#fff' }}>
                <div className={styles.summaryGrid} style={{ alignItems: 'flex-start' }}>
                  <div className={styles.paymentSection}>
                    <h4 className={styles.summaryTitle} style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>Payment Details</h4>
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
                      <strong>{currencySymbol} {baseTotal}</strong>
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

                    {taxToggled && (
                      <div className={styles.costRow}>
                        <span className={styles.costLabel} style={{ color: '#6c757d' }}>Tax in %</span>
                        <input
                          type="number"
                          className={styles.costInput}
                          placeholder="0"
                          value={taxPercentInput}
                          onChange={(e) => setTaxPercentInput(e.target.value)}
                        />
                      </div>
                    )}

                    <div className={styles.costRow}>
                      <span className={styles.costLabel} style={{ color: '#6c757d' }}>After Tax Total Amount</span>
                      <strong>{currencySymbol} {afterTaxTotal}</strong>
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

                    {discountToggled && (
                      <div className={styles.costRow}>
                        <span className={styles.costLabel} style={{ color: '#6c757d' }}>Discount Amount</span>
                        <input
                          type="number"
                          className={styles.costInput}
                          placeholder="0"
                          value={discountPercentInput}
                          onChange={(e) => setDiscountPercentInput(e.target.value)}
                        />
                      </div>
                    )}

                    <div className={styles.costRow}>
                      <span className={styles.costLabel} style={{ color: '#6c757d' }}>After Tax & Discount Total Amount</span>
                      <strong>{currencySymbol} {finalTotal}</strong>
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
                      <strong>{currencySymbol} {parsedPaidAmount}</strong>
                    </div>

                    <div className={styles.totalPending}>
                      <span>Total Pending Amount</span>
                      <span>{currencySymbol} {pendingAmount}</span>
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

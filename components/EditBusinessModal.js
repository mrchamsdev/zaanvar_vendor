import React, { useState, useEffect } from "react";
import styles from "../styles/EditBusinessModal.module.css";
import { WebApimanager } from "./utilities/WebApiManager";
import useStore from "./state/useStore";
import { toast } from "sonner";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const PET_OPTIONS = ["Dog", "Cat", "Bird", "Fish", "Rabbit", "Small Pet"];
const CLINIC_SERVICES_OPTIONS = ["General Consultation", "Vaccination", "Deworming", "Dental Care", "Surgery", "Emergency Care", "Diagnostics", "X-Ray"];
const DAYCARE_SERVICES_OPTIONS = ["Playtime", "Meal time", "Grooming touch-up", "Walking", "Interactive Games"];
const PETSHOP_CATEGORIES_OPTIONS = ["Food", "Toys", "Medicines", "Accessories", "Grooming Supplies", "Litter & Hygiene"];

function parseTimingValue(val) {
  if (!val) return { open: "09:00", close: "21:00", closed: false };
  if (typeof val === "string") {
    if (val.toLowerCase() === "closed") return { open: "09:00", close: "21:00", closed: true };
    const parts = val.split("-");
    if (parts.length === 2) {
      return { open: parts[0].trim(), close: parts[1].trim(), closed: false };
    }
  }
  if (typeof val === "object" && val !== null) {
    if (val.closed || val.open === "closed") return { open: "09:00", close: "21:00", closed: true };
    return {
      open: val.open || "09:00",
      close: val.close || "21:00",
      closed: false
    };
  }
  return { open: "09:00", close: "21:00", closed: false };
}

export default function EditBusinessModal({
  open,
  onClose,
  branchData,
  vendorData,
  branchId,
  onSuccess
}) {
  const { jwtToken, userInfo } = useStore();
  const [activeTab, setActiveTab] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // ── Vendor Details State ──
  const [vendor, setVendor] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: ""
  });

  // ── Branch Base Details State ──
  const [branchInfo, setBranchInfo] = useState({
    name: "",
    email: "",
    phone: ""
  });

  // ── Address Details State ──
  const [addressDetails, setAddressDetails] = useState({
    addressText: "",
    flatNo: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    latitude: 18.975,
    longitude: 72.8258
  });

  // ── Timings State ──
  const [timings, setTimings] = useState({
    monday: { open: "09:00", close: "21:00", closed: false },
    tuesday: { open: "09:00", close: "21:00", closed: false },
    wednesday: { open: "09:00", close: "21:00", closed: false },
    thursday: { open: "09:00", close: "21:00", closed: false },
    friday: { open: "09:00", close: "21:00", closed: false },
    saturday: { open: "10:00", close: "18:00", closed: false },
    sunday: { open: "09:00", close: "21:00", closed: true }
  });

  // ── Services State ──
  const [clinicDetails, setClinicDetails] = useState({
    supportedPets: ["Dog", "Cat"],
    servicesOffered: ["General Consultation", "Vaccination"],
    about: ""
  });

  const [daycareDetails, setDaycareDetails] = useState({
    dayCareType: "General",
    consultationFeeAmount: 600,
    consultationFeeCurrency: "INR",
    breedType: ["Dog"],
    services: ["Playtime", "Meal time"]
  });

  const [petShopDetails, setPetShopDetails] = useState({
    categories: ["Food", "Toys", "Medicines"]
  });

  const [groomingDetails, setGroomingDetails] = useState({
    serviceName: "Standard Hair & Bath",
    petType: ["Dog", "Cat"]
  });

  // ── Populate State from Props & Context ──
  useEffect(() => {
    if (!open) return;

    // Populate Vendor
    const vSource = vendorData || userInfo || {};
    const nameParts = (vSource.firstName ? `${vSource.firstName} ${vSource.lastName || ""}` : (vSource.name || vSource.fullName || "")).trim().split(" ");
    setVendor({
      firstName: vSource.firstName || nameParts[0] || "",
      lastName: vSource.lastName || nameParts.slice(1).join(" ") || "",
      email: vSource.email || "",
      phoneNumber: vSource.phoneNumber || vSource.phone || vSource.mobileNumber || ""
    });

    // Populate Branch Info
    const bSource = branchData || {};
    setBranchInfo({
      name: bSource.name || bSource.businessName || bSource.branchName || "",
      email: bSource.email || bSource.branchEmail || vSource.email || "",
      phone: bSource.phone || bSource.branchPhone || vSource.phoneNumber || ""
    });

    // Populate Address
    const addr = bSource.addressDetails || bSource.address || bSource.branchAddress || {};
    setAddressDetails({
      addressText: addr.addressText || addr.address || "",
      flatNo: addr.flatNo || addr.flat || "",
      area: addr.area || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || addr.pinCode || "",
      landmark: addr.landmark || "",
      latitude: parseFloat(addr.latitude) || 18.975,
      longitude: parseFloat(addr.longitude) || 72.8258
    });

    // Populate Timings
    const bTimings = bSource.timings || {};
    const newTimings = {};
    DAYS.forEach((d) => {
      newTimings[d] = parseTimingValue(bTimings[d] || bTimings[d.toLowerCase()]);
    });
    setTimings(newTimings);

    // Populate Services
    const svcs = bSource.services || {};
    if (svcs.clinicDetails) {
      setClinicDetails({
        supportedPets: Array.isArray(svcs.clinicDetails.supportedPets) ? svcs.clinicDetails.supportedPets : (svcs.clinicDetails.petsSupported || ["Dog", "Cat"]),
        servicesOffered: Array.isArray(svcs.clinicDetails.servicesOffered) ? svcs.clinicDetails.servicesOffered : (svcs.clinicDetails.services || ["General Consultation", "Vaccination"]),
        about: svcs.clinicDetails.about || ""
      });
    }

    if (svcs.daycareDetails) {
      setDaycareDetails({
        dayCareType: svcs.daycareDetails.dayCareType || "General",
        consultationFeeAmount: svcs.daycareDetails.consultationFee?.amount ?? 600,
        consultationFeeCurrency: svcs.daycareDetails.consultationFee?.currency || "INR",
        breedType: Array.isArray(svcs.daycareDetails.breedType) ? svcs.daycareDetails.breedType : ["Dog"],
        services: Array.isArray(svcs.daycareDetails.services) ? svcs.daycareDetails.services : ["Playtime", "Meal time"]
      });
    }

    if (svcs.petShopDetails) {
      const rawCats = svcs.petShopDetails.categories;
      let catArray = ["Food", "Toys", "Medicines"];
      if (Array.isArray(rawCats)) {
        catArray = rawCats.map((c) => (typeof c === "object" ? c.name : c));
      }
      setPetShopDetails({ categories: catArray });
    }

    if (svcs.groomingDetails) {
      const sName = Array.isArray(svcs.groomingDetails.serviceName)
        ? svcs.groomingDetails.serviceName.join(", ")
        : (svcs.groomingDetails.serviceName || "Standard Hair & Bath");
      setGroomingDetails({
        serviceName: sName,
        petType: Array.isArray(svcs.groomingDetails.petType) ? svcs.groomingDetails.petType : ["Dog", "Cat"]
      });
    }
  }, [open, branchData, vendorData, userInfo]);

  if (!open) return null;

  // ── Helper to Toggle Tag Selection ──
  const toggleTag = (list, item, setter) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  // ── Form Submit Handler ──
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = jwtToken || (typeof window !== "undefined" ? (localStorage.getItem("jwtToken") || localStorage.getItem("token") || "") : "");
      const webApi = new WebApimanager(token);

      // Build Timings JSON
      const formattedTimings = {};
      DAYS.forEach((d) => {
        const t = timings[d];
        if (t.closed) {
          formattedTimings[d] = "Closed";
        } else {
          formattedTimings[d] = `${t.open} - ${t.close}`;
        }
      });

      const payload = {
        branchId: parseInt(branchId || branchData?.id || 12, 10),
        vendor: {
          firstName: vendor.firstName.trim(),
          lastName: vendor.lastName.trim(),
          email: vendor.email.trim(),
          phoneNumber: vendor.phoneNumber.trim()
        },
        branch: {
          name: branchInfo.name.trim(),
          email: branchInfo.email.trim(),
          phone: branchInfo.phone.trim(),
          timings: formattedTimings,
          addressDetails: {
            addressText: addressDetails.addressText.trim(),
            flatNo: addressDetails.flatNo.trim(),
            area: addressDetails.area.trim(),
            city: addressDetails.city.trim(),
            state: addressDetails.state.trim(),
            pincode: addressDetails.pincode.trim(),
            landmark: addressDetails.landmark.trim(),
            latitude: parseFloat(addressDetails.latitude) || 18.9750,
            longitude: parseFloat(addressDetails.longitude) || 72.8258
          },
          services: {
            clinicDetails: {
              supportedPets: clinicDetails.supportedPets,
              servicesOffered: clinicDetails.servicesOffered,
              about: clinicDetails.about.trim()
            },
            daycareDetails: {
              dayCareType: daycareDetails.dayCareType,
              consultationFee: {
                amount: parseFloat(daycareDetails.consultationFeeAmount) || 0,
                currency: daycareDetails.consultationFeeCurrency || "INR"
              },
              breedType: daycareDetails.breedType,
              services: daycareDetails.services
            },
            petShopDetails: {
              categories: petShopDetails.categories
            },
            groomingDetails: {
              serviceName: groomingDetails.serviceName,
              petType: groomingDetails.petType
            }
          }
        }
      };

      // Call API
      const res = await webApi.put("companies/vendor/edit-all", payload);
      
      toast.success("Business information updated successfully!");
      if (onSuccess) {
        onSuccess(res?.data || res);
      }
      onClose();
    } catch (err) {
      console.error("Failed to update business details:", err);
      toast.error(err?.response?.data?.message || err.message || "Failed to update business details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>
            Edit Business Information
            <span className={styles.headerBadge}>Vendor Profile</span>
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabsBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 0 ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(0)}
          >
            <span className={styles.tabStepNum}>1</span> Vendor Profile
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 1 ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(1)}
          >
            <span className={styles.tabStepNum}>2</span> Branch & Address
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 2 ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(2)}
          >
            <span className={styles.tabStepNum}>3</span> Timings
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 3 ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(3)}
          >
            <span className={styles.tabStepNum}>4</span> Services & Offerings
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* TAB 0: Vendor Profile */}
          {activeTab === 0 && (
            <div>
              <h3 className={styles.sectionTitle}>Vendor Representative Details</h3>
              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    First Name <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={vendor.firstName}
                    onChange={(e) => setVendor({ ...vendor, firstName: e.target.value })}
                    placeholder="Enter first name"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Last Name <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={vendor.lastName}
                    onChange={(e) => setVendor({ ...vendor, lastName: e.target.value })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Email Address <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="email"
                    className={styles.input}
                    value={vendor.email}
                    onChange={(e) => setVendor({ ...vendor, email: e.target.value })}
                    placeholder="name@example.com"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Phone Number <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={vendor.phoneNumber}
                    onChange={(e) => setVendor({ ...vendor, phoneNumber: e.target.value })}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Branch Info & Address */}
          {activeTab === 1 && (
            <div>
              <h3 className={styles.sectionTitle}>Branch Contact Information</h3>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Branch / Clinic Name <span className={styles.req}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={branchInfo.name}
                  onChange={(e) => setBranchInfo({ ...branchInfo, name: e.target.value })}
                  placeholder="Downtown Vet Clinic & Pet Shop"
                />
              </div>
              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Branch Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={branchInfo.email}
                    onChange={(e) => setBranchInfo({ ...branchInfo, email: e.target.value })}
                    placeholder="branch@example.com"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Branch Phone</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={branchInfo.phone}
                    onChange={(e) => setBranchInfo({ ...branchInfo, phone: e.target.value })}
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <h3 className={styles.sectionTitle} style={{ marginTop: 24 }}>
                Address Details
              </h3>
              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Flat / Suite / Shop No.</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addressDetails.flatNo}
                    onChange={(e) => setAddressDetails({ ...addressDetails, flatNo: e.target.value })}
                    placeholder="Suite 400 / Shop 2"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Street / Building Address</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addressDetails.addressText}
                    onChange={(e) => setAddressDetails({ ...addressDetails, addressText: e.target.value })}
                    placeholder="123 Main St, Block B"
                  />
                </div>
              </div>
              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Area / Locality</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addressDetails.area}
                    onChange={(e) => setAddressDetails({ ...addressDetails, area: e.target.value })}
                    placeholder="Fort / Bandra"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>City</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addressDetails.city}
                    onChange={(e) => setAddressDetails({ ...addressDetails, city: e.target.value })}
                    placeholder="Mumbai"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>State</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addressDetails.state}
                    onChange={(e) => setAddressDetails({ ...addressDetails, state: e.target.value })}
                    placeholder="Maharashtra"
                  />
                </div>
              </div>
              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Pincode</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addressDetails.pincode}
                    onChange={(e) => setAddressDetails({ ...addressDetails, pincode: e.target.value })}
                    placeholder="400001"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Landmark</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addressDetails.landmark}
                    onChange={(e) => setAddressDetails({ ...addressDetails, landmark: e.target.value })}
                    placeholder="Opposite Central Station"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Coordinates (Lat, Lng)</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="number"
                      step="any"
                      className={styles.input}
                      value={addressDetails.latitude}
                      onChange={(e) => setAddressDetails({ ...addressDetails, latitude: e.target.value })}
                      placeholder="Latitude"
                    />
                    <input
                      type="number"
                      step="any"
                      className={styles.input}
                      value={addressDetails.longitude}
                      onChange={(e) => setAddressDetails({ ...addressDetails, longitude: e.target.value })}
                      placeholder="Longitude"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Timings */}
          {activeTab === 2 && (
            <div>
              <h3 className={styles.sectionTitle}>Operating Hours (Weekly Timings)</h3>
              {DAYS.map((day) => {
                const t = timings[day];
                return (
                  <div key={day} className={styles.timingRow}>
                    <span className={styles.dayName}>{day}</span>
                    {!t.closed ? (
                      <div className={styles.timeInputs}>
                        <input
                          type="time"
                          className={styles.input}
                          value={t.open}
                          onChange={(e) =>
                            setTimings({
                              ...timings,
                              [day]: { ...t, open: e.target.value }
                            })
                          }
                        />
                        <span style={{ color: "#64748b", fontWeight: 600 }}>to</span>
                        <input
                          type="time"
                          className={styles.input}
                          value={t.close}
                          onChange={(e) =>
                            setTimings({
                              ...timings,
                              [day]: { ...t, close: e.target.value }
                            })
                          }
                        />
                      </div>
                    ) : (
                      <span style={{ color: "#ef4444", fontWeight: 600, fontSize: "0.875rem" }}>
                        Closed
                      </span>
                    )}
                    <label className={styles.closedToggle}>
                      <input
                        type="checkbox"
                        checked={t.closed}
                        onChange={(e) =>
                          setTimings({
                            ...timings,
                            [day]: { ...t, closed: e.target.checked }
                          })
                        }
                      />
                      Mark Closed
                    </label>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Services */}
          {activeTab === 3 && (
            <div>
              {/* Clinic Details */}
              <div className={styles.serviceCard}>
                <div className={styles.serviceCardHeader}>
                  <h4 className={styles.serviceCardTitle}>🏥 Clinic Details</h4>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Supported Pets</label>
                  <div className={styles.tagContainer}>
                    {PET_OPTIONS.map((pet) => (
                      <span
                        key={pet}
                        className={`${styles.tagChip} ${clinicDetails.supportedPets.includes(pet) ? styles.tagChipSelected : ""}`}
                        onClick={() => toggleTag(clinicDetails.supportedPets, pet, (val) => setClinicDetails({ ...clinicDetails, supportedPets: val }))}
                      >
                        {clinicDetails.supportedPets.includes(pet) ? "✓ " : "+ "}{pet}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.fieldGroup} style={{ marginTop: 12 }}>
                  <label className={styles.label}>Services Offered</label>
                  <div className={styles.tagContainer}>
                    {CLINIC_SERVICES_OPTIONS.map((svc) => (
                      <span
                        key={svc}
                        className={`${styles.tagChip} ${clinicDetails.servicesOffered.includes(svc) ? styles.tagChipSelected : ""}`}
                        onClick={() => toggleTag(clinicDetails.servicesOffered, svc, (val) => setClinicDetails({ ...clinicDetails, servicesOffered: val }))}
                      >
                        {clinicDetails.servicesOffered.includes(svc) ? "✓ " : "+ "}{svc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.fieldGroup} style={{ marginTop: 12 }}>
                  <label className={styles.label}>About Clinic</label>
                  <textarea
                    className={styles.textarea}
                    value={clinicDetails.about}
                    onChange={(e) => setClinicDetails({ ...clinicDetails, about: e.target.value })}
                    placeholder="Describe your clinic services..."
                  />
                </div>
              </div>

              {/* Daycare Details */}
              <div className={styles.serviceCard}>
                <div className={styles.serviceCardHeader}>
                  <h4 className={styles.serviceCardTitle}>☀️ Daycare Details</h4>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Daycare Type</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={daycareDetails.dayCareType}
                      onChange={(e) => setDaycareDetails({ ...daycareDetails, dayCareType: e.target.value })}
                      placeholder="General / Premium"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Consultation / Daily Fee (₹)</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={daycareDetails.consultationFeeAmount}
                      onChange={(e) => setDaycareDetails({ ...daycareDetails, consultationFeeAmount: e.target.value })}
                      placeholder="600"
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Breed / Pet Type Supported</label>
                  <div className={styles.tagContainer}>
                    {PET_OPTIONS.map((pet) => (
                      <span
                        key={pet}
                        className={`${styles.tagChip} ${daycareDetails.breedType.includes(pet) ? styles.tagChipSelected : ""}`}
                        onClick={() => toggleTag(daycareDetails.breedType, pet, (val) => setDaycareDetails({ ...daycareDetails, breedType: val }))}
                      >
                        {daycareDetails.breedType.includes(pet) ? "✓ " : "+ "}{pet}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.fieldGroup} style={{ marginTop: 12 }}>
                  <label className={styles.label}>Daycare Services</label>
                  <div className={styles.tagContainer}>
                    {DAYCARE_SERVICES_OPTIONS.map((svc) => (
                      <span
                        key={svc}
                        className={`${styles.tagChip} ${daycareDetails.services.includes(svc) ? styles.tagChipSelected : ""}`}
                        onClick={() => toggleTag(daycareDetails.services, svc, (val) => setDaycareDetails({ ...daycareDetails, services: val }))}
                      >
                        {daycareDetails.services.includes(svc) ? "✓ " : "+ "}{svc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pet Shop Details */}
              <div className={styles.serviceCard}>
                <div className={styles.serviceCardHeader}>
                  <h4 className={styles.serviceCardTitle}>🛍️ Pet Shop Details</h4>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Categories Available</label>
                  <div className={styles.tagContainer}>
                    {PETSHOP_CATEGORIES_OPTIONS.map((cat) => (
                      <span
                        key={cat}
                        className={`${styles.tagChip} ${petShopDetails.categories.includes(cat) ? styles.tagChipSelected : ""}`}
                        onClick={() => toggleTag(petShopDetails.categories, cat, (val) => setPetShopDetails({ ...petShopDetails, categories: val }))}
                      >
                        {petShopDetails.categories.includes(cat) ? "✓ " : "+ "}{cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grooming Details */}
              <div className={styles.serviceCard}>
                <div className={styles.serviceCardHeader}>
                  <h4 className={styles.serviceCardTitle}>✂️ Grooming Details</h4>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Service Package / Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={groomingDetails.serviceName}
                    onChange={(e) => setGroomingDetails({ ...groomingDetails, serviceName: e.target.value })}
                    placeholder="Standard Hair & Bath"
                  />
                </div>
                <div className={styles.fieldGroup} style={{ marginTop: 12 }}>
                  <label className={styles.label}>Grooming Pet Types</label>
                  <div className={styles.tagContainer}>
                    {PET_OPTIONS.map((pet) => (
                      <span
                        key={pet}
                        className={`${styles.tagChip} ${groomingDetails.petType.includes(pet) ? styles.tagChipSelected : ""}`}
                        onClick={() => toggleTag(groomingDetails.petType, pet, (val) => setGroomingDetails({ ...groomingDetails, petType: val }))}
                      >
                        {groomingDetails.petType.includes(pet) ? "✓ " : "+ "}{pet}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <div className={styles.navGroup}>
            {activeTab > 0 && (
              <button className={styles.backBtn} onClick={() => setActiveTab((t) => t - 1)}>
                Back
              </button>
            )}
            {activeTab < 3 ? (
              <button className={styles.submitBtn} onClick={() => setActiveTab((t) => t + 1)}>
                Next
              </button>
            ) : (
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
